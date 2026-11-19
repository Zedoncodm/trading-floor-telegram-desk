import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DeskDatabase } from "./db.ts";
import { Mt5CloudBridge } from "./mt5.ts";
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
  private db: DeskDatabase | null = null;
  private lastDbSyncAt = 0;

  constructor(dataDir: string) {
    this.dir = dataDir;
    mkdirSync(this.dir, { recursive: true });
    try {
      if (!Mt5CloudBridge.isTestOrTempEnv(this.dir)) {
        this.db = new DeskDatabase(this.dir);
      }
    } catch {
      this.db = null;
    }
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
          asset: String(row.asset ?? "EURUSD"),
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
    symbols = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", "XAUUSD"],
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

  static sanitizeEquityCurve(points: DeskState["curve"]): DeskState["curve"] {
    if (!Array.isArray(points) || points.length <= 2) return points ?? [];
    const sortedVals = points.map((p) => p.eq).filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
    const globalMedian = sortedVals[Math.floor(sortedVals.length / 2)] ?? 0;
    const out: DeskState["curve"] = [];
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (!pt || !Number.isFinite(pt.t) || !Number.isFinite(pt.eq) || pt.eq <= 0) continue;
      // Fenêtre locale [i-3..i+3] pour rejeter les pics isolés (ex: artefact sync +100% à 174 838 €)
      const win: number[] = [];
      for (let j = Math.max(0, i - 3); j <= Math.min(points.length - 1, i + 3); j++) {
        if (j !== i && points[j] && Number.isFinite(points[j].eq) && points[j].eq > 0) {
          win.push(points[j].eq);
        }
      }
      win.sort((a, b) => a - b);
      const localRef = win.length ? win[Math.floor(win.length / 2)] : globalMedian;
      if (localRef > 0 && (pt.eq > localRef * 1.30 || pt.eq < localRef * 0.70)) {
        continue;
      }
      out.push(pt);
    }
    return out;
  }

  private mergeFullHistoryIntoState(state: DeskState): void {
    const archive = this.readHistoryArchive();
    const activeAcctKey = String(state.mt5Live?.login || state.settings?.mt5Login || "paper");
    const acctSnap = this.loadAccountSnapshot(activeAcctKey);

    if (acctSnap) {
      // Compte MT5 déjà isolé : on charge STRICTEMENT ses propres tickets + revues (zéro mélange avec un ancien compte)
      const ticketMap = new Map<string, Ticket>();
      for (const at of acctSnap.tickets) {
        if (at && at.id) ticketMap.set(at.id, at);
      }
      for (const st of state.tickets ?? []) {
        if (st && st.id && (!st.accountLogin || String(st.accountLogin) === activeAcctKey)) {
          ticketMap.set(st.id, st);
        }
      }
      state.tickets = [...ticketMap.values()]
        .sort((a, b) => (b.closedAt ?? b.createdAt ?? 0) - (a.closedAt ?? a.createdAt ?? 0))
        .slice(0, 1500);

      const revMap = new Map<string, SelfReflectionReviewEntry>();
      for (const r of acctSnap.reviews) {
        if (r && r.id) revMap.set(r.id, r);
      }
      for (const r of state.selfReflectionHistory ?? []) {
        if (r && r.id && (!r.accountLogin || String(r.accountLogin) === activeAcctKey)) {
          revMap.set(r.id, r);
        }
      }
      state.selfReflectionHistory = [...revMap.values()].sort((a, b) => b.at - a.at).slice(0, 120);
    } else {
      const blotterClosed = this.reconstructTicketsFromBlotter();
      const ticketMap = new Map<string, Ticket>();
      for (const bt of blotterClosed) {
        ticketMap.set(bt.id, bt);
      }
      for (const at of archive?.tickets ?? []) {
        if (at && at.id) {
          const prev = ticketMap.get(at.id);
          if (!prev || at.status === "closed" || (at.status === "open" && prev.status !== "closed")) {
            ticketMap.set(at.id, at);
          }
        }
      }
      for (const st of state.tickets ?? []) {
        if (st && st.id) {
          ticketMap.set(st.id, st);
        }
      }
      state.tickets = [...ticketMap.values()]
        .sort((a, b) => (b.closedAt ?? b.createdAt ?? 0) - (a.closedAt ?? a.createdAt ?? 0))
        .slice(0, 1500);

      const revMap = new Map<string, SelfReflectionReviewEntry>();
      for (const r of archive?.selfReflectionHistory ?? []) {
        if (r && r.id) revMap.set(r.id, r);
      }
      for (const r of state.selfReflectionHistory ?? []) {
        if (r && r.id) revMap.set(r.id, r);
      }
      state.selfReflectionHistory = [...revMap.values()].sort((a, b) => b.at - a.at).slice(0, 120);
    }

    // Fusion de la courbe d'équité par compte (SQLite 1 an + archive JSON + state.json — jamais perdue au redémarrage)
    const curveMap = new Map<number, DeskState["curve"][number]>();
    const dbCurve = this.loadPersistedCurveForAccount(activeAcctKey);
    for (const pt of dbCurve) {
      if (pt && Number.isFinite(pt.t) && Number.isFinite(pt.eq) && pt.eq > 0) curveMap.set(pt.t, pt);
    }
    for (const pt of archive?.curve ?? []) {
      if (
        pt &&
        Number.isFinite(pt.t) &&
        Number.isFinite(pt.eq) &&
        pt.eq > 0 &&
        (!pt.accountLogin || String(pt.accountLogin) === activeAcctKey)
      ) {
        curveMap.set(pt.t, pt);
      }
    }
    for (const pt of state.curve ?? []) {
      if (
        pt &&
        Number.isFinite(pt.t) &&
        Number.isFinite(pt.eq) &&
        pt.eq > 0 &&
        (!pt.accountLogin || String(pt.accountLogin) === activeAcctKey)
      ) {
        curveMap.set(pt.t, pt);
      }
    }
    if (curveMap.size > 0) {
      const sorted = [...curveMap.values()].sort((a, b) => a.t - b.t);
      state.curve = DeskStore.sanitizeEquityCurve(sorted).slice(-25_000);
    }

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
    if (mergedSettings.regime === "hft_kamikaze" && (mergedSettings.defaultLeverage ?? 5) <= 50) {
      mergedSettings.regime = "standard";
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
    const now = Date.now();
    if (this.db && now - this.lastDbSyncAt >= 2500) {
      this.lastDbSyncAt = now;
      this.db.syncState(state);
    }
  }

  /** Charge l'historique persistant (jusqu'à 365 jours) d'un compte donné depuis SQLite + fichier JSONL de secours. */
  loadPersistedCurveForAccount(accountKey: string, retentionDays = 365): DeskState["curve"] {
    const key = String(accountKey || "paper").replace(/[^a-zA-Z0-9_-]/g, "_");
    const byTs = new Map<number, DeskState["curve"][number]>();
    const cutoff = Date.now() - Math.max(1, retentionDays) * 86_400_000;
    if (this.db) {
      for (const pt of this.db.loadAccountCurve(key, retentionDays)) {
        if (pt.t >= cutoff) byTs.set(pt.t, pt);
      }
    }
    const ledgerPath = join(this.dir, `equity_curve_${key}.jsonl`);
    if (existsSync(ledgerPath)) {
      try {
        const lines = readFileSync(ledgerPath, "utf8").split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const pt = JSON.parse(line) as DeskState["curve"][number];
            if (pt && Number.isFinite(pt.t) && pt.t >= cutoff && Number.isFinite(pt.eq) && pt.eq > 0) {
              byTs.set(pt.t, pt);
            }
          } catch {
            // ignore corrupted line
          }
        }
      } catch {
        // ignore read error
      }
    }
    return [...byTs.values()].sort((a, b) => a.t - b.t).slice(-25_000);
  }

  /** Sauvegarde les tickets & audits Reviewer dédiés à un compte MT5 donné (jamais perdus ni mélangés). */
  saveAccountSnapshot(accountKey: string, tickets: Ticket[], reviews: SelfReflectionReviewEntry[]): void {
    try {
      const key = String(accountKey || "paper").replace(/[^a-zA-Z0-9_-]/g, "_");
      mkdirSync(this.dir, { recursive: true });
      const snapPath = join(this.dir, `account_history_${key}.json`);
      const prev = this.loadAccountSnapshot(key);
      const tMap = new Map<string, Ticket>();
      for (const t of prev?.tickets ?? []) {
        if (t && t.id) tMap.set(t.id, t);
      }
      for (const t of tickets ?? []) {
        if (t && t.id) tMap.set(t.id, { ...t, accountLogin: key });
      }
      const rMap = new Map<string, SelfReflectionReviewEntry>();
      for (const r of prev?.reviews ?? []) {
        if (r && r.id) rMap.set(r.id, r);
      }
      for (const r of reviews ?? []) {
        if (r && r.id) rMap.set(r.id, { ...r, accountLogin: key });
      }
      const payload = {
        accountKey: key,
        savedAt: Date.now(),
        tickets: [...tMap.values()]
          .sort((a, b) => (b.closedAt ?? b.createdAt ?? 0) - (a.closedAt ?? a.createdAt ?? 0))
          .slice(0, 2000),
        reviews: [...rMap.values()].sort((a, b) => b.at - a.at).slice(0, 150),
      };
      const tmp = `${snapPath}.tmp`;
      writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf8");
      renameSync(tmp, snapPath);
    } catch {
      // ignore archive error
    }
  }

  /** Charge les tickets & audits Reviewer persistants d'un compte MT5 précis (ou null si inexistant). */
  loadAccountSnapshot(accountKey: string): { tickets: Ticket[]; reviews: SelfReflectionReviewEntry[] } | null {
    try {
      const key = String(accountKey || "paper").replace(/[^a-zA-Z0-9_-]/g, "_");
      const snapPath = join(this.dir, `account_history_${key}.json`);
      if (!existsSync(snapPath)) return null;
      const parsed = JSON.parse(readFileSync(snapPath, "utf8")) as {
        tickets?: Ticket[];
        reviews?: SelfReflectionReviewEntry[];
      };
      return {
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      };
    } catch {
      return null;
    }
  }

  /** Ajoute en mode append-only le dernier point dans le ledger courbe dédié au compte (jamais réinitialisé). */
  appendCurvePointToLedger(accountKey: string, pt: DeskState["curve"][number]): void {
    try {
      mkdirSync(this.dir, { recursive: true });
      const key = String(accountKey || "paper").replace(/[^a-zA-Z0-9_-]/g, "_");
      const ledgerPath = join(this.dir, `equity_curve_${key}.jsonl`);
      appendFileSync(ledgerPath, `${JSON.stringify(pt)}\n`, "utf8");
    } catch {
      // never crash main loop
    }
  }

  saveFullHistory(state: DeskState): void {
    try {
      // Fusion additive avec l'archive existante du MÊME compte pour ne jamais écraser un historique plus long au redémarrage
      const prevArchive = this.readHistoryArchive();
      const activeAcctKey = String(state.mt5Live?.login || state.settings?.mt5Login || "paper");
      const mergedCurveMap = new Map<number, DeskState["curve"][number]>();
      for (const pt of prevArchive?.curve ?? []) {
        if (
          pt &&
          Number.isFinite(pt.t) &&
          Number.isFinite(pt.eq) &&
          pt.eq > 0 &&
          (!pt.accountLogin || String(pt.accountLogin) === activeAcctKey)
        ) {
          mergedCurveMap.set(pt.t, pt);
        }
      }
      for (const pt of state.curve ?? []) {
        if (pt && Number.isFinite(pt.t) && Number.isFinite(pt.eq) && pt.eq > 0) {
          mergedCurveMap.set(pt.t, pt);
        }
      }
      const mergedCurve = [...mergedCurveMap.values()].sort((a, b) => a.t - b.t).slice(-25_000);
      const archive: FullHistoryArchive = {
        version: 2,
        savedAt: Date.now(),
        startEquity: state.startEquity,
        realizedPnl: state.realizedPnl,
        tickets: (state.tickets ?? []).slice(0, 1500),
        curve: mergedCurve,
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
      if (activeAcctKey && activeAcctKey !== "paper") {
        const ownTickets = (state.tickets ?? []).filter((t) => !t.accountLogin || String(t.accountLogin) === activeAcctKey);
        const ownReviews = (state.selfReflectionHistory ?? []).filter((r) => !r.accountLogin || String(r.accountLogin) === activeAcctKey);
        this.saveAccountSnapshot(activeAcctKey, ownTickets, ownReviews);
      }
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
