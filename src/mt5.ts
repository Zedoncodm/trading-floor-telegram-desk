import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export type LocalMt5Position = {
  ticket: number;
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  lots: number;
  entry: number;
  current: number;
  sl: number;
  tp: number;
  profit: number;
  magic: number;
};

export type LocalMt5Quote = {
  symbol: string;
  brokerSymbol?: string;
  bid: number;
  ask: number;
  tradeMode?: number;
  /** Bougies natives MT5 M5 : [openTimeMs, open, high, low, close, volume] */
  barsM5?: number[][];
};

export type LocalMt5RejectedOrder = {
  id: string;
  symbol: string;
  reason: string;
};

export type LocalMt5ClosedDeal = {
  deal: number;
  positionId: number;
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  lots: number;
  entry: number;
  exit: number;
  profit: number;
  closedAt: number;
  dealReason?: "SL" | "TP" | "MANUAL" | "EA" | "OTHER";
};

export type LocalMt5State = {
  connected: boolean;
  timestamp: number;
  serverTimestamp?: number;
  login: number;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  profit: number;
  freeMargin: number;
  leverage: number;
  tradeAllowed: boolean;
  positions: LocalMt5Position[];
  quotes: LocalMt5Quote[];
  cryptoSupported?: boolean;
  availableCryptos?: string[];
  rejectedOrders?: LocalMt5RejectedOrder[];
  closedDeals?: LocalMt5ClosedDeal[];
};

const US_EQUITY_SYMBOLS = new Set(["NVDA", "AAPL", "TSLA", "MSFT", "AMZN"]);

export function isUsRegularMarketHoursUtc(now = Date.now()): boolean {
  const d = new Date(now);
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return false;
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  return mins >= 14 * 60 + 30 && mins < 21 * 60;
}

export type Mt5Credentials = {
  enabled: boolean;
  metaApiToken: string;
  accountId: string;
  login: string;
  password: string;
  server: string;
  defaultLots: number;
};

const MT5_CLIENT_BASE = "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";
const MT5_PROVISIONING_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

export class Mt5CloudBridge {
  private readonly cfgPath: string;
  private creds: Mt5Credentials;

  constructor(dataDir = "data/console") {
    mkdirSync(dataDir, { recursive: true });
    this.cfgPath = join(dataDir, "mt5_config.json");
    this.creds = {
      enabled: false,
      metaApiToken: (process.env.METAAPI_TOKEN ?? "").trim(),
      accountId: (process.env.METAAPI_ACCOUNT_ID ?? "").trim(),
      login: (process.env.MT5_LOGIN ?? "").trim(),
      password: (process.env.MT5_PASSWORD ?? "").trim(),
      server: (process.env.MT5_SERVER ?? "").trim(),
      defaultLots: Number(process.env.MT5_DEFAULT_LOTS ?? 0.01) || 0.01,
    };
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    if (!existsSync(this.cfgPath)) return;
    try {
      const saved = JSON.parse(readFileSync(this.cfgPath, "utf8")) as Partial<Mt5Credentials>;
      this.creds = {
        ...this.creds,
        ...saved,
        defaultLots: Math.max(0.01, Math.min(100, Number(saved.defaultLots ?? this.creds.defaultLots) || 0.01)),
      };
    } catch {
      // ignore corrupted config
    }
  }

