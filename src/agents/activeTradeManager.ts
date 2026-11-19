import type { Mt5CloudBridge } from "../mt5.ts";
import type { MarketProfileSummary, MarketSnapshot, Ticket, TradingStyle } from "../types.ts";

export type BreakEvenModifyDecision = {
  shouldModify: boolean;
  progressRatio: number;
  newStopLoss: number;
  takeProfit: number;
  reason?: string;
};

export type AgentRealtimeExitDecision = {
  action: "HOLD" | "LOCK_STOP" | "CLOSE_PROFIT" | "CLOSE_STOP";
  closeReason?: "target" | "invalidation" | "flow_exhaustion" | "adverse_selection";
  newStopLoss?: number;
  peakProfitUsd: number;
  securedFloorUsd?: number;
  reason?: string;
};

/**
 * ActiveTradeManager : supervise les positions ouvertes en temps réel et délègue
 * la protection Hard SL / Hard TP au courtier (OrderSend / OrderModify asynchrone)
 * sans bloquer la boucle de cotation ni attendre une clôture locale tardive.
 */
export class ActiveTradeManager {
  /**
   * Prix de sortie réel côté courtier :
   * - Un LONG se clôture au BID
   * - Un SHORT se clôture à l'ASK (inclut le spread réel)
   */
  static effectiveExitPrice(direction: "long" | "short", mark: number, bid?: number, ask?: number): number {
    if (direction === "long" && Number.isFinite(bid) && (bid ?? 0) > 0) return bid as number;
    if (direction === "short" && Number.isFinite(ask) && (ask ?? 0) > 0) return ask as number;
    return mark;
  }

  /**
   * Garantit que tout ticket transmis au courtier possède des bornes Hard SL / TP valides.
   */
  static ensureHardStopAndTarget(ticket: Ticket): { stopLoss: number; takeProfit: number } {
    const entry = ticket.fillPrice ?? ticket.entry;
    const isLong = ticket.direction === "long";
    let stopLoss = ticket.invalidation;
    let takeProfit = ticket.target;

    if (!Number.isFinite(stopLoss) || stopLoss <= 0 || (isLong ? stopLoss >= entry : stopLoss <= entry)) {
      stopLoss = isLong ? entry * 0.999 : entry * 1.001;
    }
    if (!Number.isFinite(takeProfit) || takeProfit <= 0 || (isLong ? takeProfit <= entry : takeProfit >= entry)) {
      const riskDist = Math.abs(entry - stopLoss) || entry * 0.0004;
      takeProfit = isLong ? entry + riskDist * 2 : entry - riskDist * 2;
    }
    ticket.invalidation = stopLoss;
    ticket.target = takeProfit;
    return { stopLoss, takeProfit };
  }

  /**
   * Évalue si le prix a parcouru >= 50% du chemin entre Entry et TP cible.
   * Si oui, calcule un Hard Stop Loss Break-Even couvrant les frais (+0.08% par défaut)
   * et signale qu'une requête OrderModify() asynchrone doit être émise.
   */
  static evaluateBreakEvenOrderModify(
    ticket: Ticket,
    currentPrice: number,
    feeBufferPct = 0.0008,
  ): BreakEvenModifyDecision {
    const entry = ticket.fillPrice ?? ticket.entry;
    const tp = ticket.target;
    const sl = ticket.invalidation;
    if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(tp) || tp <= 0 || !Number.isFinite(currentPrice) || currentPrice <= 0) {
      return { shouldModify: false, progressRatio: 0, newStopLoss: sl, takeProfit: tp };
    }

    const isLong = ticket.direction === "long";
    const totalDist = isLong ? tp - entry : entry - tp;
    if (totalDist <= 0) {
      return { shouldModify: false, progressRatio: 0, newStopLoss: sl, takeProfit: tp };
    }

    const coveredDist = isLong ? currentPrice - entry : entry - currentPrice;
    const progressRatio = coveredDist / totalDist;
    if (progressRatio < 0.5) {
      return { shouldModify: false, progressRatio, newStopLoss: sl, takeProfit: tp };
    }

