import type { Direction, Kline, MarketProfileBin, MarketProfileSummary } from "../types.ts";

/**
 * Analyseur Market Profile temps réel (POC, VAH, VAL & détection de régime Range).
 */
export class MarketProfileAnalyzer {
  /**
   * Calcule le Point of Control (POC), la Value Area High (VAH) et Value Area Low (VAL)
   * à 70% de l'activité/volume de la session à partir des bougies ou cotations disponibles.
   */
  static computeSessionProfile(
    symbol: string,
    bars: Kline[],
    currentPrice: number,
    now = Date.now(),
    binsCount = 32,
  ): MarketProfileSummary {
    const validBars = bars.filter(
      (b) => Number.isFinite(b.high) && Number.isFinite(b.low) && b.high >= b.low && b.close > 0,
    );
    const px = Number.isFinite(currentPrice) && currentPrice > 0
      ? currentPrice
      : (validBars[validBars.length - 1]?.close ?? 1);

    if (validBars.length === 0) {
      return {
        symbol,
        poc: px,
        vah: px * 1.005,
        val: px * 0.995,
        sessionHigh: px * 1.008,
        sessionLow: px * 0.992,
        totalVolume: 0,
        valueAreaPct: 0.7,
        isRange: true,
        pricePosition: "inside_va",
        updatedAt: now,
      };
    }

    const windowBars = validBars.slice(-48);
    let sessionHigh = -Infinity;
    let sessionLow = Infinity;
    for (const b of windowBars) {
      if (b.high > sessionHigh) sessionHigh = b.high;
      if (b.low < sessionLow) sessionLow = b.low;
    }
    if (!Number.isFinite(sessionHigh) || !Number.isFinite(sessionLow) || sessionHigh <= sessionLow) {
      sessionHigh = px * 1.005;
      sessionLow = px * 0.995;
    }

    const bins = Math.max(8, binsCount);
    const step = (sessionHigh - sessionLow) / bins;
    const hist = new Float64Array(bins);
    let totalVolume = 0;

    for (const b of windowBars) {
      const barVol = b.volume > 0 ? b.volume : 1; // Repli TPO si la source MT5/CFD ne remonte pas de volume tick
      const startBin = Math.max(0, Math.min(bins - 1, Math.floor((b.low - sessionLow) / step)));
      const endBin = Math.max(startBin, Math.min(bins - 1, Math.floor((b.high - sessionLow) / step)));
      const span = endBin - startBin + 1;
      const perBin = barVol / span;
      for (let idx = startBin; idx <= endBin; idx++) {
        hist[idx] += perBin;
      }
      totalVolume += barVol;
    }

    let pocIdx = 0;
    let maxVol = -1;
    for (let i = 0; i < bins; i++) {
      if (hist[i] > maxVol) {
        maxVol = hist[i];
        pocIdx = i;
      }
    }

    const poc = sessionLow + (pocIdx + 0.5) * step;

    // Extension itérative Value Area (70% du volume autour du POC)
    let lowIdx = pocIdx;
    let highIdx = pocIdx;
    let vaVol = hist[pocIdx];
    const targetVol = totalVolume * 0.7;

    while (vaVol < targetVol && (lowIdx > 0 || highIdx < bins - 1)) {
      const belowVol = lowIdx > 0 ? hist[lowIdx - 1] : -1;
      const aboveVol = highIdx < bins - 1 ? hist[highIdx + 1] : -1;
      if (aboveVol >= belowVol && highIdx < bins - 1) {
        highIdx += 1;
        vaVol += hist[highIdx];
      } else if (lowIdx > 0) {
        lowIdx -= 1;
        vaVol += hist[lowIdx];
      } else {
        break;
      }
    }

    const val = sessionLow + lowIdx * step;
    const vah = sessionLow + (highIdx + 1) * step;

    const firstOpen = windowBars[0].open || windowBars[0].close;
    const lastClose = windowBars[windowBars.length - 1].close;
    const netEfficiency = Math.abs(lastClose - firstOpen) / Math.max(sessionHigh - sessionLow, 1e-9);
    const insideRatio =
      windowBars.filter((b) => b.close >= val * 0.9985 && b.close <= vah * 1.0015).length / windowBars.length;
    const isRange = netEfficiency < 0.42 || insideRatio >= 0.62;

    const pricePosition: MarketProfileSummary["pricePosition"] =
      px > vah ? "above_vah" : px < val ? "below_val" : "inside_va";

    const profileBins: MarketProfileBin[] = [];
    for (let i = 0; i < bins; i++) {
      profileBins.push({
        price: Number((sessionLow + (i + 0.5) * step).toFixed(5)),
        volume: Number(hist[i].toFixed(2)),
        inValueArea: i >= lowIdx && i <= highIdx,
        isPoc: i === pocIdx,
      });
    }

    return {
      symbol,
      poc,
      vah,
      val,
      sessionHigh,
      sessionLow,
      totalVolume: Number(totalVolume.toFixed(2)),
      valueAreaPct: 0.7,
      isRange,
      pricePosition,
      bins: profileBins,
      updatedAt: now,
    };
  }

  /**
   * Règle stricte Market Profile (Mean-Reversion en Range) :
   * Interdiction de LONG au-dessus du VAH ou de SHORT en-dessous du VAL si le marché est en range.
   */
  static checkRangeEntryAllowed(
    direction: Direction,
    currentPrice: number,
    profile: MarketProfileSummary | undefined,
    isRangeMarket?: boolean,
  ): { allowed: boolean; reason?: string } {
    if (!profile) return { allowed: true };
    const inRange = isRangeMarket ?? profile.isRange;
    if (!inRange) return { allowed: true };

    if (direction === "long" && currentPrice > profile.vah) {
      return {
        allowed: false,
        reason: `[MARKET PROFILE VETO] LONG interdit au-dessus du VAH (${profile.vah.toFixed(4)}) en marché range (repli attendu vers POC ${profile.poc.toFixed(4)}).`,
      };
    }
    if (direction === "short" && currentPrice < profile.val) {
      return {
        allowed: false,
        reason: `[MARKET PROFILE VETO] SHORT interdit en-dessous du VAL (${profile.val.toFixed(4)}) en marché range (rebond attendu vers POC ${profile.poc.toFixed(4)}).`,
      };
    }
    return { allowed: true };
  }
}
