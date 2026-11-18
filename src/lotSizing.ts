/**
 * Risk-based lot sizing (Risk Manager -> Execution Trader -> MT5 bridge).
 *
 *   RiskAmount = AccountEquity * RiskPercent
 *   LotSize    = RiskAmount / (StopLossDistanceInPoints * TickValuePerPoint)
 *
 * The result is normalised on VolumeStep / VolumeMin / VolumeMax (broker spec when
 * known, sane defaults otherwise) and capped by MAX_LOT_CAP from .env.
 * The MQL5 EA recomputes the same formula with the REAL broker tick value
 * (SYMBOL_TRADE_TICK_VALUE / SYMBOL_TRADE_TICK_SIZE) before sending the order.
 */

export type VolumeSpec = { volumeMin: number; volumeMax: number; volumeStep: number };

export type LotSizingInput = {
  symbol: string;
  equity: number;
  entry: number;
  stopLoss: number;
  riskPercent?: number;
  /** Optional live mark prices used to convert quote currency -> USD for crosses. */
  marks?: Record<string, number>;
  spec?: Partial<VolumeSpec>;
  maxLotCap?: number;
};

export type LotSizingResult = {
  ok: boolean;
  symbol: string;
  equity: number;
  riskPercent: number;
  riskAmount: number;
  slDistance: number;
  slPoints: number;
  point: number;
  tickValuePerPoint: number;
  contractSize: number;
  calculatedLot: number;
  finalLot: number;
  /** Effective $ risk at the final (normalised) lot. */
  effectiveRisk: number;
  notionalUsd: number;
  qty: number;
  capApplied: "none" | "volume_max" | "max_lot_cap" | "volume_min";
  reason?: string;
};

