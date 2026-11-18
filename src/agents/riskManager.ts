import type { AggressivenessState, Direction, Kline, Ticket, TradingRegime } from "../types.ts";

export type HftSizingResult = {
  ok: boolean;
  targetFiatProfit: number;
  expectedPriceMove: number;
  expectedPriceMovePct: number;
  requiredNotional: number;
  leverage: number;
  requiredMargin: number;
  lotSize: number;
  liquidationPrice: number;
  reason?: string;
};

export class RiskManagerAgent {
  /**
   * Dynamically calculates maximum concurrent trades based on available margin,
   * volatility, aggressiveness, and regime.
   */
  static calculateDynamicConcurrency(
    availableMargin: number,
    totalEquity: number,
    volatility: number,
    aggressiveness: AggressivenessState,
    regime: TradingRegime = "standard",
    maxConcurrentOverride?: number,
  ): number {
    if (regime === "hft_kamikaze" || aggressiveness === "lagging_aggressive") {
      // In High Aggressiveness / Kamikaze mode, allow up to 50 simultaneous micro-positions
      // provided liquidation threshold and margin headroom are maintained.
      const marginPerPosition = Math.max(20, totalEquity * 0.005);
      const marginCapacity = Math.floor((availableMargin * 0.85) / marginPerPosition);
      return Math.min(50, Math.max(10, marginCapacity));
    }

    const override =
      typeof maxConcurrentOverride === "number" && Number.isFinite(maxConcurrentOverride) && maxConcurrentOverride >= 1
        ? Math.min(8, Math.round(maxConcurrentOverride))
        : null;

    if (aggressiveness === "target_reached" || aggressiveness === "secured") {
      // Par défaut prudent (1) sauf si le pilote multi-paires est explicitement débloqué
      return override !== null ? Math.min(override, aggressiveness === "secured" ? 3 : override) : 1;
    }

    if (override !== null) {
      return override;
    }

    // Standard regime
    const baseConcurrency = totalEquity >= 50_000 ? 5 : 3;
    const volAdjustment = volatility > 0.03 ? -1 : volatility < 0.01 ? 1 : 0;
    return Math.max(2, Math.min(8, baseConcurrency + volAdjustment));
  }

  /**
   * Reverse-Engineered Position Sizing for "HFT FIAT-TARGET SCALPER"
   *
   * Formula:
   * expectedPriceMove = AverageTrueRange(1m) * 0.2 (micro-move)
   * requiredNotional = TargetFiatProfit / (expectedPriceMove / currentPrice)
   * Leverage = up to 500x to minimize required margin
   */
  static reverseEngineerHftSizing(
    currentPrice: number,
    atr1m: number,
    targetFiatProfit = 75, // Midpoint between $50 and $100
    side: "long" | "short" = "long",
    maxLeverage = 500,
    availableMargin = 10_000,
  ): HftSizingResult {
    const price = Math.max(currentPrice, 1e-6);

    // Micro-move expected: 0.2 * ATR(1m), with fallback to 0.05% of price
    const expectedPriceMove = atr1m > 0 ? atr1m * 0.2 : price * 0.0005;
    const expectedPriceMovePct = expectedPriceMove / price;

    if (expectedPriceMovePct <= 1e-6) {
      return {
        ok: false,
        targetFiatProfit,
        expectedPriceMove,
        expectedPriceMovePct,
        requiredNotional: 0,
        leverage: 1,
        requiredMargin: 0,
        lotSize: 0,
        liquidationPrice: 0,
        reason: "Micro-mouvement estimé quasi nul, impossible d'extraire la cible.",
      };
    }

    // Required notional to yield targetFiatProfit on this micro-move
    const rawRequiredNotional = targetFiatProfit / expectedPriceMovePct;

    // Apply high leverage (up to 500x)
    const appliedLeverage = Math.max(1, Math.min(500, maxLeverage));
    let requiredMargin = rawRequiredNotional / appliedLeverage;

    let finalNotional = rawRequiredNotional;
    if (requiredMargin > availableMargin * 0.9) {
      // Scale down if available margin is tight
      requiredMargin = availableMargin * 0.9;
      finalNotional = requiredMargin * appliedLeverage;
    }

    const lotSize = Number((finalNotional / price).toFixed(6));

    // Liquidation price calculation with 0.5% maintenance margin
    const mmr = Math.min(0.005, (1 / appliedLeverage) * 0.35);
    const liquidationPrice =
      side === "long"
        ? price * (1 - 1 / appliedLeverage + mmr)
        : price * (1 + 1 / appliedLeverage - mmr);

    return {
      ok: true,
      targetFiatProfit,
      expectedPriceMove,
      expectedPriceMovePct,
      requiredNotional: Number(finalNotional.toFixed(2)),
      leverage: appliedLeverage,
      requiredMargin: Number(requiredMargin.toFixed(2)),
      lotSize,
      liquidationPrice: Number(liquidationPrice.toFixed(4)),
    };
  }

