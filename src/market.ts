import { SmcEngine } from "./agents/smcEngine.ts";
import { errMsg, getJson } from "./http.ts";
import { Mt5CloudBridge } from "./mt5.ts";
import type {
  FvgZone,
  Headline,
  Kline,
  MacroWebhookPayload,
  MarketSnapshot,
  MicrostructureContext,
  VenueSnap,
  VwapContext,
} from "./types.ts";

const SYMBOL_NAMES: Record<string, string> = {
  BTCUSDT: "Bitcoin Perp (BINANCE:BTCUSDT.P)",
  ETHUSDT: "Ether Perp (BINANCE:ETHUSDT.P)",
  SOLUSDT: "Solana Perp (BINANCE:SOLUSDT.P)",
  BNBUSDT: "BNB Perp (BINANCE:BNBUSDT.P)",
  XRPUSDT: "XRP Perp (BINANCE:XRPUSDT.P)",
};

export function symbolName(symbol: string): string {
  return SYMBOL_NAMES[symbol] ?? `${symbol} Perp`;
}

// Fenêtre glissante de 60 échantillons OFI par actif pour Z_OFI
const ofiWindowBySymbol = new Map<string, number[]>();
const prevL2BySymbol = new Map<string, { bidPx: number; bidQty: number; askPx: number; askQty: number }>();

function inferTickSize(price: number): number {
  if (price >= 10000) return 0.1;
  if (price >= 1000) return 0.01;
  if (price >= 10) return 0.001;
  return 0.0001;
}

function computeTop5Ofi(
  symbol: string,
  bids: [number, number][],
  asks: [number, number][],
): { ofi: number; zOfi: number; spreadTicks: number; windowSamples: number } {
  const topBids = bids.slice(0, 5);
  const topAsks = asks.slice(0, 5);
  const bestBid = topBids[0]?.[0] ?? 0;
  const bestBidQty = topBids[0]?.[1] ?? 0;
  const bestAsk = topAsks[0]?.[0] ?? bestBid;
  const bestAskQty = topAsks[0]?.[1] ?? 0;

  const tickSize = inferTickSize(bestBid || 1);
  const spreadTicks = bestAsk > bestBid ? (bestAsk - bestBid) / tickSize : 0;

  // Pondération dégressive sur les 5 premiers niveaux L2
  const weights = [1.0, 0.7, 0.5, 0.35, 0.25];
  let bidWeighted = 0;
  let askWeighted = 0;
  for (let i = 0; i < 5; i++) {
    const w = weights[i];
    if (topBids[i]) bidWeighted += w * topBids[i][0] * topBids[i][1];
    if (topAsks[i]) askWeighted += w * topAsks[i][0] * topAsks[i][1];
  }
  const l2Imbalance = bidWeighted + askWeighted > 0 ? (bidWeighted - askWeighted) / (bidWeighted + askWeighted) : 0;

  // Delta multi-tick OFI (Cont, Kukanov & Stoikov)
  const prev = prevL2BySymbol.get(symbol);
  let deltaOfi = 0;
  if (prev && bestBid > 0 && bestAsk > 0) {
    const dBid = bestBid > prev.bidPx ? bestBidQty : bestBid === prev.bidPx ? bestBidQty - prev.bidQty : -prev.bidQty;
    const dAsk = bestAsk < prev.askPx ? bestAskQty : bestAsk === prev.askPx ? bestAskQty - prev.askQty : -prev.askQty;
    const norm = Math.max(bestBidQty + bestAskQty, 1e-9);
    deltaOfi = (dBid - dAsk) / norm;
  }
  if (bestBid > 0 && bestAsk > 0) {
    prevL2BySymbol.set(symbol, { bidPx: bestBid, bidQty: bestBidQty, askPx: bestAsk, askQty: bestAskQty });
  }

  const ofi = l2Imbalance * 0.65 + Math.max(-1, Math.min(1, deltaOfi)) * 0.35;

  const win = ofiWindowBySymbol.get(symbol) ?? [];
  win.push(ofi);
  if (win.length > 60) win.shift();
  ofiWindowBySymbol.set(symbol, win);

  let zOfi = 0;
  if (win.length >= 4) {
    const mean = win.reduce((a, b) => a + b, 0) / win.length;
    const variance = win.reduce((a, b) => a + (b - mean) ** 2, 0) / win.length;
    const std = Math.sqrt(variance);
    zOfi = std > 1e-6 ? (ofi - mean) / std : ofi * 4.0;
  } else {
    // Sur les tout premiers échantillons, amplification calibrée de l'imbalance top 5
    zOfi = ofi * 3.8;
  }

  return { ofi, zOfi, spreadTicks, windowSamples: win.length };
}