function envNum(name: string, fallback: number, min: number, max: number): number {
  const raw = (process.env[name] ?? "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

/** Default risk per trade (0.5% - 1%). RISK_PERCENT accepts 0.0075 or 0.75 (=%). */
export function defaultRiskPercent(): number {
  const raw = envNum("RISK_PERCENT", 0.0075, 0.0001, 5);
  const frac = raw > 0.05 ? raw / 100 : raw;
  return Math.min(0.03, Math.max(0.001, frac));
}

export function maxLotCapFromEnv(): number {
  return envNum("MAX_LOT_CAP", 10, 0.01, 1000);
}

export function riskSizingEnabled(): boolean {
  return (process.env.RISK_BASED_SIZING ?? "true").trim().toLowerCase() !== "false";
}

const FX = /^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY)(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY)$/;

export function contractSpec(symbol: string): { contractSize: number; point: number; kind: string } {
  const s = symbol.toUpperCase();
  if (FX.test(s)) return { contractSize: 100_000, point: s.includes("JPY") ? 0.001 : 0.00001, kind: "fx" };
  if (/^(XAU|GOLD)/.test(s)) return { contractSize: 100, point: 0.01, kind: "metal" };
  if (/^(XAG|SILVER)/.test(s)) return { contractSize: 5_000, point: 0.001, kind: "metal" };
  if (/(USOIL|WTI|UKOIL|XTI|XBR)/.test(s)) return { contractSize: 100, point: 0.01, kind: "oil" };
  if (/(NGAS|XNG|NATGAS)/.test(s)) return { contractSize: 10_000, point: 0.001, kind: "gas" };
  if (/(USDT$|^BTC|^ETH|^SOL|^XRP)/.test(s)) return { contractSize: 1, point: 0.01, kind: "crypto" };
  if (/(US30|US500|USTEC|NAS|DE40|GER|SPX|NQ1|ES1|YM1|FDAX)/.test(s)) return { contractSize: 1, point: 0.1, kind: "index" };
  return { contractSize: 1, point: 0.01, kind: "other" };
}

/** USD value of ONE price unit move for ONE lot (USD account). */
export function usdPerPriceUnitPerLot(symbol: string, entry: number, marks: Record<string, number> = {}): number {
  const s = symbol.toUpperCase();
  const { contractSize, kind } = contractSpec(s);
  if (kind !== "fx") return contractSize; // quoted in USD
  const quote = s.slice(3, 6);
  if (quote === "USD") return contractSize;
  if (s.startsWith("USD")) return contractSize / Math.max(entry, 1e-9);
  // Cross: convert quote ccy -> USD using a live mark when available.
  const direct = marks[`${quote}USD`];
  if (direct && direct > 0) return contractSize * direct;
  const inverse = marks[`USD${quote}`];
  if (inverse && inverse > 0) return contractSize / inverse;
  const approx: Record<string, number> = { EUR: 1.08, GBP: 1.27, AUD: 0.66, NZD: 0.6, CAD: 0.73, CHF: 1.13, JPY: 0.0067 };
  return contractSize * (approx[quote] ?? 1);
}

function baseToUsd(symbol: string, entry: number, marks: Record<string, number>): number {
  const s = symbol.toUpperCase();
  const { kind } = contractSpec(s);
  if (kind !== "fx") return entry;
  const base = s.slice(0, 3);
  if (base === "USD") return 1;
  if (s.endsWith("USD")) return entry;
  const direct = marks[`${base}USD`];
  return direct && direct > 0 ? direct : entry;
}

export function normalizeVolume(raw: number, spec: Partial<VolumeSpec> = {}): number {
  const vmin = spec.volumeMin && spec.volumeMin > 0 ? spec.volumeMin : 0.01;
  const vmax = spec.volumeMax && spec.volumeMax > 0 ? spec.volumeMax : 100;
  const step = spec.volumeStep && spec.volumeStep > 0 ? spec.volumeStep : 0.01;
  const clamped = Math.max(vmin, Math.min(vmax, raw));
  const stepped = Math.floor(clamped / step + 1e-6) * step;
  const decimals = Math.max(0, Math.min(4, Math.round(-Math.log10(step))));
  return Number(Math.max(vmin, stepped).toFixed(decimals));
}

export function computeRiskBasedLots(input: LotSizingInput): LotSizingResult {
  const symbol = input.symbol.toUpperCase();
  const riskPercent = input.riskPercent && input.riskPercent > 0 ? Math.min(0.03, input.riskPercent) : defaultRiskPercent();
  const equity = Math.max(0, input.equity);
  const riskAmount = equity * riskPercent;
  const slDistance = Math.abs(input.entry - input.stopLoss);
  const { contractSize, point } = contractSpec(symbol);
  const marks = input.marks ?? {};
  const perUnit = usdPerPriceUnitPerLot(symbol, input.entry, marks);
  const tickValuePerPoint = perUnit * point;
  const slPoints = slDistance / point;
  const cap = input.maxLotCap ?? maxLotCapFromEnv();
  const spec = input.spec ?? {};

  const base: LotSizingResult = {
    ok: false, symbol, equity, riskPercent, riskAmount, slDistance, slPoints, point, tickValuePerPoint,
    contractSize, calculatedLot: 0, finalLot: 0, effectiveRisk: 0, notionalUsd: 0, qty: 0, capApplied: "none",
  };
  if (!(equity > 0) || !(input.entry > 0) || !(slPoints > 0) || !(tickValuePerPoint > 0)) {
    return { ...base, reason: "Equity, entrée ou distance SL invalide" };
  }

  const calculatedLot = riskAmount / (slPoints * tickValuePerPoint);
  let capped = calculatedLot;
  let capApplied: LotSizingResult["capApplied"] = "none";
  if (capped > cap) { capped = cap; capApplied = "max_lot_cap"; }
  if (spec.volumeMax && capped > spec.volumeMax) { capped = spec.volumeMax; capApplied = "volume_max"; }
  const vmin = spec.volumeMin && spec.volumeMin > 0 ? spec.volumeMin : 0.01;
  if (capped < vmin) capApplied = "volume_min";
  const finalLot = normalizeVolume(capped, spec);
  const qty = finalLot * contractSize;
  return {
    ...base,
    ok: true,
    calculatedLot: Number(calculatedLot.toFixed(4)),
    finalLot,
    effectiveRisk: Number((finalLot * slPoints * tickValuePerPoint).toFixed(2)),
    qty,
    notionalUsd: Number((qty * baseToUsd(symbol, input.entry, marks)).toFixed(2)),
    capApplied,
  };
}

export function formatLotLog(r: LotSizingResult, ctx = ""): string {
  return `[LotSizing]${ctx ? ` ${ctx}` : ""} ${r.symbol} | Equity=${r.equity.toFixed(2)}$ | Risk=${(r.riskPercent * 100).toFixed(2)}% | RiskAmount=${r.riskAmount.toFixed(2)}$ | SL Distance=${r.slDistance.toPrecision(6)} (${r.slPoints.toFixed(1)} pts) | TickValue/pt=${r.tickValuePerPoint.toFixed(4)}$ | Calculated Lot=${r.calculatedLot} | Final Lot=${r.finalLot}${r.capApplied !== "none" ? ` (cap: ${r.capApplied})` : ""} | Risque effectif=${r.effectiveRisk.toFixed(2)}$${r.reason ? ` | ${r.reason}` : ""}`;
}
