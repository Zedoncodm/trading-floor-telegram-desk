import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateMarketSession,
  evaluateMicroAccountMarginGuard,
  evaluateSpreadGuard,
  isPreRolloverScalpExitWindow,
  StaleQuoteTracker,
} from "../src/agents/marketGuard.ts";
import { ActiveTradeManager } from "../src/agents/activeTradeManager.ts";
import { ReviewerAgent } from "../src/agents/reviewer.ts";
import { TraderSkillsEngine } from "../src/agents/traderSkills.ts";
import { computeRiskBasedLots } from "../src/lotSizing.ts";
import { loadConfig } from "../src/config.ts";
import { TradingFloorDesk } from "../src/desk.ts";
import { DeskStore } from "../src/store.ts";
import { TelegramFloorRoom } from "../src/telegram.ts";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("LotSizing maxNotionalUsd empêche l'explosion à 10 lots d'Or sur SL serré", () => {
  // Compte 80 000 $, levier 5x, maxConcurrent=3 -> maxNotional ~ 133 333 $ -> <= 0.36 lot XAUUSD (JAMAIS 10 lots!)
  const res = computeRiskBasedLots({
    symbol: "XAUUSD",
    equity: 80_000,
    entry: 3710,
    stopLoss: 3708.5, // SL très serré 1.5$
    riskPercent: 0.015, // 1 200 $
    maxNotionalUsd: 133_333,
  });
  assert.equal(res.ok, true);
  assert.ok(res.finalLot <= 0.36, `Lot attendu <= 0.36, reçu ${res.finalLot}`);
  assert.ok(res.notionalUsd <= 135_000, `Notional attendu <= 135k, reçu ${res.notionalUsd}`);
});

