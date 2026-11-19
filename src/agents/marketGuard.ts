import { usdPerPriceUnitPerLot } from "../lotSizing.ts";

export type MarketSessionStatus =
  | "OPEN"
  | "PRE_ROLLOVER_WARN"
  | "ROLLOVER_BLACKOUT"
  | "WEEKEND_CLOSED";

export type MarketSessionCheck = {
  tradable: boolean;
  status: MarketSessionStatus;
  reason?: string;
  minutesToClose?: number;
};

export type SpreadGuardResult = {
  ok: boolean;
  spread: number;
  spreadToSlPct?: number;
  spreadToAtrPct?: number;
  reason?: string;
};

function isMetalSymbol(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return s.startsWith("XAU") || s.startsWith("XAG") || s.startsWith("GOLD") || s.startsWith("SILVER");
}

function isForexSymbol(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return /^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY){2}$/.test(s);
}

/**
 * Bouclier Horaires & Rollover (UTC) :
 * - Week-end : Vendredi 21:15 UTC -> Dimanche 22:20 UTC
 * - Métaux (XAU/XAG) : Rollover quotidien 21:40 UTC -> 23:10 UTC (22:40-00:10 Paris hiver)
 * - Forex : Rollover quotidien 21:45 UTC -> 22:20 UTC
 * - Autres actifs CFD : Rollover 21:45 UTC -> 22:15 UTC
 */
export function evaluateMarketSession(symbol: string, nowMs = Date.now()): MarketSessionCheck {
  const d = new Date(nowMs);
  const day = d.getUTCDay(); // 0=Sun .. 6=Sat
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();

  // 1. Week-end : Vendredi >= 21:15 UTC, Samedi entier, Dimanche < 22:20 UTC
  if (day === 6) {
    return {
      tradable: false,
      status: "WEEKEND_CLOSED",
      reason: "Marché fermé (week-end — Samedi).",
    };
  }
  if (day === 5 && mins >= 21 * 60 + 15) {
    return {
      tradable: false,
      status: "WEEKEND_CLOSED",
      reason: "Clôture week-end (Vendredi >= 21:15 UTC) — nouvelles entrées bloquées.",
    };
  }
  if (day === 0 && mins < 22 * 60 + 20) {
    return {
      tradable: false,
      status: "WEEKEND_CLOSED",
      reason: "Marché fermé (week-end — réouverture Dimanche 22:20 UTC).",
    };
  }

  // 2. Rollover quotidien Métaux (XAUUSD / XAGUSD) : 21:40 -> 23:10 UTC
  if (isMetalSymbol(symbol)) {
    const startBlackout = 21 * 60 + 40;
    const endBlackout = 23 * 60 + 10;
    if (mins >= startBlackout && mins < endBlackout) {
      return {
        tradable: false,
        status: "ROLLOVER_BLACKOUT",
        reason: `Rollover / fermeture quotidienne Métaux (${symbol}) : 21:40–23:10 UTC.`,
      };
    }
    if (mins >= startBlackout - 10 && mins < startBlackout) {
      return {
        tradable: true,
        status: "PRE_ROLLOVER_WARN",
        minutesToClose: startBlackout - mins,
        reason: `Pré-rollover Métaux dans ${startBlackout - mins} min.`,
      };
    }
    return { tradable: true, status: "OPEN" };
  }

  // 3. Rollover quotidien Forex : 21:45 -> 22:20 UTC
  if (isForexSymbol(symbol)) {
    const startBlackout = 21 * 60 + 45;
    const endBlackout = 22 * 60 + 20;
    if (mins >= startBlackout && mins < endBlackout) {
      return {
        tradable: false,
        status: "ROLLOVER_BLACKOUT",
        reason: `Rollover quotidien Forex (${symbol}) : 21:45–22:20 UTC (spread élargi).`,
      };
    }
    if (mins >= startBlackout - 10 && mins < startBlackout) {
      return {
        tradable: true,
        status: "PRE_ROLLOVER_WARN",
        minutesToClose: startBlackout - mins,
        reason: `Pré-rollover Forex dans ${startBlackout - mins} min.`,
      };
    }
    return { tradable: true, status: "OPEN" };
  }

  // 4. Autres CFDs / Indices : 21:45 -> 22:15 UTC
  const startOther = 21 * 60 + 45;
  const endOther = 22 * 60 + 15;
  if (mins >= startOther && mins < endOther) {
    return {
      tradable: false,
      status: "ROLLOVER_BLACKOUT",
      reason: `Rollover quotidien (${symbol}) : 21:45–22:15 UTC.`,
    };
  }
  return { tradable: true, status: "OPEN" };
}

