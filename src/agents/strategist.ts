import type { AggressivenessState, Direction, TradingRegime } from "../types.ts";

export type HftOrderTrigger = {
  trigger: boolean;
  side: Direction;
  orderType: "LIMIT" | "MARKET";
  price: number;
  expectedMicroMove: number;
  imbalance: number;
  momentumScore: number;
  thesis: string;
};

export class StrategistAgent {
  /**
   * Evaluates High-Frequency Barrage entry triggers based on
   * Level 2 Orderbook Imbalance and 1-tick momentum.
   */
  static evaluateHftBarrageEntry(
    symbol: string,
    bestBid: number,
    bestAsk: number,
    orderbookImbalance: number,
    ofiZScore: number,
    atr1m: number,
    aggressiveness: AggressivenessState,
    regime: TradingRegime = "standard",
  ): HftOrderTrigger | null {
    const isKamikaze = regime === "hft_kamikaze" || aggressiveness === "lagging_aggressive";
    if (!isKamikaze) {
      return null;
    }

    const midPrice = (bestBid + bestAsk) / 2;
    const spread = Math.max(1e-6, bestAsk - bestBid);
    const expectedMicroMove = atr1m > 0 ? atr1m * 0.2 : midPrice * 0.0005;

    // Combined momentum from L2 orderbook imbalance (-1 to +1) and OFI Z-score
    const momentum = orderbookImbalance * 0.6 + Math.tanh(ofiZScore) * 0.4;

    // Long trigger: bid wall / positive imbalance / upward momentum
    if (orderbookImbalance > 0.12 || ofiZScore > 0.8 || momentum > 0.15) {
      return {
        trigger: true,
        side: "long",
        orderType: "LIMIT",
        price: Number(bestBid.toFixed(4)),
        expectedMicroMove,
        imbalance: orderbookImbalance,
        momentumScore: Number(momentum.toFixed(3)),
        thesis: `[HFT KAMIKAZE BARRAGE] Déséquilibre L2 acheteur (+${(orderbookImbalance * 100).toFixed(1)}%, OFI Z=${ofiZScore.toFixed(2)}) -> Tir d'ordre rapide LONG @ ${bestBid}.`,
      };
    }

    // Short trigger: ask wall / negative imbalance / downward momentum
    if (orderbookImbalance < -0.12 || ofiZScore < -0.8 || momentum < -0.15) {
      return {
        trigger: true,
        side: "short",
        orderType: "LIMIT",
        price: Number(bestAsk.toFixed(4)),
        expectedMicroMove,
        imbalance: orderbookImbalance,
        momentumScore: Number(momentum.toFixed(3)),
        thesis: `[HFT KAMIKAZE BARRAGE] Déséquilibre L2 vendeur (${(orderbookImbalance * 100).toFixed(1)}%, OFI Z=${ofiZScore.toFixed(2)}) -> Tir d'ordre rapide SHORT @ ${bestAsk}.`,
      };
    }

    return null;
  }
}