export function computeRsi14(bars: Kline[]): number {
  if (bars.length < 15) return 50;
  const slice = bars.slice(-15);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i].close - slice[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  if (avgLoss <= 1e-12) return avgGain > 0 ? 100 : 50;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calcul VWAP Ancré à l'ouverture de session (08:00 UTC Londres ou 13:30 UTC New York)
 * avec bandes ±1.0 SD, ±2.0 SD, ±2.5 SD et Initial Balance (30 premières minutes).
 */
export function computeSessionVwap(bars15m: Kline[], now: number): VwapContext | undefined {
  if (bars15m.length < 16) return undefined;
  const d = new Date(now);
  const utcMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
  const isNy = utcMinutes >= 13 * 60 + 30;
  const isLondon = !isNy && utcMinutes >= 8 * 60;
  const sessionName: VwapContext["sessionName"] = isNy ? "NewYork" : isLondon ? "London" : "Asia";

  const anchorDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), isNy ? 13 : isLondon ? 8 : 0, isNy ? 30 : 0, 0));
  let anchorMs = anchorDate.getTime();
  if (anchorMs > now) anchorMs -= 86400_000;

  let sessionBars = bars15m.filter((b) => b.openTime >= anchorMs);
  if (sessionBars.length < 3) {
    sessionBars = bars15m.slice(-16);
  }

  let cumPV = 0;
  let cumV = 0;
  let cumP2V = 0;
  for (const b of sessionBars) {
    const tp = (b.high + b.low + b.close) / 3;
    const v = Math.max(b.volume, 1e-6);
    cumPV += tp * v;
    cumV += v;
    cumP2V += tp * tp * v;
  }

  const vwap = cumV > 0 ? cumPV / cumV : sessionBars[sessionBars.length - 1].close;
  const variance = cumV > 0 ? Math.max(0, cumP2V / cumV - vwap * vwap) : 0;
  const sd = Math.max(Math.sqrt(variance), vwap * 0.002);

  // Initial Balance = 2 premières bougies 15m (30 minutes)
  const ibBars = sessionBars.slice(0, 2);
  const ibHigh = Math.max(...ibBars.map((b) => b.high));
  const ibLow = Math.min(...ibBars.map((b) => b.low));

  const last14 = bars15m.slice(-15, -1);
  const atr15m = last14.length
    ? last14.reduce((s, b) => s + (b.high - b.low), 0) / last14.length
    : vwap * 0.005;

  const rsi14 = computeRsi14(bars15m);
  const prevBar = bars15m[bars15m.length - 2];
  const curBar = bars15m[bars15m.length - 1];
  const sd2Upper = vwap + 2.0 * sd;
  const sd2Lower = vwap - 2.0 * sd;

  const sweptHighReclaim =
    prevBar != null &&
    curBar != null &&
    prevBar.high > ibHigh &&
    prevBar.high >= sd2Upper &&
    curBar.close < sd2Upper;

  const sweptLowReclaim =
    prevBar != null &&
    curBar != null &&
    prevBar.low < ibLow &&
    prevBar.low <= sd2Lower &&
    curBar.close > sd2Lower;

  return {
    sessionName,
    vwap,
    sd1Upper: vwap + sd,
    sd1Lower: vwap - sd,
    sd2Upper,
    sd2Lower,
    sd25Upper: vwap + 2.5 * sd,
    sd25Lower: vwap - 2.5 * sd,
    ibHigh,
    ibLow,
    rsi14,
    atr15m,
    sweptHighReclaim,
    sweptLowReclaim,
  };
}

/**
 * Détection algorithmique des Fair Value Gaps (FVG) sur 3 bougies 4h + BOS 20 barres.
 */
export function detectLatestFvg(bars4h: Kline[], minSizeAtr = 0.5): FvgZone | null {
  if (bars4h.length < 25) return null;
  const last14 = bars4h.slice(-15, -1);
  const atr = last14.reduce((s, b) => s + (b.high - b.low), 0) / Math.max(1, last14.length);
  if (atr <= 0) return null;

  const lookEnd = bars4h.length - 1;
  const lookStart = Math.max(22, lookEnd - 12);

  for (let i = lookEnd - 1; i >= lookStart; i--) {
    const cPrev2 = bars4h[i - 2];
    const cCur = bars4h[i];
    const bosWindow = bars4h.slice(i - 20, i);
    const bosHi = Math.max(...bosWindow.map((b) => b.high));
    const bosLo = Math.min(...bosWindow.map((b) => b.low));

    // FVG Haussier
    if (cPrev2.high < cCur.low) {
      const gap = cCur.low - cPrev2.high;
      const ratio = gap / atr;
      if (ratio >= minSizeAtr) {
        return {
          direction: "long",
          top: cCur.low,
          bottom: cPrev2.high,
          midPrice: (cCur.low + cPrev2.high) * 0.5,
          sizeAtrRatio: ratio,
          stopLevel: cPrev2.low * 0.9995,
          bosConfirmed: cCur.close > bosHi,
          candleTime: cCur.openTime,
        };
      }
    }

    // FVG Baissier
    if (cPrev2.low > cCur.high) {
      const gap = cPrev2.low - cCur.high;
      const ratio = gap / atr;
      if (ratio >= minSizeAtr) {
        return {
          direction: "short",
          top: cPrev2.low,
          bottom: cCur.high,
          midPrice: (cPrev2.low + cCur.high) * 0.5,
          sizeAtrRatio: ratio,
          stopLevel: cPrev2.high * 1.0005,
          bosConfirmed: cCur.close < bosLo,
          candleTime: cCur.openTime,
        };
      }
    }
  }
  return null;
}

type BinanceKlineRaw = [
  number, // openTime
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // closeTime
];

let binanceFapiCooldownUntil = 0;
const klinesCache = new Map<string, { at: number; bars: Kline[] }>();

function mapIntervalToBybit(interval: string): string {
  const m: Record<string, string> = {
    "1m": "1",
    "3m": "3",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "2h": "120",
    "4h": "240",
    "6h": "360",
    "12h": "720",
    "1d": "D",
    "1w": "W",
    "1M": "M",
  };
  return m[interval] ?? "15";
}