/**
 * Indique si un scalp ouvert doit être sécurisé/clôturé avant le rollover
 * pour ne pas subir le vide de liquidité de minuit ou du week-end.
 */
export function isPreRolloverScalpExitWindow(symbol: string, nowMs = Date.now()): boolean {
  const d = new Date(nowMs);
  const day = d.getUTCDay();
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (day === 5 && mins >= 21 * 60 + 5 && mins < 21 * 60 + 30) return true;
  if (isMetalSymbol(symbol)) {
    return mins >= 21 * 60 + 35 && mins < 22 * 60;
  }
  return mins >= 21 * 60 + 42 && mins < 22 * 60;
}

/**
 * Filtre Spread-Guard : rejette toute entrée si le spread Bid/Ask dépasse
 * 18% de la distance au Stop-Loss ou 35% de l'ATR 5m.
 */
export function evaluateSpreadGuard(input: {
  symbol: string;
  bid?: number;
  ask?: number;
  slDist: number;
  atr5m?: number;
  maxSpreadToSlRatio?: number;
  maxSpreadToAtrRatio?: number;
}): SpreadGuardResult {
  const bid = Number(input.bid ?? 0);
  const ask = Number(input.ask ?? 0);
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0 || ask < bid) {
    return { ok: true, spread: 0 };
  }
  const spread = ask - bid;
  const maxSlRatio = input.maxSpreadToSlRatio ?? 0.18;
  const maxAtrRatio = input.maxSpreadToAtrRatio ?? 0.35;

  const spreadToSlPct = input.slDist > 0 ? spread / input.slDist : undefined;
  const spreadToAtrPct = input.atr5m && input.atr5m > 0 ? spread / input.atr5m : undefined;

  if (spreadToSlPct !== undefined && spreadToSlPct > maxSlRatio) {
    return {
      ok: false,
      spread,
      spreadToSlPct: Number((spreadToSlPct * 100).toFixed(1)),
      spreadToAtrPct: spreadToAtrPct !== undefined ? Number((spreadToAtrPct * 100).toFixed(1)) : undefined,
      reason: `SPREAD_GUARD (${input.symbol}) : spread ${spread.toPrecision(4)} = ${(spreadToSlPct * 100).toFixed(1)}% du SL (> ${(maxSlRatio * 100).toFixed(0)}%).`,
    };
  }
  if (spreadToAtrPct !== undefined && spreadToAtrPct > maxAtrRatio) {
    return {
      ok: false,
      spread,
      spreadToSlPct: spreadToSlPct !== undefined ? Number((spreadToSlPct * 100).toFixed(1)) : undefined,
      spreadToAtrPct: Number((spreadToAtrPct * 100).toFixed(1)),
      reason: `SPREAD_GUARD (${input.symbol}) : spread ${spread.toPrecision(4)} = ${(spreadToAtrPct * 100).toFixed(1)}% de l'ATR 5m (> ${(maxAtrRatio * 100).toFixed(0)}%).`,
    };
  }

  return {
    ok: true,
    spread,
    spreadToSlPct: spreadToSlPct !== undefined ? Number((spreadToSlPct * 100).toFixed(1)) : undefined,
    spreadToAtrPct: spreadToAtrPct !== undefined ? Number((spreadToAtrPct * 100).toFixed(1)) : undefined,
  };
}

/**
 * Détecteur de cotations figées (Stale Quote Guard) :
 * si bid et ask n'ont pas bougé depuis > maxStaleMs (défaut 45s) pendant une session ouverte,
 * le flux courtier est considéré comme figé ou le marché comme fermé.
 */
export class StaleQuoteTracker {
  private lastQuotes = new Map<string, { bid: number; ask: number; changedAt: number }>();

  observe(symbol: string, bid?: number, ask?: number, nowMs = Date.now()): void {
    const b = Number(bid ?? 0);
    const a = Number(ask ?? 0);
    if (!Number.isFinite(b) || !Number.isFinite(a) || b <= 0 || a <= 0) return;
    const key = symbol.toUpperCase();
    const prev = this.lastQuotes.get(key);
    if (!prev || Math.abs(prev.bid - b) > 1e-9 || Math.abs(prev.ask - a) > 1e-9) {
      this.lastQuotes.set(key, { bid: b, ask: a, changedAt: nowMs });
    }
  }

