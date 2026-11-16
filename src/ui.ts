export const DASHBOARD_HTML = /* html */ `<!DOCTYPE html>
<html lang="fr" data-theme="obsidian">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TRADING FLOOR V3 — Terminal Quantitatif 6 Agents IA</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    :root,
    html[data-theme="obsidian"] {
      --bg-0: #03060c;
      --bg-1: #070c16;
      --bg-2: #0d1526;
      --bg-3: #152138;
      --bg-gradient: radial-gradient(circle at 20% 0%, #0e1d36 0%, #050912 52%, #020408 100%);
      --surface-glass: rgba(11, 17, 30, 0.78);
      --glass-alpha: 0.78;
      --ring-1: rgba(255, 255, 255, 0.10);
      --ring-2: rgba(255, 255, 255, 0.22);
      --fg-0: #f8fafc;
      --fg-1: #e2e8f0;
      --fg-2: #94a3b8;
      --fg-3: #64748b;
      --accent: #38bdf8;
      --accent-bg: rgba(56, 189, 248, 0.15);
      --up: #10b981;
      --up-bg: rgba(16, 185, 129, 0.14);
      --up-ring: rgba(16, 185, 129, 0.42);
      --down: #f43f5e;
      --down-bg: rgba(244, 63, 94, 0.14);
      --down-ring: rgba(244, 63, 94, 0.42);
      --amber: #fbbf24;
      --shadow-glass: 0 0 0 1px var(--ring-1), 0 0 22px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    html[data-theme="midnight"] {
      --bg-0: #06071b;
      --bg-1: #0c0e2c;
      --bg-2: #141744;
      --bg-3: #1e235c;
      --bg-gradient: radial-gradient(circle at 75% 10%, #261b54 0%, #090b24 55%, #040514 100%);
      --surface-glass: rgba(16, 19, 54, 0.80);
      --ring-1: rgba(196, 181, 253, 0.14);
      --ring-2: rgba(196, 181, 253, 0.28);
      --accent: #a78bfa;
      --accent-bg: rgba(167, 139, 250, 0.16);
      --up: #2dd4bf;
      --up-bg: rgba(45, 212, 191, 0.14);
      --up-ring: rgba(45, 212, 191, 0.42);
      --down: #fb7185;
      --down-bg: rgba(251, 113, 133, 0.14);
      --down-ring: rgba(251, 113, 133, 0.42);
    }

    html[data-theme="emerald"] {
      --bg-0: #020c08;
      --bg-1: #051610;
      --bg-2: #0a241b;
      --bg-3: #103428;
      --bg-gradient: radial-gradient(circle at 30% 10%, #0b3324 0%, #03120c 55%, #010805 100%);
      --surface-glass: rgba(6, 24, 18, 0.80);
      --ring-1: rgba(52, 211, 153, 0.16);
      --ring-2: rgba(52, 211, 153, 0.34);
      --accent: #34d399;
      --accent-bg: rgba(52, 211, 153, 0.16);
      --up: #10b981;
      --up-bg: rgba(16, 185, 129, 0.16);
      --up-ring: rgba(16, 185, 129, 0.45);
      --down: #ef4444;
      --down-bg: rgba(239, 68, 68, 0.16);
      --down-ring: rgba(239, 68, 68, 0.45);
    }

    html[data-theme="amber"] {
      --bg-0: #0c0802;
      --bg-1: #161005;
      --bg-2: #241908;
      --bg-3: #36250c;
      --bg-gradient: radial-gradient(circle at 50% 0%, #2e1d06 0%, #100b03 55%, #070501 100%);
      --surface-glass: rgba(24, 17, 7, 0.82);
      --ring-1: rgba(251, 191, 36, 0.16);
      --ring-2: rgba(251, 191, 36, 0.34);
      --accent: #f59e0b;
      --accent-bg: rgba(245, 158, 11, 0.18);
      --up: #22c55e;
      --up-bg: rgba(34, 197, 94, 0.15);
      --up-ring: rgba(34, 197, 94, 0.42);
      --down: #f43f5e;
      --down-bg: rgba(244, 63, 94, 0.16);
      --down-ring: rgba(244, 63, 94, 0.42);
    }

    html[data-theme="cyberpunk"] {
      --bg-0: #090312;
      --bg-1: #120624;
      --bg-2: #1c0a36;
      --bg-3: #2a104f;
      --bg-gradient: radial-gradient(circle at 80% 15%, #3d0f54 0%, #100521 55%, #06020d 100%);
      --surface-glass: rgba(22, 8, 42, 0.80);
      --ring-1: rgba(236, 72, 153, 0.18);
      --ring-2: rgba(34, 211, 238, 0.36);
      --accent: #ec4899;
      --accent-bg: rgba(236, 72, 153, 0.18);
      --up: #22d3ee;
      --up-bg: rgba(34, 211, 238, 0.15);
      --up-ring: rgba(34, 211, 238, 0.45);
      --down: #f43f5e;
      --down-bg: rgba(244, 63, 94, 0.16);
      --down-ring: rgba(244, 63, 94, 0.45);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--bg-0);
      background-image: var(--bg-gradient);
      color: var(--fg-0);
      font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    button, input, select, textarea { font-family: inherit; color: inherit; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

    .mono { font-family: "JetBrains Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
    .up { color: var(--up); }
    .down { color: var(--down); }
    .accent { color: var(--accent); }
    .amber { color: var(--amber); }

    /* ================= STEALTH TOP BAR ================= */
    #stealthHoverZone {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 66px;
      z-index: 60;
      pointer-events: none;
    }
    #topNav {
      position: fixed;
      top: 10px;
      left: 14px;
      right: 14px;
      min-height: 54px;
      z-index: 65;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 6px 14px;
      border-radius: 16px;
      background: var(--surface-glass);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--ring-1);
      box-shadow: var(--shadow-glass);
      transition: opacity 0.25s ease, transform 0.25s ease, border-color 0.2s ease;
    }
    body.stealth-desk #topNav { opacity: 0.42; }
    body.stealth-desk #topNav:hover,
    body.stealth-desk #topNav:focus-within,
    body.nav-pinned #topNav {
      opacity: 1;
      border-color: var(--ring-2);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 9px;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }
    .brand-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--up);
      box-shadow: 0 0 14px var(--up);
      transition: transform 0.2s ease;
    }
    .brand-dot.halted {
      background: var(--amber);
      box-shadow: 0 0 16px var(--amber);
      animation: pulseWarn 1.1s infinite;
    }
    @keyframes pulseWarn {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.25); opacity: 0.65; }
    }

    .tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      overflow-x: auto;
      padding: 4px;
      background: rgba(255, 255, 255, 0.035);
      border-radius: 12px;
      border: 1px solid var(--ring-1);
    }
    .tab-btn {
      border: 1px solid transparent;
      background: transparent;
      color: var(--fg-2);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .tab-btn:hover { color: var(--fg-0); background: rgba(255, 255, 255, 0.06); transform: translateY(-1px); }
    .tab-btn.active {
      color: var(--fg-0);
      background: var(--accent-bg);
      border-color: var(--accent);
      box-shadow: 0 0 14px var(--accent-bg);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 7px;
      position: relative;
      white-space: nowrap;
    }
    .pill-btn {
      border: 1px solid var(--ring-1);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%);
      color: var(--fg-1);
      padding: 7px 11px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.16s ease;
    }
    .pill-btn:hover {
      border-color: var(--ring-2);
      background: rgba(255, 255, 255, 0.11);
      color: var(--fg-0);
      transform: translateY(-1px);
    }
    .pill-btn:active { transform: translateY(0); }
    .pill-btn.primary {
      background: var(--accent-bg);
      border-color: var(--accent);
      color: var(--fg-0);
      box-shadow: 0 0 16px var(--accent-bg);
    }
    .pill-btn.auto-on {
      background: var(--up-bg);
      border-color: var(--up-ring);
      color: var(--up);
    }
    .pill-btn.auto-off {
      background: rgba(245, 158, 11, 0.14);
      border-color: rgba(245, 158, 11, 0.42);
      color: var(--amber);
    }

    /* ================= PANIC KILL SWITCH BAR ================= */
    #panicDock {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 80;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 14px;
      background: rgba(8, 10, 16, 0.88);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.82);
    }
    .btn-panic-close {
      border: 1px solid rgba(244, 63, 94, 0.65);
      background: linear-gradient(135deg, #dc2626 0%, #9f1239 100%);
      color: #ffffff;
      padding: 8px 13px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      cursor: pointer;
      box-shadow: 0 0 18px rgba(220, 38, 38, 0.45);
      transition: all 0.16s ease;
    }
    .btn-panic-close:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 0 26px rgba(244, 63, 94, 0.72); }

    .btn-panic-halt {
      border: 1px solid #facc15;
      background: repeating-linear-gradient(-45deg, #111827, #111827 8px, #272206 8px, #272206 16px);
      color: #fde047;
      padding: 8px 13px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      cursor: pointer;
      box-shadow: 0 0 16px rgba(250, 204, 21, 0.25);
      transition: all 0.16s ease;
    }
    .btn-panic-halt:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 0 24px rgba(250, 204, 21, 0.5); }
    .btn-panic-halt.resuming {
      border-color: var(--up);
      background: var(--up-bg);
      color: var(--up);
    }

    /* Asset multi-select dropdown */
    #assetDropdownMenu {
      position: absolute;
      top: 50px;
      right: 0;
      width: 410px;
      max-height: 75vh;
      overflow-y: auto;
      z-index: 95;
      display: none;
      padding: 16px;
      border-radius: 16px;
      background: rgba(7, 11, 20, 0.96);
      backdrop-filter: blur(28px);
      border: 1px solid var(--ring-2);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
    }
    .asset-cat-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--accent);
      text-transform: uppercase;
      margin: 10px 0 6px;
    }
    .asset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .asset-item {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 7px 9px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--ring-1);
      font-size: 11px;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }
    .asset-item:hover { border-color: var(--accent); }

    /* ================= VIEWPORT PANELS ================= */
    .view-panel {
      position: fixed;
      inset: 0;
      display: none;
      padding: 76px 16px 76px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .view-panel.active { display: block; }
    #view-desk.active { padding: 0; overflow: hidden; }

    /* ================= TAB 1: DESK 3D ================= */
    #canvas3dWrap {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-gradient);
    }
    #deskFloatingBadge {
      position: fixed;
      left: 16px;
      bottom: 16px;
      z-index: 40;
      padding: 14px 18px;
      border-radius: 16px;
      background: var(--surface-glass);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--ring-1);
      box-shadow: var(--shadow-glass);
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .pnl-hero-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--fg-2);
      margin-bottom: 3px;
    }
    .pnl-hero-value { font-size: 27px; font-weight: 800; letter-spacing: -0.02em; }
    .desk-mini-stat {
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--ring-1);
      padding-left: 16px;
    }
    #deskNodeInspector {
      position: fixed;
      left: 16px;
      top: 120px;
      width: 310px;
      z-index: 45;
      padding: 14px 16px;
      border-radius: 14px;
      background: var(--surface-glass);
      backdrop-filter: blur(24px);
      border: 1px solid var(--ring-2);
      box-shadow: var(--shadow-glass);
      font-size: 12px;
      display: none;
    }
    #deskStatusStrip {
      position: fixed;
      left: 16px;
      top: 76px;
      z-index: 35;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      pointer-events: none;
    }
    .badge-chip {
      padding: 5px 11px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      background: var(--surface-glass);
      backdrop-filter: blur(16px);
      border: 1px solid var(--ring-1);
      color: var(--fg-1);
    }
    .badge-chip.shield {
      background: rgba(244, 63, 94, 0.20);
      border-color: var(--down-ring);
      color: #fda4af;
    }

    /* ================= GLASS CARD ================= */
    .glass-card {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), var(--surface-glass);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-radius: 16px;
      border: 1px solid var(--ring-1);
      box-shadow: var(--shadow-glass);
      padding: 18px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .glass-card:hover { border-color: var(--ring-2); }
    .card-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--fg-0);
    }

    /* ================= TAB 2: SALON ET CHAT ================= */
    .chat-shell {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 14px;
      height: calc(100vh - 156px);
    }
    .channel-list { display: flex; flex-direction: column; gap: 5px; margin-top: 8px; }
    .chan-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      border-radius: 10px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--fg-2);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: all 0.16s ease;
    }
    .chan-btn:hover { background: rgba(255, 255, 255, 0.05); color: var(--fg-0); }
    .chan-btn.active { background: var(--accent-bg); border-color: var(--accent); color: var(--fg-0); }
    .chan-count {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--fg-2);
    }
    .agent-filter-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .agent-chip {
      padding: 4px 9px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--ring-1);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .agent-chip:hover { border-color: var(--ring-2); }
    .agent-chip.active { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }

    .chat-main { display: flex; flex-direction: column; overflow: hidden; }
    #chatMessages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 6px; }
    .msg-bubble {
      display: flex;
      gap: 12px;
      padding: 11px 14px;
      border-radius: 13px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--ring-1);
    }
    .msg-bubble.human { background: var(--accent-bg); border-color: var(--accent); }
    .msg-bubble.veto { background: var(--down-bg); border-color: var(--down-ring); }
    .msg-bubble.fill { background: var(--up-bg); border-color: var(--up-ring); }
    .msg-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      flex-shrink: 0;
      border: 1px solid var(--ring-1);
    }
    .chat-input-bar {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--ring-1);
    }
    .input-dark {
      background: rgba(3, 5, 10, 0.78);
      border: 1px solid var(--ring-1);
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 12px;
      color: var(--fg-0);
      outline: none;
      transition: border-color 0.16s ease, box-shadow 0.16s ease;
    }
    .input-dark:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }

    /* ================= TAB 3: CHARTS & TRADINGVIEW ================= */
    .chart-shell {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 690px;
      height: calc(100vh - 156px);
    }
    .chart-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--ring-1);
    }
    #lwChartContainer {
      flex: 1;
      width: 100%;
      min-height: 600px;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: rgba(2, 5, 10, 0.45);
      border: 1px solid var(--ring-1);
    }

    /* ================= TAB 4: JOURNAL NOTION ================= */
    .notion-grid { display: flex; flex-direction: column; gap: 14px; padding-bottom: 24px; }
    .kpi-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
    .kpi-box {
      padding: 14px 16px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--ring-1);
    }
    .kpi-lbl { font-size: 10px; color: var(--fg-2); text-transform: uppercase; letter-spacing: 0.06em; }
    .kpi-val { font-size: 20px; font-weight: 800; margin-top: 5px; }

    .equity-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
    .seg-group {
      display: inline-flex;
      padding: 3px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--ring-1);
      gap: 3px;
    }
    .seg-btn {
      border: none;
      background: transparent;
      color: var(--fg-2);
      padding: 5px 11px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .seg-btn:hover { color: var(--fg-0); }
    .seg-btn.active { background: var(--accent-bg); color: var(--accent); }

    #equityAreaWrap {
      position: relative;
      width: 100%;
      min-height: 290px;
      height: 290px;
      margin-top: 10px;
    }
    #equityTooltip {
      position: absolute;
      top: 10px;
      left: 12px;
      z-index: 15;
      pointer-events: none;
      padding: 8px 11px;
      border-radius: 9px;
      background: rgba(7, 11, 20, 0.94);
      border: 1px solid var(--ring-2);
      font-size: 11px;
      display: none;
    }

    .notion-two-col { display: grid; grid-template-columns: 1.75fr 1fr; gap: 14px; }
    @media (max-width: 1100px) {
      .notion-two-col { grid-template-columns: 1fr; }
      .chat-shell { grid-template-columns: 1fr; }
    }

    table.ledger { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    table.ledger th {
      text-align: left;
      padding: 9px 10px;
      color: var(--fg-2);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 1px solid var(--ring-1);
    }
    table.ledger td { padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
    table.ledger tr:hover td { background: rgba(255, 255, 255, 0.03); cursor: pointer; }

    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-top: 8px; }
    .cal-day-hdr { font-size: 9px; text-align: center; color: var(--fg-3); font-weight: 700; padding-bottom: 4px; }
    .cal-cell {
      aspect-ratio: 1 / 0.85;
      border-radius: 8px;
      padding: 5px;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid var(--ring-1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 10px;
    }
    .cal-cell.pos { background: var(--up-bg); border-color: var(--up-ring); }
    .cal-cell.neg { background: var(--down-bg); border-color: var(--down-ring); }

    /* ================= TAB 5: ENTRAINEMENT IA & LEVIER 500x ================= */
    .strat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
      gap: 14px;
      padding-bottom: 24px;
    }
    .strat-widget { position: relative; }
    .strat-grid.unlocked .strat-widget {
      cursor: grab;
      border-color: var(--accent);
      box-shadow: 0 0 22px var(--accent-bg);
    }
    .widget-reorder-bar { display: none; gap: 4px; }
    .strat-grid.unlocked .widget-reorder-bar { display: flex; }

    .summary-banner {
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--accent-bg);
      border: 1px solid rgba(255, 255, 255, 0.14);
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--fg-1);
      margin-bottom: 14px;
    }
    .step-box {
      padding: 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid var(--ring-1);
      margin-bottom: 10px;
    }
    .step-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .info-tip {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      color: var(--fg-2);
      font-size: 10px;
      cursor: help;
    }
    .info-tip:hover::after {
      content: attr(data-tip);
      position: absolute;
      bottom: 130%;
      left: 50%;
      transform: translateX(-50%);
      width: 240px;
      padding: 8px 10px;
      border-radius: 9px;
      background: #04070f;
      border: 1px solid var(--ring-2);
      color: var(--fg-0);
      font-size: 11px;
      font-weight: 400;
      line-height: 1.4;
      text-transform: none;
      letter-spacing: 0;
      z-index: 150;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.9);
      pointer-events: none;
    }
    .ai-metric-card {
      padding: 11px 13px;
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--ring-1);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 12px;
    }

    .lev-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 8px;
      border-radius: 99px;
      background: linear-gradient(90deg, var(--up) 0%, var(--amber) 45%, var(--down) 100%);
      outline: none;
      cursor: pointer;
    }
    .lev-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid var(--accent);
      box-shadow: 0 0 14px var(--accent);
      cursor: pointer;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;
      margin: 8px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), var(--up));
      width: 0%;
      transition: width 0.3s ease;
    }

    /* ================= DRAWERS & PANIC MODAL ================= */
    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 390px;
      max-width: 94vw;
      z-index: 120;
      background: rgba(6, 10, 18, 0.96);
      backdrop-filter: blur(28px);
      border-left: 1px solid var(--ring-2);
      padding: 22px;
      overflow-y: auto;
      transform: translateX(102%);
      transition: transform 0.25s ease;
    }
    .drawer.open { transform: translateX(0); }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 160;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
    }
    .modal-backdrop.open { display: flex; }
    .modal-box {
      width: 440px;
      max-width: 92vw;
      padding: 22px;
      border-radius: 18px;
      background: rgba(10, 14, 24, 0.96);
      border: 1px solid rgba(244, 63, 94, 0.55);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9);
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field-lbl {
      display: block;
      font-size: 10px;
      color: var(--fg-2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
  </style>
</head>
<body class="stealth-desk">
  <div id="stealthHoverZone"></div>

  <!-- STEALTH / TOP NAVIGATION -->
  <header id="topNav">
    <div class="brand">
      <span class="brand-dot" id="liveHealthDot"></span>
      <span>TRADING FLOOR <span class="accent">V3</span></span>
    </div>

    <nav class="tabs" id="mainTabs">
      <button class="tab-btn active" data-tab="desk" onclick="switchTab(&quot;desk&quot;)">DESK 3D</button>
      <button class="tab-btn" data-tab="chat" onclick="switchTab(&quot;chat&quot;)">SALON ET CHAT</button>
      <button class="tab-btn" data-tab="charts" onclick="switchTab(&quot;charts&quot;)">CHARTS ET TRADINGVIEW</button>
      <button class="tab-btn" data-tab="journal" onclick="switchTab(&quot;journal&quot;)">JOURNAL NOTION</button>
      <button class="tab-btn" data-tab="strategy" onclick="switchTab(&quot;strategy&quot;)">STRATEGIE</button>
    </nav>

    <div class="nav-actions">
      <button class="pill-btn mono" id="navLevBadge" onclick="switchTab(&quot;strategy&quot;)" title="Levier actif">x5</button>
      <button id="btnExecMode" class="pill-btn auto-off" onclick="toggleExecutionMode()">Confirmation Humaine</button>
      <button class="pill-btn primary" onclick="openDrawer(&quot;mobileDrawer&quot;)" title="Connecter MT5 Téléphone &amp; Telegram">📱 MT5 &amp; Telegram</button>
      <button id="btnAssetsToggle" class="pill-btn" onclick="toggleAssetDropdown()">Actifs ▾</button>
      <button id="btnPinNav" class="pill-btn" onclick="togglePinNav()" title="Épingler la barre">📌</button>
      <button class="pill-btn" onclick="openDrawer(&quot;themeDrawer&quot;)" title="Thèmes &amp; Préférences">🎨 Thèmes</button>
    </div>

    <div id="assetDropdownMenu">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="font-size:12px">Univers Multi-Marchés</strong>
        <button class="pill-btn primary" onclick="applySelectedAssets()">Appliquer &amp; Scanner</button>
      </div>
      <div id="assetChecklistHost"></div>
    </div>
  </header>

  <!-- PERSISTENT EMERGENCY KILL-SWITCH BAR -->
  <div id="panicDock">
    <button class="btn-panic-close" onclick="openPanicModal()">🚨 CLOSE ALL POSITIONS</button>
    <button id="btnPanicHalt" class="btn-panic-halt" onclick="toggleManualHalt()">⚠️ HALT DESK</button>
  </div>

  <!-- EMERGENCY CONFIRM MODAL -->
  <div id="panicModal" class="modal-backdrop">
    <div class="modal-box">
      <h3 style="font-size:16px;font-weight:800;color:#fb7185;margin-bottom:8px">Confirmation d'Urgence — Liquidation Totale</h3>
      <p style="font-size:12.5px;color:var(--fg-1);line-height:1.5;margin-bottom:14px" id="panicModalDesc">
        Cette action va envoyer le signal <strong>EMERGENCY_LIQUIDATE_ALL</strong> et clôturer immédiatement au prix du marché toutes les positions ouvertes ainsi que les tickets en attente.
      </p>
      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="pill-btn" onclick="closePanicModal()">Annuler</button>
        <button class="btn-panic-close" onclick="confirmEmergencyLiquidate()">CONFIRMER CLOSE ALL POSITIONS</button>
      </div>
    </div>
  </div>

  <!-- ==================== TAB 1: DESK 3D ==================== -->
  <section id="view-desk" class="view-panel active">
    <div id="canvas3dWrap"></div>

    <div id="deskStatusStrip">
      <div class="badge-chip mono" id="deskMt5LiveChip" style="display:none">🟢 MT5 LIVE</div>
      <div class="badge-chip mono" id="deskRegimeChip">RÉGIME : MEAN_REVERTING</div>
      <div class="badge-chip mono" id="deskRlChip">IA ÉPISODE #0</div>
      <div class="badge-chip mono" id="deskThemeChip">THÈME : OBSIDIAN</div>
      <div class="badge-chip shield" id="deskShieldChip" style="display:none">VOLATILITY_SHIELD ACTIF (1.5x ATR)</div>
    </div>

    <div id="deskFloatingBadge">
      <div>
        <div class="pnl-hero-label">PnL Net Session (Capital Live)</div>
        <div class="pnl-hero-value mono" id="heroDayPnl">+$0.00</div>
      </div>
      <div class="desk-mini-stat">
        <span class="pnl-hero-label">Équité Totale</span>
        <span class="mono" style="font-size:15px;font-weight:700" id="heroEquity">$10,000</span>
      </div>
      <div class="desk-mini-stat">
        <span class="pnl-hero-label">Positions Actives</span>
        <span class="mono accent" style="font-size:15px;font-weight:700" id="heroOpenCount">0</span>
      </div>
      <div class="desk-mini-stat">
        <span class="pnl-hero-label">En Attente</span>
        <span class="mono amber" style="font-size:15px;font-weight:700" id="heroPendingCount">0</span>
      </div>
    </div>

    <div id="deskNodeInspector"></div>
  </section>

  <!-- ==================== TAB 2: SALON ET CHAT ==================== -->
  <section id="view-chat" class="view-panel">
    <div class="chat-shell">
      <aside class="glass-card" style="display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div class="card-hdr">
            <span class="card-title">Salons Temps Réel</span>
            <span class="mono up" style="font-size:10px">SSE LIVE</span>
          </div>
          <div class="channel-list" id="channelSidebar">
            <button class="chan-btn active" data-chan="floor-general" onclick="selectChatChannel(&quot;floor-general&quot;)">
              <span># floor-general</span><span class="chan-count" id="cnt-floor-general">0</span>
            </button>
            <button class="chan-btn" data-chan="risk-veto" onclick="selectChatChannel(&quot;risk-veto&quot;)">
              <span># risk-veto</span><span class="chan-count" id="cnt-risk-veto">0</span>
            </button>
            <button class="chan-btn" data-chan="macro-alerts" onclick="selectChatChannel(&quot;macro-alerts&quot;)">
              <span># macro-alerts</span><span class="chan-count" id="cnt-macro-alerts">0</span>
            </button>
            <button class="chan-btn" data-chan="rl-optimizer" onclick="selectChatChannel(&quot;rl-optimizer&quot;)">
              <span># rl-optimizer</span><span class="chan-count" id="cnt-rl-optimizer">0</span>
            </button>
            <button class="chan-btn" data-chan="sys-ops" onclick="selectChatChannel(&quot;sys-ops&quot;)">
              <span># sys-ops</span><span class="chan-count" id="cnt-sys-ops">0</span>
            </button>
            <button class="chan-btn" data-chan="liquidity-l2" onclick="selectChatChannel(&quot;liquidity-l2&quot;)">
              <span># liquidity-l2</span><span class="chan-count" id="cnt-liquidity-l2">0</span>
            </button>
          </div>

          <div style="margin-top:18px">
            <div class="card-title" style="font-size:10px;margin-bottom:8px">Filtrer par Agent IA</div>
            <div class="agent-filter-row" id="agentFilterHost"></div>
          </div>

          <div style="margin-top:16px" id="liveSocialHost"></div>
        </div>

        <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px">
          <button class="pill-btn primary" style="justify-content:center" onclick="sendCmd(&quot;scan&quot;)">Lancer Scan Immédiat</button>
        </div>
      </aside>

      <main class="glass-card chat-main">
        <div class="card-hdr">
          <div>
            <span class="card-title" id="activeChanTitle"># floor-general</span>
            <span style="font-size:11px;color:var(--fg-2);margin-left:8px">Flux institutionnel des 8 agents</span>
          </div>
          <div id="pendingActionBanner"></div>
        </div>
        <div id="chatMessages"></div>
        <div class="chat-input-bar">
          <input id="chatCmdInput" class="input-dark" style="flex:1" placeholder="Commande (ex: scan, approuver TF-..., mode auto, Passe le levier à 100x)..." onkeydown="if(event.key===&quot;Enter&quot;)submitChatInput()" />
          <button class="pill-btn primary" onclick="submitChatInput()">Envoyer</button>
        </div>
      </main>
    </div>
  </section>

  <!-- ==================== TAB 3: CHARTS ET TRADINGVIEW ==================== -->
  <section id="view-charts" class="view-panel">
    <div class="glass-card chart-shell">
      <div class="chart-toolbar">
        <div style="display:flex;align-items:center;gap:10px">
          <label class="field-lbl" style="margin:0">Paire</label>
          <select id="chartSymbolSelect" class="input-dark mono" onchange="refreshChartData()"></select>
          <select id="chartTfSelect" class="input-dark mono" onchange="refreshChartData()">
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
          </select>
          <button class="pill-btn" onclick="refreshChartData()">Actualiser Bougies</button>
        </div>
        <div class="mono" style="font-size:11px;color:var(--fg-1);display:flex;gap:16px" id="chartOverlayStats">
          <span>VWAP : --</span>
          <span>FVG : --</span>
          <span>Sentiment Social : --</span>
        </div>
      </div>
      <div id="lwChartContainer"></div>
    </div>
  </section>

  <!-- ==================== TAB 4: JOURNAL NOTION ==================== -->
  <section id="view-journal" class="view-panel">
    <div class="notion-grid">
      <div class="kpi-strip" id="notionKpiStrip"></div>

      <div class="glass-card">
        <div class="equity-header">
          <div>
            <div class="card-title">Courbe d'Équité &amp; PnL Portefeuille Temps Réel</div>
            <div style="font-size:11px;color:var(--fg-2)">Mise à jour automatique sur chaque fill / clôture</div>
          </div>
          <div class="seg-group" id="equityTfGroup">
            <button class="seg-btn" data-range="1D" onclick="setEquityRange(&quot;1D&quot;)">1D</button>
            <button class="seg-btn" data-range="1W" onclick="setEquityRange(&quot;1W&quot;)">1W</button>
            <button class="seg-btn" data-range="1M" onclick="setEquityRange(&quot;1M&quot;)">1M</button>
            <button class="seg-btn active" data-range="ALL" onclick="setEquityRange(&quot;ALL&quot;)">ALL</button>
          </div>
        </div>
        <div id="equityAreaWrap">
          <div id="equityTooltip" class="mono"></div>
        </div>
      </div>

      <div class="notion-two-col">
        <div class="glass-card">
          <div class="card-hdr">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <div class="seg-group">
                <button class="seg-btn active" id="tabLedgerOpen" onclick="setLedgerMode(&quot;open&quot;)">Positions Ouvertes</button>
                <button class="seg-btn" id="tabLedgerClosed" onclick="setLedgerMode(&quot;closed&quot;)">Positions Fermées</button>
              </div>
              <div class="seg-group">
                <button class="seg-btn active" data-dir="ALL" onclick="setLedgerDir(&quot;ALL&quot;)">ALL</button>
                <button class="seg-btn" data-dir="long" onclick="setLedgerDir(&quot;long&quot;)">LONG</button>
                <button class="seg-btn" data-dir="short" onclick="setLedgerDir(&quot;short&quot;)">SHORT</button>
              </div>
            </div>
            <span class="mono up" style="font-size:10px">LIVE SYNC</span>
          </div>
          <div style="overflow-x:auto">
            <table class="ledger">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Actif / Sens</th>
                  <th>Stratégie / Régime</th>
                  <th>Entrée → Mark/Sortie</th>
                  <th>Levier / LiqPrice</th>
                  <th>PnL Live / R</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody id="ledgerTableBody"></tbody>
            </table>
          </div>
        </div>

        <div class="glass-card">
          <div class="card-hdr">
            <span class="card-title">Calendrier PnL Journalier</span>
            <div style="display:flex;align-items:center;gap:6px">
              <button class="pill-btn" onclick="shiftCalendarMonth(-1)">◀</button>
              <span class="mono" style="font-size:11px" id="calMonthLabel">--</span>
              <button class="pill-btn" onclick="shiftCalendarMonth(1)">▶</button>
            </div>
          </div>
          <div class="cal-grid" id="calGridHost"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ==================== TAB 5: ENTRAINEMENT DE L'IA & LEVIER x500 ==================== -->
  <section id="view-strategy" class="view-panel">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div>
        <span class="card-title" style="font-size:15px">Entraînement de l'IA (Machine Learning)</span>
      </div>
      <button id="btnLockGrid" class="pill-btn" onclick="toggleGridLock()">🔒 Grille Verrouillée</button>
    </div>

    <div class="summary-banner" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div style="flex:1;min-width:260px">
        Ce panneau permet aux agents de rejouer l'historique du marché pour s'améliorer de leurs erreurs et optimiser leurs stratégies.
      </div>
      <button id="btnAutoPilot1Click" class="pill-btn primary" style="padding:10px 16px;font-size:12px" onclick="runOneClickAutopilot()">
        ⚡ Mode Simple 1-Clic : Entraîner l'IA &amp; Lancer les Trades Automatiquement
      </button>
    </div>

    <div class="strat-grid" id="strategyWidgetsGrid">
      <!-- WIDGET 1: STEP-BY-STEP ML TRAINING -->
      <div class="glass-card strat-widget" data-widget-id="w-grpo" draggable="false">
        <div class="card-hdr">
          <span class="card-title">Studio d'Apprentissage Pas-à-Pas</span>
          <div class="widget-reorder-bar">
            <button class="pill-btn" onclick="moveWidget(&quot;w-grpo&quot;, -1)">↑</button>
            <button class="pill-btn" onclick="moveWidget(&quot;w-grpo&quot;, 1)">↓</button>
          </div>
        </div>

        <div class="step-box">
          <div class="step-title">
            Étape 1 : Sélectionner la Paire
            <span class="info-tip" data-tip="Choisissez l'actif crypto ou marché sur lequel l'IA va rejouer l'historique des prix.">ⓘ</span>
          </div>
          <select id="grpoSymbolSelect" class="input-dark mono" style="width:100%"></select>
        </div>

        <div class="step-box">
          <div class="step-title">
            Étape 2 : Horizon &amp; Période (DD/MM/YYYY)
            <span class="info-tip" data-tip="Scalping = bougies 15m rapides ; Day Trading = 1h VWAP ; Swing = tendance 4h.">ⓘ</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <button class="pill-btn" onclick="setDatePresetDays(7)">7 Jours</button>
            <button class="pill-btn" onclick="setDatePresetDays(30)">30 Jours</button>
            <button class="pill-btn" onclick="setDatePresetDays(90)">90 Jours</button>
            <button class="pill-btn" onclick="setDatePresetDays(180)">180 Jours</button>
          </div>
          <div class="form-grid" style="margin-bottom:8px">
            <div>
              <label class="field-lbl">Horizon / Style</label>
              <select id="trainStyleSelect" class="input-dark" style="width:100%">
                <option value="scalping">Scalping (Ultra-Court · 15m)</option>
                <option value="daytrade">Day Trading (Session 1h)</option>
                <option value="longtrade">Long / Swing (Macro 4h)</option>
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
              <div>
                <label class="field-lbl">Début</label>
                <input id="grpoStartDate" class="input-dark mono" style="width:100%" placeholder="01/01/2026" />
              </div>
              <div>
                <label class="field-lbl">Fin</label>
                <input id="grpoEndDate" class="input-dark mono" style="width:100%" placeholder="16/11/2026" />
              </div>
            </div>
          </div>
        </div>

        <div class="step-box" style="margin-bottom:0">
          <div class="step-title">Étape 3 : Lancer l'Entraînement</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
            <button id="btnLaunchGrpo" class="pill-btn primary" onclick="launchGrpoTraining()">Lancer l'Entraînement IA (WFO + GRPO)</button>
            <button class="pill-btn" onclick="hotReloadGrpo()">Recharger Mémoire IA</button>
            <button class="pill-btn" onclick="runLegacyWfoTrain()">Audit Historique Multi-Paires</button>
          </div>
          <div class="progress-track"><div class="progress-fill" id="grpoProgressBar"></div></div>
          <div class="mono" style="font-size:11px;color:var(--fg-2)" id="grpoLiveStatus">Prêt pour un nouvel épisode d'entraînement.</div>
        </div>
      </div>

      <!-- WIDGET 2: HUMAN-READABLE AI TELEMETRY -->
      <div class="glass-card strat-widget" data-widget-id="w-rl-metrics" draggable="false">
        <div class="card-hdr">
          <span class="card-title">Performance &amp; Confiance de l'IA</span>
          <div class="widget-reorder-bar">
            <button class="pill-btn" onclick="moveWidget(&quot;w-rl-metrics&quot;, -1)">↑</button>
            <button class="pill-btn" onclick="moveWidget(&quot;w-rl-metrics&quot;, 1)">↓</button>
          </div>
        </div>
        <div id="rlMetricsHost">Chargement des métriques IA...</div>
      </div>

      <!-- WIDGET 3: EXTREME LEVERAGE (1x - 500x) & RISK GUARD -->
      <div class="glass-card strat-widget" data-widget-id="w-risk-params" draggable="false">
        <div class="card-hdr">
          <span class="card-title">Contrôle du Levier (1x – 500x) &amp; Sécurité</span>
          <div class="widget-reorder-bar">
            <button class="pill-btn" onclick="moveWidget(&quot;w-risk-params&quot;, -1)">↑</button>
            <button class="pill-btn" onclick="moveWidget(&quot;w-risk-params&quot;, 1)">↓</button>
          </div>
        </div>

        <div class="step-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div class="step-title" style="margin:0">
              Levier de Trading (1x à 500x)
              <span class="info-tip" data-tip="Le Directeur des Risques vérifie automatiquement le prix de liquidation (marge 15%) et réduit le levier si un stop est trop proche.">ⓘ</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <input id="cfgLev" type="number" min="1" max="500" class="input-dark mono" style="width:76px;text-align:center;font-weight:700" oninput="syncLevFromNumber(this.value)" />
              <span class="mono accent" style="font-weight:800">x</span>
            </div>
          </div>
          <input id="cfgLevSlider" type="range" min="1" max="500" value="5" class="lev-slider" oninput="syncLevFromSlider(this.value)" />
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
            <button class="pill-btn mono" onclick="setLevPreset(5)">5x</button>
            <button class="pill-btn mono" onclick="setLevPreset(25)">25x</button>
            <button class="pill-btn mono" onclick="setLevPreset(100)">100x</button>
            <button class="pill-btn mono" onclick="setLevPreset(250)">250x</button>
            <button class="pill-btn mono" style="border-color:var(--down-ring);color:#fda4af" onclick="setLevPreset(500)">500x MAX</button>
          </div>
        </div>

        <div class="form-grid">
          <div>
            <label class="field-lbl">Risque Max / Trade (%)</label>
            <input id="cfgRiskPct" type="number" step="0.1" min="0.2" max="10" class="input-dark mono" style="width:100%" />
          </div>
          <div>
            <label class="field-lbl">Perte Max Jour (%)</label>
            <input id="cfgDayLossPct" type="number" step="0.5" min="1" max="30" class="input-dark mono" style="width:100%" />
          </div>
          <div>
            <label class="field-lbl">Multiplicateur Stop ATR</label>
            <input id="cfgAtrMult" type="number" step="0.1" min="0.3" max="5" class="input-dark mono" style="width:100%" />
          </div>
          <div style="display:flex;align-items:flex-end">
            <button class="pill-btn primary" style="width:100%;justify-content:center" onclick="saveRiskSettings()">Sauvegarder Levier &amp; Risque</button>
          </div>
        </div>
      </div>

      <!-- WIDGET 4: REPORTS -->
      <div class="glass-card strat-widget" data-widget-id="w-reports" draggable="false">
        <div class="card-hdr">
          <span class="card-title">Rapports d'Optimisation &amp; Reviewer</span>
          <div class="widget-reorder-bar">
            <button class="pill-btn" onclick="moveWidget(&quot;w-reports&quot;, -1)">↑</button>
            <button class="pill-btn" onclick="moveWidget(&quot;w-reports&quot;, 1)">↓</button>
          </div>
        </div>
        <div id="trainingReportHost" style="font-size:12px;color:var(--fg-1);max-height:290px;overflow-y:auto"></div>
      </div>
    </div>
  </section>

  <!-- ==================== GLOBAL THEME SETTINGS DRAWER ==================== -->
  <aside id="themeDrawer" class="drawer">
    <div class="card-hdr">
      <span class="card-title">Moteur de Thèmes &amp; Style</span>
      <button class="pill-btn" onclick="closeDrawer(&quot;themeDrawer&quot;)">✕</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;font-size:12px">
      <div>
        <label class="field-lbl">Sélection Instantanée du Thème</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">
          <button class="pill-btn" onclick="applyThemePreset(&quot;obsidian&quot;)">Obsidian Quant</button>
          <button class="pill-btn" onclick="applyThemePreset(&quot;midnight&quot;)">Deep Midnight</button>
          <button class="pill-btn" onclick="applyThemePreset(&quot;emerald&quot;)">Matrix Emerald</button>
          <button class="pill-btn" onclick="applyThemePreset(&quot;amber&quot;)">Bloomberg Amber</button>
          <button class="pill-btn" onclick="applyThemePreset(&quot;cyberpunk&quot;)">Neon Cyberpunk</button>
        </div>
      </div>

      <div class="form-grid">
        <div>
          <label class="field-lbl">Couleur Accent</label>
          <input id="prefAccent" type="color" value="#38bdf8" style="width:100%;height:36px;background:transparent;border:none;cursor:pointer" onchange="updateThemeColor(&quot;accent&quot;, this.value)" />
        </div>
        <div>
          <label class="field-lbl">Couleur Profit (UP)</label>
          <input id="prefUp" type="color" value="#10b981" style="width:100%;height:36px;background:transparent;border:none;cursor:pointer" onchange="updateThemeColor(&quot;up&quot;, this.value)" />
        </div>
      </div>

      <div>
        <label class="field-lbl">Transparence Verre (<span id="glassValLbl">78</span>%)</label>
        <input id="prefGlassAlpha" type="range" min="35" max="95" value="78" style="width:100%" oninput="updateGlassAlpha(this.value)" />
      </div>

      <div style="border-top:1px solid var(--ring-1);padding-top:12px">
        <label class="field-lbl">Clé API LLM Agents (Optionnel)</label>
        <div style="display:flex;gap:6px">
          <input id="llmKeyInput" type="password" class="input-dark" style="flex:1" placeholder="sk-... ou AIza..." />
          <button class="pill-btn primary" onclick="saveLlmApiKey()">Activer</button>
        </div>
      </div>
    </div>
  </aside>

  <!-- ==================== NOTION TICKET INSPECTOR DRAWER ==================== -->
  <aside id="journalDrawer" class="drawer">
    <div class="card-hdr">
      <span class="card-title" id="jDrawerTitle">Fiche Ticket</span>
      <button class="pill-btn" onclick="closeDrawer(&quot;journalDrawer&quot;)">✕</button>
    </div>
    <div id="jDrawerBody" style="display:flex;flex-direction:column;gap:10px;font-size:12px"></div>
  </aside>

  <!-- ==================== MOBILE MT5 CLOUD & TELEGRAM DRAWER ==================== -->
  <aside id="mobileDrawer" class="drawer" style="width:450px">
    <div class="card-hdr">
      <span class="card-title">📱 Connexion Mobile MT5 (Sans PC) &amp; Bots Telegram</span>
      <button class="pill-btn" onclick="closeDrawer(&quot;mobileDrawer&quot;)">✕</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:16px;font-size:12px">
      <!-- CARTE 1: BOTS TELEGRAM (100% GRATUIT) -->
      <div class="step-box" style="margin:0">
        <div class="step-title">1. Bots Telegram sur Téléphone (100 % Gratuit · En Direct)</div>
        <div style="font-size:11px;color:var(--fg-2);line-height:1.45;margin-bottom:10px">
          1. Dans Telegram, écrivez <strong>/newbot</strong> à <strong>@BotFather</strong> pour obtenir votre Token.<br>
          2. Collez le token ci-dessous, puis envoyez <strong>salut</strong> à votre bot sur votre téléphone.<br>
          3. Cliquez sur <strong>Détecter Chat ID</strong> : vos 8 agents vous écrivent et exécutent vos ordres en direct !
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">
          <div>
            <label class="field-lbl">Token Bot Principal (Chef de Salle · Relaie aussi les 8 agents)</label>
            <input id="tgTokLead" type="password" class="input-dark mono" style="width:100%" placeholder="123456789:AAF..." />
          </div>
          <div class="form-grid">
            <div>
              <label class="field-lbl">Chat ID (ou Groupe ID)</label>
              <input id="tgChatIdInput" class="input-dark mono" style="width:100%" placeholder="Détection auto ou -100..." />
            </div>
            <div style="display:flex;align-items:flex-end">
              <button class="pill-btn primary" style="width:100%;justify-content:center" onclick="detectTelegramChatId()">🔍 Détecter Chat ID</button>
            </div>
          </div>

          <details style="background:rgba(255,255,255,0.02);padding:8px 10px;border-radius:10px;border:1px solid var(--ring-1)">
            <summary style="cursor:pointer;font-size:11px;color:var(--accent)">Optionnel : 7 autres Bots dédiés (1 bot par agent)</summary>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
              <input id="tgTokAnalyst" type="password" class="input-dark mono" placeholder="Token Analyste" />
              <input id="tgTokStrategist" type="password" class="input-dark mono" placeholder="Token Stratège" />
              <input id="tgTokRisk" type="password" class="input-dark mono" placeholder="Token Risques" />
              <input id="tgTokExecution" type="password" class="input-dark mono" placeholder="Token Exécution" />
              <input id="tgTokReviewer" type="password" class="input-dark mono" placeholder="Token Reviewer" />
              <input id="tgTokSentinel" type="password" class="input-dark mono" placeholder="Token Sentinel" />
              <input id="tgTokHunter" type="password" class="input-dark mono" placeholder="Token Liquidity Hunter" />
            </div>
          </details>

          <button class="pill-btn primary" onclick="saveAndTestTelegram()">📨 Sauvegarder &amp; Envoyer Test sur Téléphone</button>
          <div id="tgStatusMsg" class="mono" style="font-size:11px;color:var(--fg-2)">Statut Telegram : Mode local</div>
        </div>
      </div>

      <!-- CARTE 2: PASSERELLE MT5 100% GRATUITE -->
      <div class="step-box" style="margin:0">
        <div class="step-title">2. MetaTrader 5 sur Téléphone (Pont Local 100 % Gratuit)</div>
        <div style="font-size:11px;color:var(--fg-2);line-height:1.45;margin-bottom:10px">
          1. Téléchargez notre robot pont <strong>TradingFloorBridge.mq5</strong> ci-dessous (0 €, sans abonnement).<br>
          2. Placez-le dans MT5 PC → <code>MQL5/Experts</code>, autorisez <code>http://localhost:4080</code> dans <em>Outils → Options → Expert Advisors</em> et glissez-le sur un graphique.<br>
          3. Tous les trades s&#39;affichent aussitôt dans votre appli <strong>MT5 Téléphone</strong> !
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
          <div style="flex:1">
            <label class="field-lbl">Lots par Trade MT5</label>
            <input id="mt5LotsInput" type="number" step="0.01" min="0.01" max="50" value="0.05" class="input-dark mono" style="width:100%" />
          </div>
          <div style="display:flex;align-items:flex-end;height:52px">
            <a href="/api/mt5-bridge/ea.mq5" download="TradingFloorBridge.mq5" class="pill-btn primary" style="text-decoration:none">📥 Télécharger TradingFloorBridge.mq5</a>
          </div>
        </div>
        <button id="btnMt5SyncNow" class="pill-btn auto-on" style="width:100%;justify-content:center;margin-bottom:8px" onclick="syncMt5Now()">🔄 Synchroniser Capital &amp; Trades MT5</button>
        <div id="mt5LocalBridgeStatus" class="mono" style="font-size:11px;color:var(--fg-2);margin-bottom:10px">Statut Pont Local : En attente de mt5_state.json...</div>

        <details style="background:rgba(255,255,255,0.02);padding:8px 10px;border-radius:10px;border:1px solid var(--ring-1)">
          <summary style="cursor:pointer;font-size:11px;color:var(--fg-2)">Optionnel : Mode Cloud MetaApi (sans PC)</summary>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input id="mt5EnabledChk" type="checkbox" />
              <strong>Activer MetaApi Cloud</strong>
            </label>
            <input id="mt5TokenInput" type="password" class="input-dark mono" style="width:100%" placeholder="MetaApi Auth Token" />
            <input id="mt5AccountIdInput" class="input-dark mono" style="width:100%" placeholder="MetaApi Account ID (optionnel)" />
            <div class="form-grid">
              <input id="mt5LoginInput" class="input-dark mono" placeholder="MT5 Login" />
              <input id="mt5PassInput" type="password" class="input-dark mono" placeholder="Mot de passe MT5" />
              <input id="mt5ServerInput" class="input-dark mono" style="grid-column:span 2" placeholder="Serveur (ex: MetaQuotes-Demo)" />
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              <button class="pill-btn primary" onclick="saveAndTestMt5()">🔗 Connecter MT5 Cloud</button>
              <button class="pill-btn" onclick="sendTestMt5Trade()">🚀 Trade Test Cloud</button>
            </div>
            <div id="mt5StatusMsg" class="mono" style="font-size:11px;color:var(--fg-2)">Statut : Pont local prêt (/api/mt5-bridge/poll)</div>
          </div>
        </details>
      </div>
    </div>
  </aside>

  <script>
    var ASSET_CATALOG = [
      { cat: 'Crypto (Binance / Bybit Live)', items: [
        { s: 'BTCUSDT', l: 'Bitcoin (BTC)' }, { s: 'ETHUSDT', l: 'Ethereum (ETH)' },
        { s: 'SOLUSDT', l: 'Solana (SOL)' }, { s: 'BNBUSDT', l: 'BNB (BNB)' },
        { s: 'XRPUSDT', l: 'XRP (XRP)' }, { s: 'AVAXUSDT', l: 'Avalanche (AVAX)' },
        { s: 'DOGEUSDT', l: 'Dogecoin (DOGE)' }, { s: 'LINKUSDT', l: 'Chainlink (LINK)' }
      ]},
      { cat: 'Futures & Indices', items: [
        { s: 'NQ1!', l: 'Nasdaq 100 (NQ1!)' }, { s: 'ES1!', l: 'S&P 500 (ES1!)' },
        { s: 'YM1!', l: 'Dow Jones (YM1!)' }, { s: 'FDAX1!', l: 'DAX 40 (FDAX1!)' }
      ]},
      { cat: 'Forex (Devises)', items: [
        { s: 'EURUSD', l: 'EUR/USD' }, { s: 'GBPUSD', l: 'GBP/USD' },
        { s: 'USDJPY', l: 'USD/JPY' }, { s: 'USDCHF', l: 'USD/CHF' }
      ]},
      { cat: 'Matières Premières', items: [
        { s: 'XAUUSD', l: 'Or (XAU/USD)' }, { s: 'XAGUSD', l: 'Argent (XAG/USD)' },
        { s: 'USOIL', l: 'Pétrole WTI (USOIL)' }, { s: 'NGAS', l: 'Gaz Naturel (NGAS)' }
      ]},
      { cat: 'Actions US', items: [
        { s: 'NVDA', l: 'NVIDIA (NVDA)' }, { s: 'AAPL', l: 'Apple (AAPL)' },
        { s: 'TSLA', l: 'Tesla (TSLA)' }, { s: 'MSFT', l: 'Microsoft (MSFT)' },
        { s: 'AMZN', l: 'Amazon (AMZN)' }
      ]}
    ];

    var AGENTS = [
      { id: 'lead', name: 'Chef de Salle', short: 'CL', color: '#38bdf8' },
      { id: 'analyst', name: 'Analyste', short: 'AN', color: '#a855f7' },
      { id: 'strategist', name: 'Stratège', short: 'ST', color: '#f59e0b' },
      { id: 'risk', name: 'Risques', short: 'RM', color: '#f43f5e' },
      { id: 'execution', name: 'Exécution', short: 'EX', color: '#10b981' },
      { id: 'reviewer', name: 'Reviewer', short: 'RV', color: '#60a5fa' },
      { id: 'sentinel', name: 'The Sentinel', short: 'SN', color: '#14b8a6' },
      { id: 'hunter', name: 'Liquidity Hunter', short: 'LH', color: '#f97316' }
    ];

    var THEME_PRESETS = {
      obsidian:  { theme: 'obsidian',  bg0: '#03060c', accent: '#38bdf8', up: '#10b981', down: '#f43f5e', alpha: 78, glassRgb: '11, 17, 30' },
      midnight:  { theme: 'midnight',  bg0: '#06071b', accent: '#a78bfa', up: '#2dd4bf', down: '#fb7185', alpha: 80, glassRgb: '16, 19, 54' },
      emerald:   { theme: 'emerald',   bg0: '#020c08', accent: '#34d399', up: '#10b981', down: '#ef4444', alpha: 80, glassRgb: '6, 24, 18' },
      amber:     { theme: 'amber',     bg0: '#0c0802', accent: '#f59e0b', up: '#22c55e', down: '#f43f5e', alpha: 82, glassRgb: '24, 17, 7' },
      cyberpunk: { theme: 'cyberpunk', bg0: '#090312', accent: '#ec4899', up: '#22d3ee', down: '#f43f5e', alpha: 80, glassRgb: '22, 8, 42' }
    };

    var STRATEGY_LABELS = {
      HFT_OrderFlow_Imbalance: 'Scalping Carnet d Ordres (OFI)',
      Session_VWAP_Reversion: 'Retour sur Prix Moyen (VWAP)',
      Macro_FVG_Mitigation: 'Déséquilibres Macro (FVG)',
      breakout: 'Cassure de Canal',
      fade: 'Contre-Tendance Excès'
    };

    var deskState = null;
    var rlMemory = null;
    var currentTab = 'desk';
    var activeChannel = 'floor-general';
    var agentFilter = null;
    var equityRange = 'ALL';
    var ledgerMode = 'open';
    var ledgerDir = 'ALL';
    var gridLocked = true;
    var calYear = new Date().getUTCFullYear();
    var calMonth = new Date().getUTCMonth();

    var lwChart = null;
    var lwCandleSeries = null;
    var lwVolSeries = null;
    var lwPriceLines = [];
    var lwResizeObs = null;

    var eqChart = null;
    var eqAreaSeries = null;
    var eqResizeObs = null;

    var scene3d = null;
    var camera3d = null;
    var renderer3d = null;
    var ambient3d = null;
    var spot3d = null;
    var coreMesh3d = null;
    var ring1_3d = null;
    var ring2_3d = null;
    var floorRing3d = null;
    var pts3d = null;
    var agentRigs = {};
    var pulseArcs = [];
    var lastPulseNonce = '';
    var raycaster3d = null;
    var pointer3d = null;
    var draggedWidgetId = null;

    function currencySym() {
      return deskState && deskState.mt5Live && deskState.mt5Live.currency === 'EUR' ? '€' : '$';
    }
    function fmtUsd(v, d) {
      var n = Number(v || 0);
      var sign = n < 0 ? '-' : '';
      return sign + currencySym() + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    }
    function fmtSignedUsd(v, d) {
      var n = Number(v || 0);
      return (n >= 0 ? '+' : '-') + currencySym() + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d || 2, maximumFractionDigits: d || 2 });
    }
    function fmtPx(v) {
      var n = Number(v || 0);
      if (!n) return '--';
      if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (n >= 10) return n.toFixed(3);
      return n.toFixed(4);
    }

    function tapePriceOf(sym, fallback) {
      if (!deskState || !deskState.tape) return fallback;
      var row = deskState.tape.find(function (r) { return r.symbol === sym; });
      return row && row.px > 0 ? row.px : fallback;
    }

    // ==================== GLOBAL THEME ENGINE ====================
    function getCurrentThemePrefs() {
      try {
        var raw = localStorage.getItem('tf_v3_theme_prefs');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return Object.assign({}, THEME_PRESETS.obsidian);
    }

    function applyThemeValues(p, persist) {
      var name = p.theme || 'obsidian';
      document.documentElement.setAttribute('data-theme', name);
      var r = document.documentElement.style;
      if (p.bg0) r.setProperty('--bg-0', p.bg0);
      if (p.accent) r.setProperty('--accent', p.accent);
      if (p.up) r.setProperty('--up', p.up);
      if (p.down) r.setProperty('--down', p.down);
      if (p.accent) {
        r.setProperty('--accent-bg', hexToRgba(p.accent, 0.16));
      }
      if (p.up) {
        r.setProperty('--up-bg', hexToRgba(p.up, 0.15));
        r.setProperty('--up-ring', hexToRgba(p.up, 0.42));
      }
      if (p.alpha) {
        var rgb = p.glassRgb || '11, 17, 30';
        var a = Number(p.alpha) / 100;
        r.setProperty('--surface-glass', 'rgba(' + rgb + ', ' + a.toFixed(2) + ')');
        var lbl = document.getElementById('glassValLbl');
        if (lbl) lbl.textContent = String(p.alpha);
        var sl = document.getElementById('prefGlassAlpha');
        if (sl) sl.value = String(p.alpha);
      }
      var ac = document.getElementById('prefAccent');
      if (ac && p.accent) ac.value = p.accent;
      var upEl = document.getElementById('prefUp');
      if (upEl && p.up) upEl.value = p.up;
      var thChip = document.getElementById('deskThemeChip');
      if (thChip) thChip.textContent = 'THÈME : ' + String(name).toUpperCase();

      if (persist !== false) {
        try { localStorage.setItem('tf_v3_theme_prefs', JSON.stringify(p)); } catch (e) {}
      }
      sync3dTheme(p);
      if (eqChart && p.up) {
        try { eqAreaSeries.applyOptions({ lineColor: p.up, topColor: hexToRgba(p.up, 0.34), bottomColor: hexToRgba(p.up, 0.02) }); } catch (e) {}
      }
      if (deskState) renderAll();
    }

    function hexToRgba(hex, alpha) {
      var clean = String(hex || '#38bdf8').replace('#', '');
      if (clean.length !== 6) return 'rgba(56,189,248,' + alpha + ')';
      var r = parseInt(clean.slice(0, 2), 16);
      var g = parseInt(clean.slice(2, 4), 16);
      var b = parseInt(clean.slice(4, 6), 16);
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    function applyThemePreset(name) {
      var p = THEME_PRESETS[name] || THEME_PRESETS.obsidian;
      document.documentElement.style.removeProperty('--bg-0');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--up');
      document.documentElement.style.removeProperty('--down');
      applyThemeValues(Object.assign({}, p), true);
    }

    function updateThemeColor(key, val) {
      var cur = getCurrentThemePrefs();
      cur[key] = val;
      applyThemeValues(cur, true);
    }

    function updateGlassAlpha(val) {
      var cur = getCurrentThemePrefs();
      cur.alpha = Number(val);
      applyThemeValues(cur, true);
    }

    // ==================== NAVIGATION & PANIC CONTROLS ====================
    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-tab') === tab);
      });
      document.querySelectorAll('.view-panel').forEach(function (v) {
        v.classList.toggle('active', v.id === 'view-' + tab);
      });
      if (tab === 'desk') {
        document.body.classList.add('stealth-desk');
        resize3dCanvas();
      } else {
        document.body.classList.remove('stealth-desk');
      }
      if (tab === 'charts') {
        setTimeout(function () { initOrRefreshLwChart(); }, 60);
      }
      if (tab === 'journal') {
        setTimeout(function () { renderJournalView(); renderEquityChart(); }, 60);
      }
      if (tab === 'strategy') {
        fetchRlMemory();
      }
    }

    function togglePinNav() { document.body.classList.toggle('nav-pinned'); }
    function openDrawer(id) { document.getElementById(id).classList.add('open'); }
    function closeDrawer(id) { document.getElementById(id).classList.remove('open'); }

    function openPanicModal() {
      var openCnt = deskState ? (deskState.tickets || []).filter(function (t) { return t.status === 'open'; }).length : 0;
      document.getElementById('panicModalDesc').innerHTML =
        'Cette action va diffuser <strong>EMERGENCY_LIQUIDATE_ALL</strong> et clôturer immédiatement <strong>' + openCnt + ' position(s) ouverte(s)</strong> au prix du marché.';
      document.getElementById('panicModal').classList.add('open');
    }
    function closePanicModal() {
      document.getElementById('panicModal').classList.remove('open');
    }
    async function confirmEmergencyLiquidate() {
      closePanicModal();
      await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'EMERGENCY_LIQUIDATE_ALL' })
      });
    }
    async function toggleManualHalt() {
      var isHalted = Boolean(deskState && deskState.halted);
      await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: isHalted ? 'RESUME_DESK' : 'EXECUTION_HALTED_MANUAL' })
      });
    }

    // ==================== 3D WEBGL COMMAND CENTER ====================
    function makeNameplateTexture(title, statusText, accentHex) {
      var canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(7, 12, 24, 0.88)';
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(10, 10, 492, 140, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = accentHex;
      ctx.font = 'bold 34px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 66);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 26px JetBrains Mono, monospace';
      ctx.fillText(statusText, 256, 114);

      var tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    }

    function makeScreenTexture(accentHex) {
      var c = document.createElement('canvas');
      c.width = 256;
      c.height = 160;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#040914';
      ctx.fillRect(0, 0, 256, 160);
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      var y = 95;
      for (var x = 10; x < 246; x += 14) {
        y = Math.max(25, Math.min(135, y + (Math.sin(x * 0.13) * 26)));
        if (x === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (var bx = 18; bx < 240; bx += 22) {
        var h = 15 + ((bx * 7) % 45);
        ctx.fillStyle = bx % 44 === 18 ? '#10b981' : '#f43f5e';
        ctx.fillRect(bx, 145 - h, 10, h);
      }
      var tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    function init3dDesk() {
      var host = document.getElementById('canvas3dWrap');
      if (!host || typeof THREE === 'undefined') return;
      var w = host.clientWidth || window.innerWidth;
      var h = host.clientHeight || window.innerHeight;

      scene3d = new THREE.Scene();
      scene3d.fog = new THREE.FogExp2(0x03060c, 0.026);

      camera3d = new THREE.PerspectiveCamera(46, w / h, 0.1, 220);
      camera3d.position.set(0, 10.5, 18.5);
      camera3d.lookAt(0, 0.4, 0);

      renderer3d = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer3d.setSize(w, h);
      renderer3d.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer3d.shadowMap.enabled = true;
      renderer3d.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer3d.toneMapping = THREE.ACESFilmicToneMapping;
      renderer3d.toneMappingExposure = 1.25;
      host.innerHTML = '';
      host.appendChild(renderer3d.domElement);

      ambient3d = new THREE.AmbientLight(0x94a3b8, 0.55);
      scene3d.add(ambient3d);

      spot3d = new THREE.SpotLight(0x38bdf8, 3.2, 48, Math.PI / 3.4, 0.45, 1.2);
      spot3d.position.set(0, 16, 4);
      spot3d.castShadow = true;
      spot3d.shadow.mapSize.width = 1024;
      spot3d.shadow.mapSize.height = 1024;
      scene3d.add(spot3d);

      var rimLight = new THREE.PointLight(0xa855f7, 1.8, 30);
      rimLight.position.set(-8, 6, -8);
      scene3d.add(rimLight);

      // Floor platform + glowing concentric rings
      var floorGeo = new THREE.CylinderGeometry(11.5, 12.2, 0.35, 64);
      var floorMat = new THREE.MeshStandardMaterial({ color: 0x09101d, metalness: 0.72, roughness: 0.32 });
      var floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = -1.7;
      floor.receiveShadow = true;
      scene3d.add(floor);

      var grid = new THREE.GridHelper(36, 36, 0x1e3a5f, 0x0b1526);
      grid.position.y = -1.52;
      scene3d.add(grid);

      floorRing3d = new THREE.Mesh(
        new THREE.TorusGeometry(6.6, 0.05, 16, 96),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
      );
      floorRing3d.rotation.x = Math.PI / 2;
      floorRing3d.position.y = -1.5;
      scene3d.add(floorRing3d);

      // Central Quantum Gyroscope Core
      coreMesh3d = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.1, 2),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.4, metalness: 0.3, roughness: 0.15, wireframe: false })
      );
      coreMesh3d.position.y = 1.2;
      coreMesh3d.castShadow = true;
      scene3d.add(coreMesh3d);

      var coreGlow = new THREE.Mesh(
        new THREE.SphereGeometry(1.75, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending })
      );
      coreGlow.position.y = 1.2;
      scene3d.add(coreGlow);

      ring1_3d = new THREE.Mesh(
        new THREE.TorusGeometry(2.05, 0.04, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
      );
      ring1_3d.position.y = 1.2;
      scene3d.add(ring1_3d);

      ring2_3d = new THREE.Mesh(
        new THREE.TorusGeometry(2.55, 0.03, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.55 })
      );
      ring2_3d.position.y = 1.2;
      scene3d.add(ring2_3d);

      // 8 Detailed Agent Workstations (Octagon around Central Core)
      var radius = 7.4;
      AGENTS.forEach(function (ag, idx) {
        var ang = (idx / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
        var x = Math.cos(ang) * radius;
        var z = Math.sin(ang) * radius;
        var col = new THREE.Color(ag.color);

        var station = new THREE.Group();
        station.position.set(x, -1.5, z);
        station.lookAt(0, -1.5, 0);

        // Desk console
        var deskMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.72, 1.05),
          new THREE.MeshStandardMaterial({ color: 0x111a2b, metalness: 0.6, roughness: 0.35 })
        );
        deskMesh.position.set(0, 0.42, 0.55);
        deskMesh.castShadow = true;
        deskMesh.receiveShadow = true;
        station.add(deskMesh);

        // Triple curved monitor screens with live glowing textures
        var scrTex = makeScreenTexture(ag.color);
        var scrMat = new THREE.MeshStandardMaterial({ map: scrTex, emissive: col, emissiveIntensity: 0.75, roughness: 0.2 });
        [-0.75, 0, 0.75].forEach(function (ox, si) {
          var scr = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.46, 0.05), scrMat);
          scr.position.set(ox, 1.05, 0.45 + (si === 1 ? 0.08 : -0.04));
          scr.rotation.y = si === 0 ? -0.35 : si === 2 ? 0.35 : 0;
          station.add(scr);
        });

        // Stylized Agent Figure seated behind console
        var avatar = new THREE.Group();
        avatar.position.set(0, 0.75, -0.32);

        var torso = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.36, 0.78, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.5 })
        );
        torso.castShadow = true;
        avatar.add(torso);

        var head = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 18, 18),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.3 })
        );
        head.position.y = 0.58;
        head.castShadow = true;
        avatar.add(head);

        var visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.10, 0.18),
          new THREE.MeshBasicMaterial({ color: col })
        );
        visor.position.set(0, 0.59, 0.16);
        avatar.add(visor);

        // Clickable invisible hitbox around station
        var hitSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.45, 12, 12),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitSphere.position.set(0, 1.0, 0);
        hitSphere.userData = { agentId: ag.id };
        station.add(hitSphere);
        station.add(avatar);

        // Ground bloom status ring
        var padRing = new THREE.Mesh(
          new THREE.RingGeometry(1.15, 1.32, 36),
          new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
        );
        padRing.rotation.x = -Math.PI / 2;
        padRing.position.y = 0.03;
        station.add(padRing);

        // Floating Holographic Nameplate Sprite
        var spTex = makeNameplateTexture(ag.name.toUpperCase(), 'EN VEILLE', ag.color);
        var spMat = new THREE.SpriteMaterial({ map: spTex, transparent: true });
        var sprite = new THREE.Sprite(spMat);
        sprite.position.set(0, 2.35, 0);
        sprite.scale.set(2.8, 0.88, 1);
        station.add(sprite);

        // Agent 7 (Sentinel) Dynamic Emissive LED Pillar
        var sentinelLed = null;
        if (ag.id === 'sentinel') {
          var ledMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.8 });
          sentinelLed = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 18), ledMat);
          sentinelLed.position.set(0, 1.72, 0.45);
          station.add(sentinelLed);
        }

        // Agent 8 (Liquidity Hunter) 3D Orderbook Depth Heat Bars
        var l2Bars = [];
        if (ag.id === 'hunter') {
          for (var bi = 0; bi < 8; bi++) {
            var isBid = bi < 4;
            var barMat = new THREE.MeshBasicMaterial({ color: isBid ? 0x10b981 : 0xf43f5e, transparent: true, opacity: 0.88 });
            var bar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), barMat);
            bar.position.set(-0.7 + bi * 0.2, 1.55, 0.45);
            station.add(bar);
            l2Bars.push(bar);
          }
        }

        scene3d.add(station);
        agentRigs[ag.id] = {
          station: station,
          avatar: avatar,
          padRing: padRing,
          hitSphere: hitSphere,
          sprite: sprite,
          sentinelLed: sentinelLed,
          l2Bars: l2Bars,
          worldPos: new THREE.Vector3(x, 0.2, z),
          lastLabel: 'EN VEILLE'
        };
      });

      // Ambient holographic particle cloud
      var pGeo = new THREE.BufferGeometry();
      var pCount = 260;
      var pos = new Float32Array(pCount * 3);
      for (var i = 0; i < pCount; i++) {
        var a = Math.random() * Math.PI * 2;
        var rad = 1.6 + Math.random() * 9.5;
        pos[i * 3] = Math.cos(a) * rad;
        pos[i * 3 + 1] = -0.8 + Math.random() * 5.2;
        pos[i * 3 + 2] = Math.sin(a) * rad;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pts3d = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.09, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending })
      );
      scene3d.add(pts3d);

      raycaster3d = new THREE.Raycaster();
      pointer3d = new THREE.Vector2();

      var drag = false;
      var prevX = 0;
      var prevY = 0;
      var yaw = 0.35;
      var pitch = 0.52;
      var zoom = 19.5;

      renderer3d.domElement.addEventListener('mousedown', function (e) { drag = true; prevX = e.clientX; prevY = e.clientY; });
      window.addEventListener('mouseup', function () { drag = false; });
      window.addEventListener('mousemove', function (e) {
        if (!drag) return;
        yaw -= (e.clientX - prevX) * 0.006;
        pitch = Math.max(0.18, Math.min(1.22, pitch + (e.clientY - prevY) * 0.005));
        prevX = e.clientX;
        prevY = e.clientY;
      });
      renderer3d.domElement.addEventListener('wheel', function (e) {
        zoom = Math.max(10, Math.min(32, zoom + e.deltaY * 0.015));
      });
      renderer3d.domElement.addEventListener('click', function (e) {
        if (!raycaster3d || !camera3d) return;
        var rect = renderer3d.domElement.getBoundingClientRect();
        pointer3d.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer3d.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster3d.setFromCamera(pointer3d, camera3d);
        var targets = Object.keys(agentRigs).map(function (k) { return agentRigs[k].hitSphere; });
        var hits = raycaster3d.intersectObjects(targets);
        if (hits.length) {
          show3dAgentInspector(hits[0].object.userData.agentId);
        } else {
          document.getElementById('deskNodeInspector').style.display = 'none';
        }
      });

      var clk = 0;
      function animate3d() {
        requestAnimationFrame(animate3d);
        clk += 0.016;
        if (currentTab !== 'desk') return;

        var camAngle = yaw + Math.sin(clk * 0.18) * 0.08;
        camera3d.position.x = Math.sin(camAngle) * Math.cos(pitch) * zoom;
        camera3d.position.y = Math.sin(pitch) * zoom;
        camera3d.position.z = Math.cos(camAngle) * Math.cos(pitch) * zoom;
        camera3d.lookAt(0, 0.3, 0);

        coreMesh3d.rotation.y += 0.012;
        coreMesh3d.rotation.x += 0.006;
        ring1_3d.rotation.x += 0.014;
        ring1_3d.rotation.y += 0.008;
        ring2_3d.rotation.y -= 0.011;
        ring2_3d.rotation.z += 0.007;
        pts3d.rotation.y += 0.0014;

        AGENTS.forEach(function (ag, idx) {
          var rig = agentRigs[ag.id];
          if (!rig) return;
          var act = deskState && deskState.agentActivity && deskState.agentActivity[ag.id];
          var busy = act && act.status && act.status !== 'idle';
          rig.avatar.position.y = 0.75 + Math.sin(clk * (busy ? 5.5 : 1.6) + idx) * (busy ? 0.06 : 0.02);
          rig.padRing.scale.setScalar(busy ? 1.18 + Math.sin(clk * 6) * 0.08 : 1.0);
          rig.padRing.material.opacity = busy ? 0.95 : 0.45;

          if (rig.sentinelLed && deskState && deskState.sentinel) {
            var st = deskState.sentinel;
            var ledColor = (st.latencyHalted || deskState.halted) ? 0xf43f5e : (st.rollingRttMs >= 100 ? 0xfacc15 : 0x10b981);
            rig.sentinelLed.material.color.setHex(ledColor);
            rig.sentinelLed.material.emissive.setHex(ledColor);
            var blink = (st.latencyHalted || deskState.halted) ? (0.5 + 1.8 * Math.abs(Math.sin(clk * 8))) : 1.6;
            rig.sentinelLed.material.emissiveIntensity = blink;
          }

          if (rig.l2Bars && rig.l2Bars.length && deskState && deskState.liquidityHunter && deskState.liquidityHunter.heatBars) {
            var hb = deskState.liquidityHunter.heatBars;
            for (var li = 0; li < rig.l2Bars.length; li++) {
              var scaleY = Math.max(0.2, Number(hb[li] || 0.3) * 1.45);
              rig.l2Bars[li].scale.y = scaleY;
              rig.l2Bars[li].position.y = 1.4 + scaleY * 0.25;
            }
          }
        });

        // Animate inter-agent pulses
        for (var pi = pulseArcs.length - 1; pi >= 0; pi--) {
          var p = pulseArcs[pi];
          p.t += 0.022;
          if (p.t >= 1) {
            scene3d.remove(p.dot);
            scene3d.remove(p.line);
            pulseArcs.splice(pi, 1);
          } else {
            p.dot.position.copy(p.curve.getPoint(p.t));
          }
        }

        renderer3d.render(scene3d, camera3d);
      }
      animate3d();
      window.addEventListener('resize', resize3dCanvas);
    }

    function sync3dTheme(prefs) {
      if (!scene3d) return;
      try {
        if (prefs.bg0 && scene3d.fog) scene3d.fog.color.set(prefs.bg0);
        if (prefs.accent) {
          if (spot3d) spot3d.color.set(prefs.accent);
          if (floorRing3d) floorRing3d.material.color.set(prefs.accent);
          if (ring1_3d) ring1_3d.material.color.set(prefs.accent);
          if (pts3d) pts3d.material.color.set(prefs.accent);
        }
        if (prefs.up && ring2_3d) ring2_3d.material.color.set(prefs.up);
      } catch (e) {}
    }

    function update3dAgentSpritesAndPulses() {
      if (!deskState || !scene3d) return;
      AGENTS.forEach(function (ag) {
        var rig = agentRigs[ag.id];
        if (!rig) return;
        var act = deskState.agentActivity && deskState.agentActivity[ag.id];
        var lbl = (act && act.status ? act.status : 'idle').toUpperCase();
        if (lbl !== rig.lastLabel) {
          rig.lastLabel = lbl;
          rig.sprite.material.map.dispose();
          rig.sprite.material.map = makeNameplateTexture(ag.name.toUpperCase(), lbl, ag.color);
          rig.sprite.material.needsUpdate = true;
        }
      });

      var pulses = deskState.pulses || [];
      if (pulses.length && pulses[0].id !== lastPulseNonce) {
        lastPulseNonce = pulses[0].id;
        var fromRig = agentRigs[pulses[0].from];
        var toRig = agentRigs[pulses[0].to];
        if (fromRig && toRig) {
          var mid = fromRig.worldPos.clone().add(toRig.worldPos).multiplyScalar(0.5);
          mid.y = 3.6;
          var curve = new THREE.QuadraticBezierCurve3(fromRig.worldPos.clone(), mid, toRig.worldPos.clone());
          var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
          var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 }));
          var dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee })
          );
          scene3d.add(line);
          scene3d.add(dot);
          pulseArcs.push({ line: line, dot: dot, curve: curve, t: 0 });
        }
      }
    }

    function resize3dCanvas() {
      var host = document.getElementById('canvas3dWrap');
      if (!host || !renderer3d || !camera3d) return;
      var w = host.clientWidth || window.innerWidth;
      var h = host.clientHeight || window.innerHeight;
      camera3d.aspect = w / h;
      camera3d.updateProjectionMatrix();
      renderer3d.setSize(w, h);
    }

    function show3dAgentInspector(agentId) {
      var el = document.getElementById('deskNodeInspector');
      var ag = AGENTS.find(function (a) { return a.id === agentId; });
      if (!ag || !el) return;
      var act = deskState && deskState.agentActivity && deskState.agentActivity[agentId];
      el.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<strong style="color:' + ag.color + '">' + ag.name + '</strong>' +
        '<span class="mono" style="font-size:10px;color:var(--fg-2)">' + (act ? act.status : 'idle') + '</span></div>' +
        '<div style="color:var(--fg-1)">' + (act && act.label ? act.label : 'En veille stratégique') + '</div>';
      el.style.display = 'block';
    }

    // ==================== COMMANDS & ASSETS ====================
    async function sendCmd(text) {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
    }

    function submitChatInput() {
      var inp = document.getElementById('chatCmdInput');
      var txt = (inp.value || '').trim();
      if (!txt) return;
      inp.value = '';
      sendCmd(txt);
    }

    function toggleExecutionMode() {
      var isAuto = deskState && deskState.settings && (deskState.settings.executionMode === 'auto' || Boolean(deskState.settings.autoPaperScalp));
      sendCmd(isAuto ? 'mode confirmation' : 'mode auto');
    }

    function toggleAssetDropdown() {
      var menu = document.getElementById('assetDropdownMenu');
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }

    async function applySelectedAssets() {
      var chks = Array.from(document.querySelectorAll('.asset-chk:checked')).map(function (c) { return c.value; });
      if (!chks.length) return;
      document.getElementById('assetDropdownMenu').style.display = 'none';
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ settings: { symbols: chks } })
      });
      sendCmd('scan');
    }

    // ==================== SALON ET CHAT ====================
    function selectChatChannel(ch) {
      activeChannel = ch;
      document.querySelectorAll('.chan-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-chan') === ch);
      });
      document.getElementById('activeChanTitle').textContent = '# ' + ch;
      renderChat();
    }

    function classifyMessageChannel(m) {
      var txt = (m.text || '').toUpperCase();
      if (m.speaker === 'sentinel' || txt.indexOf('SYS_OPS') >= 0 || txt.indexOf('LATENCY') >= 0 || txt.indexOf('TOKENBUCKET') >= 0) {
        return 'sys-ops';
      }
      if (m.speaker === 'hunter' || txt.indexOf('LIQUIDITY_L2') >= 0 || txt.indexOf('SPOOFING') >= 0 || txt.indexOf('SQUEEZE') >= 0) {
        return 'liquidity-l2';
      }
      if (m.tone === 'veto' || m.tone === 'kill' || txt.indexOf('VETO') >= 0 || txt.indexOf('HALT') >= 0 || txt.indexOf('EMERGENCY') >= 0) {
        return 'risk-veto';
      }
      if (txt.indexOf('MACRO_ALERT') >= 0 || txt.indexOf('VOLATILITY_SHIELD') >= 0 || txt.indexOf('COPY_SIGNAL') >= 0) {
        return 'macro-alerts';
      }
      if (txt.indexOf('GRPO') >= 0 || txt.indexOf('RL_OPTIMIZER') >= 0 || txt.indexOf('WFO') >= 0 || m.tone === 'report') {
        return 'rl-optimizer';
      }
      return 'floor-general';
    }

    function toggleAgentFilter(id) {
      agentFilter = agentFilter === id ? null : id;
      renderChat();
    }

    function renderChat() {
      if (!deskState) return;
      var msgs = deskState.messages || [];
      var counts = { 'floor-general': msgs.length, 'risk-veto': 0, 'macro-alerts': 0, 'rl-optimizer': 0, 'sys-ops': 0, 'liquidity-l2': 0 };
      msgs.forEach(function (m) {
        var ch = classifyMessageChannel(m);
        if (ch !== 'floor-general') counts[ch] = (counts[ch] || 0) + 1;
      });
      Object.keys(counts).forEach(function (k) {
        var el = document.getElementById('cnt-' + k);
        if (el) el.textContent = String(counts[k]);
      });

      var afHost = document.getElementById('agentFilterHost');
      if (afHost) {
        afHost.innerHTML = AGENTS.map(function (a) {
          var cls = 'agent-chip' + (agentFilter === a.id ? ' active' : '');
          return '<button class="' + cls + '" onclick="toggleAgentFilter(&quot;' + a.id + '&quot;)">' + a.name + '</button>';
        }).join('');
      }

      var pending = (deskState.tickets || []).find(function (t) { return t.status === 'pending'; });
      var banner = document.getElementById('pendingActionBanner');
      if (banner) {
        if (pending) {
          banner.innerHTML =
            '<span class="mono amber" style="font-size:11px;margin-right:8px">' + pending.id + ' (' + pending.asset + ')</span>' +
            '<button class="pill-btn auto-on" onclick="sendCmd(&quot;approuver ' + pending.id + '&quot;)">Approuver</button> ' +
            '<button class="pill-btn" style="color:var(--down)" onclick="sendCmd(&quot;rejeter ' + pending.id + '&quot;)">Rejeter</button>';
        } else {
          banner.innerHTML = '';
        }
      }

      var filtered = msgs.filter(function (m) {
        if (activeChannel !== 'floor-general' && classifyMessageChannel(m) !== activeChannel) return false;
        if (agentFilter && m.speaker !== agentFilter) return false;
        return true;
      });

      var host = document.getElementById('chatMessages');
      if (!host) return;
      var wasBottom = host.scrollHeight - host.scrollTop - host.clientHeight < 60;
      host.innerHTML = filtered.slice(-80).map(function (m) {
        var ag = AGENTS.find(function (a) { return a.id === m.speaker; });
        var name = m.speaker === 'human' ? 'Opérateur Humain' : (ag ? ag.name : m.speaker);
        var short = m.speaker === 'human' ? 'HU' : (ag ? ag.short : 'AI');
        var color = m.speaker === 'human' ? '#38bdf8' : (ag ? ag.color : '#94a3b8');
        var ts = new Date(m.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        var cls = 'msg-bubble' + (m.speaker === 'human' ? ' human' : m.tone === 'veto' || m.tone === 'kill' ? ' veto' : m.tone === 'fill' ? ' fill' : '');
        var safeTxt = String(m.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>');
        return (
          '<div class="' + cls + '">' +
          '<div class="msg-avatar" style="background:' + color + '22;color:' + color + ';border-color:' + color + '55">' + short + '</div>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<strong style="font-size:12px;color:' + color + '">' + name + '</strong>' +
          '<span class="mono" style="font-size:10px;color:var(--fg-3)">' + ts + '</span>' +
          '</div>' +
          '<div style="font-size:12px;line-height:1.48;color:var(--fg-1);word-break:break-word">' + safeTxt + '</div>' +
          '</div></div>'
        );
      }).join('');
      if (wasBottom) host.scrollTop = host.scrollHeight;
    }

    // ==================== LIGHTWEIGHT CHARTS (TAB 3) ====================
    function disposeLwChart() {
      if (lwResizeObs) { try { lwResizeObs.disconnect(); } catch (e) {} lwResizeObs = null; }
      lwPriceLines = [];
      if (lwChart) { try { lwChart.remove(); } catch (e) {} lwChart = null; }
      lwCandleSeries = null;
      lwVolSeries = null;
    }

    async function initOrRefreshLwChart() {
      var cont = document.getElementById('lwChartContainer');
      if (!cont || typeof LightweightCharts === 'undefined') return;
      disposeLwChart();

      var w = cont.clientWidth || 900;
      var h = Math.max(600, cont.clientHeight || 600);
      lwChart = LightweightCharts.createChart(cont, {
        width: w,
        height: h,
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.12)', timeVisible: true },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.12)' }
      });

      lwCandleSeries = lwChart.addCandlestickSeries({
        upColor: '#10b981', downColor: '#f43f5e',
        borderUpColor: '#10b981', borderDownColor: '#f43f5e',
        wickUpColor: '#10b981', wickDownColor: '#f43f5e'
      });
      lwVolSeries = lwChart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: ''
      });
      try {
        lwVolSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      } catch (e) {}

      lwResizeObs = new ResizeObserver(function (entries) {
        if (!lwChart || !entries.length) return;
        var cr = entries[0].contentRect;
        if (cr.width > 0 && cr.height > 0) {
          lwChart.applyOptions({ width: cr.width, height: Math.max(600, cr.height) });
        }
      });
      lwResizeObs.observe(cont);

      await refreshChartData();
    }

    async function refreshChartData() {
      if (!lwCandleSeries || !lwChart) return;
      var symEl = document.getElementById('chartSymbolSelect');
      var tfEl = document.getElementById('chartTfSelect');
      var sym = (symEl && symEl.value) || 'BTCUSDT';
      var tf = (tfEl && tfEl.value) || '15m';
      var res = await fetch('/api/candles?symbol=' + encodeURIComponent(sym) + '&interval=' + encodeURIComponent(tf) + '&limit=240');
      var data = await res.json();
      if (!data.ok || !Array.isArray(data.candles)) return;

      lwPriceLines.forEach(function (pl) { try { lwCandleSeries.removePriceLine(pl); } catch (e) {} });
      lwPriceLines = [];

      var seen = {};
      var cBars = [];
      var vBars = [];
      data.candles.forEach(function (b) {
        var rawTs = b.openTime || b.t || b.closeTime || 0;
        var t = Math.floor(Number(rawTs) / 1000);
        if (!t || seen[t]) return;
        seen[t] = true;
        cBars.push({ time: t, open: Number(b.open), high: Number(b.high), low: Number(b.low), close: Number(b.close) });
        vBars.push({
          time: t,
          value: Number(b.volume || 0),
          color: Number(b.close) >= Number(b.open) ? 'rgba(16,185,129,0.28)' : 'rgba(244,63,94,0.28)'
        });
      });
      cBars.sort(function (a, b) { return a.time - b.time; });
      vBars.sort(function (a, b) { return a.time - b.time; });
      if (cBars.length) {
        lwCandleSeries.setData(cBars);
        lwVolSeries.setData(vBars);
        lwChart.timeScale().fitContent();
      }

      if (data.vwap && data.vwap.vwap) {
        lwPriceLines.push(lwCandleSeries.createPriceLine({ price: data.vwap.vwap, color: '#38bdf8', lineWidth: 1, title: 'VWAP' }));
      }
      if (data.fvg && data.fvg.midPrice) {
        lwPriceLines.push(lwCandleSeries.createPriceLine({ price: data.fvg.midPrice, color: '#f59e0b', lineWidth: 1, title: 'FVG 50%' }));
      }
      if (deskState && deskState.tickets) {
        deskState.tickets.filter(function (tk) { return tk.status === 'open' && tk.asset === sym; }).forEach(function (tk) {
          lwPriceLines.push(lwCandleSeries.createPriceLine({ price: tk.fillPrice || tk.entry, color: '#22d3ee', lineWidth: 2, title: tk.id + ' ENTRY' }));
          lwPriceLines.push(lwCandleSeries.createPriceLine({ price: tk.invalidation, color: '#f43f5e', lineWidth: 1, title: 'SL' }));
          lwPriceLines.push(lwCandleSeries.createPriceLine({ price: tk.target, color: '#10b981', lineWidth: 1, title: 'TP' }));
        });
      }

      var ovEl = document.getElementById('chartOverlayStats');
      if (ovEl) {
        ovEl.innerHTML =
          '<span>VWAP : ' + (data.vwap ? fmtPx(data.vwap.vwap) : '--') + '</span>' +
          '<span>FVG : ' + (data.fvg ? fmtPx(data.fvg.midPrice) : '--') + '</span>' +
          '<span>Sentiment Social : ' + Number(data.sentimentScore || 0).toFixed(2) + '</span>' +
          '<span>Bougies : ' + cBars.length + '</span>';
      }
    }

    // ==================== JOURNAL NOTION (TAB 4) ====================
    function setEquityRange(r) {
      equityRange = r;
      document.querySelectorAll('#equityTfGroup .seg-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-range') === r);
      });
      renderEquityChart();
    }

    function renderEquityChart() {
      var wrap = document.getElementById('equityAreaWrap');
      if (!wrap || typeof LightweightCharts === 'undefined' || !deskState) return;
      if (eqResizeObs) { try { eqResizeObs.disconnect(); } catch (e) {} eqResizeObs = null; }
      if (eqChart) { try { eqChart.remove(); } catch (e) {} eqChart = null; }

      var w = wrap.clientWidth || 720;
      var h = wrap.clientHeight || 290;
      var upHex = getCurrentThemePrefs().up || '#10b981';

      eqChart = LightweightCharts.createChart(wrap, {
        width: w,
        height: h,
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' }
      });

      eqAreaSeries = eqChart.addAreaSeries({
        lineColor: upHex,
        topColor: hexToRgba(upHex, 0.35),
        bottomColor: hexToRgba(upHex, 0.02),
        lineWidth: 2
      });

      var now = Date.now();
      var cutoff = equityRange === '1D' ? now - 86400000 : equityRange === '1W' ? now - 7 * 86400000 : equityRange === '1M' ? now - 30 * 86400000 : 0;
      var rawCurve = (deskState.curve || []).filter(function (pt) { return pt.t >= cutoff; });
      if (rawCurve.length < 2) rawCurve = deskState.curve || [];

      var bySec = {};
      var points = [];
      rawCurve.forEach(function (pt) {
        var sec = Math.floor(pt.t / 1000);
        bySec[sec] = pt;
      });
      Object.keys(bySec).sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (sec) {
        points.push({ time: Number(sec), value: Number(bySec[sec].eq || 0) });
      });
      if (points.length) {
        eqAreaSeries.setData(points);
        eqChart.timeScale().fitContent();
      }

      var tip = document.getElementById('equityTooltip');
      eqChart.subscribeCrosshairMove(function (param) {
        if (!tip) return;
        if (!param || !param.time) { tip.style.display = 'none'; return; }
        var match = bySec[param.time];
        if (!match) { tip.style.display = 'none'; return; }
        tip.innerHTML =
          '<div><strong>' + new Date(match.t).toLocaleString('fr-FR') + '</strong></div>' +
          '<div>Équité : <span class="up">' + fmtUsd(match.eq, 2) + '</span></div>' +
          '<div>Réalisé : ' + fmtSignedUsd(match.realized, 2) + ' · DD : ' + Number((match.drawdownPct || 0) * 100).toFixed(2) + '%</div>';
        tip.style.display = 'block';
      });

      eqResizeObs = new ResizeObserver(function (entries) {
        if (!eqChart || !entries.length) return;
        var cr = entries[0].contentRect;
        if (cr.width > 0) eqChart.applyOptions({ width: cr.width, height: cr.height || 290 });
      });
      eqResizeObs.observe(wrap);
    }

    function setLedgerMode(m) {
      ledgerMode = m;
      document.getElementById('tabLedgerOpen').classList.toggle('active', m === 'open');
      document.getElementById('tabLedgerClosed').classList.toggle('active', m === 'closed');
      renderJournalView();
    }

    function setLedgerDir(d) {
      ledgerDir = d;
      document.querySelectorAll('[data-dir]').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-dir') === d);
      });
      renderJournalView();
    }

    function shiftCalendarMonth(delta) {
      calMonth += delta;
      if (calMonth < 0) { calMonth = 11; calYear -= 1; }
      if (calMonth > 11) { calMonth = 0; calYear += 1; }
      renderCalendarHeatmap();
    }

    function renderJournalView() {
      if (!deskState) return;
      var closed = (deskState.tickets || []).filter(function (t) { return t.status === 'closed'; });
      var open = (deskState.tickets || []).filter(function (t) { return t.status === 'open'; });
      var wins = closed.filter(function (t) { return (t.pnl || 0) > 0; });
      var losses = closed.filter(function (t) { return (t.pnl || 0) <= 0; });
      var winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
      var avgR = closed.length ? closed.reduce(function (s, t) { return s + (t.rMultiple || 0); }, 0) / closed.length : 0;
      var grossWin = wins.reduce(function (s, t) { return s + (t.pnl || 0); }, 0);
      var grossLoss = Math.abs(losses.reduce(function (s, t) { return s + (t.pnl || 0); }, 0));
      var pf = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 9.99 : 0;

      var totalUnrealized = open.reduce(function (sum, t) {
        var fill = t.fillPrice || t.entry;
        var mark = t.mt5CurrentPrice || tapePriceOf(t.asset, fill);
        var sign = t.direction === 'long' ? 1 : -1;
        var pnl = t.mt5Profit !== undefined ? t.mt5Profit : ((sign * (mark - fill) * (t.notional || 0)) / Math.max(fill, 1e-9));
        return sum + pnl;
      }, 0);

      var kpiHost = document.getElementById('notionKpiStrip');
      if (kpiHost) {
        kpiHost.innerHTML =
          '<div class="kpi-box"><div class="kpi-lbl">PnL Réalisé Total</div><div class="kpi-val mono ' + (deskState.realizedPnl >= 0 ? 'up' : 'down') + '">' + fmtSignedUsd(deskState.realizedPnl, 2) + '</div></div>' +
          '<div class="kpi-box"><div class="kpi-lbl">PnL Latent (Ouverts)</div><div class="kpi-val mono ' + (totalUnrealized >= 0 ? 'up' : 'down') + '">' + fmtSignedUsd(totalUnrealized, 2) + '</div></div>' +
          '<div class="kpi-box"><div class="kpi-lbl">Win Rate</div><div class="kpi-val mono">' + winRate.toFixed(1) + '%</div></div>' +
          '<div class="kpi-box"><div class="kpi-lbl">Espérance (R)</div><div class="kpi-val mono ' + (avgR >= 0 ? 'up' : 'down') + '">' + (avgR >= 0 ? '+' : '') + avgR.toFixed(2) + 'R</div></div>' +
          '<div class="kpi-box"><div class="kpi-lbl">Profit Factor</div><div class="kpi-val mono">' + pf.toFixed(2) + '</div></div>' +
          '<div class="kpi-box"><div class="kpi-lbl">Ouvertes / Fermées</div><div class="kpi-val mono">' + open.length + ' / ' + closed.length + '</div></div>';
      }

      var rows = (ledgerMode === 'open' ? open : closed).filter(function (t) {
        return ledgerDir === 'ALL' || t.direction === ledgerDir;
      });
      var tb = document.getElementById('ledgerTableBody');
      if (tb) {
        if (!rows.length) {
          tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--fg-3);padding:24px">Aucune position ' + (ledgerMode === 'open' ? 'ouverte' : 'fermée') + ' dans ce filtre.</td></tr>';
        } else {
          tb.innerHTML = rows.map(function (t) {
            var fill = t.fillPrice || t.entry;
            var mark = t.status === 'closed' ? t.exitPrice : (t.mt5CurrentPrice || tapePriceOf(t.asset, fill));
            var sign = t.direction === 'long' ? 1 : -1;
            var livePnl = t.status === 'closed' ? (t.pnl || 0) : (t.mt5Profit !== undefined ? t.mt5Profit : ((sign * (mark - fill) * (t.notional || 0)) / Math.max(fill, 1e-9)));
            var liveR = t.status === 'closed' ? (t.rMultiple || 0) : (t.riskUsd > 0 ? livePnl / t.riskUsd : 0);
            var pnlCls = livePnl >= 0 ? 'up' : 'down';
            var mt5Badge = t.mt5PositionId ? '<div style="font-size:10px;color:var(--up)">MT5 #' + t.mt5PositionId + '</div>' : '';
            var lotsLabel = t.mt5Lots ? (Number(t.mt5Lots).toFixed(2) + ' lot · ') : '';
            return (
              '<tr onclick="openJournalInspector(&quot;' + t.id + '&quot;)">' +
              '<td class="mono"><div>' + t.id + '</div>' + mt5Badge + '</td>' +
              '<td><strong>' + t.asset + '</strong> <span class="' + (t.direction === 'long' ? 'up' : 'down') + '">' + t.direction.toUpperCase() + '</span></td>' +
              '<td><div>' + (STRATEGY_LABELS[t.engine || t.playbook] || t.engine || t.playbook) + '</div><div style="font-size:10px;color:var(--fg-3)">' + (t.regime || '--') + '</div></td>' +
              '<td class="mono">' + fmtPx(fill) + ' → ' + fmtPx(mark) + '</td>' +
              '<td class="mono">' + lotsLabel + (t.leverage || 1) + 'x / ' + (t.liqPrice ? fmtPx(t.liqPrice) : '--') + '</td>' +
              '<td class="mono ' + pnlCls + '">' + fmtSignedUsd(livePnl, 2) + ' (' + Number(liveR).toFixed(2) + 'R)</td>' +
              '<td><span class="badge-chip">' + (t.setupGrade || 'A') + '</span></td>' +
              '</tr>'
            );
          }).join('');
        }
      }
      renderCalendarHeatmap();
    }

    function renderCalendarHeatmap() {
      var host = document.getElementById('calGridHost');
      var lbl = document.getElementById('calMonthLabel');
      if (!host || !lbl || !deskState) return;
      var months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      lbl.textContent = months[calMonth] + ' ' + calYear;

      var daily = {};
      (deskState.tickets || []).filter(function (t) { return t.status === 'closed' && t.closedAt; }).forEach(function (t) {
        var d = new Date(t.closedAt);
        var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        daily[k] = (daily[k] || 0) + (t.pnl || 0);
      });

      var html = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (d) { return '<div class="cal-day-hdr">' + d + '</div>'; }).join('');
      var firstDay = new Date(Date.UTC(calYear, calMonth, 1)).getUTCDay();
      var pad = (firstDay + 6) % 7;
      for (var p = 0; p < pad; p++) html += '<div></div>';
      var daysInMonth = new Date(Date.UTC(calYear, calMonth + 1, 0)).getUTCDate();
      for (var day = 1; day <= daysInMonth; day++) {
        var key = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        var v = daily[key];
        var cls = 'cal-cell' + (v > 0 ? ' pos' : v < 0 ? ' neg' : '');
        html +=
          '<div class="' + cls + '">' +
          '<span style="color:var(--fg-2)">' + day + '</span>' +
          '<span class="mono ' + (v > 0 ? 'up' : v < 0 ? 'down' : '') + '">' + (v !== undefined ? fmtSignedUsd(v, 0) : '') + '</span>' +
          '</div>';
      }
      host.innerHTML = html;
    }

    function openJournalInspector(id) {
      if (!deskState) return;
      var t = (deskState.tickets || []).find(function (x) { return x.id === id; });
      if (!t) return;
      document.getElementById('jDrawerTitle').textContent = t.id + ' · ' + t.asset;
      document.getElementById('jDrawerBody').innerHTML =
        '<div><strong>Thèse :</strong><br>' + (t.thesis || '--') + '</div>' +
        '<div class="mono">Entrée : ' + fmtPx(t.entry) + ' | Stop : ' + fmtPx(t.invalidation) + ' | Cible : ' + fmtPx(t.target) + '</div>' +
        '<div class="mono">Levier : ' + (t.leverage || 1) + 'x | LiqPrice : ' + (t.liqPrice ? fmtPx(t.liqPrice) : '--') + ' | MAE : ' + Number(t.maxAdverseExcursion || 0).toFixed(2) + 'R</div>' +
        '<div><label class="field-lbl">Grade Setup</label><select id="jGradeInput" class="input-dark" style="width:100%">' +
        ['A+', 'A', 'B', 'C'].map(function (g) { return '<option value="' + g + '"' + (t.setupGrade === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') +
        '</select></div>' +
        '<div><label class="field-lbl">Notes Notion</label><textarea id="jNotesInput" rows="4" class="input-dark" style="width:100%">' + (t.journalNotes || '') + '</textarea></div>' +
        '<button class="pill-btn primary" onclick="saveJNotes(&quot;' + t.id + '&quot;)">Enregistrer Note</button>' +
        '<div style="font-size:10px;color:var(--fg-3)">Charte : aucune ligne perdante ne peut être supprimée.</div>';
      openDrawer('journalDrawer');
    }

    async function saveJNotes(ticketId) {
      var setupGrade = document.getElementById('jGradeInput').value;
      var journalNotes = document.getElementById('jNotesInput').value;
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketId: ticketId, setupGrade: setupGrade, journalNotes: journalNotes })
      });
      closeDrawer('journalDrawer');
    }

    // ==================== STRATEGIE & LEVIER 500x ====================
    function syncLevFromSlider(val) {
      var n = Math.max(1, Math.min(500, Math.round(Number(val) || 1)));
      document.getElementById('cfgLev').value = String(n);
      document.getElementById('navLevBadge').textContent = 'x' + n;
    }
    function syncLevFromNumber(val) {
      var n = Math.max(1, Math.min(500, Math.round(Number(val) || 1)));
      document.getElementById('cfgLevSlider').value = String(n);
      document.getElementById('navLevBadge').textContent = 'x' + n;
    }
    function setLevPreset(val) {
      syncLevFromSlider(val);
      saveRiskSettings();
    }

    function formatDateDDMMYYYY(d) {
      return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear();
    }
    function setDatePresetDays(days) {
      var end = new Date();
      var start = new Date(end.getTime() - days * 86400000);
      document.getElementById('grpoStartDate').value = formatDateDDMMYYYY(start);
      document.getElementById('grpoEndDate').value = formatDateDDMMYYYY(end);
    }

    async function runOneClickAutopilot() {
      var btn = document.getElementById('btnAutoPilot1Click');
      var sym = document.getElementById('grpoSymbolSelect').value || 'BTCUSDT';
      var st = document.getElementById('grpoLiveStatus');
      var bar = document.getElementById('grpoProgressBar');
      btn.disabled = true;
      bar.style.width = '45%';
      st.textContent = "Mode 1-Clic actif : entrainement de l'IA sur " + sym + " et activation du trading automatique...";
      try {
        var res = await fetch('/api/autopilot', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: sym })
        });
        var out = await res.json();
        bar.style.width = '100%';
        if (out.ok) {
          st.textContent = '✅ IA entraînée (Ép #' + out.training.episode + ') · Full Auto ACTIVÉ · ' + out.openPositions + ' position(s) ouverte(s) !';
          await fetchRlMemory();
        } else {
          st.textContent = 'Erreur Autopilot : ' + (out.error || 'inconnue');
        }
      } finally {
        btn.disabled = false;
      }
    }

    function initDefaultDates() {
      var end = new Date();
      var start = new Date(end.getTime() - 90 * 86400000);
      var sEl = document.getElementById('grpoStartDate');
      var eEl = document.getElementById('grpoEndDate');
      if (sEl && !sEl.value) sEl.value = formatDateDDMMYYYY(start);
      if (eEl && !eEl.value) eEl.value = formatDateDDMMYYYY(end);
    }

    async function fetchRlMemory() {
      try {
        var r = await fetch('/api/rl-memory');
        var j = await r.json();
        if (j.ok) {
          rlMemory = j.memory;
          renderRlMetrics();
        }
      } catch (e) {}
    }

    async function launchGrpoTraining() {
      var sym = document.getElementById('grpoSymbolSelect').value;
      var startDate = document.getElementById('grpoStartDate').value.trim();
      var endDate = document.getElementById('grpoEndDate').value.trim();
      var bar = document.getElementById('grpoProgressBar');
      var st = document.getElementById('grpoLiveStatus');
      var btn = document.getElementById('btnLaunchGrpo');
      btn.disabled = true;
      bar.style.width = '40%';
      st.textContent = 'Rejeu historique en cours sur ' + sym + ' (' + startDate + ' → ' + endDate + ')...';
      try {
        var res = await fetch('/api/grpo-train', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: sym, startDate: startDate, endDate: endDate })
        });
        var out = await res.json();
        bar.style.width = '100%';
        if (out.ok) {
          st.textContent = 'Entraînement réussi (Épisode #' + out.episode + ') · Qualité du Risque (Sharpe) : ' + (Number(out.deflatedSharpe) * 100).toFixed(0) + '%';
          await fetchRlMemory();
        } else {
          st.textContent = 'Erreur : ' + (out.error || 'inconnue');
        }
      } finally {
        btn.disabled = false;
      }
    }

    async function hotReloadGrpo() {
      var res = await fetch('/api/grpo-reload', { method: 'POST' });
      var out = await res.json();
      if (out.ok) {
        rlMemory = out.memory;
        renderRlMetrics();
        document.getElementById('grpoLiveStatus').textContent = 'Mémoire IA rechargée (Épisode #' + rlMemory.totalEpisodes + ').';
      }
    }

    async function runLegacyWfoTrain() {
      var style = document.getElementById('trainStyleSelect').value;
      document.getElementById('grpoProgressBar').style.width = '65%';
      await fetch('/api/train', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ style: style })
      });
      document.getElementById('grpoProgressBar').style.width = '100%';
    }

    async function saveRiskSettings() {
      var lev = Math.max(1, Math.min(500, Math.round(Number(document.getElementById('cfgLev').value || 5))));
      var settings = {
        defaultLeverage: lev,
        maxRiskPct: Number(document.getElementById('cfgRiskPct').value || 2) / 100,
        maxDayLossPct: Number(document.getElementById('cfgDayLossPct').value || 5) / 100,
        fixedStopAtr: Number(document.getElementById('cfgAtrMult').value || 1.35)
      };
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ settings: settings })
      });
    }

    async function saveLlmApiKey() {
      var k = document.getElementById('llmKeyInput').value.trim();
      if (!k) return;
      await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ llmApiKey: k })
      });
      document.getElementById('llmKeyInput').value = '';
    }

    async function syncMt5Now() {
      var btn = document.getElementById('btnMt5SyncNow');
      var stEl = document.getElementById('mt5LocalBridgeStatus');
      if (btn) btn.disabled = true;
      if (stEl) stEl.textContent = 'Synchronisation & scan Forex MT5 en cours...';
      try {
        var res = await fetch('/api/mt5-bridge/sync', { method: 'POST' });
        var out = await res.json();
        if (stEl) {
          stEl.textContent = out.ok
            ? '✅ Synchronisé MT5 #' + ((out.mt5Live && out.mt5Live.login) || '--') + ' · ' + (out.openTickets ? out.openTickets.length : 0) + ' position(s) active(s)'
            : '⚠️ Erreur sync : ' + (out.error || 'inconnue');
        }
      } catch (e) {
        if (stEl) stEl.textContent = '⚠️ Erreur réseau sync MT5';
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    async function saveAndTestMt5() {
      var stEl = document.getElementById('mt5StatusMsg');
      stEl.textContent = 'Connexion au serveur MetaApi Cloud MT5...';
      var payload = {
        action: 'SAVE_AND_TEST_MT5',
        mt5Enabled: document.getElementById('mt5EnabledChk').checked,
        metaApiToken: document.getElementById('mt5TokenInput').value.trim() || undefined,
        metaApiAccountId: document.getElementById('mt5AccountIdInput').value.trim() || undefined,
        mt5Login: document.getElementById('mt5LoginInput').value.trim() || undefined,
        mt5Password: document.getElementById('mt5PassInput').value || undefined,
        mt5Server: document.getElementById('mt5ServerInput').value.trim() || undefined,
        mt5DefaultLots: Number(document.getElementById('mt5LotsInput').value || 0.01)
      };
      var res = await fetch('/api/mobile-config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var out = await res.json();
      stEl.textContent = (out.ok ? '✅ ' : '⚠️ ') + (out.message || 'Terminé');
    }

    async function sendTestMt5Trade() {
      var stEl = document.getElementById('mt5StatusMsg');
      stEl.textContent = 'Envoi ordre test 0.01 lot vers MT5...';
      var res = await fetch('/api/mobile-config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_MT5_ORDER',
          mt5DefaultLots: Number(document.getElementById('mt5LotsInput').value || 0.01)
        })
      });
      var out = await res.json();
      stEl.textContent = (out.ok ? '✅ ' : '⚠️ ') + (out.message || 'Terminé');
    }

    function collectTgTokensPayload() {
      var map = {
        lead: document.getElementById('tgTokLead').value.trim(),
        analyst: document.getElementById('tgTokAnalyst').value.trim(),
        strategist: document.getElementById('tgTokStrategist').value.trim(),
        risk: document.getElementById('tgTokRisk').value.trim(),
        execution: document.getElementById('tgTokExecution').value.trim(),
        reviewer: document.getElementById('tgTokReviewer').value.trim(),
        sentinel: document.getElementById('tgTokSentinel').value.trim(),
        hunter: document.getElementById('tgTokHunter').value.trim()
      };
      var out = {};
      Object.keys(map).forEach(function (k) { if (map[k]) out[k] = map[k]; });
      return out;
    }

    async function detectTelegramChatId() {
      var stEl = document.getElementById('tgStatusMsg');
      stEl.textContent = 'Recherche de votre dernier message sur le bot Telegram...';
      var res = await fetch('/api/mobile-config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'DETECT_TELEGRAM_CHAT_ID',
          tgTokens: collectTgTokensPayload()
        })
      });
      var out = await res.json();
      if (out.chatId) document.getElementById('tgChatIdInput').value = out.chatId;
      stEl.textContent = (out.ok ? '✅ ' : '⚠️ ') + (out.message || 'Terminé');
    }

    async function saveAndTestTelegram() {
      var stEl = document.getElementById('tgStatusMsg');
      stEl.textContent = 'Vérification des bots et envoi du message test...';
      var res = await fetch('/api/mobile-config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_AND_TEST_TELEGRAM',
          tgChatId: document.getElementById('tgChatIdInput').value.trim() || undefined,
          tgTokens: collectTgTokensPayload()
        })
      });
      var out = await res.json();
      stEl.textContent = (out.ok ? '✅ ' : '⚠️ ') + (out.message || 'Terminé');
    }

    function renderRlMetrics() {
      var host = document.getElementById('rlMetricsHost');
      if (!host) return;
      var sum = (deskState && deskState.rlSummary) || {};
      var mem = rlMemory;
      var regime = sum.regime || 'MEAN_REVERTING';
      var weights = (mem && mem.regimeWeights && mem.regimeWeights[regime]) || {};
      var advVal = Number(sum.meanAdvantage || 0).toFixed(3);
      var klVal = Number(sum.klDivergence || 0).toFixed(4);
      var dsrPct = Math.round(Number(sum.deflatedSharpe || 0.27) * 100);

      var html =
        '<div class="ai-metric-card">' +
          '<div>Avantage Stratégique (Â) <span class="info-tip" data-tip="Avantage relatif normalisé (GRPO) : une valeur positive montre que les choix récents battent la moyenne du groupe.">ⓘ</span><div style="font-size:10px;color:var(--fg-3)">Indique si l&#39;IA bat le marché</div></div>' +
          '<strong class="mono up" style="font-size:14px">' + advVal + '</strong>' +
        '</div>' +
        '<div class="ai-metric-card">' +
          '<div>Stabilité d&#39;Apprentissage (KL) <span class="info-tip" data-tip="Mesure l&#39;écart entre la nouvelle politique et la référence stable. Une valeur faible évite le sur-apprentissage.">ⓘ</span></div>' +
          '<strong class="mono accent" style="font-size:14px">' + klVal + '</strong>' +
        '</div>' +
        '<div class="ai-metric-card">' +
          '<div>Qualité du Risque (Sharpe) <span class="info-tip" data-tip="Deflated Sharpe Ratio ajusté du hasard sur les tests hors-échantillon.">ⓘ</span></div>' +
          '<strong class="mono" style="font-size:14px">' + dsrPct + '%</strong>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--fg-2);margin:10px 0 6px">Préférences actuelles de l&#39;IA (' + regime + ') :</div>';

      Object.keys(weights).forEach(function (k) {
        var pct = Math.round(Number(weights[k] || 0) * 100);
        html +=
          '<div style="margin-bottom:6px">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px"><span>' + (STRATEGY_LABELS[k] || k) + '</span><span class="mono">' + pct + '%</span></div>' +
          '<div class="progress-track" style="height:5px;margin:3px 0"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
          '</div>';
      });
      host.innerHTML = html;
    }

    function toggleGridLock() {
      gridLocked = !gridLocked;
      var grid = document.getElementById('strategyWidgetsGrid');
      var btn = document.getElementById('btnLockGrid');
      grid.classList.toggle('unlocked', !gridLocked);
      btn.textContent = gridLocked ? '🔒 Grille Verrouillée' : '🔓 Grille Déverrouillée';
      Array.from(grid.children).forEach(function (el) { el.setAttribute('draggable', gridLocked ? 'false' : 'true'); });
    }
    function moveWidget(id, dir) {
      var grid = document.getElementById('strategyWidgetsGrid');
      var children = Array.from(grid.children);
      var idx = children.findIndex(function (c) { return c.getAttribute('data-widget-id') === id; });
      var next = idx + dir;
      if (idx < 0 || next < 0 || next >= children.length) return;
      if (dir < 0) grid.insertBefore(children[idx], children[next]);
      else grid.insertBefore(children[next], children[idx]);
      var order = Array.from(grid.children).map(function (c) { return c.getAttribute('data-widget-id'); });
      try { localStorage.setItem('tf_v3_widget_order', JSON.stringify(order)); } catch (e) {}
    }
    function restoreWidgetOrder() {
      try {
        var raw = localStorage.getItem('tf_v3_widget_order');
        if (!raw) return;
        var grid = document.getElementById('strategyWidgetsGrid');
        JSON.parse(raw).forEach(function (id) {
          var el = grid.querySelector('[data-widget-id="' + id + '"]');
          if (el) grid.appendChild(el);
        });
      } catch (e) {}
    }
    function setupWidgetDragDrop() {
      var grid = document.getElementById('strategyWidgetsGrid');
      if (!grid) return;
      Array.from(grid.children).forEach(function (card) {
        card.addEventListener('dragstart', function () { if (!gridLocked) draggedWidgetId = card.getAttribute('data-widget-id'); });
        card.addEventListener('dragover', function (e) { if (!gridLocked) e.preventDefault(); });
        card.addEventListener('drop', function (e) {
          if (gridLocked) return;
          e.preventDefault();
          var targetId = card.getAttribute('data-widget-id');
          if (!draggedWidgetId || draggedWidgetId === targetId) return;
          var src = grid.querySelector('[data-widget-id="' + draggedWidgetId + '"]');
          var dst = grid.querySelector('[data-widget-id="' + targetId + '"]');
          if (src && dst) {
            grid.insertBefore(src, dst);
            var order = Array.from(grid.children).map(function (c) { return c.getAttribute('data-widget-id'); });
            try { localStorage.setItem('tf_v3_widget_order', JSON.stringify(order)); } catch (err) {}
          }
          draggedWidgetId = null;
        });
      });
    }

    // ==================== MAIN RENDER LOOP ====================
    function renderAll() {
      if (!deskState) return;
      var s = deskState.settings || {};
      var isAuto = s.executionMode === 'auto' || Boolean(s.autoPaperScalp);
      var btnExec = document.getElementById('btnExecMode');
      if (btnExec) {
        btnExec.textContent = isAuto ? 'Full Auto ⚡' : 'Confirmation Humaine';
        btnExec.className = 'pill-btn ' + (isAuto ? 'auto-on' : 'auto-off');
      }

      var isHalted = Boolean(deskState.halted);
      var hDot = document.getElementById('liveHealthDot');
      if (hDot) hDot.classList.toggle('halted', isHalted);
      var haltBtn = document.getElementById('btnPanicHalt');
      if (haltBtn) {
        haltBtn.textContent = isHalted ? '▶️ REPRENDRE DESK' : '⚠️ HALT DESK';
        haltBtn.classList.toggle('resuming', isHalted);
      }

      var lev = s.defaultLeverage || 5;
      document.getElementById('navLevBadge').textContent = 'x' + lev;

      var open = (deskState.tickets || []).filter(function (t) { return t.status === 'open'; });
      var pending = (deskState.tickets || []).filter(function (t) { return t.status === 'pending'; });
      var lastPt = (deskState.curve && deskState.curve[deskState.curve.length - 1]) || { eq: deskState.startEquity };
      var hasMt5Live = Boolean(deskState.mt5Live && deskState.mt5Live.connected);
      var eq = hasMt5Live ? deskState.mt5Live.equity : (lastPt.eq || deskState.startEquity || 10000);
      var dayPnl = hasMt5Live ? deskState.mt5Live.profit : (eq - (deskState.dayStartEquity || deskState.startEquity || eq));

      var mt5Chip = document.getElementById('deskMt5LiveChip');
      if (mt5Chip) {
        if (hasMt5Live) {
          mt5Chip.style.display = 'inline-flex';
          mt5Chip.style.borderColor = 'rgba(16,185,129,0.55)';
          mt5Chip.style.color = '#10b981';
          mt5Chip.textContent = '🟢 MT5 LIVE #' + deskState.mt5Live.login + ' · Capital Synchronisé (' + Number(deskState.mt5Live.equity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (deskState.mt5Live.currency || 'EUR') + ')';
        } else {
          mt5Chip.style.display = 'none';
        }
      }
      var localStEl = document.getElementById('mt5LocalBridgeStatus');
      if (localStEl) {
        if (hasMt5Live) {
          localStEl.style.color = '#10b981';
          localStEl.textContent = '🟢 Connecté MT5 #' + deskState.mt5Live.login + ' (' + deskState.mt5Live.server + ') · Solde ' + Number(deskState.mt5Live.balance).toFixed(2) + ' ' + deskState.mt5Live.currency + ' · ' + deskState.mt5Live.positionsCount + ' position(s)';
        } else {
          localStEl.style.color = 'var(--fg-2)';
          localStEl.textContent = 'En attente du terminal MT5 PC (TradingFloorBridge)...';
        }
      }

      var hp = document.getElementById('heroDayPnl');
      if (hp) {
        hp.textContent = fmtSignedUsd(dayPnl, 2);
        hp.className = 'pnl-hero-value mono ' + (dayPnl >= 0 ? 'up' : 'down');
      }
      document.getElementById('heroEquity').textContent = fmtUsd(eq, 2);
      document.getElementById('heroOpenCount').textContent = String(open.length);
      document.getElementById('heroPendingCount').textContent = String(pending.length);

      var rlSum = deskState.rlSummary || {};
      document.getElementById('deskRegimeChip').textContent = 'RÉGIME : ' + (rlSum.regime || 'MEAN_REVERTING');
      document.getElementById('deskRlChip').textContent = 'IA ÉPISODE #' + (rlSum.totalEpisodes || 0);
      var shieldOn = (deskState.volatilityShieldUntil || 0) > Date.now();
      document.getElementById('deskShieldChip').style.display = shieldOn ? 'inline-flex' : 'none';

      var activeSyms = s.symbols || ['BTCUSDT', 'ETHUSDT'];
      var chkHost = document.getElementById('assetChecklistHost');
      if (chkHost && !chkHost.dataset.ready) {
        chkHost.innerHTML = ASSET_CATALOG.map(function (grp) {
          return (
            '<div class="asset-cat-title">' + grp.cat + '</div><div class="asset-grid">' +
            grp.items.map(function (it) {
              var checked = activeSyms.indexOf(it.s) >= 0 ? ' checked' : '';
              return '<label class="asset-item"><input type="checkbox" class="asset-chk" value="' + it.s + '"' + checked + ' /><span>' + it.l + '</span></label>';
            }).join('') +
            '</div>'
          );
        }).join('');
        chkHost.dataset.ready = '1';
      }

      var symsKey = activeSyms.join(',');
      ['chartSymbolSelect', 'grpoSymbolSelect'].forEach(function (selId) {
        var el = document.getElementById(selId);
        if (!el || el.dataset.syms === symsKey) return;
        var prev = el.value;
        el.innerHTML = activeSyms.map(function (sym) {
          return '<option value="' + sym + '">' + sym + '</option>';
        }).join('');
        el.dataset.syms = symsKey;
        if (prev && activeSyms.indexOf(prev) >= 0) el.value = prev;
      });

      var activeId = document.activeElement ? document.activeElement.id : '';
      if (['cfgLev', 'cfgLevSlider', 'cfgRiskPct', 'cfgDayLossPct', 'cfgAtrMult'].indexOf(activeId) < 0) {
        document.getElementById('cfgLev').value = String(lev);
        document.getElementById('cfgLevSlider').value = String(lev);
        document.getElementById('cfgRiskPct').value = String(Number((s.maxRiskPct || 0.02) * 100).toFixed(1));
        document.getElementById('cfgDayLossPct').value = String(Number((s.maxDayLossPct || 0.05) * 100).toFixed(1));
        document.getElementById('cfgAtrMult').value = String(s.fixedStopAtr || 1.35);
      }

      if (['mt5AccountIdInput', 'mt5LoginInput', 'mt5ServerInput', 'mt5LotsInput', 'tgChatIdInput'].indexOf(activeId) < 0) {
        document.getElementById('mt5EnabledChk').checked = Boolean(s.mt5Enabled);
        if (s.metaApiAccountId && !document.getElementById('mt5AccountIdInput').value) document.getElementById('mt5AccountIdInput').value = s.metaApiAccountId;
        if (s.mt5Login && !document.getElementById('mt5LoginInput').value) document.getElementById('mt5LoginInput').value = s.mt5Login;
        if (s.mt5Server && !document.getElementById('mt5ServerInput').value) document.getElementById('mt5ServerInput').value = s.mt5Server;
        document.getElementById('mt5LotsInput').value = String(s.mt5DefaultLots || 0.01);
        if (s.tgChatId && !document.getElementById('tgChatIdInput').value) document.getElementById('tgChatIdInput').value = s.tgChatId;
        if (s.mt5LastStatus) document.getElementById('mt5StatusMsg').textContent = (s.mt5Connected ? '✅ ' : '') + s.mt5LastStatus;
        if (s.tgBotsConfigured > 0 && s.tgChatId) {
          document.getElementById('tgStatusMsg').textContent = '✅ ' + s.tgBotsConfigured + ' bot(s) Telegram actif(s) · Chat ID ' + s.tgChatId;
        }
      }

      var repHost = document.getElementById('trainingReportHost');
      if (repHost) {
        var parts = [];
        if (deskState.lastTrainingReport) {
          parts.push('<div style="margin-bottom:8px"><strong>Dernier Entraînement Historique :</strong><br>' + deskState.lastTrainingReport.recommendation + '</div>');
        }
        if (deskState.lastOptimizationReport) {
          parts.push('<div style="white-space:pre-wrap;color:var(--fg-2)">' + deskState.lastOptimizationReport.reviewerSummary + '</div>');
        }
        if (!parts.length) {
          parts.push("<span style='color:var(--fg-3)'>Aucun rapport généré pour l'instant. Lancez l'Entraînement IA (Étape 3).</span>");
        }
        repHost.innerHTML = parts.join('');
      }

      update3dAgentSpritesAndPulses();
      renderChat();
      renderJournalView();
      renderRlMetrics();
      if (currentTab === 'journal' && !eqChart) {
        renderEquityChart();
      }
    }

    function connectStream() {
      try {
        var es = new EventSource('/api/stream');
        es.onmessage = function (ev) {
          try {
            deskState = JSON.parse(ev.data);
            renderAll();
          } catch (e) {}
        };
      } catch (e) {}
      fetch('/api/state').then(function (r) { return r.json(); }).then(function (st) {
        deskState = st;
        renderAll();
      }).catch(function () {});
    }

    window.addEventListener('DOMContentLoaded', function () {
      applyThemeValues(getCurrentThemePrefs(), false);
      restoreWidgetOrder();
      setupWidgetDragDrop();
      initDefaultDates();
      init3dDesk();
      connectStream();
      fetchRlMemory();
    });
  </script>
</body>
</html>
`;
