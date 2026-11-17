import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { evaluateCandidateForGrpo, filterBarsByDateRange, optimizeParametersOnHistory, runBacktestOnBars, trainStrategyOnHistory } from "./backtest.ts";
import { MAX_DAY_LOSS, MAX_EXPOSURE, MAX_RISK, type Config } from "./config.ts";
import { LiquidityHunterAgent } from "./agents/liquidityHunter.ts";
import { SentinelAgent } from "./agents/sentinel.ts";
import { DeskLeadAgent, PacingCalculator } from "./agents/deskLead.ts";
import { RiskManagerAgent, type HftSizingResult } from "./agents/riskManager.ts";
import { ExecutionTraderAgent } from "./agents/executionTrader.ts";
import { StrategistAgent } from "./agents/strategist.ts";
import { MarketAnalystAgent } from "./agents/analyst.ts";
import { ReviewerAgent } from "./agents/reviewer.ts";
import { MarketProfileAnalyzer } from "./agents/marketProfile.ts";
import { ActiveTradeManager } from "./agents/activeTradeManager.ts";
import { Mt5CloudBridge, type LocalMt5Position, type LocalMt5State } from "./mt5.ts";
import { GrpoEngine, type GrpoCandidateOutcome, type MarketRegime } from "./rl/grpo.ts";
import {
  fmtCompactUsd,
  fmtFunding,
  fmtPct,
  fmtPx,
  fmtR,
  fmtSignedPct,
  fmtSignedUsd,
  fmtUsd,
} from "./format.ts";
import {
  applyAiBoardInstruction,
  DEFAULT_AGENT_PROMPTS,
  generateAgentVoice,
  setRuntimeLlmApiKey,
} from "./llm.ts";
import {
  aggregateKlines,
  computeSessionVwap,
  detectLatestFvg,
  fetchBinanceKlines,
  fetchMarketSnapshot,
  fetchMicrostructureTick,
  fetchYahooKlines,
  symbolName,
  verifySecondSource,
} from "./market.ts";
import { DeskStore, emitPulse, setAgentActivity } from "./store.ts";
import { TelegramFloorRoom } from "./telegram.ts";
import { dayKey, isOvernight, isoWeek, localParts, ticketDay } from "./time.ts";
import type {
  AgentId,
  AgentPromptConfig,
  Backtest,
  Binding,
  CloseReason,
  DeskRuntimeSettings,
  DeskState,
  Direction,
  FomoWebhookPayload,
  LiveTapeRow,
  MacroWebhookPayload,
  MarketProfileSummary,
  MarketSnapshot,
  MessageTone,
  ParameterOptimizationReport,
  PlayKind,
  PostMortemLogEntry,
  SelfReflectionReviewEntry,
  Speaker,
  Ticket,
  WakeKind,
} from "./types.ts";

const PRODUCED_BY: AgentId[] = ["analyst", "strategist", "risk", "lead"];
const PRODUCED_BY_LABEL = "Analyste Recherche, Stratège Quant, Directeur des Risques, Chef de Salle";

export type SizeVerdict =
  | { ok: false; reason: string }
  | {
      ok: true;
      notional: number;
      qty: number;
      riskUsd: number;
      riskPct: number;
      exposurePct: number;
      binding: Binding;
      stopPct: number;
    };

export function markPriceOf(state: DeskState, symbol: string, fallback = 0): number {
  const row = state.tape.find((r) => r.symbol === symbol);
  return row ? row.px : fallback;
}

export function ticketPnlAt(
  ticket: Pick<Ticket, "direction" | "entry" | "fillPrice" | "notional" | "mt5Profit">,
  px: number,
): number {
  if (ticket.mt5Profit !== undefined && Number.isFinite(ticket.mt5Profit)) {
    return ticket.mt5Profit;
  }
  const ref = ticket.fillPrice ?? ticket.entry;
  if (!ref || ref <= 0) return 0;
  const dir = ticket.direction === "long" ? 1 : -1;
  return (dir * (px - ref) * ticket.notional) / ref;
}

export function unrealizedPnl(state: DeskState): number {
  return state.tickets
    .filter((t) => t.status === "open")
    .reduce(
      (sum, t) =>
        sum +
        (t.mt5Profit !== undefined && Number.isFinite(t.mt5Profit)
          ? t.mt5Profit
          : ticketPnlAt(t, markPriceOf(state, t.asset, t.mt5CurrentPrice ?? t.fillPrice ?? t.entry))),
      0,
    );
}

export function currentEquity(state: DeskState): number {
  return state.startEquity + state.realizedPnl + unrealizedPnl(state);
}

export function grossExposureUsd(state: DeskState): number {
  return state.tickets.filter((t) => t.status === "open").reduce((sum, t) => sum + t.notional, 0);
}

export function currentDayPnl(state: DeskState): number {
  return currentEquity(state) - state.dayStartEquity;
}

/**
 * Sizing dynamique du Risk Manager (Critère de Kelly fractionné plafonné entre 0.5% et 3.0% max selon le DSR Out-Of-Sample).
 * Plafonds absolus : max 3% risque/trade, max 10% exposition brute totale, max 5% perte journalière.
 */
export interface SocialPostInput {
  author: string;
  authority?: number;
  text: string;
  likes?: number;
  retweets?: number;
  timestamp?: number;
}

export class SocialSentimentEngine {
  private readonly samples = new Map<
    string,
    {
      score: number;
      velocity: number;
      mentions: number;
      weightedSum: number;
      weightTotal: number;
      authoritySum: number;
      cashtags: Set<string>;
      timestamps: number[];
      updatedAt: number;
    }
  >();

  private static readonly BULLISH_TERMS = new Set([
    "bull",
    "bullish",
    "long",
    "breakout",
    "pump",
    "moon",
    "surge",
    "rally",
    "accumulate",
    "buy",
    "ath",
    "inflow",
    "squeeze",
    "support",
    "reclaim",
  ]);

  private static readonly BEARISH_TERMS = new Set([
    "bear",
    "bearish",
    "short",
    "dump",
    "crash",
    "liquidation",
    "cascade",
    "rug",
    "sell",
    "outflow",
    "rejection",
    "breakdown",
    "resistance",
    "fear",
    "overleveraged",
  ]);

  private extractTickers(text: string): string[] {
    const found = new Set<string>();
    const cashMatches = text.match(/\$([A-Za-z]{2,10})\b/g) ?? [];
    for (const m of cashMatches) {
      const sym = m.slice(1).toUpperCase();
      found.add(sym.endsWith("USDT") ? sym : `${sym}USDT`);
    }
    const common = /\b(BTC|ETH|SOL|XRP|BNB|AVAX|DOGE|LINK|ADA|DOT)\b/gi;
    let match: RegExpExecArray | null;
    while ((match = common.exec(text)) !== null) {
      found.add(`${match[1].toUpperCase()}USDT`);
    }
    return [...found];
  }

  private scorePostText(text: string): number {
    const tokens = text.toLowerCase().replace(/[^a-z0-9$\s]/g, " ").split(/\s+/).filter(Boolean);
    let pos = 0;
    let neg = 0;
    for (const tok of tokens) {
      if (SocialSentimentEngine.BULLISH_TERMS.has(tok)) pos += 1;
      if (SocialSentimentEngine.BEARISH_TERMS.has(tok)) neg += 1;
    }
    if (pos + neg === 0) return 0;
    return Math.max(-1, Math.min(1, (pos - neg) / (pos + neg)));
  }

  ingestPosts(posts: SocialPostInput[], now = Date.now()): void {
    const windowMs = 3600_000;
    for (const post of posts) {
      const ts = post.timestamp ?? now;
      if (now - ts > 6 * windowMs) continue;
      const tickers = this.extractTickers(post.text);
      if (!tickers.length) continue;
      const rawTone = this.scorePostText(post.text);
      const engagement = Math.max(0, (post.likes ?? 0) + (post.retweets ?? 0) * 2);
      const authority = Math.max(0.25, Math.min(5.0, post.authority ?? 1.0));
      const weight = (1 + Math.log1p(engagement)) * authority;

      for (const sym of tickers) {
        const cur = this.samples.get(sym) ?? {
          score: 0,
          velocity: 0,
          mentions: 0,
          weightedSum: 0,
          weightTotal: 0,
          authoritySum: 0,
          cashtags: new Set<string>(),
          timestamps: [],
          updatedAt: now,
        };
        cur.weightedSum = cur.weightedSum * 0.92 + rawTone * weight;
        cur.weightTotal = cur.weightTotal * 0.92 + weight;
        cur.authoritySum = cur.authoritySum * 0.92 + authority;
        cur.cashtags.add(`$${sym.replace("USDT", "")}`);
        cur.score = Math.max(-1, Math.min(1, cur.weightTotal > 0 ? cur.weightedSum / cur.weightTotal : 0));
        cur.timestamps = cur.timestamps.filter((t) => now - t <= windowMs);
        cur.timestamps.push(ts);
        cur.mentions = cur.timestamps.length;
        cur.velocity = Number((cur.mentions / 60).toFixed(3));
        cur.updatedAt = now;
        this.samples.set(sym, cur);
      }
    }
  }

  async pollFeeds(symbols: string[], snaps: MarketSnapshot[], now = Date.now()): Promise<Record<string, number>> {
    const posts: SocialPostInput[] = [];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1600);
      const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN", {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const body = (await res.json()) as { Data?: Array<{ title?: string; body?: string; source?: string; upvotes?: string }> };
        for (const item of (body.Data ?? []).slice(0, 15)) {
          posts.push({
            author: item.source ?? "CryptoCompareFeed",
            authority: 1.5,
            text: `${item.title ?? ""} ${(item.body ?? "").slice(0, 180)}`,
            likes: Number(item.upvotes ?? 3) || 3,
            retweets: 1,
            timestamp: now,
          });
        }
      }
    } catch {
      // Network feed optional; market telemetry fallback below preserves continuity
    }

    for (const snap of snaps) {
      if (!symbols.includes(snap.symbol) || !snap.primary) continue;
      const base = snap.symbol.replace("USDT", "");
      const ret1h = snap.primary.ret1h ?? 0;
      const book = snap.primary.book ?? 0;
      const funding = snap.primary.funding ?? 0;
      if (Math.abs(ret1h) > 0.002 || Math.abs(book) > 0.15) {
        const biasWord = ret1h >= 0 ? "bullish breakout inflow" : "bearish breakdown outflow";
        const crowdWord = funding > 0.0006 ? "overleveraged squeeze" : funding < -0.0005 ? "accumulate reclaim" : "support";
        posts.push({
          author: "OrderFlowStream",
          authority: 1.2,
          text: `$${base} ${biasWord} ${crowdWord}`,
          likes: Math.round(Math.abs(ret1h) * 1500),
          retweets: Math.round(Math.abs(book) * 10),
          timestamp: now,
        });
      }
    }

    if (posts.length) {
      this.ingestPosts(posts, now);
    }
    return this.getScoresMap();
  }

  getScore(symbol: string): number {
    return this.samples.get(symbol)?.score ?? 0;
  }

  getScoresMap(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of this.samples.entries()) {
      out[k] = Number(v.score.toFixed(4));
    }
    return out;
  }

  getSamplesSnapshot(): Record<
    string,
    {
      symbol: string;
      score: number;
      velocity: number;
      mentions: number;
      cashtags: string[];
      authorityWeight: number;
      updatedAt: number;
    }
  > {
    const out: Record<
      string,
      {
        symbol: string;
        score: number;
        velocity: number;
        mentions: number;
        cashtags: string[];
        authorityWeight: number;
        updatedAt: number;
      }
    > = {};
    for (const [k, v] of this.samples.entries()) {
      out[k] = {
        symbol: k,
        score: Number(v.score.toFixed(4)),
        velocity: v.velocity,
        mentions: v.mentions,
        cashtags: [...v.cashtags],
        authorityWeight: Number(Math.min(5, Math.max(0.25, v.authoritySum || 1)).toFixed(2)),
        updatedAt: v.updatedAt,
      };
    }
    return out;
  }
}

export interface LeveragedSizingOptions {
  side?: Direction;
  leverageFactor?: number;
  maintenanceMarginRate?: number;
  takerFee?: number;
  expectedSlippage?: number;
  autoReduceLeverage?: boolean;
  riskPctOverride?: number;
  playbook?: PlayKind;
  targetFiatProfit?: number;
  atr1m?: number;
}

export interface LeveragedSizingResult {
  ok: boolean;
  reason?: string;
  notional?: number;
  qty?: number;
  riskUsd?: number;
  riskCapital?: number;
  riskPct?: number;
  exposurePct?: number;
  binding?: Binding;
  stopPct?: number;
  leverage?: number;
  liqPrice?: number;
}

export function pipSizeForAsset(asset: string, entryPrice: number): number {
  const a = String(asset || "").toUpperCase();
  if (a.includes("JPY")) return 0.01;
  if (a.startsWith("XAU")) return 0.1;
  if (a.startsWith("XAG")) return 0.01;
  if (/^(EUR|GBP|USD|AUD|NZD|CAD|CHF){2}/.test(a)) return 0.0001;
  return Math.max(0.0001, entryPrice * 0.001);
}

export function computeLeveragedSizing(
  state: DeskState,
  entryPrice: number,
  stopLossPrice: number,
  backtest?: Backtest,
  options: LeveragedSizingOptions = {},
): LeveragedSizingResult {
  const maxRisk = options.riskPctOverride ?? state.settings?.maxRiskPct ?? MAX_RISK;
  const maxExp = state.settings?.maxExposurePct ?? MAX_EXPOSURE;
  const maxDayLoss = state.settings?.maxDayLossPct ?? MAX_DAY_LOSS;
  const isScalp = Boolean(state.settings?.autoPaperScalp) || state.settings?.executionMode === "auto";
  const side: Direction = options.side ?? (stopLossPrice <= entryPrice ? "long" : "short");
  const maintenanceMarginRate = options.maintenanceMarginRate ?? state.settings?.maintenanceMarginRate ?? 0.005;
  const requestedLev = Math.max(1, Math.min(500, Math.round(options.leverageFactor ?? state.settings?.defaultLeverage ?? 1)));
  const stopMin =
    requestedLev >= 25
      ? 0.0002
      : isScalp
        ? Math.min(state.settings?.stopMinPct ?? 0.004, 0.001)
        : (state.settings?.stopMinPct ?? 0.004);
  const stopMax = state.settings?.stopMaxPct ?? 0.25;

  const rMode = state.settings?.riskMode ?? "pct";
  const slMode = state.settings?.slMode ?? "atr";
  const isAmountMode = rMode === "amount" || slMode === "amount";

  const priceStopDistance = Math.abs(entryPrice - stopLossPrice) / Math.max(entryPrice, 1e-9);
  if (!isAmountMode && (priceStopDistance < stopMin || priceStopDistance > stopMax)) {
    return {
      ok: false,
      reason: `Distance du stop (${fmtPct(priceStopDistance, 2)}) hors bornes autorisées (${fmtPct(stopMin, 2)} – ${fmtPct(stopMax, 0)}). Veto du Directeur des Risques.`,
    };
  }
  if (state.halted) {
    return {
      ok: false,
      reason:
        state.haltKind === "loss"
          ? `Veto : limite de perte journalière (-${fmtPct(maxDayLoss, 1)}) atteinte. Le desk reste à plat jusqu'à la prochaine session.`
          : "Veto : le desk est en arrêt (Halt). Aucun nouveau risque n'est autorisé.",
    };
  }

  const eq = currentEquity(state);
  const gross = grossExposureUsd(state);
  const marginUsed = state.tickets
    .filter((t) => t.status === "open")
    .reduce((sum, t) => sum + t.notional / Math.max(1, t.leverage ?? 1), 0);
  const availableMargin = Math.max(0, eq - marginUsed);

  // REVERSE-ENGINEERED SIZING FOR HFT FIAT-TARGET (KAMIKAZE) STRATEGY
  const isKamikazeRegime = options.playbook === "HFT_Kamikaze_FiatTarget" || state.settings?.regime === "hft_kamikaze";
  if (isKamikazeRegime) {
    const targetFiat = options.targetFiatProfit ?? 75;
    const atr1m = options.atr1m ?? (priceStopDistance * entryPrice);
    const hftSizing = RiskManagerAgent.reverseEngineerHftSizing(
      entryPrice,
      atr1m,
      targetFiat,
      side,
      500,
      availableMargin,
    );
    if (hftSizing.ok && hftSizing.requiredNotional > 0) {
      // Garde-fou frais HFT : limite le notionnel pour éviter que les frais aller-retour (0.08%) ne dépassent ~35% de la cible de gain
      const maxFeeSafeNotional = Math.max(15_000, (targetFiat * 0.35) / 0.0008);
      const safeNotional = Math.min(hftSizing.requiredNotional, maxFeeSafeNotional);
      const safeQty = entryPrice > 0 ? Number((safeNotional / entryPrice).toFixed(6)) : hftSizing.lotSize;
      const safeMargin = safeNotional / Math.max(1, hftSizing.leverage);
      return {
        ok: true,
        notional: safeNotional,
        qty: safeQty,
        riskUsd: hftSizing.targetFiatProfit,
        riskCapital: Number(safeMargin.toFixed(2)),
        riskPct: safeMargin / Math.max(eq, 1),
        exposurePct: safeNotional / Math.max(eq, 1),
        binding: "risk",
        stopPct: hftSizing.expectedPriceMovePct,
        leverage: hftSizing.leverage,
        liqPrice: hftSizing.liquidationPrice,
      };
    }
  }

  const autoReduce = options.autoReduceLeverage ?? true;
  const effectiveMmr = (lev: number): number => Math.min(maintenanceMarginRate, (1 / lev) * 0.35);

  const computeLiqPrice = (lev: number): number => {
    const mmr = effectiveMmr(lev);
    return side === "long"
      ? entryPrice * (1 - 1 / lev + mmr)
      : entryPrice * (1 + 1 / lev - mmr);
  };

  const isStopSafeFromLiq = (lev: number): boolean => {
    const liq = computeLiqPrice(lev);
    const liqDistance = Math.abs(entryPrice - liq);
    if (liqDistance <= 1e-9) return false;
    if (side === "long") {
      if (stopLossPrice <= liq) return false;
      return (stopLossPrice - liq) / liqDistance >= 0.15;
    }
    if (stopLossPrice >= liq) return false;
    return (liq - stopLossPrice) / liqDistance >= 0.15;
  };

  let effectiveLev = requestedLev;
  if (!isStopSafeFromLiq(effectiveLev)) {
    if (!autoReduce) {
      const badLiq = computeLiqPrice(effectiveLev);
      return {
        ok: false,
        reason: `HARD VETO Liquidation Guard : Stop (${fmtPx(stopLossPrice)}) au-delà ou à <15% du prix de liquidation (${fmtPx(badLiq)} à ${effectiveLev}x).`,
        liqPrice: badLiq,
        leverage: effectiveLev,
      };
    }
    while (effectiveLev > 1 && !isStopSafeFromLiq(effectiveLev)) {
      effectiveLev -= 1;
    }
    if (!isStopSafeFromLiq(effectiveLev)) {
      const badLiq = computeLiqPrice(effectiveLev);
      return {
        ok: false,
        reason: `HARD VETO Liquidation Guard : Stop (${fmtPx(stopLossPrice)}) dangereux vs liquidation (${fmtPx(badLiq)}) même à 1x.`,
        liqPrice: badLiq,
        leverage: effectiveLev,
      };
    }
  }
  const liqPrice = computeLiqPrice(effectiveLev);

  const dayMode = state.settings?.maxDayLossMode ?? "pct";
  const dayLimitUsd =
    dayMode === "amount" && (state.settings?.maxDayLossVal ?? 0) > 0
      ? Number(state.settings!.maxDayLossVal)
      : state.dayStartEquity * maxDayLoss;
  const remainingDayBudget = dayLimitUsd + currentDayPnl(state);
  if (remainingDayBudget <= 0) {
    return {
      ok: false,
      reason: `Veto : budget de perte journalière (${fmtPct(maxDayLoss, 1)}) épuisé.`,
    };
  }

  let riskPct = maxRisk;
  if (backtest) {
    const oos = backtest.outOfSample;
    const dsr = oos.deflatedSharpe ?? backtest.deflatedSharpe ?? 0.5;
    const p = Math.min(0.85, Math.max(0.25, oos.winRate || 0.5));
    const payoffRatio = Math.max(1.1, oos.profitFactor > 0 ? oos.profitFactor : 1.5);
    const fullKelly = Math.max(0.01, (p * payoffRatio - (1 - p)) / payoffRatio);
    const quarterKelly = fullKelly * 0.25 * (0.5 + dsr * 0.8);
    riskPct = Math.min(maxRisk, Math.max(maxRisk * 0.5, quarterKelly * 1.5));
  }

  let targetRiskUsd = eq * riskPct;
  if (rMode === "amount" && (state.settings?.riskAmount ?? 0) > 0) {
    targetRiskUsd = Number(state.settings!.riskAmount);
  } else if (rMode === "pips" && (state.settings?.riskPips ?? 0) > 0) {
    const pipRiskPct = Math.min(maxRisk, Math.max(0.002, Number(state.settings!.riskPips) * 0.0005));
    targetRiskUsd = eq * pipRiskPct;
  }
  const perTradeMode = state.settings?.maxLossPerTradeMode ?? "pct";
  if (perTradeMode === "amount" && (state.settings?.maxLossPerTradeVal ?? 0) > 0) {
    targetRiskUsd = Math.min(targetRiskUsd, Number(state.settings!.maxLossPerTradeVal));
  } else if (rMode === "pct" && perTradeMode === "pct" && (state.settings?.maxLossPerTradeVal ?? 0) > 0) {
    targetRiskUsd = Math.min(targetRiskUsd, eq * (Number(state.settings!.maxLossPerTradeVal) / 100));
  }

  // En mode Montant (€ / $), le risque par trade est directement débloqué selon la demande de l'utilisateur
  const riskCapital = rMode === "amount" ? targetRiskUsd : Math.min(targetRiskUsd, remainingDayBudget);
  const takerFee = options.takerFee ?? (effectiveLev > 1 ? 0.0004 : 0);
  const expectedSlippage = options.expectedSlippage ?? (effectiveLev > 1 ? 0.0002 : 0);
  const denom = Math.max(1e-6, priceStopDistance + takerFee * 2 + expectedSlippage);
  const rawPositionNotional = riskCapital / denom;
  const maxLeveragedNotional = availableMargin * effectiveLev;

  let finalPositionNotional = Math.min(rawPositionNotional, maxLeveragedNotional);
  let binding: Binding = remainingDayBudget < eq * riskPct ? "day" : "risk";

  if (effectiveLev <= 1 && rMode !== "amount") {
    const roomExposureUsd = eq * maxExp - gross;
    if (roomExposureUsd < Math.max(50, eq * 0.005)) {
      return {
        ok: false,
        reason: `Veto : exposition brute actuelle à ${fmtPct(gross / eq)} (plafond strict ${fmtPct(maxExp, 0)} = ${fmtUsd(eq * maxExp)}). Capacité épuisée.`,
      };
    }
    const perTradeMaxExposure = isScalp ? Math.min(roomExposureUsd, (eq * maxExp) / 3) : roomExposureUsd;
    if (finalPositionNotional > perTradeMaxExposure) {
      finalPositionNotional = perTradeMaxExposure;
      binding = "exposure";
    }
  } else if (finalPositionNotional >= maxLeveragedNotional - 1e-6) {
    binding = "exposure";
  }

  const riskUsd = finalPositionNotional * priceStopDistance;
  const maxAllowedRiskUsd =
    rMode === "amount" && (state.settings?.riskAmount ?? 0) > 0
      ? Number(state.settings!.riskAmount) * 1.5 + 50
      : eq * maxRisk + 0.01;
  if (riskUsd > maxAllowedRiskUsd) {
    return {
      ok: false,
      reason: `Veto : le risque à l'invalidation dépasse le plafond autorisé par trade.`,
    };
  }

  return {
    ok: true,
    notional: finalPositionNotional,
    qty: finalPositionNotional / entryPrice,
    riskUsd,
    riskCapital,
    riskPct: riskUsd / eq,
    exposurePct: finalPositionNotional / eq,
    binding,
    stopPct: priceStopDistance,
    leverage: effectiveLev,
    liqPrice,
  };
}

export function sizeTradeIdea(
  state: DeskState,
  entry: number,
  invalidation: number,
  backtest?: Backtest,
  options?: LeveragedSizingOptions,
): SizeVerdict {
  const res = computeLeveragedSizing(state, entry, invalidation, backtest, {
    leverageFactor: options?.leverageFactor ?? 1,
    side: options?.side,
    maintenanceMarginRate: options?.maintenanceMarginRate,
    takerFee: options?.takerFee ?? 0,
    expectedSlippage: options?.expectedSlippage ?? 0,
    autoReduceLeverage: options?.autoReduceLeverage ?? true,
    riskPctOverride: options?.riskPctOverride,
  });
  if (!res.ok) {
    return { ok: false, reason: res.reason ?? "Veto Risque" };
  }
  return {
    ok: true,
    notional: res.notional!,
    qty: res.qty!,
    riskUsd: res.riskUsd!,
    riskPct: res.riskPct!,
    exposurePct: res.exposurePct!,
    binding: res.binding!,
    stopPct: res.stopPct!,
  };
}

