"""
Smart Money Concepts (SMC) Institutional Engine — Pipeline Python/Pandas/Pydantic.
Ingests standard OHLCV DataFrames via `smartmoneyconcepts` (with deterministic Pandas fallback),
enforces Point-in-Time truncation (zero Look-Ahead Bias), detects:
  1. Market Structure (CHoCH / BOS)
  2. Zones of Interest (FVG backed by a valid Order Block = last opposite candle before impulse)
  3. Triggering strictly on price retracement (mitigation) into the Order Block, preferably after a Liquidity Sweep
  4. Strict Pydantic v2 schema output containing swept liquidity levels, Order Block prices, and FVG state.
"""

from __future__ import annotations

import contextlib
import io
import json
import sys
from typing import Literal, Optional

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

try:
    with contextlib.redirect_stdout(io.StringIO()):
        from smartmoneyconcepts import smc as _smc_lib
    HAS_SMC_LIB = True
except Exception:
    _smc_lib = None
    HAS_SMC_LIB = False


class OhlcvBar(BaseModel):
    openTime: Optional[int] = None
    closeTime: Optional[int] = None
    open: float = Field(gt=0)
    high: float = Field(gt=0)
    low: float = Field(gt=0)
    close: float = Field(gt=0)
    volume: float = Field(default=0.0, ge=0.0)


class SmcInputPayload(BaseModel):
    symbol: str = Field(min_length=1)
    bars: list[OhlcvBar]
    current_price: Optional[float] = None
    atr: Optional[float] = None
    swing_length: int = Field(default=3, ge=2, le=15)
    now_ms: Optional[int] = None


class SmcLiquidityLevelModel(BaseModel):
    type: Literal["BSL", "SSL"]
    price: float
    swept: bool
    sweep_index: Optional[int] = None


class SmcOrderBlockPriceModel(BaseModel):
    low: float
    high: float
    mid_price: float
    fvg_backed: bool
    mitigated: bool


class SmcFvgStateModel(BaseModel):
    status: Literal["UNMITIGATED", "PARTIALLY_MITIGATED", "MITIGATED", "NONE"]
    bottom: float
    top: float
    mid_price: float
    fill_pct: float = Field(ge=0.0, le=100.0)


class SmcAnalysisOutputModel(BaseModel):
    symbol: str
    engine: Literal["smartmoneyconcepts", "pandas_vectorized"]
    structure_event: Literal["BOS", "CHoCH", "NONE"]
    structure_direction: Literal["LONG", "SHORT", "NEUTRAL"]
    structure_break_level: float
    swept_liquidity_levels: list[SmcLiquidityLevelModel]
    order_block_price: SmcOrderBlockPriceModel
    fvg_state: SmcFvgStateModel
    mitigation_triggered: bool
    liquidity_sweep_confirmed: bool
    confluence_score: float = Field(ge=0.0, le=1.0)
    valid_signal: bool
    entry_price: float
    stop_price: float
    signal_justification: str


def _safe_float(val: object, default: float = 0.0) -> float:
    try:
        f = float(val)  # type: ignore[arg-type]
        return f if np.isfinite(f) else default
    except Exception:
        return default


def _compute_fvg_state(
    df: pd.DataFrame,
    fvg_idx: int,
    direction: Literal["LONG", "SHORT"],
    bottom: float,
    top: float,
    current_price: float,
) -> SmcFvgStateModel:
    if top <= bottom or fvg_idx < 0:
        return SmcFvgStateModel(status="NONE", bottom=0.0, top=0.0, mid_price=0.0, fill_pct=0.0)

    mid = (top + bottom) * 0.5
    gap = max(top - bottom, 1e-9)
    subsequent = df.iloc[fvg_idx + 1 :] if fvg_idx + 1 < len(df) else df.iloc[0:0]

    if direction == "LONG":
        min_reach = current_price
        if len(subsequent) > 0:
            min_reach = min(min_reach, float(subsequent["low"].min()))
        if min_reach <= bottom:
            fill_pct = 100.0
            status: Literal["UNMITIGATED", "PARTIALLY_MITIGATED", "MITIGATED"] = "MITIGATED"
        elif min_reach < top:
            fill_pct = min(99.9, max(0.0, ((top - min_reach) / gap) * 100.0))
            status = "PARTIALLY_MITIGATED"
        else:
            fill_pct = 0.0
            status = "UNMITIGATED"
    else:
        max_reach = current_price
        if len(subsequent) > 0:
            max_reach = max(max_reach, float(subsequent["high"].max()))
        if max_reach >= top:
            fill_pct = 100.0
            status = "MITIGATED"
        elif max_reach > bottom:
            fill_pct = min(99.9, max(0.0, ((max_reach - bottom) / gap) * 100.0))
            status = "PARTIALLY_MITIGATED"
        else:
            fill_pct = 0.0
            status = "UNMITIGATED"

    return SmcFvgStateModel(
        status=status,
        bottom=round(bottom, 6),
        top=round(top, 6),
        mid_price=round(mid, 6),
        fill_pct=round(fill_pct, 1),
    )


