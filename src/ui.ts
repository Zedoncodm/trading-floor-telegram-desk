export const DASHBOARD_HTML = /* html */ `<!DOCTYPE html>
<html lang="fr" data-theme="obsidian">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TRADING FLOOR V3 — Terminal Quantitatif 6 Agents IA</title>
  <link rel="preload" href="/assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    /* ============ DESIGN SYSTEM : police unique (Inter variable, auto-hébergée) ============ */
    @font-face {
      font-family: "Inter Variable";
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url("/assets/fonts/inter-latin-wght-normal.woff2") format("woff2-variations");
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: "Inter Variable";
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url("/assets/fonts/inter-latin-ext-wght-normal.woff2") format("woff2-variations");
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    /* Repli métrique : même encombrement que Inter, donc aucun saut de mise en page au chargement */
    @font-face {
      font-family: "Inter Fallback";
      src: local("Arial");
      size-adjust: 107.4%;
      ascent-override: 90.2%;
      descent-override: 22.5%;
      line-gap-override: 0%;
    }
    :root {
      --font: "Inter Variable", "Inter Fallback", system-ui, -apple-system, "Segoe UI", sans-serif;
      /* Échelle typographique (ratio 1.125) */
      --fs-2xs: 10px; --fs-xs: 11px; --fs-sm: 12px; --fs-md: 13px; --fs-lg: 15px; --fs-xl: 18px; --fs-2xl: 24px;
      /* Espacements (grille de 4 px) */
      --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px;
      /* Rayons */
      --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-pill: 999px;
      /* Mouvement (ressort fluide & réponse rapide) */
      --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
      --spring-fluid: cubic-bezier(0.16, 1, 0.3, 1);
      --dur-fast: 110ms; --dur-base: 220ms; --dur-slow: 340ms;
      /* Taille tactile minimale */
      --tap: 44px;
      --focus-ring: 0 0 0 2px var(--bg-0), 0 0 0 4px var(--accent);
    }
    :root,
    html[data-theme="obsidian"] {
      --bg-0: #03060c;
      --bg-1: #070c16;
      --bg-2: #0d1526;
      --bg-3: #152138;
      --bg-gradient: radial-gradient(circle at 20% 0%, #0e1d36 0%, #050912 52%, #020408 100%);
      --surface-glass: rgba(11, 17, 30, 0.80);
      --surface-elevated: rgba(13, 21, 38, 0.94);
      --glass-alpha: 0.80;
      --ring-1: rgba(255, 255, 255, 0.11);
      --ring-2: rgba(255, 255, 255, 0.24);
      --fg-0: #f8fafc;
      --fg-1: #e2e8f0;
      --fg-2: #a1b0c4;
      --fg-3: #7a8aa0;
      --accent: #38bdf8;
      --accent-fg: #031522;
      --accent-bg: rgba(56, 189, 248, 0.16);
      --up: #10b981;
      --up-bg: rgba(16, 185, 129, 0.14);
      --up-ring: rgba(16, 185, 129, 0.44);
      --down: #f43f5e;
      --down-bg: rgba(244, 63, 94, 0.14);
      --down-ring: rgba(244, 63, 94, 0.44);
      --amber: #fbbf24;
      --amber-bg: rgba(251, 191, 36, 0.14);
      --input-bg: rgba(4, 8, 16, 0.78);
      --shadow-glass: 0 0 0 1px var(--ring-1), 0 14px 36px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--bg-0);
      background-image: var(--bg-gradient);
      color: var(--fg-0);
      font-family: var(--font);
      font-size: var(--fs-md);
      font-feature-settings: "cv11", "ss03";
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      transition: background-color 0.24s var(--ease-out), color 0.18s var(--ease-out);
    }

    button, input, select, textarea { font-family: inherit; color: inherit; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.28); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

    /* Chiffres tabulaires : prix, PnL et tableaux s'alignent au pixel (même famille, pas de 2e police) */
    .mono, table, input[type="number"], .ledger td { font-family: var(--font); font-variant-numeric: tabular-nums slashed-zero; font-feature-settings: "tnum", "zero", "cv11"; letter-spacing: 0; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
    }
    .up { color: var(--up); }
    .down { color: var(--down); }
    .accent { color: var(--accent); }
    .amber { color: var(--amber); }

    /* ================= BOUTONS & ÉTATS INTERACTIFS UNIFIÉS ================= */
    .pill-btn, .tab-btn, .seg-btn, .chan-btn, .btn-panic-close, .btn-panic-halt, .draw-tool-btn, .tf-btn {
      position: relative;
      touch-action: manipulation;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition: transform var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), opacity var(--dur-fast) ease;
    }
    .pill-btn:focus-visible, .tab-btn:focus-visible, .seg-btn:focus-visible, .chan-btn:focus-visible,
    .btn-panic-close:focus-visible, .btn-panic-halt:focus-visible, .draw-tool-btn:focus-visible, .tf-btn:focus-visible,
    .agent-chip:focus-visible, button:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    .pill-btn:active:not(:disabled), .tab-btn:active:not(:disabled), .seg-btn:active:not(:disabled),
    .btn-panic-close:active:not(:disabled), .btn-panic-halt:active:not(:disabled), .draw-tool-btn:active:not(:disabled), .tf-btn:active:not(:disabled) {
      transform: scale(0.97);
    }
    button:disabled, .pill-btn:disabled, .tab-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed !important;
      transform: none !important;
      pointer-events: none;
    }
    .is-loading {
      opacity: 0.72;
      cursor: progress !important;
    }
    .is-loading::after {
      content: "";
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid currentColor;
      border-top-color: transparent;
      display: inline-block;
      margin-left: 4px;
      animation: spinLoader 0.65s linear infinite;
    }
    @keyframes spinLoader { to { transform: rotate(360deg); } }

    /* ================= STEALTH TOP BAR & MODE FOND D'ÉCRAN VIVANT ================= */
    #stealthHoverZone {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 76px;
      z-index: 62;
      pointer-events: auto;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 6px;
    }
    body:not(.stealth-desk) #stealthHoverZone { pointer-events: none; }
    #stealthHintPill {
      width: 54px;
      height: 4px;
      border-radius: 99px;
      background: var(--fg-2);
      opacity: 0;
      transition: opacity 0.3s var(--spring-fluid), width 0.25s var(--spring-fluid);
      pointer-events: none;
    }
    body.stealth-desk:not(.nav-pinned):not(.nav-revealed) #stealthHintPill { opacity: 0.38; }
    body.stealth-desk:not(.nav-pinned):not(.nav-revealed) #stealthHoverZone:hover #stealthHintPill { opacity: 0.85; width: 78px; background: var(--accent); }

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
      border-radius: var(--r-lg);
      background: var(--surface-glass);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--ring-1);
      box-shadow: var(--shadow-glass);
      transition: opacity 0.32s var(--spring-fluid), transform 0.34s var(--spring-fluid), border-color 0.2s ease;
    }
    /* Sur la page d'accueil Desk 3D non épinglée, tout le chrome disparaît pour laisser 100 % place au spectacle visuel */
    body.stealth-desk:not(.nav-pinned):not(.nav-revealed) #topNav {
      opacity: 0;
      transform: translateY(-18px) scale(0.985);
      pointer-events: none;
    }
    body.stealth-desk:not(.nav-pinned):not(.nav-revealed) #deskStatusStrip,
    body.stealth-desk:not(.nav-pinned):not(.nav-revealed) #deskFloatingBadge,
    body.stealth-desk:not(.nav-pinned):not(.nav-revealed) #panicDock {
      opacity: 0;
      transform: translateY(14px);
      pointer-events: none;
    }
    #deskStatusStrip, #deskFloatingBadge, #panicDock {
      transition: opacity 0.32s var(--spring-fluid), transform 0.34s var(--spring-fluid);
    }
    body.nav-pinned #topNav,
    body.stealth-desk.nav-revealed #topNav {
      opacity: 1;
      transform: translateY(0) scale(1);
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
      background: var(--surface-elevated);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border: 1px solid var(--ring-2);
      box-shadow: var(--shadow-glass);
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
      top: 54px;
      right: 0;
      width: min(410px, calc(100vw - 24px));
      max-height: 75vh;
      overflow-y: auto;
      z-index: 95;
      display: none;
      padding: 16px;
      border-radius: 16px;
      background: var(--surface-elevated);
      backdrop-filter: blur(28px);
      border: 1px solid var(--ring-2);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.72);
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
      background: var(--input-bg);
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
      gap: 10px;
      min-height: 600px;
      height: calc(100vh - 150px);
    }
    .chart-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--ring-1);
    }
    #lwChartContainer {
      flex: 1;
      width: 100%;
      min-height: 460px;
      position: relative;
      background: transparent;
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
      background: var(--surface-elevated);
      border: 1px solid var(--ring-2);
      color: var(--fg-0);
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
      width: min(260px, 78vw);
      padding: 9px 11px;
      border-radius: 9px;
      background: var(--surface-elevated);
      border: 1px solid var(--ring-2);
      color: var(--fg-0);
      font-size: 11px;
      font-weight: 400;
      line-height: 1.45;
      text-transform: none;
      letter-spacing: 0;
      z-index: 150;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.65);
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
      width: 420px;
      max-width: 96vw;
      z-index: 120;
      background: var(--surface-elevated);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border-left: 1px solid var(--ring-2);
      padding: 22px;
      overflow-y: auto;
      transform: translateX(104%);
      transition: transform 0.28s var(--spring-fluid);
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
      width: 460px;
      max-width: 92vw;
      padding: 22px;
      border-radius: 18px;
      background: var(--surface-elevated);
      border: 1px solid var(--down-ring);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75);
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field-lbl {
      display: block;
      font-size: 10.5px;
      color: var(--fg-2);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    /* ================= PIN NAV BUTTON & TOOLTIP ================= */
    #btnPinNav.pinned {
      background: var(--accent-bg);
      border-color: var(--accent);
      color: var(--accent);
      box-shadow: 0 0 14px var(--accent-bg);
    }

    /* ================= 20 THÈMES : APERÇUS VISUELS ================= */
    .theme-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }
    .theme-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 9px 10px;
      border-radius: 11px;
      border: 1px solid var(--ring-1);
      cursor: pointer;
      text-align: left;
      transition: transform var(--dur-fast) var(--ease-out), border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
    }
    .theme-card:hover { transform: translateY(-1px); border-color: var(--ring-2); }
    .theme-card.active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-bg); }
    .theme-card-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 11.5px; font-weight: 700; }
    .theme-card-cat { font-size: 9.5px; opacity: 0.78; font-weight: 500; }
    .theme-swatches { display: flex; gap: 4px; align-items: center; }
    .theme-swatch-dot { width: 14px; height: 14px; border-radius: 99px; border: 1px solid rgba(128, 128, 128, 0.35); }

    /* ================= PHASE 3 : STRATÉGIE DÉBUTANT & RISQUE ================= */
    .risk-field-card {
      padding: 13px;
      border-radius: 12px;
      background: rgba(128, 128, 128, 0.04);
      border: 1px solid var(--ring-1);
      margin-bottom: 10px;
    }
    .risk-field-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
    .risk-field-title { font-size: 13px; font-weight: 700; color: var(--fg-0); display: flex; align-items: center; gap: 6px; }
    .risk-field-desc { font-size: 11.5px; color: var(--fg-2); line-height: 1.45; margin-bottom: 8px; }
    .level-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .level-badge.prudent { background: var(--up-bg); color: var(--up); border-color: var(--up-ring); }
    .level-badge.balanced { background: var(--accent-bg); color: var(--accent); border-color: var(--accent); }
    .level-badge.aggressive { background: var(--down-bg); color: var(--down); border-color: var(--down-ring); }
    .reco-hint { font-size: 10.5px; color: var(--fg-2); margin-top: 5px; }
    .mode-switch-row {
      display: inline-flex;
      padding: 3px;
      border-radius: 9px;
      background: rgba(128, 128, 128, 0.08);
      border: 1px solid var(--ring-1);
      gap: 2px;
      margin-bottom: 8px;
    }
    .mode-switch-btn {
      border: none;
      background: transparent;
      color: var(--fg-2);
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .mode-switch-btn.active { background: var(--accent); color: var(--accent-fg, #020617); }
    .gauge-track {
      width: 100%;
      height: 8px;
      border-radius: 99px;
      background: rgba(128, 128, 128, 0.16);
      overflow: hidden;
      margin-top: 6px;
    }
    .gauge-fill { height: 100%; border-radius: 99px; transition: width 0.3s var(--ease-out), background-color 0.25s ease; }
    .atr-preview-box {
      margin-top: 10px;
      padding: 10px;
      border-radius: 10px;
      background: var(--input-bg);
      border: 1px solid var(--ring-1);
    }
    .live-calc-box {
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--accent-bg);
      border: 1px solid var(--accent);
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--fg-0);
      margin: 10px 0;
    }
    .validation-err-box {
      display: none;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--down-bg);
      border: 1px solid var(--down-ring);
      color: var(--down);
      font-size: 11.5px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    /* ================= PHASE 5 : CHARTS, TIMEFRAMES & DESSIN ================= */
    .chart-shell { min-height: 620px; height: calc(100vh - 148px); }
    .chart-tf-strip {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }
    .tf-btn {
      border: 1px solid var(--ring-1);
      background: transparent;
      color: var(--fg-2);
      padding: 5px 8px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .tf-btn:hover { color: var(--fg-0); border-color: var(--ring-2); background: rgba(128, 128, 128, 0.08); }
    .tf-btn.active { background: var(--accent); color: var(--accent-fg, #020617); border-color: var(--accent); }
    .tf-btn.fav { border-color: var(--amber); }
    .chart-workspace {
      flex: 1;
      display: flex;
      gap: 8px;
      min-height: 480px;
      position: relative;
      overflow: hidden;
    }
    .draw-toolbar {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px;
      border-radius: 12px;
      background: rgba(128, 128, 128, 0.06);
      border: 1px solid var(--ring-1);
      width: 46px;
      align-items: center;
      flex-shrink: 0;
      overflow-y: auto;
    }
    .draw-tool-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--fg-2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .draw-tool-btn:hover { color: var(--fg-0); background: rgba(128, 128, 128, 0.12); }
    .draw-tool-btn.active { background: var(--accent-bg); color: var(--accent); border-color: var(--accent); }
    .chart-stage {
      flex: 1;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: var(--input-bg);
      border: 1px solid var(--ring-1);
      min-width: 0;
    }
    #lwChartContainer, #tvWidgetContainer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      min-height: 460px;
    }
    #tvWidgetContainer { display: none; }
    #chartDrawCanvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 12;
      pointer-events: none;
      touch-action: none;
    }
    #chartDrawCanvas.interactive { pointer-events: auto; cursor: crosshair; }
    #chartDrawCanvas.select-mode { pointer-events: auto; cursor: default; }

    /* ================= RESPONSIVE MOBILE & TABLETTE (Zéro débordement) ================= */
    @media (max-width: 960px) {
      #topNav { left: 8px; right: 8px; top: 8px; padding: 6px 10px; gap: 6px; flex-wrap: wrap; }
      .tabs { order: 3; width: 100%; justify-content: flex-start; scrollbar-width: none; }
      .tabs::-webkit-scrollbar { display: none; }
      .nav-actions { gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
      .pill-btn, .tab-btn, .draw-tool-btn, .tf-btn { min-height: 40px; }
      .btn-text-hide-sm { display: none; }
      .view-panel { padding: 122px 10px 84px; }
      .strat-grid { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .theme-grid { grid-template-columns: 1fr; }
      #deskFloatingBadge { left: 10px; right: 10px; bottom: 68px; gap: 10px; padding: 10px 12px; flex-wrap: wrap; }
      .pnl-hero-value { font-size: 20px; }
      #panicDock { left: 10px; right: 10px; bottom: 10px; justify-content: space-between; }
      .chart-workspace { flex-direction: column; }
      .draw-toolbar { flex-direction: row; width: 100%; height: auto; overflow-x: auto; }
    }
  </style>
</head>
<body class="stealth-desk">
  <div id="stealthHoverZone"><div id="stealthHintPill" aria-hidden="true"></div></div>

  <!-- STEALTH / TOP NAVIGATION -->
  <header id="topNav">
    <div class="brand">
      <span class="brand-dot" id="liveHealthDot"></span>
      <span>TRADING FLOOR <span class="accent">V3</span></span>
    </div>

    <nav class="tabs" id="mainTabs">
      <button class="tab-btn active" data-tab="desk" onclick="switchTab(&quot;desk&quot;)" title="Raccourci : 1">DESK 3D</button>
      <button class="tab-btn" data-tab="chat" onclick="switchTab(&quot;chat&quot;)" title="Raccourci : 2">SALON ET CHAT</button>
      <button class="tab-btn" data-tab="charts" onclick="switchTab(&quot;charts&quot;)" title="Raccourci : 3">CHARTS ET TRADINGVIEW</button>
      <button class="tab-btn" data-tab="journal" onclick="switchTab(&quot;journal&quot;)" title="Raccourci : 4">JOURNAL NOTION</button>
      <button class="tab-btn" data-tab="strategy" onclick="switchTab(&quot;strategy&quot;)" title="Raccourci : 5">STRATEGIE</button>
    </nav>

    <div class="nav-actions">
      <button class="pill-btn mono" id="navLevBadge" onclick="switchTab(&quot;strategy&quot;)" title="Levier actif (cliquer pour modifier)">x5</button>
      <button id="btnExecMode" class="pill-btn auto-off" onclick="toggleExecutionMode()">Confirmation Humaine</button>
      <button class="pill-btn primary" onclick="openDrawer(&quot;mobileDrawer&quot;)" title="Connecter MT5 Téléphone &amp; Telegram">📱 <span class="btn-text-hide-sm">MT5 &amp; Telegram</span></button>
      <button id="btnAssetsToggle" class="pill-btn" onclick="toggleAssetDropdown()">Actifs ▾</button>
      <button id="btnPinNav" class="pill-btn" onclick="togglePinNav()" aria-pressed="false" data-tip="Garde la barre toujours visible sur le Desk 3D, ou la masque automatiquement en mode fond d'écran (Raccourci : P)" title="Garde la barre toujours visible / la masque automatiquement (Raccourci : P)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
        <span id="pinNavLabel" class="btn-text-hide-sm">Barre Auto</span>
      </button>
      <button class="pill-btn" onclick="openDrawer(&quot;themeDrawer&quot;)" title="Thèmes &amp; Préférences (Raccourci : T)">🎨 <span class="btn-text-hide-sm">Thèmes</span></button>
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
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div class="seg-group" id="chartEngineGroup" title="Basculer entre le widget TradingView officiel et le graphique connecté aux positions live du Desk">
            <button class="seg-btn active" data-engine="tv" onclick="setChartEngine(&quot;tv&quot;)">TradingView</button>
            <button class="seg-btn" data-engine="desk" onclick="setChartEngine(&quot;desk&quot;)">Graphique Desk</button>
          </div>
          <select id="chartSymbolSelect" class="input-dark mono" onchange="onChartSymbolChange()"></select>
          <button id="btnFavTfStar" class="pill-btn" onclick="toggleCurrentTfFavorite()" title="Ajouter ou retirer cette unité de temps des favoris">☆</button>
          <button id="btnToggleDrawLayer" class="pill-btn" onclick="toggleDrawLayer()" title="Activer la barre de dessin interactive sur le graphique">✏️ Dessin</button>
          <button class="pill-btn" onclick="refreshChartData()">↻</button>
        </div>

        <div class="chart-tf-strip" id="chartTfStrip">
          <!-- Peuplé dynamiquement : ★ Favoris + 1s, 1m, 2m, 3m, 5m, 10m, 15m, 30m, 1h, 2h, 4h, 1j, 1sem, 1mois -->
        </div>

        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span class="field-lbl" style="margin:0">Perso</span>
          <input id="customTfNum" type="number" min="1" max="999" value="7" class="input-dark mono" style="width:58px;padding:6px 8px" />
          <select id="customTfUnit" class="input-dark" style="padding:6px 8px">
            <option value="s">s</option>
            <option value="m" selected>min</option>
            <option value="h">h</option>
            <option value="d">j</option>
          </select>
          <button class="pill-btn" onclick="applyCustomTimeframe()">OK</button>
          <div class="mono" style="font-size:11px;color:var(--fg-1);display:flex;gap:12px;margin-left:6px" id="chartOverlayStats">
            <span>VWAP : --</span>
            <span>FVG : --</span>
          </div>
        </div>
      </div>

      <div class="chart-workspace">
        <aside class="draw-toolbar" id="drawToolbar" aria-label="Outils de dessin graphique">
          <button class="draw-tool-btn active" data-tool="select" onclick="setDrawTool(&quot;select&quot;)" title="Curseur : sélectionner / déplacer un tracé">↖</button>
          <button class="draw-tool-btn" data-tool="trendline" onclick="setDrawTool(&quot;trendline&quot;)" title="Ligne de tendance">╱</button>
          <button class="draw-tool-btn" data-tool="hline" onclick="setDrawTool(&quot;hline&quot;)" title="Ligne horizontale (Support / Résistance)">―</button>
          <button class="draw-tool-btn" data-tool="vline" onclick="setDrawTool(&quot;vline&quot;)" title="Ligne verticale">│</button>
          <button class="draw-tool-btn" data-tool="channel" onclick="setDrawTool(&quot;channel&quot;)" title="Canal parallèle">⫽</button>
          <button class="draw-tool-btn" data-tool="rect" onclick="setDrawTool(&quot;rect&quot;)" title="Rectangle">▭</button>
          <button class="draw-tool-btn" data-tool="zone" onclick="setDrawTool(&quot;zone&quot;)" title="Zone Offre / Demande">▦</button>
          <button class="draw-tool-btn" data-tool="fib" onclick="setDrawTool(&quot;fib&quot;)" title="Retracement de Fibonacci">𝍌</button>
          <button class="draw-tool-btn" data-tool="arrow" onclick="setDrawTool(&quot;arrow&quot;)" title="Flèche">↗</button>
          <button class="draw-tool-btn" data-tool="text" onclick="setDrawTool(&quot;text&quot;)" title="Annotation texte">T</button>
          <button class="draw-tool-btn" data-tool="measure" onclick="setDrawTool(&quot;measure&quot;)" title="Mesure (%)">📏</button>
          <hr style="width:26px;border:none;border-top:1px solid var(--ring-1);margin:2px 0" />
          <input id="drawColorPicker" type="color" value="#38bdf8" title="Couleur du tracé actif ou suivant" onchange="updateDrawColor(this.value)" style="width:30px;height:28px;border:none;background:transparent;cursor:pointer" />
          <button id="btnLockDrawing" class="draw-tool-btn" onclick="toggleSelectedDrawLock()" title="Verrouiller / Déverrouiller la sélection">🔓</button>
          <button class="draw-tool-btn" onclick="undoDrawing()" title="Annuler (Ctrl+Z)">↶</button>
          <button class="draw-tool-btn" onclick="redoDrawing()" title="Rétablir">↷</button>
          <button class="draw-tool-btn" onclick="deleteSelectedDrawing()" title="Supprimer la sélection">🗑</button>
          <button class="draw-tool-btn" onclick="clearSymbolDrawings()" title="Effacer tous les tracés de ce symbole" style="color:var(--down)">✕</button>
        </aside>

        <div class="chart-stage" id="chartStage">
          <div id="tvWidgetContainer"></div>
          <div id="lwChartContainer"></div>
          <canvas id="chartDrawCanvas"></canvas>
        </div>
      </div>
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

  <!-- ==================== TAB 5: STRATÉGIE, RISQUE & ENTRAÎNEMENT IA ==================== -->
  <section id="view-strategy" class="view-panel">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div>
        <span class="card-title" style="font-size:15px">Entraînement de l'IA (Machine Learning) &amp; Gestion du Risque</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <button class="pill-btn" onclick="applyRiskProfile('prudent')" title="Levier 2x · Risque 1 % · Perte jour max 3 %">🟢 Prudent</button>
        <button class="pill-btn" onclick="applyRiskProfile('equilibre')" title="Levier 5x · Risque 2 % · Perte jour max 5 %">🔵 Équilibré</button>
        <button class="pill-btn" onclick="applyRiskProfile('agressif')" title="Levier 25x · Risque 3.5 % · Perte jour max 10 %">🟠 Agressif</button>
        <button id="btnLockGrid" class="pill-btn" onclick="toggleGridLock()">🔒 Grille Verrouillée</button>
      </div>
    </div>

    <div class="summary-banner" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div style="flex:1;min-width:260px">
        Réglez votre protection financière en français simple. Chaque paramètre affiche son exemple chiffré, sa valeur conseillée et le montant exact risqué avant de passer un trade.
      </div>
      <button id="btnAutoPilot1Click" class="pill-btn primary" style="padding:10px 16px;font-size:12px" onclick="runOneClickAutopilot()">
        ⚡ Mode Simple 1-Clic : Entraîner l'IA &amp; Lancer les Trades Automatiquement
      </button>
    </div>

    <div class="strat-grid" id="strategyWidgetsGrid">
      <!-- WIDGET 1: CONTRÔLE DU RISQUE & TAKE PROFIT POUR DÉBUTANT -->
      <div class="glass-card strat-widget" data-widget-id="w-risk-params" draggable="false">
        <div class="card-hdr">
          <span class="card-title">Gestion du Risque, Stop-Loss &amp; Take Profit</span>
          <div class="widget-reorder-bar">
            <button class="pill-btn" onclick="moveWidget(&quot;w-risk-params&quot;, -1)">↑</button>
            <button class="pill-btn" onclick="moveWidget(&quot;w-risk-params&quot;, 1)">↓</button>
          </div>
        </div>

        <!-- 1. LEVIER -->
        <div class="risk-field-card">
          <div class="risk-field-head">
            <div class="risk-field-title">
              1. Levier de trading (1x à 500x)
              <span class="info-tip" data-tip="Multiplie la taille de votre position par rapport à votre capital. Ex. : avec 1 000 € et levier 5x, vous ouvrez une position de 5 000 €. Le garde-fou réduit automatiquement le levier si le stop est trop proche de la liquidation. Conseillé : 2x à 10x.">?</span>
            </div>
            <span id="badgeLevLevel" class="level-badge prudent">🟢 Prudent</span>
          </div>
          <div class="risk-field-desc">Multiplie votre pouvoir d'achat sur le marché. Plus le levier est élevé, plus les gains ET les pertes vont vite.</div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <input id="cfgLevSlider" type="range" min="1" max="500" value="5" class="lev-slider" oninput="syncLevFromSlider(this.value)" />
            <div style="display:flex;align-items:center;gap:4px">
              <input id="cfgLev" type="number" min="1" max="500" class="input-dark mono" style="width:74px;text-align:center;font-weight:700" oninput="syncLevFromNumber(this.value)" />
              <span class="mono accent" style="font-weight:800">x</span>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <button class="pill-btn mono" onclick="setLevPreset(2)">2x</button>
            <button class="pill-btn mono" onclick="setLevPreset(5)">5x (Reco)</button>
            <button class="pill-btn mono" onclick="setLevPreset(25)">25x</button>
            <button class="pill-btn mono" onclick="setLevPreset(100)">100x</button>
            <button class="pill-btn mono" onclick="setLevPreset(250)">250x</button>
            <button class="pill-btn mono" style="border-color:var(--down-ring);color:var(--down)" onclick="setLevPreset(500)">500x MAX</button>
          </div>
        </div>

        <!-- 2. RISQUE PAR TRADE (3 MODES — DÉBLOQUÉ EN EURO) -->
        <div class="risk-field-card">
          <div class="risk-field-head">
            <div class="risk-field-title">
              2. Risque par trade (Débloqué en € / $)
              <span class="info-tip" data-tip="Somme maximale que vous acceptez de perdre sur une position si le stop est touché. Débloqué : aucun bridage arbitraire, vous pouvez définir exactement 25 €, 50 €, 100 €, 250 €, 500 € ou plus selon votre stratégie.">?</span>
            </div>
            <span id="badgeRiskLevel" class="level-badge balanced">🔵 Équilibré</span>
          </div>
          <div class="risk-field-desc">Montant maximal mis en jeu sur une seule position en cas d'échec (sans plafond arbitraire).</div>
          <div class="mode-switch-row" id="riskModeSwitch">
            <button type="button" class="mode-switch-btn active" data-mode="pct" onclick="setRiskMode('pct')">% Capital</button>
            <button type="button" class="mode-switch-btn" data-mode="amount" onclick="setRiskMode('amount')">Montant (€ / $)</button>
            <button type="button" class="mode-switch-btn" data-mode="pips" onclick="setRiskMode('pips')">Pips</button>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <input id="cfgRiskPct" type="number" step="0.1" min="0.1" max="100" class="input-dark mono" style="flex:1" oninput="updateLiveRiskCalculator()" />
            <input id="cfgRiskAmount" type="number" step="5" min="1" max="1000000" value="100" class="input-dark mono" style="flex:1;display:none" oninput="syncRiskAmountToSl(this.value); updateLiveRiskCalculator()" />
            <input id="cfgRiskPips" type="number" step="1" min="1" max="5000" value="25" class="input-dark mono" style="flex:1;display:none" oninput="updateLiveRiskCalculator()" />
            <span id="cfgRiskUnitLbl" class="mono" style="font-weight:700;min-width:44px">%</span>
          </div>
          <div id="riskAmountPresets" style="display:none;gap:6px;flex-wrap:wrap;margin-top:7px">
            <button type="button" class="pill-btn" onclick="setQuickRiskAmount(25)">25 €</button>
            <button type="button" class="pill-btn" onclick="setQuickRiskAmount(50)">50 €</button>
            <button type="button" class="pill-btn" onclick="setQuickRiskAmount(100)">100 €</button>
            <button type="button" class="pill-btn" onclick="setQuickRiskAmount(250)">250 €</button>
            <button type="button" class="pill-btn" onclick="setQuickRiskAmount(500)">500 €</button>
          </div>
          <div class="reco-hint">En mode Montant (€/$), le sizing est calibré pour ne risquer que cette somme exacte.</div>
        </div>

        <!-- 3. STOP-LOSS & ATR (DÉBLOQUÉ EN EURO) -->
        <div class="risk-field-card">
          <div class="risk-field-head">
            <div class="risk-field-title">
              3. Stop-Loss : Montant (€ / $) ou ATR
              <span class="info-tip" data-tip="En mode Montant (€ / $), le desk coupe automatiquement le trade dès que la perte atteint ce montant (ex. : -50 € ou -100 €) et calcule le prix exact d'invalidation sur MT5. En mode ATR, le stop est placé à X fois l'amplitude moyenne.">?</span>
            </div>
            <span id="badgeAtrLevel" class="level-badge balanced">🔵 Équilibré</span>
          </div>
          <div class="risk-field-desc">Sélectionnez comment placer et déclencher le Stop-Loss : par montant fixe en €/$ ou par volatilité ATR.</div>
          <div class="mode-switch-row" id="slModeSwitch">
            <button type="button" class="mode-switch-btn active" data-mode="atr" onclick="setSlMode('atr')">ATR (Volatilité)</button>
            <button type="button" class="mode-switch-btn" data-mode="amount" onclick="setSlMode('amount')">Montant Fixe (€ / $)</button>
            <button type="button" class="mode-switch-btn" data-mode="pips" onclick="setSlMode('pips')">Pips</button>
            <button type="button" class="mode-switch-btn" data-mode="pct" onclick="setSlMode('pct')">% Capital</button>
          </div>

          <div id="slAmountWrap" style="display:none;margin-bottom:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <input id="cfgSlAmount" type="number" step="5" min="1" max="1000000" value="100" class="input-dark mono" style="flex:1" oninput="syncSlAmountToRisk(this.value); updateLiveRiskCalculator()" />
              <span class="mono" style="font-weight:700;min-width:44px">€ / $</span>
            </div>
            <div id="slAmountPresets" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px">
              <button type="button" class="pill-btn" onclick="setQuickSlAmount(25)">-25 €</button>
              <button type="button" class="pill-btn" onclick="setQuickSlAmount(50)">-50 €</button>
              <button type="button" class="pill-btn" onclick="setQuickSlAmount(100)">-100 €</button>
              <button type="button" class="pill-btn" onclick="setQuickSlAmount(250)">-250 €</button>
              <button type="button" class="pill-btn" onclick="setQuickSlAmount(500)">-500 €</button>
            </div>
            <div class="reco-hint">Coupure automatique garantie dès que la perte latente atteint ce montant.</div>
          </div>

          <div id="slAtrWrap">
            <div style="display:flex;align-items:center;gap:10px">
              <input id="cfgAtrSlider" type="range" min="0.3" max="5.0" step="0.05" value="1.35" style="flex:1" oninput="syncAtrInputs(this.value)" />
              <input id="cfgAtrMult" type="number" step="0.05" min="0.3" max="5" class="input-dark mono" style="width:78px;text-align:center" oninput="syncAtrInputs(this.value)" />
            </div>
            <div class="atr-preview-box">
              <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--fg-2);margin-bottom:4px">
                <span>Aperçu visuel du Stop-Loss selon l'ATR</span>
                <span class="mono accent" id="atrPreviewLabel">1.35× ATR</span>
              </div>
              <svg id="atrMiniChartSvg" viewBox="0 0 360 92" style="width:100%;height:92px;display:block"></svg>
            </div>
          </div>

          <div id="slPipsWrap" style="display:none;margin-bottom:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <input id="cfgSlPips" type="number" step="1" min="1" max="5000" value="25" class="input-dark mono" style="flex:1" oninput="updateLiveRiskCalculator()" />
              <span class="mono" style="font-weight:700;min-width:44px">Pips</span>
            </div>
          </div>

          <div id="slPctWrap" style="display:none;margin-bottom:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <input id="cfgSlPct" type="number" step="0.1" min="0.1" max="50" value="2.0" class="input-dark mono" style="flex:1" oninput="updateLiveRiskCalculator()" />
              <span class="mono" style="font-weight:700;min-width:44px">%</span>
            </div>
          </div>
        </div>

        <!-- 4. LIMITES DE PERTE MAXIMALE + ARRÊT AUTO -->
        <div class="risk-field-card">
          <div class="risk-field-head">
            <div class="risk-field-title">
              4. Plafonds de perte maximale
              <span class="info-tip" data-tip="Coupe-circuit de sécurité : dès que la perte atteint ce seuil (par trade, sur la journée, ou sur le compte total), le desk s'arrête automatiquement pour protéger votre capital. Recommandé : 5 % max par jour.">?</span>
            </div>
            <span id="badgeDayLossLevel" class="level-badge balanced">🔵 Équilibré</span>
          </div>
          <div class="risk-field-desc">Limites de protection automatiques par trade, par jour et sur le compte total.</div>
          <div class="form-grid" style="margin-bottom:8px">
            <div>
              <label class="field-lbl">Perte max / jour</label>
              <div style="display:flex;gap:4px">
                <select id="cfgDayLossMode" class="input-dark" style="padding:6px 8px" onchange="toggleDayLossInputs()">
                  <option value="pct">%</option>
                  <option value="amount">€ / $</option>
                  <option value="pips">Pips</option>
                </select>
                <input id="cfgDayLossPct" type="number" step="0.5" min="0.5" max="50" class="input-dark mono" style="width:100%" oninput="updateLiveRiskCalculator()" />
                <input id="cfgDayLossVal" type="number" step="50" min="10" max="500000" value="500" class="input-dark mono" style="width:100%;display:none" oninput="updateLiveRiskCalculator()" />
              </div>
            </div>
            <div>
              <label class="field-lbl">Plafond perte / trade (0 = off)</label>
              <div style="display:flex;gap:4px">
                <select id="cfgMaxTradeLossMode" class="input-dark" style="padding:6px 8px" onchange="updateLiveRiskCalculator()">
                  <option value="amount">€ / $</option>
                  <option value="pct">%</option>
                  <option value="pips">Pips</option>
                </select>
                <input id="cfgMaxTradeLossVal" type="number" step="10" min="0" max="500000" value="0" class="input-dark mono" style="width:100%" oninput="updateLiveRiskCalculator()" />
              </div>
            </div>
          </div>
          <div class="form-grid" style="margin-bottom:8px">
            <div>
              <label class="field-lbl">Perte max totale (0 = off)</label>
              <div style="display:flex;gap:4px">
                <select id="cfgTotalLossMode" class="input-dark" style="padding:6px 8px" onchange="updateLiveRiskCalculator()">
                  <option value="pct">%</option>
                  <option value="amount">€ / $</option>
                </select>
                <input id="cfgTotalLossVal" type="number" step="1" min="0" max="500000" value="0" class="input-dark mono" style="width:100%" oninput="updateLiveRiskCalculator()" />
              </div>
            </div>
            <label style="display:flex;align-items:center;gap:8px;padding-top:18px;font-size:12px;cursor:pointer">
              <input id="cfgAutoStopLossChk" type="checkbox" checked onchange="updateLiveRiskCalculator()" />
              <span>Arrêt automatique si limite atteinte</span>
            </label>
          </div>
        </div>

        <!-- 5. TAKE PROFIT (DÉBLOQUÉ EN EURO) & OBJECTIF DU JOUR -->
        <div class="risk-field-card">
          <div class="risk-field-head">
            <div class="risk-field-title">
              5. Take Profit (Débloqué en € / $) &amp; Objectif du jour
              <span class="info-tip" data-tip="En mode Montant (€ / $), le trade se ferme automatiquement dès que le gain atteint ce montant (ex. : +100 € ou +200 €). Débloqué : aucun bridage de gain.">?</span>
            </div>
            <span class="level-badge balanced">Objectif</span>
          </div>
          <div class="risk-field-desc">Règle de prise de profit automatique par position en € / $, ratio R ou pips, plus objectif journalier optionnel.</div>
          <div class="mode-switch-row" id="tpModeSwitch">
            <button type="button" class="mode-switch-btn active" data-mode="rr" onclick="setTpMode('rr')">Ratio (R)</button>
            <button type="button" class="mode-switch-btn" data-mode="amount" onclick="setTpMode('amount')">Montant (€ / $)</button>
            <button type="button" class="mode-switch-btn" data-mode="pips" onclick="setTpMode('pips')">Pips</button>
            <button type="button" class="mode-switch-btn" data-mode="pct" onclick="setTpMode('pct')">% Capital</button>
          </div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
            <input id="cfgTpVal" type="number" step="0.1" min="0.2" max="1000000" value="2.0" class="input-dark mono" style="flex:1" oninput="updateLiveRiskCalculator()" />
            <span id="cfgTpExampleLbl" style="font-size:11px;color:var(--fg-2)">Ex. : viser 2× le risque</span>
          </div>
          <div id="tpAmountPresets" style="display:none;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <button type="button" class="pill-btn" onclick="setQuickTpAmount(50)">+50 €</button>
            <button type="button" class="pill-btn" onclick="setQuickTpAmount(100)">+100 €</button>
            <button type="button" class="pill-btn" onclick="setQuickTpAmount(200)">+200 €</button>
            <button type="button" class="pill-btn" onclick="setQuickTpAmount(500)">+500 €</button>
            <button type="button" class="pill-btn" onclick="setQuickTpAmount(1000)">+1 000 €</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--ring-1)">
            <label style="display:flex;align-items:center;gap:7px;font-size:12px;cursor:pointer">
              <input id="cfgDailyTpEnabled" type="checkbox" onchange="updateLiveRiskCalculator()" />
              <span>Fermer tout quand le profit du jour atteint</span>
            </label>
            <input id="cfgDailyTpVal" type="number" step="25" min="10" max="500000" value="500" class="input-dark mono" style="width:92px" oninput="updateLiveRiskCalculator()" />
            <select id="cfgDailyTpMode" class="input-dark" style="padding:6px 8px" onchange="updateLiveRiskCalculator()">
              <option value="amount">€ / $</option>
              <option value="pct">%</option>
            </select>
          </div>
        </div>

        <!-- 6. CALCULATEUR EN DIRECT & VALIDATION -->
        <div id="liveRiskSummaryBox" class="live-calc-box">
          Calcul en direct...
        </div>
        <div id="riskValidationAlert" class="validation-err-box"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="btnSaveRisk" class="pill-btn primary" style="flex:1;justify-content:center" onclick="validateAndSaveRiskSettings()">Sauvegarder les réglages</button>
          <button class="pill-btn" onclick="resetRiskToRecommended()">Réinitialiser</button>
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

      <!-- WIDGET 3: STEP-BY-STEP ML TRAINING -->
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
            <span class="info-tip" data-tip="Choisissez la paire ou l'actif sur lequel l'IA va rejouer les bougies passées pour s'améliorer.">?</span>
          </div>
          <select id="grpoSymbolSelect" class="input-dark mono" style="width:100%"></select>
        </div>

        <div class="step-box">
          <div class="step-title">
            Étape 2 : Horizon &amp; Période (DD/MM/YYYY)
            <span class="info-tip" data-tip="Scalping = trades rapides 15m ; Day Trading = session 1h ; Swing = tendance 4h.">?</span>
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

      <!-- WIDGET 4: REPORTS -->
      <div class="glass-card strat-widget" data-widget-id="w-reports" draggable="false">
        <div class="card-hdr">
          <span class="card-title">Rapports d'Optimisation &amp; Reviewer</span>
          <div class="widget-reorder-bar">
            <button class="pill-btn" onclick="moveWidget(&quot;w-reports&quot;, -1)">↑</button>
            <button class="pill-btn" onclick="moveWidget(&quot;w-reports&quot;, 1)">↓</button>
          </div>
        </div>
        <div id="trainingReportHost" style="font-size:12px;color:var(--fg-1);max-height:380px;overflow-y:auto"></div>
      </div>
    </div>
  </section>

  <!-- DANGER RISK CONFIRM MODAL -->
  <div id="dangerRiskModal" class="modal-backdrop">
    <div class="modal-box">
      <h3 style="font-size:16px;font-weight:800;color:var(--amber);margin-bottom:8px">Confirmation — Réglages Agressifs</h3>
      <p style="font-size:12.5px;color:var(--fg-1);line-height:1.5;margin-bottom:14px" id="dangerRiskModalDesc"></p>
      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="pill-btn" onclick="closeDangerRiskModal()">Modifier mes réglages</button>
        <button class="pill-btn primary" onclick="confirmSaveDangerRisk()">Confirmer et sauvegarder</button>
      </div>
    </div>
  </div>

  <!-- ==================== GLOBAL THEME SETTINGS DRAWER (20 THÈMES) ==================== -->
  <aside id="themeDrawer" class="drawer">
    <div class="card-hdr">
      <span class="card-title">Thèmes Studio (20 Palettes AA)</span>
      <button class="pill-btn" onclick="closeDrawer(&quot;themeDrawer&quot;)">✕</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;font-size:12px">
      <div>
        <label class="field-lbl">Sélection Instantanée (Sombres, Clairs, Terminal, Luxe, Néon)</label>
        <div id="themePresetsGrid" class="theme-grid"></div>
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
        <label class="field-lbl">Transparence Verre (<span id="glassValLbl">80</span>%)</label>
        <input id="prefGlassAlpha" type="range" min="35" max="98" value="80" style="width:100%" oninput="updateGlassAlpha(this.value)" />
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
      obsidian:       { theme: 'obsidian',       label: 'Obsidian Quant',    cat: 'Sombre',   isLight: false, bg0: '#03060c', bg1: '#070c16', bg2: '#0d1526', bg3: '#152138', fg0: '#f8fafc', fg1: '#e2e8f0', fg2: '#a1b0c4', fg3: '#7a8aa0', accent: '#38bdf8', up: '#10b981', down: '#f43f5e', amber: '#fbbf24', glassRgb: '11, 17, 30',   elevRgb: '13, 21, 38',   inRgb: '4, 8, 16',     grad: 'radial-gradient(circle at 20% 0%, #0e1d36 0%, #050912 52%, #020408 100%)', alpha: 80 },
      midnight:       { theme: 'midnight',       label: 'Deep Midnight',     cat: 'Sombre',   isLight: false, bg0: '#06071b', bg1: '#0c0e2c', bg2: '#141744', bg3: '#1e235c', fg0: '#f8fafc', fg1: '#e2e8f0', fg2: '#b3b9db', fg3: '#8890b8', accent: '#a78bfa', up: '#2dd4bf', down: '#fb7185', amber: '#fbbf24', glassRgb: '16, 19, 54',   elevRgb: '20, 23, 68',   inRgb: '8, 10, 32',    grad: 'radial-gradient(circle at 75% 10%, #261b54 0%, #090b24 55%, #040514 100%)', alpha: 82 },
      carbon:         { theme: 'carbon',         label: 'Carbon Titanium',   cat: 'Sombre',   isLight: false, bg0: '#0a0b0d', bg1: '#121417', bg2: '#1a1d22', bg3: '#252930', fg0: '#fafafa', fg1: '#e4e4e7', fg2: '#a1a1aa', fg3: '#71717a', accent: '#60a5fa', up: '#34d399', down: '#f87171', amber: '#facc15', glassRgb: '18, 20, 23',   elevRgb: '24, 27, 32',   inRgb: '10, 11, 14',   grad: 'radial-gradient(circle at 50% 0%, #1f242d 0%, #0d0e11 55%, #07080a 100%)', alpha: 84 },
      nordic:         { theme: 'nordic',         label: 'Nordic Polar',      cat: 'Sombre',   isLight: false, bg0: '#191d24', bg1: '#222832', bg2: '#2b323f', bg3: '#363f4e', fg0: '#eceff4', fg1: '#d8dee9', fg2: '#b2bdcf', fg3: '#8f9bb0', accent: '#88c0d0', up: '#a3be8c', down: '#bf616a', amber: '#ebcb8b', glassRgb: '34, 40, 50',   elevRgb: '39, 46, 58',   inRgb: '25, 29, 36',   grad: 'radial-gradient(circle at 25% 15%, #2b3445 0%, #1d222b 60%, #151920 100%)', alpha: 84 },
      eclipse:        { theme: 'eclipse',        label: 'OLED Pure Black',   cat: 'Sombre',   isLight: false, bg0: '#000000', bg1: '#070708', bg2: '#101013', bg3: '#18181d', fg0: '#ffffff', fg1: '#e5e7eb', fg2: '#9ca3af', fg3: '#757c87', accent: '#38bdf8', up: '#22c55e', down: '#ef4444', amber: '#fbbf24', glassRgb: '8, 8, 10',     elevRgb: '14, 14, 18',   inRgb: '0, 0, 0',      grad: 'radial-gradient(circle at 50% 0%, #11141c 0%, #000000 60%, #000000 100%)', alpha: 88 },
      cobalt:         { theme: 'cobalt',         label: 'Private Cobalt',    cat: 'Sombre',   isLight: false, bg0: '#040a1a', bg1: '#08122b', bg2: '#0f1e42', bg3: '#182b5c', fg0: '#f8fafc', fg1: '#dbeafe', fg2: '#9cb8df', fg3: '#7592bd', accent: '#3b82f6', up: '#22d3ee', down: '#f43f5e', amber: '#fbbf24', glassRgb: '8, 18, 43',    elevRgb: '13, 27, 62',   inRgb: '4, 10, 26',    grad: 'radial-gradient(circle at 80% 0%, #102a63 0%, #050d22 55%, #020612 100%)', alpha: 82 },
      'imperial-gold':{ theme: 'imperial-gold',  label: 'Imperial Gold',     cat: 'Luxe',     isLight: false, bg0: '#080705', bg1: '#120f0a', bg2: '#1d1810', bg3: '#2c2418', fg0: '#fdf8ec', fg1: '#ede0c4', fg2: '#bfae8a', fg3: '#8f7f5f', accent: '#eab308', up: '#4ade80', down: '#fb7185', amber: '#f59e0b', glassRgb: '18, 15, 10',   elevRgb: '26, 22, 15',   inRgb: '10, 8, 5',     grad: 'radial-gradient(circle at 30% 0%, #2b210d 0%, #0d0b07 55%, #050403 100%)', alpha: 84 },
      'monaco-bronze':{ theme: 'monaco-bronze',  label: 'Monaco Bronze',     cat: 'Luxe',     isLight: false, bg0: '#0c0807', bg1: '#17100e', bg2: '#241814', bg3: '#33221d', fg0: '#faf5f2', fg1: '#ebd8ce', fg2: '#bfa497', fg3: '#8d7367', accent: '#fb923c', up: '#34d399', down: '#f43f5e', amber: '#fbbf24', glassRgb: '23, 16, 14',   elevRgb: '33, 22, 19',   inRgb: '12, 8, 7',     grad: 'radial-gradient(circle at 70% 10%, #361d14 0%, #120b09 55%, #080504 100%)', alpha: 84 },
      'platinum-noir':{ theme: 'platinum-noir',  label: 'Platinum Noir',     cat: 'Luxe',     isLight: false, bg0: '#07080a', bg1: '#101216', bg2: '#191c22', bg3: '#242830', fg0: '#ffffff', fg1: '#e2e5ea', fg2: '#a6adb8', fg3: '#7c8490', accent: '#e2e8f0', up: '#4ade80', down: '#fb7185', amber: '#fcd34d', glassRgb: '16, 18, 22',   elevRgb: '23, 26, 32',   inRgb: '8, 9, 12',     grad: 'radial-gradient(circle at 20% 0%, #242934 0%, #0b0d10 55%, #050608 100%)', alpha: 84 },
      amber:          { theme: 'amber',          label: 'Bloomberg Amber',   cat: 'Terminal', isLight: false, bg0: '#0c0802', bg1: '#161005', bg2: '#241908', bg3: '#36250c', fg0: '#fffbeb', fg1: '#fde68a', fg2: '#d6a851', fg3: '#a37b35', accent: '#f59e0b', up: '#22c55e', down: '#f43f5e', amber: '#fbbf24', glassRgb: '24, 17, 7',    elevRgb: '32, 22, 9',    inRgb: '12, 8, 2',     grad: 'radial-gradient(circle at 50% 0%, #2e1d06 0%, #100b03 55%, #070501 100%)', alpha: 84 },
      emerald:        { theme: 'emerald',        label: 'Matrix Emerald',    cat: 'Terminal', isLight: false, bg0: '#020c08', bg1: '#051610', bg2: '#0a241b', bg3: '#103428', fg0: '#ecfdf5', fg1: '#bbf7d0', fg2: '#7dc9a4', fg3: '#539977', accent: '#34d399', up: '#10b981', down: '#f43f5e', amber: '#fbbf24', glassRgb: '6, 24, 18',    elevRgb: '9, 34, 25',    inRgb: '2, 12, 8',     grad: 'radial-gradient(circle at 30% 10%, #0b3324 0%, #03120c 55%, #010805 100%)', alpha: 82 },
      'reuters-cyan': { theme: 'reuters-cyan',   label: 'Eikon Terminal',    cat: 'Terminal', isLight: false, bg0: '#020a0f', bg1: '#06151e', bg2: '#0b2230', bg3: '#123144', fg0: '#ecfeff', fg1: '#cffafe', fg2: '#8cb8c9', fg3: '#618fa0', accent: '#06b6d4', up: '#10b981', down: '#fb7185', amber: '#f59e0b', glassRgb: '6, 21, 30',    elevRgb: '10, 30, 42',   inRgb: '3, 10, 15',    grad: 'radial-gradient(circle at 60% 0%, #0c3547 0%, #04121a 55%, #01070b 100%)', alpha: 84 },
      cyberpunk:      { theme: 'cyberpunk',      label: 'Neon Cyberpunk',    cat: 'Néon',     isLight: false, bg0: '#090312', bg1: '#120624', bg2: '#1c0a36', bg3: '#2a104f', fg0: '#fdf2f8', fg1: '#f5d0fe', fg2: '#c994d6', fg3: '#9566a3', accent: '#ec4899', up: '#22d3ee', down: '#f43f5e', amber: '#fbbf24', glassRgb: '22, 8, 42',    elevRgb: '30, 12, 56',   inRgb: '10, 4, 20',    grad: 'radial-gradient(circle at 80% 15%, #3d0f54 0%, #100521 55%, #06020d 100%)', alpha: 82 },
      synthwave:      { theme: 'synthwave',      label: 'Tokyo Synthwave',   cat: 'Néon',     isLight: false, bg0: '#10071e', bg1: '#1a0d30', bg2: '#261445', bg3: '#361d61', fg0: '#fff1f2', fg1: '#fecdd3', fg2: '#c4a4d6', fg3: '#9476a8', accent: '#f97316', up: '#2dd4bf', down: '#fb7185', amber: '#facc15', glassRgb: '26, 13, 48',   elevRgb: '36, 18, 66',   inRgb: '14, 6, 26',    grad: 'radial-gradient(circle at 50% 0%, #4c1d6e 0%, #170a2b 58%, #0b0416 100%)', alpha: 82 },
      aurora:         { theme: 'aurora',         label: 'Aurora Borealis',   cat: 'Néon',     isLight: false, bg0: '#030d12', bg1: '#071a22', bg2: '#0d2934', bg3: '#143c4a', fg0: '#f0fdfa', fg1: '#ccfbf1', fg2: '#89c4be', fg3: '#5f9691', accent: '#4ade80', up: '#22d3ee', down: '#fb7185', amber: '#fbbf24', glassRgb: '7, 26, 34',    elevRgb: '11, 38, 48',   inRgb: '3, 13, 18',    grad: 'radial-gradient(circle at 30% 0%, #0d4a44 0%, #061822 55%, #02090d 100%)', alpha: 82 },
      'crystal-glass':{ theme: 'crystal-glass',  label: 'Crystal Glass',     cat: 'Glass',    isLight: false, bg0: '#0b1120', bg1: '#131d33', bg2: '#1d2b48', bg3: '#273a5e', fg0: '#ffffff', fg1: '#e2e8f0', fg2: '#a8b7cc', fg3: '#7d8fa6', accent: '#7dd3fc', up: '#34d399', down: '#fb7185', amber: '#fcd34d', glassRgb: '29, 43, 72',   elevRgb: '22, 34, 58',   inRgb: '11, 17, 32',   grad: 'radial-gradient(circle at 50% 0%, #1e3a5f 0%, #0f172a 55%, #070b14 100%)', alpha: 58 },
      'zen-mono':     { theme: 'zen-mono',       label: 'Minimal Mono',      cat: 'Minimal',  isLight: false, bg0: '#0d0d0d', bg1: '#161616', bg2: '#202020', bg3: '#2c2c2c', fg0: '#f5f5f5', fg1: '#d4d4d4', fg2: '#9a9a9a', fg3: '#737373', accent: '#e5e5e5', up: '#4ade80', down: '#f87171', amber: '#fbbf24', glassRgb: '24, 24, 24',   elevRgb: '30, 30, 30',   inRgb: '14, 14, 14',   grad: 'linear-gradient(180deg, #161616 0%, #0a0a0a 100%)', alpha: 88 },
      'swiss-light':  { theme: 'swiss-light',    label: 'Swiss Ivory',       cat: 'Clair AA', isLight: true,  bg0: '#f3f5f8', bg1: '#ffffff', bg2: '#e9edf3', bg3: '#dce3ec', fg0: '#0f172a', fg1: '#1e293b', fg2: '#475569', fg3: '#64748b', accent: '#0369a1', up: '#047857', down: '#be123c', amber: '#b45309', glassRgb: '255, 255, 255',elevRgb: '255, 255, 255',inRgb: '241, 245, 249',grad: 'radial-gradient(circle at 20% 0%, #e0e8f4 0%, #f3f5f8 60%, #eaeef4 100%)', alpha: 88 },
      'paper-journal':{ theme: 'paper-journal',  label: 'Financial Paper',   cat: 'Clair AA', isLight: true,  bg0: '#f6f1e7', bg1: '#fdfaf3', bg2: '#ede5d5', bg3: '#dfd5c0', fg0: '#1c1917', fg1: '#292524', fg2: '#57534e', fg3: '#78716c', accent: '#9a3412', up: '#15803d', down: '#b91c1c', amber: '#a16207', glassRgb: '253, 250, 243',elevRgb: '253, 250, 243',inRgb: '245, 239, 227',grad: 'radial-gradient(circle at 50% 0%, #efe7d6 0%, #f6f1e7 65%, #ebe2cf 100%)', alpha: 90 },
      'alabaster-pro':{ theme: 'alabaster-pro',  label: 'Alabaster Studio',  cat: 'Clair AA', isLight: true,  bg0: '#eef2f6', bg1: '#f8fafc', bg2: '#e2e8f0', bg3: '#cbd5e1', fg0: '#090d16', fg1: '#1e293b', fg2: '#475569', fg3: '#5b6b80', accent: '#4f46e5', up: '#059669', down: '#e11d48', amber: '#b45309', glassRgb: '248, 250, 252',elevRgb: '255, 255, 255',inRgb: '236, 241, 247',grad: 'radial-gradient(circle at 75% 0%, #dbeafe 0%, #eef2f6 60%, #e2e8f0 100%)', alpha: 88 }
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

    var stealthHideTimer = null;
    var mouseParallaxX = 0;
    var mouseParallaxY = 0;
    var targetParallaxX = 0;
    var targetParallaxY = 0;
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // ==================== GLOBAL THEME ENGINE (20 THÈMES AA) ====================
    function getCurrentThemePrefs() {
      try {
        var raw = localStorage.getItem('tf_v3_theme_prefs');
        if (raw) {
          var parsed = JSON.parse(raw);
          var base = THEME_PRESETS[parsed.theme] || THEME_PRESETS.obsidian;
          return Object.assign({}, base, parsed);
        }
      } catch (e) {}
      return Object.assign({}, THEME_PRESETS.obsidian);
    }

    function renderThemePresetsGrid(activeName) {
      var host = document.getElementById('themePresetsGrid');
      if (!host) return;
      host.innerHTML = Object.keys(THEME_PRESETS).map(function (k) {
        var t = THEME_PRESETS[k];
        var isAct = k === activeName;
        return (
          '<button type="button" class="theme-card' + (isAct ? ' active' : '') + '" ' +
          'style="background:' + t.bg1 + ';color:' + t.fg0 + ';border-color:' + (isAct ? t.accent : 'rgba(128,128,128,0.28)') + '" ' +
          'onclick="applyThemePreset(&quot;' + k + '&quot;)">' +
            '<div class="theme-card-top"><span>' + t.label + '</span><span class="theme-card-cat">' + t.cat + '</span></div>' +
            '<div class="theme-swatches">' +
              '<span class="theme-swatch-dot" style="background:' + t.bg0 + '" title="Fond"></span>' +
              '<span class="theme-swatch-dot" style="background:' + t.accent + '" title="Accent"></span>' +
              '<span class="theme-swatch-dot" style="background:' + t.up + '" title="Hausse"></span>' +
              '<span class="theme-swatch-dot" style="background:' + t.down + '" title="Baisse"></span>' +
              (isAct ? '<span style="margin-left:auto;font-size:10px;font-weight:800;color:' + t.accent + '">ACTIF</span>' : '') +
            '</div>' +
          '</button>'
        );
      }).join('');
    }

    function applyThemeValues(p, persist) {
      var name = p.theme || 'obsidian';
      var base = THEME_PRESETS[name] || THEME_PRESETS.obsidian;
      var t = Object.assign({}, base, p);
      document.documentElement.setAttribute('data-theme', name);
      var r = document.documentElement.style;
      r.setProperty('--bg-0', t.bg0);
      r.setProperty('--bg-1', t.bg1);
      r.setProperty('--bg-2', t.bg2);
      r.setProperty('--bg-3', t.bg3);
      r.setProperty('--bg-gradient', t.grad);
      r.setProperty('--fg-0', t.fg0);
      r.setProperty('--fg-1', t.fg1);
      r.setProperty('--fg-2', t.fg2);
      r.setProperty('--fg-3', t.fg3);
      r.setProperty('--accent', t.accent);
      r.setProperty('--accent-fg', t.isLight ? '#ffffff' : '#020617');
      r.setProperty('--accent-bg', hexToRgba(t.accent, t.isLight ? 0.14 : 0.17));
      r.setProperty('--up', t.up);
      r.setProperty('--up-bg', hexToRgba(t.up, t.isLight ? 0.13 : 0.16));
      r.setProperty('--up-ring', hexToRgba(t.up, 0.44));
      r.setProperty('--down', t.down);
      r.setProperty('--down-bg', hexToRgba(t.down, t.isLight ? 0.13 : 0.16));
      r.setProperty('--down-ring', hexToRgba(t.down, 0.44));
      r.setProperty('--amber', t.amber);
      r.setProperty('--ring-1', t.isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.11)');
      r.setProperty('--ring-2', t.isLight ? 'rgba(15, 23, 42, 0.26)' : 'rgba(255, 255, 255, 0.24)');
      r.setProperty('--shadow-glass', t.isLight
        ? '0 0 0 1px rgba(15,23,42,0.10), 0 10px 28px rgba(15,23,42,0.08)'
        : '0 0 0 1px var(--ring-1), 0 14px 36px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.08)');
      r.setProperty('--surface-elevated', 'rgba(' + (t.elevRgb || t.glassRgb || '13,21,38') + ', 0.97)');
      r.setProperty('--input-bg', 'rgba(' + (t.inRgb || t.glassRgb || '4,8,16') + ', ' + (t.isLight ? '0.92' : '0.82') + ')');

      var a = Number(t.alpha || 80) / 100;
      r.setProperty('--surface-glass', 'rgba(' + (t.glassRgb || '11, 17, 30') + ', ' + a.toFixed(2) + ')');
      var lbl = document.getElementById('glassValLbl');
      if (lbl) lbl.textContent = String(t.alpha || 80);
      var sl = document.getElementById('prefGlassAlpha');
      if (sl) sl.value = String(t.alpha || 80);
      var ac = document.getElementById('prefAccent');
      if (ac && t.accent) ac.value = t.accent;
      var upEl = document.getElementById('prefUp');
      if (upEl && t.up) upEl.value = t.up;
      var thChip = document.getElementById('deskThemeChip');
      if (thChip) thChip.textContent = 'THÈME : ' + String(t.label || name).toUpperCase();

      if (persist !== false) {
        try { localStorage.setItem('tf_v3_theme_prefs', JSON.stringify(t)); } catch (e) {}
      }
      renderThemePresetsGrid(name);
      sync3dTheme(t);
      syncChartsWithTheme(t);
      if (typeof chartEngine !== 'undefined' && chartEngine === 'tv' && currentTab === 'charts') {
        initTradingViewWidget();
      }
      if (deskState) renderAll();
    }

    function syncChartsWithTheme(t) {
      var textCol = t.fg2 || '#94a3b8';
      var gridCol = t.isLight ? 'rgba(15,23,42,0.07)' : 'rgba(255,255,255,0.06)';
      var bordCol = t.isLight ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.12)';
      if (lwChart) {
        try {
          lwChart.applyOptions({
            layout: { background: { color: 'transparent' }, textColor: textCol },
            grid: { vertLines: { color: gridCol }, horzLines: { color: gridCol } },
            timeScale: { borderColor: bordCol },
            rightPriceScale: { borderColor: bordCol }
          });
          if (lwCandleSeries) {
            lwCandleSeries.applyOptions({
              upColor: t.up, downColor: t.down,
              borderUpColor: t.up, borderDownColor: t.down,
              wickUpColor: t.up, wickDownColor: t.down
            });
          }
        } catch (e) {}
      }
      if (eqChart) {
        try {
          eqChart.applyOptions({
            layout: { background: { color: 'transparent' }, textColor: textCol },
            grid: { vertLines: { color: gridCol }, horzLines: { color: gridCol } }
          });
          if (eqAreaSeries && t.up) {
            eqAreaSeries.applyOptions({ lineColor: t.up, topColor: hexToRgba(t.up, 0.34), bottomColor: hexToRgba(t.up, 0.02) });
          }
        } catch (e) {}
      }
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

    // ==================== NAVIGATION, FOND D'ÉCRAN VIVANT & PIN PERSISTANT ====================
    function applyPinState(pinned) {
      document.body.classList.toggle('nav-pinned', Boolean(pinned));
      var btn = document.getElementById('btnPinNav');
      var lbl = document.getElementById('pinNavLabel');
      if (btn) {
        btn.classList.toggle('pinned', Boolean(pinned));
        btn.setAttribute('aria-pressed', pinned ? 'true' : 'false');
      }
      if (lbl) lbl.textContent = pinned ? 'Barre Épinglée' : 'Barre Auto';
      try { localStorage.setItem('tf_v3_nav_pinned', pinned ? '1' : '0'); } catch (e) {}
    }

    function togglePinNav() {
      var next = !document.body.classList.contains('nav-pinned');
      applyPinState(next);
      if (!next && currentTab === 'desk') {
        scheduleStealthHide(1200);
      }
    }

    function revealStealthNav(stickyMs) {
      if (currentTab !== 'desk') return;
      document.body.classList.add('nav-revealed');
      if (stickyMs) scheduleStealthHide(stickyMs);
    }

    function scheduleStealthHide(delayMs) {
      if (stealthHideTimer) clearTimeout(stealthHideTimer);
      stealthHideTimer = setTimeout(function () {
        if (currentTab !== 'desk') return;
        if (document.body.classList.contains('nav-pinned')) return;
        var navEl = document.getElementById('topNav');
        var zoneEl = document.getElementById('stealthHoverZone');
        var assetMenu = document.getElementById('assetDropdownMenu');
        if (navEl && (navEl.matches(':hover') || navEl.contains(document.activeElement))) return;
        if (zoneEl && zoneEl.matches(':hover')) return;
        if (assetMenu && assetMenu.style.display === 'block') return;
        document.body.classList.remove('nav-revealed');
      }, delayMs || 2400);
    }

    function setupStealthAndShortcuts() {
      try {
        var savedPin = localStorage.getItem('tf_v3_nav_pinned') === '1';
        applyPinState(savedPin);
      } catch (e) {}

      var nav = document.getElementById('topNav');
      var zone = document.getElementById('stealthHoverZone');
      [nav, zone].forEach(function (el) {
        if (!el) return;
        el.addEventListener('pointerenter', function () {
          if (stealthHideTimer) clearTimeout(stealthHideTimer);
          revealStealthNav(0);
        });
        el.addEventListener('pointerleave', function () { scheduleStealthHide(1800); });
      });

      window.addEventListener('pointermove', function (e) {
        var w = window.innerWidth || 1;
        var h = window.innerHeight || 1;
        targetParallaxX = ((e.clientX / w) - 0.5) * 2;
        targetParallaxY = ((e.clientY / h) - 0.5) * 2;
        if (currentTab === 'desk' && e.clientY <= 78) {
          revealStealthNav(2600);
        }
      });

      window.addEventListener('touchstart', function (e) {
        if (currentTab === 'desk' && e.touches && e.touches[0] && e.touches[0].clientY <= 110) {
          revealStealthNav(3200);
        }
      }, { passive: true });

      window.addEventListener('keydown', function (e) {
        var tag = document.activeElement ? document.activeElement.tagName : '';
        if (e.key === 'Escape') {
          closeDrawer('themeDrawer');
          closeDrawer('journalDrawer');
          closeDrawer('mobileDrawer');
          closePanicModal();
          closeDangerRiskModal();
          var am = document.getElementById('assetDropdownMenu');
          if (am) am.style.display = 'none';
          var ins = document.getElementById('deskNodeInspector');
          if (ins) ins.style.display = 'none';
          return;
        }
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && currentTab === 'charts') {
          e.preventDefault();
          undoDrawing();
          return;
        }
        var tabs = { '1': 'desk', '2': 'chat', '3': 'charts', '4': 'journal', '5': 'strategy' };
        if (tabs[e.key]) { switchTab(tabs[e.key]); return; }
        if (e.key.toLowerCase() === 'p') { togglePinNav(); return; }
        if (e.key.toLowerCase() === 't') {
          var td = document.getElementById('themeDrawer');
          if (td && td.classList.contains('open')) closeDrawer('themeDrawer'); else openDrawer('themeDrawer');
        }
      });
    }

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
        document.body.classList.remove('nav-revealed');
        resize3dCanvas();
      } else {
        document.body.classList.remove('stealth-desk');
        document.body.classList.add('nav-revealed');
      }
      if (tab === 'charts') {
        setTimeout(function () { initChartTab(); }, 60);
      }
      if (tab === 'journal') {
        setTimeout(function () { renderJournalView(); renderEquityChart(); }, 60);
      }
      if (tab === 'strategy') {
        fetchRlMemory();
        if (!strategyFormInitialized && deskState && deskState.settings) {
          populateStrategyForm(deskState.settings, false);
        }
        setTimeout(function () { updateLiveRiskCalculator(); }, 40);
      }
    }

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
      ctx.font = "700 34px 'Inter Variable', 'Inter Fallback', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 66);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = "600 26px 'Inter Variable', 'Inter Fallback', sans-serif";
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

        var headGroup = new THREE.Group();
        headGroup.position.y = 0.58;
        var head = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 18, 18),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.3 })
        );
        head.castShadow = true;
        headGroup.add(head);

        var visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.10, 0.18),
          new THREE.MeshBasicMaterial({ color: col })
        );
        visor.position.set(0, 0.01, 0.16);
        headGroup.add(visor);
        avatar.add(headGroup);

        var armGeo = new THREE.BoxGeometry(0.11, 0.34, 0.11);
        var armMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.45 });
        var armL = new THREE.Mesh(armGeo, armMat);
        armL.position.set(-0.36, 0.12, 0.24);
        armL.rotation.x = -0.95;
        avatar.add(armL);
        var armR = new THREE.Mesh(armGeo, armMat);
        armR.position.set(0.36, 0.12, 0.24);
        armR.rotation.x = -0.95;
        avatar.add(armR);

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
          headGroup: headGroup,
          armL: armL,
          armR: armR,
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

      renderer3d.domElement.addEventListener('pointerdown', function (e) { drag = true; prevX = e.clientX; prevY = e.clientY; });
      window.addEventListener('pointerup', function () { drag = false; });
      window.addEventListener('pointermove', function (e) {
        if (!drag) return;
        yaw -= (e.clientX - prevX) * 0.006;
        pitch = Math.max(0.18, Math.min(1.22, pitch + (e.clientY - prevY) * 0.005));
        prevX = e.clientX;
        prevY = e.clientY;
      });
      renderer3d.domElement.addEventListener('wheel', function (e) {
        zoom = Math.max(10, Math.min(32, zoom + e.deltaY * 0.015));
      }, { passive: true });
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
        if (currentTab !== 'desk') return;
        clk += prefersReducedMotion ? 0.002 : 0.016;

        // Parallaxe ressort douce suivant le pointeur/doigt
        mouseParallaxX += (targetParallaxX - mouseParallaxX) * 0.06;
        mouseParallaxY += (targetParallaxY - mouseParallaxY) * 0.06;

        var sway = prefersReducedMotion ? 0 : Math.sin(clk * 0.18) * 0.07;
        var camAngle = yaw + sway + mouseParallaxX * 0.14;
        var effPitch = Math.max(0.18, Math.min(1.22, pitch + mouseParallaxY * 0.08));
        camera3d.position.x = Math.sin(camAngle) * Math.cos(effPitch) * zoom;
        camera3d.position.y = Math.sin(effPitch) * zoom;
        camera3d.position.z = Math.cos(camAngle) * Math.cos(effPitch) * zoom;
        camera3d.lookAt(mouseParallaxX * 0.35, 0.3 + mouseParallaxY * -0.2, 0);

        if (!prefersReducedMotion) {
          coreMesh3d.rotation.y += 0.012;
          coreMesh3d.rotation.x += 0.006;
          ring1_3d.rotation.x += 0.014;
          ring1_3d.rotation.y += 0.008;
          ring2_3d.rotation.y -= 0.011;
          ring2_3d.rotation.z += 0.007;
          pts3d.rotation.y += 0.0014;
        }

        AGENTS.forEach(function (ag, idx) {
          var rig = agentRigs[ag.id];
          if (!rig) return;
          var act = deskState && deskState.agentActivity && deskState.agentActivity[ag.id];
          var busy = act && act.status && act.status !== 'idle';
          if (!prefersReducedMotion) {
            rig.avatar.position.y = 0.75 + Math.sin(clk * (busy ? 5.2 : 1.5) + idx) * (busy ? 0.055 : 0.022);
            if (rig.headGroup) {
              rig.headGroup.rotation.y = Math.sin(clk * (busy ? 2.4 : 0.7) + idx * 1.3) * (busy ? 0.24 : 0.10);
              rig.headGroup.rotation.x = Math.sin(clk * 1.1 + idx) * 0.06;
            }
            if (rig.armL && rig.armR) {
              var typeSpd = busy ? 11.0 : 2.2;
              var amp = busy ? 0.18 : 0.04;
              rig.armL.rotation.x = -0.95 + Math.sin(clk * typeSpd + idx) * amp;
              rig.armR.rotation.x = -0.95 + Math.cos(clk * typeSpd + idx) * amp;
            }
          }
          rig.padRing.scale.setScalar(busy && !prefersReducedMotion ? 1.18 + Math.sin(clk * 6) * 0.08 : busy ? 1.15 : 1.0);
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

    // ==================== CHARTS, TRADINGVIEW, TIMEFRAMES & DESSIN (TAB 3) ====================
    var ALL_TIMEFRAMES = [
      { id: '1s', lbl: '1s', tv: '1S' },
      { id: '1m', lbl: '1m', tv: '1' },
      { id: '2m', lbl: '2m', tv: '2' },
      { id: '3m', lbl: '3m', tv: '3' },
      { id: '5m', lbl: '5m', tv: '5' },
      { id: '10m', lbl: '10m', tv: '10' },
      { id: '15m', lbl: '15m', tv: '15' },
      { id: '30m', lbl: '30m', tv: '30' },
      { id: '1h', lbl: '1h', tv: '60' },
      { id: '2h', lbl: '2h', tv: '120' },
      { id: '4h', lbl: '4h', tv: '240' },
      { id: '1d', lbl: '1j', tv: 'D' },
      { id: '1w', lbl: '1sem', tv: 'W' },
      { id: '1M', lbl: '1mois', tv: 'M' }
    ];
    var chartEngine = 'tv';
    var activeTimeframe = '15m';
    var favTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
    try {
      var savedFavTfs = localStorage.getItem('tf_v3_fav_tfs');
      if (savedFavTfs) favTimeframes = JSON.parse(savedFavTfs);
    } catch (e) {}

    var drawLayerActive = false;
    var activeDrawTool = 'select';
    var drawStrokeColor = '#38bdf8';
    var chartDrawings = [];
    var drawUndoStack = [];
    var drawRedoStack = [];
    var selectedDrawIdx = -1;
    var activeDragDraw = null;

    function getActiveChartSymbol() {
      var el = document.getElementById('chartSymbolSelect');
      return (el && el.value) || 'BTCUSDT';
    }

    function mapSymbolToTradingView(sym) {
      var s = String(sym || 'BTCUSDT').toUpperCase();
      if (s.endsWith('USDT')) return 'BINANCE:' + s;
      if (/^(EURUSD|GBPUSD|USDJPY|USDCHF|AUDUSD|USDCAD|EURGBP|EURJPY)$/.test(s)) return 'FX:' + s;
      if (s === 'XAUUSD' || s === 'XAGUSD') return 'OANDA:' + s;
      if (s === 'USOIL') return 'TVC:USOIL';
      if (s === 'NGAS') return 'NYMEX:NG1!';
      if (s === 'NQ1!') return 'CME_MINI:NQ1!';
      if (s === 'ES1!') return 'CME_MINI:ES1!';
      if (s === 'YM1!') return 'CBOT_MINI:YM1!';
      if (s === 'FDAX1!') return 'EUREX:FDAX1!';
      if (/^(NVDA|AAPL|TSLA|MSFT|AMZN)$/.test(s)) return 'NASDAQ:' + s;
      return s;
    }

    function mapTfToTradingView(tf) {
      var found = ALL_TIMEFRAMES.find(function (t) { return t.id === tf; });
      if (found) return found.tv;
      var m = String(tf).match(/^(\d+)(s|m|h|d|j)$/i);
      if (!m) return '15';
      var n = Number(m[1]);
      var u = m[2].toLowerCase();
      if (u === 's') return n + 'S';
      if (u === 'm') return String(n);
      if (u === 'h') return String(n * 60);
      return n + 'D';
    }

    function renderTimeframeStrip() {
      var host = document.getElementById('chartTfStrip');
      if (!host) return;
      var favBtns = favTimeframes.map(function (id) {
        var found = ALL_TIMEFRAMES.find(function (t) { return t.id === id; });
        var lbl = found ? found.lbl : id;
        return '<button class="tf-btn fav' + (activeTimeframe === id ? ' active' : '') + '" onclick="setChartTimeframe(&quot;' + id + '&quot;)" title="Favori">★ ' + lbl + '</button>';
      }).join('');
      var allBtns = ALL_TIMEFRAMES.filter(function (t) { return favTimeframes.indexOf(t.id) < 0; }).map(function (t) {
        return '<button class="tf-btn' + (activeTimeframe === t.id ? ' active' : '') + '" onclick="setChartTimeframe(&quot;' + t.id + '&quot;)">' + t.lbl + '</button>';
      }).join('');
      var customBtn = (!ALL_TIMEFRAMES.some(function (t) { return t.id === activeTimeframe; }) && favTimeframes.indexOf(activeTimeframe) < 0)
        ? '<button class="tf-btn active">' + activeTimeframe + '</button>'
        : '';
      host.innerHTML = favBtns + '<span style="width:1px;height:18px;background:var(--ring-1);margin:0 3px"></span>' + allBtns + customBtn;
      var starBtn = document.getElementById('btnFavTfStar');
      if (starBtn) {
        var isFav = favTimeframes.indexOf(activeTimeframe) >= 0;
        starBtn.textContent = isFav ? '★ Favori' : '☆ Favori';
        starBtn.classList.toggle('primary', isFav);
      }
    }

    function toggleCurrentTfFavorite() {
      var idx = favTimeframes.indexOf(activeTimeframe);
      if (idx >= 0) {
        if (favTimeframes.length > 1) favTimeframes.splice(idx, 1);
      } else {
        favTimeframes.push(activeTimeframe);
      }
      try { localStorage.setItem('tf_v3_fav_tfs', JSON.stringify(favTimeframes)); } catch (e) {}
      renderTimeframeStrip();
    }

    function setChartTimeframe(tf) {
      activeTimeframe = tf;
      renderTimeframeStrip();
      refreshChartData();
      if (chartEngine === 'tv') initTradingViewWidget();
    }

    function applyCustomTimeframe() {
      var n = Math.max(1, Math.min(999, Math.round(Number(document.getElementById('customTfNum').value || 1))));
      var u = document.getElementById('customTfUnit').value || 'm';
      setChartTimeframe(String(n) + u);
    }

    function setChartEngine(eng) {
      chartEngine = eng === 'desk' ? 'desk' : 'tv';
      document.querySelectorAll('#chartEngineGroup .seg-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-engine') === chartEngine);
      });
      var tvEl = document.getElementById('tvWidgetContainer');
      var lwEl = document.getElementById('lwChartContainer');
      if (tvEl) tvEl.style.display = chartEngine === 'tv' ? 'block' : 'none';
      if (lwEl) lwEl.style.display = chartEngine === 'desk' ? 'block' : 'none';
      initChartTab();
    }

    function onChartSymbolChange() {
      loadDrawingsForSymbol(getActiveChartSymbol());
      refreshChartData();
      if (chartEngine === 'tv') initTradingViewWidget();
    }

    function ensureTradingViewScript(cb) {
      if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) { cb(); return; }
      var existing = document.getElementById('tvScriptTag');
      if (existing) { existing.addEventListener('load', cb); return; }
      var sc = document.createElement('script');
      sc.id = 'tvScriptTag';
      sc.src = 'https://s3.tradingview.com/tv.js';
      sc.async = true;
      sc.onload = cb;
      sc.onerror = function () { setChartEngine('desk'); };
      document.head.appendChild(sc);
    }

    function initTradingViewWidget() {
      var cont = document.getElementById('tvWidgetContainer');
      if (!cont || chartEngine !== 'tv') return;
      ensureTradingViewScript(function () {
        if (typeof window.TradingView === 'undefined' || !window.TradingView.widget) return;
        cont.innerHTML = '';
        var prefs = getCurrentThemePrefs();
        try {
          new window.TradingView.widget({
            autosize: true,
            symbol: mapSymbolToTradingView(getActiveChartSymbol()),
            interval: mapTfToTradingView(activeTimeframe),
            timezone: 'Europe/Paris',
            theme: prefs.isLight ? 'light' : 'dark',
            style: '1',
            locale: 'fr',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            save_image: true,
            container_id: 'tvWidgetContainer'
          });
        } catch (e) {}
      });
    }

    function initChartTab() {
      renderTimeframeStrip();
      loadDrawingsForSymbol(getActiveChartSymbol());
      resizeDrawCanvas();
      if (chartEngine === 'tv') {
        initTradingViewWidget();
        refreshChartData();
      } else {
        initOrRefreshLwChart();
      }
    }

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

      var t = getCurrentThemePrefs();
      var w = cont.clientWidth || 900;
      var h = Math.max(460, cont.clientHeight || 560);
      var gridCol = t.isLight ? 'rgba(15,23,42,0.07)' : 'rgba(255,255,255,0.05)';
      var bordCol = t.isLight ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.12)';
      lwChart = LightweightCharts.createChart(cont, {
        width: w,
        height: h,
        layout: { background: { color: 'transparent' }, textColor: t.fg2 || '#94a3b8' },
        grid: { vertLines: { color: gridCol }, horzLines: { color: gridCol } },
        timeScale: { borderColor: bordCol, timeVisible: true, secondsVisible: activeTimeframe === '1s' },
        rightPriceScale: { borderColor: bordCol }
      });

      lwCandleSeries = lwChart.addCandlestickSeries({
        upColor: t.up || '#10b981', downColor: t.down || '#f43f5e',
        borderUpColor: t.up || '#10b981', borderDownColor: t.down || '#f43f5e',
        wickUpColor: t.up || '#10b981', wickDownColor: t.down || '#f43f5e'
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
          lwChart.applyOptions({ width: cr.width, height: Math.max(420, cr.height) });
        }
        resizeDrawCanvas();
      });
      lwResizeObs.observe(cont);

      await refreshChartData();
    }

    async function refreshChartData() {
      var sym = getActiveChartSymbol();
      var res = await fetch('/api/candles?symbol=' + encodeURIComponent(sym) + '&interval=' + encodeURIComponent(activeTimeframe) + '&limit=240');
      var data = await res.json();
      if (!data.ok || !Array.isArray(data.candles)) return;

      var ovEl = document.getElementById('chartOverlayStats');
      if (ovEl) {
        ovEl.innerHTML =
          '<span>VWAP : ' + (data.vwap ? fmtPx(data.vwap.vwap) : '--') + '</span>' +
          '<span>FVG : ' + (data.fvg ? fmtPx(data.fvg.midPrice) : '--') + '</span>' +
          '<span>TF : ' + activeTimeframe + ' (' + data.candles.length + ')</span>';
      }

      if (!lwCandleSeries || !lwChart) return;
      lwPriceLines.forEach(function (pl) { try { lwCandleSeries.removePriceLine(pl); } catch (e) {} });
      lwPriceLines = [];

      var tTheme = getCurrentThemePrefs();
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
          color: Number(b.close) >= Number(b.open) ? hexToRgba(tTheme.up || '#10b981', 0.28) : hexToRgba(tTheme.down || '#f43f5e', 0.28)
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
        lwPriceLines.push(lwCandleSeries.createPriceLine({ price: data.vwap.vwap, color: tTheme.accent || '#38bdf8', lineWidth: 1, title: 'VWAP' }));
      }
      if (data.fvg && data.fvg.midPrice) {
        lwPriceLines.push(lwCandleSeries.createPriceLine({ price: data.fvg.midPrice, color: tTheme.amber || '#f59e0b', lineWidth: 1, title: 'FVG 50%' }));
      }
      if (deskState && deskState.tickets) {
        deskState.tickets.filter(function (tk) { return tk.status === 'open' && tk.asset === sym; }).forEach(function (tk) {
          lwPriceLines.push(lwCandleSeries.createPriceLine({ price: tk.fillPrice || tk.entry, color: '#22d3ee', lineWidth: 2, title: tk.id + ' ENTRY' }));
          lwPriceLines.push(lwCandleSeries.createPriceLine({ price: tk.invalidation, color: tTheme.down || '#f43f5e', lineWidth: 1, title: 'SL' }));
          lwPriceLines.push(lwCandleSeries.createPriceLine({ price: tk.target, color: tTheme.up || '#10b981', lineWidth: 1, title: 'TP' }));
        });
      }
    }

    // ---- CALQUE DE DESSIN TACTILE & SOURIS + SAUVEGARDE PAR SYMBOLE ----
    function toggleDrawLayer() {
      drawLayerActive = !drawLayerActive;
      var c = document.getElementById('chartDrawCanvas');
      var b = document.getElementById('btnToggleDrawLayer');
      if (b) b.classList.toggle('primary', drawLayerActive);
      if (c) {
        c.classList.toggle('interactive', drawLayerActive && activeDrawTool !== 'select');
        c.classList.toggle('select-mode', drawLayerActive && activeDrawTool === 'select');
      }
      renderDrawingsCanvas();
    }

    function setDrawTool(tool) {
      activeDrawTool = tool;
      if (tool !== 'select' && !drawLayerActive) toggleDrawLayer();
      document.querySelectorAll('.draw-tool-btn[data-tool]').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-tool') === tool);
      });
      var c = document.getElementById('chartDrawCanvas');
      if (c) {
        c.classList.toggle('interactive', drawLayerActive && tool !== 'select');
        c.classList.toggle('select-mode', drawLayerActive && tool === 'select');
      }
    }

    function loadDrawingsForSymbol(sym) {
      try {
        var raw = localStorage.getItem('tf_v3_drawings_' + sym);
        chartDrawings = raw ? JSON.parse(raw) : [];
      } catch (e) { chartDrawings = []; }
      selectedDrawIdx = -1;
      renderDrawingsCanvas();
    }

    function saveDrawingsForSymbol() {
      var sym = getActiveChartSymbol();
      try { localStorage.setItem('tf_v3_drawings_' + sym, JSON.stringify(chartDrawings)); } catch (e) {}
    }

    function pushDrawUndo() {
      drawUndoStack.push(JSON.stringify(chartDrawings));
      if (drawUndoStack.length > 40) drawUndoStack.shift();
      drawRedoStack = [];
    }

    function undoDrawing() {
      if (!drawUndoStack.length) return;
      drawRedoStack.push(JSON.stringify(chartDrawings));
      chartDrawings = JSON.parse(drawUndoStack.pop());
      selectedDrawIdx = -1;
      saveDrawingsForSymbol();
      renderDrawingsCanvas();
    }

    function redoDrawing() {
      if (!drawRedoStack.length) return;
      drawUndoStack.push(JSON.stringify(chartDrawings));
      chartDrawings = JSON.parse(drawRedoStack.pop());
      selectedDrawIdx = -1;
      saveDrawingsForSymbol();
      renderDrawingsCanvas();
    }

    function updateDrawColor(hex) {
      drawStrokeColor = hex;
      if (selectedDrawIdx >= 0 && chartDrawings[selectedDrawIdx]) {
        pushDrawUndo();
        chartDrawings[selectedDrawIdx].color = hex;
        saveDrawingsForSymbol();
        renderDrawingsCanvas();
      }
    }

    function toggleSelectedDrawLock() {
      if (selectedDrawIdx < 0 || !chartDrawings[selectedDrawIdx]) return;
      pushDrawUndo();
      chartDrawings[selectedDrawIdx].locked = !chartDrawings[selectedDrawIdx].locked;
      var btn = document.getElementById('btnLockDrawing');
      if (btn) btn.textContent = chartDrawings[selectedDrawIdx].locked ? '🔒' : '🔓';
      saveDrawingsForSymbol();
      renderDrawingsCanvas();
    }

    function deleteSelectedDrawing() {
      if (selectedDrawIdx < 0 || !chartDrawings[selectedDrawIdx]) return;
      if (chartDrawings[selectedDrawIdx].locked) return;
      pushDrawUndo();
      chartDrawings.splice(selectedDrawIdx, 1);
      selectedDrawIdx = -1;
      saveDrawingsForSymbol();
      renderDrawingsCanvas();
    }

    function clearSymbolDrawings() {
      if (!chartDrawings.length) return;
      pushDrawUndo();
      chartDrawings = [];
      selectedDrawIdx = -1;
      saveDrawingsForSymbol();
      renderDrawingsCanvas();
    }

    function resizeDrawCanvas() {
      var c = document.getElementById('chartDrawCanvas');
      var st = document.getElementById('chartStage');
      if (!c || !st) return;
      var r = st.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        c.width = Math.round(r.width);
        c.height = Math.round(r.height);
        renderDrawingsCanvas();
      }
    }

    function ptSegDist(px, py, x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1;
      var len2 = dx * dx + dy * dy;
      if (len2 === 0) return Math.hypot(px - x1, py - y1);
      var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }

    function findDrawingAt(px, py, w, h) {
      for (var i = chartDrawings.length - 1; i >= 0; i--) {
        var d = chartDrawings[i];
        var x1 = d.x1 * w, y1 = d.y1 * h, x2 = d.x2 * w, y2 = d.y2 * h;
        if (d.type === 'hline' && Math.abs(py - y1) < 10) return i;
        if (d.type === 'vline' && Math.abs(px - x1) < 10) return i;
        if ((d.type === 'rect' || d.type === 'zone' || d.type === 'fib') &&
            px >= Math.min(x1, x2) - 8 && px <= Math.max(x1, x2) + 8 &&
            py >= Math.min(y1, y2) - 8 && py <= Math.max(y1, y2) + 8) return i;
        if (ptSegDist(px, py, x1, y1, x2, y2) < 12) return i;
      }
      return -1;
    }

    function renderDrawingsCanvas() {
      var c = document.getElementById('chartDrawCanvas');
      if (!c) return;
      var ctx = c.getContext('2d');
      var w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);

      chartDrawings.forEach(function (d, idx) {
        var x1 = d.x1 * w, y1 = d.y1 * h, x2 = d.x2 * w, y2 = d.y2 * h;
        var col = d.color || '#38bdf8';
        ctx.save();
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = idx === selectedDrawIdx ? 2.5 : 1.8;

        if (d.type === 'hline') {
          ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(w, y1); ctx.stroke();
        } else if (d.type === 'vline') {
          ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, h); ctx.stroke();
        } else if (d.type === 'trendline' || d.type === 'arrow' || d.type === 'measure') {
          if (d.type === 'measure') ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          if (d.type === 'arrow') {
            var ang = Math.atan2(y2 - y1, x2 - x1);
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - 11 * Math.cos(ang - 0.4), y2 - 11 * Math.sin(ang - 0.4));
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - 11 * Math.cos(ang + 0.4), y2 - 11 * Math.sin(ang + 0.4));
            ctx.stroke();
          }
          if (d.type === 'measure') {
            var pct = (((y1 - y2) / Math.max(h, 1)) * 100).toFixed(1);
            ctx.font = '700 11px Inter Variable, sans-serif';
            ctx.fillText((Number(pct) >= 0 ? '+' : '') + pct + '% hauteur', (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 6);
          }
        } else if (d.type === 'channel') {
          var off = 36;
          ctx.beginPath();
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.moveTo(x1, y1 + off); ctx.lineTo(x2, y2 + off);
          ctx.stroke();
          ctx.fillStyle = hexToRgba(col, 0.12);
          ctx.beginPath();
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 + off); ctx.lineTo(x1, y1 + off);
          ctx.closePath(); ctx.fill();
        } else if (d.type === 'rect' || d.type === 'zone') {
          ctx.fillStyle = hexToRgba(col, d.type === 'zone' ? 0.22 : 0.10);
          ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
          ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        } else if (d.type === 'fib') {
          var lvls = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          var rx = Math.min(x1, x2), rw = Math.max(60, Math.abs(x2 - x1));
          ctx.font = '600 10px Inter Variable, sans-serif';
          lvls.forEach(function (lv) {
            var ly = y1 + (y2 - y1) * lv;
            ctx.beginPath(); ctx.moveTo(rx, ly); ctx.lineTo(rx + rw, ly); ctx.stroke();
            ctx.fillText(String(lv), rx + 4, ly - 3);
          });
        } else if (d.type === 'text') {
          ctx.font = '700 13px Inter Variable, sans-serif';
          ctx.fillText(d.text || 'Note', x1, y1);
        }

        if (idx === selectedDrawIdx) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(x1, y1, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          if (d.type !== 'text' && d.type !== 'hline' && d.type !== 'vline') {
            ctx.beginPath(); ctx.arc(x2, y2, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
        }
        ctx.restore();
      });
    }

    function setupChartDrawingEvents() {
      var c = document.getElementById('chartDrawCanvas');
      if (!c) return;
      c.addEventListener('pointerdown', function (e) {
        if (!drawLayerActive) return;
        c.setPointerCapture(e.pointerId);
        var r = c.getBoundingClientRect();
        var px = e.clientX - r.left, py = e.clientY - r.top;
        var nx = px / Math.max(1, r.width), ny = py / Math.max(1, r.height);

        if (activeDrawTool === 'select') {
          selectedDrawIdx = findDrawingAt(px, py, r.width, r.height);
          var btn = document.getElementById('btnLockDrawing');
          if (btn && selectedDrawIdx >= 0) btn.textContent = chartDrawings[selectedDrawIdx].locked ? '🔒' : '🔓';
          if (selectedDrawIdx >= 0 && !chartDrawings[selectedDrawIdx].locked) {
            pushDrawUndo();
            activeDragDraw = { mode: 'move', idx: selectedDrawIdx, lastNx: nx, lastNy: ny };
          }
          renderDrawingsCanvas();
          return;
        }
        if (activeDrawTool === 'text') {
          var txt = prompt('Texte à annoter sur le graphique :', 'Zone clé');
          if (txt) {
            pushDrawUndo();
            chartDrawings.push({ type: 'text', x1: nx, y1: ny, x2: nx, y2: ny, color: drawStrokeColor, text: txt, locked: false });
            selectedDrawIdx = chartDrawings.length - 1;
            saveDrawingsForSymbol();
            renderDrawingsCanvas();
          }
          return;
        }
        pushDrawUndo();
        chartDrawings.push({ type: activeDrawTool, x1: nx, y1: ny, x2: nx, y2: ny, color: drawStrokeColor, locked: false });
        selectedDrawIdx = chartDrawings.length - 1;
        activeDragDraw = { mode: 'draw', idx: selectedDrawIdx };
        renderDrawingsCanvas();
      });

      c.addEventListener('pointermove', function (e) {
        if (!activeDragDraw || !drawLayerActive) return;
        var r = c.getBoundingClientRect();
        var nx = (e.clientX - r.left) / Math.max(1, r.width);
        var ny = (e.clientY - r.top) / Math.max(1, r.height);
        var d = chartDrawings[activeDragDraw.idx];
        if (!d) return;
        if (activeDragDraw.mode === 'draw') {
          d.x2 = nx; d.y2 = ny;
        } else if (activeDragDraw.mode === 'move') {
          var dx = nx - activeDragDraw.lastNx, dy = ny - activeDragDraw.lastNy;
          d.x1 += dx; d.y1 += dy; d.x2 += dx; d.y2 += dy;
          activeDragDraw.lastNx = nx; activeDragDraw.lastNy = ny;
        }
        renderDrawingsCanvas();
      });

      c.addEventListener('pointerup', function () {
        if (activeDragDraw) {
          activeDragDraw = null;
          saveDrawingsForSymbol();
          renderDrawingsCanvas();
        }
      });
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

    // ==================== STRATÉGIE & GESTION DU RISQUE DÉBUTANT / PRO ====================
    var currentRiskMode = 'pct';
    var currentSlMode = 'atr';
    var currentTpMode = 'rr';
    var strategyFormInitialized = false;
    var isStrategyFormDirty = false;
    var pendingDangerousSettings = null;

    function markStrategyFormDirty() {
      isStrategyFormDirty = true;
    }

    function setQuickRiskAmount(amt) {
      setRiskMode('amount');
      var el = document.getElementById('cfgRiskAmount');
      if (el) el.value = String(amt);
      var slEl = document.getElementById('cfgSlAmount');
      if (slEl) slEl.value = String(amt);
      markStrategyFormDirty();
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function setQuickSlAmount(amt) {
      setSlMode('amount');
      var el = document.getElementById('cfgSlAmount');
      if (el) el.value = String(amt);
      var rEl = document.getElementById('cfgRiskAmount');
      if (rEl) rEl.value = String(amt);
      markStrategyFormDirty();
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function setQuickTpAmount(amt) {
      setTpMode('amount');
      var el = document.getElementById('cfgTpVal');
      if (el) el.value = String(amt);
      markStrategyFormDirty();
      updateLiveRiskCalculator();
    }

    function syncRiskAmountToSl(val) {
      var slEl = document.getElementById('cfgSlAmount');
      if (slEl && currentSlMode === 'amount') slEl.value = val;
    }

    function syncSlAmountToRisk(val) {
      var rEl = document.getElementById('cfgRiskAmount');
      if (rEl && currentRiskMode === 'amount') rEl.value = val;
    }

    function syncLevFromSlider(val) {
      var n = Math.max(1, Math.min(500, Math.round(Number(val) || 1)));
      var el = document.getElementById('cfgLev');
      if (el) el.value = String(n);
      var bd = document.getElementById('navLevBadge');
      if (bd) bd.textContent = 'x' + n;
      markStrategyFormDirty();
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function syncLevFromNumber(val) {
      var n = Math.max(1, Math.min(500, Math.round(Number(val) || 1)));
      var el = document.getElementById('cfgLevSlider');
      if (el) el.value = String(n);
      var bd = document.getElementById('navLevBadge');
      if (bd) bd.textContent = 'x' + n;
      markStrategyFormDirty();
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function setLevPreset(val) {
      syncLevFromSlider(val);
      markStrategyFormDirty();
    }

    function syncAtrInputs(val) {
      var n = Math.max(0.3, Math.min(5.0, Number(val) || 1.35));
      var sl = document.getElementById('cfgAtrSlider');
      var num = document.getElementById('cfgAtrMult');
      if (sl) sl.value = n.toFixed(2);
      if (num) num.value = n.toFixed(2);
      var lbl = document.getElementById('atrPreviewLabel');
      if (lbl) lbl.textContent = n.toFixed(2) + '× ATR';
      renderAtrMiniChart(n);
      markStrategyFormDirty();
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function renderAtrMiniChart(atrMult) {
      var svg = document.getElementById('atrMiniChartSvg');
      if (!svg) return;
      var mult = Number(atrMult) || 1.35;
      var stopOffset = Math.min(48, Math.max(12, 16 + (mult * 6.5)));
      var stopY = 32 + stopOffset;

      var svgContent =
        '<rect x="0" y="0" width="360" height="92" rx="8" fill="rgba(3,6,12,0.6)" stroke="var(--ring-1)" stroke-width="1" />' +
        '<line x1="40" y1="18" x2="40" y2="46" stroke="rgba(148,163,184,0.3)" stroke-width="1.5" />' +
        '<rect x="35" y="24" width="10" height="16" fill="rgba(16,185,129,0.35)" />' +
        '<line x1="70" y1="20" x2="70" y2="52" stroke="rgba(148,163,184,0.3)" stroke-width="1.5" />' +
        '<rect x="65" y="28" width="10" height="18" fill="rgba(244,63,94,0.35)" />' +
        '<line x1="100" y1="16" x2="100" y2="44" stroke="rgba(148,163,184,0.3)" stroke-width="1.5" />' +
        '<rect x="95" y="22" width="10" height="14" fill="rgba(16,185,129,0.4)" />' +
        '<line x1="130" y1="32" x2="350" y2="32" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 3" />' +
        '<text x="135" y="26" fill="#38bdf8" font-size="10.5" font-family="monospace" font-weight="700">Entrée Achat (Prix)</text>' +
        '<rect x="130" y="32" width="220" height="' + stopOffset + '" fill="rgba(244,63,94,0.08)" />' +
        '<line x1="130" y1="' + stopY + '" x2="350" y2="' + stopY + '" stroke="#f43f5e" stroke-width="2" />' +
        '<text x="135" y="' + (stopY - 4) + '" fill="#f43f5e" font-size="10" font-family="monospace" font-weight="700">Stop-Loss : -' + mult.toFixed(2) + '× ATR (' + (mult < 1.0 ? 'Serré' : mult > 2.0 ? 'Large' : 'Équilibré') + ')</text>' +
        '<line x1="335" y1="34" x2="335" y2="' + (stopY - 2) + '" stroke="var(--amber)" stroke-width="1.5" />' +
        '<polygon points="335,32 332,36 338,36" fill="var(--amber)" />' +
        '<polygon points="335,' + stopY + ' 332,' + (stopY - 4) + ' 338,' + (stopY - 4) + '" fill="var(--amber)" />';
      svg.innerHTML = svgContent;
    }

    function setRiskMode(m) {
      currentRiskMode = m || 'pct';
      markStrategyFormDirty();
      document.querySelectorAll('#riskModeSwitch .mode-switch-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === currentRiskMode);
      });
      var pctEl = document.getElementById('cfgRiskPct');
      var pipsEl = document.getElementById('cfgRiskPips');
      var amtEl = document.getElementById('cfgRiskAmount');
      var unitLbl = document.getElementById('cfgRiskUnitLbl');
      var presets = document.getElementById('riskAmountPresets');
      if (pctEl) pctEl.style.display = currentRiskMode === 'pct' ? 'block' : 'none';
      if (pipsEl) pipsEl.style.display = currentRiskMode === 'pips' ? 'block' : 'none';
      if (amtEl) amtEl.style.display = currentRiskMode === 'amount' ? 'block' : 'none';
      if (presets) presets.style.display = currentRiskMode === 'amount' ? 'flex' : 'none';
      if (unitLbl) unitLbl.textContent = currentRiskMode === 'pct' ? '%' : currentRiskMode === 'pips' ? 'Pips' : '€ / $';
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function setSlMode(m) {
      currentSlMode = m || 'atr';
      markStrategyFormDirty();
      document.querySelectorAll('#slModeSwitch .mode-switch-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === currentSlMode);
      });
      var amtWrap = document.getElementById('slAmountWrap');
      var atrWrap = document.getElementById('slAtrWrap');
      var pipsWrap = document.getElementById('slPipsWrap');
      var pctWrap = document.getElementById('slPctWrap');
      if (amtWrap) amtWrap.style.display = currentSlMode === 'amount' ? 'block' : 'none';
      if (atrWrap) atrWrap.style.display = currentSlMode === 'atr' ? 'block' : 'none';
      if (pipsWrap) pipsWrap.style.display = currentSlMode === 'pips' ? 'block' : 'none';
      if (pctWrap) pctWrap.style.display = currentSlMode === 'pct' ? 'block' : 'none';
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function setTpMode(m) {
      currentTpMode = m || 'rr';
      markStrategyFormDirty();
      document.querySelectorAll('#tpModeSwitch .mode-switch-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === currentTpMode);
      });
      var exLbl = document.getElementById('cfgTpExampleLbl');
      var presets = document.getElementById('tpAmountPresets');
      if (presets) presets.style.display = currentTpMode === 'amount' ? 'flex' : 'none';
      if (exLbl) {
        if (currentTpMode === 'rr') exLbl.textContent = 'Ex. : 2.0 = viser 2× le risque';
        else if (currentTpMode === 'amount') exLbl.textContent = 'Ex. : 100 = encaisser dès +100 € de profit';
        else if (currentTpMode === 'pips') exLbl.textContent = 'Ex. : 50 = fermer à +50 pips';
        else if (currentTpMode === 'pct') exLbl.textContent = 'Ex. : 3.0 = gain de 3 % du compte';
      }
      updateLiveRiskCalculator();
    }

    function toggleDayLossInputs() {
      var sel = document.getElementById('cfgDayLossMode');
      var m = sel ? sel.value : 'pct';
      var pctEl = document.getElementById('cfgDayLossPct');
      var valEl = document.getElementById('cfgDayLossVal');
      if (pctEl) pctEl.style.display = m === 'pct' ? 'block' : 'none';
      if (valEl) valEl.style.display = m === 'pct' ? 'none' : 'block';
      markStrategyFormDirty();
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function applyRiskProfile(p) {
      markStrategyFormDirty();
      if (p === 'conservative' || p === 'prudent') {
        syncLevFromSlider(2);
        setRiskMode('pct');
        var rEl = document.getElementById('cfgRiskPct');
        if (rEl) rEl.value = '1.0';
        setSlMode('atr');
        syncAtrInputs(1.80);
        var dEl = document.getElementById('cfgDayLossMode');
        if (dEl) dEl.value = 'pct';
        toggleDayLossInputs();
        var dpEl = document.getElementById('cfgDayLossPct');
        if (dpEl) dpEl.value = '3.0';
        var mtEl = document.getElementById('cfgMaxTradeLossMode');
        if (mtEl) mtEl.value = 'pct';
        var mvEl = document.getElementById('cfgMaxTradeLossVal');
        if (mvEl) mvEl.value = '1.5';
        setTpMode('rr');
        var tpEl = document.getElementById('cfgTpVal');
        if (tpEl) tpEl.value = '2.5';
        var scEl = document.getElementById('cfgAutoStopLossChk');
        if (scEl) scEl.checked = true;
      } else if (p === 'aggressive' || p === 'agressif') {
        syncLevFromSlider(20);
        setRiskMode('pct');
        var rEl = document.getElementById('cfgRiskPct');
        if (rEl) rEl.value = '3.5';
        setSlMode('atr');
        syncAtrInputs(1.00);
        var dEl = document.getElementById('cfgDayLossMode');
        if (dEl) dEl.value = 'pct';
        toggleDayLossInputs();
        var dpEl = document.getElementById('cfgDayLossPct');
        if (dpEl) dpEl.value = '8.0';
        var mtEl = document.getElementById('cfgMaxTradeLossMode');
        if (mtEl) mtEl.value = 'pct';
        var mvEl = document.getElementById('cfgMaxTradeLossVal');
        if (mvEl) mvEl.value = '4.0';
        setTpMode('rr');
        var tpEl = document.getElementById('cfgTpVal');
        if (tpEl) tpEl.value = '1.5';
        var scEl = document.getElementById('cfgAutoStopLossChk');
        if (scEl) scEl.checked = true;
      } else {
        syncLevFromSlider(5);
        setRiskMode('pct');
        var rEl = document.getElementById('cfgRiskPct');
        if (rEl) rEl.value = '2.0';
        setSlMode('atr');
        syncAtrInputs(1.35);
        var dEl = document.getElementById('cfgDayLossMode');
        if (dEl) dEl.value = 'pct';
        toggleDayLossInputs();
        var dpEl = document.getElementById('cfgDayLossPct');
        if (dpEl) dpEl.value = '5.0';
        var mtEl = document.getElementById('cfgMaxTradeLossMode');
        if (mtEl) mtEl.value = 'pct';
        var mvEl = document.getElementById('cfgMaxTradeLossVal');
        if (mvEl) mvEl.value = '3.0';
        setTpMode('rr');
        var tpEl = document.getElementById('cfgTpVal');
        if (tpEl) tpEl.value = '2.0';
        var scEl = document.getElementById('cfgAutoStopLossChk');
        if (scEl) scEl.checked = true;
      }
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function updateRiskLevelBadges() {
      var lev = Number(document.getElementById('cfgLev')?.value || 5);
      var bLev = document.getElementById('badgeLevLevel');
      if (bLev) {
        if (lev <= 3) { bLev.className = 'level-badge conservative'; bLev.textContent = '🟢 Prudent'; }
        else if (lev <= 10) { bLev.className = 'level-badge balanced'; bLev.textContent = '🔵 Équilibré'; }
        else { bLev.className = 'level-badge aggressive'; bLev.textContent = '🟠 Agressif (' + lev + 'x)'; }
      }

      var bRisk = document.getElementById('badgeRiskLevel');
      if (bRisk) {
        var rVal = currentRiskMode === 'pct' ? Number(document.getElementById('cfgRiskPct')?.value || 2) : 2;
        if (rVal <= 1.0) { bRisk.className = 'level-badge conservative'; bRisk.textContent = '🟢 Prudent'; }
        else if (rVal <= 2.5) { bRisk.className = 'level-badge balanced'; bRisk.textContent = '🔵 Équilibré'; }
        else { bRisk.className = 'level-badge aggressive'; bRisk.textContent = '🟠 Agressif'; }
      }

      var bAtr = document.getElementById('badgeAtrLevel');
      if (bAtr) {
        var atrV = Number(document.getElementById('cfgAtrMult')?.value || 1.35);
        if (atrV >= 1.6) { bAtr.className = 'level-badge conservative'; bAtr.textContent = '🟢 Stop Large'; }
        else if (atrV >= 1.2) { bAtr.className = 'level-badge balanced'; bAtr.textContent = '🔵 Équilibré'; }
        else { bAtr.className = 'level-badge aggressive'; bAtr.textContent = '🟠 Stop Serré'; }
      }

      var bDay = document.getElementById('badgeDayLossLevel');
      if (bDay) {
        var dVal = Number(document.getElementById('cfgDayLossPct')?.value || 5);
        if (dVal <= 3.0) { bDay.className = 'level-badge conservative'; bDay.textContent = '🟢 Prudent'; }
        else if (dVal <= 6.0) { bDay.className = 'level-badge balanced'; bDay.textContent = '🔵 Équilibré'; }
        else { bDay.className = 'level-badge aggressive'; bDay.textContent = '🟠 Agressif'; }
      }
    }

    function updateLiveRiskCalculator() {
      var box = document.getElementById('liveRiskSummaryBox');
      if (!box) return;
      var hasMt5Live = Boolean(deskState && deskState.mt5Live && deskState.mt5Live.connected);
      var eq = hasMt5Live ? Number(deskState.mt5Live.equity || 10000) : (deskState ? (deskState.equity || deskState.startEquity || 10000) : 10000);
      var cur = (deskState && deskState.mt5Live && deskState.mt5Live.currency) || '€';

      var lev = Number(document.getElementById('cfgLev')?.value || 5);
      var rMode = currentRiskMode;
      var rPct = Number(document.getElementById('cfgRiskPct')?.value || 2);
      var rPips = Number(document.getElementById('cfgRiskPips')?.value || 25);
      var rAmt = Number(document.getElementById('cfgRiskAmount')?.value || 100);

      var slMode = currentSlMode;
      var slAmt = Number(document.getElementById('cfgSlAmount')?.value || rAmt);

      var riskAmountUsd = 0;
      if (rMode === 'amount') {
        riskAmountUsd = rAmt;
      } else if (rMode === 'pct') {
        riskAmountUsd = (eq * rPct) / 100;
      } else if (rMode === 'pips') {
        riskAmountUsd = Math.max(10, rPips * 4.0);
      } else {
        riskAmountUsd = slMode === 'amount' ? slAmt : (eq * 0.02);
      }

      var tpMode = currentTpMode;
      var tpVal = Number(document.getElementById('cfgTpVal')?.value || 2.0);
      var targetProfitUsd = 0;
      if (tpMode === 'amount') {
        targetProfitUsd = tpVal;
      } else if (tpMode === 'rr') {
        targetProfitUsd = riskAmountUsd * tpVal;
      } else if (tpMode === 'pct') {
        targetProfitUsd = (eq * tpVal) / 100;
      } else {
        targetProfitUsd = Math.max(10, tpVal * 4.0);
      }

      var ratio = riskAmountUsd > 0 ? (targetProfitUsd / riskAmountUsd).toFixed(2) : '1.00';

      var dayLossMode = document.getElementById('cfgDayLossMode')?.value || 'pct';
      var dayLossVal = 0;
      if (dayLossMode === 'pct') dayLossVal = (eq * Number(document.getElementById('cfgDayLossPct')?.value || 5)) / 100;
      else dayLossVal = Number(document.getElementById('cfgDayLossVal')?.value || 500);

      var dailyTpOn = Boolean(document.getElementById('cfgDailyTpEnabled')?.checked);
      var dailyTpVal = Number(document.getElementById('cfgDailyTpVal')?.value || 500);
      var dailyTpMode = document.getElementById('cfgDailyTpMode')?.value || 'amount';
      var dailyTpTarget = dailyTpMode === 'pct' ? (eq * dailyTpVal) / 100 : dailyTpVal;

      box.innerHTML =
        '<div style="font-size:12.5px;font-weight:700;color:var(--fg-0);margin-bottom:4px">' +
          '📊 Simulation en direct (sur capital de ' + Number(eq).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur + ' · Débloqué en Euro) :' +
        '</div>' +
        '<div style="font-size:12px;line-height:1.55;color:var(--fg-1)">' +
          '• <strong>Stop-Loss (Perte max / trade) :</strong> <strong class="down">-' + Number(riskAmountUsd).toFixed(2) + ' ' + cur + '</strong> (coupure automatique garantie si touché)<br>' +
          '• <strong>Take-Profit (Cible de gain) :</strong> <strong class="up">+' + Number(targetProfitUsd).toFixed(2) + ' ' + cur + '</strong> (clôture automatique dès le montant atteint)<br>' +
          '• <strong>Ratio R/R :</strong> 1 : ' + ratio + ' (Levier ' + lev + 'x · Débloqué sans bridage arbitraire)<br>' +
          '• <strong>Coupe-circuit perte max / jour :</strong> <strong class="down">' + Number(dayLossVal).toFixed(2) + ' ' + cur + '</strong>' +
          (dailyTpOn ? ' · Prise de profit journalière : <strong class="up">+' + Number(dailyTpTarget).toFixed(2) + ' ' + cur + '</strong>' : '') +
        '</div>';
    }

    function populateStrategyForm(settings, force) {
      if (!settings) return;
      if (isStrategyFormDirty && !force) return;

      var lev = settings.defaultLeverage || 5;
      var levEl = document.getElementById('cfgLev');
      var levSl = document.getElementById('cfgLevSlider');
      if (levEl) levEl.value = String(lev);
      if (levSl) levSl.value = String(lev);
      var navLev = document.getElementById('navLevBadge');
      if (navLev) navLev.textContent = 'x' + lev;

      var rMode = settings.riskMode || 'pct';
      currentRiskMode = rMode;
      document.querySelectorAll('#riskModeSwitch .mode-switch-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === rMode);
      });
      var rPctEl = document.getElementById('cfgRiskPct');
      var rPipsEl = document.getElementById('cfgRiskPips');
      var rAmtEl = document.getElementById('cfgRiskAmount');
      var rUnit = document.getElementById('cfgRiskUnitLbl');
      if (rPctEl) {
        rPctEl.value = String(Number((settings.maxRiskPct !== undefined ? settings.maxRiskPct : 0.02) * 100).toFixed(1));
        rPctEl.style.display = rMode === 'pct' ? 'block' : 'none';
      }
      if (rPipsEl) {
        rPipsEl.value = String(settings.riskPips || 25);
        rPipsEl.style.display = rMode === 'pips' ? 'block' : 'none';
      }
      if (rAmtEl) {
        rAmtEl.value = String(settings.riskAmount || 100);
        rAmtEl.style.display = rMode === 'amount' ? 'block' : 'none';
      }
      if (rUnit) rUnit.textContent = rMode === 'pct' ? '%' : rMode === 'pips' ? 'Pips' : '€ / $';
      var rPresets = document.getElementById('riskAmountPresets');
      if (rPresets) rPresets.style.display = rMode === 'amount' ? 'flex' : 'none';

      var slM = settings.slMode || 'atr';
      currentSlMode = slM;
      document.querySelectorAll('#slModeSwitch .mode-switch-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === slM);
      });
      var slAmtWrap = document.getElementById('slAmountWrap');
      var slAtrWrap = document.getElementById('slAtrWrap');
      var slPipsWrap = document.getElementById('slPipsWrap');
      var slPctWrap = document.getElementById('slPctWrap');
      if (slAmtWrap) slAmtWrap.style.display = slM === 'amount' ? 'block' : 'none';
      if (slAtrWrap) slAtrWrap.style.display = slM === 'atr' ? 'block' : 'none';
      if (slPipsWrap) slPipsWrap.style.display = slM === 'pips' ? 'block' : 'none';
      if (slPctWrap) slPctWrap.style.display = slM === 'pct' ? 'block' : 'none';
      var slAmtEl = document.getElementById('cfgSlAmount');
      if (slAmtEl) slAmtEl.value = String(slM === 'amount' ? (settings.slVal || settings.riskAmount || 100) : (settings.riskAmount || 100));

      var atrVal = Number(settings.fixedStopAtr || 1.35);
      var atrSl = document.getElementById('cfgAtrSlider');
      var atrNum = document.getElementById('cfgAtrMult');
      if (atrSl) atrSl.value = atrVal.toFixed(2);
      if (atrNum) atrNum.value = atrVal.toFixed(2);
      var atrLbl = document.getElementById('atrPreviewLabel');
      if (atrLbl) atrLbl.textContent = atrVal.toFixed(2) + '× ATR';
      renderAtrMiniChart(atrVal);

      var dayMode = settings.maxDayLossMode || 'pct';
      var dayModeSel = document.getElementById('cfgDayLossMode');
      if (dayModeSel) dayModeSel.value = dayMode;
      var dayPctEl = document.getElementById('cfgDayLossPct');
      var dayValEl = document.getElementById('cfgDayLossVal');
      if (dayPctEl) {
        dayPctEl.value = String(Number((settings.maxDayLossPct || 0.05) * 100).toFixed(1));
        dayPctEl.style.display = dayMode === 'pct' ? 'block' : 'none';
      }
      if (dayValEl) {
        dayValEl.value = String(settings.maxDayLossVal || 500);
        dayValEl.style.display = dayMode === 'pct' ? 'none' : 'block';
      }

      var trModeSel = document.getElementById('cfgMaxTradeLossMode');
      if (trModeSel) trModeSel.value = settings.maxLossPerTradeMode || 'amount';
      var trValEl = document.getElementById('cfgMaxTradeLossVal');
      if (trValEl) trValEl.value = String(settings.maxLossPerTradeVal || 0);

      var totModeSel = document.getElementById('cfgTotalLossMode');
      if (totModeSel) totModeSel.value = settings.maxTotalLossMode || 'pct';
      var totValEl = document.getElementById('cfgTotalLossVal');
      if (totValEl) totValEl.value = String(settings.maxTotalLossVal || 0);

      var autoStopChk = document.getElementById('cfgAutoStopLossChk');
      if (autoStopChk) autoStopChk.checked = settings.autoStopOnMaxLoss !== false;

      var tpM = settings.tpMode || 'rr';
      currentTpMode = tpM;
      document.querySelectorAll('#tpModeSwitch .mode-switch-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === tpM);
      });
      var tpValEl = document.getElementById('cfgTpVal');
      if (tpValEl) tpValEl.value = String(settings.tpVal || 2.0);

      var tpPresets = document.getElementById('tpAmountPresets');
      if (tpPresets) tpPresets.style.display = tpM === 'amount' ? 'flex' : 'none';

      var dailyTpChk = document.getElementById('cfgDailyTpEnabled');
      if (dailyTpChk) dailyTpChk.checked = Boolean(settings.dailyProfitTargetEnabled);
      var dailyTpValEl = document.getElementById('cfgDailyTpVal');
      if (dailyTpValEl) dailyTpValEl.value = String(settings.dailyProfitTargetVal || 500);
      var dailyTpModeSel = document.getElementById('cfgDailyTpMode');
      if (dailyTpModeSel) dailyTpModeSel.value = settings.dailyProfitTargetMode || 'amount';

      updateRiskLevelBadges();
      updateLiveRiskCalculator();
      strategyFormInitialized = true;
    }

    function validateAndSaveRiskSettings(skipDangerModal) {
      var alertBox = document.getElementById('riskValidationAlert');
      if (alertBox) alertBox.style.display = 'none';

      var lev = Math.max(1, Math.min(500, Math.round(Number(document.getElementById('cfgLev')?.value || 5))));
      var rMode = currentRiskMode;
      var rPct = Number(document.getElementById('cfgRiskPct')?.value || 2) / 100;
      var rPips = Number(document.getElementById('cfgRiskPips')?.value || 25);
      var rAmt = Number(document.getElementById('cfgRiskAmount')?.value || 100);
      var atr = Number(document.getElementById('cfgAtrMult')?.value || 1.35);

      var slMode = currentSlMode;
      var slVal = slMode === 'amount' ? Number(document.getElementById('cfgSlAmount')?.value || rAmt) : atr;

      var dayLossMode = document.getElementById('cfgDayLossMode')?.value || 'pct';
      var dayLossPct = Number(document.getElementById('cfgDayLossPct')?.value || 5) / 100;
      var dayLossVal = Number(document.getElementById('cfgDayLossVal')?.value || 500);

      var tradeLossMode = document.getElementById('cfgMaxTradeLossMode')?.value || 'amount';
      var tradeLossVal = Number(document.getElementById('cfgMaxTradeLossVal')?.value || 0);

      var totalLossMode = document.getElementById('cfgTotalLossMode')?.value || 'pct';
      var totalLossVal = Number(document.getElementById('cfgTotalLossVal')?.value || 0);
      var autoStop = Boolean(document.getElementById('cfgAutoStopLossChk')?.checked);

      var tpMode = currentTpMode;
      var tpVal = Number(document.getElementById('cfgTpVal')?.value || 2.0);

      var dailyTpEnabled = Boolean(document.getElementById('cfgDailyTpEnabled')?.checked);
      var dailyTpVal = Number(document.getElementById('cfgDailyTpVal')?.value || 500);
      var dailyTpMode = document.getElementById('cfgDailyTpMode')?.value || 'amount';

      var errors = [];
      if (lev < 1 || lev > 500) errors.push('Le levier doit être compris entre 1 et 500.');
      if (rMode === 'pct' && (rPct <= 0 || rPct > 1.0)) errors.push('Le risque par trade doit être supérieur à 0.');
      if (rMode === 'amount' && rAmt <= 0) errors.push('Le montant risqué doit être supérieur à 0.');
      if (slMode === 'amount' && slVal <= 0) errors.push('Le Stop-Loss en euro doit être supérieur à 0.');
      if (atr < 0.3 || atr > 5.0) errors.push('Le multiplicateur ATR doit être compris entre 0.3 et 5.0.');
      if (tpVal <= 0) errors.push('La cible Take Profit doit être supérieure à 0.');

      if (errors.length) {
        if (alertBox) {
          alertBox.textContent = '⚠️ ' + errors.join(' ');
          alertBox.style.display = 'block';
        }
        return;
      }

      var payload = {
        defaultLeverage: lev,
        riskMode: rMode,
        maxRiskPct: rPct,
        riskPips: rPips,
        riskAmount: rAmt,
        slMode: slMode,
        slVal: slVal,
        fixedStopAtr: atr,
        maxDayLossMode: dayLossMode,
        maxDayLossPct: dayLossPct,
        maxDayLossVal: dayLossVal,
        maxLossPerTradeMode: tradeLossMode,
        maxLossPerTradeVal: tradeLossVal,
        maxTotalLossMode: totalLossMode,
        maxTotalLossVal: totalLossVal,
        autoStopOnMaxLoss: autoStop,
        tpMode: tpMode,
        tpVal: tpVal,
        dailyProfitTargetEnabled: dailyTpEnabled,
        dailyProfitTargetMode: dailyTpMode,
        dailyProfitTargetVal: dailyTpVal
      };

      var isDangerous = lev > 20 || (rMode === 'pct' && rPct > 0.10) || (dayLossMode === 'pct' && dayLossPct > 0.20);
      if (isDangerous && !skipDangerModal) {
        pendingDangerousSettings = payload;
        var desc = document.getElementById('dangerRiskModalDesc');
        if (desc) {
          desc.innerHTML =
            'Vous avez sélectionné des paramètres à <strong>très haut risque</strong> :<br>' +
            '• Levier : <strong>' + lev + 'x</strong><br>' +
            '• Risque par trade : <strong>' + (rMode === 'pct' ? (rPct * 100).toFixed(1) + ' %' : rAmt + ' €/$') + '</strong><br>' +
            '• Limite de perte journalière : <strong>' + (dayLossMode === 'pct' ? (dayLossPct * 100).toFixed(1) + ' %' : dayLossVal + ' €/$') + '</strong><br><br>' +
            'Une succession rapide de variations défavorables peut entraîner un drawdown violent. Êtes-vous sûr de vouloir appliquer ces paramètres ?';
        }
        var modal = document.getElementById('dangerRiskModal');
        if (modal) modal.classList.add('open');
        return;
      }

      saveSettingsToServer(payload);
    }

    async function saveSettingsToServer(settings) {
      var btn = document.getElementById('btnSaveRisk');
      if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }
      try {
        var res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ settings: settings })
        });
        var out = await res.json();
        if (out.ok) {
          if (deskState) {
            deskState.settings = Object.assign({}, deskState.settings || {}, settings);
          }
          isStrategyFormDirty = false;
          if (btn) {
            btn.textContent = '✅ Réglages enregistrés !';
            setTimeout(function () { if (btn) { btn.textContent = 'Sauvegarder les réglages'; btn.disabled = false; } }, 1800);
          }
        } else {
          var alertBox = document.getElementById('riskValidationAlert');
          if (alertBox) {
            alertBox.textContent = 'Erreur : ' + (out.error || 'impossible de sauvegarder');
            alertBox.style.display = 'block';
          }
          if (btn) btn.disabled = false;
        }
      } catch (e) {
        if (btn) btn.disabled = false;
      }
    }

    function confirmSaveDangerRisk() {
      closeDangerRiskModal();
      if (pendingDangerousSettings) {
        saveSettingsToServer(pendingDangerousSettings);
        pendingDangerousSettings = null;
      }
    }

    function closeDangerRiskModal() {
      var modal = document.getElementById('dangerRiskModal');
      if (modal) modal.classList.remove('open');
      pendingDangerousSettings = null;
    }

    function resetRiskToRecommended() {
      applyRiskProfile('equilibre');
      var alertBox = document.getElementById('riskValidationAlert');
      if (alertBox) {
        alertBox.style.color = '#38bdf8';
        alertBox.style.display = 'block';
        alertBox.textContent = 'ℹ️ Réglages réinitialisés aux valeurs recommandées (Levier 5x, Risque 2%, Stop ATR 1.35x). Cliquez sur "Sauvegarder les réglages" pour les appliquer.';
      }
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
      validateAndSaveRiskSettings(true);
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

      var meanR = sum.meanReward !== undefined ? Number(sum.meanReward) : Number(sum.meanAdvantage || 0);
      var rewardLabel = (meanR >= 0 ? '+' : '') + meanR.toFixed(2);
      var rewardCls = meanR > 0.05 ? 'up' : meanR < -0.05 ? 'down' : 'mono';
      var advPct = Math.max(0, Math.min(100, Math.round(((meanR + 1.5) / 3.0) * 100)));

      var klVal = Number(sum.klDivergence || 0);
      var klStr = klVal.toFixed(4);
      var klStatus = klVal < 0.05 ? 'Très stable' : klVal < 0.15 ? 'Ajustement modéré' : 'Drift élevé';
      var klColor = klVal < 0.05 ? 'var(--up)' : klVal < 0.15 ? 'var(--amber)' : 'var(--down)';
      var klPct = Math.min(100, Math.max(5, Math.round((klVal / 0.20) * 100)));

      var dsrPct = Math.round(Number(sum.deflatedSharpe || 0.27) * 100);

      var html =
        '<div class="ai-metric-card">' +
          '<div>' +
            '<div style="font-weight:700">Avantage Stratégique (Â) <span class="info-tip" data-tip="Mesure à quel point la stratégie gagne plus qu&#39;elle ne perd en R-multiple net (récompense moyenne des trajectoires récentes de l&#39;IA). Valeur positive = stratégie gagnante sur le marché.">?</span></div>' +
            '<div style="font-size:10.5px;color:var(--fg-2)">Indique si les gains surpassent les pertes</div>' +
            '<div class="progress-track" style="height:6px;margin:6px 0 2px;background:rgba(255,255,255,0.08)">' +
              '<div class="progress-fill" style="width:' + advPct + '%;background:' + (meanR >= 0 ? 'var(--up)' : 'var(--down)') + '"></div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<strong class="mono ' + rewardCls + '" style="font-size:16px">' + rewardLabel + ' R</strong>' +
            '<div style="font-size:9.5px;color:var(--fg-3)">' + (meanR > 0 ? 'Gagnant' : 'Défavorable') + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ai-metric-card">' +
          '<div>' +
            '<div style="font-weight:700">Stabilité d&#39;Apprentissage (KL) <span class="info-tip" data-tip="Divergence de Kullback-Leibler : vérifie que l&#39;IA reste régulière et fidèle à son modèle éprouvé plutôt que de changer brusquement de stratégie par hasard ou coup de chance. Moins de 0.05 = parfait.">?</span></div>' +
            '<div style="font-size:10.5px;color:var(--fg-2)">Régularité vs risque de dérive</div>' +
            '<div class="progress-track" style="height:6px;margin:6px 0 2px;background:rgba(255,255,255,0.08)">' +
              '<div class="progress-fill" style="width:' + klPct + '%;background:' + klColor + '"></div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<strong class="mono" style="font-size:15px;color:' + klColor + '">' + klStr + '</strong>' +
            '<div style="font-size:9.5px;color:' + klColor + '">' + klStatus + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ai-metric-card">' +
          '<div>' +
            '<div style="font-weight:700">Qualité du Risque (Sharpe) <span class="info-tip" data-tip="Deflated Sharpe Ratio : probabilité statistique que les performances de l&#39;IA soient réelles et non dues à la chance, corrigée du nombre d&#39;essais et de l&#39;asymétrie des rendements.">?</span></div>' +
            '<div style="font-size:10.5px;color:var(--fg-2)">Robustesse hors-échantillon</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<strong class="mono" style="font-size:16px;color:var(--accent)">' + dsrPct + '%</strong>' +
            '<div style="font-size:9.5px;color:var(--fg-3)">' + (dsrPct >= 50 ? 'Validé' : 'En rodage') + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="font-size:11px;color:var(--fg-2);margin:12px 0 6px">Préférences actuelles de l&#39;IA (' + regime + ') :</div>';

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

      if (!strategyFormInitialized && s && Object.keys(s).length > 0) {
        populateStrategyForm(s, false);
      }
      updateRiskLevelBadges();
      updateLiveRiskCalculator();

      var activeId = document.activeElement ? document.activeElement.id : '';
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
      setupStealthAndShortcuts();
      setupChartDrawingEvents();
      restoreWidgetOrder();
      setupWidgetDragDrop();
      initDefaultDates();
      renderAtrMiniChart(1.35);
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
      // Les textures canvas du desk 3D doivent être dessinées APRÈS le chargement de la police
      var fontsReady = (document.fonts && document.fonts.load)
        ? Promise.all([document.fonts.load("700 34px 'Inter Variable'"), document.fonts.load("600 26px 'Inter Variable'")]).catch(function () {})
        : Promise.resolve();
      fontsReady.then(init3dDesk);
      connectStream();
      fetchRlMemory();
    });
  </script>
</body>
</html>
`;