function intervalStepMs(interval: string): number {
  const m: Record<string, number> = {
    "1": 60_000,
    "3": 180_000,
    "5": 300_000,
    "15": 900_000,
    "30": 1800_000,
    "60": 3600_000,
    "120": 7200_000,
    "240": 14_400_000,
    "360": 21_600_000,
    "720": 43_200_000,
    D: 86_400_000,
    W: 7 * 86_400_000,
    M: 30 * 86_400_000,
  };
  return m[interval] ?? 3600_000;
}

export async function fetchBinanceKlines(
  symbol: string,
  interval: string,
  limit: number,
  cacheTtlMs = 0,
): Promise<Kline[]> {
  const cacheKey = `${symbol}:${interval}:${limit}`;
  if (cacheTtlMs > 0) {
    const hit = klinesCache.get(cacheKey);
    if (hit && Date.now() - hit.at < cacheTtlMs) return hit.bars;
  }

  const mapRows = (raw: BinanceKlineRaw[]): Kline[] =>
    raw.map((row) => ({
      openTime: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
      closeTime: Number(row[6]),
    }));

  const now = Date.now();
  let bars: Kline[] = [];
  if (interval !== "1s" && now >= binanceFapiCooldownUntil) {
    try {
      const fapiUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      bars = mapRows(await getJson<BinanceKlineRaw[]>(fapiUrl, { timeoutMs: 5000 }));
    } catch (e) {
      const msg = errMsg(e);
      if (msg.includes("HTTP 418") || msg.includes("HTTP 429")) {
        binanceFapiCooldownUntil = Date.now() + 300_000;
      }
    }
  }

  if (!bars.length) {
    try {
      const spotUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      bars = mapRows(await getJson<BinanceKlineRaw[]>(spotUrl, { timeoutMs: 5000 }));
    } catch {
      bars = [];
    }
  }

  if (!bars.length && interval !== "1s") {
    bars = await fetchBybitKlines(symbol, mapIntervalToBybit(interval), Math.min(1000, limit));
  }

  if (bars.length && cacheTtlMs > 0) {
    klinesCache.set(cacheKey, { at: Date.now(), bars });
  }
  return bars;
}

export async function fetchBybitKlines(
  symbol: string,
  interval: string,
  limit: number,
): Promise<Kline[]> {
  const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await getJson<{
    retCode: number;
    result?: { list?: string[][] };
  }>(url, { timeoutMs: 7000 });
  const list = res.result?.list ?? [];
  const stepMs = intervalStepMs(interval);
  return list
    .map((r) => ({
      openTime: Number(r[0]),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
      closeTime: Number(r[0]) + stepMs - 1,
    }))
    .reverse();
}

