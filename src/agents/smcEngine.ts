import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Kline,
  SmcFvgState,
  SmcInstitutionalContext,
  SmcLiquidityLevel,
  SmcOrderBlock,
  XaiCognitiveAuditReport,
} from "../types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");

type PythonSmcRawOutput = {
  symbol: string;
  engine: "smartmoneyconcepts" | "pandas_vectorized";
  structure_event: "BOS" | "CHoCH" | "NONE";
  structure_direction: "LONG" | "SHORT" | "NEUTRAL";
  structure_break_level: number;
  swept_liquidity_levels: Array<{
    type: "BSL" | "SSL";
    price: number;
    swept: boolean;
    sweep_index?: number | null;
  }>;
  order_block_price: {
    low: number;
    high: number;
    mid_price: number;
    fvg_backed: boolean;
    mitigated: boolean;
  };
  fvg_state: {
    status: "UNMITIGATED" | "PARTIALLY_MITIGATED" | "MITIGATED" | "NONE";
    bottom: number;
    top: number;
    mid_price: number;
    fill_pct: number;
  };
  mitigation_triggered: boolean;
  liquidity_sweep_confirmed: boolean;
  confluence_score: number;
  valid_signal: boolean;
  entry_price: number;
  stop_price: number;
  signal_justification: string;
};

/**
 * Moteur Smart Money Concepts (SMC) Point-in-Time :
 * - Identification structurelle BOS / CHoCH
 * - Fair Value Gaps (FVG) adossés à un Order Block valide (dernière bougie opposée)
 * - Balayages de liquidité (Liquidity Sweeps BSL/SSL)
 * - Déclenchement uniquement sur mitigation dans l'Order Block + passerelle Python (`smartmoneyconcepts` + Pydantic)
 */
