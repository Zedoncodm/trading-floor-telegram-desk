import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { Config } from "../src/config.ts";
import { DeskLeadAgent, PacingCalculator } from "../src/agents/deskLead.ts";
import { createDefaultSettings, DEFAULT_AGENT_PROMPTS, PROMPT_SCHEMA_VERSION } from "../src/llm.ts";
import { aggregateKlines, verifySecondSource } from "../src/market.ts";
import { computeLeveragedSizing, SocialSentimentEngine, TradingFloorDesk } from "../src/desk.ts";
import { GrpoEngine } from "../src/rl/grpo.ts";
import { DeskStore } from "../src/store.ts";
import { TelegramFloorRoom } from "../src/telegram.ts";
import { ActiveTradeManager } from "../src/agents/activeTradeManager.ts";
import { LiquidityHunterAgent } from "../src/agents/liquidityHunter.ts";
import { MarketProfileAnalyzer } from "../src/agents/marketProfile.ts";
import { SentinelAgent, TokenBucketRateLimiter } from "../src/agents/sentinel.ts";
import { Mt5CloudBridge } from "../src/mt5.ts";
import type { Kline, MarketSnapshot, Ticket } from "../src/types.ts";
import { DASHBOARD_HTML } from "../src/ui.ts";

function makeTestCfg(dataDir: string): Config {
  return {
    mode: "console",
    tradingMode: "paper",
    tokens: {
      lead: "",
      analyst: "",
      strategist: "",
      risk: "",
      execution: "",
      reviewer: "",
      sentinel: "",
      hunter: "",
    },
    chatId: "",
    humanUserId: 0,
    humanUsername: "tester",
    timeZone: "Europe/Paris",
    paperEquity: 10_000,
    symbols: ["BTCUSDT", "ETHUSDT"],
    scanIntervalMin: 15,
    monitorIntervalSec: 5,
    ticketTtlMin: 15,
    overnightStart: 23,
    overnightEnd: 7,
    reportHour: 9,
    dataDir,
    binanceKey: "",
    binanceSecret: "",
  };
}

