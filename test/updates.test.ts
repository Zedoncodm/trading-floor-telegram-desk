import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { computeRiskBasedLots, formatLotLog, normalizeVolume } from "../src/lotSizing.ts";
import { ReviewerAgent } from "../src/agents/reviewer.ts";
import { StrategyOptimizerAgent } from "../src/agents/strategyOptimizer.ts";
import { TelegramDeskService } from "../src/services/telegramDesk.ts";
import { isDirectLocal } from "../src/auth.ts";
import type { DeskState, Ticket } from "../src/types.ts";

function makeTicket(over: Partial<Ticket> = {}): Ticket {
  const now = Date.now();
  return {
    id: over.id ?? "T-1",
    asset: over.asset ?? "EURUSD",
    direction: over.direction ?? "long",
    playbook: "HFT_OrderFlow_Imbalance",
    thesis: "OrderFlow imbalance confirmed with VWAP support and tight spread.",
    entry: 1.1,
    invalidation: 1.098,
    target: 1.104,
    timeStopHours: 1,
    notional: 100_000,
    qty: 100_000,
    riskUsd: 637.5,
    riskPct: 0.0075,
    exposurePct: 1.17,
    binding: "risk",
    producedBy: ["strategist", "risk"],
    backtest: {
      playbook: "HFT_OrderFlow_Imbalance",
      rules: "test",
      source: "test",
      inSample: { label: "IS", bars: 100, trades: 20, winRate: 0.5, expectancyR: 0.2, profitFactor: 1.4, sharpe: 1.1, deflatedSharpe: 0.6, maxDrawdownR: 2, var95R: -1, pass: true },
      outOfSample: { label: "OOS", bars: 50, trades: 10, winRate: 0.5, expectancyR: 0.2, profitFactor: 1.4, sharpe: 1.1, deflatedSharpe: 0.6, maxDrawdownR: 2, var95R: -1, pass: true },
      pass: true,
    },
    status: "closed",
    createdAt: now - 600_000,
    expiresAt: now + 600_000,
    filledAt: now - 540_000,
    closedAt: now,
    fillPrice: 1.1,
    fees: 5,
    funding: 0,
    pnl: 500,
    rMultiple: 0.78,
    closeReason: "target",
    mt5Lots: 3.18,
    ...over,
  };
}

test("1. Lot sizing sur compte 85 000 $ (EURUSD, XAUUSD, cap & step)", () => {
  // 85 000 * 0.75% = 637.50 $ de risque. 20 pips = 200 pts * 1 $/pt = 200 $/lot -> 3.1875 -> 3.18 lot
  const eur = computeRiskBasedLots({
    symbol: "EURUSD",
    equity: 85_000,
    entry: 1.1,
    stopLoss: 1.098,
    riskPercent: 0.0075,
    maxLotCap: 10,
  });
  assert.equal(eur.ok, true);
  assert.equal(eur.riskAmount, 637.5);
  assert.equal(eur.finalLot, 3.18);
  assert.match(formatLotLog(eur, "Test"), /Equity=85000\.00\$ \| Risk=0\.75% \| RiskAmount=637\.50\$/);

  // XAUUSD : SL 5 $ = 500 pts * 1 $/pt -> 637.50 / 500 = 1.275 -> 1.27 lot
  const xau = computeRiskBasedLots({
    symbol: "XAUUSD",
    equity: 85_000,
    entry: 2650,
    stopLoss: 2645,
    riskPercent: 0.0075,
    maxLotCap: 10,
  });
  assert.equal(xau.finalLot, 1.27);

  // Plafond MAX_LOT_CAP + VolumeStep 0.05
  const capped = computeRiskBasedLots({
    symbol: "EURUSD",
    equity: 85_000,
    entry: 1.1,
    stopLoss: 1.0998,
    riskPercent: 0.01,
    maxLotCap: 5,
    spec: { volumeMin: 0.05, volumeMax: 20, volumeStep: 0.05 },
  });
  assert.equal(capped.finalLot, 5);
  assert.equal(capped.capApplied, "max_lot_cap");
  assert.equal(normalizeVolume(1.23, { volumeMin: 0.05, volumeStep: 0.05 }), 1.2);
});