export class SmcEngine {
  static analyzeOhlcv(
    symbol: string,
    bars: Kline[],
    currentPrice?: number,
    atr?: number | null,
    now = Date.now(),
    swingLength = 2,
  ): SmcInstitutionalContext {
    const pitBars = bars.filter((b) => (b.closeTime || b.openTime || 0) <= now);
    const series = pitBars.length >= 15 ? pitBars : bars;
    const px = currentPrice && currentPrice > 0 ? currentPrice : (series[series.length - 1]?.close ?? 1);

    if (series.length < 15) {
      return {
        symbol,
        engine: "ts_ohlcv",
        structureEvent: "NONE",
        structureDirection: "NEUTRAL",
        structureBreakLevel: Number(px.toFixed(6)),
        sweptLiquidityLevels: [],
        orderBlockPrice: { low: 0, high: 0, midPrice: 0, fvgBacked: false, mitigated: false },
        fvgState: { status: "NONE", bottom: 0, top: 0, midPrice: 0, fillPct: 0 },
        mitigationTriggered: false,
        liquiditySweepConfirmed: false,
        confluenceScore: 0,
        validSignal: false,
        entryPrice: Number(px.toFixed(6)),
        stopPrice: Number(px.toFixed(6)),
        signalJustification: "Historique OHLCV insuffisant (< 15 bougies) pour validation SMC.",
      };
    }

    const atrSlice = series.slice(-15, -1);
    const localAtr = atrSlice.length
      ? atrSlice.reduce((s, b) => s + Math.max(0, b.high - b.low), 0) / atrSlice.length
      : px * 0.002;
    const effAtr = Math.max(atr && atr > 0 ? atr : localAtr, px * 1e-5);
    const swLen = Math.min(swingLength, Math.max(2, Math.floor(series.length / 8)));

    const swingHi: Array<{ idx: number; price: number }> = [];
    const swingLo: Array<{ idx: number; price: number }> = [];
    for (let i = swLen; i < series.length - swLen; i++) {
      let isHi = true;
      let isLo = true;
      for (let j = i - swLen; j <= i + swLen; j++) {
        if (series[j].high > series[i].high) isHi = false;
        if (series[j].low < series[i].low) isLo = false;
      }
      if (isHi) swingHi.push({ idx: i, price: series[i].high });
      if (isLo) swingLo.push({ idx: i, price: series[i].low });
    }

    // 1. Structure de marché : CHoCH (renversement) vs BOS (continuation)
    let structureEvent: "BOS" | "CHoCH" | "NONE" = "NONE";
    let structureDirection: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
    let structureBreakLevel = px;
    let trendBias = 0; // +1 bull, -1 bear
    let hiPtr = 0;
    let loPtr = 0;

    for (let i = swLen + 1; i < series.length; i++) {
      while (hiPtr < swingHi.length && swingHi[hiPtr].idx < i - swLen) hiPtr++;
      while (loPtr < swingLo.length && swingLo[loPtr].idx < i - swLen) loPtr++;
      const latestHi = hiPtr > 0 ? swingHi[hiPtr - 1] : null;
      const latestLo = loPtr > 0 ? swingLo[loPtr - 1] : null;
      if (latestHi && series[i].close > latestHi.price && i > latestHi.idx) {
        structureEvent = trendBias === -1 ? "CHoCH" : "BOS";
        structureDirection = "LONG";
        structureBreakLevel = latestHi.price;
        trendBias = 1;
      } else if (latestLo && series[i].close < latestLo.price && i > latestLo.idx) {
        structureEvent = trendBias === 1 ? "CHoCH" : "BOS";
        structureDirection = "SHORT";
        structureBreakLevel = latestLo.price;
        trendBias = -1;
      }
    }

    // Fallback fractal if no close broke previous swing yet
    if (structureEvent === "NONE" && swingHi.length >= 2 && swingLo.length >= 2) {
      const prevHi = swingHi[swingHi.length - 2];
      const prevLo = swingLo[swingLo.length - 2];
      const lastClose = series[series.length - 1].close;
      if (lastClose > prevHi.price) {
        structureEvent = "BOS";
        structureDirection = "LONG";
        structureBreakLevel = prevHi.price;
      } else if (lastClose < prevLo.price) {
        structureEvent = "BOS";
        structureDirection = "SHORT";
        structureBreakLevel = prevLo.price;
      }
    }

    // 2. Balayage de liquidité (Liquidity Sweeps BSL/SSL sur swings récents)
    const sweptLiquidityLevels: SmcLiquidityLevel[] = [];
    const recentStart = Math.max(0, series.length - 35);
    for (const sw of swingHi.slice(-6)) {
      const startScan = Math.max(sw.idx + 1, recentStart);
      let sweepIdx: number | null = null;
      for (let k = startScan; k < series.length; k++) {
        if (series[k].high > sw.price) {
          sweepIdx = k;
          break;
        }
      }
      if (sweepIdx !== null && !sweptLiquidityLevels.some((x) => x.type === "BSL" && Math.abs(x.price - sw.price) <= effAtr * 0.05)) {
        sweptLiquidityLevels.push({ type: "BSL", price: Number(sw.price.toFixed(6)), swept: true, sweepIndex: sweepIdx });
      }
    }
    for (const sw of swingLo.slice(-6)) {
      const startScan = Math.max(sw.idx + 1, recentStart);
      let sweepIdx: number | null = null;
      for (let k = startScan; k < series.length; k++) {
        if (series[k].low < sw.price) {
          sweepIdx = k;
          break;
        }
      }
      if (sweepIdx !== null && !sweptLiquidityLevels.some((x) => x.type === "SSL" && Math.abs(x.price - sw.price) <= effAtr * 0.05)) {
        sweptLiquidityLevels.push({ type: "SSL", price: Number(sw.price.toFixed(6)), swept: true, sweepIndex: sweepIdx });
      }
    }

    // 3. FVG (3 bougies) + Order Block (dernière bougie opposée avant l'impulsion)
    const fvgList: Array<{ idx: number; dir: 1 | -1; bottom: number; top: number }> = [];
    for (let i = 2; i < series.length; i++) {
      const cPrev2 = series[i - 2];
      const cCur = series[i];
      if (cCur.low > cPrev2.high && (cCur.low - cPrev2.high) >= effAtr * 0.15) {
        fvgList.push({ idx: i, dir: 1, bottom: cPrev2.high, top: cCur.low });
      } else if (cPrev2.low > cCur.high && (cPrev2.low - cCur.high) >= effAtr * 0.15) {
        fvgList.push({ idx: i, dir: -1, bottom: cCur.high, top: cPrev2.low });
      }
    }

    const targetSign: 1 | -1 | 0 = structureDirection === "LONG" ? 1 : structureDirection === "SHORT" ? -1 : 0;
    let bestOb: { idx: number; low: number; high: number; fvgBacked: boolean } | null = null;
    let bestFvg: { idx: number; bottom: number; top: number } | null = null;

    if (targetSign !== 0) {
      const dirFvgs = fvgList.filter((f) => f.dir === targetSign);
      for (let fi = dirFvgs.length - 1; fi >= 0; fi--) {
        const f = dirFvgs[fi];
        for (let j = Math.max(0, f.idx - 2); j >= Math.max(0, f.idx - 5); j--) {
          const c = series[j];
          const isOpp = targetSign === 1 ? c.close < c.open : c.close > c.open;
          if (isOpp) {
            bestOb = { idx: j, low: c.low, high: c.high, fvgBacked: true };
            bestFvg = { idx: f.idx, bottom: f.bottom, top: f.top };
            break;
          }
        }
        if (bestOb) break;
      }
    }

    const lastBar = series[series.length - 1];
    let orderBlockPrice: SmcOrderBlock = { low: 0, high: 0, midPrice: 0, fvgBacked: false, mitigated: false };
    let fvgState: SmcFvgState = { status: "NONE", bottom: 0, top: 0, midPrice: 0, fillPct: 0 };
    let mitigationTriggered = false;
    let obInvalidated = false;

    if (bestOb) {
      const obMid = (bestOb.low + bestOb.high) * 0.5;
      const tol = effAtr * 0.18;
      const between = series.slice(bestOb.idx + 1, -1);
      if (structureDirection === "LONG") {
        obInvalidated =
          between.some((b) => b.close < bestOb.low - tol * 0.5) ||
          lastBar.close < bestOb.low - tol;
        const inZone = (lastBar.low <= bestOb.high + tol || px <= bestOb.high + tol) && px >= bestOb.low - tol;
        const mitBefore = between.some((b) => b.low <= bestOb.high);
        mitigationTriggered = !obInvalidated && inZone && px >= bestOb.low - tol;
        orderBlockPrice = {
          low: Number(bestOb.low.toFixed(6)),
          high: Number(bestOb.high.toFixed(6)),
          midPrice: Number(obMid.toFixed(6)),
          fvgBacked: bestOb.fvgBacked,
          mitigated: mitigationTriggered || mitBefore,
        };
      } else {
        obInvalidated =
          between.some((b) => b.close > bestOb.high + tol * 0.5) ||
          lastBar.close > bestOb.high + tol;
        const inZone = (lastBar.high >= bestOb.low - tol || px >= bestOb.low - tol) && px <= bestOb.high + tol;
        const mitBefore = between.some((b) => b.high >= bestOb.low);
        mitigationTriggered = !obInvalidated && inZone && px <= bestOb.high + tol;
        orderBlockPrice = {
          low: Number(bestOb.low.toFixed(6)),
          high: Number(bestOb.high.toFixed(6)),
          midPrice: Number(obMid.toFixed(6)),
          fvgBacked: bestOb.fvgBacked,
          mitigated: mitigationTriggered || mitBefore,
        };
      }
    }

    if (bestFvg && (structureDirection === "LONG" || structureDirection === "SHORT")) {
      const gap = Math.max(bestFvg.top - bestFvg.bottom, 1e-9);
      const afterFvg = series.slice(bestFvg.idx + 1);
      let fillPct = 0;
      let status: SmcFvgState["status"] = "UNMITIGATED";
      if (structureDirection === "LONG") {
        const minReach = Math.min(px, ...afterFvg.map((b) => b.low));
        if (minReach <= bestFvg.bottom) {
          fillPct = 100;
          status = "MITIGATED";
        } else if (minReach < bestFvg.top) {
          fillPct = Math.min(99.9, Math.max(0, ((bestFvg.top - minReach) / gap) * 100));
          status = "PARTIALLY_MITIGATED";
        }
      } else {
        const maxReach = Math.max(px, ...afterFvg.map((b) => b.high));
        if (maxReach >= bestFvg.top) {
          fillPct = 100;
          status = "MITIGATED";
        } else if (maxReach > bestFvg.bottom) {
          fillPct = Math.min(99.9, Math.max(0, ((maxReach - bestFvg.bottom) / gap) * 100));
          status = "PARTIALLY_MITIGATED";
        }
      }
      fvgState = {
        status,
        bottom: Number(bestFvg.bottom.toFixed(6)),
        top: Number(bestFvg.top.toFixed(6)),
        midPrice: Number(((bestFvg.top + bestFvg.bottom) * 0.5).toFixed(6)),
        fillPct: Number(fillPct.toFixed(1)),
      };
    }

    const relevantSwept = sweptLiquidityLevels.filter(
      (s) => s.swept && ((structureDirection === "LONG" && s.type === "SSL") || (structureDirection === "SHORT" && s.type === "BSL")),
    );
    const liquiditySweepConfirmed = relevantSwept.length > 0;

    let score = 0;
    if (structureEvent !== "NONE") score += 0.3;
    if (orderBlockPrice.fvgBacked && orderBlockPrice.high > orderBlockPrice.low) score += 0.3;
    if (mitigationTriggered) score += 0.25;
    if (liquiditySweepConfirmed) score += 0.15;

    const validSignal =
      structureEvent !== "NONE" &&
      orderBlockPrice.high > orderBlockPrice.low &&
      orderBlockPrice.fvgBacked &&
      fvgState.status !== "NONE" &&
      mitigationTriggered &&
      !obInvalidated;

    let stopPrice = px;
    if (structureDirection === "LONG" && orderBlockPrice.high > 0) {
      const sweepLo = relevantSwept.length ? Math.min(...relevantSwept.map((s) => s.price)) : orderBlockPrice.low;
      stopPrice = Math.min(orderBlockPrice.low, sweepLo) - effAtr * 0.25;
    } else if (structureDirection === "SHORT" && orderBlockPrice.high > 0) {
      const sweepHi = relevantSwept.length ? Math.max(...relevantSwept.map((s) => s.price)) : orderBlockPrice.high;
      stopPrice = Math.max(orderBlockPrice.high, sweepHi) + effAtr * 0.25;
    }

    const sweptSummary = (relevantSwept.length ? relevantSwept : sweptLiquidityLevels).slice(-3)
      .map((s) => `${s.type}@${s.price.toFixed(5)}`)
      .join(", ") || "aucun sweep détecté";
    const obSummary = orderBlockPrice.high > 0
      ? `[${orderBlockPrice.low.toFixed(5)}..${orderBlockPrice.high.toFixed(5)}] (mid=${orderBlockPrice.midPrice.toFixed(5)}, fvg_backed=${orderBlockPrice.fvgBacked}, mitigated=${orderBlockPrice.mitigated})`
      : "aucun OB";
    const fvgSummary = fvgState.status !== "NONE"
      ? `${fvgState.status} [${fvgState.bottom.toFixed(5)}..${fvgState.top.toFixed(5)}] (${fvgState.fillPct}%)`
      : "NONE";

    const signalJustification =
      `SMC(ts_ohlcv) ${structureEvent} ${structureDirection} (cassure ${structureBreakLevel.toFixed(5)}) | ` +
      `Liquidités balayées: ${sweptSummary} | Order Block: ${obSummary} | FVG: ${fvgSummary} | Mitigation=${mitigationTriggered}`;

    return {
      symbol,
      engine: "ts_ohlcv",
      structureEvent,
      structureDirection,
      structureBreakLevel: Number(structureBreakLevel.toFixed(6)),
      sweptLiquidityLevels: sweptLiquidityLevels.slice(-6),
      orderBlockPrice,
      fvgState,
      mitigationTriggered,
      liquiditySweepConfirmed,
      confluenceScore: Number(Math.min(1, score).toFixed(2)),
      validSignal,
      entryPrice: Number(px.toFixed(6)),
      stopPrice: Number(stopPrice.toFixed(6)),
      signalJustification,
    };
  }

