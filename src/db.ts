import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  DeskState,
  EquityPoint,
  TcaTransactionRecord,
  Ticket,
  XaiCognitiveAuditReport,
} from "./types.ts";

/**
 * Base de données SQLite dédiée (node:sqlite natif Node >= 22.5) pour archiver
 * durablement l'historique complet : tickets, TCA (Module 1), XAI (Module 2) et courbe d'équité.
 */
export class DeskDatabase {
  readonly dbPath: string;
  private readonly db: DatabaseSync;

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this.dbPath = join(dataDir, "desk.sqlite");
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        asset TEXT NOT NULL,
        direction TEXT NOT NULL,
        playbook TEXT NOT NULL,
        status TEXT NOT NULL,
        entry REAL NOT NULL,
        invalidation REAL NOT NULL,
        target REAL NOT NULL,
        fill_price REAL,
        exit_price REAL,
        mt5_lots REAL,
        pnl REAL,
        r_multiple REAL,
        close_reason TEXT,
        created_at INTEGER NOT NULL,
        closed_at INTEGER,
        payload_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tickets_asset_status ON tickets(asset, status);
      CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

      CREATE TABLE IF NOT EXISTS tca_reports (
        transaction_id TEXT PRIMARY KEY,
        ticket_id TEXT,
        instrument_ticker TEXT NOT NULL,
        direction TEXT NOT NULL,
        net_pnl_usd REAL NOT NULL,
        slippage_bps REAL NOT NULL,
        created_at INTEGER NOT NULL,
        payload_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS xai_reports (
        audit_id TEXT PRIMARY KEY,
        ticket_id TEXT,
        symbol TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        payload_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS equity_curve (
        ts INTEGER PRIMARY KEY,
        equity REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS account_equity_history (
        account_key TEXT NOT NULL,
        ts INTEGER NOT NULL,
        balance REAL NOT NULL,
        equity REAL NOT NULL,
        realized REAL NOT NULL DEFAULT 0,
        unrealized REAL NOT NULL DEFAULT 0,
        drawdown_pct REAL NOT NULL DEFAULT 0,
        PRIMARY KEY (account_key, ts)
      );

      CREATE INDEX IF NOT EXISTS idx_aeh_acct_ts ON account_equity_history(account_key, ts);
    `);
  }

  syncState(state: DeskState): void {
    try {
      const upsertTicket = this.db.prepare(`
        INSERT INTO tickets (id, asset, direction, playbook, status, entry, invalidation, target, fill_price, exit_price, mt5_lots, pnl, r_multiple, close_reason, created_at, closed_at, payload_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          invalidation = excluded.invalidation,
          target = excluded.target,
          fill_price = excluded.fill_price,
          exit_price = excluded.exit_price,
          mt5_lots = excluded.mt5_lots,
          pnl = excluded.pnl,
          r_multiple = excluded.r_multiple,
          close_reason = excluded.close_reason,
          closed_at = excluded.closed_at,
          payload_json = excluded.payload_json
      `);
      const upsertTca = this.db.prepare(`
        INSERT OR REPLACE INTO tca_reports (transaction_id, ticket_id, instrument_ticker, direction, net_pnl_usd, slippage_bps, created_at, payload_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const upsertXai = this.db.prepare(`
        INSERT OR REPLACE INTO xai_reports (audit_id, ticket_id, symbol, created_at, payload_json)
        VALUES (?, ?, ?, ?, ?)
      `);
      const upsertCurve = this.db.prepare(`
        INSERT OR REPLACE INTO equity_curve (ts, equity) VALUES (?, ?)
      `);
      const upsertAcctCurve = this.db.prepare(`
        INSERT OR REPLACE INTO account_equity_history (account_key, ts, balance, equity, realized, unrealized, drawdown_pct)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const accountKey = String(state.mt5Live?.login || state.settings?.mt5Login || "paper");

      this.db.exec("BEGIN");
      try {
        for (const t of state.tickets.slice(0, 120)) {
          this.writeTicketRow(upsertTicket, t);
          if (t.tcaRecord) {
            this.writeTcaRow(upsertTca, t.tcaRecord, t.id, t.closedAt ?? t.createdAt);
          }
          if (t.xaiAudit) {
            this.writeXaiRow(upsertXai, t.xaiAudit, t.id, t.asset, t.createdAt);
          }
        }
        for (const pt of (state.curve ?? []).slice(-250)) {
          if (Number.isFinite(pt.t) && Number.isFinite(pt.eq) && pt.eq > 0) {
            const ptKey = pt.accountLogin ? String(pt.accountLogin) : accountKey;
            const bal =
              Number.isFinite(pt.balance) && (pt.balance ?? 0) > 0
                ? Number(pt.balance)
                : Math.max(0.01, Number((pt.eq - (pt.unrealized ?? 0)).toFixed(2)));
            upsertCurve.run(pt.t, pt.eq);
            upsertAcctCurve.run(
              ptKey,
              Math.round(pt.t),
              bal,
              pt.eq,
              Number(pt.realized ?? 0),
              Number(pt.unrealized ?? 0),
              Number(pt.drawdownPct ?? 0),
            );
          }
        }
        this.db.exec("COMMIT");
      } catch (err) {
        this.db.exec("ROLLBACK");
        throw err;
      }
    } catch (err) {
      console.error("[DeskDatabase] syncState error:", err);
    }
  }

  private writeTicketRow(stmt: ReturnType<DatabaseSync["prepare"]>, t: Ticket): void {
    stmt.run(
      t.id,
      t.asset,
      t.direction,
      t.playbook,
      t.status,
      t.entry,
      t.invalidation,
      t.target,
      t.fillPrice ?? null,
      t.exitPrice ?? null,
      t.mt5Lots ?? null,
      t.pnl ?? null,
      t.rMultiple ?? null,
      t.closeReason ?? null,
      t.createdAt,
      t.closedAt ?? null,
      JSON.stringify(t),
    );
  }

  private writeTcaRow(stmt: ReturnType<DatabaseSync["prepare"]>, r: TcaTransactionRecord, ticketId: string, createdAt: number): void {
    stmt.run(
      r.transaction_id,
      ticketId,
      r.instrument_ticker,
      r.direction,
      r.realized_outcome.net_pnl_usd,
      r.execution_metrics.trading_slippage_bps,
      createdAt,
      JSON.stringify(r),
    );
  }

  private writeXaiRow(stmt: ReturnType<DatabaseSync["prepare"]>, x: XaiCognitiveAuditReport, ticketId: string, symbol: string, createdAt: number): void {
    stmt.run(x.audit_id, ticketId, symbol, createdAt, JSON.stringify(x));
  }

  loadAccountCurve(accountKey: string, retentionDays = 365): EquityPoint[] {
    try {
      const cutoff = Date.now() - Math.max(1, retentionDays) * 86_400_000;
      const rows = this.db
        .prepare(
          `SELECT ts, balance, equity, realized, unrealized, drawdown_pct
           FROM account_equity_history
           WHERE account_key = ? AND ts >= ?
           ORDER BY ts ASC`,
        )
        .all(String(accountKey || "paper"), cutoff) as Array<{
          ts: number;
          balance: number;
          equity: number;
          realized: number;
          unrealized: number;
          drawdown_pct: number;
        }>;
      return rows
        .filter((r) => Number.isFinite(r.ts) && Number.isFinite(r.equity) && r.equity > 0)
        .map((r) => ({
          t: Number(r.ts),
          eq: Number(r.equity),
          balance: Number(r.balance > 0 ? r.balance : r.equity - (r.unrealized || 0)),
          realized: Number(r.realized || 0),
          unrealized: Number(r.unrealized || 0),
          drawdownPct: Number(r.drawdown_pct || 0),
          accountLogin: String(accountKey || "paper"),
        }));
    } catch {
      return [];
    }
  }

  getStats(): { tickets: number; tcaReports: number; xaiReports: number; curvePoints: number; dbPath: string } {
    const count = (tbl: string) => {
      const row = this.db.prepare(`SELECT COUNT(*) AS c FROM ${tbl}`).get() as { c?: number } | undefined;
      return Number(row?.c ?? 0);
    };
    return {
      tickets: count("tickets"),
      tcaReports: count("tca_reports"),
      xaiReports: count("xai_reports"),
      curvePoints: count("equity_curve"),
      dbPath: this.dbPath,
    };
  }

  close(): void {
    try {
      this.db.close();
    } catch { /* ignore */ }
  }
}
