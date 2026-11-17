import type { Mt5CloudBridge } from "../mt5.ts";
import type { Ticket } from "../types.ts";

export type BreakEvenModifyDecision = {
  shouldModify: boolean;
  progressRatio: number;
  newStopLoss: number;
  takeProfit: number;
  reason?: string;
};

/**
 * ActiveTradeManager : supervise les positions ouvertes en temps réel et délègue
 * la protection Hard SL / Hard TP au courtier (OrderSend / OrderModify asynchrone)
 * sans bloquer la boucle de cotation ni attendre une clôture locale tardive.
 */
export class ActiveTradeManager {
  /**
   * Garantit que tout ticket transmis au courtier possède des bornes Hard SL / TP valides.
   */
  static ensureHardStopAndTarget(ticket: Ticket): { stopLoss: number; takeProfit: number } {
    const entry = ticket.fillPrice ?? ticket.entry;
    const isLong = ticket.direction === "long";
    let stopLoss = ticket.invalidation;
    let takeProfit = ticket.target;

    if (!Number.isFinite(stopLoss) || stopLoss <= 0 || (isLong ? stopLoss >= entry : stopLoss <= entry)) {
      stopLoss = isLong ? entry * 0.992 : entry * 1.008;
    }
    if (!Number.isFinite(takeProfit) || takeProfit <= 0 || (isLong ? takeProfit <= entry : takeProfit >= entry)) {
      const riskDist = Math.abs(entry - stopLoss) || entry * 0.008;
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

    const rawBeSl = isLong ? entry * (1 + Math.max(0.0002, feeBufferPct)) : entry * (1 - Math.max(0.0002, feeBufferPct));
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
}