  check(symbol: string, nowMs = Date.now(), maxStaleMs = 45_000): { stale: boolean; staleSec: number } {
    const entry = this.lastQuotes.get(symbol.toUpperCase());
    if (!entry) return { stale: false, staleSec: 0 };
    const elapsed = Math.max(0, nowMs - entry.changedAt);
    return {
      stale: elapsed > maxStaleMs,
      staleSec: Math.round(elapsed / 1000),
    };
  }
}

/**
 * Garde-fou Marge & Micro-Compte (ex: compte 40€ - 500€) :
 * Vérifie avant ouverture que le lot minimum courtier (0.01) ne consomme pas > 45%
 * de la marge libre et ne risque pas > 8% du capital sur un seul trade.
 * Ex: sur 39.88€ (1:100), EURUSD/AUDUSD/USDJPY (~6-10€ de marge) passent,
 * mais XAUUSD (~37€ de marge = 93% du compte) est automatiquement bloqué.
 */
export function evaluateMicroAccountMarginGuard(input: {
  symbol: string;
  entry: number;
  stopLoss: number;
  equity: number;
  freeMargin: number;
  accountLeverage: number;
  minLot?: number;
}): { ok: boolean; estMinMargin: number; estMinRisk: number; reason?: string } {
  const sym = input.symbol.toUpperCase();
  const minLot = input.minLot ?? 0.01;
  const lev = Math.max(1, input.accountLeverage || 100);
  const equity = Math.max(1, input.equity);
  const freeMargin = Math.max(0, input.freeMargin);

  const isFx = /^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY){2}$/.test(sym);
  let contractSize = 1;
  let notionalOneLot = input.entry;
  if (isFx) {
    contractSize = 100_000;
    const baseUsdApprox: Record<string, number> = {
      USD: 1,
      EUR: 1.10,
      GBP: 1.31,
      AUD: 0.67,
      NZD: 0.56,
      CAD: 0.70,
      CHF: 1.18,
      JPY: 0.0065,
    };
    const base = sym.slice(0, 3);
    notionalOneLot = 100_000 * (baseUsdApprox[base] ?? 1);
  } else if (/^(XAU|GOLD)/.test(sym)) {
    contractSize = 100;
    notionalOneLot = 100 * input.entry;
  } else if (/^(XAG|SILVER)/.test(sym)) {
    contractSize = 5_000;
    notionalOneLot = 5_000 * input.entry;
  } else if (/(USOIL|WTI|UKOIL|XTI|XBR)/.test(sym)) {
    contractSize = 100;
    notionalOneLot = 100 * input.entry;
  } else if (/(NGAS|XNG|NATGAS)/.test(sym)) {
    contractSize = 10_000;
    notionalOneLot = 10_000 * input.entry;
  }

  const minNotional = notionalOneLot * minLot;
  const estMinMargin = Number((minNotional / lev).toFixed(2));
  const slDist = Math.abs(input.entry - input.stopLoss);
  const usdPerUnitPerLot = isFx ? usdPerPriceUnitPerLot(sym, input.entry) : contractSize;
  const estMinRisk = Number((slDist * usdPerUnitPerLot * minLot).toFixed(2));

  if (freeMargin > 0 && estMinMargin > freeMargin * 0.45) {
    return {
      ok: false,
      estMinMargin,
      estMinRisk,
      reason: `MICRO-COMPTE MARGE (${sym}) : 0.01 lot exige ~${estMinMargin.toFixed(2)} de marge (> 45% de la marge libre ${freeMargin.toFixed(2)}). Actif ignoré pour protéger le compte.`,
    };
  }
  const isFxPair = /^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY){2}$/.test(sym);
  // Sur micro-compte (<500€), les paires Forex abordables en marge auront leur SL automatiquement calibré
  // à <= 7% du capital au moment du ticket ; on ne bloque en amont que les actifs dont le risque minimal explose (> 18% FX / > 8% métaux).
  const maxPreRiskRatio = isFxPair ? 0.18 : 0.08;
  if (equity < 500 && estMinRisk > equity * maxPreRiskRatio) {
    return {
      ok: false,
      estMinMargin,
      estMinRisk,
      reason: `MICRO-COMPTE RISQUE (${sym}) : le SL au lot minimum 0.01 risque ~${estMinRisk.toFixed(2)} (> ${Math.round(maxPreRiskRatio * 100)}% du capital ${equity.toFixed(2)}). Actif ignoré.`,
    };
  }
  return { ok: true, estMinMargin, estMinRisk };
}