test("MaxDayLoss Halt : augmenter la limite ou cliquer RESUME DESK débloque proprement le desk", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-halt-resume-"));
  try {
    const cfg = loadConfig(["--console"]);
    cfg.dataDir = dir;
    const store = new DeskStore(dir);
    const desk = new TradingFloorDesk(cfg, store, new TelegramFloorRoom(cfg));
    desk.state.startEquity = 85_000;
    desk.state.dayStartEquity = 85_000;
    desk.state.realizedPnl = -5_000; // equity = 80 000 $ (-5.88%)
    desk.state.halted = true;
    desk.state.haltKind = "loss";

    // 1) Augmenter maxDayLossPct à 10% (8 500 $ > 5 000 $) lève automatiquement le HALT
    await desk.updateBoardConfig({ settings: { maxDayLossPct: 0.10, maxDayLossMode: "pct" } });
    assert.equal(desk.state.halted, false);
    assert.equal(desk.state.haltKind, null);

    // 2) Si re-bloqué en perte, cliquer RESUME DESK recalibre dayStartEquity et reprend proprement
    desk.state.halted = true;
    desk.state.haltKind = "loss";
    const r = await desk.toggleManualHalt(false);
    assert.equal(r.ok, true);
    assert.equal(r.halted, false);
    assert.equal(desk.state.halted, false);
    assert.equal(desk.state.dayStartEquity, 80_000);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Focus HFT Mono-Paire respecte strictement maxConcurrentPositions (jamais 10-35 trades)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-hft-cap-"));
  try {
    const cfg = loadConfig(["--console"]);
    cfg.dataDir = dir;
    const store = new DeskStore(dir);
    const desk = new TradingFloorDesk(cfg, store, new TelegramFloorRoom(cfg));
    const now = Date.now();
    desk.state.startEquity = 80_000;
    desk.state.dayStartEquity = 80_000;
    desk.state.realizedPnl = 0;
    desk.state.tape = [
      {
        symbol: "XAUUSD",
        name: "Gold Spot",
        px: 3710,
        prev: 3708.5,
        change24h: 0.005,
        funding: null,
        oiUsd: null,
        bookImbalance: 0.2,
        venue1: "MT5",
        venue2: "YahooFinance",
        verified2ndSource: true,
        sparkline: [3705, 3707, 3708.5, 3710],
        updatedAt: now,
      },
    ];
    await desk.updateBoardConfig({
      settings: {
        focusSymbol: "XAUUSD",
        strictQuotaMode: true,
        tradesPerMinute: 30,
        maxConcurrentPositions: 2,
        defaultLeverage: 5,
        maxExposurePct: 0.5,
      },
    });
    const opened1 = await desk.runSinglePairHftQuotaStep(now, 3);
    const openNow = desk.state.tickets.filter((t) => t.status === "open");
    assert.equal(opened1, 2);
    assert.equal(openNow.length, 2);
    for (const t of openNow) {
      assert.ok((t.mt5Lots ?? 0) <= 0.6, `Lot HFT XAUUSD doit rester raisonnable (<= 0.6), reçu ${t.mt5Lots}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("MicroAccountMarginGuard (39.88€, 1:100) autorise EURUSD 0.01 lot mais bloque XAUUSD", () => {
  const fx = evaluateMicroAccountMarginGuard({
    symbol: "EURUSD",
    entry: 1.097,
    stopLoss: 1.0955, // 15 pips
    equity: 39.88,
    freeMargin: 39.88,
    accountLeverage: 100,
  });
  assert.equal(fx.ok, true);

  const gold = evaluateMicroAccountMarginGuard({
    symbol: "XAUUSD",
    entry: 3710,
    stopLoss: 3705.5,
    equity: 39.88,
    freeMargin: 39.88,
    accountLeverage: 100,
  });
  assert.equal(gold.ok, false);
});

test("Persistance courbe d'équité 3+ mois (balance fermé vs équité live) survit aux redémarrages sans jamais se réinitialiser", () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-curve-persist-"));
  try {
    const store1 = new DeskStore(dir);
    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 86_400_000;
    const thirtyDaysAgo = now - 30 * 86_400_000;
    const acct = "5059099599";

    store1.appendCurvePointToLedger(acct, {
      t: ninetyDaysAgo,
      eq: 40.0,
      balance: 40.0,
      realized: 0,
      unrealized: 0,
      drawdownPct: 0,
      accountLogin: acct,
    });
    store1.appendCurvePointToLedger(acct, {
      t: thirtyDaysAgo,
      eq: 52.5,
      balance: 50.0,
      realized: 10.0,
      unrealized: 2.5,
      drawdownPct: 0,
      accountLogin: acct,
    });
    store1.appendCurvePointToLedger(acct, {
      t: now,
      eq: 61.2,
      balance: 64.0,
      realized: 24.0,
      unrealized: -2.8,
      drawdownPct: 0.04,
      accountLogin: acct,
    });

    // Simuler un redémarrage complet du desk (nouvelle instance DeskStore)
    const store2 = new DeskStore(dir);
    const loaded = store2.loadPersistedCurveForAccount(acct, 365);
    assert.equal(loaded.length, 3);
    assert.equal(loaded[0].balance, 40.0);
    assert.equal(loaded[1].balance, 50.0);
    assert.equal(loaded[1].eq, 52.5);
    assert.equal(loaded[2].balance, 64.0);
    assert.equal(loaded[2].eq, 61.2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Isolation complète par compte MT5 : tickets, calendrier et audits Reviewer ne se mélangent jamais", () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-acct-iso-"));
  try {
    const store = new DeskStore(dir);
    const oldTicket = {
      id: "OLD-1",
      asset: "XAUUSD",
      direction: "short",
      status: "closed",
      pnl: -950,
      createdAt: Date.now() - 10_000,
      closedAt: Date.now() - 5_000,
    } as unknown as Ticket;
    const newTicket = {
      id: "NEW-1",
      asset: "EURUSD",
      direction: "long",
      status: "open",
      pnl: 0,
      createdAt: Date.now(),
    } as unknown as Ticket;

    store.saveAccountSnapshot("115677386", [oldTicket], []);
    store.saveAccountSnapshot("5059100180", [newTicket], []);

    const snapOld = store.loadAccountSnapshot("115677386");
    const snapNew = store.loadAccountSnapshot("5059100180");
    assert.equal(snapOld?.tickets.length, 1);
    assert.equal(snapOld?.tickets[0].id, "OLD-1");
    assert.equal(snapNew?.tickets.length, 1);
    assert.equal(snapNew?.tickets[0].id, "NEW-1");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Anti-Spike-Chasing (Q4) bloque l'achat d'un sommet étiré (cas USDJPY) et Q2 expire après 3h", () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-q4-"));
  try {
    const cfg = loadConfig(["--console"]);
    cfg.dataDir = dir;
    const desk = new TradingFloorDesk(cfg, new DeskStore(dir), new TelegramFloorRoom(cfg));
    const now = Date.now();
    // 25 barres plates autour de 159.30 puis spike brutal à 159.65 (sommet étiré)
    const bars = Array.from({ length: 25 }, (_, i) => {
      const px = i < 23 ? 159.30 : i === 23 ? 159.45 : 159.65;
      return {
        openTime: now - (25 - i) * 300_000,
        open: px - 0.02,
        high: px + 0.03,
        low: px - 0.03,
        close: px,
        volume: 100,
        closeTime: now - (24 - i) * 300_000 - 1,
      };
    });
    const resSpike = TraderSkillsEngine.evaluatePreTradeSelfQuestioning({
      state: desk.state,
      symbol: "USDJPY",
      direction: "long",
      entry: 159.65,
      stop: 159.35,
      target: 160.25,
      bars,
      atr: 0.12,
      now,
    });
    assert.equal(resSpike.pass, false);
    assert.equal(resSpike.flawCode, "SPIKE_EXHAUSTION_CHASING");

    // Gate post-perte vieille de 4h (> TTL 3h) ne bloque plus indéfiniment la paire
    desk.state.structuralGates = {
      EURUSD: {
        symbol: "EURUSD",
        at: now - 4 * 3600_000,
        lastOutcome: "HUMAN_MANUAL_CUT",
        lastDirection: "short",
        lastEntryPrice: 1.0965,
        lastExitPrice: 1.0976,
        lastPnl: -1.04,
        requireTrendAlignment: true,
        riskScaleMultiplier: 1.0,
        reason: "old manual cut",
      },
    };
    const flatEur = Array.from({ length: 25 }, (_, i) => ({
      openTime: now - (25 - i) * 300_000,
      open: 1.0980,
      high: 1.0985,
      low: 1.0975,
      close: 1.0979,
      volume: 100,
      closeTime: now - (24 - i) * 300_000 - 1,
    }));
    const resExpired = TraderSkillsEngine.evaluatePreTradeSelfQuestioning({
      state: desk.state,
      symbol: "EURUSD",
      direction: "short",
      entry: 1.0979,
      stop: 1.0999,
      target: 1.0945,
      bars: flatEur,
      atr: 0.0010,
      now,
    });
    assert.equal(resExpired.pass, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