  /** Convertit le contexte SMC vers le schéma JSON d'audit XAI / Pydantic (snake_case). */
  static toAuditTraces(ctx: SmcInstitutionalContext): NonNullable<XaiCognitiveAuditReport["smc_traces"]> {
    return {
      engine: ctx.engine,
      structure_event: ctx.structureEvent,
      structure_direction: ctx.structureDirection,
      structure_break_level: ctx.structureBreakLevel,
      swept_liquidity_levels: ctx.sweptLiquidityLevels.map((l) => ({
        type: l.type,
        price: l.price,
        swept: l.swept,
      })),
      order_block_price: {
        low: ctx.orderBlockPrice.low,
        high: ctx.orderBlockPrice.high,
        mid_price: ctx.orderBlockPrice.midPrice,
        fvg_backed: ctx.orderBlockPrice.fvgBacked,
        mitigated: ctx.orderBlockPrice.mitigated,
      },
      fvg_state: {
        status: ctx.fvgState.status,
        bottom: ctx.fvgState.bottom,
        top: ctx.fvgState.top,
        mid_price: ctx.fvgState.midPrice,
        fill_pct: ctx.fvgState.fillPct,
      },
      mitigation_triggered: ctx.mitigationTriggered,
      liquidity_sweep_confirmed: ctx.liquiditySweepConfirmed,
    };
  }

