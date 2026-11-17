import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDefaultSettings, DEFAULT_AGENT_PROMPTS, PROMPT_SCHEMA_VERSION } from "./llm.ts";
import { dayKey, isoWeek, ticketDay } from "./time.ts";
import {
  AGENT_IDS,
  type AgentId,
  type DeskState,
  type SelfReflectionReviewEntry,
  type Ticket,
} from "./types.ts";

export type FullHistoryArchive = {
  version: number;
  savedAt: number;
  startEquity: number;
  realizedPnl: number;
  tickets: Ticket[];
  curve: DeskState["curve"];
  killed: DeskState["killed"];
  messages: DeskState["messages"];
  selfReflectionHistory: SelfReflectionReviewEntry[];
  current_market_regime_directive?: string;
  lastSelfReflectionAt?: number;
};

export class DeskStore {
  readonly dir: string;
  readonly statePath: string;
  readonly blotterPath: string;
  readonly historyPath: string;

  constructor(dataDir: string) {
    this.dir = dataDir;
    mkdirSync(this.dir, { recursive: true });
    this.statePath = join(this.dir, "state.json");
    this.blotterPath = join(this.dir, "blotter.jsonl");
    this.historyPath = join(this.dir, "full_history.json");
  }

  private readHistoryArchive(): Partial<FullHistoryArchive> | null {
    for (const p of [this.historyPath, `${this.historyPath}.bak`]) {
      if (!existsSync(p)) continue;
      try {
        const parsed = JSON.parse(readFileSync(p, "utf8")) as Partial<FullHistoryArchive>;
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        // Fallback sur .bak si fichier principal corrompu
      }
    }
    return null;
  }

