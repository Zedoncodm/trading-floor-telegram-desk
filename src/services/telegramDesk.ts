import type { TradingFloorDesk } from "../desk.ts";
import { currentDayPnl, currentEquity } from "../desk.ts";
import type { TelegramFloorRoom } from "../telegram.ts";
import { AGENT_IDS, AGENT_NAMES, type Ticket } from "../types.ts";
import { StrategyOptimizerAgent, type OptimizerReport } from "../agents/strategyOptimizer.ts";

/**
 * Service Telegram du desk :
 * - Push : ouverture / clôture de trade, rapport Strategy_Optimizer, alertes critiques
 *   (bridge MT5 déconnecté / ordres rejetés, seuil de drawdown journalier).
 * - Commandes : /status, /agents, /pause, /resume (interceptées avant le desk).
 */
export class TelegramDeskService {
  private seen = new Map<string, Ticket["status"]>();
  private seeded = false;
  private mt5WasConnected: boolean | null = null;
  private rejectedSeen = new Set<string>();
  private ddAlertDay = "";
  private haltAlerted = false;
  private queue: Promise<void> = Promise.resolve();

  private readonly desk: TradingFloorDesk;
  private readonly tg: TelegramFloorRoom;
  private readonly optimizer: StrategyOptimizerAgent;

  constructor(
    desk: TradingFloorDesk,
    tg: TelegramFloorRoom,
    optimizer: StrategyOptimizerAgent,
  ) {
    this.desk = desk;
    this.tg = tg;
    this.optimizer = optimizer;
  }

  private send(text: string): void {
    // File séquentielle : préserve l'ordre et évite le rate-limit Telegram.
    this.queue = this.queue.then(() => this.tg.postAs("lead", text)).catch(() => {});
  }

  private equity(): { balance: number; equity: number; ccy: string } {
    const live = this.desk.state.mt5Live;
    if (live?.connected) return { balance: live.balance, equity: live.equity, ccy: live.currency || "USD" };
    const eq = currentEquity(this.desk.state);
    return { balance: this.desk.state.startEquity + this.desk.state.realizedPnl, equity: eq, ccy: "USD" };
  }

  /** À appeler à chaque mise à jour d'état du desk. */
  onState(): void {
    const st = this.desk.state;
    if (!this.seeded) {
      for (const t of st.tickets) this.seen.set(t.id, t.status);
      for (const r of st.mt5Live?.rejectedOrders ?? []) this.rejectedSeen.add(r.id);
      this.mt5WasConnected = st.mt5Live?.connected ?? null;
      this.seeded = true;
      return;
    }
    for (const t of st.tickets) {
      const prev = this.seen.get(t.id);
      if (prev === t.status) continue;
      this.seen.set(t.id, t.status);
      if (t.status === "open" && prev !== "open") this.send(this.fmtOpen(t));
      else if (t.status === "closed" && prev !== "closed") this.send(this.fmtClose(t));
    }
    this.checkAlerts();
  }

  private checkAlerts(): void {
    const st = this.desk.state;
    if (st.settings?.mt5Enabled || st.mt5Live) {
      const conn = Boolean(st.mt5Live?.connected);
      if (this.mt5WasConnected === true && !conn) this.send("🚨 ALERTE BRIDGE MT5 : déconnexion détectée (aucune synchro depuis >25s). Vérifiez MetaTrader 5 / l'EA TradingFloorBridge.");
      if (this.mt5WasConnected === false && conn) this.send("✅ Bridge MT5 reconnecté.");
      this.mt5WasConnected = conn;
    }
    for (const r of st.mt5Live?.rejectedOrders ?? []) {
      if (this.rejectedSeen.has(r.id)) continue;
      this.rejectedSeen.add(r.id);
      this.send(`🚨 ERREUR BRIDGE MT5 : ordre ${r.id} rejeté sur ${r.symbol} (${r.reason}).`);
    }
    const limit = Number(process.env.DAILY_DD_ALERT_PCT || 0.03);
    const dayPnl = currentDayPnl(st);
    const ddPct = st.dayStartEquity > 0 ? -dayPnl / st.dayStartEquity : 0;
    if (ddPct >= limit && this.ddAlertDay !== st.dayKey) {
      this.ddAlertDay = st.dayKey;
      this.send(`🚨 DRAWDOWN JOURNALIER : ${(ddPct * 100).toFixed(2)}% (${dayPnl.toFixed(2)} $) ≥ seuil ${(limit * 100).toFixed(1)}%. Envisagez /pause.`);
    }
    if (st.halted && st.haltKind === "loss" && !this.haltAlerted) {
      this.haltAlerted = true;
      this.send("🛑 HALT AUTOMATIQUE : limite de perte journalière atteinte, ouverture de nouveaux trades bloquée.");
    } else if (!st.halted) this.haltAlerted = false;
  }

  private justification(t: Ticket): string {
    const parts = (t.thesis || t.journalNotes || "").split(/\s*\|\s*|\.\s+/).map((x) => x.trim()).filter(Boolean);
    const l1 = (parts[0] ?? "Setup validé par le desk").slice(0, 140);
    const l2 = (parts[1] ?? `${t.playbook} · DSR ${((t.dsrScore ?? 0) * 100).toFixed(0)}%`).slice(0, 140);
    return `${l1}\n${l2}`;
  }

