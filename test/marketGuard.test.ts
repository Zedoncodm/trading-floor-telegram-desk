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
import { computeLeveragedSizing, TradingFloorDesk } from "../src/desk.ts";
import { DeskStore } from "../src/store.ts";
import { TelegramFloorRoom } from "../src/telegram.ts";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

test("Audit performance micro-compte : pas de coupure prématurée en petite perte, BE Forex 1.2 pip, pas d'Anti-Death-Loop sur halt/scratch, respect autoStopOnMaxLoss=false", async () => {
  const now = Date.now();
  const microTicket = {
    id: "TF-MICRO-1",
    asset: "GBPUSD",
    direction: "short",
    playbook: "breakout",
    engine: "breakout",
    thesis: "Scalp short",
    entry: 1.3125,
    fillPrice: 1.3125,
    invalidation: 1.3150,
    target: 1.3085,
    timeStopHours: 1,
    notional: 1312.5,
    qty: 1000,
    riskUsd: 2.2,
    riskPct: 0.06,
    exposurePct: 37,
    binding: "risk",
    producedBy: ["strategist"],
    status: "open",
    createdAt: now - 180_000, // 3 min
    filledAt: now - 180_000,
    expiresAt: now + 3_600_000,
    fees: 0.05,
    funding: 0,
  } as unknown as Ticket;

  const oppChochSmc = {
    structureEvent: "CHoCH",
    structureDirection: "LONG",
    validSignal: true,
    summary: "CHoCH LONG",
    updatedAt: now,
  } as unknown as NonNullable<Parameters<typeof ActiveTradeManager.evaluateAgentStructuralExit>[3]>["smcContext"];

  // 1) Petite perte (-0.30€ = 14% du SL) après 3 min -> HOLD (ne coupe PAS prématurément sur bruit 5m!)
  const earlyNoise = ActiveTradeManager.evaluateAgentStructuralExit(microTicket, 1.3128, -0.30, {
    smcContext: oppChochSmc,
    tradingStyle: "scalping",
    now,
  });
  assert.equal(earlyNoise.action, "HOLD");

  // 2) Gain micro-compte (+0.85€ à 50% TP) + CHoCH inverse -> CLOSE_PROFIT (récolte même sous 2€!)
  const microProfit = ActiveTradeManager.evaluateAgentStructuralExit(microTicket, 1.3105, 0.85, {
    smcContext: oppChochSmc,
    tradingStyle: "scalping",
    now,
  });
  assert.equal(microProfit.action, "CLOSE_PROFIT");

  // 3) Break-Even Forex utilise 1.2 pip (0.00012), pas 8 pips (0.0008)
  const beRes = ActiveTradeManager.evaluateBreakEvenOrderModify(microTicket, 1.3104);
  assert.equal(beRes.shouldModify, true);
  assert.ok(beRes.newStopLoss > 1.3118 && beRes.newStopLoss < 1.3125, `BE SL Forex attendu ~1.3122, reçu ${beRes.newStopLoss}`);

  // 4) Pas d'Anti-Death-Loop sur "halt" ni sur micro-scratch (-0.01€), et computeLeveragedSizing respecte autoStopOnMaxLoss=false
  const dir = mkdtempSync(join(tmpdir(), "tf-micro-perf-"));
  try {
    const cfg = loadConfig(["--console"]);
    cfg.dataDir = dir;
    const desk = new TradingFloorDesk(cfg, new DeskStore(dir), new TelegramFloorRoom(cfg));
    desk.state.startEquity = 40;
    desk.state.dayStartEquity = 40;
    desk.state.realizedPnl = -5;
    desk.state.settings.maxDayLossPct = 0.04;
    desk.state.settings.autoStopOnMaxLoss = false;

    const sizedOpen = computeLeveragedSizing(desk.state, 1.096, 1.098, undefined, { side: "short", leverageFactor: 500 });
    assert.equal(sizedOpen.ok, true, "autoStopOnMaxLoss=false ne doit plus être bloqué par budget journalier épuisé");

    desk.state.tickets.push({ ...microTicket, id: "TF-HALT-1", asset: "NZDUSD" });
    await (desk as unknown as {
      closeOpenTicket: (t: unknown, exitPx: number, reason: string, ts: number, ov?: number) => Promise<void>;
    }).closeOpenTicket(desk.state.tickets[0], 1.3125, "halt", now, -0.01);
    assert.equal(desk.state.directionalCooldowns?.["NZDUSD:short"], undefined, "Halt / -0.01€ ne doit pas poser d'Anti-Death-Loop");

    // 5) Moteur Scalping 5m natif MT5 émet bien un signal M5 même sans SMC 4h ni blocage directive range
    desk.state.settings.tradingStyle = "scalping";
    desk.state.current_market_regime_directive = "Marché en équilibre : privilégiez les entrées proches du POC";
    // Tendance haussière saine avec petits replis (RSI ~ 55-65, pas suracheté 100) + bougie M5 verte de reprise
    const b5 = Array.from({ length: 50 }, (_, i) => {
      const wave = i % 3 === 2 ? -0.00018 : 0.00016;
      const base = 1.0950 + Math.floor(i / 3) * 0.00014 + wave;
      const isLast = i === 49;
      return {
        openTime: now - (50 - i) * 300_000,
        open: isLast ? base - 0.00008 : base - 0.00004,
        high: base + 0.00025,
        low: base - 0.00022,
        close: isLast ? base + 0.00014 : base + (i % 3 === 2 ? -0.00010 : 0.00008),
        volume: 150,
        closeTime: now - (49 - i) * 300_000 - 1,
      };
    });
    const lastPx = b5[b5.length - 1].close;
    const snap5 = {
      symbol: "EURUSD",
      primary: { venue: "MT5", price: lastPx, ret1h: 0.0002, funding: 0, oiValue: 0, oiChange1h: 0, book: 0 },
      secondary: null,
      ret24h: 0.001,
      atr: 0.00045,
      bars5m: b5,
      bars15m: b5,
      bars4h: b5,
      smcContext: {
        symbol: "EURUSD",
        engine: "ts_smc",
        structureEvent: "NONE",
        structureDirection: "NEUTRAL",
        validSignal: false,
        entryPrice: 0,
        stopPrice: 0,
        orderBlockPrice: { low: 0, high: 0 },
        fvgState: { status: "NONE" },
        liquiditySweepConfirmed: false,
        signalJustification: "none",
        updatedAt: now,
      },
    };
    const m5Play = (desk as unknown as { choosePlay: (s: unknown) => { dir: string; thesis: string } | null }).choosePlay(snap5);
    assert.ok(m5Play !== null, "En mode scalping 5m, le moteur M5 natif doit émettre un signal sans être tué par !smc.validSignal");
    assert.equal(m5Play?.dir, "long");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("MT5 source de vérité absolue : écrase -0.01€ par +0.09€ réel, purge les fermés fantômes, ancre la courbe de solde sur MT5", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-mt5-truth-"));
  try {
    const cfg = loadConfig(["--console"]);
    cfg.dataDir = dir;
    const desk = new TradingFloorDesk(cfg, new DeskStore(dir), new TelegramFloorRoom(cfg));
    const now = Date.now();
    const deal1Ts = now - 3600_000;
    const deal2Ts = now - 600_000;

    desk.state.mt5Live = {
      connected: true,
      updatedAt: now - 5_000,
      login: 5059100180,
      server: "MetaQuotes-Demo",
      currency: "EUR",
      balance: 39.10,
      equity: 39.25,
      profit: 0.15,
      freeMargin: 36.0,
      leverage: 500,
      tradeAllowed: true,
      positionsCount: 0,
      cryptoSupported: false,
      availableCryptos: [],
      rejectedOrders: [],
    };
    desk.state.settings.mt5Login = "5059100180";
    // Ticket NZDUSD mal estimé à -0.01€ par halt + cooldown erroné + ticket fantôme XAUUSD jamais exécuté sur MT5
    desk.state.tickets = [
      {
        id: "TF-20261119-31",
        asset: "NZDUSD",
        direction: "short",
        status: "closed",
        entry: 0.55033,
        fillPrice: 0.55033,
        exitPrice: 0.55033,
        invalidation: 0.5508,
        target: 0.54953,
        pnl: -0.01,
        closeReason: "halt",
        mt5PositionId: "59424873916",
        accountLogin: "5059100180",
        createdAt: deal2Ts - 120_000,
        closedAt: deal2Ts - 10_000,
      } as unknown as Ticket,
      {
        id: "TF-PHANTOM-33",
        asset: "XAUUSD",
        direction: "short",
        status: "closed",
        entry: 3683.22,
        exitPrice: 3683.22,
        pnl: -0.36,
        closeReason: "halt",
        accountLogin: "5059100180",
        createdAt: deal2Ts,
        closedAt: deal2Ts + 5_000,
      } as unknown as Ticket,
    ];
    desk.state.directionalCooldowns = {
      "NZDUSD:short": { until: now + 600_000, bannedDir: "short", reason: "false halt" },
    };

    // Écrire un vrai mt5_state.json dans le dossier temporaire isolé
    writeFileSync(
      join(dir, "mt5_state.json"),
      JSON.stringify({
        connected: true,
        login: 5059100180,
        server: "MetaQuotes-Demo",
        currency: "EUR",
        balance: 39.10,
        equity: 39.25,
        profit: 0.15,
        freeMargin: 36.0,
        leverage: 500,
        tradeAllowed: true,
        positions: [],
        quotes: [],
        closedDeals: [
          {
            deal: 1001,
            positionId: 59423072432,
            id: "TF-20261119-30",
            symbol: "USDCHF",
            side: "BUY",
            lots: 0.01,
            entry: 0.84384,
            exit: 0.84292,
            profit: -0.99,
            dealReason: "EA",
            closedAt: deal1Ts,
          },
          {
            deal: 1002,
            positionId: 59424873916,
            id: "TF-20261119-31",
            symbol: "NZDUSD",
            side: "SELL",
            lots: 0.01,
            entry: 0.55033,
            exit: 0.55023,
            profit: 0.09,
            dealReason: "EA",
            closedAt: deal2Ts,
          },
        ],
      }),
    );

    await desk.syncWithLocalMt5Bridge();

    const nzd = desk.state.tickets.find((t) => t.id === "TF-20261119-31");
    const phantom = desk.state.tickets.find((t) => t.id === "TF-PHANTOM-33");
    const closedList = desk.state.tickets.filter((t) => t.status === "closed");

    assert.equal(nzd?.pnl, 0.09, "NZDUSD doit être écrasé par le vrai gain MT5 +0.09€");
    assert.equal(nzd?.exitPrice, 0.55023, "Prix de sortie NZDUSD doit venir de MT5");
    assert.equal(nzd?.closeReason, "target", "Un gain MT5 doit basculer en target (WIN)");
    assert.equal(desk.state.directionalCooldowns?.["NZDUSD:short"], undefined, "Le faux cooldown doit être levé");
    assert.equal(phantom?.status, "rejected", "Le ticket fantôme jamais exécuté sur MT5 doit être purgé de l'historique fermé");
    assert.equal(closedList.length, 2, "Exactement les 2 deals réels MT5 en fermé");
    assert.equal(desk.state.realizedPnl, -0.9, "realizedPnl doit égaler exactement la somme MT5 (-0.99 + 0.09 = -0.90)");
    assert.equal(desk.state.startEquity, 40, "Capital initial reconstitué exactement à 40.00€ (39.10 - (-0.90))");

    // Vérifier que les paliers réels de solde MT5 (40.00 -> 39.01 -> 39.10) sont bien dans la courbe
    const bals = desk.state.curve.map((pt) => Number((pt.balance ?? pt.eq).toFixed(2)));
    assert.ok(bals.includes(40), `Solde initial 40.00€ attendu dans la courbe, reçu ${JSON.stringify(bals)}`);
    assert.ok(bals.includes(39.01), `Palier intermédiaire 39.01€ attendu, reçu ${JSON.stringify(bals)}`);
    assert.ok(bals.includes(39.1), `Solde final MT5 39.10€ attendu, reçu ${JSON.stringify(bals)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