  /**
   * Kelly Criterion modified for HFT micro-edges with alpha decay scaling.
   */
  static computeModifiedHftKelly(
    winRate: number,
    payoffRatio: number,
    alphaDecayMultiplier = 1.0,
    maxRiskPct = 0.03,
  ): number {
    const p = Math.max(0.25, Math.min(0.85, winRate));
    const b = Math.max(1.05, payoffRatio);
    const fullKelly = Math.max(0.005, (p * b - (1 - p)) / b);
    const fractionalHftKelly = fullKelly * 0.25 * alphaDecayMultiplier;
    return Number(Math.max(0.002, Math.min(maxRiskPct, fractionalHftKelly)).toFixed(5));
  }

  /**
   * Strictly verifies that the Liquidation Price is at least 15% further
   * from entry than the Stop-Loss price.
   */
  static verifyLiquidationBuffer15Pct(
    entryPrice: number,
    stopLossPrice: number,
    leverage: number,
    side: "long" | "short",
    maintenanceMarginRate = 0.005,
  ): { safe: boolean; liqPrice: number; bufferRatio: number } {
    const lev = Math.max(1, Math.min(500, leverage));
    const mmr = Math.min(maintenanceMarginRate, (1 / lev) * 0.35);
    const liqPrice =
      side === "long"
        ? entryPrice * (1 - 1 / lev + mmr)
        : entryPrice * (1 + 1 / lev - mmr);
    const liqDist = Math.abs(entryPrice - liqPrice);
    if (liqDist <= 1e-9) {
      return { safe: false, liqPrice, bufferRatio: 0 };
    }
    if (side === "long") {
      if (stopLossPrice <= liqPrice) return { safe: false, liqPrice, bufferRatio: 0 };
      const ratio = (stopLossPrice - liqPrice) / liqDist;
      return { safe: ratio >= 0.15, liqPrice, bufferRatio: Number(ratio.toFixed(4)) };
    }
    if (stopLossPrice >= liqPrice) return { safe: false, liqPrice, bufferRatio: 0 };
    const ratio = (liqPrice - stopLossPrice) / liqDist;
    return { safe: ratio >= 0.15, liqPrice, bufferRatio: Number(ratio.toFixed(4)) };
  }

