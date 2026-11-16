# AGENTS.md — Trading Floor Desk (OpenWork Compatible)

## Overview
- **Runtime**: Node.js >= 23.6 (native TypeScript execution via `--experimental-strip-types` / Node 23+ ESM)
- **Mode**: 100% Local Paper Trading Desk + Optional MT5 Local Bridge & Telegram Relay
- **Dashboard URL**: `http://localhost:4080`

## Commands
- `npm run sim` / `npm run dev` — Start local desk server (`src/main.ts --console`)
- `npm run typecheck` — Strict TypeScript check (`tsc --noEmit`)
- `npm test` — Run all unit tests (`node --test "test/**/*.test.ts"`)
- `npm run desk:desktop` — Install Windows Desktop shortcut (`Trading Floor Desk.lnk`)

## Architecture
- `src/main.ts` — Entrypoint, HTTP/SSE dashboard server & periodic monitor loop
- `src/desk.ts` — `TradingFloorDesk` orchestrator, WFO/GRPO pipeline, MT5 sync & risk rules
- `src/agents/` — 8 institutional agents:
  - `deskLead.ts` (Desk Lead, Session Goal Manager, PacingCalculator, Alpha Decay)
  - `analyst.ts` (Market & Research Analyst, MacroScore & Social Sentiment)
  - `strategist.ts` (Quant Strategist, HFT Barrage, directional symmetry)
  - `riskManager.ts` (Risk Manager, HFT Kelly, dynamic concurrency, 15% liquidation guard)
  - `executionTrader.ts` (Execution Trader, Fiat-Target $50-$100 TP, TWAP/VWAP slicing)
  - `reviewer.ts` (Reviewer, R-Multiple audit & GRPO RL updates)
  - `sentinel.ts` (SRE Sentinel, RTT latency circuit-breaker & Token Bucket)
  - `liquidityHunter.ts` (L2 Orderbook spoofing, squeezes & magnet zones)
- `src/ui.ts` — Minimalist emoji-free 3D WebGL dashboard (`DASHBOARD_HTML`)
- `src/mt5.ts` — MetaTrader 5 local bridge & MQL5 EA generator (`TradingFloorBridge.mq5`)
- `src/rl/grpo.ts` — GRPO reinforcement learning policy store
- `src/components/` — Modular React/R3F UI components

## Safety & Conventions
- Never commit `.env` or `data/` runtime state.
- Always run `npm run typecheck && npm test` after edits.
- Keep UI minimalist and emoji-free.
