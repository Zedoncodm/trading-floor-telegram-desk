import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateMarketSession,
  evaluateSpreadGuard,
  isPreRolloverScalpExitWindow,
  StaleQuoteTracker,
} from "../src/agents/marketGuard.ts";
import { ActiveTradeManager } from "../src/agents/activeTradeManager.ts";
import { ReviewerAgent } from "../src/agents/reviewer.ts";
import type { Ticket } from "../src/types.ts";

test("MarketSessionGuard bloque XAUUSD pendant le rollover quotidien 21:40-23:10 UTC", () => {
  // Mercredi 18 nov 2026 à 21:42:17 UTC (heure exacte de l'incident XAUUSD)
  const rolloverTs = Date.UTC(2026, 10, 18, 21, 42, 17);
  const res = evaluateMarketSession("XAUUSD", rolloverTs);
  assert.equal(res.tradable, false);
  assert.equal(res.status, "ROLLOVER_BLACKOUT");

  // Ouvert à 14:30 UTC
  const openTs = Date.UTC(2026, 10, 18, 14, 30, 0);
  const openRes = evaluateMarketSession("XAUUSD", openTs);
  assert.equal(openRes.tradable, true);
  assert.equal(openRes.status, "OPEN");
});

test("MarketSessionGuard bloque Forex pendant rollover 21:45-22:20 UTC et week-end", () => {
  const fxRollover = Date.UTC(2026, 10, 18, 21, 50, 0);
  assert.equal(evaluateMarketSession("USDCHF", fxRollover).tradable, false);

  // Samedi
  const sat = Date.UTC(2026, 10, 21, 12, 0, 0);
  assert.equal(evaluateMarketSession("EURUSD", sat).status, "WEEKEND_CLOSED");

  // Pré-rollover scalp window sur XAUUSD à 21:38 UTC
  const preRoll = Date.UTC(2026, 10, 18, 21, 38, 0);
  assert.equal(isPreRolloverScalpExitWindow("XAUUSD", preRoll), true);
});

test("SpreadGuard rejette un spread excessif vs SL ou ATR 5m", () => {
  const bad = evaluateSpreadGuard({
    symbol: "XAUUSD",
    bid: 3730.0,
    ask: 3733.0, // spread 3.0$
    slDist: 10.0, // 30% du SL > 18%
    atr5m: 6.0,
  });
  assert.equal(bad.ok, false);

  const ok = evaluateSpreadGuard({
    symbol: "XAUUSD",
    bid: 3730.0,
    ask: 3730.35, // spread 0.35$
    slDist: 8.0, // 4.4% du SL
    atr5m: 5.0,
  });
  assert.equal(ok.ok, true);
});

test("StaleQuoteTracker détecte une cotation figée > 45s", () => {
  const tracker = new StaleQuoteTracker();
  const t0 = 1_700_000_000_000;
  tracker.observe("XAUUSD", 3731.0, 3731.3, t0);
  assert.equal(tracker.check("XAUUSD", t0 + 20_000).stale, false);
  tracker.observe("XAUUSD", 3731.0, 3731.3, t0 + 50_000);
  assert.equal(tracker.check("XAUUSD", t0 + 50_000).stale, true);
});

test("ActiveTradeManager.effectiveExitPrice utilise BID pour LONG et ASK pour SHORT", () => {
  assert.equal(ActiveTradeManager.effectiveExitPrice("long", 100, 99.8, 100.2), 99.8);
  assert.equal(ActiveTradeManager.effectiveExitPrice("short", 100, 99.8, 100.2), 100.2);
});

test("ReviewerAgent reconnaît flow_exhaustion, adverse_selection et pre_rollover comme sorties planifiées", () => {
  const baseTicket = {
    id: "T-1",
    asset: "XAUUSD",
    direction: "short",
    playbook: "breakout",
    entry: 3730,
    fillPrice: 3730,
    invalidation: 3738,
    target: 3718,
    riskUsd: 50,
    pnl: 35,
    rMultiple: 0.7,
    thesis: "Cassure 5m confirmée avec momentum vendeur propre.",
    closeReason: "pre_rollover",
    createdAt: Date.now() - 300_000,
    closedAt: Date.now(),
  } as unknown as Ticket;
  const audit = ReviewerAgent.auditTrade(baseTicket);
  assert.equal(audit.planRespected, true);
});