  /**
   * Calcule la corrélation de Pearson sur les rendements des 40 dernières bougies
   * et qualifie la relation : POSITIVE (>= +0.60), NÉGATIVE (<= -0.60) ou NEUTRE.
   */
  static computePairPearson(barsA: Kline[], barsB: Kline[]): {
    r: number;
    regime: "POSITIVE" | "NEGATIVE" | "NEUTRE";
  } {
    const n = Math.min(barsA.length, barsB.length, 45);
    if (n < 12) return { r: 0, regime: "NEUTRE" };
    const a = barsA.slice(-n);
    const b = barsB.slice(-n);
    const retA: number[] = [];
    const retB: number[] = [];
    for (let i = 1; i < n; i++) {
      const ra = a[i - 1].close > 0 ? (a[i].close - a[i - 1].close) / a[i - 1].close : 0;
      const rb = b[i - 1].close > 0 ? (b[i].close - b[i - 1].close) / b[i - 1].close : 0;
      retA.push(ra);
      retB.push(rb);
    }
    const m = retA.length;
    const meanA = retA.reduce((s, x) => s + x, 0) / m;
    const meanB = retB.reduce((s, x) => s + x, 0) / m;
    let num = 0;
    let denA = 0;
    let denB = 0;
    for (let i = 0; i < m; i++) {
      const da = retA[i] - meanA;
      const db = retB[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }
    const den = Math.sqrt(denA * denB);
    const r = den > 1e-12 ? Math.max(-1, Math.min(1, num / den)) : 0;
    const regime: "POSITIVE" | "NEGATIVE" | "NEUTRE" =
      r >= 0.60 ? "POSITIVE" : r <= -0.60 ? "NEGATIVE" : "NEUTRE";
    return { r: Number(r.toFixed(2)), regime };
  }

  private static currencyNetExposure(symbol: string, dir: Direction): Record<string, number> {
    const s = symbol.toUpperCase();
    const sign = dir === "long" ? 1 : -1;
    if (/^[A-Z]{6}$/.test(s)) {
      const base = s.slice(0, 3);
      const quote = s.slice(3, 6);
      return { [base]: sign, [quote]: -sign };
    }
    if (s.startsWith("XAU")) return { XAU: sign, USD: -sign };
    if (s.startsWith("XAG")) return { XAG: sign, USD: -sign };
    return { [s]: sign };
  }

  /**
   * Vérifie les corrélations (Positive / Négative / Neutre) entre la paire candidate
   * et les positions déjà ouvertes pour éviter de doubler une même exposition directionnelle.
   */
  static evaluatePortfolioCorrelation(
    candidateSymbol: string,
    candidateDir: Direction,
    openTickets: Ticket[],
    barsBySymbol: Map<string, Kline[]>,
  ): {
    allowed: boolean;
    summary: string;
    details: Array<{ openAsset: string; openDir: Direction; r: number; regime: "POSITIVE" | "NEGATIVE" | "NEUTRE"; redundant: boolean }>;
  } {
    if (!openTickets.length) {
      return {
        allowed: true,
        summary: "Corrélation portefeuille : NEUTRE (aucune position ouverte concurrente).",
        details: [],
      };
    }

    const candBars = barsBySymbol.get(candidateSymbol) ?? [];
    const details: Array<{ openAsset: string; openDir: Direction; r: number; regime: "POSITIVE" | "NEGATIVE" | "NEUTRE"; redundant: boolean }> = [];
    const currencyCounts: Record<string, number> = {};
    for (const t of openTickets) {
      const exp = RiskManagerAgent.currencyNetExposure(t.asset, t.direction);
      for (const [ccy, sgn] of Object.entries(exp)) {
        const key = `${ccy}:${sgn > 0 ? "+" : "-"}`;
        currencyCounts[key] = (currencyCounts[key] ?? 0) + 1;
      }
      const openBars = barsBySymbol.get(t.asset) ?? [];
      const pearson = RiskManagerAgent.computePairPearson(candBars, openBars);
      const redundant =
        (pearson.regime === "POSITIVE" && pearson.r >= 0.70 && candidateDir === t.direction) ||
        (pearson.regime === "NEGATIVE" && pearson.r <= -0.70 && candidateDir !== t.direction);
      details.push({
        openAsset: t.asset,
        openDir: t.direction,
        r: pearson.r,
        regime: pearson.regime,
        redundant,
      });
    }

    const blockedCorr = details.find((d) => d.redundant);
    if (blockedCorr) {
      return {
        allowed: false,
        summary: `[CORRÉLATION ${blockedCorr.regime} r=${blockedCorr.r >= 0 ? "+" : ""}${blockedCorr.r.toFixed(2)}] ${candidateSymbol} ${candidateDir.toUpperCase()} redondant avec ${blockedCorr.openAsset} ${blockedCorr.openDir.toUpperCase()} -> rejeté pour éviter le sur-risque corrélé.`,
        details,
      };
    }

    const candExp = RiskManagerAgent.currencyNetExposure(candidateSymbol, candidateDir);
    for (const [ccy, sgn] of Object.entries(candExp)) {
      const key = `${ccy}:${sgn > 0 ? "+" : "-"}`;
      if ((currencyCounts[key] ?? 0) >= 2) {
        return {
          allowed: false,
          summary: `[EXPOSITION DEVISE SATURÉE] ${candidateSymbol} ${candidateDir.toUpperCase()} ajouterait une 3e exposition ${ccy} (${sgn > 0 ? "LONG" : "SHORT"}) -> rejeté par le Risk Manager.`,
          details,
        };
      }
    }

    const summaryList = details
      .map((d) => `${d.openAsset}(${d.regime} ${d.r >= 0 ? "+" : ""}${d.r.toFixed(2)})`)
      .join(", ");
    return {
      allowed: true,
      summary: `Corrélation validée (${summaryList}) : diversification OK.`,
      details,
    };
  }
}