    const defaultAssetFee =
      /^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY){2}$/i.test(ticket.asset)
        ? 0.00012
        : /^(XAU|XAG|NQ1!|ES1!|YM1!|FDAX1!)/i.test(ticket.asset)
          ? 0.00018
          : feeBufferPct;
    const rawBeSl = isLong ? entry * (1 + Math.max(0.0001, defaultAssetFee)) : entry * (1 - Math.max(0.0001, defaultAssetFee));
    const safeOffset = entry * 0.0002;
    const boundedBeSl = isLong
      ? Math.min(rawBeSl, currentPrice - safeOffset)
      : Math.max(rawBeSl, currentPrice + safeOffset);
    const roundedBeSl = Number(boundedBeSl.toFixed(5));

    const alreadyProtected = isLong ? sl >= roundedBeSl - 1e-6 : sl <= roundedBeSl + 1e-6;
    if (alreadyProtected) {
      return { shouldModify: false, progressRatio, newStopLoss: sl, takeProfit: tp };
    }

    return {
      shouldModify: true,
      progressRatio,
      newStopLoss: roundedBeSl,
      takeProfit: tp,
      reason: `50% TP atteint (${(progressRatio * 100).toFixed(0)}%) -> OrderModify Hard SL Break-Even (+frais) @ ${roundedBeSl}`,
    };
  }

  /**
   * Émet de façon asynchrone et non-bloquante un OrderModify vers MT5 (Cloud MetaApi + EA Local).
   */
  static dispatchAsyncOrderModify(
    mt5: Mt5CloudBridge,
    ticket: Ticket,
    newStopLoss: number,
    takeProfit: number,
    onDone?: (result: { ok: boolean; message: string }) => void,
  ): void {
    void mt5
      .modifyPosition({
        positionId: ticket.mt5PositionId,
        symbol: ticket.asset,
        commentId: ticket.id,
        stopLoss: newStopLoss,
        takeProfit,
      })
      .then((res) => {
        if (onDone) onDone(res);
      })
      .catch((err) => {
        if (onDone) {
          onDone({
            ok: false,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      });
  }

  /**
   * Break-Even Progressif Adaptatif (50% à 90%) décidé par les agents selon la situation :
   * - Marché en range / proche borne VAH ou VAL -> verrouillage agressif (70% -> 90%)
   * - Avancée proche du TP (>= 50% / 80%) -> resserrage progressif (+8% / +15%)
   * - Retournement micro-flux ou Volatility Shield -> sécurisation (+10%)
   * - Tendance directionnelle propre -> laisse respirer (50%)
   */
  static computeAdaptiveBreakEvenRatio(
    ticket: Ticket,
    currentPrice: number,
    ctx?: {
      tickDeltaPct?: number;
      marketProfile?: MarketProfileSummary;
      volatilityShieldActive?: boolean;
    },
  ): { ratio: number; reason: string } {
    let ratio = 0.50;
    const reasons: string[] = [];
    const entry = ticket.fillPrice ?? ticket.entry;
    const isLong = ticket.direction === "long";
    const mp = ctx?.marketProfile;

    if (mp?.isRange) {
      ratio += 0.15;
      reasons.push("Range MP (+15%)");
    }
    if (mp && currentPrice > 0) {
      const nearTargetEdge = isLong ? currentPrice >= mp.vah * 0.998 : currentPrice <= mp.val * 1.002;
      if (nearTargetEdge) {
        ratio += 0.15;
        reasons.push(isLong ? "Proche VAH (+15%)" : "Proche VAL (+15%)");
      }
    }

    const totalTpDist = isLong ? ticket.target - entry : entry - ticket.target;
    const coveredDist = isLong ? currentPrice - entry : entry - currentPrice;
    const tpProgress = totalTpDist > 0 ? coveredDist / totalTpDist : 0;
    if (tpProgress >= 0.80) {
      ratio += 0.15;
      reasons.push("TP>=80% (+15%)");
    } else if (tpProgress >= 0.50) {
      ratio += 0.08;
      reasons.push("TP>=50% (+8%)");
    }

    const tickDelta = Number(ctx?.tickDeltaPct ?? 0);
    const microAgainst = isLong ? tickDelta <= -0.00015 : tickDelta >= 0.00015;
    if (microAgainst) {
      ratio += 0.10;
      reasons.push("Repli micro (+10%)");
    }
    if (ctx?.volatilityShieldActive) {
      ratio += 0.10;
      reasons.push("Shield Macro (+10%)");
    }

    if (mp && !mp.isRange && tpProgress < 0.45 && !microAgainst && !ctx?.volatilityShieldActive) {
      ratio -= 0.05;
      reasons.push("Tendance propre (-5%)");
    }

    const clamped = Number(Math.max(0.50, Math.min(0.90, ratio)).toFixed(2));
    return {
      ratio: clamped,
      reason: reasons.length ? reasons.join(" · ") : "Base Équilibrée 50%",
    };
  }

  /**
   * Cerveau de Sortie Temps Réel Multi-Agents (Focus HFT) :
   * Les agents décident seconde par seconde quand déplacer le SL au Break-Even ou
   * clôturer au marché afin de sécuriser un maximum de bénéfices :
   * 1) Break-Even ultra-rapide couvrant les frais dès les premiers ticks verts
   * 2) Ratchet dynamique adaptatif (50% -> 90% du pic de profit selon MP/TP/flux)
   * 3) Récolte immédiate sur retournement micro-tick ou rejet Market Profile (VAH/VAL)
   */
  static evaluateAgentRealtimeProfitExit(
    ticket: Ticket,
    currentPrice: number,
    netPnlUsd: number,
    ctx?: {
      tickDeltaPct?: number;
      marketProfile?: MarketProfileSummary;
      volatilityShieldActive?: boolean;
    },
  ): AgentRealtimeExitDecision {
    const entry = ticket.fillPrice ?? ticket.entry;
    const isLong = ticket.direction === "long";
    const fees = Math.max(0.2, Number(ticket.fees || 0));
    const prevPeak = Number(ticket.peakProfitUsd ?? 0);
    const peakProfitUsd = Number(Math.max(prevPeak, netPnlUsd).toFixed(2));

    if (!Number.isFinite(currentPrice) || currentPrice <= 0 || !Number.isFinite(entry) || entry <= 0) {
      return { action: "HOLD", peakProfitUsd };
    }

    const minGreenUsd = Math.max(1.5, fees * 1.8);
    const minRatchetPeak = Math.max(4, (ticket.riskUsd || 20) * 0.15, fees * 3);

    // 1. Calcul adaptatif du ratio de sécurisation [50% .. 90%] selon la situation du marché & trade
    const adaptive = ActiveTradeManager.computeAdaptiveBreakEvenRatio(ticket, currentPrice, ctx);
    let lockRatio = adaptive.ratio;
    if (peakProfitUsd >= Math.max(25, (ticket.riskUsd || 40) * 1.2)) {
      lockRatio = Math.max(lockRatio, 0.85);
    } else if (peakProfitUsd >= Math.max(10, (ticket.riskUsd || 40) * 0.55)) {
      lockRatio = Math.max(lockRatio, 0.72);
    }
    lockRatio = Number(Math.max(0.50, Math.min(0.90, lockRatio)).toFixed(2));

    const prevFloor = Number(ticket.progressiveStopUsd ?? 0);
    let securedFloorUsd = prevFloor;
    if (peakProfitUsd >= minRatchetPeak) {
      const candidateFloor = Number((peakProfitUsd * lockRatio).toFixed(2));
      if (candidateFloor > securedFloorUsd) {
        securedFloorUsd = candidateFloor;
      }
    }

    // 2. Clôture immédiate si le profit redescend sous le plancher verrouillé par les agents
    if (securedFloorUsd > 0 && netPnlUsd <= securedFloorUsd && peakProfitUsd >= minRatchetPeak) {
      return {
        action: "CLOSE_PROFIT",
        closeReason: "target",
        peakProfitUsd,
        securedFloorUsd,
        reason: `[AGENTS EXIT · RATCHET ${Math.round(lockRatio * 100)}%] Bénéfice sécurisé ${netPnlUsd.toFixed(2)}€ (pic +${peakProfitUsd.toFixed(2)}€, plancher +${securedFloorUsd.toFixed(2)}€)`,
      };
    }

    // 3. Récolte proactive si en profit net clair ET retournement contre la position / niveau VAH-VAL
    const tickDelta = Number(ctx?.tickDeltaPct ?? 0);
    const microReversalAgainst = isLong ? tickDelta <= -0.00018 : tickDelta >= 0.00018;
    const mp = ctx?.marketProfile;
    const hitMpEdgeInProfit = Boolean(
      mp &&
        netPnlUsd >= minGreenUsd &&
        ((isLong && currentPrice >= mp.vah * 0.9997) || (!isLong && currentPrice <= mp.val * 1.0003)),
    );
    const fastGiveback = peakProfitUsd >= minRatchetPeak && netPnlUsd >= minGreenUsd && netPnlUsd <= peakProfitUsd * 0.78 && microReversalAgainst;

    if (hitMpEdgeInProfit) {
      return {
        action: "CLOSE_PROFIT",
        closeReason: "flow_exhaustion",
        peakProfitUsd,
        securedFloorUsd,
        reason: `[AGENTS EXIT · MARKET PROFILE] Prise de profit optimisée sur borne ${isLong ? "VAH" : "VAL"} (+${netPnlUsd.toFixed(2)}€)`,
      };
    }
    if (fastGiveback) {
      return {
        action: "CLOSE_PROFIT",
        closeReason: "flow_exhaustion",
        peakProfitUsd,
        securedFloorUsd,
        reason: `[AGENTS EXIT · RETOURNEMENT] Récolte rapide +${netPnlUsd.toFixed(2)}€ avant inversion micro-flux`,
      };
    }
    if (netPnlUsd >= minGreenUsd * 1.4 && microReversalAgainst) {
      return {
        action: "CLOSE_PROFIT",
        closeReason: "flow_exhaustion",
        peakProfitUsd,
        securedFloorUsd,
        reason: `[AGENTS EXIT · SÉCURISATION TICK] Inversion micro détectée, gain encaissé +${netPnlUsd.toFixed(2)}€`,
      };
    }

    // 4. Remontée dynamique du Stop-Loss (Break-Even rapide puis resserrement continu)
    let nextStop: number | undefined;
    const rtFeeOffsetUsd = Math.max(0, fees * 2);
    if (securedFloorUsd > 0 && ticket.notional > 0) {
      const grossFloorUsd = securedFloorUsd + rtFeeOffsetUsd;
      const floorPx = isLong
        ? entry + (grossFloorUsd * entry) / ticket.notional
        : entry - (grossFloorUsd * entry) / ticket.notional;
      const safeDist = entry * 0.00015;
      const clampedFloor = isLong ? Math.min(floorPx, currentPrice - safeDist) : Math.max(floorPx, currentPrice + safeDist);
      if ((isLong && clampedFloor > ticket.invalidation) || (!isLong && clampedFloor < ticket.invalidation)) {
        nextStop = Number(clampedFloor.toFixed(5));
      }
    } else if (netPnlUsd >= minGreenUsd) {
      const feeRatio = ticket.notional > 0 ? Math.max(0.00015, (rtFeeOffsetUsd + 1) / ticket.notional) : 0.0006;
      const beFeePx = isLong ? entry * (1 + feeRatio) : entry * (1 - feeRatio);
      const safeDist = entry * 0.00015;
      const clampedBe = isLong ? Math.min(beFeePx, currentPrice - safeDist) : Math.max(beFeePx, currentPrice + safeDist);
      if ((isLong && clampedBe > ticket.invalidation) || (!isLong && clampedBe < ticket.invalidation)) {
        nextStop = Number(clampedBe.toFixed(5));
      }
    }

    if (nextStop !== undefined) {
      return {
        action: "LOCK_STOP",
        newStopLoss: nextStop,
        peakProfitUsd,
        securedFloorUsd,
        reason: securedFloorUsd > 0
          ? `[AGENTS TRAIL] Plancher verrouillé +${securedFloorUsd.toFixed(2)}€ (SL @ ${nextStop})`
          : `[AGENTS BE RAPIDE] Break-Even + frais sécurisé (SL @ ${nextStop})`,
      };
    }

    return { action: "HOLD", peakProfitUsd, securedFloorUsd };
  }

  /**
   * Sortie intelligente pilotée par la structure (SMC CHoCH opposé & bornes Market Profile VAH/VAL).
   * - Respecte un délai minimum anti-bruit (90s en scalping, 5 min en daytrade/swing) pour ne jamais
   *   couper un trade sur le spread d'ouverture.
   * - Encaisse le profit si >= 45% de l'objectif est atteint ET qu'une borne VAH/VAL ou un CHoCH inverse apparaît.
   * - Coupe une position uniquement si un CHoCH inverse complet (validSignal) invalide la thèse après le délai minimum.
   */
  static evaluateAgentStructuralExit(
    ticket: Ticket,
    currentPrice: number,
    netPnlUsd: number,
    ctx?: {
      marketProfile?: MarketProfileSummary;
      smcContext?: MarketSnapshot["smcContext"];
      tradingStyle?: TradingStyle;
      now?: number;
    },
  ): AgentRealtimeExitDecision {
    const now = ctx?.now ?? Date.now();
    const entry = ticket.fillPrice ?? ticket.entry;
    const isLong = ticket.direction === "long";
    const fees = Math.max(0.2, Number(ticket.fees || 0));
    const prevPeak = Number(ticket.peakProfitUsd ?? 0);
    const peakProfitUsd = Number(Math.max(prevPeak, netPnlUsd).toFixed(2));

    if (!Number.isFinite(currentPrice) || currentPrice <= 0 || !Number.isFinite(entry) || entry <= 0) {
      return { action: "HOLD", peakProfitUsd };
    }

    const openedAt = ticket.filledAt ?? ticket.createdAt;
    const ageMs = Math.max(0, now - openedAt);
    const minHoldMs = ctx?.tradingStyle === "scalping" ? 90_000 : 300_000;
    if (ageMs < minHoldMs) {
      return { action: "HOLD", peakProfitUsd };
    }

    const totalTpDist = isLong ? ticket.target - entry : entry - ticket.target;
    const coveredDist = isLong ? currentPrice - entry : entry - currentPrice;
    const tpProgress = totalTpDist > 0 ? coveredDist / totalTpDist : 0;
    // Seuil de profit adaptatif au risque du trade (permet aux micro-comptes 0.01 lot de récolter leurs gains dès +0.25€..+0.50€ au lieu d'attendre +2€)
    const minGreenUsd = Math.max(0.25, Math.min(2.0, (ticket.riskUsd || 2) * 0.35), fees * 2.0);

    const smc = ctx?.smcContext;
    const oppositeChoch = Boolean(
      smc &&
        smc.structureEvent === "CHoCH" &&
        ((isLong && smc.structureDirection === "SHORT") || (!isLong && smc.structureDirection === "LONG")),
    );
    const mp = ctx?.marketProfile;
    const hitMpEdgeInProfit = Boolean(
      mp &&
        netPnlUsd >= minGreenUsd &&
        tpProgress >= 0.45 &&
        ((isLong && currentPrice >= mp.vah * 0.9997) || (!isLong && currentPrice <= mp.val * 1.0003)),
    );

    if (netPnlUsd >= minGreenUsd && tpProgress >= 0.45 && (oppositeChoch || hitMpEdgeInProfit)) {
      return {
        action: "CLOSE_PROFIT",
        closeReason: "flow_exhaustion",
        peakProfitUsd,
        reason: oppositeChoch
          ? `[AGENTS EXIT · CHoCH INVERSE] Retournement structurel détecté en gain (${(tpProgress * 100).toFixed(0)}% TP) -> prise de profit +${netPnlUsd.toFixed(2)}€.`
          : `[AGENTS EXIT · BORNE ${isLong ? "VAH" : "VAL"}] Cible Market Profile atteinte (${(tpProgress * 100).toFixed(0)}% TP) -> profit encaissé +${netPnlUsd.toFixed(2)}€.`,
      };
    }

    // Ne JAMAIS couper prématurément une position en légère perte sur du bruit 5m après 90s :
    // laisser le Hard Stop Loss travailler tant que la perte reste < 75% du risque et < 10 min (25 min en daytrade).
    const minLossCutHoldMs = ctx?.tradingStyle === "scalping" ? 10 * 60_000 : 25 * 60_000;
    const deepAdverseLoss = netPnlUsd <= -Math.max(0.5, (ticket.riskUsd || 1) * 0.75);
    if (oppositeChoch && smc?.validSignal && ageMs >= minLossCutHoldMs && deepAdverseLoss) {
      return {
        action: "CLOSE_STOP",
        closeReason: "invalidation",
        peakProfitUsd,
        reason: `[AGENTS EXIT · INVALIDATION STRUCTURELLE] CHoCH inverse confirmé en perte profonde (>75% SL) contre ${ticket.asset} ${ticket.direction.toUpperCase()} -> sortie préventive à ${netPnlUsd.toFixed(2)}€ avant SL complet.`,
      };
    }

    return { action: "HOLD", peakProfitUsd };
  }
}