async function fetchBinanceVenue(symbol: string): Promise<VenueSnap> {
  if (Date.now() < binanceFapiCooldownUntil) {
    const [ticker24, depth, klines1h] = await Promise.all([
      getJson<{ lastPrice: string }>(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
      getJson<{ bids: [string, string][]; asks: [string, string][] }>(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`,
      ),
      fetchBinanceKlines(symbol, "1h", 3, 25_000),
    ]);
    const price = Number(ticker24.lastPrice);
    const numBids: [number, number][] = depth.bids.map(([p, q]) => [Number(p), Number(q)]);
    const numAsks: [number, number][] = depth.asks.map(([p, q]) => [Number(p), Number(q)]);
    const bidVol = numBids.reduce((s, [p, q]) => s + p * q, 0);
    const askVol = numAsks.reduce((s, [p, q]) => s + p * q, 0);
    const book = bidVol + askVol > 0 ? (bidVol - askVol) / (bidVol + askVol) : 0;
    const top5Bids = numBids.slice(0, 5);
    const top5Asks = numAsks.slice(0, 5);
    const ofiRes = computeTop5Ofi(symbol, top5Bids, top5Asks);
    let ret1h: number | null = null;
    if (klines1h.length >= 2) {
      const prev = klines1h[klines1h.length - 2].close;
      ret1h = prev > 0 ? (price - prev) / prev : null;
    }
    return {
      venue: "Binance",
      price,
      ret1h,
      funding: null,
      oiChange1h: null,
      oiValue: null,
      book,
      bestBid: top5Bids[0]?.[0],
      bestAsk: top5Asks[0]?.[0],
      spreadTicks: ofiRes.spreadTicks,
      ofi: ofiRes.ofi,
      top5Bids,
      top5Asks,
    };
  }
  const [ticker24, prem, depth, klines1h, oiHist] = await Promise.all([
    getJson<{ lastPrice: string; priceChangePercent: string }>(
      `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`,
    ).catch((e) => {
      if (errMsg(e).includes("HTTP 418") || errMsg(e).includes("HTTP 429")) {
        binanceFapiCooldownUntil = Date.now() + 300_000;
      }
      throw e;
    }),
    getJson<{ markPrice: string; lastFundingRate: string }>(
      `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`,
    ),
    getJson<{ bids: [string, string][]; asks: [string, string][] }>(
      `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=20`,
    ),
    fetchBinanceKlines(symbol, "1h", 3),
    getJson<{ sumOpenInterestValue: string }[]>(
      `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=2`,
    ).catch(() => []),
  ]);

  const price = Number(ticker24.lastPrice) || Number(prem.markPrice);
  const funding = Number(prem.lastFundingRate);
  const numBids: [number, number][] = depth.bids.map(([p, q]) => [Number(p), Number(q)]);
  const numAsks: [number, number][] = depth.asks.map(([p, q]) => [Number(p), Number(q)]);
  const bidVol = numBids.reduce((s, [p, q]) => s + p * q, 0);
  const askVol = numAsks.reduce((s, [p, q]) => s + p * q, 0);
  const book = bidVol + askVol > 0 ? (bidVol - askVol) / (bidVol + askVol) : 0;

  const top5Bids = numBids.slice(0, 5);
  const top5Asks = numAsks.slice(0, 5);
  const ofiRes = computeTop5Ofi(symbol, top5Bids, top5Asks);

  let ret1h: number | null = null;
  if (klines1h.length >= 2) {
    const prev = klines1h[klines1h.length - 2].close;
    ret1h = prev > 0 ? (price - prev) / prev : null;
  }

  let oiValue: number | null = null;
  let oiChange1h: number | null = null;
  if (oiHist.length >= 2) {
    const prevOi = Number(oiHist[0].sumOpenInterestValue);
    const currOi = Number(oiHist[oiHist.length - 1].sumOpenInterestValue);
    oiValue = currOi;
    oiChange1h = prevOi > 0 ? (currOi - prevOi) / prevOi : null;
  } else if (oiHist.length === 1) {
    oiValue = Number(oiHist[0].sumOpenInterestValue);
  }

  return {
    venue: "Binance",
    price,
    ret1h,
    funding: Number.isFinite(funding) ? funding : null,
    oiChange1h,
    oiValue,
    book,
    bestBid: top5Bids[0]?.[0],
    bestAsk: top5Asks[0]?.[0],
    spreadTicks: ofiRes.spreadTicks,
    ofi: ofiRes.ofi,
    top5Bids,
    top5Asks,
  };
}

const BYBIT_MAP: Record<string, { symbol: string; scale: number }> = {
  "1000SHIBUSDT": { symbol: "SHIB1000USDT", scale: 1 },
  NEIROUSDT: { symbol: "1000NEIROCTOUSDT", scale: 0.001 },
};

async function fetchBybitVenue(symbol: string): Promise<VenueSnap> {
  const bMap = BYBIT_MAP[symbol];
  const bSym = bMap?.symbol ?? symbol;
  const bScale = bMap?.scale ?? 1;

  const [tickerRes, depthRes, klines1h, oiRes] = await Promise.all([
    getJson<{
      result?: {
        list?: Array<{
          lastPrice: string;
          fundingRate: string;
          openInterestValue: string;
        }>;
      };
    }>(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${bSym}`),
    getJson<{
      result?: { b?: [string, string][]; a?: [string, string][] };
    }>(`https://api.bybit.com/v5/market/orderbook?category=linear&symbol=${bSym}&limit=25`),
    fetchBybitKlines(bSym, "60", 3).catch(() => []),
    getJson<{
      result?: { list?: Array<{ openInterest: string }> };
    }>(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${bSym}&intervalTime=1h&limit=2`).catch(
      () => ({ result: { list: [] } }),
    ),
  ]);

  const item = tickerRes.result?.list?.[0];
  if (!item) throw new Error(`Bybit empty ticker for ${symbol}`);
  const price = Number(item.lastPrice) * bScale;
  const funding = item.fundingRate ? Number(item.fundingRate) : null;
  const oiValue = item.openInterestValue ? Number(item.openInterestValue) : null;

  const numBids: [number, number][] = (depthRes.result?.b ?? []).map(([p, q]) => [Number(p) * bScale, Number(q) / bScale]);
  const numAsks: [number, number][] = (depthRes.result?.a ?? []).map(([p, q]) => [Number(p) * bScale, Number(q) / bScale]);
  const bidVol = numBids.reduce((s, [p, q]) => s + p * q, 0);
  const askVol = numAsks.reduce((s, [p, q]) => s + p * q, 0);
  const book = bidVol + askVol > 0 ? (bidVol - askVol) / (bidVol + askVol) : null;

  let ret1h: number | null = null;
  if (klines1h.length >= 2) {
    const prev = klines1h[klines1h.length - 2].close * bScale;
    ret1h = prev > 0 ? (price - prev) / prev : null;
  }

  let oiChange1h: number | null = null;
  const oiList = oiRes.result?.list ?? [];
  if (oiList.length >= 2) {
    const curr = Number(oiList[0].openInterest);
    const prev = Number(oiList[1].openInterest);
    oiChange1h = prev > 0 ? (curr - prev) / prev : null;
  }

  return {
    venue: "Bybit",
    price,
    ret1h,
    funding,
    oiChange1h,
    oiValue,
    book,
    top5Bids: numBids.slice(0, 5),
    top5Asks: numAsks.slice(0, 5),
  };
}

/** Lecture ultra-rapide L2 top 5 + 1m pour le suivi tick-par-tick du Moteur A */
export async function fetchMicrostructureTick(symbol: string): Promise<MicrostructureContext | null> {
  if (!symbol.endsWith("USDT")) return null;
  try {
    const [depth, bars1m] = await Promise.all([
      getJson<{ bids: [string, string][]; asks: [string, string][] }>(
        `https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=5`,
        { timeoutMs: 4000 },
      ),
      fetchBinanceKlines(symbol, "1m", 25).catch(() => []),
    ]);
    const numBids: [number, number][] = depth.bids.map(([p, q]) => [Number(p), Number(q)]);
    const numAsks: [number, number][] = depth.asks.map(([p, q]) => [Number(p), Number(q)]);
    const ofiRes = computeTop5Ofi(symbol, numBids, numAsks);

    let volumeTickRatio = 1.0;
    let atr1m = 0;
    if (bars1m.length >= 21) {
      const sma20 = bars1m.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / 20;
      const curVol = bars1m[bars1m.length - 1].volume;
      volumeTickRatio = sma20 > 0 ? curVol / sma20 : 1.0;
      atr1m = bars1m.slice(-15, -1).reduce((s, b) => s + (b.high - b.low), 0) / 14;
    }

    return {
      ofi: ofiRes.ofi,
      zOfi: ofiRes.zOfi,
      spreadTicks: ofiRes.spreadTicks,
      volumeTickRatio,
      atr1m,
      windowSamples: ofiRes.windowSamples,
    };
  } catch {
    return null;
  }
}

const YAHOO_MAP: Record<string, string> = {
  "NQ1!": "NQ=F",
  "ES1!": "ES=F",
  "YM1!": "YM=F",
  "FDAX1!": "^GDAXI",
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  USDCHF: "USDCHF=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  NZDUSD: "NZDUSD=X",
  EURGBP: "EURGBP=X",
  EURJPY: "EURJPY=X",
  GBPJPY: "GBPJPY=X",
  EURCHF: "EURCHF=X",
  AUDJPY: "AUDJPY=X",
  CADJPY: "CADJPY=X",
  CHFJPY: "CHFJPY=X",
  NZDJPY: "NZDJPY=X",
  EURAUD: "EURAUD=X",
  EURCAD: "EURCAD=X",
  GBPAUD: "GBPAUD=X",
  GBPCAD: "GBPCAD=X",
  GBPCHF: "GBPCHF=X",
  AUDCAD: "AUDCAD=X",
  AUDNZD: "AUDNZD=X",
  XAUUSD: "GC=F",
  XAGUSD: "SI=F",
  USOIL: "CL=F",
  NGAS: "NG=F",
  NVDA: "NVDA",
  AAPL: "AAPL",
  TSLA: "TSLA",
  MSFT: "MSFT",
  AMZN: "AMZN",
};

function resolveYahooSymbol(symbol: string): string {
  const up = symbol.toUpperCase();
  if (YAHOO_MAP[up]) return YAHOO_MAP[up];
  if (YAHOO_MAP[symbol]) return YAHOO_MAP[symbol];
  if (/^(EUR|GBP|USD|AUD|NZD|CAD|CHF|JPY){2}$/.test(up)) return `${up}=X`;
  return symbol;
}

const yahooKlineCache = new Map<string, { at: number; bars: Kline[] }>();

export function aggregateKlines(bars: Kline[], factor: number): Kline[] {
  const n = Math.max(1, Math.round(factor));
  if (n <= 1 || bars.length === 0) return bars;
  const out: Kline[] = [];
  for (let i = 0; i < bars.length; i += n) {
    const chunk = bars.slice(i, i + n);
    if (!chunk.length) continue;
    let hi = -Infinity;
    let lo = Infinity;
    let vol = 0;
    for (const b of chunk) {
      if (b.high > hi) hi = b.high;
      if (b.low < lo) lo = b.low;
      vol += b.volume || 0;
    }
    out.push({
      openTime: chunk[0].openTime,
      open: chunk[0].open,
      high: hi,
      low: lo,
      close: chunk[chunk.length - 1].close,
      volume: vol,
      closeTime: chunk[chunk.length - 1].closeTime,
    });
  }
  return out;
}

export async function fetchYahooKlines(
  symbol: string,
  yahooInterval = "1h",
  yahooRange = "1mo",
): Promise<Kline[]> {
  const ySym = resolveYahooSymbol(symbol);
  const cacheKey = `${ySym}:${yahooInterval}:${yahooRange}`;
  const ttlMs =
    yahooInterval === "1m" || yahooInterval === "5m" || yahooInterval === "15m"
      ? 25_000
      : yahooInterval === "1h"
        ? 90_000
        : 300_000;
  const cached = yahooKlineCache.get(cacheKey);
  if (cached && Date.now() - cached.at < ttlMs && cached.bars.length > 0) {
    return cached.bars;
  }
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=${encodeURIComponent(yahooInterval)}&range=${encodeURIComponent(yahooRange)}`;
  const data = await getJson<{
    chart?: {
      result?: Array<{
        meta?: { regularMarketPrice?: number; chartPreviousClose?: number };
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: (number | null)[];
            high?: (number | null)[];
            low?: (number | null)[];
            close?: (number | null)[];
            volume?: (number | null)[];
          }>;
        };
      }>;
    };
  }>(url, { timeoutMs: 7000 });

  const res = data.chart?.result?.[0];
  const ts = res?.timestamp ?? [];
  const q = res?.indicators?.quote?.[0];
  const stepMs =
    yahooInterval === "1m" ? 60_000
    : yahooInterval === "2m" ? 120_000
    : yahooInterval === "5m" ? 300_000
    : yahooInterval === "15m" ? 900_000
    : yahooInterval === "30m" ? 1800_000
    : yahooInterval === "1d" ? 86_400_000
    : yahooInterval === "1wk" ? 7 * 86_400_000
    : yahooInterval === "1mo" ? 30 * 86_400_000
    : 3600_000;
  const bars: Kline[] = [];
  if (q && ts.length) {
    for (let i = 0; i < ts.length; i++) {
      const o = q.open?.[i];
      const h = q.high?.[i];
      const l = q.low?.[i];
      const c = q.close?.[i];
      if (o == null || h == null || l == null || c == null) continue;
      bars.push({
        openTime: ts[i] * 1000,
        open: o,
        high: h,
        low: l,
        close: c,
        volume: q.volume?.[i] ?? 0,
        closeTime: ts[i] * 1000 + stepMs - 1,
      });
    }
  }
  if (bars.length > 0) {
    yahooKlineCache.set(cacheKey, { at: Date.now(), bars });
  }
  return bars;
}

/**
 * Charge un historique étendu depuis 2021-01-01 pour l'apprentissage des stratégies
 * (bougies 1d 2021->aujourd'hui + bougies 1h sur 2 ans).
 */
export async function fetchTrainingHistorySince2021(
  symbol: string,
  sinceMs = Date.UTC(2021, 0, 1),
): Promise<{ barsDaily2021: Kline[]; bars1h2y: Kline[] }> {
  const [raw1d, raw1h] = await Promise.all([
    fetchYahooKlines(symbol, "1d", "10y").catch(() => [] as Kline[]),
    fetchYahooKlines(symbol, "1h", "2y").catch(() => [] as Kline[]),
  ]);
  const barsDaily2021 = raw1d.filter((b) => b.openTime >= sinceMs);
  return {
    barsDaily2021: barsDaily2021.length >= 120 ? barsDaily2021 : raw1d,
    bars1h2y: raw1h,
  };
}

async function fetchYahooMarketSnapshot(symbol: string, now: number): Promise<MarketSnapshot> {
  const ySym = resolveYahooSymbol(symbol);
  const mt5Local = Mt5CloudBridge.readLocalMt5State(25_000);
  const mt5Quote = mt5Local?.quotes?.find((q) => q.symbol.toUpperCase() === symbol.toUpperCase() || Mt5CloudBridge.mapMt5SymbolToDesk(q.symbol).toUpperCase() === symbol.toUpperCase());
  const nativeMt5Bars5m: Kline[] = (mt5Quote?.barsM5 ?? [])
    .filter((r) => Array.isArray(r) && r.length >= 5 && r[4] > 0)
    .map((r) => ({
      openTime: Number(r[0]),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5] ?? 1),
      closeTime: Number(r[0]) + 300_000 - 1,
    }));
  const [bars1h, bars15m, yahooBars5m] = await Promise.all([
    fetchYahooKlines(symbol, "1h", "1mo"),
    fetchYahooKlines(symbol, "15m", "5d").catch(() => [] as Kline[]),
    nativeMt5Bars5m.length >= 25 ? Promise.resolve([] as Kline[]) : fetchYahooKlines(symbol, "5m", "5d").catch(() => [] as Kline[]),
  ]);
  const bars5m = nativeMt5Bars5m.length >= 25 ? nativeMt5Bars5m : yahooBars5m;
  const bars4h = bars1h;
  const lastClose =
    mt5Quote && mt5Quote.bid > 0
      ? (mt5Quote.ask > 0 ? (mt5Quote.bid + mt5Quote.ask) * 0.5 : mt5Quote.bid)
      : (bars5m[bars5m.length - 1]?.close ?? bars4h[bars4h.length - 1]?.close ?? bars15m[bars15m.length - 1]?.close ?? 0);
  const price = lastClose;
  const prev1h = bars4h[bars4h.length - 2]?.close ?? price;
  const ret1h = prev1h > 0 ? (price - prev1h) / prev1h : 0;
  const bar24h = bars4h[Math.max(0, bars4h.length - 25)]?.close ?? price;
  const ret24h = bar24h > 0 ? (price - bar24h) / bar24h : 0;

  const prior20 = bars4h.slice(-21, -1);
  const channelHi = prior20.length ? Math.max(...prior20.map((b) => b.high)) : null;
  const channelLo = prior20.length ? Math.min(...prior20.map((b) => b.low)) : null;
  const smcBars = bars15m.length >= 25 ? bars15m : bars4h;
  const last14 = smcBars.slice(-15, -1);
  const atr = last14.length ? last14.reduce((s, b) => s + (b.high - b.low), 0) / last14.length : null;
  const smcContext = smcBars.length >= 15
    ? SmcEngine.analyzeOhlcv(symbol, smcBars, price, atr, now)
    : undefined;

  return {
    symbol,
    at: now,
    primary: { venue: "YahooFinance", price, ret1h, funding: null, oiChange1h: null, oiValue: null, book: 0 },
    secondary: null,
    bars4h,
    bars15m,
    bars5m,
    channelHi,
    channelLo,
    atr,
    ret24h,
    news: [],
    onchain: `Flux Yahoo Finance (${ySym})`,
    errors: [],
    vwapContext: computeSessionVwap(smcBars, now),
    fvgZone: detectLatestFvg(bars4h, 0.5),
    smcContext,
  };
}

export async function fetchMarketSnapshot(symbol: string, now = Date.now(), fvgMinSizeAtr = 0.5): Promise<MarketSnapshot> {
  if (YAHOO_MAP[symbol] || !symbol.endsWith("USDT")) {
    return fetchYahooMarketSnapshot(symbol, now).catch(() => ({
      symbol,
      at: now,
      primary: null,
      secondary: null,
      bars4h: [],
      channelHi: null,
      channelLo: null,
      atr: null,
      ret24h: null,
      news: [],
      onchain: null,
      errors: [`Flux indisponible pour ${symbol}`],
    }));
  }
  const errors: string[] = [];
  const [pRes, sRes, k4Res, k15Res, k1mRes] = await Promise.allSettled([
    fetchBinanceVenue(symbol),
    fetchBybitVenue(symbol),
    fetchBinanceKlines(symbol, "4h", 720, 60_000).catch(() => fetchBybitKlines(symbol, "240", 720)),
    fetchBinanceKlines(symbol, "15m", 120, 25_000).catch(() => []),
    fetchBinanceKlines(symbol, "1m", 30, 15_000).catch(() => []),
  ]);

  const primary = pRes.status === "fulfilled" ? pRes.value : null;
  if (pRes.status === "rejected") errors.push(`Binance: ${errMsg(pRes.reason)}`);

  const secondary = sRes.status === "fulfilled" ? sRes.value : null;
  if (sRes.status === "rejected") errors.push(`Bybit: ${errMsg(sRes.reason)}`);

  const bars4h = k4Res.status === "fulfilled" ? k4Res.value : [];
  if (k4Res.status === "rejected") errors.push(`Klines 4h: ${errMsg(k4Res.reason)}`);

  const bars15m = k15Res.status === "fulfilled" ? k15Res.value : [];
  const bars1m = k1mRes.status === "fulfilled" ? k1mRes.value : [];

  const prior20 = bars4h.slice(-21, -1);
  const channelHi = prior20.length ? Math.max(...prior20.map((b) => b.high)) : null;
  const channelLo = prior20.length ? Math.min(...prior20.map((b) => b.low)) : null;
  const last14 = bars4h.slice(-15, -1);
  const atr = last14.length
    ? last14.reduce((sum, b) => sum + (b.high - b.low), 0) / last14.length
    : null;

  const refPx = primary?.price ?? secondary?.price ?? bars4h[bars4h.length - 1]?.close ?? 0;
  const bar24hAgo = bars4h[bars4h.length - 7];
  const ret24h = bar24hAgo && bar24hAgo.close > 0 ? (refPx - bar24hAgo.close) / bar24hAgo.close : null;

  // Microstructure context (Engine A)
  let microstructure: MicrostructureContext | undefined;
  if (primary?.ofi != null) {
    const win = ofiWindowBySymbol.get(symbol) ?? [primary.ofi];
    const mean = win.reduce((a, b) => a + b, 0) / Math.max(1, win.length);
    const std = Math.sqrt(win.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, win.length));
    const zOfi = win.length >= 4 && std > 1e-6 ? (primary.ofi - mean) / std : primary.ofi * 3.8;
    const sma20Vol =
      bars1m.length >= 21 ? bars1m.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / 20 : 1;
    const cur1mVol = bars1m[bars1m.length - 1]?.volume ?? 1;
    const atr1m =
      bars1m.length >= 15
        ? bars1m.slice(-15, -1).reduce((s, b) => s + (b.high - b.low), 0) / 14
        : refPx * 0.0015;
    microstructure = {
      ofi: primary.ofi,
      zOfi,
      spreadTicks: primary.spreadTicks ?? 1,
      volumeTickRatio: sma20Vol > 0 ? cur1mVol / sma20Vol : 1,
      atr1m,
      windowSamples: win.length,
    };
  }

  // VWAP & IB context (Engine B)
  const vwapContext = computeSessionVwap(bars15m, now);

  // Fair Value Gap 4h & Contexte Institutionnel SMC (BOS/CHoCH + OB/FVG + Liquidity Sweep)
  const fvgZone = detectLatestFvg(bars4h, fvgMinSizeAtr);
  const smcBars = bars15m.length >= 25 ? bars15m : bars4h;
  const smcContext = smcBars.length >= 15
    ? SmcEngine.analyzeOhlcv(symbol, smcBars, refPx, atr, now)
    : undefined;

  // Liquidation Cascade Watch (Open Interest + Funding Rate divergence)
  const ret1h = primary?.ret1h ?? 0;
  const funding = primary?.funding ?? 0;
  const oiChg = primary?.oiChange1h ?? 0;
  const cascadeActive =
    Math.abs(ret1h) > 0.014 && Math.abs(funding) > 0.00075 && Math.sign(ret1h) === Math.sign(funding);
  const cascadeWatch = {
    active: cascadeActive,
    oiPurging: oiChg < -0.005,
    reason: cascadeActive
      ? `Liquidation_Cascade_Watch : impulsion 1h (${(ret1h * 100).toFixed(2)}%) + funding extrême (${(funding * 100).toFixed(4)}%). Cassures tardives bloquées.`
      : "",
  };

  let onchain: string | null = null;
  if (symbol === "BTCUSDT") {
    onchain = "Flux L2 Top5 + perp Binance/Bybit synchronisé (lastPrice)";
  } else if (symbol === "ETHUSDT") {
    onchain = "Flux L2 Top5 ETHUSDT synchronisé avec BINANCE:ETHUSDT.P";
  } else if (symbol === "SOLUSDT") {
    onchain = "Flux L2 Top5 SOLUSDT synchronisé avec BINANCE:SOLUSDT.P";
  }

  return {
    symbol,
    at: now,
    primary,
    secondary,
    bars4h,
    bars15m,
    bars1m,
    channelHi,
    channelLo,
    atr,
    ret24h,
    news: [],
    onchain,
    errors,
    microstructure,
    vwapContext,
    fvgZone,
    smcContext,
    cascadeWatch,
  };
}