def analyze_smc_dataframe(payload: SmcInputPayload) -> SmcAnalysisOutputModel:
    raw_bars = payload.bars
    if payload.now_ms is not None:
        raw_bars = [
            b for b in raw_bars
            if (b.closeTime or b.openTime or 0) <= payload.now_ms
        ] or raw_bars

    if len(raw_bars) < 15:
        px = payload.current_price or (raw_bars[-1].close if raw_bars else 1.0)
        return SmcAnalysisOutputModel(
            symbol=payload.symbol,
            engine="smartmoneyconcepts" if HAS_SMC_LIB else "pandas_vectorized",
            structure_event="NONE",
            structure_direction="NEUTRAL",
            structure_break_level=round(px, 6),
            swept_liquidity_levels=[],
            order_block_price=SmcOrderBlockPriceModel(
                low=0.0, high=0.0, mid_price=0.0, fvg_backed=False, mitigated=False
            ),
            fvg_state=SmcFvgStateModel(status="NONE", bottom=0.0, top=0.0, mid_price=0.0, fill_pct=0.0),
            mitigation_triggered=False,
            liquidity_sweep_confirmed=False,
            confluence_score=0.0,
            valid_signal=False,
            entry_price=round(px, 6),
            stop_price=round(px, 6),
            signal_justification="Historique OHLCV insuffisant (< 15 bougies) pour l'analyse SMC.",
        )

    df = pd.DataFrame([
        {
            "open": float(b.open),
            "high": float(b.high),
            "low": float(b.low),
            "close": float(b.close),
            "volume": float(b.volume if b.volume > 0 else 1.0),
        }
        for b in raw_bars
    ])

    px = float(payload.current_price if payload.current_price and payload.current_price > 0 else df["close"].iloc[-1])
    atr_series = (df["high"] - df["low"]).rolling(window=min(14, len(df))).mean()
    atr = float(payload.atr if payload.atr and payload.atr > 0 else _safe_float(atr_series.iloc[-1], px * 0.002))
    atr = max(atr, px * 1e-5)

    sw_len = min(payload.swing_length, max(2, len(df) // 8))
    engine_name: Literal["smartmoneyconcepts", "pandas_vectorized"] = "pandas_vectorized"

    structure_event: Literal["BOS", "CHoCH", "NONE"] = "NONE"
    structure_dir: Literal["LONG", "SHORT", "NEUTRAL"] = "NEUTRAL"
    structure_break_level = px
    structure_idx = -1

    swept_levels: list[SmcLiquidityLevelModel] = []
    fvg_candidates: list[tuple[int, int, float, float]] = []
    ob_candidates: list[tuple[int, int, float, float, int]] = []

    if HAS_SMC_LIB and _smc_lib is not None:
        try:
            sw = _smc_lib.swing_highs_lows(df, swing_length=sw_len)
            bos_df = _smc_lib.bos_choch(df, sw, close_break=True)
            fvg_df = _smc_lib.fvg(df, join_consecutive=False)
            ob_df = _smc_lib.ob(df, sw, close_mitigation=False)
            liq_df = _smc_lib.liquidity(df, sw, range_percent=0.02)
            engine_name = "smartmoneyconcepts"

            # 1. Market structure: latest CHoCH or BOS
            for i in range(len(bos_df) - 1, -1, -1):
                choch_v = _safe_float(bos_df["CHOCH"].iloc[i], 0.0)
                bos_v = _safe_float(bos_df["BOS"].iloc[i], 0.0)
                lvl = _safe_float(bos_df["Level"].iloc[i], 0.0)
                brk_idx = int(_safe_float(bos_df["BrokenIndex"].iloc[i], i))
                if choch_v != 0.0:
                    structure_event = "CHoCH"
                    structure_dir = "LONG" if choch_v > 0 else "SHORT"
                    structure_break_level = lvl if lvl > 0 else float(df["close"].iloc[min(brk_idx, len(df) - 1)])
                    structure_idx = max(i, brk_idx)
                    break
                if bos_v != 0.0:
                    structure_event = "BOS"
                    structure_dir = "LONG" if bos_v > 0 else "SHORT"
                    structure_break_level = lvl if lvl > 0 else float(df["close"].iloc[min(brk_idx, len(df) - 1)])
                    structure_idx = max(i, brk_idx)
                    break

            # 2. Liquidity sweeps from smc.liquidity + direct swing high/low wick sweep scan
            seen_liq: set[tuple[str, float]] = set()
            for i in range(len(liq_df)):
                l_dir = _safe_float(liq_df["Liquidity"].iloc[i], 0.0)
                l_lvl = _safe_float(liq_df["Level"].iloc[i], 0.0)
                l_swept = _safe_float(liq_df["Swept"].iloc[i], 0.0)
                if l_dir != 0.0 and l_lvl > 0:
                    l_type: Literal["BSL", "SSL"] = "BSL" if l_dir > 0 else "SSL"
                    key = (l_type, round(l_lvl, 6))
                    if key not in seen_liq:
                        seen_liq.add(key)
                        swept_levels.append(
                            SmcLiquidityLevelModel(
                                type=l_type,
                                price=round(l_lvl, 6),
                                swept=l_swept > 0,
                                sweep_index=int(l_swept) if l_swept > 0 else None,
                            )
                        )

            for i in range(len(fvg_df)):
                fv = _safe_float(fvg_df["FVG"].iloc[i], 0.0)
                top = _safe_float(fvg_df["Top"].iloc[i], 0.0)
                bot = _safe_float(fvg_df["Bottom"].iloc[i], 0.0)
                if fv != 0.0 and top > bot:
                    fvg_candidates.append((i, 1 if fv > 0 else -1, bot, top))

            for i in range(len(ob_df)):
                ov = _safe_float(ob_df["OB"].iloc[i], 0.0)
                top = _safe_float(ob_df["Top"].iloc[i], 0.0)
                bot = _safe_float(ob_df["Bottom"].iloc[i], 0.0)
                mit_idx = int(_safe_float(ob_df["MitigatedIndex"].iloc[i], 0.0))
                if ov != 0.0 and top > bot:
                    ob_candidates.append((i, 1 if ov > 0 else -1, bot, top, mit_idx))
        except Exception:
            engine_name = "pandas_vectorized"

    # Explicit wick sweep scan over recent fractal swings (complements smc.liquidity on single-pivot stop hunts)
    swing_hi: list[tuple[int, float]] = []
    swing_lo: list[tuple[int, float]] = []
    for i in range(sw_len, len(df) - sw_len):
        h_win = df["high"].iloc[i - sw_len : i + sw_len + 1]
        l_win = df["low"].iloc[i - sw_len : i + sw_len + 1]
        if float(df["high"].iloc[i]) >= float(h_win.max()):
            swing_hi.append((i, float(df["high"].iloc[i])))
        if float(df["low"].iloc[i]) <= float(l_win.min()):
            swing_lo.append((i, float(df["low"].iloc[i])))

    recent_start = max(0, len(df) - 35)
    for sw_i, sw_p in swing_hi[-6:]:
        tail = df.iloc[max(sw_i + 1, recent_start) :]
        swept_bars = tail[tail["high"] > sw_p]
        if len(swept_bars) > 0:
            if not any(s.type == "BSL" and abs(s.price - sw_p) <= atr * 0.05 for s in swept_levels):
                swept_levels.append(
                    SmcLiquidityLevelModel(
                        type="BSL", price=round(sw_p, 6), swept=True, sweep_index=int(swept_bars.index[0])
                    )
                )
    for sw_i, sw_p in swing_lo[-6:]:
        tail = df.iloc[max(sw_i + 1, recent_start) :]
        swept_bars = tail[tail["low"] < sw_p]
        if len(swept_bars) > 0:
            if not any(s.type == "SSL" and abs(s.price - sw_p) <= atr * 0.05 for s in swept_levels):
                swept_levels.append(
                    SmcLiquidityLevelModel(
                        type="SSL", price=round(sw_p, 6), swept=True, sweep_index=int(swept_bars.index[0])
                    )
                )

    # Fallback / supplement for structure + FVG + OB if library returned NONE
    if structure_event == "NONE" and len(swing_hi) >= 2 and len(swing_lo) >= 2:
        prev_hi = swing_hi[-2][1]
        prev_lo = swing_lo[-2][1]
        last_close = float(df["close"].iloc[-1])
        if last_close > prev_hi:
            structure_event = "BOS"
            structure_dir = "LONG"
            structure_break_level = prev_hi
            structure_idx = len(df) - 1
        elif last_close < prev_lo:
            structure_event = "BOS"
            structure_dir = "SHORT"
            structure_break_level = prev_lo
            structure_idx = len(df) - 1

    # Always scan direct 3-candle FVGs as backup if smc.fvg returned sparse entries
    for i in range(2, len(df)):
        h_prev2 = float(df["high"].iloc[i - 2])
        l_prev2 = float(df["low"].iloc[i - 2])
        h_cur = float(df["high"].iloc[i])
        l_cur = float(df["low"].iloc[i])
        if l_cur > h_prev2 and (l_cur - h_prev2) >= atr * 0.15:
            if not any(abs(f[0] - i) <= 1 and f[1] == 1 for f in fvg_candidates):
                fvg_candidates.append((i, 1, h_prev2, l_cur))
        elif h_prev2 > l_cur and (h_prev2 - l_cur) >= atr * 0.15:
            if not any(abs(f[0] - i) <= 1 and f[1] == -1 for f in fvg_candidates):
                fvg_candidates.append((i, -1, l_cur, h_prev2))

    # Pair Order Block (last opposite candle prior to impulse) backed by matching-direction FVG
    target_sign = 1 if structure_dir == "LONG" else -1 if structure_dir == "SHORT" else 0
    best_ob: Optional[tuple[int, float, float, bool]] = None
    best_fvg: Optional[tuple[int, float, float]] = None

    if target_sign != 0:
        dir_fvgs = [f for f in fvg_candidates if f[1] == target_sign]
        dir_obs = [o for o in ob_candidates if o[1] == target_sign]

        for f_idx, _, f_bot, f_top in reversed(dir_fvgs):
            # Look for smc.ob close to impulse origin (f_idx - 4 .. f_idx)
            matched_ob = next((o for o in reversed(dir_obs) if f_idx - 5 <= o[0] <= f_idx), None)
            if matched_ob is not None:
                best_ob = (matched_ob[0], matched_ob[2], matched_ob[3], True)
                best_fvg = (f_idx, f_bot, f_top)
                break
            # Find the last opposite candle before impulse f_idx - 1 / f_idx - 2
            for j in range(max(0, f_idx - 2), max(-1, f_idx - 6), -1):
                c_open = float(df["open"].iloc[j])
                c_close = float(df["close"].iloc[j])
                is_opposite = (c_close < c_open) if target_sign == 1 else (c_close > c_open)
                if is_opposite:
                    best_ob = (j, float(df["low"].iloc[j]), float(df["high"].iloc[j]), True)
                    best_fvg = (f_idx, f_bot, f_top)
                    break
            if best_ob is not None:
                break

    if best_ob is None and ob_candidates and target_sign != 0:
        last_ob = next((o for o in reversed(ob_candidates) if o[1] == target_sign), None)
        if last_ob is not None:
            best_ob = (last_ob[0], last_ob[2], last_ob[3], False)

    cur_low = float(df["low"].iloc[-1])
    cur_high = float(df["high"].iloc[-1])
    ob_model = SmcOrderBlockPriceModel(low=0.0, high=0.0, mid_price=0.0, fvg_backed=False, mitigated=False)
    fvg_model = SmcFvgStateModel(status="NONE", bottom=0.0, top=0.0, mid_price=0.0, fill_pct=0.0)
    mitigation_triggered = False
    ob_invalidated = False

    if best_ob is not None:
        ob_idx, ob_low, ob_high, fvg_backed = best_ob
        ob_mid = (ob_low + ob_high) * 0.5
        tol = atr * 0.18
        between = df.iloc[ob_idx + 1 : -1] if len(df) - 1 > ob_idx + 1 else df.iloc[0:0]
        if structure_dir == "LONG":
            ob_invalidated = bool(
                (len(between) > 0 and float(between["close"].min()) < ob_low - tol * 0.5)
                or float(df["close"].iloc[-1]) < ob_low - tol
            )
            in_ob_zone = (cur_low <= ob_high + tol or px <= ob_high + tol) and px >= ob_low - tol
            mitigated_before = bool(
                len(between) > 0 and float(between["low"].min()) <= ob_high
            )
            mitigation_triggered = (not ob_invalidated) and in_ob_zone and px >= ob_low - tol
        else:
            ob_invalidated = bool(
                (len(between) > 0 and float(between["close"].max()) > ob_high + tol * 0.5)
                or float(df["close"].iloc[-1]) > ob_high + tol
            )
            in_ob_zone = (cur_high >= ob_low - tol or px >= ob_low - tol) and px <= ob_high + tol
            mitigated_before = bool(
                len(between) > 0 and float(between["high"].max()) >= ob_low
            )
            mitigation_triggered = (not ob_invalidated) and in_ob_zone and px <= ob_high + tol

        ob_model = SmcOrderBlockPriceModel(
            low=round(ob_low, 6),
            high=round(ob_high, 6),
            mid_price=round(ob_mid, 6),
            fvg_backed=fvg_backed,
            mitigated=mitigation_triggered or mitigated_before,
        )

    if best_fvg is not None and structure_dir in ("LONG", "SHORT"):
        fvg_idx, f_bot, f_top = best_fvg
        fvg_model = _compute_fvg_state(df, fvg_idx, structure_dir, f_bot, f_top, px)

    swept_only = [s for s in swept_levels if s.swept]
    relevant_swept = [
        s for s in swept_only
        if (structure_dir == "LONG" and s.type == "SSL")
        or (structure_dir == "SHORT" and s.type == "BSL")
    ]
    liq_sweep_confirmed = len(relevant_swept) > 0

    score = 0.0
    if structure_event in ("BOS", "CHoCH"):
        score += 0.30
    if ob_model.fvg_backed and ob_model.high > ob_model.low:
        score += 0.30
    if mitigation_triggered:
        score += 0.25
    if liq_sweep_confirmed:
        score += 0.15

    valid_signal = (
        structure_event in ("BOS", "CHoCH")
        and ob_model.high > ob_model.low
        and ob_model.fvg_backed
        and fvg_model.status != "NONE"
        and mitigation_triggered
        and not ob_invalidated
    )

    if structure_dir == "LONG" and ob_model.high > 0:
        entry_px = px
        sweep_lo = min((s.price for s in relevant_swept), default=ob_model.low)
        stop_px = min(ob_model.low, sweep_lo) - atr * 0.25
    elif structure_dir == "SHORT" and ob_model.high > 0:
        entry_px = px
        sweep_hi = max((s.price for s in relevant_swept), default=ob_model.high)
        stop_px = max(ob_model.high, sweep_hi) + atr * 0.25
    else:
        entry_px = px
        stop_px = px

    swept_desc = (
        ", ".join(f"{s.type}@{s.price:.5f}" for s in (relevant_swept or swept_only)[:3])
        if (relevant_swept or swept_only)
        else "aucun sweep détecté"
    )
    ob_desc = (
        f"[{ob_model.low:.5f}..{ob_model.high:.5f}] (mid={ob_model.mid_price:.5f}, fvg_backed={ob_model.fvg_backed}, mitigated={ob_model.mitigated})"
        if ob_model.high > 0
        else "aucun OB"
    )
    fvg_desc = (
        f"{fvg_model.status} [{fvg_model.bottom:.5f}..{fvg_model.top:.5f}] ({fvg_model.fill_pct:.1f}%)"
        if fvg_model.status != "NONE"
        else "NONE"
    )
    justification = (
        f"SMC({engine_name}) {structure_event} {structure_dir} (cassure {structure_break_level:.5f}) | "
        f"Liquidités balayées: {swept_desc} | Order Block: {ob_desc} | FVG: {fvg_desc} | "
        f"Mitigation={mitigation_triggered}"
    )

    return SmcAnalysisOutputModel(
        symbol=payload.symbol,
        engine=engine_name,
        structure_event=structure_event,
        structure_direction=structure_dir,
        structure_break_level=round(structure_break_level, 6),
        swept_liquidity_levels=swept_levels[-6:],
        order_block_price=ob_model,
        fvg_state=fvg_model,
        mitigation_triggered=mitigation_triggered,
        liquidity_sweep_confirmed=liq_sweep_confirmed,
        confluence_score=round(min(1.0, score), 2),
        valid_signal=valid_signal,
        entry_price=round(entry_px, 6),
        stop_price=round(stop_px, 6),
        signal_justification=justification,
    )


def main() -> int:
    raw = ""
    if "--json" in sys.argv:
        idx = sys.argv.index("--json")
        if idx + 1 < len(sys.argv):
            raw = sys.argv[idx + 1]
    elif "--input" in sys.argv:
        idx = sys.argv.index("--input")
        if idx + 1 < len(sys.argv):
            with open(sys.argv[idx + 1], "r", encoding="utf-8") as f:
                raw = f.read()
    else:
        raw = sys.stdin.read()

    payload = SmcInputPayload.model_validate_json(raw)
    result = analyze_smc_dataframe(payload)
    sys.stdout.write(result.model_dump_json() + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