export class TradingFloorDesk {
  readonly cfg: Config;
  readonly store: DeskStore;
  readonly tg: TelegramFloorRoom;
  readonly grpo: GrpoEngine;
  readonly sentiment = new SocialSentimentEngine();
  readonly sentinel = new SentinelAgent();
  readonly hunter = new LiquidityHunterAgent();
  readonly mt5: Mt5CloudBridge;
  readonly postMortemPath: string;
  current_market_regime_directive = "";
  state: DeskState;
  private listeners = new Set<(state: DeskState) => void>();
  private busy = false;
  private monitoring = false;
  private syncingMt5 = false;
  private latestBarsBySymbol = new Map<string, MarketSnapshot["bars4h"]>();
  private lastKnownEquity = 0;
  private scanCursor = 0;
  private lastConcurrencySayAt = 0;
  private lastLatencySayAt = 0;

  constructor(cfg: Config, store: DeskStore, tg: TelegramFloorRoom, grpo?: GrpoEngine) {
    this.cfg = cfg;
    this.store = store;
    this.tg = tg;
    this.mt5 = new Mt5CloudBridge(cfg.dataDir);
    this.postMortemPath = join(cfg.dataDir, "trade_post_mortem.json");
    this.grpo = grpo ?? new GrpoEngine();
    this.state = this.store.loadOrCreate(cfg.paperEquity, cfg.timeZone, cfg.symbols, cfg.scanIntervalMin);
    this.current_market_regime_directive = this.state.current_market_regime_directive ?? "";
    this.state.sentinel = this.sentinel.getTelemetry();
    this.state.liquidityHunter = this.hunter.getTelemetry();
    if (!this.state.sessionGoal) {
      this.state.sessionGoal = DeskLeadAgent.createSessionGoal(
        cfg.paperEquity,
        this.state.settings.sessionTargetFiat ?? 2000,
        this.state.settings.sessionDurationHours ?? 4,
      );
    }
    this.syncMobileSettingsToState();
    this.syncRlSummaryToState();
  }

  private async updateSessionGoal(now = Date.now()): Promise<void> {
    const eq = currentEquity(this.state);
    if (!this.state.sessionGoal) {
      this.state.sessionGoal = DeskLeadAgent.createSessionGoal(
        eq,
        this.state.settings.sessionTargetFiat ?? 2000,
        this.state.settings.sessionDurationHours ?? 4,
        now,
      );
    }

    const prevAgg = this.state.sessionGoal.aggressiveness;
    const { updatedGoal, event } = DeskLeadAgent.evaluateTick(
      this.state.sessionGoal,
      eq - this.state.realizedPnl,
      this.state.realizedPnl,
      now,
    );
    this.state.sessionGoal = updatedGoal;

    if (event === "INCREASE_AGGRESSIVENESS" && prevAgg !== "lagging_aggressive") {
      emitPulse(this.state, "lead", "strategist", "wake", "INCREASE_AGGRESSIVENESS: Cible PnL en retard", undefined, now);
      await this.say(
        "lead",
        `[PACING ALERT] Retard sur l'objectif de session ($${updatedGoal.targetProfitFiat} d'ici ${new Date(updatedGoal.deadlineTimestamp).toLocaleTimeString()}). Vitesse requise: $${updatedGoal.requiredVelocityPerHour}/h. Activation du mode HAUTE AGRESSIVITÉ pour rattraper la cadence !`,
        "wake",
      );
      this.broadcast();
    } else if (event === "SECURE_PROFITS" && prevAgg !== "target_reached") {
      emitPulse(this.state, "lead", "risk", "flag", "SECURE_PROFITS: Objectif financier atteint", undefined, now);
      await this.say(
        "lead",
        `🎯 [OBJECTIF ATTEINT] Cible de profit de +$${updatedGoal.targetProfitFiat} accomplie (PnL session: +$${updatedGoal.currentProfitFiat}). Verrouillage et sécurisation des bénéfices !`,
        "fill",
      );
      this.broadcast();
    } else if (event === "REDUCE_RISK" && prevAgg !== "secured" && prevAgg !== "normal") {
      emitPulse(this.state, "lead", "risk", "flag", "REDUCE_RISK: Sécurisation du capital", undefined, now);
      await this.say(
        "lead",
        `[GESTION DU RYTHME] Cadence en avance ou fenêtre terminée. Réduction automatique du risque et préservation des gains.`,
        "plain",
      );
      this.broadcast();
    }
  }

  private syncMobileSettingsToState(): void {
    const pub = this.mt5.getPublicSettings();
    this.state.settings.mt5Enabled = pub.mt5Enabled;
    this.state.settings.metaApiAccountId = pub.metaApiAccountId;
    this.state.settings.mt5Login = pub.mt5Login;
    this.state.settings.mt5Server = pub.mt5Server;
    this.state.settings.mt5DefaultLots = pub.mt5DefaultLots;
    this.state.settings.mt5TokenHint = pub.mt5TokenHint;
    this.state.settings.tgChatId = this.cfg.chatId !== "console" ? this.cfg.chatId : "";
    this.state.settings.tgBotsConfigured = this.tg.configuredBotCount();
  }

  pushLocalMt5BridgePayload(now = Date.now()): void {
    const payload = Mt5CloudBridge.buildLocalBridgePayload(
      this.state.tickets,
      this.state.settings.mt5DefaultLots ?? 0.05,
      now,
    );
    Mt5CloudBridge.writeLocalBridgePayload(payload);
  }

  private updateExecutionTraderState(
    now = Date.now(),
    lastOrderModify?: NonNullable<DeskState["executionTraderState"]>["lastOrderModify"],
  ): void {
    const openCount = this.state.tickets.filter((t) => t.status === "open").length;
    const closedCount = this.state.tickets.filter((t) => t.status === "closed").length;
    this.state.executionTraderState = {
      updatedAt: now,
      openCount,
      closedCount,
      lastOrderModify: lastOrderModify ?? this.state.executionTraderState?.lastOrderModify,
    };
  }