test("2. Reviewer audit individuel + Strategy_Optimizer versionné & rollback", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tf-opt-"));
  try {
    const tickets = Array.from({ length: 10 }, (_, i) =>
      makeTicket({
        id: `T-${i + 1}`,
        asset: i < 5 ? "USDJPY" : "EURUSD",
        pnl: i < 7 ? -400 : 600,
        rMultiple: i < 7 ? -0.9 : 1.3,
        closeReason: i < 7 ? "invalidation" : "target",
      }),
    );
    const audit = ReviewerAgent.auditTrade(tickets[0]!);
    assert.equal(audit.planRespected, true);
    assert.equal(audit.justified, true);

    const state = {
      startEquity: 85_000,
      realizedPnl: -1000,
      dayStartEquity: 85_000,
      dayKey: "2026-11-18",
      halted: false,
      haltKind: null,
      tickets,
      messages: [],
      cooldowns: {},
      curve: [{ t: 1, eq: 86_000, realized: 1000, unrealized: 0, drawdownPct: 0 }, { t: 2, eq: 81_000, realized: -4000, unrealized: 0, drawdownPct: 0.058 }],
      settings: { fixedStopAtr: 1.35, maxRiskPct: 0.01, riskPerTradePct: 0.008, trainedRewardR: 1.8 } as DeskState["settings"],
    } as unknown as DeskState;

    const deskStub = {
      state,
      applyStrategyParams(patch: Partial<{ fixedStopAtr: number; riskPerTradePct: number; trainedRewardR: number; maxRiskPct: number }>, q: Record<string, number> = {}) {
        Object.assign(state.settings, patch);
        Object.assign(state.cooldowns, q);
      },
      publishLocal() {},
      async runAgenticSelfReflection() {
        return "";
      },
    };

    const opt = new StrategyOptimizerAgent(deskStub, dir);
    const r1 = await opt.run("test");
    assert.ok(r1);
    assert.equal(r1.version, 1);
    assert.ok(r1.toxicPairs.includes("USDJPY"));
    assert.ok(r1.changes.length > 0);
    assert.ok(state.settings.fixedStopAtr > 1.35);

    const r2 = opt.rollback(1);
    assert.ok(r2);
    assert.equal(state.settings.fixedStopAtr, 1.35);
    assert.equal(opt.listVersions().length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("3. TelegramDeskService notifications & commandes /status /agents /pause /resume", async () => {
  const sent: string[] = [];
  let halted = false;
  const ticket = makeTicket({ id: "T-99", status: "pending", pnl: undefined });
  const state = {
    startEquity: 85_000,
    realizedPnl: 250,
    dayStartEquity: 85_000,
    dayKey: "2026-11-18",
    halted: false,
    haltKind: null,
    tickets: [ticket],
    tape: [],
    messages: [],
    activities: {},
    settings: { mt5Enabled: true },
    mt5Live: { connected: true, balance: 85_250, equity: 85_350, currency: "USD", updatedAt: Date.now(), login: 1, server: "Demo", profit: 100, freeMargin: 80_000, leverage: 100, tradeAllowed: true, positionsCount: 1 },
  } as unknown as DeskState;

  const deskStub = {
    state,
    async toggleManualHalt(h?: boolean) {
      halted = h ?? !halted;
      state.halted = halted;
      return { ok: true, halted };
    },
  } as never;

  const tgStub = {
    async postAs(_agent: string, text: string) {
      sent.push(text);
    },
  } as never;

  const optStub = { health: { status: "idle", lastRunAt: Date.now(), lastAction: "v1 ok", version: 1, closedAtLastRun: 10 } } as never;
  const svc = new TelegramDeskService(deskStub, tgStub, optStub);
  svc.onState(); // seed
  ticket.status = "open";
  svc.onState();
  ticket.status = "closed";
  ticket.pnl = 420;
  svc.onState();

  assert.equal(await svc.handleCommand("status"), true);
  assert.equal(await svc.handleCommand("agents"), true);
  assert.equal(await svc.handleCommand("pause"), true);
  assert.equal(state.halted, true);
  assert.equal(await svc.handleCommand("resume"), true);
  assert.equal(state.halted, false);

  await new Promise((r) => setTimeout(r, 20));
  assert.ok(sent.some((m) => m.includes("OUVERTURE EURUSD LONG")));
  assert.ok(sent.some((m) => m.includes("CLÔTURE EURUSD LONG") && m.includes("+420.00 $")));
  assert.ok(sent.some((m) => m.includes("Equity : 85350.00 USD")));
  assert.ok(sent.some((m) => m.includes("Strategy_Optimizer")));
});

test("4. Auth PIN : local direct autorisé, tunnel Cloudflare bloqué sans cookie", () => {
  assert.equal(isDirectLocal({ socket: { remoteAddress: "127.0.0.1" }, headers: {} } as never), true);
  assert.equal(
    isDirectLocal({ socket: { remoteAddress: "127.0.0.1" }, headers: { "cf-connecting-ip": "1.2.3.4" } } as never),
    false,
  );
});
