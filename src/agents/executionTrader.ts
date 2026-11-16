import type { Ticket } from "../types.ts";

export class ExecutionTraderAgent {
  /**
   * High-frequency Fiat-Target Take Profit Evaluator
   *
   * Completely ignores technical R-multiples or chart-based targets.
   * Checks if unrealized PnL is between $50 and $100 (or >= $50),
   * and signals an immediate market close.
   */
  static evaluateFiatTargetTakeProfit(
    ticket: Ticket,
    currentPrice: number,
    minTargetFiat = 50,
    maxTargetFiat = 100,
  ): {
    shouldClose: boolean;
    unrealizedPnl: number;
    reason?: string;
  } {
    const fillPx = ticket.fillPrice ?? ticket.entry;
    if (!fillPx || fillPx <= 0) {
      return { shouldClose: false, unrealizedPnl: 0 };
    }

    const isLong = ticket.direction === "long";
    const priceDiff = isLong ? currentPrice - fillPx : fillPx - currentPrice;
    const priceMoveRatio = priceDiff / fillPx;
    const unrealizedPnl = ticket.notional * priceMoveRatio - (ticket.fees || 0);

    // TRIGGER: If unrealizedPnL is in the $50-$100 target band (or above $50)
    if (unrealizedPnl >= minTargetFiat) {
      return {
        shouldClose: true,
        unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
        reason: `[HFT FIAT-TARGET REACHED] Cible ${minTargetFiat}$ - ${maxTargetFiat}$ atteinte (+${unrealizedPnl.toFixed(2)}$). Sortie immédiate au marché.`,
      };
    }

    return {
      shouldClose: false,
      unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
    };
  }
}