  fmtOpen(t: Ticket): string {
    const eq = this.equity().equity;
    const px = t.fillPrice ?? t.entry;
    return [
      `🟢 OUVERTURE ${t.asset} ${t.direction === "long" ? "LONG" : "SHORT"} (${t.id})`,
      `Lot : ${t.mt5Lots ?? "-"} | Entrée : ${px}`,
      `SL : ${t.invalidation} | TP : ${t.target}`,
      `Risque : ${t.riskUsd.toFixed(2)} $ (${((t.riskUsd / Math.max(eq, 1)) * 100).toFixed(2)}%)`,
      this.justification(t),
    ].join("\n");
  }

  fmtClose(t: Ticket): string {
    const pnl = t.pnl ?? t.mt5Profit ?? 0;
    const eq = this.equity().equity;
    const r = t.rMultiple ?? (t.riskUsd > 0 ? pnl / t.riskUsd : 0);
    const mins = ((t.closedAt ?? Date.now()) - (t.filledAt ?? t.createdAt)) / 60_000;
    const dur = mins >= 60 ? `${Math.floor(mins / 60)}h${String(Math.round(mins % 60)).padStart(2, "0")}` : `${mins.toFixed(1)} min`;
    return [
      `${pnl >= 0 ? "✅" : "🔻"} CLÔTURE ${t.asset} ${t.direction.toUpperCase()} (${t.id})`,
      `PnL net : ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} $ (${((pnl / Math.max(eq, 1)) * 100).toFixed(2)}%)`,
      `R:R réalisé : ${r >= 0 ? "+" : ""}${r.toFixed(2)}R | Durée : ${dur}${t.closeReason ? ` | ${t.closeReason}` : ""}`,
    ].join("\n");
  }

  onOptimizerReport(r: OptimizerReport): void {
    const lines = [
      `🧠 STRATEGY_OPTIMIZER v${r.version} (${r.trigger})`,
      `${r.sampleSize} trades · WR ${(r.metrics.winRate * 100).toFixed(0)}% · PF ${r.metrics.profitFactor} · DD ${(r.metrics.maxDrawdownPct * 100).toFixed(1)}%`,
      ...(r.changes.length ? r.changes.map((c) => `• ${c.param} : ${c.from} → ${c.to} — ${c.why}`) : ["• Aucun ajustement de paramètre"]),
      ...(r.toxicPairs.length ? [`• Quarantaine 24h : ${r.toxicPairs.join(", ")}`] : []),
      ...r.findings.slice(0, 3).map((f) => `› ${f}`),
    ];
    this.send(lines.join("\n"));
  }

  /** Retourne true si la commande a été traitée ici. */
  async handleCommand(raw: string): Promise<boolean> {
    const cmd = raw.trim().toLowerCase().split(/\s+/)[0] ?? "";
    if (cmd === "status") {
      const st = this.desk.state;
      const { balance, equity, ccy } = this.equity();
      const open = st.tickets.filter((t) => t.status === "open");
      const posLines = open.slice(0, 15).map((t) => {
        const p = t.mt5Profit ?? 0;
        return `• ${t.asset} ${t.direction.toUpperCase()} ${t.mt5Lots ?? "-"} lot @ ${t.fillPrice ?? t.entry} | ${p >= 0 ? "+" : ""}${p.toFixed(2)}`;
      });
      this.send([
        `📊 STATUS ${st.halted ? "(⏸ PAUSE)" : "(▶ ACTIF)"}`,
        `Balance : ${balance.toFixed(2)} ${ccy}`,
        `Equity : ${equity.toFixed(2)} ${ccy}`,
        `PnL du jour : ${currentDayPnl(st) >= 0 ? "+" : ""}${currentDayPnl(st).toFixed(2)} ${ccy}`,
        `MT5 : ${st.mt5Live?.connected ? "connecté" : "déconnecté"}`,
        `Positions ouvertes : ${open.length}`,
        ...posLines,
      ].join("\n"));
      return true;
    }
    if (cmd === "agents") {
      const now = Date.now();
      const ago = (t: number) => (t ? `${Math.round((now - t) / 1000)}s` : "jamais");
      const lines = AGENT_IDS.map((id) => {
        const a = this.desk.state.activities?.[id];
        const stale = a && now - a.updatedAt > 15 * 60_000;
        return `${stale ? "🟡" : a?.status === "veto" ? "🔴" : "🟢"} ${AGENT_NAMES[id]} : ${a?.status ?? "n/a"} — ${a?.label ?? "-"} (${ago(a?.updatedAt ?? 0)})`;
      });
      const h = this.optimizer.health;
      lines.push(`${h.status === "error" ? "🔴" : "🟢"} Strategy_Optimizer : ${h.status} — ${h.lastAction} (${ago(h.lastRunAt)})`);
      this.send(["🤖 AGENTS", ...lines].join("\n"));
      return true;
    }
    if (cmd === "pause") {
      await this.desk.toggleManualHalt(true);
      this.send("⏸ Desk en PAUSE : aucune nouvelle ouverture. Les positions ouvertes restent gérées (SL/TP).");
      return true;
    }
    if (cmd === "resume") {
      const r = await this.desk.toggleManualHalt(false);
      this.send(r.halted ? "⚠️ Reprise refusée : halt de perte journalière actif." : "▶ Desk RELANCÉ : ouverture de nouveaux trades autorisée.");
      return true;
    }
    if (cmd === "optimize") {
      void this.optimizer.run("commande Telegram");
      this.send("🧠 Strategy_Optimizer lancé.");
      return true;
    }
    return false;
  }

  static summary(r: OptimizerReport): string {
    return StrategyOptimizerAgent.summarize(r);
  }
}
