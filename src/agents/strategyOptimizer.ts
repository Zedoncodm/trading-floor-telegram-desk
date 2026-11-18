import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DeskState, Ticket } from "../types.ts";
import { ReviewerAgent, type TradeAudit } from "./reviewer.ts";
import { defaultRiskPercent } from "../lotSizing.ts";

/**
 * Strategy_Optimizer (méta-stratège) : tâche de fond asynchrone.
 * - Déclenché tous les N trades clôturés (OPTIMIZER_EVERY_N_TRADES, défaut 10) et en fin de journée.
 * - Ingère les tickets clôturés, les audits du Reviewer et les logs des agents.
 * - Calcule Win Rate, Profit Factor, Drawdown, PnL par paire / playbook / session.
 * - Détecte paires toxiques, SL trop serrés/larges, R:R sous-optimal, sur-risque.
 * - Écrit strategy_adjustments.json + historique versionné (rollback possible).
 */

export type OptimizerParams = {
  fixedStopAtr: number;
  riskPerTradePct: number;
  trainedRewardR: number;
  maxRiskPct: number;
};

export type GroupStats = { trades: number; wins: number; pnl: number; grossWin: number; grossLoss: number; winRate: number; profitFactor: number; avgR: number };

export type OptimizerReport = {
  version: number;
  generatedAt: string;
  trigger: string;
  sampleSize: number;
  metrics: GroupStats & { maxDrawdownPct: number; stopOutRate: number; planViolationRate: number; avgSlippageR: number };
  byPair: Record<string, GroupStats>;
  byPlaybook: Record<string, GroupStats>;
  bySession: Record<string, GroupStats>;
  findings: string[];
  toxicPairs: string[];
  previousParams: OptimizerParams;
  appliedParams: OptimizerParams;
  changes: Array<{ param: keyof OptimizerParams; from: number; to: number; why: string }>;
  agentLogDigest: Record<string, number>;
  applied: boolean;
  rolledBackFrom?: number;
};

export type OptimizerHealth = {
  status: "idle" | "running" | "error";
  lastRunAt: number;
  lastAction: string;
  lastError?: string;
  version: number;
  closedAtLastRun: number;
};

type DeskLike = {
  state: DeskState;
  applyStrategyParams(patch: Partial<OptimizerParams>, quarantine?: Record<string, number>): void;
  publishLocal(speaker: "reviewer" | "lead", text: string): void;
  runAgenticSelfReflection(now?: number): Promise<string>;
};