  private saveToDisk(): void {
    const tmp = `${this.cfgPath}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.creds, null, 2), "utf8");
    renameSync(tmp, this.cfgPath);
  }

  configure(patch: Partial<Mt5Credentials>): Mt5Credentials {
    this.creds = {
      ...this.creds,
      ...patch,
      metaApiToken: patch.metaApiToken !== undefined ? patch.metaApiToken.trim() : this.creds.metaApiToken,
      accountId: patch.accountId !== undefined ? patch.accountId.trim() : this.creds.accountId,
      login: patch.login !== undefined ? patch.login.trim() : this.creds.login,
      password: patch.password !== undefined ? patch.password : this.creds.password,
      server: patch.server !== undefined ? patch.server.trim() : this.creds.server,
      defaultLots:
        patch.defaultLots !== undefined
          ? Math.max(0.01, Math.min(100, Number(patch.defaultLots) || 0.01))
          : this.creds.defaultLots,
    };
    this.saveToDisk();
    return this.creds;
  }

  getPublicSettings(): {
    mt5Enabled: boolean;
    metaApiAccountId: string;
    mt5Login: string;
    mt5Server: string;
    mt5DefaultLots: number;
    mt5TokenHint: string;
  } {
    const tok = this.creds.metaApiToken;
    return {
      mt5Enabled: this.creds.enabled,
      metaApiAccountId: this.creds.accountId,
      mt5Login: this.creds.login,
      mt5Server: this.creds.server,
      mt5DefaultLots: this.creds.defaultLots,
      mt5TokenHint: tok ? `${tok.slice(0, 6)}...${tok.slice(-4)}` : "",
    };
  }

  isConfigured(): boolean {
    return Boolean(this.creds.enabled && this.creds.metaApiToken && this.creds.accountId);
  }

  static mapSymbolToMt5(symbol: string): string {
    const raw = (symbol || "").trim().toUpperCase();
    const map: Record<string, string> = {
      BTCUSDT: "BTCUSD",
      ETHUSDT: "ETHUSD",
      SOLUSDT: "SOLUSD",
      BNBUSDT: "BNBUSD",
      XRPUSDT: "XRPUSD",
      AVAXUSDT: "AVAXUSD",
      DOGEUSDT: "DOGEUSD",
      LINKUSDT: "LINKUSD",
      "NQ1!": "USTEC",
      "ES1!": "US500",
      "YM1!": "US30",
      "FDAX1!": "DE40",
    };
    if (map[raw]) return map[raw];
    if (raw.endsWith("USDT")) return `${raw.slice(0, -4)}USD`;
    return raw;
  }

  async verifyOrProvisionAccount(): Promise<{
    ok: boolean;
    status: string;
    accountId?: string;
    balance?: number;
    equity?: number;
    broker?: string;
    currency?: string;
  }> {
    if (!this.creds.metaApiToken) {
      return { ok: false, status: "Token MetaApi manquant." };
    }
    const headers = {
      "auth-token": this.creds.metaApiToken,
      "content-type": "application/json",
    };

    try {
      // Auto-provision account if login + password + server supplied without accountId
      if (!this.creds.accountId && this.creds.login && this.creds.password && this.creds.server) {
        const listRes = await fetch(`${MT5_PROVISIONING_BASE}/users/current/accounts`, {
          headers,
          signal: AbortSignal.timeout(10_000),
        });
        if (listRes.ok) {
          const list = (await listRes.json()) as Array<{ _id?: string; id?: string; login?: string; server?: string }>;
          const match = list.find(
            (a) => String(a.login) === this.creds.login && String(a.server).toLowerCase() === this.creds.server.toLowerCase(),
          );
          if (match && (match._id || match.id)) {
            this.creds.accountId = String(match._id ?? match.id);
          }
        }
        if (!this.creds.accountId) {
          const createRes = await fetch(`${MT5_PROVISIONING_BASE}/users/current/accounts`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: `TradingFloor-${this.creds.login}`,
              type: "cloud",
              login: this.creds.login,
              password: this.creds.password,
              server: this.creds.server,
              platform: "mt5",
              magic: 4080,
            }),
            signal: AbortSignal.timeout(12_000),
          });
          const created = (await createRes.json()) as { id?: string; message?: string };
          if (!createRes.ok || !created.id) {
            return { ok: false, status: `Provisioning MT5 refusé : ${created.message ?? createRes.statusText}` };
          }
          this.creds.accountId = created.id;
          await fetch(`${MT5_PROVISIONING_BASE}/users/current/accounts/${this.creds.accountId}/deploy`, {
            method: "POST",
            headers,
            signal: AbortSignal.timeout(10_000),
          });
        }
        this.saveToDisk();
      }

      if (!this.creds.accountId) {
        return {
          ok: false,
          status: "Renseignez soit l'Account ID MetaApi, soit Login + Mot de passe + Serveur MT5.",
        };
      }

      const infoRes = await fetch(
        `${MT5_CLIENT_BASE}/users/current/accounts/${encodeURIComponent(this.creds.accountId)}/account-information`,
        { headers, signal: AbortSignal.timeout(10_000) },
      );
      const info = (await infoRes.json()) as {
        balance?: number;
        equity?: number;
        broker?: string;
        currency?: string;
        message?: string;
      };
      if (!infoRes.ok) {
        return {
          ok: false,
          accountId: this.creds.accountId,
          status: `Compte MT5 en cours de déploiement ou erreur : ${info.message ?? infoRes.statusText}`,
        };
      }
      this.creds.enabled = true;
      this.saveToDisk();
      return {
        ok: true,
        accountId: this.creds.accountId,
        balance: info.balance,
        equity: info.equity,
        broker: info.broker,
        currency: info.currency,
        status: `Connecté MT5 Cloud (${info.broker ?? this.creds.server} · Solde ${info.balance ?? "--"} ${info.currency ?? "USD"})`,
      };
    } catch (e) {
      return { ok: false, status: `Erreur réseau MetaApi : ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  async openMarketOrder(params: {
    symbol: string;
    direction: "long" | "short";
    lots?: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
  }): Promise<{ ok: boolean; positionId?: string; message: string }> {
    if (!this.isConfigured()) {
      return { ok: false, message: "Pont MT5 désactivé ou non configuré." };
    }
    const mt5Sym = Mt5CloudBridge.mapSymbolToMt5(params.symbol);
    const volume = Number(Math.max(0.01, Math.min(50, params.lots ?? this.creds.defaultLots)).toFixed(2));
    try {
      const res = await fetch(
        `${MT5_CLIENT_BASE}/users/current/accounts/${encodeURIComponent(this.creds.accountId)}/trade`,
        {
          method: "POST",
          headers: {
            "auth-token": this.creds.metaApiToken,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            actionType: params.direction === "long" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
            symbol: mt5Sym,
            volume,
            ...(params.stopLoss ? { stopLoss: Number(params.stopLoss.toFixed(5)) } : {}),
            ...(params.takeProfit ? { takeProfit: Number(params.takeProfit.toFixed(5)) } : {}),
            comment: (params.comment ?? "TradingFloorV3").slice(0, 28),
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      const data = (await res.json()) as { stringCode?: string; positionId?: string; orderId?: string; message?: string };
      if (!res.ok || (data.stringCode && data.stringCode !== "TRADE_RETCODE_DONE")) {
        return { ok: false, message: `Refus MT5 (${mt5Sym}) : ${data.message ?? data.stringCode ?? res.statusText}` };
      }
      const positionId = String(data.positionId ?? data.orderId ?? "");
      return { ok: true, positionId, message: `Exécuté MT5 Mobile : ${mt5Sym} ${volume} lot(s) (#${positionId})` };
    } catch (e) {
      return { ok: false, message: `Erreur ordre MT5 : ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  async closePosition(positionId: string): Promise<{ ok: boolean; message: string }> {
    if (!this.isConfigured() || !positionId) {
      return { ok: false, message: "Aucune position MT5 à clôturer." };
    }
    try {
      const res = await fetch(
        `${MT5_CLIENT_BASE}/users/current/accounts/${encodeURIComponent(this.creds.accountId)}/trade`,
        {
          method: "POST",
          headers: {
            "auth-token": this.creds.metaApiToken,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            actionType: "POSITION_CLOSE_ID",
            positionId,
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      const data = (await res.json()) as { stringCode?: string; message?: string };
      if (!res.ok || (data.stringCode && data.stringCode !== "TRADE_RETCODE_DONE")) {
        return { ok: false, message: `Clôture MT5 échouée : ${data.message ?? data.stringCode ?? res.statusText}` };
      }
      return { ok: true, message: `Position MT5 #${positionId} clôturée.` };
    } catch (e) {
      return { ok: false, message: `Erreur clôture MT5 : ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  async modifyPosition(params: {
    positionId?: string;
    symbol?: string;
    commentId?: string;
    stopLoss: number;
    takeProfit: number;
  }): Promise<{ ok: boolean; message: string }> {
    const sl = Number(params.stopLoss.toFixed(5));
    const tp = Number(params.takeProfit.toFixed(5));
    if (!this.isConfigured() || !params.positionId) {
      return {
        ok: true,
        message: `OrderModify synchronisé via pont local (${params.commentId ?? params.symbol ?? "ticket"} · SL=${sl} · TP=${tp}).`,
      };
    }
    try {
      const res = await fetch(
        `${MT5_CLIENT_BASE}/users/current/accounts/${encodeURIComponent(this.creds.accountId)}/trade`,
        {
          method: "POST",
          headers: {
            "auth-token": this.creds.metaApiToken,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            actionType: "POSITION_MODIFY",
            positionId: params.positionId,
            stopLoss: sl,
            takeProfit: tp,
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      const data = (await res.json()) as { stringCode?: string; message?: string };
      if (!res.ok || (data.stringCode && data.stringCode !== "TRADE_RETCODE_DONE")) {
        return { ok: false, message: `OrderModify MT5 refusé : ${data.message ?? data.stringCode ?? res.statusText}` };
      }
      return { ok: true, message: `OrderModify MT5 (#${params.positionId}) appliqué : SL=${sl} · TP=${tp}.` };
    } catch (e) {
      return { ok: false, message: `Erreur OrderModify MT5 : ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  static mapMt5SymbolToDesk(symbol: string): string {
    const raw = (symbol || "").trim().toUpperCase();
    const stripped = raw
      .replace(/(?:\.R|\.PRO|\.A|\.C|\.E|MICRO|RAW|_I|[M+])$/i, "")
      .replace(/[\/\-_#]/g, "");
    const rev: Record<string, string> = {
      BTCUSD: "BTCUSDT",
      XBTUSD: "BTCUSDT",
      BITCOIN: "BTCUSDT",
      ETHUSD: "ETHUSDT",
      ETHEREUM: "ETHUSDT",
      SOLUSD: "SOLUSDT",
      SOLANA: "SOLUSDT",
      BNBUSD: "BNBUSDT",
      XRPUSD: "XRPUSDT",
      RIPPLE: "XRPUSDT",
      AVAXUSD: "AVAXUSDT",
      DOGEUSD: "DOGEUSDT",
      DOGECOIN: "DOGEUSDT",
      LINKUSD: "LINKUSDT",
      CHAINLINK: "LINKUSDT",
      ADAUSD: "ADAUSDT",
      CARDANO: "ADAUSDT",
      LTCUSD: "LTCUSDT",
      LITECOIN: "LTCUSDT",
      DOTUSD: "DOTUSDT",
      SUIUSD: "SUIUSDT",
      NEARUSD: "NEARUSDT",
      TONUSD: "TONUSDT",
      SHIBUSD: "1000SHIBUSDT",
      PEPEUSD: "1000PEPEUSDT",
      USTEC: "NQ1!",
      NAS100: "NQ1!",
      US500: "ES1!",
      SPX500: "ES1!",
      US30: "YM1!",
      DE40: "FDAX1!",
      GER40: "FDAX1!",
      GOLD: "XAUUSD",
      WTI: "USOIL",
    };
    return rev[raw] ?? rev[stripped] ?? stripped ?? raw;
  }

  static getMt5FilesDirectories(): string[] {
    const dirs: string[] = [];
    const appData = process.env.APPDATA;
    if (!appData) return dirs;
    const baseDir = join(appData, "MetaQuotes", "Terminal");
    if (!existsSync(baseDir)) return dirs;
    try {
      const entries = readdirSync(baseDir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory() && ent.name.length >= 20) {
          const targetDir = join(baseDir, ent.name, "MQL5", "Files");
          if (existsSync(targetDir)) {
            dirs.push(targetDir);
          }
        }
      }
    } catch {
      // ignore fs error
    }
    return dirs;
  }

  /** Returns true under unit test runners or tmpdir dataDirs so live MT5 files are never mutated. */
  static isTestOrTempEnv(dataDir?: string): boolean {
    if (process.env.NODE_ENV === "test" || process.env.TF_DISABLE_LOCAL_MT5_BRIDGE === "1") {
      return true;
    }
    if (process.execArgv.some((arg) => arg === "--test" || arg.startsWith("--test-"))) {
      return true;
    }
    if (process.argv.some((arg) => arg.includes(".test.") || arg.endsWith("\\test") || arg.endsWith("/test"))) {
      return true;
    }
    if (dataDir) {
      const resolved = resolve(dataDir).toLowerCase();
      const tempRoot = resolve(tmpdir()).toLowerCase();
      if (resolved === tempRoot || resolved.startsWith(`${tempRoot}\\`) || resolved.startsWith(`${tempRoot}/`)) {
        return true;
      }
    }
    return false;
  }

  static readLocalMt5State(maxAgeMs = 25_000, dataDir?: string): LocalMt5State | null {
    const dirs = Mt5CloudBridge.isTestOrTempEnv(dataDir)
      ? (dataDir ? [dataDir] : [])
      : Mt5CloudBridge.getMt5FilesDirectories();
    for (const dir of dirs) {
      const statePath = join(dir, "mt5_state.json");
      if (!existsSync(statePath)) continue;
      try {
        const st = statSync(statePath);
        if (Date.now() - st.mtimeMs > maxAgeMs) continue;
        const raw = readFileSync(statePath, "utf8").replace(/^\uFEFF/, "").trim();
        if (!raw) continue;
        const parsed = JSON.parse(raw) as LocalMt5State;
        if (parsed && parsed.connected) {
          return parsed;
        }
      } catch {
        // ignore transient read/parse conflict
      }
    }
    return null;
  }

  getCachedQuote(symbol: string): { bid: number; ask: number } | null {
    const local = Mt5CloudBridge.readLocalMt5State();
    if (!local?.quotes?.length) return null;
    const norm = symbol.toUpperCase();
    const q = local.quotes.find((item: LocalMt5Quote) => String(item.symbol ?? "").toUpperCase() === norm);
    if (!q || !Number.isFinite(q.bid) || !Number.isFinite(q.ask) || q.bid <= 0 || q.ask <= 0) return null;
    return { bid: q.bid, ask: q.ask };
  }

  static writeLocalBridgePayload(payload: unknown, dataDir?: string): string[] {
    const isTest = Mt5CloudBridge.isTestOrTempEnv(dataDir);
    const dirs = isTest
      ? (dataDir ? [dataDir] : [])
      : Mt5CloudBridge.getMt5FilesDirectories();
    if (!dirs.length) return [];
    const json = JSON.stringify(payload);
    const written: string[] = [];
    for (const dir of dirs) {
      try {
        if (isTest) mkdirSync(dir, { recursive: true });
        const outPath = join(dir, "trading_floor_bridge.json");
        writeFileSync(outPath, json, "utf8");
        written.push(outPath);
      } catch {
        // ignore sharing contention
      }
    }
    return written;
  }

  static computeAssetLots(asset: string, notional: number, entryPrice: number, qty?: number, maxFxLots = 5.0): number {
    if (!notional || notional <= 0 || !entryPrice || entryPrice <= 0) return 0.01;
    const sym = (asset || "").trim().toUpperCase();
    const effectiveQty = qty && qty > 0 ? qty : notional / entryPrice;

    // 1. Paires Forex (EURUSD, GBPUSD, USDJPY, AUDUSD, NZDUSD, USDCAD, USDCHF, EURGBP, etc.)
    // Taille standard MT5 = 100 000 unités de la devise de base.
    if (/^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY){2}/.test(sym)) {
      const baseUnits = sym.startsWith("USD") ? notional : notional / entryPrice;
      const lots = baseUnits / 100_000;
      const fxCeil = Math.max(0.01, Math.min(100, maxFxLots));
      return Number(Math.max(0.01, Math.min(fxCeil, Math.round(lots * 100) / 100)).toFixed(2));
    }

    // 2. Or (XAUUSD, GOLD) -> 1 lot standard = 100 onces troy
    if (sym === "XAUUSD" || sym === "GOLD") {
      const ounces = effectiveQty;
      const lots = ounces / 100;
      return Number(Math.max(0.01, Math.min(100, Math.round(lots * 100) / 100)).toFixed(2));
    }

    // 3. Argent (XAGUSD, SILVER) -> 1 lot standard = 5 000 onces troy
    if (sym === "XAGUSD" || sym === "SILVER") {
      const ounces = effectiveQty;
      const lots = ounces / 5000;
      return Number(Math.max(0.01, Math.min(100, Math.round(lots * 100) / 100)).toFixed(2));
    }

    // 4. Pétrole brut (USOIL, WTI) -> 1 lot CFD = 100 barils
    if (sym === "USOIL" || sym === "WTI") {
      const barrels = effectiveQty;
      const lots = barrels / 100;
      return Number(Math.max(0.01, Math.min(100, Math.round(lots * 100) / 100)).toFixed(2));
    }

    // 4b. Gaz naturel (NGAS, XNGUSD, NATGAS) -> 1 lot standard = 10 000 MMBtu, plafonné à 5.0 lots
    if (sym === "NGAS" || sym === "XNGUSD" || sym === "NATGAS") {
      const mmbtu = effectiveQty;
      const lots = mmbtu / 10_000;
      return Number(Math.max(0.01, Math.min(5.0, Math.round(lots * 100) / 100)).toFixed(2));
    }

    // 5. Crypto (BTCUSDT, ETHUSDT, SOLUSDT, etc.) -> 1 lot = 1 coin / contrat
    if (/USDT$|USD$/.test(sym) && (sym.startsWith("BTC") || sym.startsWith("ETH") || sym.startsWith("SOL") || sym.startsWith("BNB") || sym.startsWith("XRP") || sym.startsWith("DOGE") || sym.startsWith("AVAX") || sym.startsWith("LINK"))) {
      const coins = effectiveQty;
      return Number(Math.max(0.01, Math.min(100, Math.round(coins * 100) / 100)).toFixed(2));
    }

    // 6. Indices (NQ1!, ES1!, YM1!, FDAX1!, NAS100, US30, US500, GER40)
    if (/NQ|ES|YM|FDAX|NAS|SPX|US30|US500|GER40|DE40/i.test(sym)) {
      const contracts = effectiveQty;
      return Number(Math.max(0.01, Math.min(100, Math.round(contracts * 100) / 100)).toFixed(2));
    }

    // 7. Actions US explicites (TSLA, MSFT, AAPL, NVDA, AMZN) -> 1 lot = 1 action
    if (US_EQUITY_SYMBOLS.has(sym)) {
      const shares = effectiveQty;
      return Number(Math.max(0.01, Math.min(500, Math.round(shares * 100) / 100)).toFixed(2));
    }

    // 8. Repli sécurisé pour tout autre contrat inconnu -> plafonné strictement à 5.0 lots
    return Number(Math.max(0.01, Math.min(5.0, Math.round((effectiveQty / 100) * 100) / 100)).toFixed(2));
  }

  static buildLocalBridgePayload(
    tickets: Array<{
      id: string;
      asset: string;
      direction: "long" | "short";
      status: string;
      entry?: number;
      fillPrice?: number;
      invalidation: number;
      target: number;
      mt5Lots?: number;
      notional?: number;
      qty?: number;
      riskUsd?: number;
      leverage?: number;
      closedAt?: number;
      mt5PositionId?: string;
    }>,
    defaultLots = 0.01,
    now = Date.now(),
  ): {
    ok: boolean;
    timestamp: number;
    openOrders: Array<{
      id: string;
      symbol: string;
      side: "BUY" | "SELL";
      lots: number;
      notional: number;
      riskUsd: number;
      entry: number;
      sl: number;
      tp: number;
    }>;
    closeOrders: Array<{
      ticket: number;
      id: string;
    }>;
  } {
    const usOpen = isUsRegularMarketHoursUtc(now);
    const openOrders = tickets
      .filter((t) => {
        if (t.status !== "open") return false;
        const symUpper = (t.asset || "").trim().toUpperCase();
        if (!usOpen && US_EQUITY_SYMBOLS.has(symUpper)) return false;
        return true;
      })
      .map((t) => {
        const rawLots = (t.mt5Lots && t.mt5Lots > 0)
          ? t.mt5Lots
          : (t.notional && t.notional > 0)
            ? Mt5CloudBridge.computeAssetLots(t.asset, t.notional, (t.fillPrice ?? t.entry) || 1, t.qty)
            : defaultLots ?? 0.01;
        const lots = Number(Math.max(0.01, Math.min(100, rawLots)).toFixed(2));
        return {
          id: t.id,
          symbol: Mt5CloudBridge.mapSymbolToMt5(t.asset),
          side: (t.direction === "long" ? "BUY" : "SELL") as "BUY" | "SELL",
          lots,
          notional: Number(((t.notional && t.notional > 0) ? t.notional : 0).toFixed(2)),
          // Montant risqué au SL : l'EA recalcule le lot avec le TickValue réel du broker.
          riskUsd: Number(((t.riskUsd && t.riskUsd > 0) ? t.riskUsd : 0).toFixed(2)),
          entry: Number(((t.fillPrice ?? t.entry) || 0).toFixed(5)),
          sl: Number(t.invalidation.toFixed(5)),
          tp: Number(t.target.toFixed(5)),
        };
      });

    const closeOrders = tickets
      .filter((t) => t.status === "closed" && t.mt5PositionId && (now - (t.closedAt ?? now)) < 120_000)
      .map((t) => ({
        ticket: Number(t.mt5PositionId),
        id: t.id,
      }));

    return {
      ok: true,
      timestamp: now,
      openOrders,
      closeOrders,
    };
  }

  static generateMql5ExpertAdvisor(baseUrl = "http://127.0.0.1:4080"): string {
    return `//+------------------------------------------------------------------+
//|                                           TradingFloorBridge.mq5 |
//|     Passerelle Bidirectionnelle v2.1 Trading Floor <-> MT5       |
//+------------------------------------------------------------------+
#property copyright "Trading Floor V3"
#property version   "2.10"
#include <Trade\\Trade.mqh>

input string InpServerUrl   = "${baseUrl}";
input string InpBridgeFile  = "trading_floor_bridge.json";
input string InpStateFile   = "mt5_state.json";
input int    InpPollSeconds = 1;
input long   InpMagic       = 4080;
input double InpMaxLotCap   = 10.0;   // Plafond de sécurité (MAX_LOT_CAP)
input bool   InpRiskSizing  = true;   // Recalcul du lot via riskUsd / (SL pts * TickValue)

CTrade trade;
double gMyMasterId = 0.0;
string gFailedIds  = "|";
string gExecutedIds = "|";
datetime gLastFailReset = 0;

string gRejIds[12];
string gRejSyms[12];
string gRejReasons[12];
int    gRejCount = 0;

void RecordRejectedOrder(const string id, const string sym, const string reason) {
   for(int i = 0; i < gRejCount; i++) {
      if(gRejIds[i] == id) {
         gRejSyms[i] = sym;
         gRejReasons[i] = reason;
         return;
      }
   }
   if(gRejCount < 12) {
      gRejIds[gRejCount] = id;
      gRejSyms[gRejCount] = sym;
      gRejReasons[gRejCount] = reason;
      gRejCount++;
   } else {
      for(int j = 0; j < 11; j++) {
         gRejIds[j] = gRejIds[j + 1];
         gRejSyms[j] = gRejSyms[j + 1];
         gRejReasons[j] = gRejReasons[j + 1];
      }
      gRejIds[11] = id;
      gRejSyms[11] = sym;
      gRejReasons[11] = reason;
   }
}

string JsonEscape(const string s) {
   string out = s;
   StringReplace(out, "\\\\", "\\\\\\\\");
   StringReplace(out, "\\"", "\\\\\\"");
   StringReplace(out, "\\r", " ");
   StringReplace(out, "\\n", " ");
   return out;
}

string NormalizeSymKey(const string s) {
   string k = s;
   StringToUpper(k);
   StringReplace(k, "/", "");
   StringReplace(k, "-", "");
   StringReplace(k, "_", "");
   StringReplace(k, ".", "");
   StringReplace(k, "#", "");
   StringReplace(k, " ", "");
   return k;
}

bool IsUsEquityTicker(const string sym) {
   string u = sym;
   StringToUpper(u);
   return (u == "NVDA" || u == "AAPL" || u == "TSLA" || u == "MSFT" || u == "AMZN");
}

bool IsStockMismatch(const string brokerSym, const string requestedBase) {
   if(IsUsEquityTicker(requestedBase)) return false;
   string p = SymbolInfoString(brokerSym, SYMBOL_PATH);
   StringToUpper(p);
   return (StringFind(p, "\\\\STOCK\\\\") >= 0 || StringFind(p, "NASDAQ\\\\") >= 0 || StringFind(p, "NYSE\\\\") >= 0);
}

bool IsCryptoSymbolCandidate(const string name, const string path) {
   string uName = NormalizeSymKey(name);
   string uPath = path;
   StringToUpper(uPath);
   if(StringFind(uPath, "CRYPTO") >= 0 || StringFind(uPath, "BITCOIN") >= 0 || StringFind(uPath, "DIGITAL") >= 0) return true;
   string cToks[] = { "BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "LTC", "AVAX", "LINK", "DOT", "SUI", "TON", "BITCOIN", "ETHEREUM", "RIPPLE", "SOLANA", "XBTUSD" };
   for(int i = 0; i < ArraySize(cToks); i++) {
      if(StringFind(uName, cToks[i]) == 0) return true;
   }
   return false;
}

bool EnsureMaster() {
   long nowLocal = (long)TimeLocal();
   if(!GlobalVariableCheck("TF_MASTER_CHART") || !GlobalVariableCheck("TF_MASTER_TS") ||
      (nowLocal - (long)GlobalVariableGet("TF_MASTER_TS") > 15)) {
      GlobalVariableSet("TF_MASTER_CHART", gMyMasterId);
      GlobalVariableSet("TF_MASTER_TS", (double)nowLocal);
      return true;
   }
   if(GlobalVariableGet("TF_MASTER_CHART") == gMyMasterId) {
      GlobalVariableSet("TF_MASTER_TS", (double)nowLocal);
      return true;
   }
   return false;
}

string ExtractStr(const string src, const string key, int startPos) {
   int p = StringFind(src, "\\"" + key + "\\":\\"", startPos);
   if(p < 0) return "";
   p += StringLen(key) + 4;
   int e = StringFind(src, "\\"", p);
   if(e < 0) return "";
   return StringSubstr(src, p, e - p);
}

double ExtractNum(const string src, const string key, int startPos) {
   int p = StringFind(src, "\\"" + key + "\\":", startPos);
   if(p < 0) return 0.0;
   p += StringLen(key) + 3;
   int eComma = StringFind(src, ",", p);
   int eBrace = StringFind(src, "}", p);
   int e = (eComma >= 0 && (eBrace < 0 || eComma < eBrace)) ? eComma : eBrace;
   if(e < 0) return 0.0;
   return StringToDouble(StringSubstr(src, p, e - p));
}

string TryAliasMatch(const string cand, const string requestedBase = "") {
   if(cand == "") return "";
   if(SymbolSelect(cand, true) && !IsStockMismatch(cand, requestedBase)) {
      if(SymbolInfoDouble(cand, SYMBOL_BID) > 0.0) return cand;
   }
   string sfx[] = { "m", ".r", ".pro", "raw", "+", "_i", "micro", ".a", ".c", "#", ".e", "c", ".std", "-USD" };
   for(int i = 0; i < ArraySize(sfx); i++) {
      string test = cand + sfx[i];
      if(SymbolSelect(test, true) && !IsStockMismatch(test, requestedBase) && SymbolInfoDouble(test, SYMBOL_BID) > 0.0) return test;
   }
   string candKey = NormalizeSymKey(cand);
   int total = SymbolsTotal(false);
   for(int i = 0; i < total; i++) {
      string name = SymbolName(i, false);
      string nameKey = NormalizeSymKey(name);
      if(nameKey != candKey && StringFind(nameKey, candKey) != 0) continue;
      if(IsStockMismatch(name, requestedBase)) continue;
      if(SymbolSelect(name, true) && SymbolInfoDouble(name, SYMBOL_BID) > 0.0) return name;
   }
   return "";
}

string ResolveCryptoChain(const string sym, const string tokA, const string tokB = "", const string tokC = "") {
   string r = "";
   r = TryAliasMatch(tokA + "USD", sym);   if(r != "") return r;
   r = TryAliasMatch(tokA + "/USD", sym);  if(r != "") return r;
   r = TryAliasMatch(tokA + "-USD", sym);  if(r != "") return r;
   r = TryAliasMatch("#" + tokA + "USD", sym); if(r != "") return r;
   r = TryAliasMatch(tokA + "USDT", sym);  if(r != "") return r;
   if(tokB != "") { r = TryAliasMatch(tokB, sym); if(r != "") return r; }
   if(tokC != "") { r = TryAliasMatch(tokC, sym); if(r != "") return r; }
   return "";
}

string ResolveBrokerSymbol(const string baseSym) {
   string sym = baseSym;
   StringToUpper(sym);
   string direct = TryAliasMatch(sym, sym);
   if(direct != "") return direct;

   if(sym == "BTCUSDT" || sym == "BTCUSD" || sym == "BTC")       return ResolveCryptoChain(sym, "BTC", "XBTUSD", "Bitcoin");
   if(sym == "ETHUSDT" || sym == "ETHUSD" || sym == "ETH")       return ResolveCryptoChain(sym, "ETH", "Ethereum");
   if(sym == "SOLUSDT" || sym == "SOLUSD" || sym == "SOL")       return ResolveCryptoChain(sym, "SOL", "Solana");
   if(sym == "XRPUSDT" || sym == "XRPUSD" || sym == "XRP")       return ResolveCryptoChain(sym, "XRP", "Ripple");
   if(sym == "BNBUSDT" || sym == "BNBUSD" || sym == "BNB")       return ResolveCryptoChain(sym, "BNB", "BinanceCoin");
   if(sym == "ADAUSDT" || sym == "ADAUSD" || sym == "ADA")       return ResolveCryptoChain(sym, "ADA", "Cardano");
   if(sym == "DOGEUSDT" || sym == "DOGEUSD" || sym == "DOGE")    return ResolveCryptoChain(sym, "DOGE", "Dogecoin");
   if(sym == "AVAXUSDT" || sym == "AVAXUSD" || sym == "AVAX")    return ResolveCryptoChain(sym, "AVAX", "Avalanche");
   if(sym == "LINKUSDT" || sym == "LINKUSD" || sym == "LINK")    return ResolveCryptoChain(sym, "LINK", "Chainlink");
   if(sym == "LTCUSDT" || sym == "LTCUSD" || sym == "LTC")       return ResolveCryptoChain(sym, "LTC", "Litecoin");
   if(sym == "DOTUSDT" || sym == "DOTUSD" || sym == "DOT")       return ResolveCryptoChain(sym, "DOT", "Polkadot");
   if(sym == "SUIUSDT" || sym == "SUIUSD" || sym == "SUI")       return ResolveCryptoChain(sym, "SUI");
   if(sym == "NEARUSDT" || sym == "NEARUSD" || sym == "NEAR")    return ResolveCryptoChain(sym, "NEAR");
   if(sym == "TONUSDT" || sym == "TONUSD" || sym == "TON")       return ResolveCryptoChain(sym, "TON", "Toncoin");
   if(StringFind(sym, "USDT") > 0) {
      string coin = StringSubstr(sym, 0, StringLen(sym) - 4);
      string cRes = ResolveCryptoChain(sym, coin);
      if(cRes != "") return cRes;
   }
   if(StringFind(sym, "USD") > 3 && StringLen(sym) >= 6) {
      string prefix = StringSubstr(sym, 0, StringLen(sym) - 3);
      string pRes = TryAliasMatch(prefix + "/USD", sym);
      if(pRes != "") return pRes;
   }

   if(sym == "USTEC" || sym == "NQ1!") {
      string a1 = TryAliasMatch("USTEC", sym); if(a1 != "") return a1;
      string a2 = TryAliasMatch("NAS100", sym); if(a2 != "") return a2;
      return TryAliasMatch("NDX", sym);
   }
   if(sym == "US30" || sym == "YM1!") {
      string d1 = TryAliasMatch("US30", sym); if(d1 != "") return d1;
      string d2 = TryAliasMatch("DJ30", sym); if(d2 != "") return d2;
      return TryAliasMatch("WS30", sym);
   }
   if(sym == "US500" || sym == "ES1!") {
      string sp1 = TryAliasMatch("US500", sym); if(sp1 != "") return sp1;
      return TryAliasMatch("SPX500", sym);
   }
   if(sym == "DE40" || sym == "FDAX1!") {
      string de1 = TryAliasMatch("DE40", sym); if(de1 != "") return de1;
      return TryAliasMatch("GER40", sym);
   }
   if(sym == "USOIL" || sym == "WTI") {
      string o1 = TryAliasMatch("USOIL", sym); if(o1 != "") return o1;
      string o2 = TryAliasMatch("XTIUSD", sym); if(o2 != "") return o2;
      string o3 = TryAliasMatch("WTICOUSD", sym); if(o3 != "") return o3;
      return TryAliasMatch("UKOIL", sym);
   }
   if(sym == "XAUUSD") {
      string x1 = TryAliasMatch("XAUUSD", sym); if(x1 != "") return x1;
      return TryAliasMatch("GOLD", sym);
   }
   return "";
}

double NormalizeLots(const string sym, const double rawLots) {
   double vmin  = SymbolInfoDouble(sym, SYMBOL_VOLUME_MIN);
   double vmax  = SymbolInfoDouble(sym, SYMBOL_VOLUME_MAX);
   double vstep = SymbolInfoDouble(sym, SYMBOL_VOLUME_STEP);
   if(vmin <= 0.0)  vmin = 0.01;
   if(vmax <= 0.0)  vmax = 50.0;
   if(vstep <= 0.0) vstep = 0.01;
   double clamped = MathMax(vmin, MathMin(vmax, rawLots));
   double stepped = MathFloor(clamped / vstep + 1e-6) * vstep;
   return NormalizeDouble(MathMax(vmin, stepped), 2);
}

double ComputeRiskLots(const string sym, const double riskUsd, const double slDist, const double reqLots) {
   if(!InpRiskSizing || riskUsd <= 0.0 || slDist <= 0.0) return reqLots;
   double tickSize  = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_VALUE);
   double point     = SymbolInfoDouble(sym, SYMBOL_POINT);
   if(tickSize <= 0.0 || tickValue <= 0.0 || point <= 0.0) return reqLots;
   double slPoints = slDist / point;
   double tickValuePerPoint = tickValue * (point / tickSize);
   double calc = riskUsd / (slPoints * tickValuePerPoint);
   double capped = MathMin(calc, InpMaxLotCap);
   double finalLot = NormalizeLots(sym, capped);
   PrintFormat("[LotSizing] %s | Equity=%.2f | RiskAmount=%.2f | SL Distance=%.5f (%.1f pts) | TickValue/pt=%.4f | Calculated Lot=%.4f | Final Lot=%.2f (desk=%.2f, cap=%.2f, step=%.2f)",
               sym, AccountInfoDouble(ACCOUNT_EQUITY), riskUsd, slDist, slPoints, tickValuePerPoint, calc, finalLot, reqLots, InpMaxLotCap,
               SymbolInfoDouble(sym, SYMBOL_VOLUME_STEP));
   return finalLot;
}

double ComputeBrokerSafeLots(const string sym, const double reqLots, const double notionalUsd, const ENUM_ORDER_TYPE oType, const double px) {
   double candidate = reqLots > 0.0 ? MathMin(reqLots, InpMaxLotCap) : 0.01;
   if(reqLots <= 0.0 && notionalUsd > 0.0 && px > 0.0) {
      double cSize = SymbolInfoDouble(sym, SYMBOL_TRADE_CONTRACT_SIZE);
      if(cSize > 0.0) {
         double exactLots = notionalUsd / (px * cSize);
         if(exactLots > 0.0) candidate = exactLots;
      }
   }
   double lots = NormalizeLots(sym, candidate);
   double freeM = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double marginNeed = 0.0;
   if(freeM > 0.0 && px > 0.0 && OrderCalcMargin(oType, sym, lots, px, marginNeed) && marginNeed > freeM * 0.75 && marginNeed > 0.0) {
      double scaled = lots * ((freeM * 0.70) / marginNeed);
      lots = NormalizeLots(sym, scaled);
   }
   return lots;
}

void MarkIdExecuted(const string id) {
   if(id == "") return;
   if(StringFind(gExecutedIds, "|" + id + "|") >= 0) return;
   if(StringLen(gExecutedIds) > 4000) {
      int cut = StringFind(gExecutedIds, "|", 1500);
      if(cut > 0) gExecutedIds = StringSubstr(gExecutedIds, cut);
      else gExecutedIds = "|";
   }
   gExecutedIds += id + "|";
}

bool HasHistoricalDealForId(const string id) {
   if(id == "") return false;
   datetime fromT = TimeCurrent() - 14 * 86400;
   datetime toT = TimeCurrent() + 3600;
   if(!HistorySelect(fromT, toT)) return false;
   int total = HistoryDealsTotal();
   for(int i = total - 1; i >= 0; i--) {
      ulong dTicket = HistoryDealGetTicket(i);
      if(dTicket == 0) continue;
      long dEntry = HistoryDealGetInteger(dTicket, DEAL_ENTRY);
      if(dEntry != DEAL_ENTRY_IN && dEntry != DEAL_ENTRY_OUT && dEntry != DEAL_ENTRY_INOUT) continue;
      string cmt = HistoryDealGetString(dTicket, DEAL_COMMENT);
      if(cmt == id) return true;
   }
   return false;
}

bool HasOpenPositionForId(const string id) {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      string cmt = PositionGetString(POSITION_COMMENT);
      if(cmt == id && PositionGetInteger(POSITION_MAGIC) == InpMagic) return true;
      if(StringFind(id, "MT5-") == 0) {
         string subTicket = StringSubstr(id, 4);
         if(IntegerToString((long)ticket) == subTicket) return true;
      }
   }
   return false;
}

bool ModifyPositionByComment(const string id, const string realSym, double slPx, double tpPx) {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetInteger(POSITION_MAGIC) == InpMagic && PositionGetString(POSITION_COMMENT) == id) {
         return trade.PositionModify(ticket, slPx, tpPx);
      }
   }
   return trade.PositionModify(realSym, slPx, tpPx);
}

bool SyncOpenPositionStops(const string id, double targetSl, double targetTp) {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic || PositionGetString(POSITION_COMMENT) != id) continue;
      string pSym = PositionGetString(POSITION_SYMBOL);
      long posType = PositionGetInteger(POSITION_TYPE);
      int digits = (int)SymbolInfoInteger(pSym, SYMBOL_DIGITS);
      double point = SymbolInfoDouble(pSym, SYMBOL_POINT);
      double bid = SymbolInfoDouble(pSym, SYMBOL_BID);
      double ask = SymbolInfoDouble(pSym, SYMBOL_ASK);
      double stopLevelPts = (double)SymbolInfoInteger(pSym, SYMBOL_TRADE_STOPS_LEVEL);
      double minDist = (stopLevelPts + 3.0) * point;
      double curSl = PositionGetDouble(POSITION_SL);
      double curTp = PositionGetDouble(POSITION_TP);
      double nextSl = (targetSl > 0.0) ? NormalizeDouble(targetSl, digits) : curSl;
      double nextTp = (targetTp > 0.0) ? NormalizeDouble(targetTp, digits) : curTp;
      if(posType == POSITION_TYPE_BUY) {
         if(nextSl > 0.0 && bid > 0.0 && nextSl > bid - minDist) {
            double clampedSl = NormalizeDouble(bid - minDist, digits);
            nextSl = (curSl <= 0.0 || clampedSl >= curSl) ? clampedSl : curSl;
         }
         if(nextTp > 0.0 && ask > 0.0 && nextTp < ask + minDist) {
            nextTp = NormalizeDouble(ask + minDist, digits);
         }
      } else if(posType == POSITION_TYPE_SELL) {
         if(nextSl > 0.0 && ask > 0.0 && nextSl < ask + minDist) {
            double clampedSl = NormalizeDouble(ask + minDist, digits);
            nextSl = (curSl <= 0.0 || clampedSl <= curSl) ? clampedSl : curSl;
         }
         if(nextTp > 0.0 && bid > 0.0 && nextTp > bid - minDist) {
            nextTp = NormalizeDouble(bid - minDist, digits);
         }
      }
      double tol = MathMax(point * 5.0, 1e-6);
      if(MathAbs(nextSl - curSl) > tol || MathAbs(nextTp - curTp) > tol) {
         return trade.PositionModify(ticket, nextSl, nextTp);
      }
      return false;
   }
   return false;
}

void WriteMt5StateToFile() {
   long login    = AccountInfoInteger(ACCOUNT_LOGIN);
   string server = AccountInfoString(ACCOUNT_SERVER);
   string curr   = AccountInfoString(ACCOUNT_CURRENCY);
   double bal    = AccountInfoDouble(ACCOUNT_BALANCE);
   double eq     = AccountInfoDouble(ACCOUNT_EQUITY);
   double prof   = AccountInfoDouble(ACCOUNT_PROFIT);
   double freeM  = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   long lev      = AccountInfoInteger(ACCOUNT_LEVERAGE);
   bool allowed  = (TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) != 0 && MQLInfoInteger(MQL_TRADE_ALLOWED) != 0);

   string availCryptos = "";
   int cryptoFound = 0;

   bool isOnline = (TerminalInfoInteger(TERMINAL_CONNECTED) != 0 && bal > 0.0);
   string json = "{";
   json += "\\"connected\\":" + (isOnline ? "true" : "false") + ",";
   json += "\\"timestamp\\":" + IntegerToString((long)TimeGMT() * 1000) + ",";
   json += "\\"serverTimestamp\\":" + IntegerToString((long)TimeCurrent() * 1000) + ",";
   json += "\\"login\\":" + IntegerToString(login) + ",";
   json += "\\"server\\":\\"" + JsonEscape(server) + "\\",";
   json += "\\"currency\\":\\"" + JsonEscape(curr) + "\\",";
   json += "\\"balance\\":" + DoubleToString(bal, 2) + ",";
   json += "\\"equity\\":" + DoubleToString(eq, 2) + ",";
   json += "\\"profit\\":" + DoubleToString(prof, 2) + ",";
   json += "\\"freeMargin\\":" + DoubleToString(freeM, 2) + ",";
   json += "\\"leverage\\":" + IntegerToString(lev) + ",";
   json += "\\"tradeAllowed\\":" + (allowed ? "true" : "false") + ",";
   json += "\\"cryptoSupported\\":false,";
   json += "\\"availableCryptos\\":[],";

   json += "\\"positions\\":[";
   int posCount = PositionsTotal();
   bool firstPos = true;
   for(int i = 0; i < posCount; i++) {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      string pSym   = PositionGetString(POSITION_SYMBOL);
      string pId    = PositionGetString(POSITION_COMMENT);
      long pType    = PositionGetInteger(POSITION_TYPE);
      string pSide  = (pType == POSITION_TYPE_BUY) ? "BUY" : "SELL";
      double pLots  = PositionGetDouble(POSITION_VOLUME);
      double pEntry = PositionGetDouble(POSITION_PRICE_OPEN);
      double pCurr  = PositionGetDouble(POSITION_PRICE_CURRENT);
      double pSl    = PositionGetDouble(POSITION_SL);
      double pTp    = PositionGetDouble(POSITION_TP);
      double pProf  = PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);
      long pMagic   = PositionGetInteger(POSITION_MAGIC);
      int digits    = (int)SymbolInfoInteger(pSym, SYMBOL_DIGITS);
      if(digits < 2 || digits > 8) digits = 5;

      if(!firstPos) json += ",";
      firstPos = false;
      json += "{";
      json += "\\"ticket\\":" + IntegerToString((long)ticket) + ",";
      json += "\\"id\\":\\"" + JsonEscape(pId) + "\\",";
      json += "\\"symbol\\":\\"" + JsonEscape(pSym) + "\\",";
      json += "\\"side\\":\\"" + pSide + "\\",";
      json += "\\"lots\\":" + DoubleToString(pLots, 2) + ",";
      json += "\\"entry\\":" + DoubleToString(pEntry, digits) + ",";
      json += "\\"current\\":" + DoubleToString(pCurr, digits) + ",";
      json += "\\"sl\\":" + DoubleToString(pSl, digits) + ",";
      json += "\\"tp\\":" + DoubleToString(pTp, digits) + ",";
      json += "\\"profit\\":" + DoubleToString(pProf, 2) + ",";
      json += "\\"magic\\":" + IntegerToString(pMagic);
      json += "}";
   }
   json += "],";

   string quoteSyms[] = { "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", "XAUUSD", "XAGUSD" };
   json += "\\"quotes\\":[";
   bool firstQ = true;
   for(int q = 0; q < ArraySize(quoteSyms); q++) {
      string qSym = quoteSyms[q];
      if(!SymbolSelect(qSym, true)) continue;
      double bid = SymbolInfoDouble(qSym, SYMBOL_BID);
      double ask = SymbolInfoDouble(qSym, SYMBOL_ASK);
      if(bid <= 0.0) continue;
      long tMode = SymbolInfoInteger(qSym, SYMBOL_TRADE_MODE);
      int qDigits = (int)SymbolInfoInteger(qSym, SYMBOL_DIGITS);
      if(qDigits < 2 || qDigits > 8) qDigits = 5;

      if(!firstQ) json += ",";
      firstQ = false;
      json += "{";
      json += "\\"symbol\\":\\"" + qSym + "\\",";
      json += "\\"brokerSymbol\\":\\"" + JsonEscape(qSym) + "\\",";
      json += "\\"bid\\":" + DoubleToString(bid, qDigits) + ",";
      json += "\\"ask\\":" + DoubleToString(ask, qDigits) + ",";
      json += "\\"tradeMode\\":" + IntegerToString(tMode) + ",";
      json += "\\"barsM5\\":[";
      MqlRates m5Rates[];
      ArraySetAsSeries(m5Rates, false);
      int copiedM5 = CopyRates(qSym, PERIOD_M5, 0, 60, m5Rates);
      for(int b = 0; b < copiedM5; b++) {
         if(b > 0) json += ",";
         json += "[" + IntegerToString((long)m5Rates[b].time * 1000) + "," + DoubleToString(m5Rates[b].open, qDigits) + "," + DoubleToString(m5Rates[b].high, qDigits) + "," + DoubleToString(m5Rates[b].low, qDigits) + "," + DoubleToString(m5Rates[b].close, qDigits) + "," + IntegerToString((long)m5Rates[b].tick_volume) + "]";
      }
      json += "]";
      json += "}";
   }
   json += "],";

   json += "\\"rejectedOrders\\":[";
   for(int r = 0; r < gRejCount; r++) {
      if(r > 0) json += ",";
      json += "{";
      json += "\\"id\\":\\"" + JsonEscape(gRejIds[r]) + "\\",";
      json += "\\"symbol\\":\\"" + JsonEscape(gRejSyms[r]) + "\\",";
      json += "\\"reason\\":\\"" + JsonEscape(gRejReasons[r]) + "\\"";
      json += "}";
   }
   json += "],";

   // Historique des deals clôturés MT5 (14 derniers jours, max 60) pour synchroniser 100% le Ledger
   json += "\\"closedDeals\\":[";
   datetime histFrom = TimeCurrent() - 14 * 86400;
   datetime histTo = TimeCurrent() + 3600;
   long tzOffsetSec = (long)TimeGMT() - (long)TimeCurrent();
   if(HistorySelect(histFrom, histTo)) {
      int totalDeals = HistoryDealsTotal();
      int emittedDeals = 0;
      for(int d = totalDeals - 1; d >= 0 && emittedDeals < 60; d--) {
         ulong dealTicket = HistoryDealGetTicket(d);
         if(dealTicket == 0) continue;
         long dEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         if(dEntry != DEAL_ENTRY_OUT && dEntry != DEAL_ENTRY_INOUT) continue;
         long dType = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
         if(dType != DEAL_TYPE_BUY && dType != DEAL_TYPE_SELL) continue;
         string dSym = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
         if(dSym == "") continue;
         long dPosId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
         double dLots = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
         double dExitPx = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
         double dNet = HistoryDealGetDouble(dealTicket, DEAL_PROFIT) + HistoryDealGetDouble(dealTicket, DEAL_SWAP) + HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
         long dTimeSec = (long)HistoryDealGetInteger(dealTicket, DEAL_TIME);
         string dCmt = HistoryDealGetString(dealTicket, DEAL_COMMENT);
         long dReasonCode = HistoryDealGetInteger(dealTicket, DEAL_REASON);
         string dReasonStr = "OTHER";
         if(dReasonCode == DEAL_REASON_SL) dReasonStr = "SL";
         else if(dReasonCode == DEAL_REASON_TP) dReasonStr = "TP";
         else if(dReasonCode == DEAL_REASON_EXPERT) dReasonStr = "EA";
         else if(dReasonCode == DEAL_REASON_CLIENT || dReasonCode == DEAL_REASON_MOBILE || dReasonCode == DEAL_REASON_WEB) dReasonStr = "MANUAL";
         double dEntryPx = dExitPx;
         for(int k = d - 1; k >= 0; k--) {
            ulong inTicket = HistoryDealGetTicket(k);
            if(inTicket == 0) continue;
            if(HistoryDealGetInteger(inTicket, DEAL_POSITION_ID) == dPosId &&
               HistoryDealGetInteger(inTicket, DEAL_ENTRY) == DEAL_ENTRY_IN) {
               double pxIn = HistoryDealGetDouble(inTicket, DEAL_PRICE);
               if(pxIn > 0.0) dEntryPx = pxIn;
               string inCmt = HistoryDealGetString(inTicket, DEAL_COMMENT);
               if(inCmt != "" && (dCmt == "" || StringFind(dCmt, "[") == 0)) dCmt = inCmt;
               break;
            }
         }
         string origSide = (dType == DEAL_TYPE_SELL) ? "BUY" : "SELL";
         int dDigits = (int)SymbolInfoInteger(dSym, SYMBOL_DIGITS);
         if(dDigits < 2 || dDigits > 8) dDigits = 5;
         if(emittedDeals > 0) json += ",";
         emittedDeals++;
         json += "{";
         json += "\\"deal\\":" + IntegerToString((long)dealTicket) + ",";
         json += "\\"positionId\\":" + IntegerToString(dPosId) + ",";
         json += "\\"id\\":\\"" + JsonEscape(dCmt) + "\\",";
         json += "\\"symbol\\":\\"" + JsonEscape(dSym) + "\\",";
         json += "\\"side\\":\\"" + origSide + "\\",";
         json += "\\"lots\\":" + DoubleToString(dLots, 2) + ",";
         json += "\\"entry\\":" + DoubleToString(dEntryPx, dDigits) + ",";
         json += "\\"exit\\":" + DoubleToString(dExitPx, dDigits) + ",";
         json += "\\"profit\\":" + DoubleToString(dNet, 2) + ",";
         json += "\\"dealReason\\":\\"" + dReasonStr + "\\",";
         json += "\\"closedAt\\":" + IntegerToString((dTimeSec + tzOffsetSec) * 1000);
         json += "}";
      }
   }
   json += "]";
   json += "}";

   int handle = FileOpen(InpStateFile, FILE_WRITE | FILE_TXT | FILE_SHARE_READ | FILE_ANSI);
   if(handle != INVALID_HANDLE) {
      FileWriteString(handle, json);
      FileClose(handle);
   }
}

int OnInit() {
   long lowId = ChartID() & 0x7FFFFFFF;
   if(lowId == 0) lowId = (long)GetTickCount();
   gMyMasterId = (double)lowId;
   gLastFailReset = TimeLocal();

   trade.SetExpertMagicNumber(InpMagic);
   EnsureMaster();
   EventSetTimer(MathMax(1, InpPollSeconds));
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
   EventKillTimer();
   if(GlobalVariableCheck("TF_MASTER_CHART") && GlobalVariableGet("TF_MASTER_CHART") == gMyMasterId) {
      GlobalVariableDel("TF_MASTER_CHART");
      GlobalVariableDel("TF_MASTER_TS");
   }
}

string ReadBodyFromBridge() {
   int handle = FileOpen(InpBridgeFile, FILE_READ | FILE_TXT | FILE_SHARE_READ | FILE_ANSI);
   if(handle != INVALID_HANDLE) {
      string content = "";
      while(!FileIsEnding(handle)) {
         content += FileReadString(handle);
      }
      FileClose(handle);
      if(StringLen(content) > 5) return content;
   }

   char post[];
   char result[];
   string headers;
   string url = InpServerUrl + "/api/mt5-bridge/poll";
   int res = WebRequest("GET", url, "", NULL, 2000, post, 0, result, headers);
   if(res == 200) {
      return CharArrayToString(result, 0, -1, CP_UTF8);
   }
   return "";
}

void OnTimer() {
   if(!EnsureMaster()) return;

   if(TimeLocal() - gLastFailReset >= 60) {
      gFailedIds = "|";
      gLastFailReset = TimeLocal();
   }

   WriteMt5StateToFile();
   if(TerminalInfoInteger(TERMINAL_CONNECTED) == 0 || AccountInfoDouble(ACCOUNT_BALANCE) <= 0.0) return;

   bool tradeAllowed = (TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) != 0 && MQLInfoInteger(MQL_TRADE_ALLOWED) != 0);
   if(!tradeAllowed) return;

   string body = ReadBodyFromBridge();
   if(StringFind(body, "\\"openOrders\\":[") < 0) return;

   string activeIds = "|";
   int cursor = 0;
   bool stateDirty = false;

   while(true) {
      int idPos = StringFind(body, "\\"id\\":\\"", cursor);
      if(idPos < 0) break;

      string id       = ExtractStr(body, "id", idPos);
      string symRaw   = ExtractStr(body, "symbol", idPos);
      string side     = ExtractStr(body, "side", idPos);
      double lots     = ExtractNum(body, "lots", idPos);
      double notional = ExtractNum(body, "notional", idPos);
      double entry    = ExtractNum(body, "entry", idPos);
      double sl       = ExtractNum(body, "sl", idPos);
      double tp       = ExtractNum(body, "tp", idPos);
      double riskUsd  = ExtractNum(body, "riskUsd", idPos);

      int objEnd = StringFind(body, "}", idPos);
      cursor = (objEnd > idPos) ? objEnd : (idPos + StringLen(id) + 15);
      if(id == "" || symRaw == "") continue;
      activeIds += id + "|";

      if(HasOpenPositionForId(id)) {
         MarkIdExecuted(id);
         if(SyncOpenPositionStops(id, sl, tp)) stateDirty = true;
         continue;
      }
      if(StringFind(id, "MT5-") == 0) continue;
      if(StringFind(gExecutedIds, "|" + id + "|") >= 0 || HasHistoricalDealForId(id)) {
         MarkIdExecuted(id);
         continue;
      }
      if(StringFind(gFailedIds, "|" + id + "|") >= 0) continue;

      string realSym = ResolveBrokerSymbol(symRaw);
      if(realSym == "") {
         RecordRejectedOrder(id, symRaw, "SYMBOL_NOT_FOUND:" + symRaw);
         gFailedIds += id + "|";
         stateDirty = true;
         continue;
      }
      if(SymbolInfoInteger(realSym, SYMBOL_TRADE_MODE) == SYMBOL_TRADE_MODE_DISABLED) {
         RecordRejectedOrder(id, realSym, "TRADE_DISABLED:" + realSym);
         gFailedIds += id + "|";
         stateDirty = true;
         continue;
      }

      trade.SetTypeFillingBySymbol(realSym);
      double ask = SymbolInfoDouble(realSym, SYMBOL_ASK);
      double bid = SymbolInfoDouble(realSym, SYMBOL_BID);
      int digits = (int)SymbolInfoInteger(realSym, SYMBOL_DIGITS);
      double point = SymbolInfoDouble(realSym, SYMBOL_POINT);
      double stopLevelPts = (double)SymbolInfoInteger(realSym, SYMBOL_TRADE_STOPS_LEVEL);
      double minDist = (stopLevelPts + 10.0) * point;

      double slDistRel = (entry > 0.0 && sl > 0.0) ? MathAbs(entry - sl) / entry : 0.0;
      double tpDistRel = (entry > 0.0 && tp > 0.0) ? MathAbs(tp - entry) / entry : 0.0;

      double slAbs = (entry > 0.0 && sl > 0.0) ? MathAbs(entry - sl) : 0.0;
      lots = ComputeRiskLots(realSym, riskUsd, slAbs, lots);

      if(side == "BUY" && ask > 0.0) {
         double normLots = ComputeBrokerSafeLots(realSym, lots, notional, ORDER_TYPE_BUY, ask);
         double slPx = (slDistRel > 0.0) ? NormalizeDouble(ask - MathMax(minDist, ask * slDistRel), digits) : 0.0;
         double tpPx = (tpDistRel > 0.0) ? NormalizeDouble(ask + MathMax(minDist, ask * tpDistRel), digits) : 0.0;
         if(trade.Buy(normLots, realSym, ask, slPx, tpPx, id)) {
            MarkIdExecuted(id);
            stateDirty = true;
         } else {
            uint ret = trade.ResultRetcode();
            if(ret == TRADE_RETCODE_INVALID_STOPS || ret == 10016) {
               if(trade.Buy(normLots, realSym, ask, 0.0, 0.0, id)) {
                  MarkIdExecuted(id);
                  ModifyPositionByComment(id, realSym, slPx, tpPx);
                  stateDirty = true;
               } else {
                  RecordRejectedOrder(id, realSym, "RETCODE_" + IntegerToString(trade.ResultRetcode()) + ":" + trade.ResultRetcodeDescription());
                  gFailedIds += id + "|";
                  stateDirty = true;
               }
            } else {
               RecordRejectedOrder(id, realSym, "RETCODE_" + IntegerToString(ret) + ":" + trade.ResultRetcodeDescription());
               if(ret != TRADE_RETCODE_CLIENT_DISABLES_AT && ret != TRADE_RETCODE_SERVER_DISABLES_AT && ret != TRADE_RETCODE_CONNECTION) {
                  gFailedIds += id + "|";
               }
               stateDirty = true;
            }
         }
      } else if(side == "SELL" && bid > 0.0) {
         double normLots = ComputeBrokerSafeLots(realSym, lots, notional, ORDER_TYPE_SELL, bid);
         double slPx = (slDistRel > 0.0) ? NormalizeDouble(bid + MathMax(minDist, bid * slDistRel), digits) : 0.0;
         double tpPx = (tpDistRel > 0.0) ? NormalizeDouble(bid - MathMax(minDist, bid * tpDistRel), digits) : 0.0;
         if(trade.Sell(normLots, realSym, bid, slPx, tpPx, id)) {
            MarkIdExecuted(id);
            stateDirty = true;
         } else {
            uint ret = trade.ResultRetcode();
            if(ret == TRADE_RETCODE_INVALID_STOPS || ret == 10016) {
               if(trade.Sell(normLots, realSym, bid, 0.0, 0.0, id)) {
                  MarkIdExecuted(id);
                  ModifyPositionByComment(id, realSym, slPx, tpPx);
                  stateDirty = true;
               } else {
                  RecordRejectedOrder(id, realSym, "RETCODE_" + IntegerToString(trade.ResultRetcode()) + ":" + trade.ResultRetcodeDescription());
                  gFailedIds += id + "|";
                  stateDirty = true;
               }
            } else {
               RecordRejectedOrder(id, realSym, "RETCODE_" + IntegerToString(ret) + ":" + trade.ResultRetcodeDescription());
               if(ret != TRADE_RETCODE_CLIENT_DISABLES_AT && ret != TRADE_RETCODE_SERVER_DISABLES_AT && ret != TRADE_RETCODE_CONNECTION) {
                  gFailedIds += id + "|";
               }
               stateDirty = true;
            }
         }
      }
   }

   // Extraction des tickets à clôturer explicitement (closeOrders)
   string closeIds = "|";
   int closeCursor = StringFind(body, "\\"closeOrders\\":[");
   if(closeCursor >= 0) {
      while(true) {
         int tPos = StringFind(body, "\\"ticket\\":", closeCursor);
         if(tPos < 0) break;
         double ticketNum = ExtractNum(body, "ticket", tPos);
         if(ticketNum > 0.0) {
            closeIds += IntegerToString((long)ticketNum) + "|";
         }
         int oEnd = StringFind(body, "}", tPos);
         closeCursor = (oEnd > tPos) ? oEnd : (tPos + 20);
      }
   }

   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0) {
         string ticketStr = IntegerToString((long)ticket);
         string cmt = PositionGetString(POSITION_COMMENT);
         long pMagic = PositionGetInteger(POSITION_MAGIC);
         bool shouldClose = false;
         if(StringFind(closeIds, "|" + ticketStr + "|") >= 0) shouldClose = true;
         if(pMagic == InpMagic && StringLen(cmt) > 0 && StringFind(activeIds, "|" + cmt + "|") < 0) shouldClose = true;
         if(shouldClose) {
            if(trade.PositionClose(ticket)) {
               stateDirty = true;
            }
         }
      }
   }

   if(stateDirty) {
      WriteMt5StateToFile();
   }
}
`;
  }
}