export function verifySecondSource(snap: MarketSnapshot): {
  verified: boolean;
  reason: string;
} {
  const p = snap.primary;
  const s = snap.secondary;
  if (p && (p.venue === "YahooFinance" || p.venue === "MT5") && p.price > 0) {
    return {
      verified: true,
      reason: `Flux ${p.venue} validé (${p.price}, sans carnet L2 crypto). Contexte uniquement, aucune proposition de trade.`,
    };
  }
  if (!p || !s) {
    return {
      verified: false,
      reason: "Une seule plateforme a répondu (Binance ou Bybit manquant). La 2e source est obligatoire : signal rejeté.",
    };
  }
  const pxDiff = Math.abs(p.price - s.price) / Math.max(p.price, 1e-9);
  if (pxDiff > 0.006) {
    return {
      verified: false,
      reason: `Écart de prix anormal entre ${p.venue} (${p.price}) et ${s.venue} (${s.price}) : ${(pxDiff * 100).toFixed(2)}%. Signal rejeté.`,
    };
  }
  if (p.ret1h != null && s.ret1h != null && Math.abs(p.ret1h) > 0.004) {
    if (Math.sign(p.ret1h) !== Math.sign(s.ret1h)) {
      return {
        verified: false,
        reason: `Direction 1h divergente entre ${p.venue} et ${s.venue}. La 2e source infirme le mouvement.`,
      };
    }
  }
  const oiAgrees =
    p.oiChange1h != null &&
    p.ret1h != null &&
    Math.sign(p.oiChange1h) === Math.sign(p.ret1h) &&
    Math.abs(p.oiChange1h) >= 0.004;
  const bookAgrees =
    p.book != null &&
    p.ret1h != null &&
    Math.sign(p.book) === Math.sign(p.ret1h) &&
    Math.abs(p.book) >= 0.08;
  const fundingPresent = p.funding != null && Math.abs(p.funding) >= 0.0001;

  if (oiAgrees || bookAgrees || fundingPresent || pxDiff < 0.0015) {
    return {
      verified: true,
      reason: `Confirmé par 2e source (${p.venue} ${p.price} vs ${s.venue} ${s.price}, écart ${(pxDiff * 100).toFixed(3)}%). Contexte uniquement, aucune proposition de trade.`,
    };
  }

  return {
    verified: false,
    reason: `Prix alignés entre ${p.venue} et ${s.venue}, mais ni l'Open Interest ni le carnet ne confirment l'impulsion. Drapeau retiré.`,
  };
}