  private buildImportedMt5Ticket(pos: LocalMt5Position, now: number): Ticket {
    const asset = Mt5CloudBridge.mapMt5SymbolToDesk(pos.symbol);
    const direction: Direction = pos.side === "BUY" ? "long" : "short";
    const id = pos.id && pos.id.trim() ? pos.id.trim() : `MT5-${pos.ticket}`;
    const entry = pos.entry > 0 ? pos.entry : pos.current || 1;
    const sl = pos.sl > 0 ? pos.sl : direction === "long" ? entry * 0.995 : entry * 1.005;
    const tp = pos.tp > 0 ? pos.tp : direction === "long" ? entry * 1.01 : entry * 0.99;
    const isFx = /^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY){2}/.test(asset);
    const notional = isFx ? pos.lots * 100_000 : Math.max(100, pos.lots * entry);
    const stopPct = Math.abs(entry - sl) / Math.max(entry, 1e-9);
    const eq = Math.max(1000, currentEquity(this.state));
    const riskUsd = Math.max(1, notional * stopPct);
    const emptyWin = {
      label: "MT5 Live Sync",
      bars: 60,
      trades: 1,
      winRate: 1,
      expectancyR: 0.5,
      profitFactor: 1.5,
      sharpe: 1,
      deflatedSharpe: 0.5,
      maxDrawdownR: 0,
      var95R: 0,
      pass: true,
    };
    return {
      id,
      asset,
      direction,
      playbook: "breakout",
      engine: "breakout",
      thesis: `Position synchronisée depuis MetaTrader 5 (Ticket #${pos.ticket} · ${pos.lots.toFixed(2)} lot).`,
      entry,
      fillPrice: entry,
      invalidation: sl,
      target: tp,
      timeStopHours: 120,
      notional,
      qty: notional / Math.max(entry, 1e-9),
      riskUsd,
      riskPct: riskUsd / eq,
      exposurePct: notional / eq,
      binding: "risk",
      producedBy: PRODUCED_BY,
      backtest: {
        playbook: "breakout",
        rules: "Synchronisation directe MetaTrader 5",
        source: "MT5 Bridge Live",
        inSample: emptyWin,
        outOfSample: emptyWin,
        pass: true,
        deflatedSharpe: 0.5,
      },
      status: "open",
      createdAt: now,
      expiresAt: now + 3600_000,
      decidedAt: now,
      filledAt: now,
      fees: 0,
      funding: 0,
      setupGrade: "A",
      sessionName: "MT5 Live",
      mt5PositionId: String(pos.ticket),
      mt5Lots: pos.lots,
      mt5Profit: pos.profit,
      mt5CurrentPrice: pos.current,
    };
  }

  async syncWithLocalMt5Bridge(): Promise<{ ok: boolean; mt5Connected: boolean; state?: LocalMt5State }> {
    if (this.syncingMt5) {
      return { ok: false, mt5Connected: Boolean(this.state.mt5Live?.connected) };
    }
    this.syncingMt5 = true;
    try {
      const now = Date.now();
      const mt5State = Mt5CloudBridge.readLocalMt5State();
      if (!mt5State) {
        if (this.state.mt5Live?.connected && now - this.state.mt5Live.updatedAt > 25_000) {
          this.state.mt5Live = { ...this.state.mt5Live, connected: false };
          this.state.settings.mt5Connected = false;
          this.state.settings.mt5LastStatus = "Pont MT5 en attente de signal (vérifiez MT5 PC)";
          this.broadcast();
        }
        this.pushLocalMt5BridgePayload(now);
        return { ok: false, mt5Connected: false };
      }

      let structuralChange = false;
      let telemetryChange = false;

      const prevMt5 = this.state.mt5Live;
      if (
        !prevMt5 ||
        !prevMt5.connected ||
        prevMt5.equity !== mt5State.equity ||
        prevMt5.balance !== mt5State.balance ||
        prevMt5.positionsCount !== mt5State.positions.length ||
        prevMt5.profit !== mt5State.profit
      ) {
        telemetryChange = true;
      }

      this.state.mt5Live = {
        connected: Boolean(mt5State.connected),
        updatedAt: now,
        login: mt5State.login,
        server: mt5State.server,
        currency: mt5State.currency || "EUR",
        balance: mt5State.balance,
        equity: mt5State.equity,
        profit: mt5State.profit,
        freeMargin: mt5State.freeMargin,
        leverage: mt5State.leverage,
        tradeAllowed: mt5State.tradeAllowed,
        positionsCount: mt5State.positions.length,
      };
      this.state.settings.mt5Connected = true;
      this.state.settings.mt5Login = String(mt5State.login);
      this.state.settings.mt5Server = mt5State.server;
      this.state.settings.mt5LastStatus = `SYNCHRONISÉ MT5 DIRECT (#${mt5State.login} · Capital ${mt5State.equity.toFixed(2)} ${mt5State.currency || "EUR"} · ${mt5State.positions.length} trade(s))`;

      // 1. Synchronisation stricte du Capital avec le compte MT5 réel (sans jamais effacer l'historique multi-mois)
      if (Number.isFinite(mt5State.balance) && mt5State.balance > 0) {
        const nextStart = Number((mt5State.balance - this.state.realizedPnl).toFixed(2));
        const jumpPct = Math.abs(this.state.startEquity - nextStart) / Math.max(mt5State.balance, 1);
        this.state.startEquity = nextStart;
        this.state.dayStartEquity = mt5State.balance;
        if (this.state.curve.length === 0) {
          this.state.curve = [
            { t: now - 60_000, eq: mt5State.balance, realized: 0, unrealized: 0, drawdownPct: 0 },
            { t: now, eq: mt5State.equity, realized: this.state.realizedPnl, unrealized: mt5State.profit, drawdownPct: 0 },
          ];
          this.lastKnownEquity = mt5State.equity;
          structuralChange = true;
        } else if (jumpPct > 0.15) {
          this.lastKnownEquity = mt5State.equity;
          this.recordEquityPoint(now);
          structuralChange = true;
        }
      }

      // 2. Synchronisation des cotations live MT5 dans le Tape
      for (const q of mt5State.quotes ?? []) {
        const mid = q.bid > 0 && q.ask > 0 ? Number(((q.bid + q.ask) / 2).toFixed(5)) : q.bid || q.ask;
        if (!mid || mid <= 0) continue;
        const deskSym = Mt5CloudBridge.mapMt5SymbolToDesk(q.symbol);
        const candidates = [q.symbol.toUpperCase(), deskSym];
        for (const sym of new Set(candidates)) {
          const row = this.state.tape.find((r) => r.symbol === sym);
          if (row) {
            if (row.px !== mid) {
              row.prev = row.px || mid;
              row.px = mid;
              row.updatedAt = now;
              telemetryChange = true;
            }
          } else if (this.state.settings.symbols.includes(sym)) {
            this.state.tape.push({
              symbol: sym,
              name: symbolName(sym),
              px: mid,
              prev: mid,
              change24h: 0,
              funding: null,
              oiUsd: null,
              bookImbalance: null,
              venue1: "MT5",
              venue2: mt5State.server || "MetaQuotes",
              verified2ndSource: true,
              sparkline: [mid, mid],
              updatedAt: now,
            });
            structuralChange = true;
          }
        }
      }

      // 3. Réconciliation 1:1 des positions ouvertes (Desk <-> MT5)
      const matchedPosTickets = new Set<number>();
      const phantomIdsToRemove = new Set<string>();
      const openTickets = this.state.tickets.filter((t) => t.status === "open");

      for (const t of openTickets) {
        const pos = mt5State.positions.find(
          (p) =>
            (p.id && p.id === t.id) ||
            (t.mt5PositionId && String(p.ticket) === String(t.mt5PositionId)),
        );
        if (pos) {
          matchedPosTickets.add(pos.ticket);
          const ticketStr = String(pos.ticket);
          if (
            t.mt5PositionId !== ticketStr ||
            t.mt5Profit !== pos.profit ||
            t.mt5CurrentPrice !== pos.current ||
            t.mt5Lots !== pos.lots ||
            t.fillPrice !== pos.entry
          ) {
            telemetryChange = true;
          }
          t.mt5PositionId = ticketStr;
          t.fillPrice = pos.entry;
          t.entry = pos.entry;
          const keepStricterBeSl =
            Boolean(t.hardSlSyncedAt && now - t.hardSlSyncedAt < 15_000) ||
            Boolean(t.breakEvenActive && pos.sl > 0 && (t.direction === "long" ? pos.sl < t.invalidation : pos.sl > t.invalidation));
          if (pos.sl > 0 && !keepStricterBeSl) t.invalidation = pos.sl;
          if (pos.tp > 0) t.target = pos.tp;
          t.mt5CurrentPrice = pos.current;
          t.mt5Profit = pos.profit;
          t.mt5Lots = pos.lots;
        } else if (t.mt5PositionId) {
          const exitPx = t.mt5CurrentPrice ?? markPriceOf(this.state, t.asset, t.fillPrice ?? t.entry);
          const hitTp = t.direction === "long" ? exitPx >= t.target * 0.9995 : exitPx <= t.target * 1.0005;
          const hitSl = t.direction === "long" ? exitPx <= t.invalidation * 1.0005 : exitPx >= t.invalidation * 0.9995;
          const mt5Loss = (t.mt5Profit !== undefined && t.mt5Profit < -0.5) || ticketPnlAt(t, exitPx) < 0;
          const reason: CloseReason = hitTp ? "target" : (hitSl || mt5Loss) ? "invalidation" : "flatten";
          await this.closeOpenTicket(
            t,
            reason === "invalidation" && hitSl ? t.invalidation : exitPx,
            reason,
            now,
            t.mt5Profit,
          );
          structuralChange = true;
        } else if (mt5State.tradeAllowed) {
          const ageMs = now - (t.filledAt ?? t.createdAt);
          if (ageMs > 10_000) {
            phantomIdsToRemove.add(t.id);
            structuralChange = true;
          }
        }
      }

      if (phantomIdsToRemove.size > 0) {
        this.state.tickets = this.state.tickets.filter((t) => !phantomIdsToRemove.has(t.id));
      }

      // Importer les positions présentes sur MT5 mais absentes du Desk
      for (const pos of mt5State.positions) {
        if (matchedPosTickets.has(pos.ticket)) continue;
        const importId = pos.id && pos.id.trim() ? pos.id.trim() : `MT5-${pos.ticket}`;
        const existingOrRecent = this.state.tickets.find(
          (x) =>
            x.id === importId ||
            (x.mt5PositionId === String(pos.ticket) &&
              (x.status === "open" || (x.closedAt && now - x.closedAt < 20_000))),
        );
        if (existingOrRecent) continue;

        const imported = this.buildImportedMt5Ticket(pos, now);
        this.state.tickets = [imported, ...this.state.tickets];
        this.store.appendBlotter("POSITION_OPENED", imported, `Importée en direct depuis MT5 (#${pos.ticket})`, now);
        structuralChange = true;
      }

      // Mise à jour propre de la courbe d'équité sans écraser l'historique
      const lastCurve = this.state.curve[this.state.curve.length - 1];
      const liveEq = currentEquity(this.state);
      if (!lastCurve || now - lastCurve.t >= 15_000) {
        this.recordEquityPoint(now);
      } else if (lastCurve.eq !== liveEq) {
        lastCurve.eq = liveEq;
        lastCurve.unrealized = unrealizedPnl(this.state);
        lastCurve.realized = this.state.realizedPnl;
      }

      this.pushLocalMt5BridgePayload(now);
      this.lastKnownEquity = liveEq;
      if (structuralChange || telemetryChange) {
        this.broadcast();
      }
      return { ok: true, mt5Connected: true, state: mt5State };
    } finally {
      this.syncingMt5 = false;
    }
  }

  async resetAndSyncToMt5(): Promise<{
    ok: boolean;
    mt5Live: DeskState["mt5Live"];
    openTickets: Ticket[];
  }> {
    const now = Date.now();
    this.state.halted = false;
    this.state.haltKind = null;
    // Préserver intégralement les tickets clôturés & positions ouvertes (aucune perte d'historique)
    const preservedTickets = this.state.tickets.filter(
      (t) => t.status === "closed" || t.status === "open",
    );
    this.state.tickets = preservedTickets;
    this.state.wakes = [];
    const preservedRealized = preservedTickets
      .filter((t) => t.status === "closed")
      .reduce((s, t) => s + (t.pnl ?? 0), 0);
    this.state.realizedPnl =
      Math.abs(this.state.realizedPnl) > 0 && preservedRealized === 0
        ? this.state.realizedPnl
        : Number(preservedRealized.toFixed(2));

    this.state.settings.symbols = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "XAUUSD"];
    this.state.settings.executionMode = "auto";
    this.state.settings.autoPaperScalp = true;
    this.state.settings.tradingStyle = "scalping";
    this.state.settings.scalpIntervalSec = 15;
    this.state.settings.mt5DefaultLots = Math.max(0.05, this.state.settings.mt5DefaultLots ?? 0.05);

    const mt5State = Mt5CloudBridge.readLocalMt5State();
    const baseEq = mt5State && mt5State.balance > 0 ? mt5State.balance : this.state.startEquity;
    if (!this.state.startEquity || this.state.startEquity <= 0) {
      this.state.startEquity = baseEq;
    }
    this.state.dayStartEquity = baseEq;
    if (!Array.isArray(this.state.curve) || this.state.curve.length < 2) {
      this.state.curve = [
        { t: now - 60_000, eq: baseEq, realized: this.state.realizedPnl, unrealized: 0, drawdownPct: 0 },
        { t: now, eq: mt5State?.equity ?? baseEq, realized: this.state.realizedPnl, unrealized: mt5State?.profit ?? 0, drawdownPct: 0 },
      ];
    } else {
      this.state.curve.push({
        t: now,
        eq: mt5State?.equity ?? baseEq,
        realized: this.state.realizedPnl,
        unrealized: mt5State?.profit ?? 0,
        drawdownPct: 0,
      });
    }
    this.lastKnownEquity = mt5State?.equity ?? baseEq;

    await this.syncWithLocalMt5Bridge();
    await this.runDeskScan("manual");
    if (this.state.tickets.filter((t) => t.status === "open").length < 2) {
      await this.runDeskScan("manual");
    }
    this.pushLocalMt5BridgePayload(Date.now());
    this.store.save(this.state);
    this.broadcast();

    return {
      ok: true,
      mt5Live: this.state.mt5Live,
      openTickets: this.state.tickets.filter((t) => t.status === "open"),
    };
  }

  async configureMobileIntegrations(payload: {
    action: "SAVE_AND_TEST_TELEGRAM" | "DETECT_TELEGRAM_CHAT_ID" | "SAVE_AND_TEST_MT5" | "TEST_MT5_ORDER";
    tgChatId?: string;
    tgTokens?: Partial<Record<AgentId, string>>;
    mt5Enabled?: boolean;
    metaApiToken?: string;
    metaApiAccountId?: string;
    mt5Login?: string;
    mt5Password?: string;
    mt5Server?: string;
    mt5DefaultLots?: number;
    testSymbol?: string;
    testSide?: "long" | "short";
  }): Promise<{ ok: boolean; message: string; chatId?: string; accountId?: string }> {
    if (payload.action === "DETECT_TELEGRAM_CHAT_ID" || payload.action === "SAVE_AND_TEST_TELEGRAM") {
      this.tg.updateCredentials({
        chatId: payload.tgChatId,
        tokens: payload.tgTokens,
      });
      if (payload.action === "DETECT_TELEGRAM_CHAT_ID") {
        const res = await this.tg.detectChatIdFromBot();
        this.state.telegramConnected = this.tg.connected;
        this.syncMobileSettingsToState();
        this.broadcast();
        return res;
      }
      const verify = await this.tg.verifyBots();
      this.state.telegramConnected = verify.ok;
      this.syncMobileSettingsToState();
      if (verify.ok) {
        await this.tg.postAs("lead", "✅ Configuration Telegram sauvegardée ! Les 8 agents peuvent maintenant vous écrire et recevoir vos ordres depuis votre téléphone.");
      }
      this.broadcast();
      return {
        ok: verify.ok,
        chatId: this.cfg.chatId !== "console" ? this.cfg.chatId : undefined,
        message: verify.details.join(" | "),
      };
    }

    if (payload.action === "SAVE_AND_TEST_MT5") {
      this.mt5.configure({
        enabled: payload.mt5Enabled ?? true,
        metaApiToken: payload.metaApiToken,
        accountId: payload.metaApiAccountId,
        login: payload.mt5Login,
        password: payload.mt5Password,
        server: payload.mt5Server,
        defaultLots: payload.mt5DefaultLots,
      });
      const v = await this.mt5.verifyOrProvisionAccount();
      this.state.settings.mt5Connected = v.ok;
      this.state.settings.mt5LastStatus = v.status;
      this.syncMobileSettingsToState();
      await this.say("execution", `MT5 Mobile Cloud : ${v.status}`, v.ok ? "fill" : "veto");
      this.broadcast();
      return { ok: v.ok, message: v.status, accountId: v.accountId };
    }

    if (payload.action === "TEST_MT5_ORDER") {
      const sym = payload.testSymbol || "EURUSD";
      const side = payload.testSide || "long";
      const res = await this.mt5.openMarketOrder({
        symbol: sym,
        direction: side,
        lots: payload.mt5DefaultLots ?? this.state.settings.mt5DefaultLots ?? 0.01,
        comment: "TF-MobileTest",
      });
      await this.say("execution", `Test Ordre MT5 Mobile : ${res.message}`, res.ok ? "fill" : "veto");
      this.broadcast();
      return { ok: res.ok, message: res.message };
    }

    return { ok: false, message: "Action mobile inconnue" };
  }

  private syncRlSummaryToState(regimeOverride?: MarketRegime): void {
    const hist = this.grpo.memory.historicalAdvantageLog ?? [];
    const lastHist = hist[hist.length - 1];
    const regime = regimeOverride ?? (this.state.rlSummary?.regime as MarketRegime) ?? lastHist?.regime ?? "MEAN_REVERTING";
    this.state.rlSummary = {
      totalEpisodes: this.grpo.memory.totalEpisodes,
      meanAdvantage: lastHist?.meanAdvantage ?? 0,
      meanReward: lastHist?.meanReward ?? 0,
      klDivergence: lastHist?.klDivergence ?? 0,
      lastUpdated: this.grpo.memory.timestamp,
      regime,
      selectedStrategy: lastHist?.selectedStrategy,
    };
  }

  isVolatilityShieldActive(now = Date.now()): boolean {
    return (this.state.volatilityShieldUntil ?? 0) > now;
  }

  getActiveFomoBoost(symbol: string, side: Direction, now = Date.now()): number {
    const signals = this.state.fomoSignals ?? [];
    const match = signals.find(
      (f) =>
        now - f.timestamp <= 15 * 60_000 &&
        f.winRate >= 0.6 &&
        f.symbol.toUpperCase() === symbol.toUpperCase() &&
        f.side.toLowerCase() === side,
    );
    return match ? 0.15 : 0;
  }

  async ingestMacroWebhook(payload: MacroWebhookPayload): Promise<{
    ok: boolean;
    macroSurpriseIndex: number;
    volatilityShieldActive: boolean;
    volatilityShieldUntil: number;
  }> {
    const now = Date.now();
    const ts = payload.timestamp && payload.timestamp > 0 ? payload.timestamp : now;
    const macroSurpriseIndex = (payload.actual - payload.forecast) / Math.abs(payload.forecast || 1);
    const shieldUntil =
      payload.impact === "HIGH"
        ? Math.max(this.state.volatilityShieldUntil ?? 0, ts + 15 * 60_000)
        : (this.state.volatilityShieldUntil ?? 0);

    this.state.volatilityShieldUntil = shieldUntil;
    this.state.macroEvents = [
      {
        ...payload,
        timestamp: ts,
        surpriseIndex: macroSurpriseIndex,
      },
      ...(this.state.macroEvents ?? []).slice(0, 39),
    ];

    setAgentActivity(
      this.state,
      "analyst",
      payload.impact === "HIGH" ? "veto" : "scanning",
      `Macro ${payload.event} (${payload.impact})`,
      now,
    );
    emitPulse(this.state, "analyst", "risk", payload.impact === "HIGH" ? "veto" : "flag", `MACRO ${payload.event}`, undefined, now);

    const shieldMsg =
      payload.impact === "HIGH"
        ? ` [VOLATILITY_SHIELD ACTIF 15m : stops élargis +1.5x ATR, scalping non-OFI suspendu]`
        : "";
    await this.say(
      "analyst",
      `MACRO_ALERT [${payload.impact}] ${payload.event} · Actual=${payload.actual} vs Forecast=${payload.forecast} (Prev=${payload.previous}) · macroSurpriseIndex=${macroSurpriseIndex.toFixed(3)}.${shieldMsg}`,
      payload.impact === "HIGH" ? "veto" : "report",
    );
    this.broadcast();
    return {
      ok: true,
      macroSurpriseIndex,
      volatilityShieldActive: this.isVolatilityShieldActive(now),
      volatilityShieldUntil: shieldUntil,
    };
  }

  async ingestFomoWebhook(payload: FomoWebhookPayload): Promise<{
    accepted: boolean;
    reason?: string;
    fomoConfluenceBoost: number;
  }> {
    const now = Date.now();
    const latency = now - payload.timestamp;
    if (payload.winRate < 0.6) {
      return {
        accepted: false,
        reason: `Signal FOMO rejeté : winRate ${(payload.winRate * 100).toFixed(1)}% < 60%.`,
        fomoConfluenceBoost: 0,
      };
    }
    if (latency > 5000) {
      return {
        accepted: false,
        reason: `Signal FOMO rejeté : latence ${Math.round(latency)}ms > 5000ms.`,
        fomoConfluenceBoost: 0,
      };
    }

    const sym = payload.symbol.toUpperCase().endsWith("USDT")
      ? payload.symbol.toUpperCase()
      : `${payload.symbol.toUpperCase()}USDT`;
    const normalized = { ...payload, symbol: sym };
    this.state.fomoSignals = [normalized, ...(this.state.fomoSignals ?? []).slice(0, 29)];

    emitPulse(this.state, "analyst", "strategist", "confirm", `FOMO +0.15 ${sym}`, sym, now);
    await this.say(
      "strategist",
      `COPY_SIGNAL validé (${payload.traderId}, WinRate ${(payload.winRate * 100).toFixed(0)}%, latence ${Math.max(0, Math.round(latency))}ms) : ${sym} ${payload.side} @ ${fmtPx(payload.entryPrice)} (${payload.leverage}x). fomoConfluenceBoost = +0.15 injecté.`,
      "plain",
    );
    this.broadcast();
    return { accepted: true, fomoConfluenceBoost: 0.15 };
  }

  async reloadGrpoPolicy(): Promise<typeof this.grpo.memory> {
    const mem = this.grpo.hotReload();
    this.syncRlSummaryToState();
    const lastHist = mem.historicalAdvantageLog[mem.historicalAdvantageLog.length - 1];
    await this.say(
      "strategist",
      `RL_OPTIMIZER : Poids GRPO rechargés à chaud depuis ./data/rl_policy_memory.json (Episode #${mem.totalEpisodes}, Ā=${(lastHist?.meanAdvantage ?? 0).toFixed(3)}, KL=${(lastHist?.klDivergence ?? 0).toFixed(4)}).`,
      "report",
    );
    this.broadcast();
    return mem;
  }

  async runGrpoTraining(
    symbol?: string,
    startTs?: number,
    endTs?: number,
  ): Promise<{
    ok: boolean;
    symbol: string;
    regime: MarketRegime;
    barsUsed: number;
    episode: number;
    meanAdvantage: number;
    klDivergence: number;
    deflatedSharpe: number;
    weights: Record<string, number>;
    hyperparams: { slMult: number; tpMult: number; leverage: number };
  }> {
    const now = Date.now();
    const targetSym = symbol || this.state.settings.symbols[0] || "BTCUSDT";
    const style = this.state.settings.tradingStyle || "daytrade";
    const tf: "15m" | "1h" | "4h" = style === "scalping" ? "15m" : style === "daytrade" ? "1h" : "4h";

    setAgentActivity(this.state, "strategist", "backtesting", `WFO + GRPO Training sur ${targetSym}`, now, {
      asset: targetSym,
    });
    this.broadcast();

    let rawBars: MarketSnapshot["bars4h"] = [];
    try {
      rawBars = targetSym.endsWith("USDT")
        ? await fetchBinanceKlines(targetSym, tf, 1000)
        : (await fetchMarketSnapshot(targetSym, now)).bars4h;
    } catch {
      rawBars = (await fetchMarketSnapshot(targetSym, now)).bars4h;
    }

    const ranged = filterBarsByDateRange(rawBars, startTs, endTs);
    const bars = ranged.length >= 60 ? ranged : rawBars;
    const lastClose = bars[bars.length - 1]?.close ?? 1;
    const firstClose = bars[0]?.close ?? lastClose;
    const recentAtrBars = bars.slice(-20);
    const avgAtr = recentAtrBars.length
      ? recentAtrBars.reduce((s, b) => s + (b.high - b.low), 0) / recentAtrBars.length
      : lastClose * 0.015;
    const atrPct = avgAtr / Math.max(1e-9, lastClose);
    const retPeriod = (lastClose - firstClose) / Math.max(1e-9, firstClose);

    const regime = this.grpo.classifyRegime({
      ret24h: retPeriod,
      cascadeActive: atrPct > 0.035 || this.isVolatilityShieldActive(now),
      atrPct,
    });

    const lastMacro = (this.state.macroEvents ?? [])[0];
    const candidates = this.grpo.sampleCandidateGroup(
      {
        regime,
        volatility: atrPct,
        ofiZScore: 0,
        vwapZScore: retPeriod * 10,
        fvgProximity: 0.5,
        macroSurprise: lastMacro?.surpriseIndex ?? 0,
        socialScore: this.sentiment.getScore(targetSym),
      },
      6,
      now,
    );

    const dsrScores: number[] = [];
    const outcomes: GrpoCandidateOutcome[] = candidates.map((cand) => {
      const evalRes = evaluateCandidateForGrpo(bars, cand.strategy, cand.slMult, cand.tpMult, cand.leverage, startTs, endTs);
      dsrScores.push(evalRes.deflatedSharpe);
      return {
        config: cand,
        pnl: evalRes.pnl,
        realizedR: evalRes.realizedR,
        maxAdverseExcursion: evalRes.maxAdverseExcursion,
        stopDistance: evalRes.stopDistance,
        executionFees: evalRes.executionFees,
      };
    });

    const upd = this.grpo.updatePolicyFromGroup(regime, outcomes);
    const bestDist = this.grpo.getRecommendedHyperparams(regime);
    const slMult = bestDist.slMultMean;
    const tpMult = bestDist.tpMultMean;
    const leverage = bestDist.leverageMean;
    if (slMult > 0) {
      this.state.settings.fixedStopAtr = Number(slMult.toFixed(2));
    }
    const meanDsr = dsrScores.length ? dsrScores.reduce((a, b) => a + b, 0) / dsrScores.length : 0.5;
    this.syncRlSummaryToState(regime);

    const episode = this.grpo.memory.totalEpisodes;
    emitPulse(this.state, "strategist", "reviewer", "log", `GRPO Ep#${episode} ${targetSym}`, targetSym, now);
    await this.say(
      "strategist",
      `🧠 WFO + GRPO Episode #${episode} [${targetSym} · ${regime}] (${bars.length} bougies ${tf}) : Mean Advantage Ā=${upd.meanAdvantage.toFixed(3)} · KL=${upd.klDivergence.toFixed(4)} · DSR=${(meanDsr * 100).toFixed(0)}%. Hyperparams recommandés : SL=${slMult.toFixed(2)}x ATR, TP=${tpMult.toFixed(2)}R, Lev=${leverage.toFixed(1)}x.`,
      "report",
    );
    setAgentActivity(this.state, "strategist", "idle", `GRPO Ep#${episode} sauvegardé`, now);
    this.broadcast();

    return {
      ok: true,
      symbol: targetSym,
      regime,
      barsUsed: bars.length,
      episode,
      meanAdvantage: upd.meanAdvantage,
      klDivergence: upd.klDivergence,
      deflatedSharpe: Number(meanDsr.toFixed(4)),
      weights: upd.updatedWeights,
      hyperparams: { slMult, tpMult, leverage },
    };
  }

  async getChartCandles(
    symbol: string,
    interval = "15m",
    limit = 240,
  ): Promise<{
    ok: boolean;
    symbol: string;
    interval: string;
    candles: MarketSnapshot["bars4h"];
    vwap: MarketSnapshot["vwapContext"] | null;
    fvg: MarketSnapshot["fvgZone"] | null;
    marketProfile: MarketProfileSummary;
    sentimentScore: number;
  }> {
    const now = Date.now();
    const sym = (symbol || this.state.settings.symbols[0] || "BTCUSDT").toUpperCase();
    const normTf = String(interval || "15m").trim();
    const targetCount = Math.min(500, Math.max(30, limit));
    const tfParsed = /^(\d+)(s|m|h|d|j|w|M|sem|mois)$/.exec(normTf);
    const qty = tfParsed ? Math.max(1, Number(tfParsed[1])) : 15;
    const rawUnit = tfParsed ? tfParsed[2] : "m";
    const unit = rawUnit === "j" ? "d" : rawUnit === "sem" ? "w" : rawUnit === "mois" ? "M" : rawUnit;

    let candles: MarketSnapshot["bars4h"] = [];
    if (sym.endsWith("USDT")) {
      // Crypto Binance : intervalles natifs ou agrégation exacte pour tout TF custom (2m, 7m, 10m...)
      const nativeBinanceMap: Record<string, string> = {
        "1s": "1s",
        "1m": "1m",
        "3m": "3m",
        "5m": "5m",
        "15m": "15m",
        "30m": "30m",
        "1h": "1h",
        "2h": "2h",
        "4h": "4h",
        "6h": "6h",
        "8h": "8h",
        "12h": "12h",
        "1d": "1d",
        "1w": "1w",
        "1M": "1M",
      };
      const canonical = `${qty}${unit}`;
      if (nativeBinanceMap[canonical]) {
        try {
          candles = await fetchBinanceKlines(sym, nativeBinanceMap[canonical], targetCount);
        } catch {
          candles = [];
        }
      } else {
        let baseTf = "1m";
        let factor = qty;
        if (unit === "s") {
          baseTf = "1s";
          factor = Math.min(60, qty);
        } else if (unit === "m") {
          if (qty % 15 === 0) {
            baseTf = "15m";
            factor = qty / 15;
          } else if (qty % 5 === 0) {
            baseTf = "5m";
            factor = qty / 5;
          } else {
            baseTf = "1m";
            factor = qty;
          }
        } else if (unit === "h") {
          baseTf = "1h";
          factor = qty;
        } else if (unit === "d") {
          baseTf = "1d";
          factor = qty;
        }
        try {
          const baseBars = await fetchBinanceKlines(sym, baseTf, Math.min(1000, targetCount * Math.max(1, factor)));
          candles = aggregateKlines(baseBars, factor);
        } catch {
          candles = [];
        }
      }
    } else {
      // Forex, Métaux, Indices, Actions : Yahoo Finance multi-timeframes + agrégation (2h, 4h, 3m, 10m...)
      let yInt = "15m";
      let yRange = "1mo";
      let factor = 1;
      if (unit === "s" || (unit === "m" && qty < 5)) {
        yInt = qty === 2 ? "2m" : "1m";
        yRange = "5d";
        factor = unit === "m" && qty !== 1 && qty !== 2 ? qty : 1;
      } else if (unit === "m" && qty < 15) {
        yInt = "5m";
        yRange = "1mo";
        factor = qty === 5 ? 1 : Math.max(1, Math.round(qty / 5));
      } else if (unit === "m" && qty < 30) {
        yInt = "15m";
        yRange = "1mo";
        factor = Math.max(1, Math.round(qty / 15));
      } else if (unit === "m" && qty < 60) {
        yInt = "30m";
        yRange = "1mo";
        factor = Math.max(1, Math.round(qty / 30));
      } else if (unit === "m") {
        yInt = "1h";
        yRange = "3mo";
        factor = Math.max(1, Math.round(qty / 60));
      } else if (unit === "h") {
        yInt = "1h";
        yRange = qty >= 4 ? "6mo" : "3mo";
        factor = qty;
      } else if (unit === "d") {
        yInt = "1d";
        yRange = "2y";
        factor = qty;
      } else if (unit === "w") {
        yInt = "1wk";
        yRange = "5y";
        factor = qty;
      } else if (unit === "M") {
        yInt = "1mo";
        yRange = "10y";
        factor = qty;
      }
      try {
        const rawYahoo = await fetchYahooKlines(sym, yInt, yRange);
        candles = aggregateKlines(rawYahoo, factor);
      } catch {
        candles = [];
      }
    }

    if (!candles.length) {
      const snapFallback = await fetchMarketSnapshot(sym, now, this.state.settings.fvgMinSizeAtr ?? 0.5);
      candles = snapFallback.bars4h ?? [];
    }

    const slicedCandles = candles.slice(-targetCount);
    const livePx = markPriceOf(this.state, sym, 0);
    if (slicedCandles.length > 0 && livePx > 0) {
      const lastBar = slicedCandles[slicedCandles.length - 1];
      slicedCandles[slicedCandles.length - 1] = {
        ...lastBar,
        high: Math.max(lastBar.high, livePx),
        low: Math.min(lastBar.low, livePx),
        close: livePx,
      };
    }

    const curPx = livePx || slicedCandles[slicedCandles.length - 1]?.close || 1;
    const marketProfile = MarketProfileAnalyzer.computeSessionProfile(sym, slicedCandles, curPx, now);
    if (!this.state.marketProfiles) this.state.marketProfiles = {};
    this.state.marketProfiles[sym] = marketProfile;
    const vwap = computeSessionVwap(slicedCandles, now) ?? null;
    const fvg = detectLatestFvg(slicedCandles, this.state.settings.fvgMinSizeAtr ?? 0.5);

    return {
      ok: true,
      symbol: sym,
      interval: normTf,
      candles: slicedCandles,
      vwap,
      fvg,
      marketProfile,
      sentimentScore: this.sentiment.getScore(sym),
    };
  }

  async emergencyLiquidateAll(): Promise<{ ok: boolean; closedCount: number; cancelledPending: number }> {
    const now = Date.now();
    const open = this.state.tickets.filter((t) => t.status === "open");
    for (const t of open) {
      const px = markPriceOf(this.state, t.asset, t.fillPrice ?? t.entry);
      await this.closeOpenTicket(t, px, "flatten", now);
    }
    let cancelledPending = 0;
    for (const t of this.state.tickets.filter((x) => x.status === "pending")) {
      t.status = "rejected";
      t.decidedAt = now;
      this.store.appendBlotter("TICKET_REJECTED", t, "Annulé via EMERGENCY_LIQUIDATE_ALL", now);
      cancelledPending += 1;
    }
    emitPulse(this.state, "human", "execution", "veto", "EMERGENCY_LIQUIDATE_ALL", undefined, now);
    await this.say(
      "execution",
      `🚨 EMERGENCY_LIQUIDATE_ALL : ${open.length} position(s) ouverte(s) liquidée(s) au marché et ${cancelledPending} ticket(s) en attente annulé(s). Portefeuille à plat.`,
      "veto",
    );
    this.pushLocalMt5BridgePayload(now);
    this.broadcast();
    return { ok: true, closedCount: open.length, cancelledPending };
  }

  async toggleManualHalt(halt?: boolean): Promise<{ ok: boolean; halted: boolean }> {
    const now = Date.now();
    if (this.state.halted && this.state.haltKind === "loss" && halt === false) {
      await this.say(
        "risk",
        "Refusé : la limite réelle de perte journalière a été atteinte. Attendez la session suivante.",
        "veto",
      );
      return { ok: false, halted: true };
    }
    const nextHalted = halt ?? !this.state.halted;
    this.state.halted = nextHalted;
    this.state.haltKind = nextHalted ? "drill" : null;
    setAgentActivity(
      this.state,
      "risk",
      nextHalted ? "veto" : "idle",
      nextHalted ? "EXECUTION_HALTED_MANUAL" : "Desk actif",
      now,
    );
    emitPulse(
      this.state,
      "human",
      "risk",
      nextHalted ? "veto" : "confirm",
      nextHalted ? "EXECUTION_HALTED_MANUAL" : "RESUME_DESK",
      undefined,
      now,
    );
    await this.say(
      "risk",
      nextHalted
        ? "⚠️ EXECUTION_HALTED_MANUAL : Tous les agents sont suspendus. Aucun nouveau trade ou ticket autorisé."
        : "▶️ RESUME_DESK : Le circuit-breaker manuel est levé. Les 8 agents reprennent l'activité.",
      nextHalted ? "veto" : "plain",
    );
    this.broadcast();
    return { ok: true, halted: this.state.halted };
  }

  async runOneClickAutoPilot(symbol?: string): Promise<{
    ok: boolean;
    training: Awaited<ReturnType<TradingFloorDesk["runGrpoTraining"]>>;
    openPositions: number;
    pendingPositions: number;
    executionMode: string;
  }> {
    const now = Date.now();
    this.state.halted = false;
    this.state.haltKind = null;
    this.state.settings.executionMode = "auto";
    this.state.settings.autoPaperScalp = true;
    const training = await this.runGrpoTraining(symbol, now - 90 * 86400_000, now);
    await this.runDeskScan("manual");
    const openPositions = this.state.tickets.filter((t) => t.status === "open").length;
    const pendingPositions = this.state.tickets.filter((t) => t.status === "pending").length;
    await this.say(
      "lead",
      `⚡ Mode 1-Clic Autopilot exécuté sur ${training.symbol} : IA calibrée (Ep #${training.episode}) et scan lancé (${openPositions} position(s) ouverte(s)).`,
      "report",
    );
    this.broadcast();
    return {
      ok: true,
      training,
      openPositions,
      pendingPositions,
      executionMode: this.state.settings.executionMode,
    };
  }

  subscribe(fn: (state: DeskState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private broadcast(): void {
    this.store.save(this.state);
    for (const fn of this.listeners) {
      try {
        fn(this.state);
      } catch {
        // ignore listener error
      }
    }
  }

  private async say(
    speaker: Speaker,
    text: string,
    tone: MessageTone = "plain",
    ticketId?: string,
    source: "telegram" | "web" | "desk" = "desk",
  ): Promise<void> {
    const now = Date.now();
    this.state.nonce += 1;
    this.state.messages = [
      ...this.state.messages.slice(-299),
      {
        id: `m${this.state.nonce}`,
        at: now,
        speaker,
        text,
        tone,
        ...(ticketId ? { ticketId } : {}),
        source,
      },
    ];
    this.broadcast();
    if (speaker !== "human") {
      await this.tg.postAs(speaker, text);
    }
  }

  /**
   * Fait parler un agent via son System Prompt dédié (moteur LLM économique) ou fallback FR.
   */
  private async speakWithAgentPrompt(
    agent: AgentId,
    facts: string,
    fallbackFrenchText: string,
    tone: MessageTone = "plain",
    ticketId?: string,
  ): Promise<void> {
    const promptCfg = this.state.agentPrompts[agent] ?? DEFAULT_AGENT_PROMPTS[agent];
    const res = await generateAgentVoice(promptCfg, this.state.settings, facts, fallbackFrenchText);
    this.state.lastLlmProviderUsed = res.usedProvider;
    if (!res.usedProvider.startsWith("Moteur déterministe") && !res.usedProvider.startsWith("Fallback")) {
      this.state.llmCallCount = (this.state.llmCallCount || 0) + 1;
    }
    await this.say(agent, res.text, tone, ticketId);
  }

  private async wakeHuman(kind: WakeKind, text: string, ticketId?: string): Promise<void> {
    const now = Date.now();
    const mention = this.cfg.humanUsername ? `@${this.cfg.humanUsername} ` : "";
    const fullText = `🚨 RÉVEIL OPÉRATEUR · ${mention}${text}`;
    await this.say("lead", fullText, "wake", ticketId);
    this.state.nonce += 1;
    this.state.wakes = [
      ...this.state.wakes,
      {
        id: `w${this.state.nonce}`,
        at: now,
        kind,
        text: fullText,
        ...(ticketId ? { ticketId } : {}),
        acked: false,
        pings: 1,
        lastPingAt: now,
      },
    ];
    emitPulse(this.state, "lead", "human", "wake", `RÉVEIL : ${kind}`, undefined, now);
    this.broadcast();
  }

  private recordEquityPoint(now = Date.now()): void {
    const eq = currentEquity(this.state);
    const realized = this.state.realizedPnl;
    const unrealized = unrealizedPnl(this.state);
    const retentionCutoff = now - 65 * 86_400_000; // Conserve au minimum 65 jours (2+ mois) d'historique réel
    const highResCutoff = now - 86_400_000; // Pleine résolution sur les dernières 24h
    const bucketMs = 5 * 60_000; // Compression en pas de 5 min au-delà de 24h pour tenir largement sous 20 000 points

    const existing = this.state.curve.filter((p) => p.t >= retentionCutoff && p.t <= now + 60_000);
    const archivedBuckets = new Map<number, (typeof existing)[number]>();
    const recentPoints: (typeof existing) = [];
    for (const pt of existing) {
      if (pt.t < highResCutoff) {
        archivedBuckets.set(Math.floor(pt.t / bucketMs), pt);
      } else {
        recentPoints.push(pt);
      }
    }
    const merged = [...archivedBuckets.values(), ...recentPoints];
    const peak = merged.reduce((m, p) => Math.max(m, p.eq), this.state.startEquity);
    const drawdownPct = peak > 0 ? Math.max(0, (peak - eq) / peak) : 0;
    const last = merged[merged.length - 1];
    // Évite le spam : enregistre sur variation d'équité (>= 15s) ou au minimum toutes les 5 min à plat
    if (last && (now - last.t < 15_000 || (Math.abs(last.eq - eq) < 0.01 && now - last.t < 300_000))) {
      return;
    }
    this.state.curve = [
      ...merged.slice(-19_999),
      { t: now, eq, realized, unrealized, drawdownPct },
    ];
  }

  async bootstrapIfFresh(): Promise<void> {
    const verify = await this.tg.verifyBots();
    this.state.telegramConnected = verify.ok;

    await this.refreshTape();
    await this.syncWithLocalMt5Bridge();

    if (this.state.messages.length === 0) {
      await this.seedCleanDeskWithoutFakeTrades();
    } else if (!this.state.messages.some((m) => m.text.includes("[REFONTE_AGENTS_V2]"))) {
      await this.announceV2AgentsRoster();
    }

    const now = Date.now();
    const hasClosedOrPostMortems =
      this.state.tickets.some((t) => t.status === "closed") || this.readTradePostMortems(1).length > 0;
    const dueReflection =
      !this.state.lastSelfReflectionAt ||
      now - this.state.lastSelfReflectionAt >= 15 * 60_000 ||
      !(this.state.selfReflectionHistory && this.state.selfReflectionHistory.length > 0);
    if (dueReflection && (hasClosedOrPostMortems || !(this.state.selfReflectionHistory && this.state.selfReflectionHistory.length > 0))) {
      await this.runAgenticSelfReflection(now);
    }

    this.store.save(this.state);
    this.broadcast();
  }

  private async announceV2AgentsRoster(): Promise<void> {
    // Nettoie l'ancien spam répétitif avant de publier les nouvelles consignes des 8 agents
    this.state.messages = this.state.messages.filter(
      (m) =>
        !m.text.includes("6 agents autonomes") &&
        !m.text.includes("plafond dynamique de") &&
        !m.text.includes("EXECUTION_HALTED_LATENCY"),
    );

    await this.say(
      "lead",
      `[REFONTE_AGENTS_V2] Chef de Salle : Orchestration des 8 agents activée (Market Profile + Auto-Réflexion 15m + ActiveTradeManager + Risk). Pacing recalibré sans double-comptage.`,
      "report",
    );
    await this.say(
      "analyst",
      "Analyste Recherche v2 : Croisement multi-sources honnête (Binance/Bybit pour Crypto ; Yahoo/MT5 pour Forex, Or & Indices), contexte Market Profile (POC/VAH/VAL) et Volatility Shield.",
      "report",
    );
    await this.say(
      "strategist",
      "Stratège Quant v2 : Application stricte du filtre Market Profile (zéro LONG > VAH / zéro SHORT < VAL en range), backtest WFO purgé 90j + OOS 30j, poids GRPO et directive 15m du Reviewer.",
      "report",
    );
    await this.say(
      "risk",
      `Directeur des Risques v2 : Sizing Kelly calibré sur la distance réelle du Stop-Loss final (${fmtPct(this.state.settings.maxRiskPct, 1)} / ${this.state.settings.slMode?.toUpperCase() ?? "ATR"}), Liquidation Guard >= 15% et Garde-Fou Frais (<= 30% du risque).`,
      "report",
    );
    await this.say(
      "execution",
      "Trader d'Exécution v2 : Envoi systématique Hard SL/TP sur MT5/Paper + ActiveTradeManager (OrderModify asynchrone Break-Even + frais dès 50% du TP atteint).",
      "report",
    );
    await this.say(
      "reviewer",
      "Auditeur & Journal v2 : Post-mortem persistant dans trade_post_mortem.json + boucle d'Auto-Réflexion toutes les 15 minutes pour adapter la directive du Stratège.",
      "report",
    );
    await this.say(
      "sentinel",
      "The Sentinel SRE v2 : Surveillance RTT API, Rate-Limit Token Bucket et intégrité capital avec mise en HALT sécurisé (zéro crash processus).",
      "report",
    );
    await this.say(
      "hunter",
      "Liquidity Hunter v2 : Détection Spoofing (<500ms) sur vrais carnets L2 uniquement, suivi Squeezes Funding/OI et cibles sur zones aimants de liquidité.",
      "report",
    );
  }

  /**
   * Démarre le desk SANS AUCUN FAUX TRADE PASSÉ.
   */
  private async seedCleanDeskWithoutFakeTrades(): Promise<void> {
    const now = Date.now();
    this.state.realizedPnl = 0;
    this.state.tickets = [];
    this.state.dayStartEquity = this.state.startEquity;
    this.state.curve = [
      { t: now - 60_000, eq: this.state.startEquity, realized: 0, unrealized: 0, drawdownPct: 0 },
      { t: now, eq: this.state.startEquity, realized: 0, unrealized: 0, drawdownPct: 0 },
    ];

    const tapeSummary = this.state.tape
      .slice(0, 6)
      .map((r) => `${r.symbol}: ${fmtPx(r.px)}`)
      .join(" · ");

    await this.say(
      "lead",
      `Salle « Trading Floor » initialisée (8 agents IA autonomes · ${tapeSummary}).`,
    );
    await this.announceV2AgentsRoster();
    await this.runDeskScan("initial");
  }

  async refreshTape(): Promise<MarketSnapshot[]> {
    const now = Date.now();
    const activeSymbols = this.state.settings?.symbols?.length ? this.state.settings.symbols : this.cfg.symbols;
    const fvgMinAtr = this.state.settings?.fvgMinSizeAtr ?? 0.5;
    const snaps = await Promise.all(activeSymbols.map((sym) => fetchMarketSnapshot(sym, now, fvgMinAtr)));
    const mt5LiveNow = Mt5CloudBridge.readLocalMt5State();
    const mt5PriceMap = new Map<string, number>();
    if (mt5LiveNow?.quotes) {
      for (const q of mt5LiveNow.quotes) {
        const mid = q.bid > 0 && q.ask > 0 ? Number(((q.bid + q.ask) / 2).toFixed(5)) : q.bid || q.ask;
        if (mid > 0) {
          mt5PriceMap.set(q.symbol.toUpperCase(), mid);
          mt5PriceMap.set(Mt5CloudBridge.mapMt5SymbolToDesk(q.symbol), mid);
        }
      }
    }
    const nextTape: LiveTapeRow[] = snaps.map((snap) => {
      const prevRow = this.state.tape.find((r) => r.symbol === snap.symbol);
      const mt5Px = mt5PriceMap.get(snap.symbol.toUpperCase());
      if (mt5Px && snap.primary && snap.secondary) {
        snap.primary.price = mt5Px;
        snap.secondary.price = mt5Px;
      }
      const px =
        mt5Px ??
        snap.primary?.price ??
        snap.secondary?.price ??
        snap.bars4h[snap.bars4h.length - 1]?.close ??
        prevRow?.px ??
        0;
      const check = verifySecondSource(snap);
      const spark = snap.bars4h.slice(-28).map((b) => b.close);
      return {
        symbol: snap.symbol,
        name: symbolName(snap.symbol),
        px,
        prev: prevRow?.px ?? px,
        change24h: snap.ret24h ?? 0,
        funding: snap.primary?.funding ?? snap.secondary?.funding ?? null,
        oiUsd: snap.primary?.oiValue ?? snap.secondary?.oiValue ?? null,
        bookImbalance: snap.primary?.book ?? snap.secondary?.book ?? null,
        venue1: snap.primary?.venue ?? "Binance",
        venue2: snap.secondary?.venue ?? "Bybit",
        verified2ndSource: check.verified,
        sparkline: spark,
        updatedAt: now,
      };
    });
    this.state.tape = nextTape;
    this.state.lastTickAt = now;
    if (!this.state.marketProfiles) this.state.marketProfiles = {};
    for (const snap of snaps) {
      if (snap.bars4h?.length) {
        this.latestBarsBySymbol.set(snap.symbol, snap.bars4h);
      }
      const curPx = snap.primary?.price ?? snap.secondary?.price ?? snap.bars4h[snap.bars4h.length - 1]?.close ?? 0;
      if (snap.bars4h?.length && curPx > 0) {
        const mp = MarketProfileAnalyzer.computeSessionProfile(snap.symbol, snap.bars4h, curPx, now);
        snap.marketProfile = mp;
        this.state.marketProfiles[snap.symbol] = mp;
      }
    }
    await this.sentiment.pollFeeds(activeSymbols, snaps, now);
    this.state.socialSentiment = this.sentiment.getSamplesSnapshot();

    // Agent 7: The Sentinel (RTT heartbeat, TokenBucket rate limit & FATAL_DESYNC guard)
    this.sentinel.rateLimiter.canExecute("NON_CRITICAL", Math.min(10, activeSymbols.length), now);
    const prevHaltedLat = this.sentinel.latencyHalted;
    await this.sentinel.measureExchangeHeartbeat();
    const curEq = currentEquity(this.state);
    if (this.lastKnownEquity > 0) {
      const desync = this.sentinel.checkFatalDesync({
        riskManagerOnline: true,
        streamGapMs: 0,
        prevEquity: this.lastKnownEquity,
        currentEquity: curEq,
      });
      if (desync.fatal) {
        await this.say("sentinel", `SYS_OPS [${desync.reason}] -> EMERGENCY_LIQUIDATE_ALL + HALT SÉCURISÉ`, "veto");
        await this.sentinel.executeCircuitBreaker(
          () => this.emergencyLiquidateAll(),
          () => {
            this.state.halted = true;
            this.state.haltKind = "loss";
            this.broadcast();
          },
        );
      }
    }
    this.lastKnownEquity = curEq;
    this.state.sentinel = this.sentinel.getTelemetry(now);
    if (!prevHaltedLat && this.sentinel.latencyHalted) {
      setAgentActivity(this.state, "sentinel", "veto", `EXECUTION_HALTED_LATENCY (${this.sentinel.rollingRttMs}ms)`, now);
      emitPulse(this.state, "sentinel", "execution", "veto", "EXECUTION_HALTED_LATENCY", undefined, now);
      if (now - this.lastLatencySayAt >= 300_000) {
        this.lastLatencySayAt = now;
        await this.say(
          "sentinel",
          `SYS_OPS [EXECUTION_HALTED_LATENCY] : Latence API ${this.sentinel.rollingRttMs}ms (>150ms sur 3 ticks). Ordres Market HFT suspendus (Mode LIMIT actif).`,
          "veto",
        );
      }
    } else {
      setAgentActivity(
        this.state,
        "sentinel",
        this.sentinel.latencyHalted ? "veto" : "watch",
        `RTT ${this.sentinel.rollingRttMs}ms · Bucket ${this.state.sentinel.rateLimitUsagePct}%`,
        now,
      );
    }

    // Agent 8: Liquidity Hunter (uniquement sur flux L2 réel Binance/Bybit — jamais de carnet synthétique inventé)
    const primarySnap = snaps.find(
      (s) => s.primary && s.bars4h?.length && s.primary.top5Bids?.length && s.primary.top5Asks?.length,
    );
    if (primarySnap?.primary?.top5Bids?.length && primarySnap.primary.top5Asks?.length) {
      const p = primarySnap.primary;
      const mid = p.price;
      const bids = p.top5Bids ?? [];
      const asks = p.top5Asks ?? [];
      const hunterOut = this.hunter.updateSnapshotSummary({
        symbol: primarySnap.symbol,
        midPrice: mid,
        bids,
        asks,
        bars: primarySnap.bars4h,
        fundingRate: p.funding ?? 0,
        oiChange1h: p.oiChange1h ?? 0,
        ret1h: p.ret1h ?? 0,
        now,
      });
      this.state.liquidityHunter = hunterOut.telemetry;
      setAgentActivity(
        this.state,
        "hunter",
        hunterOut.squeeze ? "verifying" : "scanning",
        `L2 Imb ${(hunterOut.telemetry.imbalance * 100).toFixed(0)}% · Zones ${hunterOut.zones.length}`,
        now,
        { targetAgent: "strategist", asset: primarySnap.symbol },
      );
      if (hunterOut.newSpoofs.length) {
        emitPulse(this.state, "hunter", "strategist", "flag", "SPOOFING_DETECTED", primarySnap.symbol, now);
        await this.say(
          "hunter",
          `LIQUIDITY_L2 [SPOOFING_DETECTED] sur ${primarySnap.symbol} : Mur ${hunterOut.newSpoofs[0].side} @ ${fmtPx(hunterOut.newSpoofs[0].price)} retiré en ${hunterOut.newSpoofs[0].durationMs}ms. Niveau ignoré par le Stratège.`,
          "report",
        );
      }
      if (hunterOut.squeeze) {
        emitPulse(this.state, "hunter", "strategist", "confirm", hunterOut.squeeze.signal, primarySnap.symbol, now);
      }
    }

    this.recordEquityPoint(now);
    this.broadcast();
    return snaps;
  }

  private anomalyScore(snap: MarketSnapshot): number {
    const p = snap.primary;
    if (!p) return 0;
    const retScore = Math.abs(p.ret1h ?? 0) / 0.006;
    const fundScore = Math.abs(p.funding ?? 0) / 0.0004;
    const oiScore = Math.abs(p.oiChange1h ?? 0) / 0.015;
    const bookScore = Math.abs(p.book ?? 0) / 0.25;
    return retScore + fundScore * 0.8 + oiScore * 0.7 + bookScore * 0.6;
  }

  private choosePlay(
    snap: MarketSnapshot,
  ): {
    dir: Direction;
    playbook: PlayKind;
    thesis: string;
    customEntry?: number;
    customStop?: number;
    customTarget?: number;
    partialTpPrice?: number;
    timeStopMs?: number;
    trailingAtr1m?: number;
    regime?: MarketRegime;
    fomoBoostApplied?: number;
  } | null {
    const p = snap.primary;
    if (!p) return null;
    const now = Date.now();
    const ret1h = p.ret1h ?? 0;
    const funding = p.funding ?? 0;
    const px = p.price;
    const style = this.state.settings?.tradingStyle ?? "daytrade";
    const isAutoScalp = Boolean(this.state.settings?.autoPaperScalp);
    const ofiThresh = this.state.settings?.ofiZScoreThreshold ?? 2.5;
    const atrPct = (snap.atr || px * 0.015) / Math.max(px, 1e-9);
    const regime = this.grpo.classifyRegime({
      ret24h: snap.ret24h ?? 0,
      cascadeActive: Boolean(snap.cascadeWatch?.active),
      atrPct,
    });
    const sentimentScore = this.sentiment.getScore(snap.symbol);
    const fomoLong = this.getActiveFomoBoost(snap.symbol, "long", now);
    const fomoShort = this.getActiveFomoBoost(snap.symbol, "short", now);
    const shieldActive = this.isVolatilityShieldActive(now);
    const squeezeSig = this.hunter.computeSqueezeSignal(funding, p.oiChange1h ?? 0, ret1h);
    const magnetZones = this.hunter.computeLiquidityMagnetZones(snap.bars4h ?? [], px, snap.symbol);

    // Calcul temps réel du Market Profile (POC, VAH, VAL) pour contextualiser le Strategist
    const mp: MarketProfileSummary =
      snap.marketProfile ??
      MarketProfileAnalyzer.computeSessionProfile(snap.symbol, snap.bars4h ?? [], px, now);
    snap.marketProfile = mp;
    if (!this.state.marketProfiles) this.state.marketProfiles = {};
    this.state.marketProfiles[snap.symbol] = mp;

    const directiveLower = (this.current_market_regime_directive || "").toLowerCase();
    const directiveForcesMeanRev =
      directiveLower.includes("mean-reversion") ||
      directiveLower.includes("mean reversion") ||
      directiveLower.includes("range") ||
      directiveLower.includes("breakouts échouent");
    const isRangeMarket = mp.isRange || regime === "MEAN_REVERTING" || directiveForcesMeanRev;

    const applyMagnetTarget = (dir: Direction, fallbackTarget: number | undefined, playbook: PlayKind): number | undefined => {
      if (playbook !== "HFT_OrderFlow_Imbalance" && playbook !== "Session_VWAP_Reversion") {
        return fallbackTarget;
      }
      const directionalZones = magnetZones.filter((z) => {
        const rel = (z.price - px) / Math.max(px, 1e-9);
        return dir === "long" ? rel >= 0.002 && rel <= 0.045 : rel <= -0.002 && rel >= -0.045;
      });
      return directionalZones[0]?.price ?? fallbackTarget;
    };

    const withConfluence = (
      res: {
        dir: Direction;
        playbook: PlayKind;
        thesis: string;
        customEntry?: number;
        customStop?: number;
        customTarget?: number;
        partialTpPrice?: number;
        timeStopMs?: number;
        trailingAtr1m?: number;
      },
    ) => {
      // Règle stricte Market Profile : Interdiction de LONG > VAH ou SHORT < VAL en marché range
      const mpCheck = MarketProfileAnalyzer.checkRangeEntryAllowed(res.dir, px, mp, isRangeMarket);
      if (!mpCheck.allowed) {
        return null;
      }
      // Si la directive Reviewer indique explicitement que les breakouts échouent en range, bloquer les breakouts purs
      if (directiveForcesMeanRev && res.playbook === "breakout") {
        return null;
      }
      const targetPrice = applyMagnetTarget(res.dir, res.customTarget, res.playbook);
      const fomoBoost = res.dir === "long" ? fomoLong : fomoShort;
      const rlWeight = this.grpo.getStrategyWeight(regime, res.playbook);
      const extras: string[] = [
        `Regime=${regime}(w=${rlWeight.toFixed(2)})`,
        `MP(POC=${fmtPx(mp.poc)}, VAH=${fmtPx(mp.vah)}, VAL=${fmtPx(mp.val)}, ${isRangeMarket ? "RANGE" : "TREND"})`,
      ];
      if (this.current_market_regime_directive) {
        extras.push(`Directive15m="${this.current_market_regime_directive.slice(0, 80)}"`);
      }
      if (Math.abs(sentimentScore) >= 0.05) extras.push(`Social=${sentimentScore >= 0 ? "+" : ""}${sentimentScore.toFixed(2)}`);
      if (fomoBoost > 0) extras.push(`FOMO=+${fomoBoost.toFixed(2)}`);
      if (squeezeSig) extras.push(`${squeezeSig.signal}(${Math.round(squeezeSig.probability * 100)}%)`);
      if (targetPrice && targetPrice !== res.customTarget) extras.push(`AimantLiq=${fmtPx(targetPrice)}`);
      if (shieldActive) extras.push("VOLATILITY_SHIELD(1.5xATR)");
      return {
        ...res,
        customTarget: targetPrice,
        regime,
        fomoBoostApplied: fomoBoost,
        thesis: `${res.thesis} [${extras.join(" · ")}]`,
      };
    };

    // Filtre Mean-Reversion prioritaire sur bords Value Area en range (uniquement si R:R vers POC >= 1.25)
    if (isRangeMarket && mp.vah > mp.val) {
      const stopBand = Math.max((snap.atr || px * 0.01) * 1.1, (mp.vah - mp.val) * 0.35);
      const rewardToPoc = Math.abs(px - mp.poc);
      if (px >= mp.vah && rewardToPoc >= stopBand * 1.25) {
        return withConfluence({
          dir: "short",
          playbook: "fade",
          thesis: `Market Profile Mean-Reversion : prix (${fmtPx(px)}) >= VAH (${fmtPx(mp.vah)}) en range -> retour ciblé sur POC (${fmtPx(mp.poc)}).`,
          customEntry: px,
          customStop: px + stopBand,
          customTarget: mp.poc,
        });
      }
      if (px <= mp.val && rewardToPoc >= stopBand * 1.25) {
        return withConfluence({
          dir: "long",
          playbook: "fade",
          thesis: `Market Profile Mean-Reversion : prix (${fmtPx(px)}) <= VAL (${fmtPx(mp.val)}) en range -> rebond ciblé sur POC (${fmtPx(mp.poc)}).`,
          customEntry: px,
          customStop: Math.max(px * 0.5, px - stopBand),
          customTarget: mp.poc,
        });
      }
    }

    // 0. Priorité absolue : Mode HFT FIAT-TARGET (KAMIKAZE) & Haute Agressivité
    const activeRegime = this.state.settings?.regime ?? "standard";
    const currentAgg = this.state.sessionGoal?.aggressiveness ?? "normal";
    if (activeRegime === "hft_kamikaze" || currentAgg === "lagging_aggressive") {
      const bestBid = p.bestBid ?? px * 0.9998;
      const bestAsk = p.bestAsk ?? px * 1.0002;
      const imbalance = p.book ?? (this.state.liquidityHunter?.imbalance ?? 0);
      const ofiZ = p.ofi ?? 0;
      const atr1m = snap.atr ? snap.atr * 0.1 : px * 0.001;
      const tapeRow = this.state.tape.find((r) => r.symbol === snap.symbol);
      const tickDelta = tapeRow && tapeRow.prev > 0 ? (tapeRow.px - tapeRow.prev) / tapeRow.prev : 0;
      const momentumHint = tickDelta !== 0 ? tickDelta : ret1h;

      const hftTrigger = StrategistAgent.evaluateHftBarrageEntry(
        snap.symbol,
        bestBid,
        bestAsk,
        imbalance,
        ofiZ,
        atr1m,
        currentAgg,
        activeRegime,
        momentumHint,
      );

      if (hftTrigger) {
        const microDist = hftTrigger.expectedMicroMove;
        const entryPx = hftTrigger.price;
        const stopPx = hftTrigger.side === "long" ? entryPx - microDist * 1.5 : entryPx + microDist * 1.5;
        const targetPx = hftTrigger.side === "long" ? entryPx + microDist * 2.0 : entryPx - microDist * 2.0;

        return withConfluence({
          dir: hftTrigger.side,
          playbook: "HFT_Kamikaze_FiatTarget",
          thesis: hftTrigger.thesis,
          customEntry: entryPx,
          customStop: stopPx,
          customTarget: targetPx,
          timeStopMs: 300_000,
          trailingAtr1m: atr1m,
        });
      }
    }

    // 1. Transformation du conflit analytique en opportunité (Liquidation_Cascade_Watch)
    if (snap.cascadeWatch?.active) {
      if (snap.fvgZone && snap.cascadeWatch.oiPurging) {
        const fvg = snap.fvgZone;
        const risk = Math.abs(fvg.midPrice - fvg.stopLevel);
        return withConfluence({
          dir: fvg.direction,
          playbook: "Macro_FVG_Mitigation",
          thesis: `Liquidation_Cascade_Watch : purge OI détectée (${fmtSignedPct(p.oiChange1h)}). Cassure tardive bloquée ; entrée LIMIT sur FVG 50%.`,
          customEntry: fvg.midPrice,
          customStop: fvg.stopLevel,
          customTarget: fvg.direction === "long" ? fvg.midPrice + 2.5 * risk : fvg.midPrice - 2.5 * risk,
          timeStopMs: 72 * 3600_000,
        });
      }
      return withConfluence({
        dir: funding > 0 ? "short" : "long",
        playbook: "fade",
        thesis: `Liquidation_Cascade_Watch : funding saturé (${fmtFunding(funding)}) + mouvement 1h (${fmtSignedPct(ret1h)}). Cassures bloquées, priorité au Fade.`,
      });
    }

    // 2. Moteur A : Scalping Microstructure (HFT_OrderFlow_Imbalance) — Horizon Tick / 1m
    const micro = snap.microstructure;
    if ((isAutoScalp || style === "scalping") && !this.sentinel.latencyHalted && micro && micro.spreadTicks <= 2.5) {
      if (micro.zOfi > ofiThresh && micro.volumeTickRatio >= 2.0) {
        const stopDist = Math.max(micro.atr1m * 0.5, px * 0.0015);
        return withConfluence({
          dir: "long",
          playbook: "HFT_OrderFlow_Imbalance",
          thesis: `Moteur A (HFT_OrderFlow_Imbalance) : Z_OFI=${micro.zOfi.toFixed(2)} > ${ofiThresh}, Vol=${micro.volumeTickRatio.toFixed(1)}x SMA20, Spread=${micro.spreadTicks.toFixed(1)} ticks.`,
          customEntry: px,
          customStop: px - stopDist,
          customTarget: px + stopDist * 1.8,
          timeStopMs: 120_000,
          trailingAtr1m: micro.atr1m * 0.5,
        });
      }
      if (micro.zOfi < -ofiThresh && micro.volumeTickRatio >= 2.0) {
        const stopDist = Math.max(micro.atr1m * 0.5, px * 0.0015);
        return withConfluence({
          dir: "short",
          playbook: "HFT_OrderFlow_Imbalance",
          thesis: `Moteur A (HFT_OrderFlow_Imbalance) : Z_OFI=${micro.zOfi.toFixed(2)} < -${ofiThresh}, Vol=${micro.volumeTickRatio.toFixed(1)}x SMA20, Spread=${micro.spreadTicks.toFixed(1)} ticks.`,
          customEntry: px,
          customStop: px + stopDist,
          customTarget: px - stopDist * 1.8,
          timeStopMs: 120_000,
          trailingAtr1m: micro.atr1m * 0.5,
        });
      }
    }

    // Règle VOLATILITY_SHIELD : suspendre le scalping non-OFI sous choc macro HIGH IMPACT (15 min)
    if (shieldActive && (isAutoScalp || style === "scalping")) {
      return null;
    }

    // 3. Moteur B : Day Trading Institutionnel (Session_VWAP_Reversion) — Horizon 15m / 1h
    const vw = snap.vwapContext;
    if (vw && !isAutoScalp) {
      if (vw.sweptHighReclaim && vw.rsi14 > 70) {
        const stop = Math.max(px + vw.atr15m * 1.5, vw.sd25Upper);
        return withConfluence({
          dir: "short",
          playbook: "Session_VWAP_Reversion",
          thesis: `Moteur B (Session_VWAP_Reversion ${vw.sessionName}) : Chasse IB_High (${fmtPx(vw.ibHigh)}) + réintégration sous VWAP+2.0 SD, RSI(14)=${vw.rsi14.toFixed(1)}.`,
          customEntry: px,
          customStop: stop,
          customTarget: vw.vwap,
          partialTpPrice: vw.sd1Upper,
          timeStopMs: 8 * 3600_000,
        });
      }
      if (vw.sweptLowReclaim && vw.rsi14 < 30) {
        const stop = Math.min(px - vw.atr15m * 1.5, vw.sd25Lower);
        return withConfluence({
          dir: "long",
          playbook: "Session_VWAP_Reversion",
          thesis: `Moteur B (Session_VWAP_Reversion ${vw.sessionName}) : Chasse IB_Low (${fmtPx(vw.ibLow)}) + réintégration sur VWAP-2.0 SD, RSI(14)=${vw.rsi14.toFixed(1)}.`,
          customEntry: px,
          customStop: stop,
          customTarget: vw.vwap,
          partialTpPrice: vw.sd1Lower,
          timeStopMs: 8 * 3600_000,
        });
      }
    }

    // 4. Moteur C : Swing Structurel & Macro (Macro_FVG_Mitigation) — Horizon 4h
    const fvg = snap.fvgZone;
    if (fvg && fvg.bosConfirmed && style === "longtrade") {
      const entryLim = fvg.midPrice;
      const risk = Math.max(Math.abs(entryLim - fvg.stopLevel), px * 0.008);
      const stop = fvg.direction === "long" ? entryLim - risk : entryLim + risk;
      const target = fvg.direction === "long" ? entryLim + 2.5 * risk : entryLim - 2.5 * risk;
      return withConfluence({
        dir: fvg.direction,
        playbook: "Macro_FVG_Mitigation",
        thesis: `Moteur C (Macro_FVG_Mitigation) : BOS 20 barres 4h + FVG (${fvg.sizeAtrRatio.toFixed(2)}x ATR). LIMIT 50% FVG @ ${fmtPx(entryLim)} (R:R 2.5R).`,
        customEntry: entryLim,
        customStop: stop,
        customTarget: target,
        timeStopMs: 72 * 3600_000,
      });
    }

    // 5. Nos 2 stratégies 4h de base conservées (Fade & Cassure de Canal) + confluence Sentiment/FOMO/RL
    if (funding > 0.00055 && ret1h > 0.004) {
      return withConfluence({
        dir: "short",
        playbook: "fade",
        thesis: "Contre-tendance des longs sur-levier : funding très positif et extension horaire épuisée.",
      });
    }
    if (funding < -0.00055 && ret1h < -0.004) {
      return withConfluence({
        dir: "long",
        playbook: "fade",
        thesis: "Contre-tendance des shorts encombrés : funding négatif payant les acheteurs et soutien du carnet.",
      });
    }
    if (snap.channelHi && px >= snap.channelHi * 0.995) {
      return withConfluence({
        dir: "long",
        playbook: "breakout",
        thesis: "Cassure haussière du canal 4h soutenue par le flux 1h et la 2e source.",
      });
    }
    if (snap.channelLo && px <= snap.channelLo * 1.005) {
      return withConfluence({
        dir: "short",
        playbook: "breakout",
        thesis: "Cassure baissière du support 4h confirmée sur les deux plateformes.",
      });
    }
    if (Math.abs(ret1h) >= 0.003) {
      return withConfluence({
        dir: ret1h >= 0 ? "long" : "short",
        playbook: "breakout",
        thesis: `Impulsion directionnelle (${fmtSignedPct(ret1h)}) validée par le carnet et la 2e source.`,
      });
    }
    if (directiveForcesMeanRev) {
      const mrDir: Direction = px >= mp.poc ? "short" : "long";
      return withConfluence({
        dir: mrDir,
        playbook: "fade",
        thesis: `Directive Reviewer Mean-Reversion (${fmtPx(px)} vs POC ${fmtPx(mp.poc)}) : retour à la moyenne dans Value Area [${fmtPx(mp.val)} - ${fmtPx(mp.vah)}].`,
        customTarget: mp.poc,
      });
    }
    const socialBias = sentimentScore + (fomoLong - fomoShort);
    const defaultDir: Direction =
      Math.abs(socialBias) > 0.2 ? (socialBias >= 0 ? "long" : "short") : (snap.ret24h ?? 0) >= 0 ? "long" : "short";
    return withConfluence({
      dir: defaultDir,
      playbook: "breakout",
      thesis: "Alignement de tendance 4h et confirmation multi-sources Binance / Bybit.",
    });
  }

  private nextTicketId(now: number): string {
    const d = ticketDay(now, this.cfg.timeZone);
    this.state.seq = this.state.seqDay === d ? this.state.seq + 1 : 1;
    this.state.seqDay = d;
    return `TF-${d}-${String(this.state.seq).padStart(2, "0")}`;
  }

  async runDeskScan(trigger: "manual" | "scheduled" | "initial" = "manual"): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const now = Date.now();
      this.state.lastScanAt = now;

      if (this.state.halted) {
        setAgentActivity(this.state, "risk", "veto", "Desk à l'arrêt (Halt actif)", now);
        await this.say(
          "risk",
          this.state.haltKind === "loss"
            ? "Scan refusé : la limite de perte journalière a été atteinte. Le desk reste à plat jusqu'à demain."
            : "Scan refusé : arrêt d'exercice (Halt Drill) actif. Utilisez le bouton « Reprendre le Desk » ou tapez « reprendre ».",
          "veto",
        );
        return;
      }

      if (this.sentinel.latencyHalted) {
        setAgentActivity(
          this.state,
          "sentinel",
          "veto",
          `LATENCE ${this.sentinel.rollingRttMs}ms : Ordres Market HFT bloqués (Mode LIMIT actif)`,
          now,
        );
      }

      const existingPending = this.state.tickets.find((t) => t.status === "pending");
      if (existingPending && trigger !== "initial") {
        if (this.state.settings.executionMode === "auto" || Boolean(this.state.settings.autoPaperScalp)) {
          await this.approveTicket(existingPending.id);
        } else {
          await this.say(
            "lead",
            `Le ticket ${existingPending.id} (${existingPending.asset}) attend déjà votre décision. Répondez « approuver ${existingPending.id} » ou « rejeter ${existingPending.id} » avant de relancer un scan.`,
          );
          return;
        }
      }

      setAgentActivity(this.state, "lead", "scanning", "Coordination du scan multi-marchés", now, {
        targetAgent: "analyst",
      });
      emitPulse(this.state, "lead", "analyst", "flag", "Scan lancé", undefined, now);

      setAgentActivity(this.state, "analyst", "scanning", "Lecture Binance + Bybit (2e source)", now);
      const snaps = await this.refreshTape();

      const openCount = this.state.tickets.filter((t) => t.status === "open").length;
      const isScalp =
        Boolean(this.state.settings.autoPaperScalp) ||
        this.state.settings.executionMode === "auto" ||
        this.state.settings.tradingStyle === "scalping";

      // Dynamic Concurrency Calculator (Risk Manager Agent)
      const eq = currentEquity(this.state);
      const marginUsed = this.state.tickets
        .filter((t) => t.status === "open")
        .reduce((sum, t) => sum + t.notional / Math.max(1, t.leverage ?? 1), 0);
      const availableMargin = Math.max(0, eq - marginUsed);
      const activeRegime = this.state.settings?.regime ?? "standard";
      const currentAgg = this.state.sessionGoal?.aggressiveness ?? "normal";

      const maxConcurrent = RiskManagerAgent.calculateDynamicConcurrency(
        availableMargin,
        eq,
        0.02,
        currentAgg,
        activeRegime,
      );

      if (openCount >= maxConcurrent) {
        if (now - this.lastConcurrencySayAt >= 600_000) {
          this.lastConcurrencySayAt = now;
          await this.say(
            "lead",
            `${openCount} position(s) ouverte(s) (plafond dynamique de ${maxConcurrent} atteint). Surveillance Hard SL/TP et ActiveTradeManager en cours.`,
          );
        }
        return;
      }

      const notCooledDown = (sym: string) => (this.state.cooldowns?.[sym] ?? 0) <= now;
      const hasActiveTicket = (sym: string) =>
        this.state.tickets.some((t) => t.asset === sym && (t.status === "open" || t.status === "pending"));
      const pool = snaps.filter((s) => notCooledDown(s.symbol) && !hasActiveTicket(s.symbol));
      if (!pool.length) {
        await this.say("analyst", "Tous les actifs sont en période de cooldown ou déjà en position.");
        return;
      }

      const activeStyle = isScalp ? "scalping" : (this.state.settings.tradingStyle || "daytrade");
      const tf: "15m" | "1h" | "4h" = activeStyle === "scalping" ? "15m" : activeStyle === "daytrade" ? "1h" : "4h";
      const startIdx = this.scanCursor % pool.length;
      this.scanCursor = (this.scanCursor + 1) % pool.length;
      const orderedPool = [...pool.slice(startIdx), ...pool.slice(0, startIdx)];

      let selectedSnap: MarketSnapshot | null = null;
      let selectedBars = [] as MarketSnapshot["bars4h"];
      let selectedBt: ReturnType<typeof runBacktestOnBars> | null = null;
      let selectedPlaybook: PlayKind = "breakout";
      let selectedDir: Direction = "long";
      let selectedThesis = "";
      let selectedIdea: NonNullable<ReturnType<TradingFloorDesk["choosePlay"]>> | null = null;
      let selectedCheck: ReturnType<typeof verifySecondSource> | null = null;
      let fallbackKilled: {
        snap: MarketSnapshot;
        bt: ReturnType<typeof runBacktestOnBars>;
        playbook: PlayKind;
        check: ReturnType<typeof verifySecondSource>;
      } | null = null;

      let bestAlphaScore = -Infinity;
      const candidatesEvaluatedLimit = Math.min(orderedPool.length, 10);
      let evaluatedCount = 0;

      for (const candidate of orderedPool) {
        if (evaluatedCount >= candidatesEvaluatedLimit) break;
        if (!candidate || !candidate.primary) continue;
        const check = verifySecondSource(candidate);
        if (!check.verified && trigger === "scheduled" && !isScalp) {
          continue;
        }

        const idea = this.choosePlay(candidate);
        if (!idea) continue;

        // VÉRIFICATION STRICTE ANTI-DEATH-LOOP DIRECTIONNELLE
        const dirKey = `${candidate.symbol}:${idea.dir}`;
        const dirCool = this.state.directionalCooldowns?.[dirKey] ?? this.state.directionalCooldowns?.[candidate.symbol];
        if (dirCool && dirCool.until > now && dirCool.bannedDir === idea.dir) {
          const remMin = Math.ceil((dirCool.until - now) / 60_000);
          await this.say(
            "risk",
            `[VETO ANTI-DEATH-LOOP] ${candidate.symbol} ${idea.dir.toUpperCase()} interdit (Stop Loss récent). Cooldown actif encore ${remMin} min. Modèle en quarantaine directionnelle.`,
            "veto",
          );
          continue;
        }

        const macroEval = MarketAnalystAgent.computeMacroScore(
          candidate.symbol,
          this.state.macroEvents ?? [],
          this.state.socialSentiment ?? {},
          now,
        );
        if (!MarketAnalystAgent.allowsDirection(idea.dir, macroEval.macroScore)) {
          await this.say(
            "analyst",
            `[MACRO FILTER] ${candidate.symbol} ${idea.dir.toUpperCase()} bloqué (${macroEval.reason} contre la tendance fondamentale).`,
            "plain",
          );
          continue;
        }

        let activeBars = candidate.bars4h;
        if (candidate.symbol.endsWith("USDT") && (activeStyle === "scalping" || activeStyle === "daytrade")) {
          try {
            const tfBars = await fetchBinanceKlines(candidate.symbol, tf, 500);
            if (tfBars.length >= 80) activeBars = tfBars;
          } catch {
            // Repli automatique sur candidate.bars4h si Binance 15m/1h échoue
          }
        }
        if (activeBars.length < 60) continue;
        evaluatedCount++;

        const thresholds = {
          minTrades90d: this.state.settings.minBacktestTrades90d,
          minTradesOos: this.state.settings.minOosTrades30d,
          minExpectancyR: this.state.settings.minExpectancyR,
        };
        const customParams = {
          lookback: this.state.settings.trainedLookback,
          atrMult: this.state.settings.trainedAtrMult,
          rewardR: this.state.settings.trainedRewardR,
          ofiZScoreThreshold: this.state.settings.ofiZScoreThreshold,
          fixedStopAtr: this.state.settings.fixedStopAtr,
          fvgMinSizeAtr: this.state.settings.fvgMinSizeAtr,
          style: activeStyle,
          symbol: candidate.symbol,
          autoOptimize: true,
          scalpRelaxed: isScalp,
        };

        let bt = runBacktestOnBars(
          activeBars,
          idea.playbook,
          `${candidate.primary.venue} ${tf} (${activeBars.length} barres)`,
          thresholds,
          customParams,
        );
        let activePlaybook = bt.playbook;
        if (!bt.pass) {
          const altPlay: PlayKind = idea.playbook === "breakout" ? "fade" : "breakout";
          const altBt = runBacktestOnBars(
            activeBars,
            altPlay,
            `${candidate.primary.venue} ${tf} (${activeBars.length} barres)`,
            thresholds,
            customParams,
          );
          if (altBt.pass) {
            bt = altBt;
            activePlaybook = altBt.playbook;
          }
        }

        if (bt.pass) {
          const curRegime = idea.regime ?? "MEAN_REVERTING";
          const rlWeight = this.grpo.getStrategyWeight(curRegime, activePlaybook);
          const alphaScore =
            bt.outOfSample.expectancyR * 1.4 +
            Math.min(2, Math.max(0, bt.outOfSample.profitFactor - 1)) * 0.6 +
            (bt.outOfSample.deflatedSharpe ?? 0.5) * 0.8 +
            rlWeight * 0.75 +
            (idea.fomoBoostApplied ?? 0);
          if (alphaScore > bestAlphaScore) {
            bestAlphaScore = alphaScore;
            selectedSnap = candidate;
            selectedBars = activeBars;
            selectedBt = bt;
            selectedPlaybook = activePlaybook;
            selectedDir = idea.dir;
            selectedThesis = idea.thesis;
            selectedIdea = idea;
            selectedCheck = check;
          }
        } else if (!fallbackKilled) {
          fallbackKilled = { snap: candidate, bt, playbook: activePlaybook, check };
        }
      }

      if (!selectedSnap || !selectedBt || !selectedCheck) {
        const chosen = fallbackKilled?.snap ?? orderedPool.find((s) => s && s.primary) ?? null;
        if (!chosen || !chosen.primary) {
          await this.say("analyst", "Aucun flux exploitable reçu des API publiques. Aucune proposition de trade.");
          return;
        }
        const p = chosen.primary;
        const s = chosen.secondary;
        const check = fallbackKilled?.check ?? verifySecondSource(chosen);
        const bt = fallbackKilled?.bt;
        const activePlaybook = fallbackKilled?.playbook ?? "breakout";

        const analystFallback = `[${chosen.symbol}] ${p.venue} ${fmtPx(p.price)} (1h ${fmtSignedPct(p.ret1h)}, 24h ${fmtSignedPct(chosen.ret24h)}) · Funding ${fmtFunding(p.funding)} · OI ${fmtCompactUsd(p.oiValue)} (${fmtSignedPct(p.oiChange1h)}) · Déséquilibre carnet ${(p.book ?? 0).toFixed(2)}${s ? ` | 2e source ${s.venue} : ${fmtPx(s.price)}` : ""}. — Données et contexte uniquement, je ne propose aucun trade.`;
        await this.speakWithAgentPrompt(
          "analyst",
          `Actif=${chosen.symbol}, Prix1=${p.venue} ${fmtPx(p.price)}, Variation1h=${fmtSignedPct(p.ret1h)}, Variation24h=${fmtSignedPct(chosen.ret24h)}, Verification2eSource=${check.reason}. Rappel : ne propose aucun trade.`,
          analystFallback,
        );

        if (bt) {
          this.state.nonce += 1;
          this.state.killed = [
            {
              id: `k${this.state.nonce}`,
              at: now,
              asset: chosen.symbol,
              playbook: activePlaybook,
              reason: bt.killReason ?? "Échec backtest / OOS sur l'ensemble du pool",
              backtest: bt,
            },
            ...this.state.killed.slice(0, 39),
          ];
          setAgentActivity(this.state, "strategist", "killed", `Idées rejetées (meilleur: ${chosen.symbol})`, now, {
            targetAgent: "reviewer",
            asset: chosen.symbol,
          });
          emitPulse(this.state, "strategist", "reviewer", "backtest_kill", `IDÉE TUÉE ${chosen.symbol}`, chosen.symbol, now);

          const killFallback = `IDÉE TUÉE [${chosen.symbol} · ${activePlaybook === "breakout" ? "Cassure" : "Contre-tendance"} (${tf})]. ${bt.killReason} (In-Sample : ${bt.inSample.trades} trades, ${fmtPct(bt.inSample.winRate, 0)} gagnants, ${fmtR(bt.inSample.expectancyR)} | OOS : ${bt.outOfSample.trades} trades, ${fmtR(bt.outOfSample.expectancyR)}). Aucune paire du pool n'a validé les critères.`;
          await this.speakWithAgentPrompt(
            "strategist",
            `Décision=IDÉE TUÉE, Actif=${chosen.symbol}, Setup=${activePlaybook}, Motif=${bt.killReason}.`,
            killFallback,
            "kill",
          );
          await this.say(
            "reviewer",
            `Rejet statistique sur ${chosen.symbol} archivé dans le registre des idées tuées. Aucun ticket émis.`,
            "kill",
          );
        } else {
          await this.say("lead", "Aucun signal confirmé sur les actifs scannés. Veille maintenue.");
        }
        return;
      }

      const chosen = selectedSnap;
      const p = chosen.primary!;
      const s = chosen.secondary;
      const check = selectedCheck;
      const bt = selectedBt;
      const activePlaybook = selectedPlaybook;
      const activeDir = selectedDir;
      const activeThesis = selectedThesis;

      setAgentActivity(this.state, "analyst", "verifying", `Vérification 2e source sur ${chosen.symbol}`, now, {
        targetAgent: "strategist",
        asset: chosen.symbol,
      });

      const analystFallback = `[${chosen.symbol}] ${p.venue} ${fmtPx(p.price)} (1h ${fmtSignedPct(p.ret1h)}, 24h ${fmtSignedPct(chosen.ret24h)}) · Funding ${fmtFunding(p.funding)} · OI ${fmtCompactUsd(p.oiValue)} (${fmtSignedPct(p.oiChange1h)}) · Déséquilibre carnet ${(p.book ?? 0).toFixed(2)}${s ? ` | 2e source ${s.venue} : ${fmtPx(s.price)} (funding ${fmtFunding(s.funding)})` : ""}. ${chosen.onchain ?? ""} — Données et contexte uniquement, je ne propose aucun trade.`;

      await this.speakWithAgentPrompt(
        "analyst",
        `Actif=${chosen.symbol}, Prix1=${p.venue} ${fmtPx(p.price)}, Variation1h=${fmtSignedPct(p.ret1h)}, Variation24h=${fmtSignedPct(chosen.ret24h)}, Funding=${fmtFunding(p.funding)}, OpenInterest=${fmtCompactUsd(p.oiValue)} (${fmtSignedPct(p.oiChange1h)}), Carnet=${(p.book ?? 0).toFixed(2)}, Source2=${s ? `${s.venue} ${fmtPx(s.price)}` : "indisponible"}, Verification2eSource=${check.reason}. Rappel obligatoire : ne propose aucun trade.`,
        analystFallback,
      );

      emitPulse(this.state, "analyst", "strategist", "confirm", `${chosen.symbol} vérifié 2 sources`, chosen.symbol, now);

      setAgentActivity(
        this.state,
        "strategist",
        "backtesting",
        `Backtest ${tf} + OOS sur ${chosen.symbol}`,
        now,
        { targetAgent: "risk", asset: chosen.symbol },
      );

      const entry = selectedIdea?.customEntry ?? p.price;
      const recentAtrBars = selectedBars.slice(-15, -1);
      const localAtr = recentAtrBars.length
        ? recentAtrBars.reduce((sum, b) => sum + (b.high - b.low), 0) / recentAtrBars.length
        : chosen.atr;
      const slMode = this.state.settings?.slMode ?? "atr";
      const rawSlVal = Number(this.state.settings?.slVal ?? 0);
      const effectiveAtrSetting =
        slMode === "atr" && rawSlVal > 0 && rawSlVal < 10
          ? rawSlVal
          : (this.state.settings.fixedStopAtr || this.state.settings.trainedAtrMult || (isScalp ? 0.85 : 1.4));
      const atrMult = isScalp ? effectiveAtrSetting : Math.max(0.75, effectiveAtrSetting);
      const macroShieldApplied = this.isVolatilityShieldActive(now);
      let stopDist: number;
      let rewardMult: number;
      if (slMode === "pips" && rawSlVal > 0) {
        stopDist = rawSlVal * pipSizeForAsset(chosen.symbol, entry);
        rewardMult = this.state.settings.trainedRewardR || 2.0;
      } else if (slMode === "pct" && rawSlVal > 0) {
        stopDist = entry * (rawSlVal / 100);
        rewardMult = this.state.settings.trainedRewardR || 2.0;
      } else if (isScalp) {
        const rawDist = localAtr ? localAtr * Math.min(atrMult, 0.85) : entry * 0.0025;
        stopDist = Math.min(entry * 0.0045, Math.max(entry * 0.0015, rawDist));
        rewardMult = Math.min(Math.max(this.state.settings.trainedRewardR || 1.5, 1.3), 1.8);
      } else {
        const rawDist = localAtr ? localAtr * atrMult : entry * 0.025;
        stopDist = Math.min(entry * 0.06, Math.max(entry * 0.008, rawDist));
        rewardMult = this.state.settings.trainedRewardR || (activePlaybook === "breakout" ? 2.0 : 1.6);
      }
      if (macroShieldApplied) {
        const shieldAtrPad = (localAtr || chosen.atr || entry * 0.008) * 1.5;
        stopDist = Math.min(entry * 0.2, stopDist + shieldAtrPad);
      }
      const invalidation =
        selectedIdea?.customStop && !macroShieldApplied
          ? selectedIdea.customStop
          : activeDir === "long"
            ? entry - stopDist
            : entry + stopDist;
      const actualStopDist = Math.abs(entry - invalidation);
      const target =
        selectedIdea?.customTarget && !macroShieldApplied
          ? selectedIdea.customTarget
          : activeDir === "long"
            ? entry + actualStopDist * rewardMult
            : entry - actualStopDist * rewardMult;

      emitPulse(this.state, "strategist", "risk", "backtest_pass", `${tf} + WFO Purgé validés (${chosen.symbol})`, chosen.symbol, now);

      const dsrPct = ((bt.outOfSample.deflatedSharpe ?? 0.5) * 100).toFixed(0);
      const stratPassFallback = `Setup validé [${activePlaybook}] : ${chosen.symbol} ${activeDir.toUpperCase()} (${tf}). ${activeThesis} Entrée ${fmtPx(entry)} · Invalidation ${fmtPx(invalidation)} (${fmtPct(actualStopDist / entry, 2)}) · Cible ${fmtPx(target)}. WFO Purgé IS : ${bt.inSample.trades} tr (${fmtR(bt.inSample.expectancyR)}) | OOS : ${bt.outOfSample.trades} tr (${fmtR(bt.outOfSample.expectancyR)}, PF ${bt.outOfSample.profitFactor.toFixed(2)}, DSR ${dsrPct}%).`;

      const chosenMp = chosen.marketProfile;
      const mpFact = chosenMp ? `, MarketProfile=(POC=${fmtPx(chosenMp.poc)}, VAH=${fmtPx(chosenMp.vah)}, VAL=${fmtPx(chosenMp.val)}, Range=${chosenMp.isRange})` : "";
      const dirFact = this.current_market_regime_directive ? `, Directive15m=${this.current_market_regime_directive}` : "";

      await this.speakWithAgentPrompt(
        "strategist",
        `Décision=VALIDÉ, Moteur=${activePlaybook}, Actif=${chosen.symbol}, Direction=${activeDir.toUpperCase()}, Thèse=${activeThesis}, Entrée=${fmtPx(entry)}, Invalidation=${fmtPx(invalidation)}, Cible=${fmtPx(target)}, WFO_OOS=${bt.outOfSample.trades} trades (${fmtR(bt.outOfSample.expectancyR)}, PF=${bt.outOfSample.profitFactor.toFixed(2)}, DSR=${dsrPct}%)${mpFact}${dirFact}.`,
        stratPassFallback,
      );

      setAgentActivity(this.state, "risk", "sizing", `Kelly + Levier + LiqGuard sur ${chosen.symbol}`, now, {
        targetAgent: "lead",
        asset: chosen.symbol,
      });

      const isKamikazeTrade = activePlaybook === "HFT_Kamikaze_FiatTarget" || this.state.settings?.regime === "hft_kamikaze";
      const targetLev = isKamikazeTrade ? 500 : (this.state.settings.defaultLeverage ?? 5);

      const sized = computeLeveragedSizing(this.state, entry, invalidation, bt, {
        side: activeDir,
        leverageFactor: targetLev,
        maintenanceMarginRate: this.state.settings.maintenanceMarginRate ?? 0.005,
        takerFee: 0.0004,
        expectedSlippage: 0.0002,
        autoReduceLeverage: true,
        playbook: activePlaybook,
        targetFiatProfit: 75,
        atr1m: selectedIdea?.trailingAtr1m,
      });
      if (!sized.ok || !sized.notional || !sized.qty || !sized.riskUsd || sized.riskPct === undefined || sized.exposurePct === undefined || !sized.binding) {
        setAgentActivity(this.state, "risk", "veto", `Veto sur ${chosen.symbol}`, now, { asset: chosen.symbol });
        emitPulse(this.state, "risk", "lead", "veto", `VETO ${chosen.symbol}`, chosen.symbol, now);
        await this.say("risk", sized.reason ?? "Veto Liquidation Guard.", "veto");
        await this.say(
          "lead",
          "Le veto du Directeur des Risques est souverain. Aucun ticket n'est émis, et je ne vous réveille pas pour un plafond de risque.",
        );
        return;
      }

      // Garde-fou frais aller-retour (hors HFT Kamikaze qui a déjà son propre plafond) :
      // empêche un stop ultra-serré de générer un notionnel où les frais mangent > 30% du budget de risque.
      if (!isKamikazeTrade) {
        const estRoundTripFees = sized.notional * 0.0008;
        const maxSafeFees = Math.max(2, sized.riskUsd * 0.30);
        if (estRoundTripFees > maxSafeFees) {
          const capFactor = maxSafeFees / estRoundTripFees;
          sized.notional = Number((sized.notional * capFactor).toFixed(2));
          sized.qty = Number((sized.notional / Math.max(entry, 1e-9)).toFixed(6));
          sized.riskUsd = Number((sized.notional * (actualStopDist / Math.max(entry, 1e-9))).toFixed(2));
          sized.riskPct = sized.riskUsd / Math.max(currentEquity(this.state), 1);
          sized.exposurePct = sized.notional / Math.max(currentEquity(this.state), 1);
        }
      }

      const isFullAuto = this.state.settings.executionMode === "auto" || isScalp;
      let finalTarget = target;
      const tpMode = this.state.settings?.tpMode ?? "rr";
      const tpVal = Number(this.state.settings?.tpVal ?? 0);
      if (!macroShieldApplied && !selectedIdea?.customTarget && tpVal > 0) {
        if (tpMode === "rr") {
          finalTarget = activeDir === "long" ? entry + actualStopDist * tpVal : entry - actualStopDist * tpVal;
        } else if (tpMode === "pct") {
          const d = entry * (tpVal / 100);
          finalTarget = activeDir === "long" ? entry + d : entry - d;
        } else if (tpMode === "pips") {
          const d = tpVal * pipSizeForAsset(chosen.symbol, entry);
          finalTarget = activeDir === "long" ? entry + d : entry - d;
        } else if (tpMode === "amount" && sized.notional > 0) {
          const d = (tpVal / sized.notional) * entry;
          finalTarget = activeDir === "long" ? entry + d : entry - d;
        }
      }

      let finalStop = invalidation;
      if (!macroShieldApplied && !selectedIdea?.customStop && slMode === "amount" && rawSlVal > 0 && sized.notional > 0) {
        const d = (rawSlVal / sized.notional) * entry;
        finalStop = activeDir === "long" ? entry - d : entry + d;
      }

      const id = this.nextTicketId(now);
      const currentRegime = selectedIdea?.regime ?? this.grpo.classifyRegime({
        ret24h: chosen.ret24h ?? 0,
        cascadeActive: Boolean(chosen.cascadeWatch?.active),
        atrPct: (chosen.atr || entry * 0.015) / Math.max(entry, 1e-9),
      });
      const ticket: Ticket = {
        id,
        asset: chosen.symbol,
        direction: activeDir,
        playbook: activePlaybook,
        engine: activePlaybook,
        thesis: activeThesis,
        entry,
        invalidation: finalStop,
        target: finalTarget,
        timeStopHours: activePlaybook === "HFT_Kamikaze_FiatTarget"
          ? 0.083
          : activePlaybook === "HFT_OrderFlow_Imbalance"
            ? 0.033
            : activePlaybook === "Session_VWAP_Reversion"
              ? 8
              : activePlaybook === "Macro_FVG_Mitigation"
                ? 72
                : 120,
        timeStopMs: selectedIdea?.timeStopMs,
        partialTpPrice: selectedIdea?.partialTpPrice,
        trailingStop: selectedIdea?.trailingAtr1m ? invalidation : undefined,
        leverage: sized.leverage ?? 1,
        liqPrice: sized.liqPrice,
        maxAdverseExcursion: 0,
        fomoBoostApplied: (selectedIdea?.fomoBoostApplied ?? this.getActiveFomoBoost(chosen.symbol, activeDir, now)) > 0,
        macroShieldApplied,
        regime: currentRegime,
        dsrScore: bt.outOfSample.deflatedSharpe,
        kellyRiskPct: sized.riskPct,
        notional: sized.notional,
        qty: sized.qty,
        mt5Lots: Mt5CloudBridge.computeAssetLots(chosen.symbol, sized.notional, entry, sized.qty),
        riskUsd: sized.riskUsd,
        riskPct: sized.riskPct,
        exposurePct: sized.exposurePct,
        binding: sized.binding,
        producedBy: PRODUCED_BY,
        backtest: bt,
        status: "pending",
        createdAt: now,
        expiresAt: now + this.cfg.ticketTtlMin * 60_000,
        fees: 0,
        funding: 0,
        setupGrade: (bt.outOfSample.deflatedSharpe ?? 0) >= 0.6 ? "A+" : "A",
        sessionName: this.state.onOvernight ? "Quart de Nuit" : "Session Jour",
        journalTags: [activePlaybook, "WFO Purgé", `DSR ${dsrPct}%`, `${sized.leverage ?? 1}x`],
        journalNotes: activeThesis,
      };

      this.state.tickets = [ticket, ...this.state.tickets];
      this.store.appendBlotter("TICKET_ISSUED", ticket, "Ticket émis par les moteurs quantitatifs", now);

      emitPulse(this.state, "risk", "lead", "sized", `Kelly ${fmtPct(sized.riskPct, 2)} (${sized.leverage}x) → ${fmtUsd(ticket.notional, 0)}`, ticket.asset, now);

      const riskFallback = `Kelly Fractionné (DSR ${dsrPct}% · Levier ${sized.leverage}x · Liq ${fmtPx(sized.liqPrice ?? 0)}) pour ${ticket.id} : Taille ${fmtUsd(ticket.notional, 0)} (${fmtPct(ticket.exposurePct, 1)} exposition, contrainte : ${ticket.binding}). Risque au stop : ${fmtUsd(ticket.riskUsd, 0)} (${fmtPct(ticket.riskPct, 2)} du capital).`;

      await this.speakWithAgentPrompt(
        "risk",
        `Ticket=${ticket.id}, KellyRisque=${fmtPct(ticket.riskPct, 2)}, Taille=${fmtUsd(ticket.notional, 0)}, Exposition=${fmtPct(ticket.exposurePct, 1)}, DSR=${dsrPct}%.`,
        riskFallback,
      );

      setAgentActivity(this.state, "lead", isFullAuto ? "executing" : "awaiting_human", isFullAuto ? `Ticket ${ticket.id} validé (Full Auto)` : `Ticket ${ticket.id} soumis à votre décision`, now, {
        asset: ticket.asset,
      });
      emitPulse(this.state, "lead", "human", "ticket", `Ticket ${ticket.id}`, ticket.asset, now);

      const ticketMsg = [
        `📋 NOUVEAU TICKET ${ticket.id} (${isFullAuto ? "FULL AUTO PAPER" : "CONFIRMATION HUMAINE REQUISE"})`,
        `• Actif : ${ticket.asset} | Moteur : ${activePlaybook}`,
        `• Direction : ${ticket.direction === "long" ? "LONG (Achat)" : "SHORT (Vente)"}`,
        `• Taille : ${fmtUsd(ticket.notional, 0)} (${ticket.qty.toFixed(4)} ${ticket.asset.replace("USDT", "")} · risque Kelly ${fmtUsd(ticket.riskUsd, 0)} / ${fmtPct(ticket.riskPct, 2)})`,
        `• Entrée : ${fmtPx(ticket.entry)}`,
        `• Invalidation (Stop) : ${fmtPx(ticket.invalidation)} (Cible : ${fmtPx(ticket.target)})`,
        `• Produit par : ${PRODUCED_BY_LABEL}`,
        isFullAuto
          ? `Mode FULL AUTO actif : transmission immédiate au Trader d'Exécution.`
          : `Répondez uniquement avec l'ID exact : « approuver ${ticket.id} » ou « rejeter ${ticket.id} ».`,
      ].join("\n");

      await this.say("lead", ticketMsg, "ticket", ticket.id);

      setAgentActivity(this.state, "reviewer", "logging", `Ticket ${ticket.id} journalisé`, now, {
        asset: ticket.asset,
      });
      await this.say(
        "reviewer",
        `Ticket ${ticket.id} inscrit au Journal de Trading (statut : En attente). ${isFullAuto ? "Mode Full Auto actif : exécution PAPER immédiate." : "Aucune exécution sans votre validation par ID exact."}`,
        "plain",
        ticket.id,
      );

      if (isFullAuto) {
        await this.approveTicket(ticket.id);
      }
    } finally {
      this.busy = false;
      this.broadcast();
    }
  }

  async approveTicket(id: string): Promise<void> {
    const now = Date.now();
    const ticket = this.state.tickets.find((t) => t.id.toUpperCase() === id.toUpperCase());
    if (!ticket) {
      await this.say("execution", `Aucun ticket trouvé avec l'identifiant ${id}. Je n'exécute jamais un ordre approximatif.`);
      return;
    }
    if (ticket.status !== "pending") {
      await this.say("execution", `Refusé : le ticket ${ticket.id} est déjà au statut « ${ticket.status} ».`);
      return;
    }
    if (this.state.halted) {
      await this.say("execution", `Refusé : le desk est en arrêt (Halt). Impossible d'exécuter ${ticket.id}.`, "veto");
      return;
    }
    if (now > ticket.expiresAt) {
      ticket.status = "expired";
      ticket.decidedAt = now;
      this.store.appendBlotter("TICKET_EXPIRED", ticket, "Ticket expiré avant exécution", now);
      await this.say("execution", `Le ticket ${ticket.id} a expiré. Relancez un scan pour obtenir un prix actualisé.`);
      return;
    }

    if (this.sentinel.latencyHalted && ticket.playbook === "HFT_OrderFlow_Imbalance") {
      await this.say(
        "sentinel",
        `Refus EXECUTION_HALTED_LATENCY (Ordre Market HFT) sur ${ticket.id} : RTT API ${this.sentinel.rollingRttMs}ms > 150ms.`,
        "veto",
        ticket.id,
      );
      return;
    }

    const recheck = computeLeveragedSizing(this.state, ticket.entry, ticket.invalidation, ticket.backtest, {
      side: ticket.direction,
      leverageFactor: ticket.leverage ?? this.state.settings.defaultLeverage ?? 5,
      maintenanceMarginRate: this.state.settings.maintenanceMarginRate ?? 0.005,
      takerFee: 0.0004,
      expectedSlippage: 0.0002,
      autoReduceLeverage: true,
    });
    if (!recheck.ok) {
      ticket.status = "vetoed";
      ticket.vetoReason = recheck.reason ?? "Veto Liquidation Guard.";
      ticket.decidedAt = now;
      this.store.appendBlotter("TICKET_VETOED", ticket, ticket.vetoReason, now);
      await this.say("risk", `Veto immédiat sur ${ticket.id} : ${ticket.vetoReason}`, "veto", ticket.id);
      return;
    }

    const liveMark = markPriceOf(this.state, ticket.asset, ticket.entry);
    const fillPrice = liveMark > 0 ? liveMark : ticket.entry;
    const feeUsd = ticket.notional * 0.0004;

    ticket.status = "open";
    ticket.decidedAt = now;
    ticket.filledAt = now;
    ticket.fillPrice = fillPrice;
    ticket.fees = feeUsd;
    const hardBounds = ActiveTradeManager.ensureHardStopAndTarget(ticket);

    let mt5Note = "";
    if (this.state.settings.mt5Enabled && this.mt5.isConfigured()) {
      const lotsToSend = ticket.mt5Lots && ticket.mt5Lots > 0
        ? ticket.mt5Lots
        : Mt5CloudBridge.computeAssetLots(ticket.asset, ticket.notional, ticket.fillPrice || ticket.entry, ticket.qty);
      const mt5Res = await this.mt5.openMarketOrder({
        symbol: ticket.asset,
        direction: ticket.direction,
        lots: lotsToSend,
        stopLoss: hardBounds.stopLoss,
        takeProfit: hardBounds.takeProfit,
        comment: ticket.id,
      });
      if (mt5Res.ok && mt5Res.positionId) {
        ticket.mt5PositionId = mt5Res.positionId;
      }
      mt5Note = ` | 📱 ${mt5Res.message}`;
    }
    this.updateExecutionTraderState(now);

    setAgentActivity(this.state, "execution", "executing", `Exécution ${ticket.id}${ticket.mt5PositionId ? " + MT5" : ""}`, now, {
      targetAgent: "reviewer",
      asset: ticket.asset,
    });
    emitPulse(this.state, "human", "execution", "approve", `Approuvé ${ticket.id}`, ticket.asset, now);
    emitPulse(this.state, "execution", "reviewer", "fill", `Exécuté PAPER ${ticket.id}`, ticket.asset, now);

    this.store.appendBlotter("POSITION_OPENED", ticket, `Exécuté en PAPER à ${fmtPx(fillPrice)}${mt5Note}`, now);

    const execFallback = `Ordre exécuté : ${ticket.id} · ${ticket.asset} ${ticket.direction.toUpperCase()} ${fmtUsd(ticket.notional, 0)} @ ${fmtPx(fillPrice)} (frais ${fmtUsd(feeUsd, 2)})${mt5Note}.`;

    await this.speakWithAgentPrompt(
      "execution",
      `Action=EXÉCUTÉ EN MODE PAPER, Ticket=${ticket.id}, Actif=${ticket.asset}, Direction=${ticket.direction}, Taille=${fmtUsd(ticket.notional, 0)}, PrixFill=${fmtPx(fillPrice)}, Frais=${fmtUsd(feeUsd, 2)}.`,
      execFallback,
      "fill",
      ticket.id,
    );

    setAgentActivity(this.state, "reviewer", "logging", `Ouverture ${ticket.id} enregistrée`, now, {
      asset: ticket.asset,
    });
    await this.say(
      "reviewer",
      `Position ${ticket.id} inscrite comme OUVERTE dans le Journal de Trading. Qu'elle se solde par un gain ou une perte, la fiche restera indélébile.`,
      "plain",
      ticket.id,
    );
    this.recordEquityPoint(now);
    this.pushLocalMt5BridgePayload(now);
    this.broadcast();
  }

  async rejectTicket(id: string): Promise<void> {
    const now = Date.now();
    const ticket = this.state.tickets.find((t) => t.id.toUpperCase() === id.toUpperCase());
    if (!ticket) {
      await this.say("lead", `Aucun ticket trouvé sous l'identifiant ${id}.`);
      return;
    }
    if (ticket.status !== "pending") {
      await this.say("lead", `Le ticket ${ticket.id} est déjà au statut « ${ticket.status} ».`);
      return;
    }
    ticket.status = "rejected";
    ticket.decidedAt = now;
    this.store.appendBlotter("TICKET_REJECTED", ticket, "Rejeté par l'opérateur humain", now);
    emitPulse(this.state, "human", "lead", "reject", `Rejet ${ticket.id}`, ticket.asset, now);
    await this.say("lead", `Ticket ${ticket.id} rejeté par l'opérateur. Le desk reste en veille.`, "plain", ticket.id);
    await this.say(
      "reviewer",
      `Rejet de ${ticket.id} consigné dans le journal immuable.`,
      "plain",
      ticket.id,
    );
    this.broadcast();
  }

  private async closeOpenTicket(
    ticket: Ticket,
    exitPrice: number,
    reason: CloseReason,
    now = Date.now(),
    realizedOverridePnl?: number,
  ): Promise<void> {
    if (ticket.status !== "open") return;
    const rawPnl = ticketPnlAt(ticket, exitPrice);
    const exitFee = ticket.notional * 0.0004;
    const computedNet = rawPnl - ticket.fees - exitFee;
    const netPnl =
      typeof realizedOverridePnl === "number" && Number.isFinite(realizedOverridePnl) && realizedOverridePnl !== 0
        ? realizedOverridePnl
        : computedNet;
    const rMult = ticket.riskUsd > 0 ? netPnl / ticket.riskUsd : 0;

    ticket.status = "closed";
    ticket.exitPrice = exitPrice;
    ticket.closedAt = now;
    ticket.closeReason = reason;
    ticket.pnl = netPnl;
    this.updateExecutionTraderState(now);
    ticket.rMultiple = rMult;
    ticket.fees += exitFee;

    if (ticket.mt5PositionId && this.mt5.isConfigured()) {
      await this.mt5.closePosition(ticket.mt5PositionId);
    }

    const postMortem =
      netPnl >= 0
        ? `Post-mortem ${ticket.id} : gain net de ${fmtSignedUsd(netPnl, 0)} (${fmtR(rMult)}) sur ${ticket.asset}. Plan exécuté sans dérive.`
        : `Post-mortem ${ticket.id} : perte nette de ${fmtSignedUsd(netPnl, 0)} (${fmtR(rMult)}) sur ${ticket.asset} (motif : ${reason}). Conformément à la charte, cette perte est verrouillée à vie dans le Journal et ne sera jamais supprimée.`;

    ticket.postMortemReport = postMortem;

    this.state.realizedPnl += netPnl;
    const isFastScalp = (this.state.settings?.regime === "hft_kamikaze") || (this.state.settings?.tradingStyle === "scalping");
    const isStopOrLoss = reason === "invalidation" || reason === "adverse_selection" || reason === "drill" || netPnl < 0;

    // Cooldown global de l'actif : 15s seulement sur gain ; minimum 3 min (5 min en swing) sur toute perte / SL
    const cooldownMs = isStopOrLoss
      ? (isFastScalp ? 3 * 60_000 : 5 * 60_000)
      : (isFastScalp ? 15_000 : 5 * 60_000);
    this.state.cooldowns[ticket.asset] = now + cooldownMs;

    // FIX DU DEATH LOOP : Dès qu'un trade touche un Stop Loss ou clôture en perte (< 0),
    // interdiction stricte de reprendre dans la MÊME DIRECTION pendant 15 minutes (clé par actif+direction pour éviter le ping-pong)
    if (!this.state.directionalCooldowns) {
      this.state.directionalCooldowns = {};
    }
    if (isStopOrLoss) {
      const dirCooldownMs = 15 * 60_000;
      const tDir = ticket.direction;
      const oppDir: Direction = tDir === "long" ? "short" : "long";
      const dirKey = `${ticket.asset}:${tDir}`;
      this.state.directionalCooldowns[dirKey] = {
        until: now + dirCooldownMs,
        bannedDir: tDir,
        reason: `Stop Loss / perte touchée (${fmtSignedUsd(netPnl, 2)}). Cooldown directionnel ${tDir.toUpperCase()} 15 min actif.`,
      };
      // Compatibilité avec l'ancienne clé directe
      this.state.directionalCooldowns[ticket.asset] = this.state.directionalCooldowns[dirKey];

      // Si >= 2 pertes sur le même actif dans les 30 dernières minutes, verrouiller les deux directions 15 min
      const recentAssetLosses = this.state.tickets.filter(
        (t) => t.asset === ticket.asset && t.status === "closed" && (t.pnl ?? 0) < 0 && (t.closedAt ?? 0) >= now - 30 * 60_000,
      ).length;
      if (recentAssetLosses >= 2) {
        this.state.directionalCooldowns[`${ticket.asset}:${oppDir}`] = {
          until: now + dirCooldownMs,
          bannedDir: oppDir,
          reason: `${recentAssetLosses} pertes récentes sur ${ticket.asset}. Quarantaine complète 15 min.`,
        };
        this.state.cooldowns[ticket.asset] = now + dirCooldownMs;
      }

      this.say(
        "risk",
        `[ANTI-DEATH-LOOP] Perte/SL sur ${ticket.asset} (${tDir.toUpperCase()} ${fmtSignedUsd(netPnl, 2)}). Biais ${tDir.toUpperCase()} verrouillé 15 min${recentAssetLosses >= 2 ? " (+ quarantaine totale de l'actif)" : ""}.`,
        "veto",
      ).catch(() => {});
    }

    this.store.appendBlotter("POSITION_CLOSED", ticket, `Clôture (${reason}) PnL=${netPnl.toFixed(2)}`, now);

    const regime: MarketRegime = (ticket.regime as MarketRegime) || "MEAN_REVERTING";
    const engineName = (ticket.engine ?? ticket.playbook) as PlayKind;
    const stopDist = Math.abs(ticket.entry - ticket.invalidation) / Math.max(ticket.entry, 1e-9);
    const rawTpMult =
      Math.abs(ticket.target - ticket.entry) / Math.max(1e-9, Math.abs(ticket.entry - ticket.invalidation));
    const realizedOutcome: GrpoCandidateOutcome = {
      config: {
        id: ticket.id,
        strategy: engineName,
        slMult: this.state.settings.fixedStopAtr ?? 1.35,
        tpMult: Number.isFinite(rawTpMult) && rawTpMult > 0 ? Math.min(4, Math.max(1, rawTpMult)) : 1.8,
        leverage: ticket.leverage ?? 1,
        probOld: this.grpo.getStrategyWeight(regime, engineName),
      },
      pnl: netPnl,
      realizedR: rMult,
      maxAdverseExcursion: ticket.maxAdverseExcursion ?? 0,
      stopDistance: stopDist,
      executionFees: ticket.fees,
    };
    const siblingBars = this.latestBarsBySymbol.get(ticket.asset) ?? [];
    const lastMacro = (this.state.macroEvents ?? [])[0];
    const siblingConfigs = this.grpo
      .sampleCandidateGroup(
        {
          regime,
          volatility: stopDist,
          ofiZScore: 0,
          vwapZScore: 0,
          fvgProximity: 0.5,
          macroSurprise: lastMacro?.surpriseIndex ?? 0,
          socialScore: this.sentiment.getScore(ticket.asset),
        },
        3,
        now,
      )
      .filter((c) => c.strategy !== engineName);
    const siblingOutcomes: GrpoCandidateOutcome[] = siblingConfigs.map((cfg) => {
      if (siblingBars.length >= 60) {
        const res = evaluateCandidateForGrpo(siblingBars, cfg.strategy, cfg.slMult, cfg.tpMult, cfg.leverage);
        return {
          config: cfg,
          pnl: res.pnl,
          realizedR: res.realizedR,
          maxAdverseExcursion: res.maxAdverseExcursion,
          stopDistance: res.stopDistance,
          executionFees: res.executionFees,
        };
      }
      return {
        config: cfg,
        pnl: 0,
        realizedR: 0,
        maxAdverseExcursion: 0.25,
        stopDistance: stopDist,
        executionFees: ticket.fees,
      };
    });
    const grpoUpd = this.grpo.updatePolicyFromGroup(regime, [realizedOutcome, ...siblingOutcomes]);
    ticket.grpoAdvantage = grpoUpd.advantages[0] ?? 0;
    this.syncRlSummaryToState(regime);

    this.grpo.appendReviewerDiagnostic({
      at: now,
      ticketId: ticket.id,
      symbol: ticket.asset,
      regime,
      strategy: engineName,
      realizedPnl: netPnl,
      realizedR: rMult,
      advantageShift: ticket.grpoAdvantage,
      klDivergence: grpoUpd.klDivergence,
      winningFeatures: netPnl >= 0 ? [engineName, regime, ticket.fomoBoostApplied ? "FOMO_CONFLUENCE" : "OOS_CONFIRMED"] : [],
      losingFeatures: netPnl < 0 ? [reason, regime, ticket.macroShieldApplied ? "VOLATILITY_SHIELD" : "STOP_DIST"] : [],
      parameterAdjustments: `SL_ATR=${grpoUpd.updatedHyperparams.slMultMean.toFixed(2)}, TP_R=${grpoUpd.updatedHyperparams.tpMultMean.toFixed(2)}, Lev=${grpoUpd.updatedHyperparams.leverageMean.toFixed(1)}x`,
    });

    emitPulse(this.state, "execution", "reviewer", "log", `Clôture ${ticket.id} (${reason})`, ticket.asset, now);

    if (reason === "invalidation" || reason === "drill") {
      await this.wakeHuman(
        "invalidation",
        `Invalidation touchée sur ${ticket.id} (${ticket.asset} ${ticket.direction.toUpperCase()}) à ${fmtPx(exitPrice)}. Position clôturée en PAPER (${fmtSignedUsd(netPnl, 0)}).`,
        ticket.id,
      );
    }

    await this.say(
      "execution",
      `Clôture PAPER [${reason.toUpperCase()}] sur ${ticket.id} (${ticket.asset}) @ ${fmtPx(exitPrice)} · PnL net ${fmtSignedUsd(netPnl, 0)} (${fmtR(rMult)}).`,
      "fill",
      ticket.id,
    );

    await this.speakWithAgentPrompt(
      "reviewer",
      `Clôture=${ticket.id}, Actif=${ticket.asset}, Motif=${reason}, PnL=${fmtSignedUsd(netPnl, 0)}, R=${fmtR(rMult)}. Si perte, rappeler qu'elle ne sera jamais supprimée.`,
      postMortem,
      "plain",
      ticket.id,
    );
    this.appendTradePostMortem(ticket, reason, exitPrice, netPnl, now);
    this.recordEquityPoint(now);
    this.pushLocalMt5BridgePayload(now);
  }

  readTradePostMortems(limit = 50): PostMortemLogEntry[] {
    try {
      if (!existsSync(this.postMortemPath)) return [];
      const raw = JSON.parse(readFileSync(this.postMortemPath, "utf8")) as PostMortemLogEntry[];
      return Array.isArray(raw) ? raw.slice(-limit) : [];
    } catch {
      return [];
    }
  }

  private appendTradePostMortem(
    ticket: Ticket,
    reason: CloseReason,
    exitPrice: number,
    netPnl: number,
    now: number,
  ): void {
    const startTs = ticket.filledAt ?? ticket.decidedAt ?? ticket.createdAt ?? now;
    const durationMs = Math.max(0, now - startTs);
    const mins = Math.floor(durationMs / 60_000);
    const secs = Math.floor((durationMs % 60_000) / 1000);
    const durationLabel = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m ${secs}s`;
    const setupName = String(ticket.engine ?? ticket.playbook ?? "unknown");
    const tag = reason === "invalidation" ? "SL" : reason === "target" ? "TP" : reason.toUpperCase();
    const entry: PostMortemLogEntry = {
      ticketId: ticket.id,
      symbol: ticket.asset,
      closedAt: now,
      closedAtIso: new Date(now).toISOString(),
      direction: ticket.direction,
      setup: setupName,
      thesis: ticket.thesis,
      durationMs,
      durationLabel,
      pnl: Number(netPnl.toFixed(2)),
      closeReason: reason,
      summary: `${tag} ${netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)}€ @ ${fmtPx(exitPrice)}`,
    };
    const existing = this.readTradePostMortems(250);
    const next = [...existing, entry].slice(-250);
    mkdirSync(dirname(this.postMortemPath), { recursive: true });
    const tmp = `${this.postMortemPath}.tmp`;
    writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
    renameSync(tmp, this.postMortemPath);
  }

  /**
   * Boucle Agentic Self-Reflection (toutes les 15 minutes) :
   * Le Trade Reviewer analyse les N derniers post-mortems, met à jour `current_market_regime_directive`
   * et injecte dynamiquement cette directive dans le System Prompt du Stratège.
   */
  async runAgenticSelfReflection(now = Date.now(), maxTrades = 12): Promise<string> {
    this.state.lastSelfReflectionAt = now;
    const recent = this.readTradePostMortems(maxTrades);
    const closedFallback =
      recent.length > 0
        ? recent
        : this.state.tickets
            .filter((t) => t.status === "closed")
            .slice(-maxTrades)
            .map((t) => ({
              ticketId: t.id,
              symbol: t.asset,
              closedAt: t.closedAt ?? now,
              closedAtIso: new Date(t.closedAt ?? now).toISOString(),
              direction: t.direction,
              setup: String(t.engine ?? t.playbook),
              thesis: t.thesis,
              durationMs: Math.max(0, (t.closedAt ?? now) - (t.filledAt ?? t.createdAt)),
              durationLabel: "n/a",
              pnl: Number((t.pnl ?? 0).toFixed(2)),
              closeReason: (t.closeReason ?? "time") as CloseReason,
              summary: `${(t.pnl ?? 0) >= 0 ? "TP" : "SL"} ${(t.pnl ?? 0).toFixed(2)}€`,
            }));

    const breakoutTrades = closedFallback.filter((e) => e.setup === "breakout");
    const breakoutLosses = breakoutTrades.filter((e) => e.pnl < 0).length;
    const meanRevTrades = closedFallback.filter(
      (e) => e.setup === "fade" || e.setup === "Session_VWAP_Reversion",
    );
    const meanRevPnl = meanRevTrades.reduce((s, e) => s + e.pnl, 0);
    const totalPnl = closedFallback.reduce((s, e) => s + e.pnl, 0);
    const rangeCount = Object.values(this.state.marketProfiles ?? {}).filter((m) => m.isRange).length;
    const totalProfiles = Object.keys(this.state.marketProfiles ?? {}).length;

    let deterministicDirective =
      "Marché en équilibre : privilégiez les entrées proches du POC ou Value Area avec un ratio R/R >= 2.0.";
    if (
      breakoutTrades.length >= 2 &&
      (breakoutLosses >= Math.ceil(breakoutTrades.length * 0.6) || totalPnl < 0)
    ) {
      deterministicDirective =
        "Marché en range, les breakouts échouent, passez en mean-reversion.";
    } else if (meanRevTrades.length >= 1 && meanRevPnl > 0 && rangeCount >= Math.max(1, Math.floor(totalProfiles / 2))) {
      deterministicDirective =
        "Marché en range confirmé, continuez en mean-reversion vers le POC entre VAL et VAH.";
    } else if (totalPnl > 0 && breakoutTrades.length > 0 && breakoutLosses === 0) {
      deterministicDirective =
        "Tendance directionnelle propre, suivez l'impulsion tout en respectant le Market Profile.";
    }

    const digest = closedFallback
      .slice(-8)
      .map((e) => `${e.closedAtIso.slice(11, 16)} ${e.symbol} ${e.direction.toUpperCase()} [${e.setup}] ${e.durationLabel} => ${e.summary}`)
      .join(" | ");

    const reviewerCfg = this.state.agentPrompts.reviewer ?? DEFAULT_AGENT_PROMPTS.reviewer;
    const llmPromptCfg: AgentPromptConfig = {
      ...reviewerCfg,
      systemPrompt:
        "Tu es l'Auditeur Stratégique (Trade Reviewer). Synthétise les derniers trades en UNE SEULE phrase directive courte et impérative pour le Stratège (ex: 'Marché en range, les breakouts échouent, passez en mean-reversion.').",
    };

    let directive = deterministicDirective;
    if (closedFallback.length > 0) {
      const voice = await generateAgentVoice(
        llmPromptCfg,
        this.state.settings,
        `Derniers trades (${closedFallback.length}) : ${digest}. PnL cumulé=${totalPnl.toFixed(2)}€, Breakouts perdants=${breakoutLosses}/${breakoutTrades.length}, RangeProfiles=${rangeCount}/${totalProfiles}.`,
        deterministicDirective,
      );
      if (voice.text && !voice.usedProvider.startsWith("Moteur déterministe") && !voice.usedProvider.startsWith("Fallback")) {
        directive = voice.text.replace(/\s+/g, " ").trim();
      }
    }

    this.current_market_regime_directive = directive;
    this.state.current_market_regime_directive = directive;

    // Mise à jour dynamique du System Prompt du Strategist avec la directive la plus récente
    const basePrompt = (this.state.agentPrompts.strategist?.systemPrompt ?? DEFAULT_AGENT_PROMPTS.strategist.systemPrompt)
      .replace(/\n\[DIRECTIVE_REVIEWER_15M[^\]]*\]:[\s\S]*$/m, "")
      .trimEnd();
    const hhmm = new Date(now).toISOString().slice(11, 16);
    if (this.state.agentPrompts.strategist) {
      this.state.agentPrompts.strategist.systemPrompt =
        `${basePrompt}\n[DIRECTIVE_REVIEWER_15M | MAJ ${hhmm} UTC] current_market_regime_directive: ${directive} (RÈGLE STRICTE : obéis impérativement à cette directive et ne prends jamais de LONG > VAH ou SHORT < VAL en range).`;
    }

    const wins = closedFallback.filter((e) => e.pnl > 0).length;
    const losses = closedFallback.filter((e) => e.pnl < 0).length;
    const bySetup = new Map<string, { n: number; pnl: number }>();
    for (const item of closedFallback) {
      const prev = bySetup.get(item.setup) ?? { n: 0, pnl: 0 };
      prev.n += 1;
      prev.pnl += item.pnl;
      bySetup.set(item.setup, prev);
    }
    const breakdown =
      bySetup.size > 0
        ? Array.from(bySetup.entries())
            .map(([setup, st]) => `${setup}: ${st.n}t (${st.pnl >= 0 ? "+" : ""}${st.pnl.toFixed(2)}€)`)
            .join(" | ")
        : "Aucun trade clôturé sur la fenêtre — calibration par Market Profile.";

    const reviewEntry: SelfReflectionReviewEntry = {
      id: `REV-${new Date(now).toISOString().slice(11, 19).replace(/:/g, "")}-${(this.state.selfReflectionHistory?.length ?? 0) + 1}`,
      at: now,
      atIso: new Date(now).toISOString(),
      tradesAnalyzed: closedFallback.length,
      wins,
      losses,
      netPnl: Number(totalPnl.toFixed(2)),
      rangeCount,
      totalProfiles,
      directive,
      breakdown,
    };
    this.state.selfReflectionHistory = [...(this.state.selfReflectionHistory ?? []), reviewEntry].slice(-96);

    setAgentActivity(this.state, "reviewer", "logging", `Directive 15m : ${directive.slice(0, 48)}`, now, {
      targetAgent: "strategist",
    });
    emitPulse(this.state, "reviewer", "strategist", "log", "SELF_REFLECTION_15M", undefined, now);
    await this.say(
      "reviewer",
      `[AUTO-RÉFLEXION 15M] ${closedFallback.length} trade(s) (${wins}W/${losses}L, PnL ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}€, Range ${rangeCount}/${totalProfiles}) | Directive Stratège : "${directive}" | Détail : ${breakdown}`,
      "report",
    );
    this.store.save(this.state);
    this.broadcast();
    return directive;
  }

  async monitorStep(): Promise<void> {
    if (this.monitoring) return;
    this.monitoring = true;
    try {
      const now = Date.now();
      await this.refreshTape();

    const curDay = dayKey(now, this.cfg.timeZone);
    if (curDay !== this.state.dayKey) {
      const wasLossHalted = this.state.halted && this.state.haltKind === "loss";
      this.state.dayKey = curDay;
      this.state.dayStartEquity = currentEquity(this.state);
      if (wasLossHalted) {
        this.state.halted = false;
        this.state.haltKind = null;
      }
      await this.say(
        "lead",
        wasLossHalted
          ? "Nouvelle journée de trading : le compteur de perte journalière est remis à zéro. Le desk reprend la veille."
          : "Nouvelle session journalière : compteur de perte journalière réinitialisé.",
      );
    }

    const overnight = isOvernight(
      now,
      this.cfg.timeZone,
      this.state.settings.overnightStart,
      this.state.settings.overnightEnd,
    );
    if (overnight !== this.state.onOvernight) {
      this.state.onOvernight = overnight;
      setAgentActivity(
        this.state,
        "lead",
        "watch",
        overnight ? "Quart de nuit actif (silence radio sauf invalidation/conflit)" : "Coordination session de jour",
        now,
      );
    }

    // Tick-by-tick Session Goal & Pacing Evaluation (Desk Lead Agent)
    await this.updateSessionGoal(now);

    for (const ticket of this.state.tickets.filter((t) => t.status === "open")) {
      const mark = ticket.mt5CurrentPrice ?? markPriceOf(this.state, ticket.asset, ticket.fillPrice ?? ticket.entry);
      const isLong = ticket.direction === "long";
      const engine = ticket.engine ?? ticket.playbook;
      const curUnrealized = ticketPnlAt(ticket, mark);
      if (curUnrealized < 0 && ticket.riskUsd > 0) {
        const maeR = Math.abs(curUnrealized) / ticket.riskUsd;
        if (maeR > (ticket.maxAdverseExcursion ?? 0)) {
          ticket.maxAdverseExcursion = Number(maeR.toFixed(4));
        }
      }

      // PRIORITÉ ABSOLUE : Règles utilisateur en montant fixe (€ / $) pour Take-Profit et Stop-Loss
      const userTpAmount =
        this.state.settings?.tpMode === "amount" && Number(this.state.settings?.tpVal ?? 0) > 0
          ? Number(this.state.settings.tpVal)
          : 0;
      const rawSlAmt = Number(
        (this.state.settings?.slMode === "amount" ? this.state.settings?.slVal : 0) ||
        (this.state.settings?.maxLossPerTradeMode === "amount" ? this.state.settings?.maxLossPerTradeVal : 0) ||
        (this.state.settings?.riskMode === "amount" ? this.state.settings?.riskAmount : 0) ||
        0,
      );
      const userSlAmount = rawSlAmt > 0 ? rawSlAmt : 0;

      if (userSlAmount > 0 && curUnrealized <= -Math.abs(userSlAmount)) {
        await this.closeOpenTicket(ticket, mark, "invalidation", now);
        await this.say(
          "execution",
          `🛑 [STOP-LOSS MONTANT] Clôture immédiate de ${ticket.id} (${ticket.asset}) : perte ${fmtSignedUsd(curUnrealized, 2)} <= -${fmtUsd(userSlAmount, 2)}.`,
          "fill",
          ticket.id,
        );
        continue;
      }
      if (userTpAmount > 0 && curUnrealized >= userTpAmount) {
        await this.closeOpenTicket(ticket, mark, "target", now);
        await this.say(
          "execution",
          `🎯 [TAKE-PROFIT MONTANT] Clôture immédiate de ${ticket.id} (${ticket.asset}) : gain ${fmtSignedUsd(curUnrealized, 2)} >= +${fmtUsd(userTpAmount, 2)}.`,
          "fill",
          ticket.id,
        );
        continue;
      }

      // PHASE 4 — ActiveTradeManager : Hard Break-Even asynchrone à 50% du TP (+ frais)
      const beMod = ActiveTradeManager.evaluateBreakEvenOrderModify(ticket, mark);
      if (beMod.shouldModify) {
        ticket.invalidation = beMod.newStopLoss;
        ticket.breakEvenActive = true;
        ticket.hardSlSyncedAt = now;
        this.updateExecutionTraderState(now, {
          ticketId: ticket.id,
          symbol: ticket.asset,
          newSl: beMod.newStopLoss,
          takeProfit: beMod.takeProfit,
          reason: beMod.reason ?? "Hard Break-Even 50% TP",
          at: now,
        });
        ActiveTradeManager.dispatchAsyncOrderModify(
          this.mt5,
          ticket,
          beMod.newStopLoss,
          beMod.takeProfit,
        );
        this.pushLocalMt5BridgePayload(now);
        this.say(
          "execution",
          `[ACTIVE TRADE MANAGER] ${beMod.reason} pour ${ticket.id} (${ticket.asset}).`,
          "plain",
          ticket.id,
        ).catch(() => {});
        this.broadcast();
      }

      // STOP-LOSS PROGRESSIF (Break-Even 50% dynamique du pic de gain)
      if (this.state.settings?.progressiveStopEnabled) {
        const effectiveUnrealized =
          ticket.mt5Profit !== undefined && Number.isFinite(ticket.mt5Profit)
            ? ticket.mt5Profit
            : curUnrealized;
        const prevPeak = ticket.peakProfitUsd ?? 0;
        if (effectiveUnrealized > prevPeak) {
          ticket.peakProfitUsd = Number(effectiveUnrealized.toFixed(2));
        }
        const activePeak = ticket.peakProfitUsd ?? 0;
        const minActivatePeakUsd = Math.max(15, ticket.riskUsd * 0.25, ticket.fees * 1.5);
        if (activePeak >= minActivatePeakUsd) {
          const floorUsd = Number((activePeak * 0.5).toFixed(2));
          if (floorUsd > (ticket.progressiveStopUsd ?? 0)) {
            const firstLock = (ticket.progressiveStopUsd ?? 0) <= 0;
            ticket.progressiveStopUsd = floorUsd;
            const refPx = ticket.fillPrice ?? ticket.entry;
            if (refPx > 0) {
              const lockPx =
                ticket.mt5Profit !== undefined && effectiveUnrealized > floorUsd
                  ? refPx + (mark - refPx) * (floorUsd / effectiveUnrealized)
                  : ticket.notional > 0
                    ? isLong
                      ? refPx + (floorUsd * refPx) / ticket.notional
                      : refPx - (floorUsd * refPx) / ticket.notional
                    : refPx;
              if ((isLong && lockPx > ticket.invalidation) || (!isLong && lockPx < ticket.invalidation)) {
                ticket.invalidation = lockPx;
                ticket.breakEvenActive = true;
                ticket.hardSlSyncedAt = now;
              }
            }
            if (firstLock || floorUsd >= 25) {
              this.say(
                "risk",
                `[BREAK-EVEN PROGRESSIF 50%] ${ticket.id} (${ticket.asset}) : pic ${fmtSignedUsd(activePeak, 2)} -> plancher de gain sécurisé à ${fmtSignedUsd(floorUsd, 2)}.`,
                "plain",
                ticket.id,
              ).catch(() => {});
            }
          }
        }
        if (
          (ticket.progressiveStopUsd ?? 0) > 0 &&
          effectiveUnrealized <= (ticket.progressiveStopUsd ?? 0) &&
          effectiveUnrealized > 0
        ) {
          await this.closeOpenTicket(
            ticket,
            mark,
            "target",
            now,
            ticket.mt5Profit !== undefined ? effectiveUnrealized : undefined,
          );
          await this.say(
            "execution",
            `[BREAK-EVEN PROGRESSIF 50%] Clôture gagnante de ${ticket.id} (${ticket.asset}) : gain sécurisé ${fmtSignedUsd(effectiveUnrealized, 2)} (pic +${fmtUsd(ticket.peakProfitUsd ?? 0, 2)}, seuil 50% +${fmtUsd(ticket.progressiveStopUsd ?? 0, 2)}).`,
            "fill",
            ticket.id,
          );
          continue;
        }
      }

      // MODULE 2 : THE FIAT-TARGET TAKE PROFIT & AUTONOMOUS THF MANAGEMENT (Execution Trader Agent)
      // Clôture instantanée au marché dès que le PnL non-réalisé atteint la cible fiat (50$-100$ ou cible utilisateur),
      // et protection dynamique autonome (Break-Even / Trailing) si le trade part en gain.
      const isKamikazeActive = this.state.settings?.regime === "hft_kamikaze" || engine === "HFT_Kamikaze_FiatTarget";
      if (isKamikazeActive) {
        const minTarget = userTpAmount > 0 ? Math.min(userTpAmount, this.state.settings?.hftTargetPnlMin ?? 50) : (this.state.settings?.hftTargetPnlMin ?? 50);
        const maxTarget = this.state.settings?.hftTargetPnlMax ?? 100;
        const fiatEval = ExecutionTraderAgent.evaluateFiatTargetTakeProfit(ticket, mark, minTarget, maxTarget);
        if (fiatEval.shouldClose) {
          await this.closeOpenTicket(ticket, mark, "target", now);
          await this.say(
            "execution",
            `⚡ ${fiatEval.reason} Clôture immédiate au marché pour ${ticket.id} (${ticket.asset}).`,
            "fill",
            ticket.id,
          );
          continue;
        }

        // Protection autonome des gains THF : passage au Break-Even + trailing serré dès +20$ de gain
        const refPx = ticket.fillPrice ?? ticket.entry;
        if (curUnrealized >= 20 && refPx > 0) {
          const lockPx = isLong
            ? refPx + (mark - refPx) * 0.45
            : refPx - (refPx - mark) * 0.45;
          if ((isLong && lockPx > ticket.invalidation) || (!isLong && lockPx < ticket.invalidation)) {
            ticket.invalidation = lockPx;
            ticket.breakEvenActive = true;
          }
        }
      }

      // Moteur A (HFT_OrderFlow_Imbalance) : Trailing Stop 0.5x ATR(1m), Sélection Adverse, Épuisement & Time-Stop 120s
      if (engine === "HFT_OrderFlow_Imbalance") {
        const micro = await fetchMicrostructureTick(ticket.asset);
        if (micro) {
          // Sortie d'urgence (Sélection Adverse)
          const adverse = (isLong && micro.zOfi < -1.5) || (!isLong && micro.zOfi > 1.5);
          if (adverse) {
            await this.closeOpenTicket(ticket, mark, "adverse_selection", now);
            continue;
          }
          // Take Profit dynamique sur épuisement du flux (|Z_OFI| < 0.5)
          const inProfit = isLong ? mark > (ticket.fillPrice ?? ticket.entry) : mark < (ticket.fillPrice ?? ticket.entry);
          if (Math.abs(micro.zOfi) < 0.5 && inProfit) {
            await this.closeOpenTicket(ticket, mark, "flow_exhaustion", now);
            continue;
          }
          // Trailing Stop dynamique 0.5 * ATR(1m) uniquement dans le sens du trade
          if (micro.atr1m > 0) {
            const trailDist = Math.max(micro.atr1m * 0.5, mark * 0.0012);
            if (isLong) {
              const candStop = mark - trailDist;
              if (candStop > ticket.invalidation) ticket.invalidation = candStop;
            } else {
              const candStop = mark + trailDist;
              if (candStop < ticket.invalidation) ticket.invalidation = candStop;
            }
          }
        }
      }

      // Moteur B (Session_VWAP_Reversion) : Take Profit partiel 50% sur ±1.0 SD + Break-Even
      if (engine === "Session_VWAP_Reversion" && !ticket.partialTpDone && ticket.partialTpPrice) {
        const hitPartial = isLong ? mark >= ticket.partialTpPrice : mark <= ticket.partialTpPrice;
        if (hitPartial) {
          const halfNotional = ticket.notional * 0.5;
          const refPx = ticket.fillPrice ?? ticket.entry;
          const partialPnl = ((isLong ? 1 : -1) * (ticket.partialTpPrice - refPx) * halfNotional) / refPx - ticket.fees * 0.5;
          this.state.realizedPnl += partialPnl;
          ticket.notional = halfNotional;
          ticket.qty = ticket.qty * 0.5;
          ticket.partialTpDone = true;
          ticket.breakEvenActive = true;
          if ((isLong && refPx > ticket.invalidation) || (!isLong && refPx < ticket.invalidation)) {
            ticket.invalidation = refPx; // Passage du stop au Break-Even (sans reculer un stop progressif)
          }
          await this.say(
            "execution",
            `TP Partiel 50% exécuté sur ${ticket.id} (${ticket.asset}) @ ${fmtPx(ticket.partialTpPrice)} (+${fmtUsd(partialPnl, 2)}). Stop ramené au Break-Even (${fmtPx(refPx)}).`,
            "fill",
            ticket.id,
          );
        }
      }

      // Time-Stop naturel défini par chaque stratégie (ex: 120s Moteur A, 300s THF Kamikaze si stagnant, 8h Moteur B, 72h Moteur C)
      const timeLimitMs = ticket.timeStopMs ?? ticket.timeStopHours * 3600_000;
      const ticketStart = ticket.filledAt || ticket.decidedAt || ticket.createdAt;
      if (ticketStart && now - ticketStart >= timeLimitMs) {
        await this.closeOpenTicket(ticket, mark, "time", now);
        continue;
      }

      const hitAmountTp =
        this.state.settings?.tpMode === "amount" &&
        Number(this.state.settings?.tpVal ?? 0) > 0 &&
        curUnrealized >= Number(this.state.settings.tpVal);

      const targetSlAmount = Number(
        this.state.settings?.slVal ||
        (this.state.settings?.riskMode === "amount" ? this.state.settings?.riskAmount : 0) ||
        0
      );
      const isAmountSl =
        (this.state.settings?.slMode === "amount" || this.state.settings?.riskMode === "amount") &&
        targetSlAmount > 0;
      const hitAmountSl = isAmountSl && curUnrealized <= -Math.abs(targetSlAmount);

      const hitStop = isLong ? mark <= ticket.invalidation : mark >= ticket.invalidation;
      const hitTarget = isLong ? mark >= ticket.target : mark <= ticket.target;

      if (hitAmountSl || hitStop) {
        const isSecuredProgressiveHit =
          !hitAmountSl && hitStop && (ticket.progressiveStopUsd ?? 0) > 0 && curUnrealized > 0;
        await this.closeOpenTicket(
          ticket,
          hitAmountSl ? mark : ticket.invalidation,
          isSecuredProgressiveHit ? "target" : "invalidation",
          now,
        );
      } else if (hitAmountTp || hitTarget) {
        await this.closeOpenTicket(ticket, hitAmountTp ? mark : ticket.target, "target", now);
      }
    }

    await this.enforceDailyLossLimit(now);
    this.recordEquityPoint(now);
    if (this.state.settings?.progressiveStopEnabled && this.state.tickets.some((t) => t.status === "open" && (t.progressiveStopUsd ?? 0) > 0)) {
      this.pushLocalMt5BridgePayload(now);
    }

    if (now - (this.state.lastSelfReflectionAt ?? 0) >= 15 * 60_000 && this.state.tickets.some((t) => t.status === "closed")) {
      await this.runAgenticSelfReflection(now);
    }

    const parts = localParts(now, this.cfg.timeZone);
    const curWeek = isoWeek(now, this.cfg.timeZone);
    if (parts.weekday === 1 && parts.hour >= this.cfg.reportHour && this.state.reportWeek !== curWeek) {
      this.state.reportWeek = curWeek;
      await this.postWeeklyReport(now);
      await this.runParameterOptimization();
    }

    const pending = this.state.tickets.find((t) => t.status === "pending");
    const isHftRegime = this.state.settings?.regime === "hft_kamikaze";
    const isScalp =
      isHftRegime ||
      Boolean(this.state.settings?.autoPaperScalp) ||
      this.state.settings?.executionMode === "auto" ||
      this.state.settings?.tradingStyle === "scalping";
    const isAutoMode = this.state.settings?.executionMode === "auto" || isScalp;
    if (pending && isAutoMode) {
      await this.approveTicket(pending.id);
    }
    const hasPending = this.state.tickets.some((t) => t.status === "pending");
    const intervalMs = isHftRegime
      ? Math.min(this.state.settings?.scalpIntervalSec || 5, 5) * 1000
      : isScalp
        ? (this.state.settings?.scalpIntervalSec || 12) * 1000
        : (this.state.settings?.scanIntervalMin || this.cfg.scanIntervalMin) * 60_000;
      if (!hasPending && !this.state.halted && now - this.state.lastScanAt >= intervalMs) {
        await this.runDeskScan("scheduled");
      }

      this.broadcast();
    } finally {
      this.monitoring = false;
    }
  }

  private async enforceDailyLossLimit(now = Date.now()): Promise<void> {
    if (this.state.halted && this.state.haltKind === "loss") return;
    const s = this.state.settings;

    // 1) Objectif de clôture globale : fermer tout quand le PNL actuel des trades ouverts atteint X (ou profit du jour si configuré)
    if (s?.dailyProfitTargetEnabled && Number(s.dailyProfitTargetVal ?? 0) > 0) {
      const targetUsd =
        s.dailyProfitTargetMode === "pct"
          ? this.state.dayStartEquity * (Number(s.dailyProfitTargetVal) / 100)
          : Number(s.dailyProfitTargetVal);

      // Priorité utilisateur : clôturer l'ensemble des positions quand le PnL en cours (flottant) des trades ouverts atteint le seuil
      const curOpenPnl = unrealizedPnl(this.state);
      const openForProfit = this.state.tickets.filter((t) => t.status === "open");

      if (openForProfit.length > 0 && curOpenPnl >= targetUsd) {
        for (const t of openForProfit) {
          const px = markPriceOf(this.state, t.asset, t.fillPrice ?? t.entry);
          await this.closeOpenTicket(t, px, "target", now);
        }
        await this.say(
          "lead",
          `Objectif de PnL en cours (${fmtUsd(targetUsd, 0)}) atteint : toutes les positions ouvertes ont été clôturées pour encaisser les gains (+${fmtUsd(curOpenPnl, 2)}).`,
          "fill",
        );
      }
    }

    if (s?.autoStopOnMaxLoss === false) return;

    // 2) Perte maximale journalière (% ou montant)
    const maxDayLoss = s?.maxDayLossPct ?? MAX_DAY_LOSS;
    const dayLimitUsd =
      s?.maxDayLossMode === "amount" && Number(s.maxDayLossVal ?? 0) > 0
        ? Number(s.maxDayLossVal)
        : this.state.dayStartEquity * maxDayLoss;
    const dayLoss = -currentDayPnl(this.state);
    const hitDayLoss = dayLoss >= dayLimitUsd;

    // 3) Perte maximale totale sur le compte (% ou montant)
    let hitTotalLoss = false;
    if (Number(s?.maxTotalLossVal ?? 0) > 0) {
      const totalLimitUsd =
        s?.maxTotalLossMode === "amount"
          ? Number(s!.maxTotalLossVal)
          : this.state.startEquity * (Number(s!.maxTotalLossVal) / 100);
      const totalLoss = this.state.startEquity - currentEquity(this.state);
      if (totalLimitUsd > 0 && totalLoss >= totalLimitUsd) {
        hitTotalLoss = true;
      }
    }

    if (!hitDayLoss && !hitTotalLoss) return;

    const openTickets = this.state.tickets.filter((t) => t.status === "open");
    for (const t of openTickets) {
      const px = markPriceOf(this.state, t.asset, t.fillPrice ?? t.entry);
      await this.closeOpenTicket(t, px, "halt", now);
    }
    this.state.halted = true;
    this.state.haltKind = "loss";
    const reasonLabel = hitTotalLoss ? "Perte max totale atteinte" : `HALT -${fmtPct(maxDayLoss, 0)} journalier`;
    setAgentActivity(this.state, "risk", "veto", `${reasonLabel} : desk à plat`, now);

    await this.wakeHuman(
      "halt",
      `${hitTotalLoss ? "Limite de perte maximale totale" : `Limite de perte journalière de ${fmtPct(maxDayLoss, 0)}`} atteinte. Le Directeur des Risques et le Trader d'Exécution ont mis tout le portefeuille à plat (FLAT). Aucun nouveau trade.`,
    );
  }

  async postWeeklyReport(now = Date.now()): Promise<void> {
    const weekAgo = now - 7 * 86400_000;
    const closed = this.state.tickets.filter((t) => t.status === "closed" && (t.closedAt ?? t.createdAt) >= weekAgo);
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
    const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
    const net = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const losersList = losses.map((t) => `${t.id} (${fmtSignedUsd(t.pnl ?? 0, 0)})`).join(", ");
    const open = this.state.tickets.filter((t) => t.status === "open");

    const report = [
      `📊 RAPPORT HEBDOMADAIRE DU LUNDI (${isoWeek(now, this.cfg.timeZone)})`,
      `• Positions clôturées (7j) : ${closed.length} (${wins.length} gagnantes, ${losses.length} perdantes)`,
      `• PnL réalisé net : ${fmtSignedUsd(net, 0)} | Capital total PAPER : ${fmtUsd(currentEquity(this.state), 0)}`,
      `• Trades perdants conservés au journal : ${losersList || "aucun sur la période"}`,
      `• Positions actuellement ouvertes : ${open.length ? open.map((t) => `${t.id} (${t.asset})`).join(", ") : "portefeuille à plat"}`,
      `• Audit : 0 ligne supprimée (Journal immuable).`,
    ].join("\n");

    setAgentActivity(this.state, "reviewer", "logging", "Publication du rapport hebdomadaire", now);
    await this.say("reviewer", report, "report");
  }

  /**
   * Mise à jour manuelle des paramètres et des System Prompts depuis le Board
   */
  /**
   * Entraîne la stratégie des agents sur tout l'historique réel (jusqu'à 1000 bougies par actif)
   * selon le style choisi : scalping (15m), daytrade (1h) ou longtrade (4h).
   */
  async runHistoricalTraining(style?: "scalping" | "daytrade" | "longtrade"): Promise<DeskState["lastTrainingReport"]> {
    const activeStyle = style ?? this.state.settings.tradingStyle ?? "daytrade";
    this.state.settings.tradingStyle = activeStyle;
    const tf: "15m" | "1h" | "4h" = activeStyle === "scalping" ? "15m" : activeStyle === "daytrade" ? "1h" : "4h";
    const now = Date.now();
    const symbols = this.state.settings.symbols.slice(0, 6);

    setAgentActivity(this.state, "strategist", "backtesting", `Entraînement ${activeStyle.toUpperCase()} (${tf}) sur l'historique`, now);
    this.broadcast();

    let totalBars = 0;
    let totalCombos = 0;
    const bestBySymbol = [];

    for (const sym of symbols) {
      let bars = [];
      try {
        if (sym.endsWith("USDT")) {
          bars = await fetchBinanceKlines(sym, tf, 1000);
        } else {
          const snap = await fetchMarketSnapshot(sym, now);
          bars = snap.bars4h;
        }
      } catch {
        const snap = await fetchMarketSnapshot(sym, now);
        bars = snap.bars4h;
      }
      if (bars.length < 80) continue;
      totalBars += bars.length;
      const res = trainStrategyOnHistory(sym, bars, activeStyle);
      totalCombos += res.testedCount;
      bestBySymbol.push(res.best);
    }

    bestBySymbol.sort((a, b) => b.score - a.score);
    const top = bestBySymbol[0];
    if (top) {
      this.state.settings.trainedLookback = top.lookback;
      this.state.settings.trainedAtrMult = top.atrMult;
      this.state.settings.trainedRewardR = top.rewardR;
    }

    const recommendation = top
      ? `Meilleure configuration détectée sur ${top.symbol} (${tf}) : ${top.playbook === "breakout" ? "Cassure" : "Contre-tendance"} · Lookback ${top.lookback} bougies · Stop ${top.atrMult}x ATR · Cible ${top.rewardR}R (OOS : ${top.oosTrades} trades, ${(top.oosWinRate * 100).toFixed(0)}% win, ${top.oosExpR >= 0 ? "+" : ""}${top.oosExpR.toFixed(2)}R, PF ${top.oosProfitFactor.toFixed(2)}).`
      : "Historique insuffisant sur les actifs sélectionnés.";

    const report = {
      at: now,
      style: activeStyle,
      timeframe: tf,
      barsAnalyzed: totalBars,
      combinationsTested: totalCombos,
      bestBySymbol,
      recommendation,
    };

    this.state.lastTrainingReport = report;
    setAgentActivity(this.state, "strategist", "idle", `Entraînement ${activeStyle} terminé`, now);
    await this.say("strategist", `🧠 ENTRAÎNEMENT HISTORIQUE (${activeStyle.toUpperCase()} · ${tf}) TERMINÉ : ${totalBars} bougies analysées, ${totalCombos} combinaisons testées. ${recommendation}`);
    this.broadcast();
    return report;
  }

  /**
   * Boucle d'Entraînement Fermée (Trade Reviewer -> Strategist) :
   * Compile le rapport d'erreurs (stops touchés, time-stops, MDD) et recalibre par Grid Search
   * les hyper-paramètres (OFI_ZScore_Threshold, Fixed_Stop_ATR, FVG_Min_Size_ATR).
   * Ne conserve la mise à jour que si elle améliore le score Out-Of-Sample.
   */
  async runParameterOptimization(symbol?: string): Promise<ParameterOptimizationReport> {
    const now = Date.now();
    const targetSym = symbol || this.state.settings.symbols[0] || "BTCUSDT";
    setAgentActivity(this.state, "reviewer", "logging", `Audit WFO & erreurs sur ${targetSym}`, now, {
      targetAgent: "strategist",
      asset: targetSym,
    });
    setAgentActivity(this.state, "strategist", "backtesting", `Grid Search WFO purgé sur ${targetSym}`, now, {
      asset: targetSym,
    });
    this.broadcast();

    let bars = [];
    try {
      bars = targetSym.endsWith("USDT")
        ? await fetchBinanceKlines(targetSym, "1h", 1000)
        : (await fetchMarketSnapshot(targetSym, now)).bars4h;
    } catch {
      bars = (await fetchMarketSnapshot(targetSym, now)).bars4h;
    }

    const prevParams = {
      ofiZScoreThreshold: this.state.settings.ofiZScoreThreshold ?? 2.5,
      fixedStopAtr: this.state.settings.fixedStopAtr ?? 1.35,
      fvgMinSizeAtr: this.state.settings.fvgMinSizeAtr ?? 0.5,
    };

    const opt = optimizeParametersOnHistory(targetSym, bars, prevParams);

    if (opt.updated) {
      this.state.settings.ofiZScoreThreshold = opt.newParams.ofiZScoreThreshold;
      this.state.settings.fixedStopAtr = opt.newParams.fixedStopAtr;
      this.state.settings.fvgMinSizeAtr = opt.newParams.fvgMinSizeAtr;
    }

    const reviewerSummary = [
      `📊 RAPPORT D'AUDIT & RECALIBRAGE WFO (${targetSym})`,
      `• Trades audités (IS+OOS) : ${opt.totalTradesReviewed} | Taux de stops : ${fmtPct(opt.stopRate, 1)} | Time-stops : ${fmtPct(opt.timeStopRate, 1)} | Max DD : ${opt.maxDrawdownR.toFixed(2)}R`,
      `• Anciens paramètres : Z_OFI=${prevParams.ofiZScoreThreshold}, Stop_ATR=${prevParams.fixedStopAtr}, FVG_ATR=${prevParams.fvgMinSizeAtr}`,
      `• Candidat Grid Search : Z_OFI=${opt.newParams.ofiZScoreThreshold}, Stop_ATR=${opt.newParams.fixedStopAtr}, FVG_ATR=${opt.newParams.fvgMinSizeAtr}`,
      `• Verdict Out-Of-Sample : ${opt.reason}`,
    ].join("\n");

    const report: ParameterOptimizationReport = {
      at: now,
      symbol: targetSym,
      totalTradesReviewed: opt.totalTradesReviewed,
      stopRate: opt.stopRate,
      timeStopRate: opt.timeStopRate,
      maxDrawdownR: opt.maxDrawdownR,
      prevParams: opt.prevParams,
      newParams: opt.newParams,
      updated: opt.updated,
      reason: opt.reason,
      strategies: opt.strategies,
      reviewerSummary,
    };

    this.state.lastOptimizationReport = report;
    emitPulse(this.state, "reviewer", "strategist", "log", `WFO Optimize ${targetSym}`, targetSym, now);
    await this.say("reviewer", reviewerSummary, "report");
    await this.say(
      "strategist",
      opt.updated
        ? `Hyper-paramètres mis à jour après validation Out-Of-Sample : Z_OFI=${opt.newParams.ofiZScoreThreshold}, Stop_ATR=${opt.newParams.fixedStopAtr}, FVG_ATR=${opt.newParams.fvgMinSizeAtr}.`
        : "Aucun surapprentissage toléré : les paramètres actuels restent actifs car l'OOS ne progresse pas.",
    );

    setAgentActivity(this.state, "reviewer", "idle", "Audit WFO terminé", now);
    setAgentActivity(this.state, "strategist", "idle", "Prêt (WFO calibré)", now);
    this.broadcast();
    return report;
  }

  async updateBoardConfig(payload: {
    settings?: Partial<DeskRuntimeSettings>;
    agentPrompts?: Partial<Record<AgentId, Partial<AgentPromptConfig>>>;
    llmApiKey?: string;
  }): Promise<void> {
    if (payload.llmApiKey !== undefined && payload.llmApiKey.trim() !== "") {
      setRuntimeLlmApiKey(payload.llmApiKey);
      this.state.settings.llmApiKeyHint = "Clé API configurée depuis le Board (active en mémoire)";
    }
    if (payload.settings) {
      const prevRegime = this.state.settings.regime ?? "standard";
      const nextLev =
        payload.settings.defaultLeverage !== undefined
          ? Math.max(1, Math.min(500, Math.round(Number(payload.settings.defaultLeverage) || 1)))
          : this.state.settings.defaultLeverage;
      this.state.settings = {
        ...this.state.settings,
        ...payload.settings,
        defaultLeverage: nextLev,
      };

      if (payload.settings.regime && payload.settings.regime !== prevRegime) {
        emitPulse(this.state, "lead", "strategist", "flag", `REGIME_CHANGED: ${payload.settings.regime.toUpperCase()}`, undefined, Date.now());
        await this.say(
          "lead",
          `[REGIME_CHANGED] Basculement immédiat du régime actif vers : ${payload.settings.regime.toUpperCase()}${
            payload.settings.regime === "hft_kamikaze"
              ? " ⚡ [KAMIKAZE MODE ENGAGÉ] Levier max 500x, tir de barrage L2/OFI et Take-Profit instantané $50-$100 !"
              : ""
          }`,
          payload.settings.regime === "hft_kamikaze" ? "wake" : "plain",
        );
      }

      if (payload.settings.sessionTargetFiat && payload.settings.sessionTargetFiat !== this.state.sessionGoal?.targetProfitFiat) {
        this.state.sessionGoal = DeskLeadAgent.createSessionGoal(
          currentEquity(this.state),
          payload.settings.sessionTargetFiat,
          payload.settings.sessionDurationHours ?? 4,
        );
      }
    }
    if (payload.agentPrompts) {
      for (const [id, patch] of Object.entries(payload.agentPrompts) as Array<[AgentId, Partial<AgentPromptConfig>]>) {
        if (this.state.agentPrompts[id] && patch) {
          this.state.agentPrompts[id] = {
            ...this.state.agentPrompts[id],
            ...patch,
          };
        }
      }
    }
    await this.say(
      "lead",
      `Paramètres et System Prompts mis à jour en direct sur le Board (Risque/trade : ${fmtPct(this.state.settings.maxRiskPct, 1)}, Exposition max : ${fmtPct(this.state.settings.maxExposurePct, 1)}, Perte max/jour : ${fmtPct(this.state.settings.maxDayLossPct, 1)}, Moteur LLM : ${this.state.settings.llmProvider.toUpperCase()} / ${this.state.settings.llmModel}).`,
    );
    this.broadcast();
  }

  /**
   * Mise à jour des paramètres et System Prompts par instruction en français à l'IA
   */
  async applyAiConfigFromBoard(instruction: string): Promise<string> {
    const res = await applyAiBoardInstruction(instruction, this.state.settings, this.state.agentPrompts);
    this.state.settings = res.settings;
    this.state.agentPrompts = res.prompts;
    await this.say(
      "lead",
      `🤖 Configuration IA appliquée sur le Desk : ${res.summary}.`,
    );
    this.broadcast();
    return res.summary;
  }

  /**
   * Mise à jour d'une fiche du Journal de Trading Notion (notes, tags, grade).
   * Refuse toujours toute suppression d'un trade perdant.
   */
  updateJournalEntry(
    ticketId: string,
    patch: { journalNotes?: string; journalTags?: string[]; setupGrade?: "A+" | "A" | "B" | "C" },
  ): boolean {
    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) return false;
    if (patch.journalNotes !== undefined) ticket.journalNotes = patch.journalNotes;
    if (patch.journalTags !== undefined) ticket.journalTags = patch.journalTags;
    if (patch.setupGrade !== undefined) ticket.setupGrade = patch.setupGrade;
    this.broadcast();
    return true;
  }

  async handleHumanInput(rawText: string, source: "telegram" | "web" | "desk" = "web"): Promise<void> {
    const text = rawText.trim();
    if (!text) return;
    const now = Date.now();

    await this.say("human", text, "plain", undefined, source);

    if (/\b(withdraw|retrait)/i.test(text) && /\b(key|api|permission|scope|cle|clé)/i.test(text)) {
      const note = "Clé avec permission de RETRAIT (Withdraw) refusée par le Trader d'Exécution. Mode PAPER maintenu.";
      this.state.exchangeNote = note;
      setAgentActivity(this.state, "execution", "veto", "Refus clé avec permission retrait", now);
      await this.say(
        "execution",
        "REFUSÉ : je n'accepte jamais une clé API possédant la permission de retrait (withdrawal). Seules les clés strictement « trade-only » sont tolérées, et le desk reste en mode PAPER tant que vous ne demandez pas explicitement le contraire.",
        "veto",
      );
      return;
    }

    if (/offer trade-only key|clé trade-only|cle trade-only/i.test(text)) {
      const note = "Périmètre trade-only vérifié (sans droit de retrait). Mode PAPER actif par défaut.";
      this.state.exchangeNote = note;
      await this.say(
        "execution",
        "Périmètre « trade-only » validé (aucun droit de retrait). Conformément à vos règles, nous restons en mode PAPER jusqu'à votre instruction explicite.",
      );
      return;
    }

    // Approbation ou rejet par ID exact (en français ou anglais : approuver / approve / rejeter / reject)
    const decision = text.match(/^(approve|approuver|valider|reject|rejeter|refuser)\s+(tf-\d{8}-\d{2})[.!]?$/i);
    if (decision) {
      const verb = decision[1].toLowerCase();
      const id = decision[2].toUpperCase();
      if (verb.startsWith("app") || verb.startsWith("val")) await this.approveTicket(id);
      else await this.rejectTicket(id);
      return;
    }

    if (/^(approve|approuver|valider|reject|rejeter|refuser)\b/i.test(text)) {
      const pending = this.state.tickets.find((t) => t.status === "pending");
      await this.say(
        "lead",
        pending
          ? `Format refusé : vous devez approuver ou rejeter uniquement avec l'ID exact du ticket. Exemple : « approuver ${pending.id} » ou « rejeter ${pending.id} ».`
          : "Format refusé : indiquez l'ID exact du ticket (ex: approuver TF-20261116-01). Aucun ticket n'est en attente.",
      );
      return;
    }

    if (/^(delete|remove|clear|efface|effacer|supprime|supprimer)\b/i.test(text)) {
      const loser = this.state.tickets.find((t) => t.status === "closed" && (t.pnl ?? 0) < 0);
      await this.say(
        "reviewer",
        loser
          ? `REFUSÉ : je ne supprime jamais un trade perdant (${loser.id} reste gravé de façon permanente dans le Journal et dans blotter.jsonl).`
          : "REFUSÉ : le Journal de Trading est strictement immuable (append-only). Aucune perte n'est jamais effacée.",
        "veto",
      );
      return;
    }

    if (/^(mode auto|full auto|execution auto)$/i.test(text)) {
      this.state.settings.executionMode = "auto";
      await this.say(
        "lead",
        "Mode FULL AUTO activé : les tickets validés par le Stratège (WFO + DSR) et calibrés par le Directeur des Risques sont exécutés en PAPER sans attente de confirmation.",
      );
      for (const pendingTicket of this.state.tickets.filter((t) => t.status === "pending")) {
        await this.approveTicket(pendingTicket.id);
      }
      this.broadcast();
      return;
    }

    if (/^(mode confirmation|confirmation humaine|mode manuel|manual confirm)$/i.test(text)) {
      this.state.settings.executionMode = "human_confirm";
      this.state.settings.autoPaperScalp = false;
      await this.say(
        "lead",
        "Mode CONFIRMATION HUMAINE activé : chaque ticket attend votre approbation explicite par ID exact (« approuver TF-... »).",
      );
      this.broadcast();
      return;
    }

    if (/^(optimize|optimiser|wfo)$/i.test(text)) {
      await this.runParameterOptimization();
      return;
    }

    if (/^(auto scalp on|scalp on|auto on)$/i.test(text)) {
      this.state.settings.autoPaperScalp = true;
      this.state.settings.executionMode = "auto";
      await this.say(
        "lead",
        `Mode SCALP AUTO (PAPER) ACTIVÉ : scan toutes les ${this.state.settings.scalpIntervalSec || 15}s et exécution PAPER automatique des tickets validés par le Stratège et le Directeur des Risques.`,
      );
      for (const pendingTicket of this.state.tickets.filter((t) => t.status === "pending")) {
        await this.approveTicket(pendingTicket.id);
      }
      this.broadcast();
      await this.runDeskScan("manual");
      return;
    }

    if (/^(auto scalp off|scalp off|auto off)$/i.test(text)) {
      this.state.settings.autoPaperScalp = false;
      this.state.settings.executionMode = "human_confirm";
      await this.say(
        "lead",
        "Mode SCALP AUTO DÉSACTIVÉ : retour à l'approbation manuelle par ID exact (« approuver TF-... »).",
      );
      this.broadcast();
      return;
    }

    if (/^(scan|run scan|scan tape|analyser|scanner)$/i.test(text)) {
      await this.runDeskScan("manual");
      return;
    }

    if (/^(status|book|etat|état|statut)$/i.test(text)) {
      const eq = currentEquity(this.state);
      const gross = grossExposureUsd(this.state);
      const open = this.state.tickets.filter((t) => t.status === "open");
      const pending = this.state.tickets.filter((t) => t.status === "pending");
      await this.say(
        "lead",
        `État du Desk (PAPER) · Capital ${fmtUsd(eq, 0)} · PnL Jour ${fmtSignedUsd(currentDayPnl(this.state), 0)} · Exposition brute ${fmtPct(gross / eq, 1)}/${fmtPct(this.state.settings.maxExposurePct, 0)} · Ouverts : ${open.length ? open.map((t) => t.id).join(", ") : "0"} · En attente : ${pending.length ? pending.map((t) => t.id).join(", ") : "0"} · Quart de nuit : ${this.state.onOvernight ? "OUI" : "NON"}.`,
      );
      return;
    }

    if (/^(report|weekly|weekly report|rapport|bilan)$/i.test(text)) {
      await this.postWeeklyReport(now);
      return;
    }

    if (/^(flatten|flat|aplatir|tout couper)$/i.test(text)) {
      const open = this.state.tickets.filter((t) => t.status === "open");
      if (!open.length) {
        await this.say("execution", "Le portefeuille est déjà à plat (aucune position ouverte).");
        return;
      }
      for (const t of open) {
        const px = markPriceOf(this.state, t.asset, t.fillPrice ?? t.entry);
        await this.closeOpenTicket(t, px, "flatten", now);
      }
      await this.say("lead", "Toutes les positions ouvertes ont été clôturées en PAPER sur votre instruction.");
      return;
    }

    if (/^(hit stop|stop drill|invalidation drill|hit invalidation|exercice stop|test stop)$/i.test(text)) {
      const open = this.state.tickets.find((t) => t.status === "open");
      if (!open) {
        await this.say(
          "lead",
          "Aucune position ouverte pour simuler une invalidation. Approuvez d'abord un ticket en attente, puis lancez l'exercice.",
        );
        return;
      }
      await this.closeOpenTicket(open, open.invalidation, "drill", now);
      return;
    }

    if (/^(halt drill|daily loss drill|exercice halt|test perte)$/i.test(text)) {
      const open = this.state.tickets.filter((t) => t.status === "open");
      for (const t of open) {
        const px = markPriceOf(this.state, t.asset, t.fillPrice ?? t.entry);
        await this.closeOpenTicket(t, px, "halt", now);
      }
      this.state.halted = true;
      this.state.haltKind = "drill";
      setAgentActivity(this.state, "risk", "veto", "Exercice Halt -5% actif", now);
      await this.say(
        "risk",
        "Exercice de coupure journalière (-5%) déclenché : toutes les positions sont à plat et les nouveaux tickets sont verrouillés. Tapez « reprendre » pour réactiver le desk.",
        "veto",
      );
      return;
    }

    if (/^(resume|resume paper|reprendre)$/i.test(text)) {
      if (!this.state.halted) {
        await this.say("lead", "Le desk est déjà actif.");
        return;
      }
      if (this.state.haltKind === "loss") {
        await this.say(
          "risk",
          "Refusé : la limite réelle de perte journalière a été touchée. Le desk reste à plat jusqu'à la prochaine session.",
          "veto",
        );
        return;
      }
      this.state.halted = false;
      this.state.haltKind = null;
      setAgentActivity(this.state, "risk", "idle", "Plafonds actifs", now);
      await this.say("lead", "Fin de l'exercice d'arrêt. Le desk PAPER reprend la surveillance.");
      return;
    }

    if (/^(ack|acknowledge|ok|vu|compris)$/i.test(text)) {
      this.state.wakes = this.state.wakes.map((w) => ({ ...w, acked: true }));
      await this.say("lead", "Accusé de réception pris en compte. Retour au silence radio sauf invalidation ou conflit réel.");
      this.broadcast();
      return;
    }

    // Si la phrase ressemble à une demande de modification des paramètres / instructions IA
    if (/\b(risque|exposition|perte|prompt|consigne|strat[èe]ge|analyste|ajoute|modifie|passe le)\b/i.test(text)) {
      await this.applyAiConfigFromBoard(text);
      return;
    }

    await this.say(
      "lead",
      "Commandes disponibles : « scan » (lancer l'analyse), « approuver TF-YYYYMMDD-NN », « rejeter TF-YYYYMMDD-NN », « statut », « rapport », « tout couper », « test stop », « test perte » / « reprendre ». Vous pouvez aussi écrire une consigne directe (ex: « Passe le risque max par trade à 2% »).",
    );
  }
}