test("computeLeveragedSizing enforces exact formula, Liquidation Guard Hard Veto, and auto-reduction", () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-lev-"));
  try {
    const store = new DeskStore(dir);
    const state = store.loadOrCreate(10_000, "Europe/Paris", ["BTCUSDT"], 15);
    state.settings.maxRiskPct = 0.01;
    state.settings.stopMaxPct = 0.25;

    // Case 1: Safe LONG with 5x leverage
    // entry=100, stop=95 (5% distance), lev=5x, mmr=0.005 -> liqPrice = 100 * (1 - 0.2 + 0.005) = 80.5
    const safeRes = computeLeveragedSizing(state, 100, 95, undefined, {
      side: "long",
      leverageFactor: 5,
      maintenanceMarginRate: 0.005,
      takerFee: 0.0004,
      expectedSlippage: 0.0002,
      autoReduceLeverage: false,
    });
    assert.equal(safeRes.ok, true);
    assert.equal(safeRes.leverage, 5);
    assert.ok(Math.abs((safeRes.liqPrice ?? 0) - 80.5) < 1e-6);
    const expectedRaw = (10_000 * 0.01) / (0.05 + 0.0004 * 2 + 0.0002);
    assert.ok(Math.abs((safeRes.notional ?? 0) - expectedRaw) < 1e-4);

    // Case 2: HARD VETO when stop is within 15% buffer of liqPrice (autoReduceLeverage: false)
    // entry=100, stop=91 (9% stop), lev=10x, mmr=0.005 -> liqPrice=90.5 -> (91 - 90.5) / 9.5 = 5.26% < 15%
    const vetoRes = computeLeveragedSizing(state, 100, 91, undefined, {
      side: "long",
      leverageFactor: 10,
      maintenanceMarginRate: 0.005,
      autoReduceLeverage: false,
    });
    assert.equal(vetoRes.ok, false);
    assert.match(vetoRes.reason ?? "", /HARD VETO|liquidation/i);

    // Case 3: Auto-reduction reduces leverage until stop is outside 15% buffer (SHORT test too)
    // entry=100, stop=109 (9% stop), requested lev=10x -> liqShort at 10x is 109.5 (unsafe) -> reduces down
    const reducedShort = computeLeveragedSizing(state, 100, 109, undefined, {
      side: "short",
      leverageFactor: 10,
      maintenanceMarginRate: 0.005,
      autoReduceLeverage: true,
    });
    assert.equal(reducedShort.ok, true);
    assert.ok((reducedShort.leverage ?? 10) < 10);
    assert.ok((reducedShort.liqPrice ?? 0) > 109);

    // Case 4: Extreme leverage up to 500x with safe tight stop (0.10% stop vs ~0.13% liq distance)
    const extremeLev = computeLeveragedSizing(state, 100, 99.9, undefined, {
      side: "long",
      leverageFactor: 500,
      maintenanceMarginRate: 0.005,
      autoReduceLeverage: false,
    });
    assert.equal(extremeLev.ok, true);
    assert.equal(extremeLev.leverage, 500);
    assert.ok((extremeLev.liqPrice ?? 0) > 99.8 && (extremeLev.liqPrice ?? 0) < 99.9);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("SocialSentimentEngine extracts cashtags and normalizes score within [-1, +1]", () => {
  const engine = new SocialSentimentEngine();
  const now = Date.now();
  engine.ingestPosts(
    [
      { author: "whale1", authority: 3.0, text: "$BTC breakout surge bullish inflow", likes: 500, retweets: 100, timestamp: now },
      { author: "whale2", authority: 2.0, text: "$SOL crash liquidation dump bear", likes: 200, retweets: 50, timestamp: now },
    ],
    now,
  );
  const btcScore = engine.getScore("BTCUSDT");
  const solScore = engine.getScore("SOLUSDT");
  assert.ok(btcScore > 0.5 && btcScore <= 1.0);
  assert.ok(solScore < -0.5 && solScore >= -1.0);
  const snap = engine.getSamplesSnapshot();
  assert.ok(snap.BTCUSDT.cashtags.includes("$BTC"));
  assert.equal(snap.BTCUSDT.mentions, 1);
});

test("TradingFloorDesk webhooks handle Macro VOLATILITY_SHIELD and FOMO validation gates", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-hooks-"));
  try {
    const cfg = makeTestCfg(dir);
    const store = new DeskStore(dir);
    const tg = new TelegramFloorRoom(cfg);
    const grpo = new GrpoEngine(join(dir, "rl_policy_memory.json"), join(dir, "reviewer_reports.json"));
    const desk = new TradingFloorDesk(cfg, store, tg, grpo);

    const macroRes = await desk.ingestMacroWebhook({
      event: "US CPI YoY",
      actual: 3.4,
      forecast: 3.1,
      previous: 3.0,
      timestamp: Date.now(),
      impact: "HIGH",
    });
    assert.equal(macroRes.ok, true);
    assert.ok(Math.abs(macroRes.macroSurpriseIndex - (3.4 - 3.1) / 3.1) < 1e-6);
    assert.equal(macroRes.volatilityShieldActive, true);
    assert.equal(desk.isVolatilityShieldActive(), true);

    const lowWr = await desk.ingestFomoWebhook({
      traderId: "degen_low",
      winRate: 0.45,
      symbol: "BTCUSDT",
      side: "LONG",
      entryPrice: 90000,
      leverage: 5,
      timestamp: Date.now(),
    });
    assert.equal(lowWr.accepted, false);

    const stale = await desk.ingestFomoWebhook({
      traderId: "slow_whale",
      winRate: 0.78,
      symbol: "BTCUSDT",
      side: "LONG",
      entryPrice: 90000,
      leverage: 5,
      timestamp: Date.now() - 8000,
    });
    assert.equal(stale.accepted, false);

    const valid = await desk.ingestFomoWebhook({
      traderId: "top_quant",
      winRate: 0.74,
      symbol: "ETHUSDT",
      side: "LONG",
      entryPrice: 3200,
      leverage: 5,
      timestamp: Date.now(),
    });
    assert.equal(valid.accepted, true);
    assert.equal(valid.fomoConfluenceBoost, 0.15);
    assert.equal(desk.getActiveFomoBoost("ETHUSDT", "long"), 0.15);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("GrpoEngine computes normalized advantages, atomic persistence with .bak, and reviewer diagnostics", () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-grpo-"));
  const memPath = join(dir, "rl_policy_memory.json");
  const revPath = join(dir, "reviewer_reports.json");
  try {
    const grpo = new GrpoEngine(memPath, revPath);
    const cands = grpo.sampleCandidateGroup(
      {
        regime: "TRENDING_UP",
        volatility: 0.015,
        ofiZScore: 1.8,
        vwapZScore: 1.2,
        fvgProximity: 0.4,
        macroSurprise: 0,
        socialScore: 0.4,
      },
      4,
      42,
    );
    assert.equal(cands.length, 4);

    const outcomes = cands.map((c, idx) => ({
      config: c,
      pnl: idx === 0 ? 450 : -80 * idx,
      realizedR: idx === 0 ? 2.4 : -0.6 * idx,
      maxAdverseExcursion: idx === 0 ? 0.1 : 0.7,
      stopDistance: 0.01,
      executionFees: 2.5,
    }));

    const upd = grpo.updatePolicyFromGroup("TRENDING_UP", outcomes);
    const advSum = upd.advantages.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(advSum) < 1e-6);
    assert.ok(upd.klDivergence >= 0);

    // Trigger second update so atomic save rotates backup .bak
    grpo.updatePolicyFromGroup("TRENDING_UP", outcomes);
    assert.equal(existsSync(memPath), true);
    assert.equal(existsSync(memPath + ".bak"), true);

    const entry = grpo.appendReviewerDiagnostic({
      at: Date.now(),
      ticketId: "TF-TEST-01",
      symbol: "BTCUSDT",
      regime: "TRENDING_UP",
      strategy: cands[0].strategy,
      realizedPnl: 450,
      realizedR: 2.4,
      advantageShift: upd.advantages[0],
      klDivergence: upd.klDivergence,
      winningFeatures: ["OFI", "FOMO"],
      losingFeatures: [],
      parameterAdjustments: "SL=1.20",
    });
    assert.match(entry.markdown, /TF-TEST-01/);
    const rawLog = JSON.parse(readFileSync(revPath, "utf8")) as unknown[];
    assert.equal(rawLog.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("TradingFloorDesk emergency kill switches liquidate all positions and toggle manual halt", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-panic-"));
  try {
    const cfg = makeTestCfg(dir);
    const store = new DeskStore(dir);
    const tg = new TelegramFloorRoom(cfg);
    const grpo = new GrpoEngine(join(dir, "rl_policy_memory.json"), join(dir, "reviewer_reports.json"));
    const desk = new TradingFloorDesk(cfg, store, tg, grpo);

    desk.state.tickets.push({
      id: "TF-PANIC-01",
      asset: "BTCUSDT",
      direction: "long",
      playbook: "breakout",
      thesis: "Test emergency close",
      entry: 90_000,
      invalidation: 89_000,
      target: 92_000,
      timeStopHours: 24,
      notional: 2_000,
      qty: 2_000 / 90_000,
      riskUsd: 22.22,
      riskPct: 0.0022,
      exposurePct: 0.2,
      binding: "risk",
      producedBy: ["lead"],
      status: "open",
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      fillPrice: 90_000,
      fees: 0.8,
      funding: 0,
      backtest: {
        playbook: "breakout",
        rules: "test",
        source: "test",
        inSample: { label: "IS", bars: 100, trades: 10, winRate: 0.6, expectancyR: 0.3, profitFactor: 1.5, sharpe: 1.2, deflatedSharpe: 0.5, maxDrawdownR: 2, var95R: 1, pass: true },
        outOfSample: { label: "OOS", bars: 50, trades: 5, winRate: 0.6, expectancyR: 0.3, profitFactor: 1.5, sharpe: 1.2, deflatedSharpe: 0.5, maxDrawdownR: 2, var95R: 1, pass: true },
        pass: true,
      },
    });

    const liqOut = await desk.emergencyLiquidateAll();
    assert.equal(liqOut.ok, true);
    assert.equal(liqOut.closedCount, 1);
    assert.equal(desk.state.tickets.find((t) => t.id === "TF-PANIC-01")?.status, "closed");

    const h1 = await desk.toggleManualHalt(true);
    assert.equal(h1.halted, true);
    assert.equal(desk.state.halted, true);

    const h2 = await desk.toggleManualHalt(false);
    assert.equal(h2.halted, false);
    assert.equal(desk.state.halted, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("SentinelAgent halts execution on >150ms 3-tick RTT, throttles >85% bucket, and fires FATAL_DESYNC", async () => {
  const sentinel = new SentinelAgent(1000);
  sentinel.recordRtt(160);
  sentinel.recordRtt(170);
  const r3 = sentinel.recordRtt(180);
  assert.equal(r3.latencyHalted, true);
  assert.equal(r3.ledStatus, "RED");
  assert.equal(r3.event, "EXECUTION_HALTED_LATENCY");

  sentinel.recordRtt(40);
  sentinel.recordRtt(40);
  const rec = sentinel.recordRtt(45);
  assert.equal(rec.latencyHalted, false);
  assert.equal(rec.ledStatus, "GREEN");

  const limiter = new TokenBucketRateLimiter(1000);
  limiter.recordUsage(860);
  assert.equal(limiter.canExecute("NON_CRITICAL", 10).allowed, false);
  assert.equal(limiter.canExecute("CRITICAL", 10).allowed, true);

  const desyncDrop = sentinel.checkFatalDesync({
    riskManagerOnline: true,
    streamGapMs: 100,
    prevEquity: 10_000,
    currentEquity: 8_200,
  });
  assert.equal(desyncDrop.fatal, true);

  let exitCode: number | null = null;
  let liquidated = false;
  await sentinel.executeCircuitBreaker(
    async () => { liquidated = true; },
    (c) => { exitCode = c; },
  );
  assert.equal(liquidated, true);
  assert.equal(exitCode, 1);
});

test("LiquidityHunterAgent detects spoofing <500ms, squeeze signals, and liquidation magnet zones", () => {
  const hunter = new LiquidityHunterAgent();
  const t0 = 1_700_000_000_000;
  // Wall > 50x avgVolume (avgVolume = 10 -> 600 > 500) appears at t0
  hunter.analyzeOrderBook("BTCUSDT", 90_000, [[89_900, 600], [89_800, 20]], [[90_100, 15]], 10, t0);
  // Vanishes 250ms later without price touching 89,900
  const res = hunter.analyzeOrderBook("BTCUSDT", 90_000, [[89_800, 20]], [[90_100, 15]], 10, t0 + 250);
  assert.equal(res.newSpoofs.length, 1);
  assert.equal(hunter.isSpoofedLevel("BTCUSDT", 89_900, t0 + 500), true);

  const sqLong = hunter.computeSqueezeSignal(0.0003, 0.02, 0.0005);
  assert.equal(sqLong?.signal, "HIGH_PROBABILITY_LONG_SQUEEZE");
  assert.equal(sqLong?.bias, "short");

  const sqShort = hunter.computeSqueezeSignal(-0.0003, 0.02, -0.0005);
  assert.equal(sqShort?.signal, "HIGH_PROBABILITY_SHORT_SQUEEZE");
  assert.equal(sqShort?.bias, "long");
});

test("Mt5CloudBridge maps symbols for mobile MT5 & TelegramFloorRoom supports single-bot relay", () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-mobile-"));
  try {
    assert.equal(Mt5CloudBridge.mapSymbolToMt5("BTCUSDT"), "BTCUSD");
    assert.equal(Mt5CloudBridge.mapSymbolToMt5("NQ1!"), "USTEC");
    assert.equal(Mt5CloudBridge.mapSymbolToMt5("EURUSD"), "EURUSD");

    const bridgePayload = Mt5CloudBridge.buildLocalBridgePayload(
      [
        { id: "TF-01", asset: "BTCUSDT", direction: "long", status: "open", invalidation: 88000, target: 94000 },
        { id: "TF-02", asset: "ETHUSDT", direction: "short", status: "closed", invalidation: 3500, target: 3000 },
      ],
      0.02,
    );
    assert.equal(bridgePayload.openOrders.length, 1);
    assert.equal(bridgePayload.openOrders[0].symbol, "BTCUSD");
    assert.equal(bridgePayload.openOrders[0].side, "BUY");
    assert.equal(bridgePayload.openOrders[0].lots, 0.02);

    const ea = Mt5CloudBridge.generateMql5ExpertAdvisor("http://localhost:4080");
    assert.ok(ea.includes("WebRequest"));
    assert.ok(ea.includes("/api/mt5-bridge/poll"));

    const cfg = makeTestCfg(dir);
    const tg = new TelegramFloorRoom(cfg);
    assert.equal(tg.hasTokens(), false);
    tg.updateCredentials({ chatId: "123456789", tokens: { lead: "99999:TESTTOKEN" } });
    assert.equal(tg.hasTokens(), true);
    assert.equal(tg.configuredBotCount(), 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("DASHBOARD_HTML compiles inline JS cleanly and renders 8 agents & all 5 V3 UI tabs", () => {
  for (const id of ["view-desk", "view-chat", "view-charts", "view-journal", "view-strategy", "mobileDrawer"]) {
    assert.ok(DASHBOARD_HTML.includes(`id="${id}"`), `Missing panel ${id}`);
  }
  for (const needle of [
    "CLOSE ALL POSITIONS",
    "HALT DESK",
    "Entraînement de l'IA (Machine Learning)",
    "Avantage Stratégique (Â)",
    "Stabilité d&#39;Apprentissage (KL)",
    "Qualité du Risque (Sharpe)",
    "# sys-ops",
    "# liquidity-l2",
    "The Sentinel",
    "Liquidity Hunter",
    "Mode Simple 1-Clic",
    "TradingFloorBridge.mq5",
    'max="500"',
    'data-theme="obsidian"',
    "btnToggleAllAssets",
    "chartPinnedPositionsBar",
    'data-range="2M"',
    "btnToggleProgressiveStop",
    "buildBlackCatMesh",
    "spawnProfitBurst",
    "buildDistinctAgentAvatar",
    "triggerSpeechBubble",
    "AGENT_PERSONAS",
    "makeHumanArm",
    "makeHumanLeg",
    "Simulation par trade",
    "btnPresetProPerf",
    "btnChatAutoScroll",
    "scrollChatToBottom",
  ]) {
    assert.ok(DASHBOARD_HTML.includes(needle), `Missing UI element: ${needle}`);
  }
  assert.ok(!DASHBOARD_HTML.includes("CapsuleGeometry"), "Must not use Three.js r139+ CapsuleGeometry");
  const m = DASHBOARD_HTML.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  assert.ok(m && m[1], "Expected main inline script tag");
  assert.doesNotThrow(() => new Function(m[1]));
});

test("Phase 2-5: 20 themes, TradingView tools, ATR mini-chart, and dynamic risk/TP modes", () => {
  // Check 20 themes catalog
  for (const themeKey of ["obsidian", "midnight", "carbon", "nordic", "imperial-gold", "cyberpunk", "swiss-light", "crystal-glass"]) {
    assert.ok(DASHBOARD_HTML.includes(`label: `) && DASHBOARD_HTML.includes(themeKey), `Expected theme ${themeKey}`);
  }

  // Check timeframe strip & drawing tools
  for (const tf of ["1s", "1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M"]) {
    assert.ok(DASHBOARD_HTML.includes(`id: '${tf}'`), `Expected timeframe ${tf}`);
  }
  for (const tool of ["select", "trendline", "hline", "vline", "channel", "rect", "zone", "fib", "arrow", "text", "measure"]) {
    assert.ok(DASHBOARD_HTML.includes(`data-tool="${tool}"`), `Expected drawing tool ${tool}`);
  }

  // Check beginner-friendly risk & ATR controls
  assert.ok(DASHBOARD_HTML.includes("atrMiniChartSvg"), "Expected ATR mini chart SVG");
  assert.ok(DASHBOARD_HTML.includes("badgeLevLevel"), "Expected leverage level badge");
  assert.ok(DASHBOARD_HTML.includes("liveRiskSummaryBox"), "Expected live risk summary calculator");
  assert.ok(DASHBOARD_HTML.includes("dangerRiskModal"), "Expected danger risk confirmation modal");

  // Verify computeLeveragedSizing with custom riskMode & TP calculations
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-phase-"));
  try {
    const store = new DeskStore(dir);
    const state = store.loadOrCreate(10_000, "Europe/Paris", ["BTCUSDT"], 15);
    state.settings.riskMode = "pct";
    state.settings.maxRiskPct = 0.02;

    const sizingPct = computeLeveragedSizing(state, 100, 95, undefined, {
      side: "long",
      leverageFactor: 5,
    });
    assert.equal(sizingPct.ok, true);
    assert.ok((sizingPct.notional ?? 0) > 0);

    state.settings.riskMode = "amount";
    state.settings.riskAmount = 150;
    const sizingAmt = computeLeveragedSizing(state, 100, 95, undefined, {
      side: "long",
      leverageFactor: 5,
    });
    assert.equal(sizingAmt.ok, true);
    assert.equal(sizingAmt.riskCapital, 150);

    // Test unlocked risk & SL in euros (e.g. 500 EUR risk without 3% cap)
    state.settings.riskMode = "amount";
    state.settings.riskAmount = 500;
    state.settings.slMode = "amount";
    state.settings.slVal = 500;
    state.settings.tpMode = "amount";
    state.settings.tpVal = 1000;
    const sizingUnlocked = computeLeveragedSizing(state, 100, 95, undefined, {
      side: "long",
      leverageFactor: 5,
    });
    assert.equal(sizingUnlocked.ok, true);
    assert.equal(sizingUnlocked.riskCapital, 500);

    // Verify UI contains unlocked SL and TP presets and inputs
    assert.ok(DASHBOARD_HTML.includes("cfgSlAmount"), "Expected cfgSlAmount input");
    assert.ok(DASHBOARD_HTML.includes("setQuickSlAmount"), "Expected setQuickSlAmount helper");
    assert.ok(DASHBOARD_HTML.includes("setQuickRiskAmount"), "Expected setQuickRiskAmount helper");
    assert.ok(DASHBOARD_HTML.includes("setQuickTpAmount"), "Expected setQuickTpAmount helper");

    // Verify Mt5CloudBridge dynamic lot sizing for 100K accounts and leveraged notionals
    const gbpLots = Mt5CloudBridge.computeAssetLots("GBPUSD", 400_000, 1.32);
    assert.ok(gbpLots >= 3.0 && gbpLots <= 4.0, `Expected ~3.03 lots for 400k GBPUSD, got ${gbpLots}`);

    const goldLots = Mt5CloudBridge.computeAssetLots("XAUUSD", 200_000, 3864);
    assert.ok(goldLots >= 0.5 && goldLots <= 0.6, `Expected ~0.52 lot for 200k Gold, got ${goldLots}`);

    const tslaLots = Mt5CloudBridge.computeAssetLots("TSLA", 18_000, 377);
    assert.ok(tslaLots >= 45 && tslaLots <= 50, `Expected ~47.7 lots for 18k TSLA shares, got ${tslaLots}`);

    // Verify buildLocalBridgePayload does not collapse to 0.01 lot when notional is present
    const bridgePayload = Mt5CloudBridge.buildLocalBridgePayload([
      {
        id: "T-1",
        asset: "GBPUSD",
        direction: "long",
        status: "open",
        entry: 1.32,
        invalidation: 1.31,
        target: 1.34,
        notional: 400_000,
      }
    ]);
    assert.equal(bridgePayload.ok, true);
    assert.ok(bridgePayload.openOrders[0].lots >= 3.0, `Expected order lots >= 3.0, got ${bridgePayload.openOrders[0].lots}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Anti-Death-Loop triggers directional & asset cooldowns on any SL or loss close and prevents ping-pong", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-deathloop-"));
  try {
    const cfg = makeTestCfg(dir);
    const store = new DeskStore(dir);
    const tg = new TelegramFloorRoom(cfg);
    const grpo = new GrpoEngine(join(dir, "rl_policy_memory.json"), join(dir, "reviewer_reports.json"));
    const desk = new TradingFloorDesk(cfg, store, tg, grpo);
    desk.state.settings.regime = "hft_kamikaze";

    const now = Date.now();
    desk.state.tickets.push({
      id: "TF-DL-01",
      asset: "GBPUSD",
      direction: "long",
      playbook: "HFT_Kamikaze_FiatTarget",
      engine: "HFT_Kamikaze_FiatTarget",
      thesis: "Test SL long",
      entry: 1.30,
      invalidation: 1.298,
      target: 1.305,
      timeStopHours: 1,
      notional: 20_000,
      qty: 15_384,
      riskUsd: 25,
      riskPct: 0.0025,
      exposurePct: 0.02,
      binding: "risk",
      producedBy: ["strategist"],
      backtest: {
        pass: true,
        playbook: "HFT_Kamikaze_FiatTarget",
        rules: "HFT SL/TP",
        source: "unit-test",
        inSample: { label: "IS", bars: 200, trades: 20, winRate: 0.6, expectancyR: 0.3, profitFactor: 1.5, sharpe: 1.4, var95R: -1.1, maxDrawdownR: 2, deflatedSharpe: 0.7, pass: true },
        outOfSample: { label: "OOS", bars: 100, trades: 10, winRate: 0.6, expectancyR: 0.3, profitFactor: 1.5, sharpe: 1.3, var95R: -1.0, maxDrawdownR: 1.5, deflatedSharpe: 0.7, pass: true },
      },
      status: "open",
      createdAt: now - 30_000,
      expiresAt: now + 60_000,
      filledAt: now - 25_000,
      fillPrice: 1.30,
      fees: 0,
      funding: 0,
    });

    await (desk as unknown as {
      closeOpenTicket: (t: unknown, exitPx: number, reason: string, ts: number, ov?: number) => Promise<void>;
    }).closeOpenTicket(desk.state.tickets[0], 1.298, "invalidation", now, -25);

    assert.ok((desk.state.cooldowns.GBPUSD ?? 0) >= now + 170_000, "Asset cooldown must be >= 3 min after SL even in hft_kamikaze");
    assert.ok((desk.state.directionalCooldowns?.["GBPUSD:long"]?.until ?? 0) >= now + 14 * 60_000, "GBPUSD:long must be locked 15 min");

    // Second loss on short must NOT erase GBPUSD:long ban
    desk.state.tickets.push({
      ...desk.state.tickets[0],
      id: "TF-DL-02",
      direction: "short",
      status: "open",
    });
    await (desk as unknown as {
      closeOpenTicket: (t: unknown, exitPx: number, reason: string, ts: number, ov?: number) => Promise<void>;
    }).closeOpenTicket(desk.state.tickets[1], 1.302, "invalidation", now + 1000, -25);

    assert.ok((desk.state.directionalCooldowns?.["GBPUSD:long"]?.until ?? 0) >= now + 14 * 60_000, "GBPUSD:long ban preserved after short loss");
    assert.ok((desk.state.directionalCooldowns?.["GBPUSD:short"]?.until ?? 0) >= now + 14 * 60_000, "GBPUSD:short also locked 15 min");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Progressive 50% Stop Loss locks half of peak profit, ratchets up, closes without Anti-Death-Loop, and respects toggle", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-progstop-"));
  try {
    const cfg = makeTestCfg(dir);
    const store = new DeskStore(dir);
    const tg = new TelegramFloorRoom(cfg);
    const grpo = new GrpoEngine(join(dir, "rl_policy_memory.json"), join(dir, "reviewer_reports.json"));
    const desk = new TradingFloorDesk(cfg, store, tg, grpo);
    (desk as unknown as { refreshTape: () => Promise<never[]> }).refreshTape = async () => [];

    const now = Date.now();
    const baseTicket = {
      id: "TF-PROG-01",
      asset: "BTCUSDT",
      direction: "long" as const,
      playbook: "breakout" as const,
      engine: "breakout" as const,
      thesis: "Test progressive SL 50%",
      entry: 100,
      fillPrice: 100,
      invalidation: 98,
      target: 110,
      timeStopHours: 24,
      notional: 10_000,
      qty: 100,
      riskUsd: 200,
      riskPct: 0.02,
      exposurePct: 1,
      binding: "risk" as const,
      producedBy: ["strategist" as const],
      backtest: {
        pass: true,
        playbook: "breakout" as const,
        rules: "Prog SL test",
        source: "unit-test",
        inSample: { label: "IS", bars: 200, trades: 20, winRate: 0.6, expectancyR: 0.4, profitFactor: 1.8, sharpe: 1.5, var95R: -1.0, maxDrawdownR: 2, deflatedSharpe: 0.8, pass: true },
        outOfSample: { label: "OOS", bars: 100, trades: 10, winRate: 0.6, expectancyR: 0.4, profitFactor: 1.8, sharpe: 1.4, var95R: -1.0, maxDrawdownR: 1.5, deflatedSharpe: 0.8, pass: true },
      },
      status: "open" as const,
      createdAt: now - 30_000,
      expiresAt: now + 3_600_000,
      filledAt: now - 25_000,
      fees: 0,
      funding: 0,
    };

    // 1) Toggle ON: +100 -> locks +50; +200 -> ratchets to +100; pullback to +140 keeps open; pullback to +99 closes cleanly
    desk.state.settings.progressiveStopEnabled = true;
    desk.state.settings.regime = "standard";
    desk.state.tickets.push({ ...baseTicket });
    desk.state.tape = [
      { symbol: "BTCUSDT", name: "BTC", px: 101.0, prev: 100, change24h: 0.01, funding: null, oiUsd: null, bookImbalance: null, venue1: "Binance", venue2: "Bybit", verified2ndSource: true, sparkline: [100, 101], updatedAt: now },
    ];

    await desk.monitorStep();
    assert.equal(desk.state.tickets[0].peakProfitUsd, 100, "Peak profit tracked at +100");
    assert.equal(desk.state.tickets[0].progressiveStopUsd, 50, "50% floor locked at +50 when profit hits +100");
    assert.equal(desk.state.tickets[0].breakEvenActive, true, "breakEvenActive flagged");
    assert.ok(Math.abs(desk.state.tickets[0].invalidation - 100.5) < 1e-6, "Price invalidation moved to 100.50 (+50 floor)");

    // Rise further to +200 -> ratchet up to +100
    desk.state.tape[0].px = 102.0;
    await desk.monitorStep();
    assert.equal(desk.state.tickets[0].peakProfitUsd, 200);
    assert.equal(desk.state.tickets[0].progressiveStopUsd, 100, "50% floor ratcheted up to +100 when profit hits +200");
    assert.ok(Math.abs(desk.state.tickets[0].invalidation - 101.0) < 1e-6);

    // Pullback above floor (+140 > +100) keeps trade open and does NOT reduce progressiveStopUsd
    desk.state.tape[0].px = 101.4;
    await desk.monitorStep();
    assert.equal(desk.state.tickets[0].status, "open", "Should remain open while profit is above +100 locked floor");
    assert.equal(desk.state.tickets[0].progressiveStopUsd, 100, "Locked floor must remain monotone at +100");

    // Pullback to floor (+99 <= +100) closes cleanly in profit as "target" without Anti-Death-Loop ban
    desk.state.tape[0].px = 100.99;
    await desk.monitorStep();
    assert.equal(desk.state.tickets[0].status, "closed", "Must close when unrealized drops below locked 50% progressive floor");
    assert.equal(desk.state.tickets[0].closeReason, "target", "Progressive profit close must use target reason");
    assert.ok((desk.state.tickets[0].pnl ?? 0) > 85, "Realized PnL must preserve secured profit");
    assert.equal(desk.state.directionalCooldowns?.["BTCUSDT:long"], undefined, "Must NOT trigger Anti-Death-Loop ban on secured profit");

    // 2) Toggle OFF: +100 peak then dip to +40 keeps original stop untouched and stays open
    desk.state.settings.progressiveStopEnabled = false;
    desk.state.tickets.push({ ...baseTicket, id: "TF-PROG-OFF", asset: "ETHUSDT", invalidation: 98 });
    desk.state.tape.push({
      symbol: "ETHUSDT", name: "ETH", px: 101.0, prev: 100, change24h: 0.01, funding: null, oiUsd: null, bookImbalance: null, venue1: "Binance", venue2: "Bybit", verified2ndSource: true, sparkline: [100, 101], updatedAt: now,
    });
    await desk.monitorStep();
    desk.state.tape[1].px = 100.4;
    await desk.monitorStep();
    const offTicket = desk.state.tickets.find((t) => t.id === "TF-PROG-OFF");
    assert.equal(offTicket?.status, "open", "When progressiveStopEnabled is false, pullback to +40 stays open");
    assert.equal(offTicket?.invalidation, 98, "Original invalidation remains untouched when disabled");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Equity curve retains 60+ days of history without wiping on recordEquityPoint", () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-curve60d-"));
  try {
    const cfg = makeTestCfg(dir);
    const store = new DeskStore(dir);
    const tg = new TelegramFloorRoom(cfg);
    const grpo = new GrpoEngine(join(dir, "rl_policy_memory.json"), join(dir, "reviewer_reports.json"));
    const desk = new TradingFloorDesk(cfg, store, tg, grpo);

    const now = Date.now();
    // Populate 60 days of 30-min points (~2880 points)
    desk.state.curve = [];
    for (let i = 60 * 48; i >= 1; i--) {
      const t = now - i * 30 * 60_000;
      desk.state.curve.push({ t, eq: 10_000 + (60 * 48 - i) * 0.5, realized: 0, unrealized: 0, drawdownPct: 0 });
    }
    (desk as unknown as { recordEquityPoint: (ts?: number) => void }).recordEquityPoint(now);

    assert.ok(desk.state.curve.length >= 2880, `Expected full 60-day curve retention, got ${desk.state.curve.length}`);
    const oldestAgeDays = (now - desk.state.curve[0].t) / 86_400_000;
    assert.ok(oldestAgeDays >= 59.5, `Expected oldest retained point >= 59.5 days old, got ${oldestAgeDays.toFixed(1)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Strict profitability guard: scalpRelaxed never passes negative expectancy and Kamikaze sizing caps excessive fees", () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-profit-"));
  try {
    const store = new DeskStore(dir);
    const state = store.loadOrCreate(50_000, "Europe/Paris", ["BTCUSDT"], 15);
    state.settings.regime = "hft_kamikaze";
    const hftSized = computeLeveragedSizing(state, 90_000, 89_900, undefined, {
      side: "long",
      leverageFactor: 500,
      playbook: "HFT_Kamikaze_FiatTarget",
      targetFiatProfit: 75,
      atr1m: 150,
    });
    assert.equal(hftSized.ok, true);
    const estRoundTripFees = (hftSized.notional ?? 0) * 0.0008;
    assert.ok(estRoundTripFees <= 75 * 0.40, `Expected fee-safe Kamikaze sizing, got fees $${estRoundTripFees.toFixed(2)} for $75 target`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("MarketProfileAnalyzer computes POC/VAH/VAL and strictly forbids LONG above VAH or SHORT below VAL in range", () => {
  const now = Date.now();
  const bars: Kline[] = [];
  for (let i = 0; i < 36; i++) {
    const mid = i < 24 ? 100 : i < 30 ? 101.2 : 98.8;
    const vol = i < 24 ? 500 : 120;
    bars.push({
      openTime: now - (36 - i) * 15 * 60_000,
      open: mid - 0.3,
      high: mid + 1.0,
      low: mid - 1.0,
      close: mid + 0.1,
      volume: vol,
      closeTime: now - (35 - i) * 15 * 60_000 - 1,
    });
  }

  const profile = MarketProfileAnalyzer.computeSessionProfile("BTCUSDT", bars, 104.5, now);
  assert.ok(profile.val < profile.poc && profile.poc < profile.vah, `Expected VAL < POC < VAH, got ${JSON.stringify(profile)}`);
  assert.equal(profile.isRange, true);

  const vetoLong = MarketProfileAnalyzer.checkRangeEntryAllowed("long", profile.vah + 1.5, profile, true);
  assert.equal(vetoLong.allowed, false);
  assert.match(vetoLong.reason ?? "", /VAH/i);

  const vetoShort = MarketProfileAnalyzer.checkRangeEntryAllowed("short", profile.val - 1.5, profile, true);
  assert.equal(vetoShort.allowed, false);
  assert.match(vetoShort.reason ?? "", /VAL/i);

  assert.equal(MarketProfileAnalyzer.checkRangeEntryAllowed("short", profile.vah + 1.5, profile, true).allowed, true);
  assert.equal(MarketProfileAnalyzer.checkRangeEntryAllowed("long", profile.val - 1.5, profile, true).allowed, true);

  const dir = mkdtempSync(join(tmpdir(), "tf-v3-mp-"));
  try {
    const cfg = makeTestCfg(dir);
    const store = new DeskStore(dir);
    const state = store.loadOrCreate(10_000, cfg.timeZone, ["BTCUSDT"], 15);
    state.settings.regime = "standard";
    state.settings.tradingStyle = "longtrade";
    const tg = new TelegramFloorRoom(cfg);
    const grpo = new GrpoEngine(join(dir, "grpo-memory.json"));
    const desk = new TradingFloorDesk(cfg, store, tg, grpo);
    desk.state = state;
    (desk as unknown as { refreshTape: () => Promise<never[]> }).refreshTape = async () => [];

    const highPx = profile.vah + 2.0;
    const snapAboveVah: MarketSnapshot = {
      symbol: "BTCUSDT",
      at: now,
      primary: { venue: "Binance", price: highPx, ret1h: 0.025, funding: 0.0001, oiChange1h: 0.01, oiValue: 1_000_000, book: 0.25 },
      secondary: null,
      bars4h: bars.slice(-24),
      bars15m: bars,
      channelHi: highPx - 0.5,
      channelLo: profile.val,
      atr: 1.4,
      ret24h: 0.015,
      news: [],
      onchain: null,
      errors: [],
      marketProfile: { ...profile, pricePosition: "above_vah" },
    };

    const playAboveVah = (desk as unknown as { choosePlay: (s: MarketSnapshot) => { direction: string } | null }).choosePlay(
      snapAboveVah,
    );
    assert.ok(playAboveVah === null || playAboveVah.direction !== "long", `Expected no LONG above VAH in range, got ${playAboveVah?.direction}`);

    const lowPx = profile.val - 2.0;
    const snapBelowVal: MarketSnapshot = {
      ...snapAboveVah,
      primary: { venue: "Binance", price: lowPx, ret1h: -0.025, funding: -0.0001, oiChange1h: 0.01, oiValue: 1_000_000, book: -0.25 },
      channelHi: profile.vah,
      channelLo: lowPx + 0.5,
      marketProfile: { ...profile, pricePosition: "below_val" },
    };

    const playBelowVal = (desk as unknown as { choosePlay: (s: MarketSnapshot) => { direction: string } | null }).choosePlay(
      snapBelowVal,
    );
    assert.ok(playBelowVal === null || playBelowVal.direction !== "short", `Expected no SHORT below VAL in range, got ${playBelowVal?.direction}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Agentic Self-Reflection persists trade_post_mortem.json on close and dynamically updates Strategist prompt", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-reflect-"));
  try {
    const cfg = makeTestCfg(dir);
    const store = new DeskStore(dir);
    const state = store.loadOrCreate(10_000, cfg.timeZone, ["BTCUSDT"], 15);
    const tg = new TelegramFloorRoom(cfg);
    const grpo = new GrpoEngine(join(dir, "grpo-memory.json"));
    const desk = new TradingFloorDesk(cfg, store, tg, grpo);
    desk.state = state;
    (desk as unknown as { refreshTape: () => Promise<never[]> }).refreshTape = async () => [];

    const now = Date.now();
    const mkBreakoutTicket = (id: string, offsetMs: number): Ticket => ({
      id,
      asset: "BTCUSDT",
      direction: "long",
      playbook: "breakout",
      engine: "breakout",
      thesis: "Test breakout range trap",
      entry: 100,
      invalidation: 99,
      target: 103,
      timeStopHours: 4,
      notional: 2500,
      qty: 25,
      riskUsd: 25,
      riskPct: 0.0025,
      exposurePct: 0.25,
      binding: "risk",
      producedBy: ["strategist", "risk", "execution"],
      backtest: {
        playbook: "breakout",
        rules: "test",
        source: "unit-test",
        inSample: {
          label: "IS",
          bars: 100,
          trades: 12,
          winRate: 0.55,
          expectancyR: 0.25,
          profitFactor: 1.5,
          sharpe: 1.1,
          deflatedSharpe: 0.8,
          maxDrawdownR: 2,
          var95R: 1,
          pass: true,
        },
        outOfSample: {
          label: "OOS",
          bars: 50,
          trades: 8,
          winRate: 0.5,
          expectancyR: 0.2,
          profitFactor: 1.4,
          sharpe: 0.9,
          deflatedSharpe: 0.7,
          maxDrawdownR: 1.5,
          var95R: 0.9,
          pass: true,
        },
        pass: true,
      },
      status: "open",
      createdAt: now - offsetMs - 600_000,
      filledAt: now - offsetMs - 300_000,
      expiresAt: now + 900_000,
      fees: 1.0,
      funding: 0,
    });

    const closeFn = (
      desk as unknown as {
        closeOpenTicket: (t: Ticket, px: number, reason: string, ts?: number, ovPnl?: number) => Promise<void>;
      }
    ).closeOpenTicket.bind(desk);

    const t1 = mkBreakoutTicket("PM-1", 120_000);
    const t2 = mkBreakoutTicket("PM-2", 60_000);
    const t3 = mkBreakoutTicket("PM-3", 10_000);
    desk.state.tickets.push(t1, t2, t3);

    await closeFn(t1, 99, "invalidation", now - 120_000, -25);
    await closeFn(t2, 99, "invalidation", now - 60_000, -25);
    await closeFn(t3, 99, "invalidation", now - 10_000, -25);

    assert.equal(existsSync(desk.postMortemPath), true);
    const entries = desk.readTradePostMortems(10);
    assert.equal(entries.length, 3);
    assert.equal(entries[0].direction, "long");
    assert.equal(entries[0].setup, "breakout");
    assert.equal(entries[0].pnl, -25);
    assert.ok(entries[0].durationLabel.includes("m"));

    const directive = await desk.runAgenticSelfReflection(now);
    assert.ok(directive.length > 10);
    assert.equal(desk.current_market_regime_directive, directive);
    assert.equal(desk.state.current_market_regime_directive, directive);
    assert.match(directive, /mean-reversion|breakout/i);
    assert.ok(
      desk.state.agentPrompts.strategist.systemPrompt.includes("[DIRECTIVE_REVIEWER_15M"),
      "Expected Strategist systemPrompt to be dynamically updated with 15m Reviewer directive",
    );
    assert.ok(desk.state.agentPrompts.strategist.systemPrompt.includes(directive));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Charts architecture separates 75/25 Market Profile sidebar & syncs ExecutionTrader dashed SL/TP/Open + markers", () => {
  for (const needle of [
    "chartMarketProfilePanel",
    "Market Profile & Volume Node",
    "mpPocVal",
    "mpVahVal",
    "mpValVal",
    "mpStatusBadge",
    "mpVolumeHistogram",
    "renderMarketProfilePanel",
    "syncChartExecutionOverlays",
    "HARD SL",
    "HARD TP",
    "setMarkers",
  ]) {
    assert.ok(DASHBOARD_HTML.includes(needle), `Expected Chart UI element: ${needle}`);
  }
  assert.ok(!DASHBOARD_HTML.includes("title: 'POC'"), "POC line must NOT overlay lightweight-charts candles");
  assert.ok(!DASHBOARD_HTML.includes("title: 'VAH'"), "VAH line must NOT overlay lightweight-charts candles");
  assert.ok(!DASHBOARD_HTML.includes("title: 'VAL'"), "VAL line must NOT overlay lightweight-charts candles");
});

test("ActiveTradeManager emits async Hard Break-Even OrderModify at 50% TP (+ fees) and updates ExecutionTrader chart state", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-atm-"));
  try {
    const cfg = makeTestCfg(dir);
    const store = new DeskStore(dir);
    const state = store.loadOrCreate(10_000, cfg.timeZone, ["BTCUSDT"], 15);
    state.settings.regime = "standard";
    state.settings.progressiveStopEnabled = false;
    const tg = new TelegramFloorRoom(cfg);
    const grpo = new GrpoEngine(join(dir, "grpo-memory.json"));
    const desk = new TradingFloorDesk(cfg, store, tg, grpo);
    desk.state = state;
    (desk as unknown as { refreshTape: () => Promise<never[]> }).refreshTape = async () => [];

    const now = Date.now();
    const ticket: Ticket = {
      id: "ATM-1",
      asset: "BTCUSDT",
      direction: "long",
      playbook: "breakout",
      engine: "breakout",
      thesis: "Test ActiveTradeManager Hard BE",
      entry: 100,
      fillPrice: 100,
      invalidation: 98,
      target: 110,
      timeStopHours: 12,
      notional: 5000,
      qty: 50,
      riskUsd: 100,
      riskPct: 0.01,
      exposurePct: 0.5,
      binding: "risk",
      producedBy: ["strategist", "execution"],
      backtest: {
        playbook: "breakout",
        rules: "atm",
        source: "unit-test",
        inSample: { label: "IS", bars: 100, trades: 10, winRate: 0.6, expectancyR: 0.3, profitFactor: 1.6, sharpe: 1.2, var95R: -1, maxDrawdownR: 2, deflatedSharpe: 0.8, pass: true },
        outOfSample: { label: "OOS", bars: 50, trades: 6, winRate: 0.6, expectancyR: 0.3, profitFactor: 1.6, sharpe: 1.1, var95R: -1, maxDrawdownR: 1.5, deflatedSharpe: 0.8, pass: true },
        pass: true,
      },
      status: "open",
      createdAt: now - 60_000,
      filledAt: now - 50_000,
      expiresAt: now + 3_600_000,
      fees: 2.0,
      funding: 0,
    };

    // Before 50% path to TP (104 < 105 midpoint), should NOT trigger OrderModify
    const preEval = ActiveTradeManager.evaluateBreakEvenOrderModify(ticket, 104);
    assert.equal(preEval.shouldModify, false);

    // At 50% path to TP (105 of 100 -> 110), MUST trigger Hard BE SL (+fee buffer) without closing locally
    desk.state.tickets.push(ticket);
    desk.state.tape = [
      { symbol: "BTCUSDT", name: "BTC", px: 105.0, prev: 100, change24h: 0.05, funding: null, oiUsd: null, bookImbalance: null, venue1: "Binance", venue2: "Bybit", verified2ndSource: true, sparkline: [100, 105], updatedAt: now },
    ];

    await desk.monitorStep();

    assert.equal(ticket.status, "open", "Ticket must remain open when Hard BE OrderModify triggers");
    assert.equal(ticket.breakEvenActive, true, "breakEvenActive must flip to true");
    assert.ok(ticket.invalidation > 100 && ticket.invalidation <= 100.1, `Expected fee-covered Hard BE SL (~100.08), got ${ticket.invalidation}`);
    assert.equal(desk.state.executionTraderState?.lastOrderModify?.ticketId, "ATM-1");
    assert.equal(desk.state.executionTraderState?.lastOrderModify?.newSl, ticket.invalidation);

    const eaSource = Mt5CloudBridge.generateMql5ExpertAdvisor();
    assert.ok(eaSource.includes("SyncOpenPositionStops"), "MQL5 bridge must sync Hard SL/TP via PositionModify on open positions");
    assert.ok(eaSource.includes("trade.PositionModify"), "MQL5 bridge must invoke PositionModify");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Full System Audit Overhaul: 8 Agent Prompts v2, Store Migration, No Double-Count Pacing, GRPO Normalization & Live Prompts UI", async () => {
  // 1. Default settings slVal must be sane ATR multiple (1.35, never 100)
  const def = createDefaultSettings(["BTCUSDT"], 15);
  assert.equal(def.slMode, "atr");
  assert.equal(def.slVal, 1.35);

  // 2. All 8 upgraded Agent System Prompts reflect v2 architecture & Market Profile / ActiveTradeManager / Self-Reflection
  assert.match(DEFAULT_AGENT_PROMPTS.lead.systemPrompt, /8 agents/i);
  assert.match(DEFAULT_AGENT_PROMPTS.strategist.systemPrompt, /MARKET PROFILE/i);
  assert.match(DEFAULT_AGENT_PROMPTS.risk.systemPrompt, /FRAIS/i);
  assert.match(DEFAULT_AGENT_PROMPTS.execution.systemPrompt, /ACTIVE TRADE MANAGER/i);
  assert.match(DEFAULT_AGENT_PROMPTS.reviewer.systemPrompt, /trade_post_mortem\.json/i);
  assert.match(DEFAULT_AGENT_PROMPTS.sentinel.systemPrompt, /HALT sécurisé/i);
  assert.match(DEFAULT_AGENT_PROMPTS.hunter.systemPrompt, /carnets L2 réels/i);

  // 3. PacingCalculator + updateSessionGoal avoid double-counting realizedPnl
  const goal = DeskLeadAgent.createSessionGoal(10_000, 1_000, 4, Date.now() - 3_600_000);
  const pace = PacingCalculator.calculate(goal, 10_500 - 300, 300, Date.now());
  assert.equal(pace.currentProfitFiat, 500, "Must compute exact 500 unrealized+realized profit without double-counting");

  // 4. YahooFinance non-crypto verification works honestly without fake Binance/Bybit agreement
  const yfCheck = verifySecondSource({
    symbol: "XAUUSD",
    at: Date.now(),
    primary: { venue: "YahooFinance", price: 3875, ret1h: 0.002, funding: null, oiChange1h: null, oiValue: null, book: 0 },
    secondary: null,
    bars4h: [],
    channelHi: null,
    channelLo: null,
    atr: null,
    ret24h: null,
    news: [],
    onchain: null,
    errors: [],
  });
  assert.equal(yfCheck.verified, true);
  assert.match(yfCheck.reason, /YahooFinance/i);

  // 5. Store upgrades old v1 state prompts & fixes stale slVal=100 while preserving 15m Reviewer directive
  const dir = mkdtempSync(join(tmpdir(), "tf-v3-overhaul-"));
  try {
    const store = new DeskStore(dir);
    const seed = store.loadOrCreate(10_000, "Europe/Paris", ["BTCUSDT"], 15);
    seed.promptsVersion = 1;
    seed.settings.slMode = "atr";
    seed.settings.slVal = 100;
    seed.agentPrompts.strategist.systemPrompt = "OLD PROMPT\n[DIRECTIVE_REVIEWER_15M | MAJ 08:00 UTC] current_market_regime_directive: range mode";
    writeFileSync(store.statePath, JSON.stringify(seed), "utf8");

    const migrated = store.loadOrCreate(10_000, "Europe/Paris", ["BTCUSDT"], 15);
    assert.equal(migrated.promptsVersion, PROMPT_SCHEMA_VERSION);
    assert.equal(migrated.settings.slVal, 1.35);
    assert.match(migrated.agentPrompts.strategist.systemPrompt, /MARKET PROFILE/i);
    assert.match(migrated.agentPrompts.strategist.systemPrompt, /\[DIRECTIVE_REVIEWER_15M/i);

    // 6. GRPO composite reward properly scales fees & R-multiples without exploding on tight stops
    const grpo = new GrpoEngine(join(dir, "grpo-norm.json"));
    const reward = grpo.computeCompositeReward({
      config: { id: "c1", strategy: "breakout", slMult: 1.5, tpMult: 2.2, leverage: 20, probOld: 0.2 },
      pnl: 500,
      realizedR: 1.5,
      maxAdverseExcursion: 0.3,
      stopDistance: 0.002,
      executionFees: 200,
    });
    assert.ok(reward > 0.5, `Expected positive normalized GRPO reward even on high notional/fees, got ${reward}`);

    // 7. Live 8-Agent Prompt Viewer & Editor compiles cleanly inside DASHBOARD_HTML
    assert.ok(DASHBOARD_HTML.includes("agentPromptSelect"));
    assert.ok(DASHBOARD_HTML.includes("agentPromptTextarea"));
    assert.ok(DASHBOARD_HTML.includes("saveSelectedAgentPrompt"));
    assert.ok(DASHBOARD_HTML.includes("updateLiveDeskChartCandle"));
    assert.ok(DASHBOARD_HTML.includes("8 Agents IA"));
    assert.ok(!DASHBOARD_HTML.includes("6 Agents IA"));
    const scriptMatch = DASHBOARD_HTML.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
    assert.ok(scriptMatch && scriptMatch[1]);
    assert.doesNotThrow(() => new Function(scriptMatch[1]));

    // 8. aggregateKlines produces distinct aggregated OHLCV bars for custom timeframes (e.g. 1m -> 5m / 4h)
    const nowTs = Date.now();
    const bars1m = Array.from({ length: 10 }, (_, i) => ({
      openTime: nowTs + i * 60_000,
      open: 100 + i,
      high: 102 + i,
      low: 99 + i,
      close: 101 + i,
      volume: 10,
      closeTime: nowTs + (i + 1) * 60_000 - 1,
    }));
    const bars5m = aggregateKlines(bars1m, 5);
    assert.equal(bars5m.length, 2);
    assert.equal(bars5m[0].open, 100);
    assert.equal(bars5m[0].close, 105);
    assert.equal(bars5m[0].high, 106);
    assert.equal(bars5m[0].low, 99);
    assert.equal(bars5m[0].volume, 50);

    // 9. Chat v2 roster update replaces stale 6-agent messages and announces all 8 agents
    const cfg = makeTestCfg(dir);
    const desk = new TradingFloorDesk(cfg, store, new TelegramFloorRoom(cfg), grpo);
    desk.state.messages.push({
      id: "m999",
      at: nowTs,
      speaker: "lead",
      tone: "plain",
      text: "Salle initialisée. 6 agents autonomes en français.",
    });
    await (desk as unknown as { announceV2AgentsRoster: () => Promise<void> }).announceV2AgentsRoster();
    assert.equal(
      desk.state.messages.some((m) => m.text.includes("6 agents autonomes")),
      false,
      "Stale 6-agent message must be cleaned on upgrade",
    );
    for (const spk of ["lead", "analyst", "strategist", "risk", "execution", "reviewer", "sentinel", "hunter"]) {
      assert.ok(
        desk.state.messages.some((m) => m.speaker === spk),
        `Expected v2 chat message from agent ${spk}`,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Persistent full_history.json, blotter reconstruction, Chat escHtml & visible 15m Reviewer history", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-full-history-"));
  try {
    // 1. UI helper & 15m Reviewer controls present & valid JS
    assert.ok(DASHBOARD_HTML.includes("function escHtml("));
    assert.ok(DASHBOARD_HTML.includes("function triggerSelfReflectionNow("));
    assert.ok(DASHBOARD_HTML.includes("function renderReviewerBanner("));
    assert.ok(DASHBOARD_HTML.includes("chatReviewerBanner"));
    const scriptMatch = DASHBOARD_HTML.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
    assert.ok(scriptMatch && scriptMatch[1]);
    assert.doesNotThrow(() => new Function(scriptMatch[1]));

    // 2. Closed trades + 15m selfReflectionHistory persist into full_history.json & survive state wipe
    const store = new DeskStore(dir);
    const cfg = makeTestCfg(dir);
    const desk = new TradingFloorDesk(cfg, store, new TelegramFloorRoom(cfg), new GrpoEngine(join(dir, "grpo.json")));
    const btWin = { label: "OOS", bars: 120, trades: 12, winRate: 0.6, expectancyR: 0.35, profitFactor: 1.7, sharpe: 1.2, deflatedSharpe: 0.7, maxDrawdownR: 1.2, var95R: -0.9, pass: true };
    const closedTicket: Ticket = {
      id: "TF-HIST-1",
      createdAt: Date.now() - 120_000,
      expiresAt: Date.now() - 60_000,
      asset: "BTCUSDT",
      direction: "long",
      entry: 90_000,
      invalidation: 89_500,
      target: 91_000,
      timeStopHours: 4,
      notional: 5000,
      qty: 0.055,
      riskPct: 0.01,
      riskUsd: 100,
      exposurePct: 0.05,
      binding: "risk",
      leverage: 5,
      engine: "Session_VWAP_Reversion",
      playbook: "fade",
      regime: "MEAN_REVERTING",
      thesis: "VWAP -2SD reclaim",
      producedBy: ["analyst", "strategist"],
      backtest: { playbook: "fade", rules: "VWAP -2SD", source: "Binance", inSample: btWin, outOfSample: btWin, pass: true },
      status: "closed",
      decidedAt: Date.now() - 115_000,
      filledAt: Date.now() - 110_000,
      fillPrice: 90_000,
      fees: 1.2,
      funding: 0,
      closedAt: Date.now() - 60_000,
      exitPrice: 90_600,
      closeReason: "target",
      pnl: 42.5,
      rMultiple: 1.4,
    };
    desk.state.tickets.push(closedTicket);
    desk.state.realizedPnl = 42.5;
    await desk.runAgenticSelfReflection(Date.now());
    assert.ok((desk.state.selfReflectionHistory?.length ?? 0) >= 1);
    assert.ok(existsSync(store.historyPath), "full_history.json must be created on save");

    // Simulate restarting when state.json got stripped (0 tickets / empty selfReflectionHistory)
    const stripped = store.loadOrCreate(10_000, "Europe/Paris", ["BTCUSDT"], 15);
    stripped.tickets = [];
    stripped.selfReflectionHistory = [];
    stripped.messages = [];
    writeFileSync(store.statePath, JSON.stringify(stripped), "utf8");

    const reloaded = store.loadOrCreate(10_000, "Europe/Paris", ["BTCUSDT"], 15);
    assert.ok(reloaded.tickets.some((t) => t.id === "TF-HIST-1" && t.status === "closed"));
    assert.ok((reloaded.selfReflectionHistory?.length ?? 0) >= 1);
    assert.ok(reloaded.messages.some((m) => m.text.includes("[AUTO-RÉFLEXION 15M]")));

    // 3. Fallback reconstruction from blotter.jsonl even if both state.json and full_history.json are deleted
    rmSync(store.statePath, { force: true });
    rmSync(store.historyPath, { force: true });
    rmSync(`${store.historyPath}.bak`, { force: true });
    const now = Date.now();
    const blotterLines = [
      JSON.stringify({ at: now - 50_000, event: "TICKET_ISSUED", ticketId: "TF-BLOTTER-9", asset: "EURUSD", direction: "short", entry: 1.085, invalidation: 1.09, target: 1.078, notional: 5000 }),
      JSON.stringify({ at: now - 40_000, event: "POSITION_OPENED", ticketId: "TF-BLOTTER-9", asset: "EURUSD", direction: "short", fillPrice: 1.085, entry: 1.085, notional: 5000 }),
      JSON.stringify({ at: now - 10_000, event: "POSITION_CLOSED", ticketId: "TF-BLOTTER-9", asset: "EURUSD", closeReason: "target", fillPrice: 1.085, exitPrice: 1.081, pnl: 18.75 }),
    ];
    writeFileSync(store.blotterPath, `${blotterLines.join("\n")}\n`, "utf8");

    const fromBlotter = store.loadOrCreate(10_000, "Europe/Paris", ["EURUSD"], 15);
    const recovered = fromBlotter.tickets.find((t) => t.id === "TF-BLOTTER-9");
    assert.ok(recovered, "Closed ticket must be reconstructed from blotter.jsonl on cold restart");
    assert.equal(recovered.status, "closed");
    assert.equal(recovered.pnl, 18.75);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("MT5 Crypto Bridge v2.1: alias mapping, contract-size safe payload & EA diagnostics", () => {
  assert.equal(Mt5CloudBridge.mapMt5SymbolToDesk("BTC/USD"), "BTCUSDT");
  assert.equal(Mt5CloudBridge.mapMt5SymbolToDesk("#BTCUSD"), "BTCUSDT");
  assert.equal(Mt5CloudBridge.mapMt5SymbolToDesk("XBTUSD"), "BTCUSDT");
  assert.equal(Mt5CloudBridge.mapMt5SymbolToDesk("XRP-USD"), "XRPUSDT");

  const payload = Mt5CloudBridge.buildLocalBridgePayload([
    {
      id: "TF-CR-1",
      asset: "XRPUSDT",
      direction: "short",
      status: "open",
      entry: 0.96,
      invalidation: 0.97,
      target: 0.94,
      notional: 1500,
    },
  ]);
  assert.equal(payload.openOrders.length, 1);
  assert.equal(payload.openOrders[0].symbol, "XRPUSD");
  assert.equal(payload.openOrders[0].notional, 1500);

  const mq5 = Mt5CloudBridge.generateMql5ExpertAdvisor();
  assert.ok(mq5.includes("ResolveCryptoChain"));
  assert.ok(mq5.includes("ComputeBrokerSafeLots"));
  assert.ok(mq5.includes("RecordRejectedOrder"));
  assert.ok(mq5.includes("availableCryptos"));
  assert.ok(mq5.includes("cryptoSupported"));
});

test("Equity curve clean rendering without -85k drop & tradesPerMinute acceleration setting", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-eq-cadence-"));
  try {
    assert.ok(DASHBOARD_HTML.includes("function buildEquitySeriesPoints("));
    assert.ok(DASHBOARD_HTML.includes("function updateLiveEquityChart("));
    assert.ok(DASHBOARD_HTML.includes("function applyTradesPerMinDirectly("));
    assert.ok(DASHBOARD_HTML.includes("cfgTradesPerMin"));
    assert.ok(DASHBOARD_HTML.includes("navCadenceBadge"));

    const scriptMatch = DASHBOARD_HTML.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
    assert.ok(scriptMatch && scriptMatch[1]);
    assert.doesNotThrow(() => new Function(scriptMatch[1]));

    const store = new DeskStore(dir);
    const cfg = makeTestCfg(dir);
    const desk = new TradingFloorDesk(cfg, store, new TelegramFloorRoom(cfg), new GrpoEngine(join(dir, "grpo.json")));
    desk.state.lastScanAt = Date.now();
    await desk.updateBoardConfig({ settings: { tradesPerMinute: 30 } });
    assert.equal(desk.state.settings.tradesPerMinute, 30);
    assert.equal(desk.state.settings.scalpIntervalSec, 2);
    assert.equal(desk.state.settings.autoPaperScalp, true);
    assert.equal(desk.state.settings.executionMode, "auto");
    assert.equal(desk.state.lastScanAt, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