function envNum(name: string, fallback: number): number {
  const n = Number((process.env[name] ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function stats(list: Ticket[]): GroupStats {
  const wins = list.filter((t) => (t.pnl ?? 0) > 0);
  const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(list.filter((t) => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0));
  const pnl = list.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const avgR = list.length ? list.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / list.length : 0;
  return {
    trades: list.length,
    wins: wins.length,
    pnl: Number(pnl.toFixed(2)),
    grossWin: Number(grossWin.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    winRate: list.length ? Number((wins.length / list.length).toFixed(3)) : 0,
    profitFactor: grossLoss > 0 ? Number((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 99 : 0,
    avgR: Number(avgR.toFixed(3)),
  };
}

function groupBy(list: Ticket[], key: (t: Ticket) => string): Record<string, GroupStats> {
  const m = new Map<string, Ticket[]>();
  for (const t of list) {
    const k = key(t) || "n/a";
    m.set(k, [...(m.get(k) ?? []), t]);
  }
  return Object.fromEntries([...m.entries()].map(([k, v]) => [k, stats(v)]));
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r4 = (v: number) => Number(v.toFixed(4));

export class StrategyOptimizerAgent {
  readonly name = "Strategy_Optimizer";
  readonly dir: string;
  readonly historyDir: string;
  readonly adjustmentsPath: string;
  health: OptimizerHealth;
  lastReport: OptimizerReport | null = null;
  private running = false;
  private lastEodKey = "";
  private listeners = new Set<(r: OptimizerReport) => void>();

  private readonly desk: DeskLike;
  private readonly timeZone: string;

  constructor(desk: DeskLike, dataDir: string, timeZone = "Europe/Paris") {
    this.desk = desk;
    this.timeZone = timeZone;
    this.dir = join(dataDir, "strategy_optimizer");
    this.historyDir = join(this.dir, "history");
    mkdirSync(this.historyDir, { recursive: true });
    this.adjustmentsPath = join(this.dir, "strategy_adjustments.json");
    this.lastReport = this.readJson<OptimizerReport>(this.adjustmentsPath);
    this.health = {
      status: "idle",
      lastRunAt: this.lastReport ? Date.parse(this.lastReport.generatedAt) : 0,
      lastAction: this.lastReport ? `v${this.lastReport.version} chargée` : "En attente de 10 trades clôturés",
      version: this.lastReport?.version ?? 0,
      closedAtLastRun: this.closedTickets().length,
    };
  }

  onReport(fn: (r: OptimizerReport) => void): void {
    this.listeners.add(fn);
  }

  private readJson<T>(p: string): T | null {
    try {
      return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : null;
    } catch {
      return null;
    }
  }

  private writeJson(p: string, data: unknown): void {
    const tmp = `${p}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    renameSync(tmp, p);
  }

  private closedTickets(): Ticket[] {
    return this.desk.state.tickets.filter((t) => t.status === "closed" && Number.isFinite(t.pnl ?? NaN));
  }

  currentParams(): OptimizerParams {
    const s = this.desk.state.settings;
    return {
      fixedStopAtr: s.fixedStopAtr ?? 1.35,
      riskPerTradePct: s.riskPerTradePct ?? defaultRiskPercent(),
      trainedRewardR: s.trainedRewardR ?? 1.8,
      maxRiskPct: s.maxRiskPct ?? 0.01,
    };
  }

  /** Appelé à chaque broadcast : déclenche tous les N trades et en fin de journée. */
  tick(now = Date.now()): void {
    const every = envNum("OPTIMIZER_EVERY_N_TRADES", 10);
    const closed = this.closedTickets().length;
    if (closed - this.health.closedAtLastRun >= every) {
      void this.run(`${closed - this.health.closedAtLastRun} trades clôturés`);
      return;
    }
    const eodHour = envNum("OPTIMIZER_EOD_HOUR", 22);
    const parts = new Intl.DateTimeFormat("fr-FR", { timeZone: this.timeZone, hour: "2-digit", hour12: false, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const key = `${get("year")}-${get("month")}-${get("day")}`;
    if (Number(get("hour")) >= eodHour && this.lastEodKey !== key) {
      this.lastEodKey = key;
      void this.run("fin de journée");
    }
  }

  async run(trigger = "manuel"): Promise<OptimizerReport | null> {
    if (this.running) return null;
    this.running = true;
    this.health.status = "running";
    this.health.lastAction = `Analyse (${trigger})`;
    try {
      // 1) Directive régime du Strategist (anciennement CRON 15 min du Reviewer)
      await this.desk.runAgenticSelfReflection().catch(() => "");
      const report = this.analyze(trigger);
      this.persistAndApply(report);
      this.health = {
        status: "idle",
        lastRunAt: Date.now(),
        lastAction: report.changes.length ? `v${report.version} : ${report.changes.length} ajustement(s)` : `v${report.version} : aucun ajustement`,
        version: report.version,
        closedAtLastRun: this.closedTickets().length,
      };
      for (const fn of this.listeners) fn(report);
      return report;
    } catch (e) {
      this.health.status = "error";
      this.health.lastError = e instanceof Error ? e.message : String(e);
      this.health.lastAction = "Erreur d'analyse";
      return null;
    } finally {
      this.running = false;
    }
  }

  analyze(trigger: string): OptimizerReport {
    const window = envNum("OPTIMIZER_WINDOW", 50);
    const closed = this.closedTickets().sort((a, b) => (a.closedAt ?? 0) - (b.closedAt ?? 0)).slice(-window);
    const audits: TradeAudit[] = closed.map((t) => ReviewerAgent.auditTrade(t));
    const overall = stats(closed);

    // Drawdown sur la courbe d'equity
    let peak = 0;
    let maxDd = 0;
    for (const p of this.desk.state.curve ?? []) {
      peak = Math.max(peak, p.eq);
      if (peak > 0) maxDd = Math.max(maxDd, (peak - p.eq) / peak);
    }
    const stopOutRate = closed.length ? closed.filter((t) => t.closeReason === "invalidation").length / closed.length : 0;
    const planViolationRate = audits.length ? audits.filter((a) => !a.planRespected).length / audits.length : 0;
    const avgSlippageR = audits.length ? audits.reduce((s, a) => s + a.slippageR, 0) / audits.length : 0;

    const byPair = groupBy(closed, (t) => t.asset);
    const byPlaybook = groupBy(closed, (t) => String(t.engine ?? t.playbook));
    const bySession = groupBy(closed, (t) => t.sessionName ?? "n/a");

    const agentLogDigest: Record<string, number> = {};
    for (const m of this.desk.state.messages.slice(-300)) agentLogDigest[m.speaker] = (agentLogDigest[m.speaker] ?? 0) + 1;
    const vetoCount = this.desk.state.messages.slice(-300).filter((m) => m.tone === "veto").length;

    const prev = this.currentParams();
    const next: OptimizerParams = { ...prev };
    const changes: OptimizerReport["changes"] = [];
    const findings: string[] = [];
    const minSample = envNum("OPTIMIZER_MIN_SAMPLE", 8);
    const set = (param: keyof OptimizerParams, to: number, why: string) => {
      const from = next[param];
      if (Math.abs(to - from) < 1e-6) return;
      next[param] = to;
      changes.push({ param, from: r4(from), to: r4(to), why });
    };

    const toxicPairs = Object.entries(byPair)
      .filter(([, g]) => g.trades >= 4 && g.pnl < 0 && g.profitFactor < 0.7)
      .map(([sym]) => sym);
    if (toxicPairs.length) findings.push(`Paires toxiques (PF<0.7, PnL<0, >=4 trades) : ${toxicPairs.join(", ")} -> quarantaine 24h.`);

    for (const [pb, g] of Object.entries(byPlaybook)) {
      if (g.trades >= 5 && g.profitFactor < 0.8) findings.push(`Playbook ${pb} sous-performant (PF ${g.profitFactor}, WR ${(g.winRate * 100).toFixed(0)}%) : inadapté au régime actuel.`);
    }
    for (const [ses, g] of Object.entries(bySession)) {
      if (g.trades >= 5 && g.pnl < 0) findings.push(`Session « ${ses} » perdante (${g.pnl.toFixed(0)}$ sur ${g.trades} trades).`);
    }
    if (planViolationRate > 0.3) findings.push(`${(planViolationRate * 100).toFixed(0)}% des trades hors plan (Reviewer) : discipline d'exécution à revoir.`);
    if (avgSlippageR > 0.1) findings.push(`Slippage moyen ${avgSlippageR.toFixed(2)}R : privilégier ordres LIMIT / sessions liquides.`);
    if (vetoCount > 40) findings.push(`${vetoCount} vetos récents : filtres trop restrictifs ou régime défavorable.`);

    if (closed.length >= minSample) {
      // SL trop serrés : beaucoup de stop-outs avec une majorité de pertes < 1R -> élargir le multiplicateur ATR
      if (stopOutRate > 0.55 && overall.winRate < 0.45) {
        set("fixedStopAtr", r4(clamp(prev.fixedStopAtr * 1.1, 0.6, 3.0)), `Stop-outs ${(stopOutRate * 100).toFixed(0)}% & WR ${(overall.winRate * 100).toFixed(0)}% : SL trop serrés (ATR x1.10).`);
      } else if (stopOutRate < 0.2 && overall.avgR < 0.3 && overall.trades >= minSample) {
        set("fixedStopAtr", r4(clamp(prev.fixedStopAtr * 0.95, 0.6, 3.0)), `Peu de stop-outs mais R moyen faible : SL trop larges (ATR x0.95).`);
      }
      // R:R : bon WR mais gains moyens faibles -> viser plus loin
      if (overall.winRate > 0.6 && overall.avgR < 0.5) {
        set("trainedRewardR", r4(clamp(prev.trainedRewardR * 1.1, 1.0, 4.0)), `WR élevé (${(overall.winRate * 100).toFixed(0)}%) mais R moyen ${overall.avgR} : cible R:R +10%.`);
      } else if (overall.winRate < 0.35 && overall.profitFactor < 1) {
        set("trainedRewardR", r4(clamp(prev.trainedRewardR * 0.9, 1.0, 4.0)), `WR faible (${(overall.winRate * 100).toFixed(0)}%) : cible R:R -10% pour capter plus de gains.`);
      }
      // Risque par trade (borné 0.5% - 1%)
      const ddLimit = envNum("OPTIMIZER_DD_DERISK_PCT", 0.04);
      if (maxDd > ddLimit || overall.profitFactor < 1) {
        set("riskPerTradePct", r4(clamp(prev.riskPerTradePct * 0.8, 0.005, 0.01)), `PF ${overall.profitFactor} / DD ${(maxDd * 100).toFixed(1)}% : réduction du risque par trade (-20%).`);
      } else if (overall.profitFactor > 1.5 && overall.winRate > 0.5 && maxDd < ddLimit / 2) {
        set("riskPerTradePct", r4(clamp(prev.riskPerTradePct * 1.1, 0.005, 0.01)), `PF ${overall.profitFactor}, DD ${(maxDd * 100).toFixed(1)}% : risque par trade +10%.`);
      }
    } else {
      findings.push(`Échantillon insuffisant (${closed.length}/${minSample}) : diagnostic seulement, aucun paramètre modifié.`);
    }

    const version = (this.lastReport?.version ?? 0) + 1;
    return {
      version,
      generatedAt: new Date().toISOString(),
      trigger,
      sampleSize: closed.length,
      metrics: { ...overall, maxDrawdownPct: r4(maxDd), stopOutRate: r4(stopOutRate), planViolationRate: r4(planViolationRate), avgSlippageR: r4(avgSlippageR) },
      byPair,
      byPlaybook,
      bySession,
      findings,
      toxicPairs,
      previousParams: prev,
      appliedParams: next,
      changes,
      agentLogDigest,
      applied: (process.env.OPTIMIZER_AUTO_APPLY ?? "true").toLowerCase() !== "false",
    };
  }

  private persistAndApply(report: OptimizerReport): void {
    const quarantine: Record<string, number> = {};
    const until = Date.now() + 24 * 3_600_000;
    for (const s of report.toxicPairs) quarantine[s] = until;
    if (report.applied) this.desk.applyStrategyParams(report.appliedParams, quarantine);
    this.writeJson(join(this.historyDir, `v${String(report.version).padStart(4, "0")}.json`), report);
    this.writeJson(this.adjustmentsPath, report);
    this.lastReport = report;
    this.desk.publishLocal("reviewer", `[Strategy_Optimizer] ${StrategyOptimizerAgent.summarize(report)}`);
  }

  listVersions(): Array<{ version: number; generatedAt: string; changes: number }> {
    return readdirSync(this.historyDir)
      .filter((f) => /^v\d+\.json$/.test(f))
      .map((f) => this.readJson<OptimizerReport>(join(this.historyDir, f)))
      .filter((r): r is OptimizerReport => Boolean(r))
      .map((r) => ({ version: r.version, generatedAt: r.generatedAt, changes: r.changes.length }))
      .sort((a, b) => b.version - a.version);
  }

  /** Restaure les paramètres AVANT la version donnée (previousParams de vN). */
  rollback(version: number): OptimizerReport | null {
    const target = this.readJson<OptimizerReport>(join(this.historyDir, `v${String(version).padStart(4, "0")}.json`));
    if (!target) return null;
    const cur = this.currentParams();
    const restored = target.previousParams;
    const report: OptimizerReport = {
      ...target,
      version: (this.lastReport?.version ?? 0) + 1,
      generatedAt: new Date().toISOString(),
      trigger: `rollback v${version}`,
      previousParams: cur,
      appliedParams: restored,
      toxicPairs: [],
      changes: (Object.keys(restored) as Array<keyof OptimizerParams>)
        .filter((k) => Math.abs(restored[k] - cur[k]) > 1e-6)
        .map((k) => ({ param: k, from: cur[k], to: restored[k], why: `Rollback vers l'état antérieur à v${version}` })),
      findings: [`Rollback manuel : paramètres restaurés à l'état précédant v${version}.`],
      applied: true,
      rolledBackFrom: version,
    };
    this.persistAndApply(report);
    this.health.version = report.version;
    this.health.lastAction = `Rollback v${version} -> v${report.version}`;
    for (const fn of this.listeners) fn(report);
    return report;
  }

  static summarize(r: OptimizerReport): string {
    const m = r.metrics;
    const head = `v${r.version} (${r.trigger}) · ${r.sampleSize} trades · WR ${(m.winRate * 100).toFixed(0)}% · PF ${m.profitFactor} · PnL ${m.pnl.toFixed(2)}$ · DD ${(m.maxDrawdownPct * 100).toFixed(1)}%`;
    const ch = r.changes.length
      ? r.changes.map((c) => `${c.param}: ${c.from} -> ${c.to} (${c.why})`).join(" | ")
      : "Aucun ajustement de paramètre.";
    const tox = r.toxicPairs.length ? ` | Quarantaine : ${r.toxicPairs.join(", ")}` : "";
    return `${head}. ${ch}${tox}`;
  }
}