let cachedMacroCalendar: { at: number; events: MacroWebhookPayload[] } = { at: 0, events: [] };

/**
 * Calendrier économique temps réel (ForexFactory / FairEconomy hebdomadaire) avec cache 30 min.
 * Détecte les annonces High/Medium impact imminentes pour activer VOLATILITY_SHIELD automatiquement.
 */
export async function fetchMacroEconomicCalendar(now = Date.now()): Promise<{
  events: MacroWebhookPayload[];
  imminentHighImpact?: MacroWebhookPayload;
}> {
  if (now - cachedMacroCalendar.at < 30 * 60_000 && cachedMacroCalendar.events.length > 0) {
    const imm = cachedMacroCalendar.events.find(
      (e) => e.impact === "HIGH" && e.timestamp >= now - 10 * 60_000 && e.timestamp <= now + 15 * 60_000,
    );
    return { events: cachedMacroCalendar.events, imminentHighImpact: imm };
  }

  try {
    const raw = await getJson<
      Array<{ title?: string; country?: string; date?: string; impact?: string; actual?: string; forecast?: string; previous?: string }>
    >("https://nfs.faireconomy.media/ff_calendar_thisweek.json", { timeoutMs: 4500 });
    const RELEVANT_CCY = new Set(["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"]);
    const events: MacroWebhookPayload[] = [];
    for (const row of Array.isArray(raw) ? raw : []) {
      const ccy = String(row.country ?? "").toUpperCase();
      if (!RELEVANT_CCY.has(ccy)) continue;
      const ts = row.date ? Date.parse(row.date) : NaN;
      if (!Number.isFinite(ts)) continue;
      const impRaw = String(row.impact ?? "Low").toUpperCase();
      const impact: MacroWebhookPayload["impact"] = impRaw === "HIGH" ? "HIGH" : impRaw === "MEDIUM" ? "MED" : "LOW";
      if (impact === "LOW") continue;
      const parseNum = (v?: string) => {
        if (!v) return 0;
        const n = Number(String(v).replace(/[^0-9.+-]/g, ""));
        return Number.isFinite(n) ? n : 0;
      };
      const rawActual = String(row.actual ?? "").trim();
      const hasActual = rawActual.length > 0 && /[0-9]/.test(rawActual);
      const actual = hasActual ? parseNum(rawActual) : 0;
      const forecast = parseNum(row.forecast);
      const previous = parseNum(row.previous);
      events.push({
        event: `${ccy} · ${row.title ?? "Macro Event"}`,
        actual,
        forecast,
        previous,
        timestamp: ts,
        impact,
        surpriseIndex:
          hasActual && forecast !== 0
            ? Math.max(-1, Math.min(1, (actual - forecast) / Math.abs(forecast)))
            : 0,
      });
    }
    cachedMacroCalendar = { at: now, events };
    const imm = events.find(
      (e) => e.impact === "HIGH" && e.timestamp >= now - 10 * 60_000 && e.timestamp <= now + 15 * 60_000,
    );
    return { events, imminentHighImpact: imm };
  } catch {
    return { events: cachedMacroCalendar.events };
  }
}
