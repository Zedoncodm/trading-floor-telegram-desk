import type { GrpoCandidateOutcome, GrpoEngine, GrpoObservationState, MarketRegime } from "../rl/grpo.ts";
import type { PlayKind, Ticket } from "../types.ts";

export type TradeReviewOutput = {
  ticketId: string;
  asset: string;
  netPnl: number;
  rMultiple: number;
  grade: "A+" | "A" | "B" | "C";
  grpoUpdated: boolean;
  summary: string;
};

export type TradeAudit = {
  ticketId: string;
  asset: string;
  direction: string;
  playbook: string;
  closedAt: number;
  netPnl: number;
  rMultiple: number;
  /** Plan respecté : sortie sur SL/TP/time-stop prévus, risque effectif <= 1.2x le risque planifié. */
  planRespected: boolean;
  planNotes: string[];
  /** Justification technique présente et non triviale. */
  justified: boolean;
  /** Slippage d'entrée en points de prix et en fraction du SL. */
  entrySlippage: number;
  slippageR: number;
  durationMin: number;
  closeReason: string;
};

/**
 * Trade Reviewer (rôle allégé) : journalise et audite chaque trade INDIVIDUELLEMENT.
 * L'optimisation globale (biais, paires toxiques, paramètres) est déléguée au Strategy_Optimizer.
 */
export class ReviewerAgent {
  static auditTrade(ticket: Ticket): TradeAudit {
    const netPnl = ticket.pnl ?? 0;
    const riskUsd = Math.max(1e-6, ticket.riskUsd || 1);
    const rMultiple = Number((ticket.rMultiple ?? netPnl / riskUsd).toFixed(3));
    const slDist = Math.abs(ticket.entry - ticket.invalidation);
    const fill = ticket.fillPrice ?? ticket.entry;
    const adverse = ticket.direction === "long" ? fill - ticket.entry : ticket.entry - fill;
    const notes: string[] = [];
    const reason = String(ticket.closeReason ?? "unknown");
    const planned = ["target", "invalidation", "time", "progressive_stop", "trailing", "fiat_target"];
    let planRespected = true;
    if (!planned.some((p) => reason.includes(p))) {
      notes.push(`Sortie hors plan (${reason})`);
      planRespected = false;
    }
    if (netPnl < 0 && Math.abs(netPnl) > riskUsd * 1.2) {
      notes.push(`Perte ${Math.abs(netPnl).toFixed(0)}$ > 1.2x risque planifié (${riskUsd.toFixed(0)}$)`);
      planRespected = false;
    }
    const justified = (ticket.thesis ?? "").trim().length >= 25;
    if (!justified) notes.push("Justification technique insuffisante");
    const start = ticket.filledAt ?? ticket.createdAt;
    return {
      ticketId: ticket.id,
      asset: ticket.asset,
      direction: ticket.direction,
      playbook: String(ticket.engine ?? ticket.playbook),
      closedAt: ticket.closedAt ?? Date.now(),
      netPnl: Number(netPnl.toFixed(2)),
      rMultiple,
      planRespected,
      planNotes: notes,
      justified,
      entrySlippage: Number(adverse.toPrecision(6)),
      slippageR: slDist > 0 ? Number((adverse / slDist).toFixed(3)) : 0,
      durationMin: Number((((ticket.closedAt ?? Date.now()) - start) / 60_000).toFixed(1)),
      closeReason: reason,
    };
  }
  /**
   * Ingests a closed trade, computes exact R-Multiple, assigns a setup grade,
   * and updates the GRPO reinforcement learning state vector.
   */
  static reviewClosedTrade(
    ticket: Ticket,
    grpo: GrpoEngine,
    ctx: GrpoObservationState,
    siblingOutcomes: GrpoCandidateOutcome[] = [],
  ): TradeReviewOutput {
    const netPnl = ticket.pnl ?? 0;
    const riskUsd = Math.max(1e-6, ticket.riskUsd || 1);
    const rMultiple = Number((netPnl / riskUsd).toFixed(4));

    const grade: "A+" | "A" | "B" | "C" =
      rMultiple >= 2.0 ? "A+" : rMultiple >= 0.5 ? "A" : rMultiple >= -0.5 ? "B" : "C";

    const engineName = (ticket.engine ?? ticket.playbook) as PlayKind;
    const stopDist = Math.abs(ticket.entry - ticket.invalidation) / Math.max(ticket.entry, 1e-9);

    const outcome: GrpoCandidateOutcome = {
      config: {
        id: ticket.id,
        strategy: engineName,
        slMult: 1.35,
        tpMult: 2.0,
        leverage: ticket.leverage ?? 1,
        probOld: grpo.getStrategyWeight((ticket.regime as MarketRegime) || ctx.regime, engineName),
      },
      pnl: netPnl,
      realizedR: rMultiple,
      maxAdverseExcursion: ticket.maxAdverseExcursion ?? 0,
      stopDistance: stopDist,
      executionFees: ticket.fees ?? 0,
    };

    const group = siblingOutcomes.length ? [outcome, ...siblingOutcomes] : [outcome];
    grpo.updatePolicyFromGroup((ticket.regime as MarketRegime) || ctx.regime, group);

    return {
      ticketId: ticket.id,
      asset: ticket.asset,
      netPnl: Number(netPnl.toFixed(2)),
      rMultiple,
      grade,
      grpoUpdated: true,
      summary: `Audit ${ticket.id} (${ticket.asset} ${ticket.direction.toUpperCase()}) : PnL=${netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)}$, R=${rMultiple >= 0 ? "+" : ""}${rMultiple.toFixed(2)}R, Grade=${grade} -> GRPO mis à jour.`,
    };
  }
}