  private reconstructTicketsFromBlotter(): Ticket[] {
    if (!existsSync(this.blotterPath)) return [];
    const byId = new Map<string, Ticket>();
    const archivedClosed: Ticket[] = [];
    const emptyWin = {
      label: "Archive Blotter",
      bars: 60,
      trades: 1,
      winRate: 0.5,
      expectancyR: 0.1,
      profitFactor: 1.2,
      sharpe: 0.5,
      deflatedSharpe: 0.5,
      maxDrawdownR: 1,
      var95R: -1,
      pass: true,
    };
    try {
      const lines = readFileSync(this.blotterPath, "utf8").split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) continue;
        let row: Record<string, unknown>;
        try {
          row = JSON.parse(line) as Record<string, unknown>;
        } catch {
          continue;
        }
        const id = String(row.ticketId ?? row.id ?? "");
        if (!id) continue;
        const ev = String(row.event ?? "");
        const at = Number(row.at ?? row.ts ?? Date.now());
        const entry = Number(row.entry ?? row.fillPrice ?? row.exitPrice ?? 0);
        const inv = Number(row.invalidation ?? (entry > 0 ? entry * 0.99 : 0));
        const target = Number(row.target ?? (entry > 0 ? entry * 1.02 : 0));
        const notional = Number(row.notional ?? 0);
        const stopPct = entry > 0 ? Math.abs(entry - inv) / entry : 0.01;
        const prev = byId.get(id);
        const supersededClosed = prev && prev.status === "closed" && ev !== "POSITION_CLOSED";
        if (supersededClosed && prev) {
          archivedClosed.push({
            ...prev,
            id: `${prev.id}-${prev.closedAt ?? archivedClosed.length}`,
          });
        }
        const base: Ticket = (!supersededClosed && prev) ? prev : {
          id,
          asset: String(row.asset ?? "BTCUSDT"),
          direction: row.direction === "short" ? "short" : "long",
          playbook: "breakout",
          engine: "breakout",
          thesis: String(row.note ?? "Restauré depuis blotter.jsonl"),
          entry,
          invalidation: inv,
          target,
          timeStopHours: 24,
          notional,
          qty: entry > 0 ? notional / entry : 0,
          riskUsd: Math.max(1, notional * stopPct),
          riskPct: 0.01,
          exposurePct: 0.1,
          binding: "risk",
          producedBy: Array.isArray(row.producedBy) ? (row.producedBy as AgentId[]) : ["analyst", "strategist", "risk", "lead"],
          backtest: {
            playbook: "breakout",
            rules: "Archive Blotter",
            source: "blotter.jsonl",
            inSample: emptyWin,
            outOfSample: emptyWin,
            pass: true,
          },
          status: "pending",
          createdAt: at,
          expiresAt: at + 3600_000,
          fees: Number((notional * 0.0008).toFixed(2)),
          funding: 0,
        };
        if (ev === "POSITION_OPENED") {
          base.status = "open";
          base.filledAt = at;
          if (row.fillPrice != null) base.fillPrice = Number(row.fillPrice);
        } else if (ev === "POSITION_CLOSED") {
          base.status = "closed";
          base.closedAt = at;
          if (row.fillPrice != null) base.fillPrice = Number(row.fillPrice);
          if (row.exitPrice != null) base.exitPrice = Number(row.exitPrice);
          if (row.pnl != null || row.netPnl != null) base.pnl = Number(row.pnl ?? row.netPnl);
          if (row.closeReason || row.reason) base.closeReason = String(row.closeReason ?? row.reason) as Ticket["closeReason"];
          base.postMortemReport = String(row.note ?? "");
        }
        byId.set(id, base);
      }
    } catch {
      return [];
    }
    return [...archivedClosed, ...[...byId.values()].filter((t) => t.status === "closed")];
  }

  loadOrCreate(
    startEquity: number,
    tz: string,
    symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    scanIntervalMin = 15,
    now = Date.now(),
  ): DeskState {
    let baseRaw: Partial<DeskState> = {};
    if (existsSync(this.statePath)) {
      try {
        baseRaw = JSON.parse(readFileSync(this.statePath, "utf8")) as DeskState;
      } catch {
        baseRaw = {};
      }
    }
    const merged = this.ensureDefaults(baseRaw as DeskState, startEquity, tz, symbols, scanIntervalMin, now);
    this.mergeFullHistoryIntoState(merged);
    if (!existsSync(this.statePath) || !existsSync(this.historyPath)) {
      this.save(merged);
    }
    return merged;
  }

  private mergeFullHistoryIntoState(state: DeskState): void {
    const archive = this.readHistoryArchive();
    const blotterClosed = this.reconstructTicketsFromBlotter();

    const ticketMap = new Map<string, Ticket>();
    // 1. Plus bas niveau : reconstruits du blotter (pour ne rien perdre même si ancien reset)
    for (const bt of blotterClosed) {
      ticketMap.set(bt.id, bt);
    }
    // 2. Archive persistante full_history.json (contient les objets Ticket complets)
    for (const at of archive?.tickets ?? []) {
      if (at && at.id) {
        const prev = ticketMap.get(at.id);
        if (!prev || at.status === "closed" || (at.status === "open" && prev.status !== "closed")) {
          ticketMap.set(at.id, at);
        }
      }
    }
    // 3. État actif state.json en priorité la plus haute
    for (const st of state.tickets ?? []) {
      if (st && st.id) {
        ticketMap.set(st.id, st);
      }
    }
    state.tickets = [...ticketMap.values()]
      .sort((a, b) => (b.closedAt ?? b.createdAt ?? 0) - (a.closedAt ?? a.createdAt ?? 0))
      .slice(0, 1500);

    // Fusion de la courbe d'équité (chronologique, dédupliquée par timestamp)
    const curveMap = new Map<number, DeskState["curve"][number]>();
    for (const pt of archive?.curve ?? []) {
      if (pt && Number.isFinite(pt.t)) curveMap.set(pt.t, pt);
    }
    for (const pt of state.curve ?? []) {
      if (pt && Number.isFinite(pt.t)) curveMap.set(pt.t, pt);
    }
    if (curveMap.size > 0) {
      state.curve = [...curveMap.values()].sort((a, b) => a.t - b.t).slice(-20_000);
    }

    // Fusion des Reviews 15 min
    const revMap = new Map<string, SelfReflectionReviewEntry>();
    for (const r of archive?.selfReflectionHistory ?? []) {
      if (r && r.id) revMap.set(r.id, r);
    }
    for (const r of state.selfReflectionHistory ?? []) {
      if (r && r.id) revMap.set(r.id, r);
    }
    state.selfReflectionHistory = [...revMap.values()].sort((a, b) => b.at - a.at).slice(0, 120);
    if (!state.current_market_regime_directive && archive?.current_market_regime_directive) {
      state.current_market_regime_directive = archive.current_market_regime_directive;
    }
    if (!state.lastSelfReflectionAt && archive?.lastSelfReflectionAt) {
      state.lastSelfReflectionAt = archive.lastSelfReflectionAt;
    }

    if ((!state.killed || state.killed.length === 0) && archive?.killed?.length) {
      state.killed = archive.killed;
    }
    if ((!state.messages || state.messages.length === 0) && archive?.messages?.length) {
      state.messages = archive.messages;
    }
    if (state.realizedPnl === 0 && typeof archive?.realizedPnl === "number" && archive.realizedPnl !== 0) {
      state.realizedPnl = archive.realizedPnl;
    }
  }

  private createEmpty(
    startEquity: number,
    tz: string,
    symbols: string[],
    scanIntervalMin: number,
    now: number,
  ): DeskState {
    const activities = {} as DeskState["activities"];
    for (const id of AGENT_IDS) {
      activities[id] = {
        agent: id,
        status: id === "lead" ? "watch" : "idle",
        label: id === "lead" ? "Coordination & veille active" : "En salle — prêt",
        updatedAt: now,
      };
    }
    return {
      version: 1,
      startEquity,
      realizedPnl: 0,
      dayKey: dayKey(now, tz),
      dayStartEquity: startEquity,
      halted: false,
      haltKind: null,
      seqDay: ticketDay(now, tz),
      seq: 0,
      nonce: 0,
      tickets: [],
      killed: [],
      wakes: [],
      messages: [],
      curve: [
        {
          t: now - 3600_000 * 6,
          eq: startEquity,
          realized: 0,
          unrealized: 0,
          drawdownPct: 0,
        },
        {
          t: now,
          eq: startEquity,
          realized: 0,
          unrealized: 0,
          drawdownPct: 0,
        },
      ],
      tape: [],
      activities,
      pulses: [],
      cooldowns: {},
      reportWeek: isoWeek(now, tz),
      lastScanAt: 0,
      lastTickAt: now,
      onOvernight: false,
      overnightLog: [],
      tgOffset: 0,
      exchangeNote: "MODE PAPER · Aucune clé connectée · Toute clé avec permission de retrait est refusée d'office.",
      telegramConnected: false,
      settings: createDefaultSettings(symbols, scanIntervalMin),
      agentPrompts: JSON.parse(JSON.stringify(DEFAULT_AGENT_PROMPTS)),
      promptsVersion: PROMPT_SCHEMA_VERSION,
      llmCallCount: 0,
      lastLlmProviderUsed: "Moteur déterministe FR (0 coût)",
      volatilityShieldUntil: 0,
      macroEvents: [],
      socialSentiment: {},
      fomoSignals: [],
    };
  }

  private ensureDefaults(
    s: DeskState,
    startEquity: number,
    tz: string,
    symbols: string[],
    scanIntervalMin: number,
    now: number,
  ): DeskState {
    const empty = this.createEmpty(startEquity, tz, symbols, scanIntervalMin, now);
    const mergedSettings = { ...empty.settings, ...(s.settings ?? {}) };
    if (mergedSettings.slMode === "atr" && (mergedSettings.slVal ?? 0) >= 10) {
      mergedSettings.slVal = mergedSettings.fixedStopAtr || 1.35;
    }

    const needPromptUpgrade = (s.promptsVersion ?? 1) < PROMPT_SCHEMA_VERSION;
    let upgradedPrompts = { ...empty.agentPrompts, ...(s.agentPrompts ?? {}) };
    if (needPromptUpgrade) {
      upgradedPrompts = JSON.parse(JSON.stringify(DEFAULT_AGENT_PROMPTS));
      const oldStrat = s.agentPrompts?.strategist?.systemPrompt ?? "";
      const dirMatch = oldStrat.match(/(\[DIRECTIVE_REVIEWER_15M[^\n]*[\s\S]*)$/);
      if (dirMatch) {
        upgradedPrompts.strategist.systemPrompt = `${upgradedPrompts.strategist.systemPrompt.trimEnd()}\n${dirMatch[1]}`;
      }
    }

    return {
      ...empty,
      ...s,
      activities: { ...empty.activities, ...(s.activities ?? {}) },
      messages: s.messages ?? [],
      curve: s.curve?.length ? s.curve : empty.curve,
      tape: s.tape ?? [],
      pulses: s.pulses ?? [],
      settings: mergedSettings,
      agentPrompts: upgradedPrompts,
      promptsVersion: PROMPT_SCHEMA_VERSION,
    };
  }

  save(state: DeskState): void {
    const tmp = `${this.statePath}.tmp`;
    writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
    renameSync(tmp, this.statePath);
    this.saveFullHistory(state);
  }

  saveFullHistory(state: DeskState): void {
    try {
      const archive: FullHistoryArchive = {
        version: 2,
        savedAt: Date.now(),
        startEquity: state.startEquity,
        realizedPnl: state.realizedPnl,
        tickets: (state.tickets ?? []).slice(0, 1500),
        curve: (state.curve ?? []).slice(-20_000),
        killed: (state.killed ?? []).slice(0, 100),
        messages: (state.messages ?? []).slice(-300),
        selfReflectionHistory: (state.selfReflectionHistory ?? []).slice(0, 120),
        current_market_regime_directive: state.current_market_regime_directive,
        lastSelfReflectionAt: state.lastSelfReflectionAt,
      };
      if (existsSync(this.historyPath)) {
        try {
          copyFileSync(this.historyPath, `${this.historyPath}.bak`);
        } catch {
          // ignore backup error
        }
      }
      const hTmp = `${this.historyPath}.tmp`;
      writeFileSync(hTmp, JSON.stringify(archive, null, 2), "utf8");
      renameSync(hTmp, this.historyPath);
    } catch {
      // Never crash main save on archive error
    }
  }

  appendBlotter(event: string, ticket: Ticket, note: string, at = Date.now()): void {
    const row = JSON.stringify({
      at,
      iso: new Date(at).toISOString(),
      event,
      ticketId: ticket.id,
      asset: ticket.asset,
      direction: ticket.direction,
      status: ticket.status,
      notional: ticket.notional,
      entry: ticket.entry,
      invalidation: ticket.invalidation,
      target: ticket.target,
      fillPrice: ticket.fillPrice ?? null,
      exitPrice: ticket.exitPrice ?? null,
      pnl: ticket.pnl ?? null,
      closeReason: ticket.closeReason ?? null,
      producedBy: ticket.producedBy,
      note,
    });
    appendFileSync(this.blotterPath, `${row}\n`, "utf8");
  }
}

export function setAgentActivity(
  state: DeskState,
  agent: AgentId,
  status: DeskState["activities"][AgentId]["status"],
  label: string,
  now = Date.now(),
  extra: { targetAgent?: AgentId; asset?: string } = {},
): void {
  state.activities[agent] = {
    agent,
    status,
    label,
    updatedAt: now,
    ...extra,
  };
}

export function emitPulse(
  state: DeskState,
  from: AgentId | "human",
  to: AgentId | "human",
  kind: DeskState["pulses"][number]["kind"],
  label: string,
  asset?: string,
  now = Date.now(),
): void {
  state.nonce += 1;
  state.pulses = [
    ...state.pulses.slice(-45),
    {
      id: `p${state.nonce}`,
      at: now,
      from,
      to,
      kind,
      label,
      ...(asset ? { asset } : {}),
    },
  ];
}