  /** Exécute la pipeline Python (`smartmoneyconcepts` + `pandas` + `pydantic`) si `.venv` est présent. */
  static async runPythonSmcAnalysis(
    symbol: string,
    bars: Kline[],
    currentPrice?: number,
    atr?: number | null,
    now = Date.now(),
    swingLength = 2,
  ): Promise<SmcInstitutionalContext> {
    const scriptPath = join(REPO_ROOT, "scripts", "smc_engine.py");
    const winPy = join(REPO_ROOT, ".venv", "Scripts", "python.exe");
    const nixPy = join(REPO_ROOT, ".venv", "bin", "python");
    const pyBin = existsSync(winPy) ? winPy : existsSync(nixPy) ? nixPy : "";
    if (!pyBin || !existsSync(scriptPath) || bars.length < 15) {
      return SmcEngine.analyzeOhlcv(symbol, bars, currentPrice, atr, now, swingLength);
    }

    const payload = JSON.stringify({
      symbol,
      bars: bars.slice(-180).map((b) => ({
        openTime: b.openTime,
        closeTime: b.closeTime,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
      })),
      current_price: currentPrice ?? null,
      atr: atr ?? null,
      swing_length: swingLength,
      now_ms: now,
    });

    return await new Promise<SmcInstitutionalContext>((resolveOut) => {
      let stdout = "";
      let settled = false;
      const fallback = () => SmcEngine.analyzeOhlcv(symbol, bars, currentPrice, atr, now, swingLength);
      const child = spawn(pyBin, [scriptPath], { cwd: REPO_ROOT, stdio: ["pipe", "pipe", "pipe"] });
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        try { child.kill(); } catch {}
        resolveOut(fallback());
      }, 6000);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
      child.on("error", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolveOut(fallback());
      });
      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (code !== 0 || !stdout.trim()) {
          resolveOut(fallback());
          return;
        }
        try {
          const parsed = JSON.parse(stdout.trim()) as PythonSmcRawOutput;
          resolveOut({
            symbol: parsed.symbol,
            engine: parsed.engine,
            structureEvent: parsed.structure_event,
            structureDirection: parsed.structure_direction,
            structureBreakLevel: parsed.structure_break_level,
            sweptLiquidityLevels: parsed.swept_liquidity_levels.map((s) => ({
              type: s.type,
              price: s.price,
              swept: s.swept,
              sweepIndex: s.sweep_index ?? null,
            })),
            orderBlockPrice: {
              low: parsed.order_block_price.low,
              high: parsed.order_block_price.high,
              midPrice: parsed.order_block_price.mid_price,
              fvgBacked: parsed.order_block_price.fvg_backed,
              mitigated: parsed.order_block_price.mitigated,
            },
            fvgState: {
              status: parsed.fvg_state.status,
              bottom: parsed.fvg_state.bottom,
              top: parsed.fvg_state.top,
              midPrice: parsed.fvg_state.mid_price,
              fillPct: parsed.fvg_state.fill_pct,
            },
            mitigationTriggered: parsed.mitigation_triggered,
            liquiditySweepConfirmed: parsed.liquidity_sweep_confirmed,
            confluenceScore: parsed.confluence_score,
            validSignal: parsed.valid_signal,
            entryPrice: parsed.entry_price,
            stopPrice: parsed.stop_price,
            signalJustification: parsed.signal_justification,
          });
        } catch {
          resolveOut(fallback());
        }
      });

      child.stdin.write(payload);
      child.stdin.end();
    });
  }
}
