export const DASHBOARD_HTML = /* html */ `<!DOCTYPE html>
<html lang="fr" data-theme="obsidian">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TRADING FLOOR V3 — Terminal Quantitatif 8 Agents IA</title>
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
      /* Rayons & Surface personnalisables */
      --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-pill: 999px;
      --glass-blur: 24px;
      --card-pad: 18px;
      --accent-glow: 0 0 0 rgba(56, 189, 248, 0);
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
      overflow-wrap: break-word;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      transition: background-color 0.24s var(--ease-out), color 0.18s var(--ease-out);
    }
    h1, h2, h3 { text-wrap: balance; }

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

    /* ================= UNIFIED TOP HUD BAR (ZERO COLLISION) ================= */
    #topHudBar {
      position: fixed;
      top: 10px;
      left: 14px;
      right: 14px;
      min-height: 54px;
      z-index: 90;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px 12px;
      padding: 6px 12px;
      border-radius: 16px;
      background: rgba(11, 15, 24, 0.86);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.65);
    }

    .brand-dot {
      width: 9px;
      height: 9px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--up);
      box-shadow: 0 0 12px var(--up);
      transition: transform 0.2s ease;
    }
    .brand-dot.halted {
      background: var(--amber);
      box-shadow: 0 0 14px var(--amber);
      animation: pulseWarn 1.1s infinite;
    }
    @keyframes pulseWarn {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.25); opacity: 0.65; }
    }

    #hudKpiBadge {
      display: flex;
      align-items: center;
      gap: 9px;
      min-inline-size: 0;
      flex-wrap: nowrap;
    }
    .hud-kpi-item {
      display: flex;
      flex-direction: column;
      white-space: nowrap;
    }
    .hud-kpi-lbl {
      font-size: 8.5px;
      text-transform: uppercase;
      font-family: var(--font);
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 1px;
    }
    .hud-kpi-val {
      font-size: 12.5px;
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.15;
    }
    .hud-divider {
      width: 1px;
      height: 22px;
      background: rgba(255, 255, 255, 0.12);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
      position: relative;
    }
    .pill-btn {
      border: 1px solid var(--ring-1);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%);
      color: var(--fg-1);
      padding: 5px 8px;
      min-block-size: 30px;
      border-radius: 8px;
      font-size: 10.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
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

    #emergencyWidget {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
    }
    .btn-emergency-act {
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(14, 18, 28, 0.85);
      color: #e2e8f0;
      padding: 5px 8px;
      min-block-size: 30px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.03em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-emergency-act:hover {
      transform: translateY(-1px);
    }
    .btn-emergency-close {
      border-color: rgba(244, 63, 94, 0.45);
      color: #fb7185;
      background: rgba(225, 29, 72, 0.18);
    }
    .btn-emergency-close:hover {
      background: rgba(225, 29, 72, 0.35);
      border-color: #f43f5e;
      color: #fff;
      box-shadow: 0 0 16px rgba(244, 63, 94, 0.35);
    }
    .btn-emergency-halt {
      border-color: rgba(250, 204, 21, 0.45);
      color: #fde047;
      background: rgba(234, 179, 8, 0.18);
    }
    .btn-emergency-halt:hover {
      background: rgba(234, 179, 8, 0.35);
      border-color: #facc15;
      color: #fff;
      box-shadow: 0 0 16px rgba(250, 204, 21, 0.35);
    }
    .btn-emergency-halt.resuming {
      border-color: var(--up-ring);
      background: var(--up-bg);
      color: var(--up);
    }
    .btn-emergency-mt5 {
      border-color: rgba(56, 189, 248, 0.45);
      color: #7dd3fc;
      background: rgba(14, 165, 233, 0.18);
    }
    .btn-emergency-mt5:hover {
      background: rgba(14, 165, 233, 0.35);
      border-color: #38bdf8;
      color: #fff;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
    }

    /* ================= FLOATING MAC OS DOCK (BOTTOM CENTER) ================= */
    #macDock {
      position: fixed;
      bottom: max(12px, env(safe-area-inset-bottom, 0px));
      left: 50%;
      transform: translateX(-50%);
      z-index: 95;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 22px;
      background: rgba(11, 15, 24, 0.84);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.78), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      pointer-events: auto;
    }
    .dock-btn {
      position: relative;
      width: 44px;
      height: 44px;
      min-inline-size: 44px;
      min-block-size: 44px;
      border-radius: 14px;
      border: 1px solid transparent;
      background: transparent;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.18s ease, color 0.18s ease;
    }
    .dock-btn:hover {
      transform: scale(1.12) translateY(-4px);
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
    }
    .dock-btn.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      border-color: rgba(56, 189, 248, 0.35);
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.22);
    }
    .dock-btn.active::after {
      content: "";
      position: absolute;
      bottom: 3px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
    }
    .dock-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.14s ease, visibility 0.14s ease;
    }
    .dock-btn:hover .dock-tooltip,
    .dock-btn:focus-visible .dock-tooltip {
      opacity: 1;
      visibility: visible;
    }
    .dock-sep {
      width: 1px;
      height: 26px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 2px;
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

    /* Asset multi-select dropdown */
    #assetDropdownMenu {
      position: fixed;
      top: var(--top-clearance, 76px);
      right: 14px;
      width: min(460px, calc(100dvw - 28px));
      max-height: calc(100dvh - var(--top-clearance, 76px) - 112px);
      overflow-y: auto;
      overscroll-behavior: contain;
      z-index: 125;
      display: none;
      padding: 16px;
      border-radius: 16px;
      background: var(--surface-elevated);
      backdrop-filter: blur(28px);
      border: 1px solid var(--ring-2);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.78);
    }
    .asset-accordion {
      margin-bottom: 8px;
      border: 1px solid var(--ring-1);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
      overflow: hidden;
      transition: border-color 0.15s ease;
    }
    .asset-accordion:hover { border-color: var(--ring-2); }
    .asset-accordion[open] { border-color: rgba(56, 189, 248, 0.35); }
    .asset-accordion summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--fg-0);
      user-select: none;
      background: rgba(255, 255, 255, 0.03);
      list-style: none;
    }
    .asset-accordion summary::-webkit-details-marker { display: none; }
    .asset-summary-left { display: flex; align-items: center; gap: 8px; }
    .asset-cat-tag {
      font-size: 9.5px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.12);
      color: var(--accent);
      font-weight: 800;
    }
    .asset-summary-actions { display: flex; align-items: center; gap: 4px; }
    .asset-quick-btn {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid var(--ring-1);
      background: rgba(255, 255, 255, 0.05);
      color: var(--fg-2);
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .asset-quick-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border-color: var(--accent);
    }
    .asset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 10px; }
    .asset-item {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 6px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--ring-1);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .asset-item:hover { border-color: var(--accent); background: rgba(56, 189, 248, 0.05); }

    /* ================= VIEWPORT PANELS ================= */
    .view-panel {
      position: fixed;
      top: var(--top-clearance, 72px);
      right: 0;
      bottom: 82px;
      left: 0;
      display: none;
      padding: 8px 16px 24px;
      scroll-padding-top: 12px;
      scroll-padding-bottom: 24px;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .view-panel.active { display: block; }
    #view-desk.view-panel {
      inset: 0;
      padding: 0;
      overflow: hidden;
    }

    /* ================= TAB 1: DESK 3D ================= */
    #canvas3dWrap {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-gradient);
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
      top: calc(var(--top-clearance, 78px) + 40px);
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
      top: var(--top-clearance, 78px);
      max-width: calc(100dvw - 32px);
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

    /* ================= LIVE GOAL TRACKER WIDGET ================= */
    #goalTrackerWidget {
      position: fixed;
      top: 76px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 36;
      width: 90%;
      max-width: 580px;
      background: var(--bg-panel);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--ring-1);
      border-radius: var(--radius-lg);
      padding: 10px 14px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.55);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #goalTrackerWidget.lagging {
      border-color: rgba(239, 68, 68, 0.7);
      box-shadow: 0 0 24px rgba(239, 68, 68, 0.35);
      animation: pulseLagging 1.8s infinite;
    }
    #goalTrackerWidget.reached {
      border-color: rgba(16, 185, 129, 0.7);
      box-shadow: 0 0 24px rgba(16, 185, 129, 0.35);
    }
    @keyframes pulseLagging {
      0%, 100% { border-color: rgba(239, 68, 68, 0.6); box-shadow: 0 0 16px rgba(239, 68, 68, 0.25); }
      50% { border-color: rgba(249, 115, 22, 0.9); box-shadow: 0 0 30px rgba(239, 68, 68, 0.55); }
    }
    .goal-tracker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .goal-tracker-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
    }
    #goalTrackerWidget.lagging .goal-tracker-dot {
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
      animation: blinkRed 1s infinite;
    }
    #goalTrackerWidget.reached .goal-tracker-dot {
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    @keyframes blinkRed {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }
    .goal-status-badge {
      font-size: 10px;
      font-family: var(--font-mono);
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 2px 7px;
      border-radius: 4px;
      background: var(--bg-hover);
      border: 1px solid var(--ring-1);
      color: var(--text-muted);
    }
    #goalTrackerWidget.lagging .goal-status-badge {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }
    #goalTrackerWidget.reached .goal-status-badge {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
      color: #6ee7b7;
    }
    .goal-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 6px;
    }
    .goal-metric-cell {
      background: rgba(0, 0, 0, 0.35);
      border-radius: var(--radius-sm);
      padding: 4px 6px;
      text-align: center;
    }
    .goal-metric-lbl {
      font-size: 9px;
      font-family: var(--font-mono);
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.04em;
    }
    .goal-metric-val {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-main);
    }
    .goal-progress-wrap {
      width: 100%;
      height: 4px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;
    }
    .goal-progress-bar {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      transition: width 0.4s ease;
    }
    #goalTrackerWidget.lagging .goal-progress-bar {
      background: linear-gradient(90deg, #f97316, #ef4444);
    }
    #goalTrackerWidget.reached .goal-progress-bar {
      background: linear-gradient(90deg, #10b981, #14b8a6);
    }

    /* ================= GLASS CARD ================= */
    .glass-card {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), var(--surface-glass);
      backdrop-filter: blur(var(--glass-blur, 24px));
      -webkit-backdrop-filter: blur(var(--glass-blur, 24px));
      border-radius: var(--r-lg, 16px);
      border: 1px solid var(--ring-1);
      box-shadow: var(--shadow-glass), var(--accent-glow, 0 0 0 transparent);
      padding: var(--card-pad, 18px);
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
      grid-template-columns: 240px minmax(0, 1fr);
      gap: 14px;
      height: 100%;
      min-height: 0;
    }
    .chat-shell > aside {
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
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
    #view-charts.view-panel { padding: 4px 14px 8px !important; overflow: hidden; }
    .chart-shell {
      display: flex;
      flex-direction: column;
      gap: 6px;
      height: 100%;
      min-height: 0;
      padding: 10px 12px !important;
      overflow: hidden;
    }
    .chart-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--ring-1);
      flex-shrink: 0;
    }
    .chart-pinned-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-bottom: 1px solid var(--ring-1);
      background: rgba(255, 255, 255, 0.02);
      overflow-x: auto;
      flex-shrink: 0;
      min-height: 32px;
    }
    .pinned-pos-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      border-radius: 999px;
      border: 1px solid var(--ring-1);
      background: rgba(255, 255, 255, 0.04);
      color: var(--fg-1);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.14s ease;
    }
    .pinned-pos-btn:hover { border-color: var(--accent); color: var(--fg-0); }
    .pinned-pos-btn.active { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); }
    #lwChartContainer {
      flex: 1;
      width: 100%;
      min-height: 0;
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

    .notion-two-col { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr); gap: 14px; }
    @media (max-width: 860px) {
      .notion-two-col { grid-template-columns: 1fr; }
      .chat-shell { grid-template-columns: 1fr; height: auto; min-height: calc(100dvh - 196px); }
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

    .cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; margin-top: 8px; width: 100%; }
    .cal-day-hdr { font-size: 9px; text-align: center; color: var(--fg-3); font-weight: 700; padding-bottom: 4px; }
    .cal-cell {
      border-radius: 7px;
      padding: 4px;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid var(--ring-1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 9.5px;
      min-width: 0;
      min-height: 44px;
      overflow: hidden;
    }
    .cal-cell.pos { background: var(--up-bg); border-color: var(--up-ring); }
    .cal-cell.neg { background: var(--down-bg); border-color: var(--down-ring); }

    /* ================= TAB 5: ENTRAINEMENT IA & BENTO COMPACT ================= */
    .strat-bento-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.38fr) minmax(300px, 1fr);
      gap: 12px;
      align-items: start;
      padding-bottom: 16px;
    }
    @media (max-width: 880px) {
      .strat-bento-layout { grid-template-columns: 1fr; }
    }
    .strat-col-stack {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .strat-grid {
      display: contents;
    }
    .risk-bento-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    @media (max-width: 760px) {
      .risk-bento-grid { grid-template-columns: 1fr; }
    }
    .risk-bento-wide { grid-column: 1 / -1; }
    .risk-field-card-compact { padding: 10px 11px !important; margin-bottom: 0 !important; }
    .prog-stop-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--ring-2);
      background: rgba(255, 255, 255, 0.05);
      color: var(--fg-1);
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.16s ease;
    }
    .prog-stop-btn.active {
      border-color: var(--up);
      background: var(--up-bg);
      color: var(--up);
      box-shadow: 0 0 14px var(--up-bg);
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

    .lev-preset-btn {
      transition: all 0.18s ease;
      cursor: pointer;
      font-weight: 600;
    }
    .lev-preset-btn.active {
      background: var(--accent) !important;
      border-color: var(--accent) !important;
      color: #ffffff !important;
      font-weight: 800 !important;
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.45) !important;
      transform: translateY(-1px);
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
      min-height: 0;
      position: relative;
      overflow: hidden;
    }
    .draw-toolbar {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 4px;
      border-radius: 12px;
      background: rgba(128, 128, 128, 0.06);
      border: 1px solid var(--ring-1);
      width: 42px;
      height: 100%;
      max-height: 100%;
      align-items: center;
      flex-shrink: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    .draw-tool-btn {
      width: 28px;
      height: 28px;
      min-height: 28px;
      flex-shrink: 0;
      border-radius: 7px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--fg-2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .draw-tool-btn:hover { color: var(--fg-0); background: rgba(128, 128, 128, 0.12); }
    .draw-tool-btn.active { background: var(--accent-bg); color: var(--accent); border-color: var(--accent); }
    .chart-stage {
      flex: 1 1 75%;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: var(--input-bg);
      border: 1px solid var(--ring-1);
      min-width: 0;
      min-height: 0;
    }
    .chart-profile-panel {
      flex: 0 0 25%;
      min-width: 245px;
      max-width: 340px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      min-height: 0;
    }
    .mp-stat-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 11.5px;
    }
    .mp-bars-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-height: 120px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .mp-bar-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
    }
    .mp-bar-track {
      flex: 1;
      height: 7px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      overflow: hidden;
    }
    .mp-bar-fill { height: 100%; border-radius: 999px; }
    #lwChartContainer, #tvWidgetContainer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      min-height: 0;
    }
    #tvWidgetContainer { display: none; }
    #lwChartContainer { display: block; }
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
    @media (max-width: 1000px) {
      #topHudBar { left: 8px; right: 8px; top: 8px; padding: 6px 10px; gap: 6px; }
      .view-panel:not(#view-desk) { padding: 8px 10px 24px; }
      #view-charts.view-panel { padding: 4px 10px 8px !important; }
    }
    @media (max-width: 720px) {
      .pill-btn, .draw-tool-btn, .tf-btn { min-height: 44px; }
      .form-grid { grid-template-columns: 1fr; }
      .theme-grid { grid-template-columns: 1fr; }
      .chart-workspace { flex-direction: column; }
      .chart-profile-panel { flex: none; max-width: none; width: 100%; max-height: 240px; }
      .draw-toolbar { flex-direction: row; width: 100%; height: auto; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <!-- BARRE HUD SUPÉRIEURE UNIFIÉE (ZERO SUPERPOSITION) -->
  <header id="topHudBar">
    <div id="hudKpiBadge">
      <span class="brand-dot" id="liveHealthDot" title="Statut du Desk"></span>
      <div class="hud-kpi-item">
        <span class="hud-kpi-lbl">Equity (MT5)</span>
        <span class="hud-kpi-val mono" id="hudTotalEquityVal">$10,000.00</span>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-kpi-item">
        <span class="hud-kpi-lbl">Session PnL</span>
        <span class="hud-kpi-val mono up" id="hudSessionPnlVal">+$0.00</span>
      </div>
      <div class="hud-divider"></div>
      <div class="hud-kpi-item">
        <span class="hud-kpi-lbl">Active Risk</span>
        <span class="hud-kpi-val mono" id="hudActiveRiskVal" style="color:#38bdf8">0.00% ($0)</span>
      </div>
    </div>

    <div class="nav-actions">
      <select id="topActiveRegimeSelect" aria-label="Régime de trading" class="pill-btn mono" style="background:var(--surface-elevated);border:1px solid var(--ring-1);font-size:10.5px;font-weight:700;padding:4px 7px;cursor:pointer;outline:none;max-width:122px" onchange="quickSwitchRegime(this.value)" title="Changer le régime de trading en direct">
        <option value="standard">Standard</option>
        <option value="macro_fvg">Macro FVG</option>
        <option value="hft_kamikaze">Kamikaze HFT</option>
      </select>
      <button type="button" class="pill-btn mono" id="navCadenceBadge" onclick="switchTab('strategy');setTimeout(function(){var el=document.getElementById('cfgTradesPerMin');if(el)el.focus();},120);" title="Cadence actuelle de scan/trading (cliquer pour accélérer)">4/min</button>

      <div style="position:relative;display:inline-block">
        <button class="pill-btn mono" id="navLevBadge" onclick="toggleNavLevDropdown(event)" title="Levier actif (cliquer pour modifier en 1 clic)">x5</button>
        <div id="navLevDropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;left:auto;background:var(--surface-elevated);border:1px solid var(--ring-2);box-shadow:0 16px 36px rgba(0,0,0,0.72);border-radius:12px;padding:14px;z-index:99999;width:min(290px, calc(100dvw - 28px))">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-weight:700;font-size:12px;letter-spacing:0.02em;color:var(--fg-0)">LEVIER DE TRADING</div>
            <span id="navLevCurrentBadge" class="level-badge prudent" style="font-size:11px">Prudent</span>
          </div>
          <div style="font-size:11px;color:var(--fg-2);margin-bottom:10px;line-height:1.4">
            Modifiez le levier en 1 clic pour l'appliquer en direct au desk et à MT5 :
          </div>
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px;margin-bottom:12px">
            <button type="button" class="pill-btn mono lev-preset-btn" data-lev="2" onclick="quickApplyLeverage(2); closeNavLevDropdown()">2x</button>
            <button type="button" class="pill-btn mono lev-preset-btn" data-lev="5" onclick="quickApplyLeverage(5); closeNavLevDropdown()">5x</button>
            <button type="button" class="pill-btn mono lev-preset-btn" data-lev="10" onclick="quickApplyLeverage(10); closeNavLevDropdown()">10x</button>
            <button type="button" class="pill-btn mono lev-preset-btn" data-lev="25" onclick="quickApplyLeverage(25); closeNavLevDropdown()">25x</button>
            <button type="button" class="pill-btn mono lev-preset-btn" data-lev="50" onclick="quickApplyLeverage(50); closeNavLevDropdown()">50x</button>
            <button type="button" class="pill-btn mono lev-preset-btn" data-lev="100" onclick="quickApplyLeverage(100); closeNavLevDropdown()">100x</button>
            <button type="button" class="pill-btn mono lev-preset-btn" data-lev="250" onclick="quickApplyLeverage(250); closeNavLevDropdown()">250x</button>
            <button type="button" class="pill-btn mono lev-preset-btn" data-lev="500" style="border-color:var(--down-ring);color:var(--down)" onclick="quickApplyLeverage(500); closeNavLevDropdown()">500x</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding-top:8px;border-top:1px solid var(--ring-1)">
            <input id="navLevQuickInput" type="number" min="1" max="500" value="5" class="input-dark mono" style="width:68px;text-align:center;font-weight:700" onkeydown="if(event.key==='Enter'){quickApplyLeverage(this.value);closeNavLevDropdown();}" />
            <button type="button" class="pill-btn primary" style="flex:1;font-size:11px;font-weight:700" onclick="quickApplyLeverage(document.getElementById('navLevQuickInput').value); closeNavLevDropdown()">Appliquer</button>
          </div>
          <div style="margin-top:8px;text-align:right">
            <a href="javascript:void(0)" onclick="closeNavLevDropdown(); switchTab('strategy')" style="font-size:11px;color:var(--accent);text-decoration:none;font-weight:600">Tous les réglages de risque →</a>
          </div>
        </div>
      </div>

      <button id="btnExecMode" class="pill-btn auto-off" onclick="toggleExecutionMode()">Confirm</button>
      <button id="btnAssetsToggle" class="pill-btn" onclick="toggleAssetDropdown()">Actifs ▾</button>
    </div>

    <div id="emergencyWidget">
      <button class="btn-emergency-act btn-emergency-close" onclick="openPanicModal()" title="Liquider toutes les positions immédiatement">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>CLOSE ALL</span>
      </button>
      <button id="btnPanicHalt" class="btn-emergency-act btn-emergency-halt" onclick="toggleManualHalt()" title="Mettre le desk en pause immédiate">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
        <span id="emergencyHaltLabel">HALT DESK</span>
      </button>
      <button class="btn-emergency-act btn-emergency-mt5" onclick="openDrawer(&quot;mobileDrawer&quot;)" title="Nouveau profil MT5 / Config Telegram">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
        <span>NEW MT5 PROFILE</span>
      </button>
    </div>
  </header>

  <div id="assetDropdownMenu">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--ring-1)">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <strong style="font-size:12px;font-weight:800;letter-spacing:0.04em">Univers Multi-Marches</strong>
        <button type="button" id="btnToggleAllAssets" class="pill-btn" style="padding:3px 9px;font-size:10.5px" onclick="toggleAllAssetsSelection()" title="Activer ou désactiver tous les actifs en un clic">Tout Activer / Désactiver</button>
        <button type="button" class="asset-quick-btn" onclick="selectAllAssets()" title="Cocher tous les actifs">Tous</button>
        <button type="button" class="asset-quick-btn" onclick="deselectAllAssets()" title="Tout decocher">Aucun</button>
      </div>
      <button class="pill-btn primary" onclick="applySelectedAssets()">Appliquer &amp; Scanner</button>
    </div>
    <div id="assetChecklistHost"></div>
  </div>

  <!-- FLOATING MAC OS DOCK BOTTOM -->
  <nav id="macDock" aria-label="Navigation principale">
    <button class="dock-btn active" data-tab="desk" onclick="switchTab(&quot;desk&quot;)" aria-label="Spatial Desk (Raccourci 1)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      <div class="dock-tooltip">Spatial Desk</div>
    </button>
    <button class="dock-btn" data-tab="charts" onclick="switchTab(&quot;charts&quot;)" aria-label="Charts et TradingView (Raccourci 3)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <div class="dock-tooltip">Charts</div>
    </button>
    <button class="dock-btn" data-tab="journal" onclick="switchTab(&quot;journal&quot;)" aria-label="Ledger et Notion (Raccourci 4)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <div class="dock-tooltip">Ledger</div>
    </button>
    <button class="dock-btn" data-tab="strategy" onclick="switchTab(&quot;strategy&quot;)" aria-label="RL Training et Stratégie (Raccourci 5)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      <div class="dock-tooltip">RL Training</div>
    </button>
    <div class="dock-sep"></div>
    <button class="dock-btn" data-tab="chat" onclick="switchTab(&quot;chat&quot;)" aria-label="Salon et Télémétrie Agents (Raccourci 2)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <div class="dock-tooltip">Salon &amp; Télémétrie</div>
    </button>
    <button class="dock-btn" data-tab="reviewer" onclick="switchTab(&quot;reviewer&quot;)" aria-label="Audit Reviewer 15m (Raccourci 6)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      <div class="dock-tooltip">Audit Reviewer</div>
    </button>
    <button class="dock-btn" onclick="openDrawer(&quot;themeDrawer&quot;)" aria-label="Thèmes et Préférences (Raccourci T)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      <div class="dock-tooltip">Thèmes</div>
    </button>
  </nav>

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
      <div class="badge-chip mono" id="deskRegimeChip">RÉGIME : STANDARD</div>
      <div class="badge-chip mono" id="deskRlChip">IA ÉPISODE #0</div>
      <div class="badge-chip mono">PROFIT FERMÉ : <span id="heroClosedProfit" class="up">+$0.00</span></div>
      <div class="badge-chip mono" id="deskThemeChip">THÈME : OBSIDIAN</div>
      <div class="badge-chip shield" id="deskShieldChip" style="display:none">VOLATILITY_SHIELD ACTIF (1.5x ATR)</div>
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
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <button type="button" id="btnChatAutoScroll" class="pill-btn auto-on" style="font-size:11px;padding:4px 10px" onclick="toggleChatAutoScroll()" title="Activer ou mettre en pause le défilement automatique vers le bas">Auto-défilement : ACTIF</button>
            <div id="pendingActionBanner"></div>
          </div>
        </div>
        <div id="chatReviewerBanner" style="padding:8px 14px;margin-bottom:6px;flex-shrink:0;position:relative;z-index:2;border-bottom:1px solid var(--border);background:rgba(167,139,250,0.08);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"></div>
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
          <div class="seg-group" id="chartEngineGroup" title="Basculer entre le graphique Desk connecté aux exécutions MT5 et TradingView">
            <button class="seg-btn active" data-engine="desk" onclick="setChartEngine(&quot;desk&quot;)">Graphique Desk</button>
            <button class="seg-btn" data-engine="tv" onclick="setChartEngine(&quot;tv&quot;)">TradingView</button>
          </div>
          <select id="chartSymbolSelect" class="input-dark mono" onchange="onChartSymbolChange()"></select>
          <button id="btnFavTfStar" class="pill-btn" onclick="toggleCurrentTfFavorite()" title="Ajouter ou retirer cette unité de temps des favoris">FAV</button>
          <button id="btnIndEma" class="pill-btn primary" onclick="toggleChartIndicator('ema')" title="Afficher / Masquer EMA 20 & EMA 50">EMA</button>
          <button id="btnIndVwap" class="pill-btn primary" onclick="toggleChartIndicator('vwap')" title="Afficher / Masquer VWAP Session">VWAP</button>
          <button class="pill-btn" onclick="fitChartToContent()" title="Ajuster la vue aux bougies">Fit</button>
          <button id="btnToggleDrawLayer" class="pill-btn" onclick="toggleDrawLayer()" title="Activer la barre de dessin interactive sur le graphique">Dessin</button>
          <button class="pill-btn" onclick="refreshChartData({fit:true})">↻</button>
        </div>

        <div class="chart-tf-strip" id="chartTfStrip">
          <!-- Peuplé dynamiquement : Favoris + 1s, 1m, 2m, 3m, 5m, 10m, 15m, 30m, 1h, 2h, 4h, 1j, 1sem, 1mois -->
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

      <div id="chartPinnedPositionsBar" class="chart-pinned-bar" aria-label="Paires épinglées avec positions ouvertes">
        <span style="font-size:10.5px;color:var(--fg-2);font-weight:700">Positions ouvertes épinglées : Aucune</span>
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
          <button class="draw-tool-btn" data-tool="measure" onclick="setDrawTool(&quot;measure&quot;)" title="Mesure (%)">MES</button>
          <hr style="width:26px;border:none;border-top:1px solid var(--ring-1);margin:2px 0" />
          <input id="drawColorPicker" type="color" value="#38bdf8" title="Couleur du tracé actif ou suivant" onchange="updateDrawColor(this.value)" style="width:30px;height:28px;border:none;background:transparent;cursor:pointer" />
          <button id="btnLockDrawing" class="draw-tool-btn" onclick="toggleSelectedDrawLock()" title="Verrouiller / Déverrouiller la sélection">LIBRE</button>
          <button class="draw-tool-btn" onclick="undoDrawing()" title="Annuler (Ctrl+Z)">↶</button>
          <button class="draw-tool-btn" onclick="redoDrawing()" title="Rétablir">↷</button>
          <button class="draw-tool-btn" onclick="deleteSelectedDrawing()" title="Supprimer la sélection">SUPPR</button>
          <button class="draw-tool-btn" onclick="clearSymbolDrawings()" title="Effacer tous les tracés de ce symbole" style="color:var(--down)">X</button>
        </aside>

        <div class="chart-stage" id="chartStage">
          <div id="chartOhlcvLegend" class="mono" style="position:absolute;top:8px;left:10px;z-index:12;pointer-events:none;background:rgba(2,6,23,0.76);backdrop-filter:blur(6px);padding:4px 10px;border-radius:7px;border:1px solid var(--ring-1);font-size:10.5px;color:var(--fg-1);display:flex;gap:10px;flex-wrap:wrap;align-items:center;max-width:calc(100% - 76px)">
            <span>--</span>
          </div>
          <div id="tvWidgetContainer"></div>
          <div id="lwChartContainer"></div>
          <canvas id="chartDrawCanvas"></canvas>
        </div>

        <aside id="chartMarketProfilePanel" class="chart-profile-panel" aria-label="Market Profile & Volume Node">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px">
            <strong style="font-size:11.5px;letter-spacing:0.05em;text-transform:uppercase;color:var(--fg-1)">Market Profile & Volume Node</strong>
            <span id="mpSymbolBadge" class="mono" style="font-size:11px;color:var(--fg-2)">--</span>
          </div>
          <div id="mpStatusBadge" class="mono" style="font-size:11px;font-weight:700;padding:6px 9px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1)">
            STATUS: EN ATTENTE
          </div>
          <div style="display:flex;flex-direction:column;gap:6px" class="mono">
            <div class="mp-stat-card" style="border-color:rgba(250,204,21,0.35)">
              <span style="color:var(--fg-2)">POC (Point of Control)</span>
              <strong id="mpPocVal" style="color:#facc15">--</strong>
            </div>
            <div class="mp-stat-card" style="border-color:rgba(56,189,248,0.35)">
              <span style="color:var(--fg-2)">VAH (Value Area High)</span>
              <strong id="mpVahVal" style="color:#38bdf8">--</strong>
            </div>
            <div class="mp-stat-card" style="border-color:rgba(56,189,248,0.35)">
              <span style="color:var(--fg-2)">VAL (Value Area Low)</span>
              <strong id="mpValVal" style="color:#38bdf8">--</strong>
            </div>
          </div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--fg-2);font-weight:700">
            Volume par Prix (Histogramme)
          </div>
          <div id="mpVolumeHistogram" class="mp-bars-list mono">
            <span style="font-size:11px;color:var(--fg-3)">En attente des données de session...</span>
          </div>
        </aside>
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
            <div style="font-size:11px;color:var(--fg-2)">Historique persistant 60+ jours (1M / 2M / ALL) · Synchronisé avec le calendrier</div>
          </div>
          <div class="seg-group" id="equityTfGroup">
            <button class="seg-btn" data-range="1D" onclick="setEquityRange(&quot;1D&quot;)">1D</button>
            <button class="seg-btn" data-range="1W" onclick="setEquityRange(&quot;1W&quot;)">1W</button>
            <button class="seg-btn" data-range="1M" onclick="setEquityRange(&quot;1M&quot;)">1M</button>
            <button class="seg-btn" data-range="2M" onclick="setEquityRange(&quot;2M&quot;)">2M</button>
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

        <div class="glass-card" style="overflow-x:auto;min-width:0">
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

  <!-- ==================== TAB 6: AUDIT REVIEWER 15M & POST-MORTEMS ==================== -->
  <section id="view-reviewer" class="view-panel">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div>
        <div class="card-title" style="font-size:15px">Audit Reviewer IA (Cycle 15 min) &amp; Amélioration Continue</div>
        <div style="font-size:11.5px;color:var(--fg-2);margin-top:2px">
          Rapports détaillés des trades passés, biais LONG/SHORT, performance par actif &amp; recommandations directes pour calibrer les agents.
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span id="revTabCountdown" class="chip mono" style="font-size:11px">Prochain audit : --:--</span>
        <button type="button" class="pill-btn primary btn-trigger-review15m" onclick="triggerSelfReflectionNow()">Lancer Audit Complet Reviewer</button>
      </div>
    </div>

    <div class="glass-card" style="padding:14px;margin-bottom:12px;border-left:3px solid #38bdf8">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#38bdf8;margin-bottom:4px">Directive Active Injectée au Stratège</div>
      <div id="revTabDirective" style="font-size:13px;font-weight:600;color:var(--fg-0);line-height:1.45">En attente du premier audit 15m...</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;margin-bottom:12px">
      <div class="glass-card" style="padding:12px">
        <div style="font-size:10.5px;color:var(--fg-3);text-transform:uppercase">WinRate Fenêtre</div>
        <div id="revKpiWinRate" class="mono" style="font-size:20px;font-weight:800;margin-top:4px">--%</div>
        <div id="revKpiWlCount" class="mono" style="font-size:11px;color:var(--fg-2);margin-top:2px">0W / 0L</div>
      </div>
      <div class="glass-card" style="padding:12px">
        <div style="font-size:10.5px;color:var(--fg-3);text-transform:uppercase">Gain Moyen</div>
        <div id="revKpiAvgWin" class="mono up" style="font-size:20px;font-weight:800;margin-top:4px">+0.00€</div>
        <div style="font-size:11px;color:var(--fg-2);margin-top:2px">Trades gagnants</div>
      </div>
      <div class="glass-card" style="padding:12px">
        <div style="font-size:10.5px;color:var(--fg-3);text-transform:uppercase">Perte Moyenne</div>
        <div id="revKpiAvgLoss" class="mono down" style="font-size:20px;font-weight:800;margin-top:4px">0.00€</div>
        <div style="font-size:11px;color:var(--fg-2);margin-top:2px">Trades perdants</div>
      </div>
      <div class="glass-card" style="padding:12px">
        <div style="font-size:10.5px;color:var(--fg-3);text-transform:uppercase">Biais LONG vs SHORT</div>
        <div id="revKpiDirSplit" class="mono" style="font-size:13px;font-weight:700;margin-top:6px">--</div>
        <div id="revKpiNetPnl" class="mono" style="font-size:11px;color:var(--fg-2);margin-top:4px">Net : 0.00€</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:12px;margin-bottom:12px">
      <div class="glass-card" style="padding:14px">
        <div class="card-hdr" style="margin-bottom:8px">
          <span class="card-title">Recommandations IA pour Améliorer les Agents</span>
        </div>
        <div id="revTabRecommendations" style="display:flex;flex-direction:column;gap:7px;font-size:12px;line-height:1.45;color:var(--fg-1)"></div>
        <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">
          <div style="font-size:11px;font-weight:700;color:var(--fg-2);margin-bottom:6px">Rapport Analytique Complet du Reviewer</div>
          <pre id="revTabDetailedReport" class="mono" style="margin:0;white-space:pre-wrap;font-size:11px;line-height:1.45;color:var(--fg-2);background:rgba(15,23,42,0.45);padding:10px;border-radius:8px;max-height:240px;overflow-y:auto"></pre>
        </div>
      </div>

      <div class="glass-card" style="padding:14px;display:flex;flex-direction:column;gap:10px">
        <div>
          <div class="card-hdr" style="margin-bottom:6px"><span class="card-title">Performance par Actif &amp; par Setup</span></div>
          <div id="revTabBreakdowns" style="font-size:11.5px;color:var(--fg-1);display:flex;flex-direction:column;gap:6px"></div>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:10px">
          <div class="card-hdr" style="margin-bottom:6px"><span class="card-title">Historique des Audits 15m</span></div>
          <div id="revTabTimeline" style="display:flex;flex-direction:column;gap:7px;max-height:230px;overflow-y:auto"></div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:12px">
      <div class="glass-card" style="padding:14px">
        <div class="card-hdr" style="margin-bottom:8px">
          <span class="card-title">Détail des Derniers Trades Clôturés (Post-Mortems)</span>
        </div>
        <div style="overflow-x:auto;max-height:290px;overflow-y:auto">
          <table class="tbl" style="width:100%;font-size:11.5px">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Actif</th>
                <th>Sens</th>
                <th>Setup</th>
                <th>Motif</th>
                <th style="text-align:right">PnL</th>
              </tr>
            </thead>
            <tbody id="revTabPostMortemBody"></tbody>
          </table>
        </div>
      </div>

      <div class="glass-card" style="padding:14px">
        <div class="card-hdr" style="margin-bottom:8px">
          <span class="card-title">Journal d'Expression du Reviewer</span>
        </div>
        <div id="revTabMessages" style="display:flex;flex-direction:column;gap:7px;max-height:290px;overflow-y:auto;font-size:11.5px"></div>
      </div>
    </div>
  </section>

  <!-- ==================== TAB 5: STRATÉGIE, RISQUE & ENTRAÎNEMENT IA (BENTO COMPACT) ==================== -->
  <section id="view-strategy" class="view-panel">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="card-title" style="font-size:14.5px">Entraînement de l'IA (Machine Learning) &amp; Gestion du Risque</span>
        <button id="btnAutoPilot1Click" class="pill-btn primary" style="padding:7px 13px;font-size:11.5px" onclick="runOneClickAutopilot()">
          Mode Simple 1-Clic : Entraîner l'IA &amp; Lancer les Trades Automatiquement
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <button id="btnPresetProPerf" class="pill-btn primary" onclick="applyRiskProfile('performance_pro')" title="Réglage optimal : Levier 20x · Risque 1.5 % · Stop 1.5x ATR · Cible 2.2R · Break-Even 50% ACTIF · Entraînement WFO+GRPO">Performance Pro (IA)</button>
        <button class="pill-btn" onclick="applyRiskProfile('prudent')" title="Levier 2x · Risque 1 % · Perte jour max 3 %">Prudent</button>
        <button class="pill-btn" onclick="applyRiskProfile('equilibre')" title="Levier 5x · Risque 2 % · Perte jour max 5 %">Équilibré</button>
        <button class="pill-btn" onclick="applyRiskProfile('agressif')" title="Levier 25x · Risque 3.5 % · Perte jour max 10 %">Agressif</button>
        <button id="btnLockGrid" class="pill-btn" onclick="toggleGridLock()">VERR Grille Verrouillée</button>
      </div>
    </div>

    <div class="strat-bento-layout">
      <div class="strat-grid" id="strategyWidgetsGrid">
        <!-- COLONNE GAUCHE BENTO : PARAMÈTRES COMPACTS & SAUVEGARDE TOUJOURS ACCESSIBLES -->
        <div class="glass-card strat-widget" data-widget-id="w-risk-params" draggable="false" style="padding:14px">
          <div class="card-hdr" style="margin-bottom:8px">
            <span class="card-title">Gestion du Risque, Stop-Loss &amp; Take Profit</span>
            <div style="display:flex;align-items:center;gap:6px">
              <button type="button" id="btnToggleProgressiveStop" class="prog-stop-btn" onclick="toggleProgressiveStop()" title="Break-Even adaptatif (50% à 90%) piloté en temps réel par les agents selon la proximité VAH/VAL, Range, TP et micro-retournements">
                <span>Break-Even 50-90% Adaptatif :</span>
                <strong id="lblProgStopState">INACTIF</strong>
              </button>
              <input id="cfgProgressiveSlEnabled" type="checkbox" style="display:none" onchange="syncProgressiveStopUi(this.checked)" />
              <div class="widget-reorder-bar">
                <button class="pill-btn" onclick="moveWidget(&quot;w-risk-params&quot;, -1)">↑</button>
                <button class="pill-btn" onclick="moveWidget(&quot;w-risk-params&quot;, 1)">↓</button>
              </div>
            </div>
          </div>

          <div class="risk-bento-grid">
            <!-- 1. LEVIER -->
            <div class="risk-field-card risk-field-card-compact risk-bento-wide">
              <div class="risk-field-head" style="margin-bottom:4px">
                <div class="risk-field-title" style="font-size:12px">
                  1. Levier de trading (1x à 500x)
                  <span class="info-tip" data-tip="Multiplie la taille de votre position par rapport à votre capital. Conseillé : 2x à 10x.">?</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span id="levApplyFeedback" style="font-size:11px;font-weight:600;display:none"></span>
                  <span id="badgeLevLevel" class="level-badge prudent">Prudent</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <input id="cfgLevSlider" type="range" min="1" max="500" value="5" class="lev-slider" oninput="syncLevFromSlider(this.value)" />
                <input id="cfgLev" type="number" min="1" max="500" class="input-dark mono" style="width:68px;text-align:center;font-weight:700;padding:5px" oninput="syncLevFromNumber(this.value)" onkeydown="if(event.key==='Enter'){applyCurrentLeverageInput();}" />
                <span class="mono accent" style="font-weight:800">x</span>
                <button id="btnApplyLevDirect" type="button" class="pill-btn primary" style="padding:5px 11px;font-size:11px;font-weight:700" onclick="applyCurrentLeverageInput()">Appliquer</button>
              </div>
              <div id="levPresetsWrap" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">
                <button type="button" class="pill-btn mono lev-preset-btn" data-lev="2" onclick="quickApplyLeverage(2)">2x</button>
                <button type="button" class="pill-btn mono lev-preset-btn" data-lev="5" onclick="quickApplyLeverage(5)">5x (Reco)</button>
                <button type="button" class="pill-btn mono lev-preset-btn" data-lev="10" onclick="quickApplyLeverage(10)">10x</button>
                <button type="button" class="pill-btn mono lev-preset-btn" data-lev="25" onclick="quickApplyLeverage(25)">25x</button>
                <button type="button" class="pill-btn mono lev-preset-btn" data-lev="50" onclick="quickApplyLeverage(50)">50x</button>
                <button type="button" class="pill-btn mono lev-preset-btn" data-lev="100" onclick="quickApplyLeverage(100)">100x</button>
                <button type="button" class="pill-btn mono lev-preset-btn" data-lev="250" onclick="quickApplyLeverage(250)">250x</button>
                <button type="button" class="pill-btn mono lev-preset-btn" data-lev="500" style="border-color:var(--down-ring);color:var(--down)" onclick="quickApplyLeverage(500)">500x MAX</button>
              </div>
            </div>

            <!-- 2. RISQUE PAR TRADE -->
            <div class="risk-field-card risk-field-card-compact">
              <div class="risk-field-head" style="margin-bottom:4px">
                <div class="risk-field-title" style="font-size:12px">
                  2. Risque / Trade
                  <span class="info-tip" data-tip="Somme maximale risquée sur une position (25 €, 50 €, 100 €, 500 € ou % du capital).">?</span>
                </div>
                <span id="badgeRiskLevel" class="level-badge balanced">Équilibré</span>
              </div>
              <div class="mode-switch-row" id="riskModeSwitch" style="margin-bottom:6px">
                <button type="button" class="mode-switch-btn active" data-mode="pct" onclick="setRiskMode('pct')">% Capital</button>
                <button type="button" class="mode-switch-btn" data-mode="amount" onclick="setRiskMode('amount')">Montant (€/$)</button>
                <button type="button" class="mode-switch-btn" data-mode="pips" onclick="setRiskMode('pips')">Pips</button>
              </div>
              <div style="display:flex;gap:6px;align-items:center">
                <input id="cfgRiskPct" type="number" step="0.1" min="0.1" max="100" class="input-dark mono" style="flex:1" oninput="updateLiveRiskCalculator()" />
                <input id="cfgRiskAmount" type="number" step="5" min="1" max="1000000" value="100" class="input-dark mono" style="flex:1;display:none" oninput="syncRiskAmountToSl(this.value); updateLiveRiskCalculator()" />
                <input id="cfgRiskPips" type="number" step="1" min="1" max="5000" value="25" class="input-dark mono" style="flex:1;display:none" oninput="updateLiveRiskCalculator()" />
                <span id="cfgRiskUnitLbl" class="mono" style="font-weight:700;min-width:36px;font-size:11px">%</span>
              </div>
              <div id="riskAmountPresets" style="display:none;gap:4px;flex-wrap:wrap;margin-top:6px">
                <button type="button" class="pill-btn" onclick="setQuickRiskAmount(100)">100 €</button>
                <button type="button" class="pill-btn" onclick="setQuickRiskAmount(250)">250 €</button>
                <button type="button" class="pill-btn" onclick="setQuickRiskAmount(500)">500 €</button>
                <button type="button" class="pill-btn" onclick="setQuickRiskAmount(1000)">1 000 €</button>
                <button type="button" class="pill-btn" onclick="setQuickRiskAmount(2000)">2 000 €</button>
              </div>
            </div>

            <!-- 3. STOP-LOSS & ATR -->
            <div class="risk-field-card risk-field-card-compact">
              <div class="risk-field-head" style="margin-bottom:4px">
                <div class="risk-field-title" style="font-size:12px">
                  3. Stop-Loss
                  <span class="info-tip" data-tip="Coupure automatique en montant fixe €/$ ou volatilité ATR.">?</span>
                </div>
                <span id="badgeAtrLevel" class="level-badge balanced">Équilibré</span>
              </div>
              <div class="mode-switch-row" id="slModeSwitch" style="margin-bottom:6px">
                <button type="button" class="mode-switch-btn active" data-mode="atr" onclick="setSlMode('atr')">ATR</button>
                <button type="button" class="mode-switch-btn" data-mode="amount" onclick="setSlMode('amount')">Montant (€/$)</button>
                <button type="button" class="mode-switch-btn" data-mode="pips" onclick="setSlMode('pips')">Pips</button>
                <button type="button" class="mode-switch-btn" data-mode="pct" onclick="setSlMode('pct')">%</button>
              </div>

              <div id="slAmountWrap" style="display:none">
                <div style="display:flex;gap:6px;align-items:center">
                  <input id="cfgSlAmount" type="number" step="5" min="1" max="1000000" value="100" class="input-dark mono" style="flex:1" oninput="syncSlAmountToRisk(this.value); updateLiveRiskCalculator()" />
                  <span class="mono" style="font-weight:700;font-size:11px">€ / $</span>
                </div>
                <div id="slAmountPresets" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
                  <button type="button" class="pill-btn" onclick="setQuickSlAmount(25)">-25 €</button>
                  <button type="button" class="pill-btn" onclick="setQuickSlAmount(50)">-50 €</button>
                  <button type="button" class="pill-btn" onclick="setQuickSlAmount(100)">-100 €</button>
                  <button type="button" class="pill-btn" onclick="setQuickSlAmount(250)">-250 €</button>
                  <button type="button" class="pill-btn" onclick="setQuickSlAmount(500)">-500 €</button>
                </div>
              </div>

              <div id="slAtrWrap">
                <div style="display:flex;align-items:center;gap:8px">
                  <input id="cfgAtrSlider" type="range" min="0.3" max="5.0" step="0.05" value="1.35" style="flex:1" oninput="syncAtrInputs(this.value)" />
                  <input id="cfgAtrMult" type="number" step="0.05" min="0.3" max="5" class="input-dark mono" style="width:66px;text-align:center;padding:5px" oninput="syncAtrInputs(this.value)" />
                </div>
                <div class="atr-preview-box" style="margin-top:6px;padding:6px">
                  <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--fg-2)">
                    <span>Stop ATR</span>
                    <span class="mono accent" id="atrPreviewLabel">1.35× ATR</span>
                  </div>
                  <svg id="atrMiniChartSvg" viewBox="0 0 360 92" style="width:100%;height:56px;display:block"></svg>
                </div>
              </div>

              <div id="slPipsWrap" style="display:none">
                <div style="display:flex;gap:6px;align-items:center">
                  <input id="cfgSlPips" type="number" step="1" min="1" max="5000" value="25" class="input-dark mono" style="flex:1" oninput="updateLiveRiskCalculator()" />
                  <span class="mono" style="font-weight:700;font-size:11px">Pips</span>
                </div>
              </div>

              <div id="slPctWrap" style="display:none">
                <div style="display:flex;gap:6px;align-items:center">
                  <input id="cfgSlPct" type="number" step="0.1" min="0.1" max="50" value="2.0" class="input-dark mono" style="flex:1" oninput="updateLiveRiskCalculator()" />
                  <span class="mono" style="font-weight:700;font-size:11px">%</span>
                </div>
              </div>
            </div>

            <!-- 4. TAKE PROFIT & CLÔTURE PNL OUVERT -->
            <div class="risk-field-card risk-field-card-compact">
              <div class="risk-field-head" style="margin-bottom:4px">
                <div class="risk-field-title" style="font-size:12px">
                  4. Take Profit &amp; Cible Ouverte
                  <span class="info-tip" data-tip="Prise de gain automatique par trade ou clôture globale dès que les positions ouvertes atteignent le PnL défini.">?</span>
                </div>
                <span class="level-badge balanced">Cible</span>
              </div>
              <div class="mode-switch-row" id="tpModeSwitch" style="margin-bottom:6px">
                <button type="button" class="mode-switch-btn active" data-mode="rr" onclick="setTpMode('rr')">Ratio (R)</button>
                <button type="button" class="mode-switch-btn" data-mode="amount" onclick="setTpMode('amount')">Montant (€/$)</button>
                <button type="button" class="mode-switch-btn" data-mode="pips" onclick="setTpMode('pips')">Pips</button>
                <button type="button" class="mode-switch-btn" data-mode="pct" onclick="setTpMode('pct')">%</button>
              </div>
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:5px">
                <input id="cfgTpVal" type="number" step="0.1" min="0.2" max="1000000" value="2.0" class="input-dark mono" style="flex:1" oninput="updateLiveRiskCalculator()" />
                <span id="cfgTpExampleLbl" style="font-size:10px;color:var(--fg-2)">Ex. : 2× R</span>
              </div>
              <div id="tpAmountPresets" style="display:none;gap:4px;flex-wrap:wrap;margin-bottom:6px">
                <button type="button" class="pill-btn" onclick="setQuickTpAmount(25)">+25 €</button>
                <button type="button" class="pill-btn" onclick="setQuickTpAmount(50)">+50 €</button>
                <button type="button" class="pill-btn" onclick="setQuickTpAmount(100)">+100 €</button>
                <button type="button" class="pill-btn" onclick="setQuickTpAmount(200)">+200 €</button>
                <button type="button" class="pill-btn" onclick="setQuickTpAmount(500)">+500 €</button>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding-top:6px;border-top:1px solid var(--ring-1)">
                <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer">
                  <input id="cfgDailyTpEnabled" type="checkbox" onchange="updateLiveRiskCalculator()" />
                  <span>Fermer tout à PnL ouvert</span>
                </label>
                <input id="cfgDailyTpVal" type="number" step="25" min="10" max="500000" value="500" class="input-dark mono" style="width:74px;padding:4px 6px" oninput="updateLiveRiskCalculator()" />
                <select id="cfgDailyTpMode" class="input-dark" style="padding:4px 6px" onchange="updateLiveRiskCalculator()">
                  <option value="amount">€ / $</option>
                  <option value="pct">%</option>
                </select>
              </div>
            </div>

            <!-- 5. PLAFONDS DE PERTE -->
            <div class="risk-field-card risk-field-card-compact">
              <div class="risk-field-head" style="margin-bottom:4px">
                <div class="risk-field-title" style="font-size:12px">
                  5. Coupe-Circuits Perte Max
                  <span class="info-tip" data-tip="Arrêt de sécurité par jour, par trade ou total.">?</span>
                </div>
                <span id="badgeDayLossLevel" class="level-badge balanced">Équilibré</span>
              </div>
              <div class="form-grid" style="gap:6px;margin-bottom:6px">
                <div>
                  <label class="field-lbl">Perte max / jour</label>
                  <div style="display:flex;gap:4px">
                    <select id="cfgDayLossMode" class="input-dark" style="padding:4px 6px" onchange="toggleDayLossInputs()">
                      <option value="pct">%</option>
                      <option value="amount">€</option>
                      <option value="pips">Pips</option>
                    </select>
                    <input id="cfgDayLossPct" type="number" step="0.5" min="0.5" max="50" class="input-dark mono" style="width:100%" oninput="updateLiveRiskCalculator()" />
                    <input id="cfgDayLossVal" type="number" step="50" min="10" max="500000" value="500" class="input-dark mono" style="width:100%;display:none" oninput="updateLiveRiskCalculator()" />
                  </div>
                </div>
                <div>
                  <label class="field-lbl">Max / trade (0=off)</label>
                  <div style="display:flex;gap:4px">
                    <select id="cfgMaxTradeLossMode" class="input-dark" style="padding:4px 6px" onchange="updateLiveRiskCalculator()">
                      <option value="amount">€</option>
                      <option value="pct">%</option>
                      <option value="pips">Pips</option>
                    </select>
                    <input id="cfgMaxTradeLossVal" type="number" step="10" min="0" max="500000" value="0" class="input-dark mono" style="width:100%" oninput="updateLiveRiskCalculator()" />
                  </div>
                </div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:4px">
                  <span style="font-size:10px;color:var(--fg-2)">Tot :</span>
                  <select id="cfgTotalLossMode" class="input-dark" style="padding:4px 6px" onchange="updateLiveRiskCalculator()">
                    <option value="pct">%</option>
                    <option value="amount">€</option>
                  </select>
                  <input id="cfgTotalLossVal" type="number" step="1" min="0" max="500000" value="0" class="input-dark mono" style="width:62px;padding:4px 6px" oninput="updateLiveRiskCalculator()" />
                </div>
                <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer">
                  <input id="cfgAutoStopLossChk" type="checkbox" checked onchange="updateLiveRiskCalculator()" />
                  <span>Arrêt auto</span>
                </label>
              </div>
            </div>

            <!-- 6. CADENCE D'EXÉCUTION (TRADES / MINUTE) -->
            <div class="risk-field-card risk-field-card-compact risk-bento-wide">
              <div class="risk-field-head" style="margin-bottom:4px">
                <div class="risk-field-title" style="font-size:12px">
                  6. Vitesse d'Exécution (Trades / minute)
                  <span class="info-tip" data-tip="Accélère la fréquence des scans et ouvertures automatiques de positions (1/min = toutes les 60s jusqu'à 60/min = toutes les 1s).">?</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span id="cadenceApplyFeedback" style="font-size:11px;font-weight:600;display:none"></span>
                  <span id="cadenceIntervalLabel" class="mono accent" style="font-size:11px;font-weight:700">1 trade / 15s</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <input id="cfgTradesPerMinSlider" type="range" min="1" max="60" value="4" class="lev-slider" oninput="syncCadenceFromSlider(this.value)" />
                <input id="cfgTradesPerMin" type="number" min="1" max="60" value="4" class="input-dark mono" style="width:68px;text-align:center;font-weight:700;padding:5px" oninput="syncCadenceFromNumber(this.value)" onkeydown="if(event.key==='Enter'){applyTradesPerMinDirectly(this.value);}" />
                <span class="mono" style="font-size:11px;font-weight:700">/ min</span>
                <button id="btnApplyCadenceDirect" type="button" class="pill-btn primary" style="padding:5px 11px;font-size:11px;font-weight:700" onclick="applyTradesPerMinDirectly(document.getElementById('cfgTradesPerMin').value)">Accélérer</button>
              </div>
              <div id="cadencePresetsWrap" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">
                <button type="button" class="pill-btn mono cadence-preset-btn" data-tpm="2" onclick="applyTradesPerMinDirectly(2)">2/min (30s)</button>
                <button type="button" class="pill-btn mono cadence-preset-btn" data-tpm="4" onclick="applyTradesPerMinDirectly(4)">4/min (Standard · 15s)</button>
                <button type="button" class="pill-btn mono cadence-preset-btn" data-tpm="12" onclick="applyTradesPerMinDirectly(12)">12/min (Rapide · 5s)</button>
                <button type="button" class="pill-btn mono cadence-preset-btn" data-tpm="30" onclick="applyTradesPerMinDirectly(30)">30/min (Turbo · 2s)</button>
                <button type="button" class="pill-btn mono cadence-preset-btn" data-tpm="60" style="border-color:var(--up-ring);color:var(--up)" onclick="applyTradesPerMinDirectly(60)">60/min (Max · 1s)</button>
              </div>
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
                <div>
                  <label class="field-lbl" style="display:block;margin-bottom:4px">Focus Paire Unique (HFT Mono-Paire)</label>
                  <select id="cfgFocusSymbol" class="input-dark mono" style="width:100%;padding:5px 8px;font-size:11.5px" onchange="markStrategyFormDirty()">
                    <option value="">Multi-Actifs (Analyse générale)</option>
                  </select>
                </div>
                <button type="button" id="btnFocusHftStart" class="pill-btn primary" style="margin-top:16px;padding:6px 12px;font-size:11px;font-weight:700" onclick="applyFocusHftDirectly()">Activer Focus HFT</button>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:6px">
                <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer">
                  <input id="cfgStrictQuotaChk" type="checkbox" onchange="markStrategyFormDirty()" />
                  <span>Quota strict / min + Sorties 100% temps réel par les agents (sécurisation max bénéfice)</span>
                </label>
                <span id="quotaLiveMeter" class="mono" style="font-size:10.5px;color:var(--fg-2)">Quota 60s : 0 / 4</span>
              </div>
            </div>
          </div>

          <!-- 6. SIMULATEUR & SAUVEGARDE DIRECTEMENT ACCESSIBLES -->
          <div id="liveRiskSummaryBox" class="live-calc-box" style="margin-top:8px;padding:9px 11px;font-size:11.5px">
            Calcul en direct...
          </div>
          <div id="riskValidationAlert" class="validation-err-box"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <button id="btnSaveRisk" class="pill-btn primary" style="flex:1;justify-content:center" onclick="validateAndSaveRiskSettings()">Sauvegarder les réglages</button>
            <button class="pill-btn" onclick="resetRiskToRecommended()">Réinitialiser</button>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE BENTO : STUDIO D'APPRENTISSAGE IA + MÉTRIQUES + RAPPORTS -->
      <div class="strat-col-stack">
        <div class="glass-card strat-widget" data-widget-id="w-grpo" draggable="false" style="padding:14px">
          <div class="card-hdr" style="margin-bottom:8px">
            <span class="card-title">Studio d'Apprentissage Pas-à-Pas</span>
            <div class="widget-reorder-bar">
              <button class="pill-btn" onclick="moveWidget(&quot;w-grpo&quot;, -1)">↑</button>
              <button class="pill-btn" onclick="moveWidget(&quot;w-grpo&quot;, 1)">↓</button>
            </div>
          </div>
          <div class="form-grid" style="gap:8px;margin-bottom:8px">
            <div>
              <label class="field-lbl">Paire d'entraînement</label>
              <select id="grpoSymbolSelect" class="input-dark mono" style="width:100%"></select>
            </div>
            <div>
              <label class="field-lbl">Horizon / Style</label>
              <select id="trainStyleSelect" class="input-dark" style="width:100%">
                <option value="scalping">Scalping (15m)</option>
                <option value="daytrade">Day Trading (1h)</option>
                <option value="longtrade">Long / Swing (4h)</option>
              </select>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <button class="pill-btn" onclick="setDatePresetDays(7)">7 J</button>
            <button class="pill-btn" onclick="setDatePresetDays(30)">30 J</button>
            <button class="pill-btn" onclick="setDatePresetDays(90)">90 J</button>
            <button class="pill-btn" onclick="setDatePresetDays(180)">180 J</button>
            <input id="grpoStartDate" class="input-dark mono" style="width:96px;padding:4px 6px" placeholder="01/01/2026" />
            <span style="color:var(--fg-3)">→</span>
            <input id="grpoEndDate" class="input-dark mono" style="width:96px;padding:4px 6px" placeholder="16/11/2026" />
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">
            <button id="btnLaunchGrpo" class="pill-btn primary" onclick="launchGrpoTraining()">Lancer l'Entraînement IA (WFO + GRPO)</button>
            <button class="pill-btn" onclick="hotReloadGrpo()">Recharger IA</button>
            <button class="pill-btn" onclick="runLegacyWfoTrain()">Audit Multi-Paires</button>
          </div>
          <div class="progress-track" style="margin:6px 0"><div class="progress-fill" id="grpoProgressBar"></div></div>
          <div class="mono" style="font-size:11px;color:var(--fg-2)" id="grpoLiveStatus">Prêt pour un nouvel épisode d'entraînement.</div>
        </div>

        <div class="glass-card strat-widget" data-widget-id="w-rl-metrics" draggable="false" style="padding:14px">
          <div class="card-hdr" style="margin-bottom:6px">
            <span class="card-title">Performance &amp; Confiance de l'IA</span>
            <div class="widget-reorder-bar">
              <button class="pill-btn" onclick="moveWidget(&quot;w-rl-metrics&quot;, -1)">↑</button>
              <button class="pill-btn" onclick="moveWidget(&quot;w-rl-metrics&quot;, 1)">↓</button>
            </div>
          </div>
          <div id="rlMetricsHost">Chargement des métriques IA...</div>
        </div>

        <div class="glass-card strat-widget" data-widget-id="w-reports" draggable="false" style="padding:14px">
          <div class="card-hdr" style="margin-bottom:6px">
            <span class="card-title">Rapports d'Optimisation &amp; Reviewer</span>
            <div class="widget-reorder-bar">
              <button class="pill-btn" onclick="moveWidget(&quot;w-reports&quot;, -1)">↑</button>
              <button class="pill-btn" onclick="moveWidget(&quot;w-reports&quot;, 1)">↓</button>
            </div>
          </div>
          <div id="trainingReportHost" style="font-size:11.5px;color:var(--fg-1);max-height:175px;overflow-y:auto"></div>
        </div>

        <div class="glass-card strat-widget" data-widget-id="w-agent-prompts" draggable="false" style="padding:14px">
          <div class="card-hdr" style="margin-bottom:6px">
            <span class="card-title">Consignes des 8 Agents (Prompts Live v2)</span>
            <div style="display:flex;align-items:center;gap:6px">
              <select id="agentPromptSelect" class="input-dark" style="padding:4px 8px;font-size:11px" onchange="renderAgentPromptsEditor()">
                <option value="lead">01 · Chef de Salle</option>
                <option value="analyst">02 · Analyste</option>
                <option value="strategist">03 · Stratège</option>
                <option value="risk">04 · Directeur Risques</option>
                <option value="execution">05 · Exécution</option>
                <option value="reviewer">06 · Reviewer</option>
                <option value="sentinel">07 · Sentinel SRE</option>
                <option value="hunter">08 · Liquidity Hunter</option>
              </select>
              <button type="button" class="pill-btn primary" style="padding:4px 10px;font-size:11px" onclick="saveSelectedAgentPrompt()">Sauver</button>
            </div>
          </div>
          <div id="agentPromptRoleMeta" class="mono" style="font-size:10.5px;color:var(--fg-2);margin-bottom:5px">--</div>
          <textarea id="agentPromptTextarea" class="input-dark mono" rows="4" style="width:100%;font-size:11px;line-height:1.4;resize:vertical" oninput="isAgentPromptDirty=true"></textarea>
        </div>
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

  <!-- ==================== GLOBAL THEME SETTINGS DRAWER (28 THÈMES & STUDIO) ==================== -->
  <aside id="themeDrawer" class="drawer">
    <div class="card-hdr">
      <span class="card-title">Thèmes &amp; Personnalisation (28 Palettes AA)</span>
      <button class="pill-btn" onclick="closeDrawer(&quot;themeDrawer&quot;)">X</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;font-size:12px">
      <div>
        <label class="field-lbl">Sélection Instantanée (Sombres, Quant, Clairs, Terminal, Luxe, Néon)</label>
        <div id="themePresetsGrid" class="theme-grid"></div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div>
          <label class="field-lbl">Accent</label>
          <input id="prefAccent" type="color" value="#38bdf8" style="width:100%;height:34px;background:transparent;border:none;cursor:pointer" onchange="updateThemeColor(&quot;accent&quot;, this.value)" />
        </div>
        <div>
          <label class="field-lbl">Profit (UP)</label>
          <input id="prefUp" type="color" value="#10b981" style="width:100%;height:34px;background:transparent;border:none;cursor:pointer" onchange="updateThemeColor(&quot;up&quot;, this.value)" />
        </div>
        <div>
          <label class="field-lbl">Perte (DOWN)</label>
          <input id="prefDown" type="color" value="#f43f5e" style="width:100%;height:34px;background:transparent;border:none;cursor:pointer" onchange="updateThemeColor(&quot;down&quot;, this.value)" />
        </div>
      </div>

      <div class="form-grid">
        <div>
          <label class="field-lbl">Transparence Verre (<span id="glassValLbl">80</span>%)</label>
          <input id="prefGlassAlpha" type="range" min="35" max="98" value="80" style="width:100%" oninput="updateThemePref(&quot;alpha&quot;, Number(this.value))" />
        </div>
        <div>
          <label class="field-lbl">Flou Glass (<span id="blurValLbl">24</span>px)</label>
          <input id="prefGlassBlur" type="range" min="0" max="36" value="24" style="width:100%" oninput="updateThemePref(&quot;blur&quot;, Number(this.value))" />
        </div>
      </div>

      <div class="form-grid">
        <div>
          <label class="field-lbl">Arrondi Cartes (<span id="radiusValLbl">16</span>px)</label>
          <input id="prefBorderRadius" type="range" min="2" max="24" value="16" style="width:100%" oninput="updateThemePref(&quot;radius&quot;, Number(this.value))" />
        </div>
        <div>
          <label class="field-lbl">Lueur Néon (<span id="glowValLbl">0</span>%)</label>
          <input id="prefGlow" type="range" min="0" max="100" value="0" style="width:100%" oninput="updateThemePref(&quot;glow&quot;, Number(this.value))" />
        </div>
      </div>

      <div class="form-grid">
        <div>
          <label class="field-lbl">Typographie Interface</label>
          <select id="prefFontFamily" class="input-dark" onchange="updateThemePref(&quot;fontMode&quot;, this.value)">
            <option value="inter">Inter Studio (Défaut)</option>
            <option value="mono">Terminal Quant Mono</option>
            <option value="system">Système Ultra-Nette</option>
          </select>
        </div>
        <div>
          <label class="field-lbl">Densité d'affichage</label>
          <select id="prefDensity" class="input-dark" onchange="updateThemePref(&quot;density&quot;, this.value)">
            <option value="normal">Confortable (18px)</option>
            <option value="compact">Compact Desk (11px)</option>
            <option value="spacious">Aérée (24px)</option>
          </select>
        </div>
      </div>

      <button type="button" class="pill-btn" style="justify-content:center" onclick="resetThemeStudioPrefs()">Réinitialiser la personnalisation</button>

      <div style="border-top:1px solid var(--ring-1);padding-top:12px;display:flex;flex-direction:column;gap:8px">
        <label class="field-lbl">Passerelle LLM Agents</label>
        <div style="display:flex;gap:6px">
          <select id="llmProviderSelect" class="input-dark" style="flex:1" onchange="onLlmProviderChanged()">
            <option value="auto">Auto (Meilleur dispo)</option>
            <option value="freellm" selected>FreeLLM (127.0.0.1:31415)</option>
            <option value="gemini">Google Gemini 2.5 Flash</option>
            <option value="groq">Groq Cloud (Llama 3.3)</option>
            <option value="deepseek">DeepSeek V3</option>
            <option value="openrouter">OpenRouter Free</option>
            <option value="openai">OpenAI (GPT-4o-mini)</option>
            <option value="ollama">Ollama Local (11434)</option>
          </select>
          <select id="llmModelSelect" class="input-dark" style="width:110px">
            <option value="auto:fast">auto:fast</option>
            <option value="auto">auto</option>
          </select>
        </div>
        <div style="display:flex;gap:6px">
          <input id="llmKeyInput" type="password" class="input-dark" style="flex:1" placeholder="Clé FreeLLM / Provider API key..." />
          <button class="pill-btn primary" onclick="saveLlmApiKey()">Activer</button>
        </div>
        <div id="llmStatusBadge" style="font-size:10px;color:var(--text-subtle)">URL : http://127.0.0.1:31415/v1 · Routes : auto / auto:fast</div>
      </div>
    </div>
  </aside>

  <!-- ==================== NOTION TICKET INSPECTOR DRAWER ==================== -->
  <aside id="journalDrawer" class="drawer">
    <div class="card-hdr">
      <span class="card-title" id="jDrawerTitle">Fiche Ticket</span>
      <button class="pill-btn" onclick="closeDrawer(&quot;journalDrawer&quot;)">X</button>
    </div>
    <div id="jDrawerBody" style="display:flex;flex-direction:column;gap:10px;font-size:12px"></div>
  </aside>

  <!-- ==================== MOBILE MT5 CLOUD & TELEGRAM DRAWER ==================== -->
  <aside id="mobileDrawer" class="drawer" style="width:450px">
    <div class="card-hdr">
      <span class="card-title">Connexion Mobile MT5 &amp; Bots Telegram</span>
      <button class="pill-btn" onclick="closeDrawer(&quot;mobileDrawer&quot;)">X</button>
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
              <button class="pill-btn primary" style="width:100%;justify-content:center" onclick="detectTelegramChatId()"> Détecter Chat ID</button>
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

          <button class="pill-btn primary" onclick="saveAndTestTelegram()"> Sauvegarder &amp; Envoyer Test sur Téléphone</button>
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
            <a href="/api/mt5-bridge/ea.mq5" download="TradingFloorBridge.mq5" class="pill-btn primary" style="text-decoration:none"> Télécharger TradingFloorBridge.mq5</a>
          </div>
        </div>
        <button id="btnMt5SyncNow" class="pill-btn auto-on" style="width:100%;justify-content:center;margin-bottom:8px" onclick="syncMt5Now()"> Synchroniser Capital &amp; Trades MT5</button>
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
              <button class="pill-btn primary" onclick="saveAndTestMt5()"> Connecter MT5 Cloud</button>
              <button class="pill-btn" onclick="sendTestMt5Trade()"> Trade Test Cloud</button>
            </div>
            <div id="mt5StatusMsg" class="mono" style="font-size:11px;color:var(--fg-2)">Statut : Pont local prêt (/api/mt5-bridge/poll)</div>
          </div>
        </details>
      </div>
    </div>
  </aside>

  <script>
    var ASSET_CATALOG = [
      {
        id: 'crypto_majors',
        cat: 'Crypto Majors & L1 / L2',
        tag: 'CRYPTO',
        items: [
          { s: 'BTCUSDT', l: 'Bitcoin (BTC)' },
          { s: 'ETHUSDT', l: 'Ethereum (ETH)' },
          { s: 'SOLUSDT', l: 'Solana (SOL)' },
          { s: 'BNBUSDT', l: 'BNB (BNB)' },
          { s: 'XRPUSDT', l: 'XRP (XRP)' },
          { s: 'AVAXUSDT', l: 'Avalanche (AVAX)' },
          { s: 'SUIUSDT', l: 'Sui (SUI)' },
          { s: 'NEARUSDT', l: 'NEAR Protocol' },
          { s: 'LINKUSDT', l: 'Chainlink (LINK)' },
          { s: 'ADAUSDT', l: 'Cardano (ADA)' }
        ]
      },
      {
        id: 'memecoins',
        cat: 'Memecoins & Hype Trading Desk',
        tag: 'MEME',
        items: [
          { s: 'DOGEUSDT', l: 'Dogecoin (DOGE)' },
          { s: '1000PEPEUSDT', l: 'Pepe (1000PEPE)' },
          { s: '1000SHIBUSDT', l: 'Shiba Inu (1000SHIB)' },
          { s: '1000BONKUSDT', l: 'Bonk (1000BONK)' },
          { s: '1000FLOKIUSDT', l: 'Floki (1000FLOKI)' },
          { s: 'WIFUSDT', l: 'dogwifhat (WIF)' },
          { s: 'POPCATUSDT', l: 'Popcat (POPCAT)' },
          { s: 'BOMEUSDT', l: 'Book of Meme (BOME)' },
          { s: 'MEWUSDT', l: 'Cat in Dogs World (MEW)' },
          { s: 'BRETTUSDT', l: 'Brett (BRETT)' },
          { s: 'NEIROUSDT', l: 'First Neiro (NEIRO)' },
          { s: 'FARTCOINUSDT', l: 'Fartcoin (FARTCOIN)' },
          { s: 'TRUMPUSDT', l: 'Official Trump (TRUMP)' }
        ]
      },
      {
        id: 'futures_indices',
        cat: 'Futures & Indices Mondiaux',
        tag: 'FUTURES',
        items: [
          { s: 'NQ1!', l: 'Nasdaq 100 (NQ1!)' },
          { s: 'ES1!', l: 'S&P 500 (ES1!)' },
          { s: 'YM1!', l: 'Dow Jones (YM1!)' },
          { s: 'FDAX1!', l: 'DAX 40 (FDAX1!)' }
        ]
      },
      {
        id: 'forex',
        cat: 'Forex (Devises Majeures)',
        tag: 'FOREX',
        items: [
          { s: 'EURUSD', l: 'EUR/USD' },
          { s: 'GBPUSD', l: 'GBP/USD' },
          { s: 'USDJPY', l: 'USD/JPY' },
          { s: 'USDCHF', l: 'USD/CHF' },
          { s: 'AUDUSD', l: 'AUD/USD' },
          { s: 'USDCAD', l: 'USD/CAD' },
          { s: 'NZDUSD', l: 'NZD/USD' }
        ]
      },
      {
        id: 'commodities',
        cat: 'Matieres Premieres (Commodities)',
        tag: 'RAW',
        items: [
          { s: 'XAUUSD', l: 'Or (XAU/USD)' },
          { s: 'XAGUSD', l: 'Argent (XAG/USD)' },
          { s: 'USOIL', l: 'Petrole WTI (USOIL)' },
          { s: 'NGAS', l: 'Gaz Naturel (NGAS)' }
        ]
      },
      {
        id: 'us_stocks',
        cat: 'Actions US & Tech Leaders',
        tag: 'EQUITY',
        items: [
          { s: 'NVDA', l: 'NVIDIA (NVDA)' },
          { s: 'AAPL', l: 'Apple (AAPL)' },
          { s: 'TSLA', l: 'Tesla (TSLA)' },
          { s: 'MSFT', l: 'Microsoft (MSFT)' },
          { s: 'AMZN', l: 'Amazon (AMZN)' }
        ]
      }
    ];

    var AGENTS = [
      { id: 'lead', name: 'Chef de Salle', short: 'CL', color: '#38bdf8', role: '01 · Orchestration 8 Agents' },
      { id: 'analyst', name: 'Analyste', short: 'AN', color: '#2dd4bf', role: '02 · Multi-Sources & Market Profile' },
      { id: 'strategist', name: 'Stratège', short: 'ST', color: '#a78bfa', role: '03 · Market Profile, WFO & GRPO' },
      { id: 'risk', name: 'Risques', short: 'RM', color: '#f472b6', role: '04 · Kelly, LiqGuard & Frais' },
      { id: 'execution', name: 'Exécution', short: 'EX', color: '#fbbf24', role: '05 · Hard SL/TP & Break-Even MT5' },
      { id: 'reviewer', name: 'Reviewer', short: 'RV', color: '#34d399', role: '06 · Post-Mortem 15m & Blotter' },
      { id: 'sentinel', name: 'The Sentinel', short: 'SN', color: '#14b8a6', role: '07 · SRE Latence & HALT Sécurisé' },
      { id: 'hunter', name: 'Liquidity Hunter', short: 'LH', color: '#f97316', role: '08 · L2 Réel, Spoofing & Aimants' }
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
      'alabaster-pro':{ theme: 'alabaster-pro',  label: 'Alabaster Studio',  cat: 'Clair AA', isLight: true,  bg0: '#eef2f6', bg1: '#f8fafc', bg2: '#e2e8f0', bg3: '#cbd5e1', fg0: '#090d16', fg1: '#1e293b', fg2: '#475569', fg3: '#5b6b80', accent: '#4f46e5', up: '#059669', down: '#e11d48', amber: '#b45309', glassRgb: '248, 250, 252',elevRgb: '255, 255, 255',inRgb: '236, 241, 247',grad: 'radial-gradient(circle at 75% 0%, #dbeafe 0%, #eef2f6 60%, #e2e8f0 100%)', alpha: 88 },
      'crimson-stealth':{ theme: 'crimson-stealth', label: 'Stealth Crimson', cat: 'Quant', isLight: false, bg0: '#0a0406', bg1: '#14080c', bg2: '#210d14', bg3: '#31131e', fg0: '#fff1f2', fg1: '#ffe4e6', fg2: '#fca5a5', fg3: '#b97b82', accent: '#f43f5e', up: '#34d399', down: '#fb7185', amber: '#fbbf24', glassRgb: '20, 8, 12', elevRgb: '28, 11, 17', inRgb: '10, 4, 6', grad: 'radial-gradient(circle at 25% 0%, #3b0d1b 0%, #0d0407 58%, #050203 100%)', alpha: 84 },
      'dracula-quant':  { theme: 'dracula-quant',   label: 'Dracula Violet',  cat: 'Quant', isLight: false, bg0: '#13111c', bg1: '#1c192b', bg2: '#27233b', bg3: '#342f4f', fg0: '#f8f8f2', fg1: '#e2e0f5', fg2: '#bd93f9', fg3: '#8c83b3', accent: '#ff79c6', up: '#50fa7b', down: '#ff5555', amber: '#f1fa8c', glassRgb: '28, 25, 43', elevRgb: '36, 32, 56', inRgb: '19, 17, 28', grad: 'radial-gradient(circle at 70% 10%, #3b2663 0%, #191626 55%, #0d0b14 100%)', alpha: 82 },
      'tokyo-sakura':   { theme: 'tokyo-sakura',    label: 'Tokyo Sakura',    cat: 'Néon',  isLight: false, bg0: '#0c0814', bg1: '#160f24', bg2: '#231838', bg3: '#332252', fg0: '#fdf4ff', fg1: '#fae8ff', fg2: '#d8b4fe', fg3: '#9e7bb8', accent: '#f472b6', up: '#2dd4bf', down: '#fb7185', amber: '#fde047', glassRgb: '22, 15, 36', elevRgb: '31, 21, 50', inRgb: '12, 8, 20', grad: 'radial-gradient(circle at 80% 0%, #581c59 0%, #140d21 55%, #08050f 100%)', alpha: 80 },
      'emerald-obsidian':{ theme: 'emerald-obsidian', label: 'Quant Emerald Pro', cat: 'Terminal', isLight: false, bg0: '#020908', bg1: '#051412', bg2: '#09211d', bg3: '#0f302b', fg0: '#f0fdf9', fg1: '#ccfbf1', fg2: '#7dd3c8', fg3: '#4f9c92', accent: '#10b981', up: '#34d399', down: '#f43f5e', amber: '#f59e0b', glassRgb: '5, 20, 18', elevRgb: '8, 30, 27', inRgb: '2, 9, 8', grad: 'radial-gradient(circle at 15% 0%, #093b32 0%, #041210 55%, #010605 100%)', alpha: 84 },
      'titanium-slate': { theme: 'titanium-slate',  label: 'Citadel Slate',   cat: 'Sombre', isLight: false, bg0: '#0b0e14', bg1: '#121722', bg2: '#1b2232', bg3: '#263045', fg0: '#f8fafc', fg1: '#e2e8f0', fg2: '#94a3b8', fg3: '#64748b', accent: '#818cf8', up: '#22c55e', down: '#ef4444', amber: '#eab308', glassRgb: '18, 23, 34', elevRgb: '25, 32, 48', inRgb: '11, 14, 20', grad: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0e131d 55%, #070a0f 100%)', alpha: 85 },
      'copper-luxury':  { theme: 'copper-luxury',   label: 'Mayfair Copper',  cat: 'Luxe',   isLight: false, bg0: '#0a0706', bg1: '#150f0c', bg2: '#221712', bg3: '#32221b', fg0: '#fff7ed', fg1: '#fed7aa', fg2: '#cfa082', fg3: '#966d54', accent: '#fb923c', up: '#4ade80', down: '#f43f5e', amber: '#fbbf24', glassRgb: '21, 15, 12', elevRgb: '30, 21, 17', inRgb: '10, 7, 6', grad: 'radial-gradient(circle at 35% 0%, #432211 0%, #120c09 55%, #070403 100%)', alpha: 84 },
      'arctic-mint':    { theme: 'arctic-mint',     label: 'Arctic Daylight', cat: 'Clair AA', isLight: true, bg0: '#eff7f6', bg1: '#ffffff', bg2: '#e1efed', bg3: '#cde2df', fg0: '#0b1d1c', fg1: '#13302e', fg2: '#3d5e5b', fg3: '#5a7d7a', accent: '#0d9488', up: '#059669', down: '#e11d48', amber: '#d97706', glassRgb: '255, 255, 255', elevRgb: '255, 255, 255', inRgb: '239, 247, 246', grad: 'radial-gradient(circle at 20% 0%, #ccfbf1 0%, #eff7f6 65%, #e2efed 100%)', alpha: 88 },
      'solarized-cream':{ theme: 'solarized-cream', label: 'Solarized Cream', cat: 'Clair AA', isLight: true, bg0: '#fdf6e3', bg1: '#fffdf7', bg2: '#eee8d5', bg3: '#dfd8c3', fg0: '#073642', fg1: '#1c4652', fg2: '#586e75', fg3: '#74888e', accent: '#268bd2', up: '#2aa198', down: '#dc322f', amber: '#b58900', glassRgb: '255, 253, 247', elevRgb: '255, 253, 247', inRgb: '238, 232, 213', grad: 'radial-gradient(circle at 60% 0%, #f5ebd1 0%, #fdf6e3 65%, #eee8d5 100%)', alpha: 90 }
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
    var lwEma20Series = null;
    var lwEma50Series = null;
    var lwVwapSeries = null;
    var lwPriceLines = [];
    var lwMpLines = [];
    var lwResizeObs = null;
    var chartShowEma = true;
    var chartShowVwap = true;
    var chartShowMp = true;
    var chartLastRsi14 = 50;
    var chartLastAtr14 = 0;
    var chartEma20Cache = [];
    var chartEma50Cache = [];
    var chartVwapCache = [];

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

    function escHtml(s) {
      return String(s === null || s === undefined ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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
      var blurPx = t.blur !== undefined ? Number(t.blur) : 24;
      r.setProperty('--glass-blur', blurPx + 'px');
      var radPx = t.radius !== undefined ? Number(t.radius) : 16;
      r.setProperty('--r-lg', radPx + 'px');
      r.setProperty('--r-md', Math.max(2, radPx - 4) + 'px');
      var glowPct = Number(t.glow || 0);
      r.setProperty('--accent-glow', glowPct > 0 ? ('0 0 ' + Math.round(glowPct * 0.28) + 'px ' + hexToRgba(t.accent, (glowPct / 100) * 0.35)) : '0 0 0 transparent');
      var fontMode = t.fontMode || 'inter';
      r.setProperty('--font',
        fontMode === 'mono'
          ? 'ui-monospace, "Cascadia Code", "Fira Code", Consolas, monospace'
          : fontMode === 'system'
            ? 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
            : '"Inter Variable", "Inter Fallback", system-ui, -apple-system, "Segoe UI", sans-serif'
      );
      var dens = t.density || 'normal';
      r.setProperty('--card-pad', dens === 'compact' ? '11px' : dens === 'spacious' ? '24px' : '18px');

      var lbl = document.getElementById('glassValLbl');
      if (lbl) lbl.textContent = String(t.alpha || 80);
      var sl = document.getElementById('prefGlassAlpha');
      if (sl) sl.value = String(t.alpha || 80);
      var bLbl = document.getElementById('blurValLbl');
      if (bLbl) bLbl.textContent = String(blurPx);
      var bSl = document.getElementById('prefGlassBlur');
      if (bSl) bSl.value = String(blurPx);
      var rLbl = document.getElementById('radiusValLbl');
      if (rLbl) rLbl.textContent = String(radPx);
      var rSl = document.getElementById('prefBorderRadius');
      if (rSl) rSl.value = String(radPx);
      var gLbl = document.getElementById('glowValLbl');
      if (gLbl) gLbl.textContent = String(glowPct);
      var gSl = document.getElementById('prefGlow');
      if (gSl) gSl.value = String(glowPct);
      var ac = document.getElementById('prefAccent');
      if (ac && t.accent) ac.value = t.accent;
      var upEl = document.getElementById('prefUp');
      if (upEl && t.up) upEl.value = t.up;
      var dnEl = document.getElementById('prefDown');
      if (dnEl && t.down) dnEl.value = t.down;
      var fSel = document.getElementById('prefFontFamily');
      if (fSel) fSel.value = fontMode;
      var dSel = document.getElementById('prefDensity');
      if (dSel) dSel.value = dens;
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
      updateThemePref('alpha', Number(val));
    }

    function updateThemePref(key, val) {
      var cur = getCurrentThemePrefs();
      cur[key] = val;
      applyThemeValues(cur, true);
    }

    function resetThemeStudioPrefs() {
      applyThemePreset('obsidian');
    }

    // ==================== NAVIGATION, HUD CLEARANCE & RACCOURCIS ====================
    function syncHudClearance() {
      var bar = document.getElementById('topHudBar');
      if (!bar) return;
      var rect = bar.getBoundingClientRect();
      var clearance = Math.max(74, Math.ceil(rect.bottom + 10));
      document.documentElement.style.setProperty('--top-clearance', clearance + 'px');
    }

    function setupStealthAndShortcuts() {
      syncHudClearance();
      window.addEventListener('resize', syncHudClearance);
      if (typeof ResizeObserver !== 'undefined') {
        var barEl = document.getElementById('topHudBar');
        if (barEl) {
          new ResizeObserver(function () { syncHudClearance(); }).observe(barEl);
        }
      }

      window.addEventListener('pointermove', function (e) {
        var w = window.innerWidth || 1;
        var h = window.innerHeight || 1;
        targetParallaxX = ((e.clientX / w) - 0.5) * 2;
        targetParallaxY = ((e.clientY / h) - 0.5) * 2;
      });

      window.addEventListener('keydown', function (e) {
        var tag = document.activeElement ? document.activeElement.tagName : '';
        if (e.key === 'Escape') {
          closeDrawer('themeDrawer');
          closeDrawer('journalDrawer');
          closeDrawer('mobileDrawer');
          closePanicModal();
          closeDangerRiskModal();
          closeNavLevDropdown();
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
        var tabs = { '1': 'desk', '2': 'chat', '3': 'charts', '4': 'journal', '5': 'strategy', '6': 'reviewer' };
        if (tabs[e.key]) { switchTab(tabs[e.key]); return; }
        if (e.key.toLowerCase() === 't') {
          var td = document.getElementById('themeDrawer');
          if (td && td.classList.contains('open')) closeDrawer('themeDrawer'); else openDrawer('themeDrawer');
        }
      });

      document.addEventListener('click', function (e) {
        var levDd = document.getElementById('navLevDropdown');
        var levBtn = document.getElementById('navLevBadge');
        if (levDd && levDd.style.display === 'block') {
          if (!levDd.contains(e.target) && !levBtn.contains(e.target)) {
            levDd.style.display = 'none';
          }
        }
        var am = document.getElementById('assetDropdownMenu');
        var ab = document.getElementById('btnAssetsToggle');
        if (am && am.style.display === 'block') {
          if (!am.contains(e.target) && !ab.contains(e.target)) {
            am.style.display = 'none';
          }
        }
      });
    }

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.dock-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-tab') === tab);
      });
      document.querySelectorAll('.view-panel').forEach(function (v) {
        v.classList.toggle('active', v.id === 'view-' + tab);
      });
      syncHudClearance();
      if (tab === 'desk') {
        resize3dCanvas();
      }
      if (tab === 'chat') {
        setTimeout(function () { scrollChatToBottom(true); }, 30);
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
      if (tab === 'reviewer') {
        renderReviewerTab();
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
    var AGENT_PERSONAS = {
      analyst: {
        nick: 'Léo',
        hobby: 'Astronome amateur & buveur de matcha',
        lines: [
          'Mon matcha est encore chaud ?',
          'Les constellations brillent ce soir.',
          'Lecture sci-fi après la séance !',
          'Regarde la symétrie de ce ciel.',
          'Qui a vu mes lunettes holo ?'
        ]
      },
      strategist: {
        nick: 'Marc',
        hobby: 'Joueur d échecs & collectionneur de jazz',
        lines: [
          'Une partie d échecs après la clôture ?',
          'Ce vinyle de Miles Davis est magique.',
          'Cavalier en F6... joli coup !',
          'Toujours trois coups d avance, même au calme.',
          'Pause musique dans le salon !'
        ]
      },
      lead: {
        nick: 'Aria',
        hobby: 'Barista zen & mentor d équipe',
        lines: [
          'Un espresso fraîchement moulu ?',
          'Belle cohésion dans le studio ce soir !',
          'Prenez le temps de respirer la team.',
          'Minou veille sur nous tous.',
          'Pause thé ou café pour qui veut ?'
        ]
      },
      execution: {
        nick: 'Kira',
        hobby: 'Sprinter hover-skate & fan de ramen',
        lines: [
          'Turbo ramen épicés ce soir !',
          'Je bats mon record de tour de salle !',
          'Vitesse lumière sur la piste !',
          'Ma playlist synthwave donne des ailes.',
          'Attention, j arrive à toute allure !'
        ]
      },
      risk: {
        nick: 'Titan',
        hobby: 'Cuisinier stoïque & protecteur de Minou',
        lines: [
          'Marche doucement près du chat noir !',
          'Un bon mijoté nous attend ce soir.',
          'Bouclier levé, zéro stress par ici.',
          'La patience est la meilleure armure.',
          'Tout le monde est en sécurité ?'
        ]
      },
      reviewer: {
        nick: 'Sora',
        hobby: 'Photographe argentique & archiviste',
        lines: [
          'Clic ! Superbe photo de groupe !',
          'Ce studio ferait une belle toile.',
          'J annote nos plus beaux souvenirs.',
          'La lumière bleue rend Minou photogénique !',
          'Cinéma vintage ce week-end ?'
        ]
      },
      hunter: {
        nick: 'Vex',
        hobby: 'DJ lo-fi & chasseur de curiosités',
        lines: [
          'Nouveau beat lo-fi dans le casque !',
          'Viens attraper le pointeur laser, Minou !',
          'Le groove du soir est parfait.',
          'J ai repéré un vinyle ultra rare.',
          'Mix nocturne en préparation !'
        ]
      },
      sentinel: {
        nick: 'Nova',
        hobby: 'Droïde jardinier de bonsaïs',
        lines: [
          'Mon bonsaï a une nouvelle pousse !',
          'Ambiance du studio : 100 % zen.',
          'J arrose mes petites plantes holo.',
          'Biorythme de l équipe au top.',
          'Bip-boop : temps idéal pour souffler.'
        ]
      }
    };

    var STUDIO_DIALOGUES = [
      { a: 'lead', tA: 'Pause café ou matcha la team ?', b: 'analyst', tB: 'Matcha pour moi Aria, merci !' },
      { a: 'hunter', tA: 'Tu veux jouer Minou ?', b: 'cat', tB: 'Miaou ! (*court autour*)' },
      { a: 'execution', tA: 'Kira prête pour le sprint !', b: 'risk', tB: 'Doucement, attention aux câbles !' },
      { a: 'sentinel', tA: 'Mon bonsaï fleurit ce soir !', b: 'reviewer', tB: 'Attends, je le prends en photo !' },
      { a: 'strategist', tA: 'Revanche aux échecs ce soir ?', b: 'lead', tB: 'Avec plaisir, prépare l échiquier !' },
      { a: 'risk', tA: 'Ramen ou plat mijoté ce soir ?', b: 'execution', tB: 'Ramen épicés sans hésiter !' },
      { a: 'reviewer', tA: 'Sourire ! Photo souvenir !', b: 'hunter', tB: 'Attends, je mets mes écouteurs !' },
      { a: 'analyst', tA: 'Minou cherche des câlins...', b: 'cat', tB: 'Ronron... (*frotte la patte*)' }
    ];

    var CAT_THOUGHTS = [
      'Miaou ! (*fait le gros dos*)',
      'Ronron... gratouilles SVP !',
      'Explore le studio librement',
      'Chasse un reflet lumineux',
      'Fait un câlin à la team',
      'Cherche du lait chaud'
    ];

    function makeNameplateTexture(title, statusText, accentHex) {
      var canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 148;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(7, 12, 24, 0.86)';
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(10, 10, 492, 128, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = accentHex;
      ctx.font = "700 32px 'Inter Variable', 'Inter Fallback', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 62);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = "600 24px 'Inter Variable', 'Inter Fallback', sans-serif";
      ctx.fillText(statusText, 256, 108);

      var tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    }

    function makeSpeechBubbleTexture(speakerName, messageText, accentHex) {
      var canvas = document.createElement('canvas');
      canvas.width = 560;
      canvas.height = 176;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 560, 176);

      // Sleek frosted dark bubble + pointer triangle
      ctx.fillStyle = 'rgba(10, 16, 32, 0.96)';
      ctx.strokeStyle = accentHex || '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(14, 10, 532, 134, 28);
      ctx.fill();
      ctx.stroke();

      // Pointer tail
      ctx.beginPath();
      ctx.moveTo(260, 142);
      ctx.lineTo(280, 170);
      ctx.lineTo(300, 142);
      ctx.closePath();
      ctx.fillStyle = 'rgba(10, 16, 32, 0.96)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(259, 143);
      ctx.lineTo(280, 170);
      ctx.lineTo(301, 143);
      ctx.strokeStyle = accentHex || '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = accentHex || '#38bdf8';
      ctx.font = "800 22px 'Inter Variable', 'Inter Fallback', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(speakerName, 36, 44);

      ctx.fillStyle = '#f8fafc';
      ctx.font = "600 24px 'Inter Variable', 'Inter Fallback', sans-serif";
      var words = String(messageText || '').split(' ');
      var line1 = '';
      var line2 = '';
      for (var wi = 0; wi < words.length; wi++) {
        var cand = line1 ? (line1 + ' ' + words[wi]) : words[wi];
        if (ctx.measureText(cand).width <= 488 && !line2) {
          line1 = cand;
        } else {
          line2 = line2 ? (line2 + ' ' + words[wi]) : words[wi];
        }
      }
      ctx.fillText(line1, 36, 86);
      if (line2) ctx.fillText(line2, 36, 120);

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

    var blackCat3d = null;
    var profitBursts3d = [];
    var lastClosedProfitCount = -1;

    function triggerSpeechBubble(rigOrCat, speakerTitle, messageText, accentHex, durationSec) {
      if (!rigOrCat || !rigOrCat.speechSprite || !scene3d) return;
      if (rigOrCat.speechSprite.material.map) {
        try { rigOrCat.speechSprite.material.map.dispose(); } catch (e) {}
      }
      rigOrCat.speechSprite.material.map = makeSpeechBubbleTexture(speakerTitle, messageText, accentHex);
      rigOrCat.speechSprite.material.needsUpdate = true;
      rigOrCat.speechSprite.material.opacity = 1;
      rigOrCat.speechSprite.visible = true;
      rigOrCat.bubbleAge = 0;
      rigOrCat.bubbleDuration = durationSec || 4.8;
    }

    function spawn3dPulse(fromId, toId, colorHex) {
      if (!scene3d) return;
      var fromRig = agentRigs[fromId];
      var toRig = agentRigs[toId];
      if (!fromRig || !toRig) return;
      var p0 = fromRig.worldPos.clone();
      p0.y = 0.25;
      var p2 = toRig.worldPos.clone();
      p2.y = 0.25;
      var mid = p0.clone().add(p2).multiplyScalar(0.5);
      mid.y = 2.4 + Math.random() * 1.2;
      var curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
      var col = new THREE.Color(colorHex || '#38bdf8');
      var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
      var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending }));
      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 10, 10),
        new THREE.MeshBasicMaterial({ color: col })
      );
      scene3d.add(line);
      scene3d.add(dot);
      pulseArcs.push({ line: line, dot: dot, curve: curve, t: 0 });
    }

    function spawnProfitBurst(originVec, amount) {
      if (!scene3d || !originVec) return;
      var count = amount > 50 ? 6 : 3;
      for (var i = 0; i < count; i++) {
        var coin = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.13, 0),
          new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending })
        );
        coin.position.set(
          originVec.x + (Math.random() - 0.5) * 0.9,
          0.5 + Math.random() * 0.6,
          originVec.z + (Math.random() - 0.5) * 0.9
        );
        scene3d.add(coin);
        profitBursts3d.push({
          mesh: coin,
          vy: 0.035 + Math.random() * 0.025,
          vx: (Math.random() - 0.5) * 0.015,
          vz: (Math.random() - 0.5) * 0.015,
          life: 1.0
        });
      }
    }

    function buildDistinctAgentAvatar(ag, col, neonMat) {
      var avatar = new THREE.Group();
      var armL = null;
      var armR = null;
      var legL = null;
      var legR = null;
      var headGroup = null;
      var propGroup = null;

      // Rich realistic human character configs per agent (each with unique skin, hair, outfit, footwear & handheld prop)
      var OUTFITS = {
        analyst: {
          skin: 0xf3cbb0, hair: 0x4a3121, top: 0x1e293b, shirt: 0xe2e8f0, pants: 0xc2b29b, shoes: 0x4b2e1e,
          tie: null, style: 'trench', hairStyle: 'tousled', glasses: true, eyeCol: 0x3b82f6
        },
        strategist: {
          skin: 0xe4b28a, hair: 0x1a1a24, top: 0x27272a, shirt: 0xf8fafc, pants: 0x18181b, shoes: 0x111111,
          tie: 0xdc2626, style: 'suit', hairStyle: 'parted_beard', glasses: false, eyeCol: 0x78350f
        },
        lead: {
          skin: 0xeebfa1, hair: 0x6b3a24, top: 0x0f766e, shirt: 0xfef3c7, pants: 0x1e293b, shoes: 0x2b1d16,
          tie: null, style: 'vest', hairStyle: 'ponytail_beret', glasses: false, eyeCol: 0x059669
        },
        execution: {
          skin: 0xd99b72, hair: 0x0f172a, top: 0x064e3b, shirt: 0x10b981, pants: 0x111827, shoes: 0x10b981,
          tie: null, style: 'bomber', hairStyle: 'sport_ponytail', glasses: false, eyeCol: 0x10b981
        },
        risk: {
          skin: 0x9c6442, hair: 0x121216, top: 0x7f1d1d, shirt: 0x334155, pants: 0x1f2937, shoes: 0x292524,
          tie: null, style: 'utility', hairStyle: 'fade', glasses: false, eyeCol: 0x451a03
        },
        reviewer: {
          skin: 0xf6d5be, hair: 0x334155, top: 0xb45309, shirt: 0xf1f5f9, pants: 0x1e293b, shoes: 0x5c3a21,
          tie: null, style: 'cardigan', hairStyle: 'bob', glasses: false, eyeCol: 0x4f46e5
        },
        hunter: {
          skin: 0xc68b61, hair: 0xfbbf24, top: 0x312e81, shirt: 0x1e1b4b, pants: 0x0f172a, shoes: 0xf59e0b,
          tie: null, style: 'hoodie', hairStyle: 'spiky_dj', glasses: false, eyeCol: 0xd97706
        },
        sentinel: {
          skin: 0xe9bfa4, hair: 0x1f2937, top: 0xe2e8f0, shirt: 0x0f766e, pants: 0x334155, shoes: 0x06b6d4,
          tie: null, style: 'labcoat', hairStyle: 'twin_buns', glasses: false, eyeCol: 0x0d9488
        }
      };

      var cfg = OUTFITS[ag.id] || OUTFITS.analyst;
      var skinMat = new THREE.MeshStandardMaterial({ color: cfg.skin, roughness: 0.62, metalness: 0.04 });
      var hairMat = new THREE.MeshStandardMaterial({ color: cfg.hair, roughness: 0.72, metalness: 0.08 });
      var topMat = new THREE.MeshStandardMaterial({ color: cfg.top, roughness: 0.58, metalness: 0.10 });
      var shirtMat = new THREE.MeshStandardMaterial({ color: cfg.shirt, roughness: 0.68, metalness: 0.05 });
      var pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pants, roughness: 0.70, metalness: 0.06 });
      var shoeMat = new THREE.MeshStandardMaterial({ color: cfg.shoes, roughness: 0.45, metalness: 0.15 });
      var soleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
      var beltMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
      var buckleMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });
      var accentTrimMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.45, roughness: 0.35 });

      var isBroad = ag.id === 'risk' || ag.id === 'strategist';
      var isSlim = ag.id === 'lead' || ag.id === 'reviewer' || ag.id === 'execution' || ag.id === 'sentinel';
      var chestW = isBroad ? 0.46 : isSlim ? 0.36 : 0.40;
      var chestD = isBroad ? 0.26 : 0.21;
      var hipW = isBroad ? 0.39 : 0.34;
      var legSpread = isBroad ? 0.125 : 0.105;

      // 1. Pelvis, Belt & Gold/Chrome Buckle
      var pelvis = new THREE.Mesh(new THREE.BoxGeometry(hipW, 0.15, 0.20), pantsMat);
      pelvis.position.y = 0.82;
      pelvis.castShadow = true;
      avatar.add(pelvis);

      var belt = new THREE.Mesh(new THREE.BoxGeometry(hipW + 0.02, 0.055, 0.215), beltMat);
      belt.position.y = 0.89;
      avatar.add(belt);
      var buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), buckleMat);
      buckle.position.set(0, 0.89, 0.11);
      avatar.add(buckle);

      // 2. Sculpted Human Torso + Tailored Garment Layers
      var torso = new THREE.Mesh(new THREE.CylinderGeometry(chestW * 0.56, hipW * 0.48, 0.50, 14), topMat);
      torso.scale.set(1.0, 1.0, chestD / (chestW * 0.55));
      torso.position.y = 1.15;
      torso.castShadow = true;
      avatar.add(torso);

      // Shirt V-front / collar
      var shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.04), shirtMat);
      shirtV.position.set(0, 1.24, chestD * 0.48);
      avatar.add(shirtV);

      var collarRing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 14), shirtMat);
      collarRing.position.set(0, 1.40, 0);
      avatar.add(collarRing);

      // Outfit-specific garment details (lapels, ties, aprons, bomber stripes, lab pockets, hoodie strings)
      if (cfg.tie) {
        var tieMesh = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.28, 4), new THREE.MeshStandardMaterial({ color: cfg.tie, roughness: 0.4 }));
        tieMesh.rotation.x = Math.PI;
        tieMesh.position.set(0, 1.18, chestD * 0.54);
        avatar.add(tieMesh);
      }
      if (cfg.style === 'suit' || cfg.style === 'trench' || cfg.style === 'cardigan') {
        var lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.30, 0.03), topMat);
        lapelL.position.set(-0.08, 1.23, chestD * 0.51);
        lapelL.rotation.z = 0.20;
        var lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.30, 0.03), topMat);
        lapelR.position.set(0.08, 1.23, chestD * 0.51);
        lapelR.rotation.z = -0.20;
        avatar.add(lapelL);
        avatar.add(lapelR);
      }
      if (cfg.style === 'trench' || cfg.style === 'labcoat') {
        var coatSkirt = new THREE.Mesh(new THREE.CylinderGeometry(hipW * 0.52, hipW * 0.62, 0.36, 14, 1, true, 0.4, Math.PI * 1.75), topMat);
        coatSkirt.position.y = 0.72;
        coatSkirt.material.side = THREE.DoubleSide;
        avatar.add(coatSkirt);
      }
      if (cfg.style === 'vest') {
        // Barista half-apron sash
        var apron = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.04), new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.7 }));
        apron.position.set(0, 0.76, 0.11);
        avatar.add(apron);
      }
      if (cfg.style === 'bomber' || cfg.style === 'hoodie') {
        var pocket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.03), accentTrimMat);
        pocket.position.set(0, 1.00, chestD * 0.53);
        avatar.add(pocket);
        if (cfg.style === 'hoodie') {
          var backHood = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.16), topMat);
          backHood.position.set(0, 1.38, -0.14);
          avatar.add(backHood);
        }
      }
      if (cfg.style === 'utility') {
        var chestBadge = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.03), accentTrimMat);
        chestBadge.position.set(0.11, 1.24, chestD * 0.53);
        avatar.add(chestBadge);
      }

      // 3. Sculpted Articulated Legs + Knees + Detailed Footwear (trousers + shoes with soles)
      function makeHumanLeg(xPos) {
        var hipPivot = new THREE.Group();
        hipPivot.position.set(xPos, 0.78, 0);

        var thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.066, 0.38, 12), pantsMat);
        thigh.position.y = -0.19;
        thigh.castShadow = true;
        hipPivot.add(thigh);

        var shin = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.052, 0.36, 12), pantsMat);
        shin.position.y = -0.54;
        shin.castShadow = true;
        hipPivot.add(shin);

        var shoe = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.075, 0.21), shoeMat);
        shoe.position.set(0, -0.735, 0.04);
        shoe.castShadow = true;
        hipPivot.add(shoe);

        var sole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.22), soleMat);
        sole.position.set(0, -0.775, 0.04);
        hipPivot.add(sole);

        avatar.add(hipPivot);
        return hipPivot;
      }
      legL = makeHumanLeg(-legSpread);
      legR = makeHumanLeg(legSpread);

      // 4. Sculpted Articulated Arms + Sleeves + Skin Hands
      function makeHumanArm(sideSign) {
        var shPivot = new THREE.Group();
        shPivot.position.set(sideSign * (chestW * 0.56 + 0.05), 1.34, 0);

        var shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 12), topMat);
        shPivot.add(shoulderCap);

        var upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.052, 0.26, 10), topMat);
        upperArm.position.y = -0.13;
        upperArm.castShadow = true;
        shPivot.add(upperArm);

        var forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.042, 0.24, 10), topMat);
        forearm.position.y = -0.37;
        forearm.castShadow = true;
        shPivot.add(forearm);

        var cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.035, 10), shirtMat);
        cuff.position.y = -0.49;
        shPivot.add(cuff);

        // Human skin hand + thumb silhouette
        var handPalm = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), skinMat);
        handPalm.scale.set(0.85, 1.15, 0.72);
        handPalm.position.set(0, -0.54, 0.01);
        shPivot.add(handPalm);

        var thumb = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.045, 0.022), skinMat);
        thumb.position.set(-sideSign * 0.04, -0.53, 0.03);
        shPivot.add(thumb);

        avatar.add(shPivot);
        return shPivot;
      }
      armL = makeHumanArm(-1);
      armR = makeHumanArm(1);

      // 5. Realistic Neck & Human Face (Eyes, Irises, Brows, Nose, Ears, Smile, Distinct Hairstyles)
      var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.13, 12), skinMat);
      neck.position.y = 1.44;
      avatar.add(neck);

      headGroup = new THREE.Group();
      headGroup.position.set(0, 1.62, 0);

      var skull = new THREE.Mesh(new THREE.SphereGeometry(0.175, 24, 24), skinMat);
      skull.scale.set(0.92, 1.06, 0.96);
      skull.castShadow = true;
      headGroup.add(skull);

      // Ears
      var earGeo = new THREE.SphereGeometry(0.038, 10, 10);
      var earL = new THREE.Mesh(earGeo, skinMat);
      earL.scale.set(0.5, 1.1, 0.7);
      earL.position.set(-0.16, -0.01, 0);
      var earR = new THREE.Mesh(earGeo, skinMat);
      earR.scale.set(0.5, 1.1, 0.7);
      earR.position.set(0.16, -0.01, 0);
      headGroup.add(earL);
      headGroup.add(earR);

      // Nose bridge
      var noseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.048, 0.038), skinMat);
      noseMesh.position.set(0, -0.015, 0.172);
      headGroup.add(noseMesh);

      // Eyes (Sclera + Colored Iris + Pupil + Eyebrows)
      var scleraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      var irisMat = new THREE.MeshBasicMaterial({ color: cfg.eyeCol });
      var pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
      [-0.062, 0.062].forEach(function (ex) {
        var eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), scleraMat);
        eyeW.scale.set(1.0, 0.85, 0.6);
        eyeW.position.set(ex, 0.025, 0.148);
        headGroup.add(eyeW);

        var iris = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), irisMat);
        iris.position.set(ex, 0.025, 0.162);
        headGroup.add(iris);

        var pup = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 8), pupilMat);
        pup.position.set(ex, 0.025, 0.170);
        headGroup.add(pup);

        var brow = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.014, 0.018), hairMat);
        brow.position.set(ex, 0.068, 0.155);
        headGroup.add(brow);
      });

      // Warm mouth / smile
      var mouthMesh = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.014, 0.015), new THREE.MeshBasicMaterial({ color: 0xb91c1c }));
      mouthMesh.position.set(0, -0.075, 0.152);
      headGroup.add(mouthMesh);

      // Hair Cap & Custom Character Hairstyles / Accessories
      var hairCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.184, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
        hairMat
      );
      hairCap.position.y = 0.022;
      hairCap.rotation.x = -0.22;
      headGroup.add(hairCap);

      if (cfg.hairStyle === 'tousled') {
        var bangs = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.10), hairMat);
        bangs.position.set(0, 0.125, 0.10);
        bangs.rotation.z = -0.08;
        headGroup.add(bangs);
      } else if (cfg.hairStyle === 'parted_beard') {
        var hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.24), hairMat);
        hairTop.position.set(0, 0.175, 0.01);
        headGroup.add(hairTop);
        var beard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.08), hairMat);
        beard.position.set(0, -0.12, 0.10);
        headGroup.add(beard);
      } else if (cfg.hairStyle === 'ponytail_beret') {
        var pTail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.035, 0.24, 10), hairMat);
        pTail.position.set(0, 0.02, -0.20);
        pTail.rotation.x = 0.45;
        headGroup.add(pTail);
        var beret = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.17, 0.07, 18), new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.7 }));
        beret.position.set(0.03, 0.17, -0.02);
        beret.rotation.z = -0.18;
        headGroup.add(beret);
      } else if (cfg.hairStyle === 'sport_ponytail') {
        var hiTail = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.28, 10), hairMat);
        hiTail.position.set(0, 0.12, -0.22);
        hiTail.rotation.x = -1.1;
        headGroup.add(hiTail);
        var hBand = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.022, 8, 24), accentTrimMat);
        hBand.rotation.x = Math.PI / 2.2;
        hBand.position.y = 0.095;
        headGroup.add(hBand);
      } else if (cfg.hairStyle === 'bob') {
        var bobSideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.18), hairMat);
        bobSideL.position.set(-0.16, -0.02, -0.02);
        var bobSideR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.18), hairMat);
        bobSideR.position.set(0.16, -0.02, -0.02);
        var bobBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.10), hairMat);
        bobBack.position.set(0, -0.02, -0.15);
        headGroup.add(bobSideL);
        headGroup.add(bobSideR);
        headGroup.add(bobBack);
      } else if (cfg.hairStyle === 'spiky_dj') {
        for (var si = -2; si <= 2; si++) {
          var spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), hairMat);
          spike.position.set(si * 0.055, 0.20, 0.04);
          spike.rotation.z = -si * 0.15;
          headGroup.add(spike);
        }
        // Studio Over-Ear Headphones
        var djBand = new THREE.Mesh(new THREE.TorusGeometry(0.198, 0.022, 8, 24, Math.PI), accentTrimMat);
        djBand.position.y = 0.04;
        var earCupL = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.055, 14), beltMat);
        earCupL.rotation.z = Math.PI / 2;
        earCupL.position.set(-0.19, 0.01, 0);
        var earCupR = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.055, 14), beltMat);
        earCupR.rotation.z = Math.PI / 2;
        earCupR.position.set(0.19, 0.01, 0);
        headGroup.add(djBand);
        headGroup.add(earCupL);
        headGroup.add(earCupR);
      } else if (cfg.hairStyle === 'twin_buns') {
        var bunL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), hairMat);
        bunL.position.set(-0.15, 0.17, -0.03);
        var bunR = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), hairMat);
        bunR.position.set(0.15, 0.17, -0.03);
        headGroup.add(bunL);
        headGroup.add(bunR);
        // Brass goggles pushed up on forehead
        var gBand = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.06), buckleMat);
        gBand.position.set(0, 0.11, 0.15);
        headGroup.add(gBand);
      }

      if (cfg.glasses) {
        var rimMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        var gL = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.008, 8, 18), rimMat);
        gL.position.set(-0.062, 0.025, 0.175);
        var gR = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.008, 8, 18), rimMat);
        gR.position.set(0.062, 0.025, 0.175);
        var bridge = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.008, 0.008), rimMat);
        bridge.position.set(0, 0.028, 0.175);
        headGroup.add(gL);
        headGroup.add(gR);
        headGroup.add(bridge);
      }
      avatar.add(headGroup);

      // 6. Signature Handheld Human Props (Tablet, Chess Knight, Espresso Mug, Bento/Stopwatch, Shield/Notebook, Vintage Camera, Vinyl Sleeve, Mini Bonsai)
      if (ag.id === 'analyst') {
        propGroup = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.15, 0.025), neonMat);
        propGroup.position.set(0.02, -0.56, 0.10);
        propGroup.rotation.x = -0.5;
        armR.add(propGroup);
      } else if (ag.id === 'strategist') {
        propGroup = new THREE.Group();
        var kBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.10, 12), buckleMat);
        var kHead = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.08), buckleMat);
        kHead.position.set(0, 0.07, 0.015);
        propGroup.add(kBase);
        propGroup.add(kHead);
        propGroup.position.set(0, -0.54, 0.07);
        armR.add(propGroup);
      } else if (ag.id === 'lead') {
        propGroup = new THREE.Group();
        var mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.10, 12), soleMat);
        var crema = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.015, 12), new THREE.MeshBasicMaterial({ color: 0x78350f }));
        crema.position.y = 0.048;
        propGroup.add(mugBody);
        propGroup.add(crema);
        propGroup.position.set(0, -0.54, 0.08);
        armR.add(propGroup);
      } else if (ag.id === 'risk') {
        propGroup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 6), neonMat);
        propGroup.rotation.z = Math.PI / 2;
        propGroup.position.set(-0.08, -0.42, 0.06);
        armL.add(propGroup);
      } else if (ag.id === 'reviewer') {
        // Crossbody DSLR camera on chest/hand
        propGroup = new THREE.Group();
        var camB = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.08), beltMat);
        var lensB = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.07, 12), buckleMat);
        lensB.rotation.x = Math.PI / 2;
        lensB.position.z = 0.06;
        propGroup.add(camB);
        propGroup.add(lensB);
        propGroup.position.set(0, 1.06, 0.17);
        avatar.add(propGroup);
      } else if (ag.id === 'hunter') {
        // Holding vintage vinyl LP sleeve
        propGroup = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.02), accentTrimMat);
        propGroup.position.set(-0.04, -0.50, 0.08);
        armL.add(propGroup);
      } else if (ag.id === 'sentinel') {
        // Carrying potted miniature bonsai tree in hands
        propGroup = new THREE.Group();
        var potM = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
        var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.022, 0.11, 8), hairMat);
        trunk.position.y = 0.08;
        var canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.4 }));
        canopy.position.y = 0.15;
        propGroup.add(potM);
        propGroup.add(trunk);
        propGroup.add(canopy);
        propGroup.position.set(0, -0.52, 0.08);
        armR.add(propGroup);
      } else {
        // Kira : glowing cyber stopwatch / energy drink in hand
        propGroup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10), neonMat);
        propGroup.position.set(0, -0.54, 0.06);
        armR.add(propGroup);
      }

      return {
        avatar: avatar,
        headGroup: headGroup,
        armL: armL,
        armR: armR,
        legL: legL,
        legR: legR,
        propGroup: propGroup
      };
    }

    function buildBlackCatMesh() {
      var catGroup = new THREE.Group();
      var furMat = new THREE.MeshStandardMaterial({
        color: 0x0b0b10,
        roughness: 0.42,
        metalness: 0.16,
        emissive: 0x111827,
        emissiveIntensity: 0.25
      });
      var bellyTrimMat = new THREE.MeshStandardMaterial({ color: 0x171722, roughness: 0.5 });
      var eyeMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
      var earInnerMat = new THREE.MeshStandardMaterial({ color: 0x3f2e3e, roughness: 0.7 });
      var noseMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

      // Body (sleek stretched oval silhouette)
      var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.56, 16), furMat);
      torso.rotation.x = Math.PI / 2;
      torso.position.set(0, 0.34, 0);
      torso.castShadow = true;
      catGroup.add(torso);

      // Subtle collar glow so the black cat reads crisp on obsidian dark floor
      var collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.155, 0.022, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      collar.rotation.x = Math.PI / 2.2;
      collar.position.set(0, 0.43, 0.23);
      catGroup.add(collar);

      // Chest tuft
      var chest = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), bellyTrimMat);
      chest.position.set(0, 0.34, 0.22);
      catGroup.add(chest);

      // Head + ears + eyes + whiskers
      var headPivot = new THREE.Group();
      headPivot.position.set(0, 0.52, 0.32);

      var head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 18), furMat);
      head.scale.set(1.05, 0.96, 1.0);
      head.castShadow = true;
      headPivot.add(head);

      var muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), furMat);
      muzzle.position.set(0, -0.04, 0.13);
      headPivot.add(muzzle);

      var nose = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), noseMat);
      nose.position.set(0, -0.02, 0.205);
      headPivot.add(nose);

      // Feline whiskers & golden collar bell
      var whiskerMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.85 });
      [-1, 1].forEach(function (wSide) {
        var w1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.007, 0.007), whiskerMat);
        w1.position.set(wSide * 0.11, -0.025, 0.185);
        w1.rotation.z = wSide * 0.12;
        var w2 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.007, 0.007), whiskerMat);
        w2.position.set(wSide * 0.11, -0.045, 0.18);
        w2.rotation.z = -wSide * 0.12;
        headPivot.add(w1);
        headPivot.add(w2);
      });
      var bell = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 }));
      bell.position.set(0, 0.34, 0.31);
      catGroup.add(bell);

      var earGeo = new THREE.ConeGeometry(0.065, 0.15, 6);
      var earL = new THREE.Mesh(earGeo, furMat);
      earL.position.set(-0.10, 0.17, 0.01);
      earL.rotation.z = 0.26;
      headPivot.add(earL);

      var earR = new THREE.Mesh(earGeo, furMat);
      earR.position.set(0.10, 0.17, 0.01);
      earR.rotation.z = -0.26;
      headPivot.add(earR);

      var innerGeo = new THREE.ConeGeometry(0.035, 0.09, 6);
      var inL = new THREE.Mesh(innerGeo, earInnerMat);
      inL.position.set(-0.10, 0.16, 0.03);
      inL.rotation.z = 0.26;
      headPivot.add(inL);
      var inR = new THREE.Mesh(innerGeo, earInnerMat);
      inR.position.set(0.10, 0.16, 0.03);
      inR.rotation.z = -0.26;
      headPivot.add(inR);

      var eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), eyeMat);
      eyeL.position.set(-0.065, 0.03, 0.148);
      headPivot.add(eyeL);
      var eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), eyeMat);
      eyeR.position.set(0.065, 0.03, 0.148);
      headPivot.add(eyeR);

      catGroup.add(headPivot);

      // 4 articulated paws
      function makeLeg(x, z) {
        var pivot = new THREE.Group();
        pivot.position.set(x, 0.26, z);
        var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.036, 0.26, 10), furMat);
        leg.position.y = -0.13;
        leg.castShadow = true;
        pivot.add(leg);
        catGroup.add(pivot);
        return pivot;
      }
      var legFL = makeLeg(-0.10, 0.21);
      var legFR = makeLeg(0.10, 0.21);
      var legBL = makeLeg(-0.10, -0.20);
      var legBR = makeLeg(0.10, -0.20);

      // Articulated multi-segment black tail
      var tailBasePivot = new THREE.Group();
      tailBasePivot.position.set(0, 0.40, -0.32);
      var tailSeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.028, 0.26, 8), furMat);
      tailSeg1.rotation.x = -Math.PI / 3;
      tailSeg1.position.set(0, 0.08, -0.10);
      tailBasePivot.add(tailSeg1);

      var tailMidPivot = new THREE.Group();
      tailMidPivot.position.set(0, 0.15, -0.20);
      var tailSeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.018, 0.28, 8), furMat);
      tailSeg2.rotation.x = -Math.PI / 5;
      tailSeg2.position.set(0, 0.11, -0.07);
      tailMidPivot.add(tailSeg2);
      tailBasePivot.add(tailMidPivot);
      catGroup.add(tailBasePivot);

      // Ground soft glow outline ring so the black cat is easy to spot anywhere
      var catHalo = new THREE.Mesh(
        new THREE.RingGeometry(0.32, 0.38, 28),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.42 })
      );
      catHalo.rotation.x = -Math.PI / 2;
      catHalo.position.y = 0.01;
      catGroup.add(catHalo);

      // Speech bubble sprite above the Black Cat
      var catSpeechTex = makeSpeechBubbleTexture('Minou', 'Miaou !', '#f59e0b');
      var catSpeechSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: catSpeechTex, transparent: true, opacity: 0 }));
      catSpeechSprite.position.set(0, 1.38, 0);
      catSpeechSprite.scale.set(0.001, 0.001, 1);
      catSpeechSprite.visible = false;
      catGroup.add(catSpeechSprite);

      // Clickable hitbox for inspector
      var hitCat = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 12), new THREE.MeshBasicMaterial({ visible: false }));
      hitCat.position.y = 0.45;
      hitCat.userData = { catMascot: true };
      catGroup.add(hitCat);

      return {
        group: catGroup,
        head: headPivot,
        earL: earL,
        earR: earR,
        legFL: legFL,
        legFR: legFR,
        legBL: legBL,
        legBR: legBR,
        tailBase: tailBasePivot,
        tailMid: tailMidPivot,
        hitSphere: hitCat,
        speechSprite: catSpeechSprite,
        bubbleBaseY: 1.38,
        bubbleScaleW: 2.35,
        bubbleScaleH: 0.74,
        bubbleAge: 99,
        bubbleDuration: 4.5,
        pos: new THREE.Vector3(1.2, -1.5, 1.8),
        target: new THREE.Vector3(-4.2, -1.5, 2.2),
        heading: 0,
        pauseTimer: 0.4,
        mood: 'Explore le studio 3D'
      };
    }

    function init3dDesk() {
      var host = document.getElementById('canvas3dWrap');
      if (!host || typeof THREE === 'undefined') return;
      var w = host.clientWidth || window.innerWidth;
      var h = host.clientHeight || window.innerHeight;

      scene3d = new THREE.Scene();
      scene3d.fog = new THREE.FogExp2(0x03060c, 0.022);

      camera3d = new THREE.PerspectiveCamera(46, w / h, 0.1, 220);
      camera3d.position.set(0, 7.6, 13.4);
      camera3d.lookAt(0, 0.0, -1.0);

      renderer3d = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer3d.setSize(w, h);
      renderer3d.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer3d.shadowMap.enabled = true;
      renderer3d.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer3d.toneMapping = THREE.ACESFilmicToneMapping;
      renderer3d.toneMappingExposure = 1.28;
      host.innerHTML = '';
      host.appendChild(renderer3d.domElement);

      ambient3d = new THREE.AmbientLight(0x94a3b8, 0.92);
      scene3d.add(ambient3d);

      spot3d = new THREE.SpotLight(0x38bdf8, 3.2, 56, Math.PI / 2.6, 0.45, 1.0);
      spot3d.position.set(0, 8.6, 4.0);
      spot3d.castShadow = true;
      spot3d.shadow.mapSize.width = 1024;
      spot3d.shadow.mapSize.height = 1024;
      scene3d.add(spot3d);

      var warmRim = new THREE.PointLight(0x10b981, 1.7, 36);
      warmRim.position.set(9, 6.2, 6);
      scene3d.add(warmRim);

      var coolRim = new THREE.PointLight(0xa855f7, 1.8, 36);
      coolRim.position.set(-9, 6.2, -7);
      scene3d.add(coolRim);

      // Closed Institutional Quant Trading Room (all 8 agents inside one shared room)
      coreMesh3d = null;
      ring1_3d = null;
      ring2_3d = null;
      floorRing3d = null;
      agentRigs = {};
      pulseArcs = [];
      profitBursts3d = [];

      var studioDeck = new THREE.Mesh(
        new THREE.BoxGeometry(28.0, 0.36, 26.0),
        new THREE.MeshPhysicalMaterial({ color: 0x070d18, metalness: 0.68, roughness: 0.28, clearcoat: 0.65 })
      );
      studioDeck.position.set(0, -1.68, 1.8);
      studioDeck.receiveShadow = true;
      scene3d.add(studioDeck);

      var grid = new THREE.GridHelper(27, 27, 0x1e3a5f, 0x0b1526);
      grid.position.set(0, -1.49, 1.8);
      scene3d.add(grid);

      // ==================== PIÈCE FERMÉE QUANT DESK (4 MURS + PLAFOND + ÉCRAN WALL STREET) ====================
      var roomWallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.72, metalness: 0.28 });
      var roomPanelMat = new THREE.MeshStandardMaterial({ color: 0x162238, roughness: 0.55, metalness: 0.42 });
      var glassPanelMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.14, roughness: 0.12, metalness: 0.85 });
      var ledBarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });

      // Plinthe lumineuse périphérique
      var trimMesh = new THREE.Mesh(
        new THREE.BoxGeometry(27.8, 0.08, 25.8),
        new THREE.MeshBasicMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.35 })
      );
      trimMesh.position.set(0, -1.48, 1.8);
      scene3d.add(trimMesh);

      // Mur du fond (z = -11.0) + Écran géant Wall Street
      var backWall = new THREE.Mesh(new THREE.BoxGeometry(28.2, 11.2, 0.4), roomWallMat);
      backWall.position.set(0, 3.9, -11.0);
      scene3d.add(backWall);

      var tickerFrame = new THREE.Mesh(new THREE.BoxGeometry(16.8, 4.4, 0.18), roomPanelMat);
      tickerFrame.position.set(0, 4.3, -10.72);
      scene3d.add(tickerFrame);
      var tickerScreen = new THREE.Mesh(new THREE.BoxGeometry(16.0, 3.8, 0.08), new THREE.MeshBasicMaterial({ color: 0x091a30 }));
      tickerScreen.position.set(0, 4.3, -10.60);
      scene3d.add(tickerScreen);
      var tickerTopLed = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.08, 0.08), ledBarMat);
      tickerTopLed.position.set(0, 6.26, -10.58);
      scene3d.add(tickerTopLed);
      var tickerBotLed = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.08, 0.08), ledBarMat);
      tickerBotLed.position.set(0, 2.34, -10.58);
      scene3d.add(tickerBotLed);

      // Murs latéraux gauche/droit (x = ±14.0) avec piliers acoustiques & baies vitrées
      [-14.0, 14.0].forEach(function (wallX) {
        var sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 11.2, 26.2), roomWallMat);
        sideWall.position.set(wallX, 3.9, 1.8);
        scene3d.add(sideWall);
        var sign = wallX < 0 ? 1 : -1;
        for (var p = -6; p <= 6; p += 6) {
          var pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 10.6, 0.45), roomPanelMat);
          pillar.position.set(wallX + sign * 0.25, 3.9, p);
          scene3d.add(pillar);
        }
        var winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.0, 18.0), glassPanelMat);
        winGlass.position.set(wallX + sign * 0.24, 3.6, 0.5);
        scene3d.add(winGlass);
        var sideLed = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 22.0), ledBarMat);
        sideLed.position.set(wallX + sign * 0.28, 8.4, 1.5);
        scene3d.add(sideLed);
      });

      // Mur avant derrière la caméra (z = +14.8) pour fermer complètement la salle
      var frontWall = new THREE.Mesh(new THREE.BoxGeometry(28.2, 11.2, 0.4), roomWallMat);
      frontWall.position.set(0, 3.9, 14.8);
      scene3d.add(frontWall);

      // Plafond fermé avec poutres LED encastrées (y = 9.4)
      var ceilingMesh = new THREE.Mesh(new THREE.BoxGeometry(28.4, 0.4, 26.4), roomWallMat);
      ceilingMesh.position.set(0, 9.4, 1.8);
      scene3d.add(ceilingMesh);
      [-5.5, 0, 5.5].forEach(function (beamZ) {
        var ceilingBeam = new THREE.Mesh(new THREE.BoxGeometry(24.0, 0.14, 0.42), roomPanelMat);
        ceilingBeam.position.set(0, 9.15, beamZ);
        scene3d.add(ceilingBeam);
        var beamLed = new THREE.Mesh(new THREE.BoxGeometry(22.0, 0.06, 0.12), ledBarMat);
        beamLed.position.set(0, 9.06, beamZ);
        scene3d.add(beamLed);
      });

      // Table centrale de briefing Quant au centre de la pièce
      var centerTable = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 2.2), roomPanelMat);
      centerTable.position.set(0, -0.58, 0.2);
      scene3d.add(centerTable);
      var tableBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1.2), roomWallMat);
      tableBase.position.set(0, -1.08, 0.2);
      scene3d.add(tableBase);

      // Asymmetric Spatial Zones where each Agent builds its own custom environment & roams freely
      var STUDIO_ZONES = {
        analyst:    { x: -7.8, z: -4.2, rot: 0.45 },
        strategist: { x: -2.4, z: -5.4, rot: 0.15 },
        hunter:     { x:  4.6, z: -4.8, rot: -0.35 },
        risk:       { x:  8.4, z: -0.4, rot: -1.15 },
        execution:  { x:  5.8, z:  4.8, rot: -2.20 },
        lead:       { x: -0.4, z: -0.6, rot: 0.00 },
        reviewer:   { x: -5.2, z:  4.9, rot: 2.35 },
        sentinel:   { x: -8.6, z:  1.1, rot: 1.40 }
      };

      AGENTS.forEach(function (ag, idx) {
        var zp = STUDIO_ZONES[ag.id] || { x: (idx - 3.5) * 2.4, z: ((idx % 2) - 0.5) * 5.0, rot: 0 };
        var col = new THREE.Color(ag.color);
        var persona = AGENT_PERSONAS[ag.id] || { nick: ag.name, hobby: '', lines: ['En salle'] };

        // Agent's custom self-built Spatial Habitat (unique geometry per role, asymmetric)
        var habitat = new THREE.Group();
        habitat.position.set(zp.x, -1.5, zp.z);
        habitat.rotation.y = zp.rot;

        var padMat = new THREE.MeshPhysicalMaterial({ color: 0x0b1324, metalness: 0.72, roughness: 0.22, clearcoat: 0.8 });
        var neonMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.25, roughness: 0.2, metalness: 0.4 });
        var glassScreenMat = new THREE.MeshBasicMaterial({ map: makeScreenTexture(ag.color), transparent: true, opacity: 0.88, side: THREE.DoubleSide });

        var island = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 2.0), padMat);
        island.position.y = 0.06;
        island.receiveShadow = true;
        habitat.add(island);

        var accentTrim = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.03, 0.08), neonMat);
        accentTrim.position.set(0, 0.12, 0.98);
        habitat.add(accentTrim);

        var holoScreens = [];
        var l2Bars = [];
        var sentinelLed = null;

        if (ag.id === 'analyst') {
          for (var si = 0; si < 3; si++) {
            var scr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), glassScreenMat);
            scr.position.set(-0.9 + si * 0.9, 1.35 + (si % 2) * 0.22, -0.55 + Math.abs(si - 1) * 0.2);
            scr.rotation.y = (1 - si) * 0.28;
            habitat.add(scr);
            holoScreens.push(scr);
          }
          var spire = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.5, 5), neonMat);
          spire.position.set(-1.05, 0.75, -0.65);
          habitat.add(spire);
        } else if (ag.id === 'strategist') {
          var sculpture = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.45, 0),
            new THREE.MeshPhysicalMaterial({ color: col, metalness: 0.3, roughness: 0.12, transmission: 0.6, clearcoat: 1.0 })
          );
          sculpture.position.set(0.6, 1.35, -0.4);
          habitat.add(sculpture);
          holoScreens.push(sculpture);
          var mapScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.82), glassScreenMat);
          mapScreen.position.set(-0.45, 1.2, -0.6);
          habitat.add(mapScreen);
        } else if (ag.id === 'hunter') {
          for (var bi = 0; bi < 8; bi++) {
            var isBid = bi < 4;
            var bar = new THREE.Mesh(
              new THREE.BoxGeometry(0.2, 0.75, 0.22),
              new THREE.MeshBasicMaterial({ color: isBid ? 0x10b981 : 0xf43f5e, transparent: true, opacity: 0.88 })
            );
            bar.position.set(-0.85 + bi * 0.24, 0.55, -0.45);
            habitat.add(bar);
            l2Bars.push(bar);
          }
        } else if (ag.id === 'risk') {
          for (var pi2 = -1; pi2 <= 1; pi2 += 2) {
            var pylon = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.65, 0.42), padMat);
            pylon.position.set(pi2 * 0.92, 0.85, -0.55);
            habitat.add(pylon);
            var barGlow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), neonMat);
            barGlow.position.set(pi2 * 0.92, 0.85, -0.32);
            habitat.add(barGlow);
          }
        } else if (ag.id === 'sentinel') {
          for (var ri = -1; ri <= 1; ri++) {
            var rack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.5, 0.36), padMat);
            rack.position.set(ri * 0.58, 0.8, -0.58);
            habitat.add(rack);
          }
          var ledMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.8 });
          sentinelLed = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), ledMat);
          sentinelLed.position.set(0, 1.85, -0.52);
          habitat.add(sentinelLed);
        } else {
          var finA = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.45, 0.55), neonMat);
          finA.position.set(-0.85, 0.75, -0.5);
          finA.rotation.z = -0.14;
          habitat.add(finA);
          var boardScr = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.82), glassScreenMat);
          boardScr.position.set(0.15, 1.25, -0.55);
          habitat.add(boardScr);
          holoScreens.push(boardScr);
        }

        scene3d.add(habitat);

        // Unique Free-Roaming Agent Character (NO clones!)
        var walker = new THREE.Group();
        walker.position.set(zp.x + (Math.random() - 0.5) * 1.6, -1.5, zp.z + 0.8 + (Math.random() - 0.5) * 1.4);

        var built = buildDistinctAgentAvatar(ag, col, neonMat);

        var padRing = new THREE.Mesh(
          new THREE.RingGeometry(0.45, 0.58, 28),
          new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending })
        );
        padRing.rotation.x = -Math.PI / 2;
        padRing.position.y = 0.02;
        walker.add(padRing);

        var spTex = makeNameplateTexture(persona.nick.toUpperCase() + ' · ' + ag.name.toUpperCase(), 'EN VEILLE', ag.color);
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: spTex, transparent: true }));
        sprite.position.set(0, 2.22, 0);
        sprite.scale.set(2.55, 0.74, 1);
        walker.add(sprite);

        // Pop-up Speech Bubble Sprite right above nameplate
        var sbTex = makeSpeechBubbleTexture(persona.nick, persona.lines[0], ag.color);
        var speechSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sbTex, transparent: true, opacity: 0 }));
        speechSprite.position.set(0, 3.04, 0);
        speechSprite.scale.set(0.001, 0.001, 1);
        speechSprite.visible = false;
        walker.add(speechSprite);

        var hitSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 14, 14),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitSphere.position.set(0, 0.95, 0);
        hitSphere.userData = { agentId: ag.id };
        walker.add(hitSphere);
        walker.add(built.avatar);
        scene3d.add(walker);

        agentRigs[ag.id] = {
          station: walker,
          habitat: habitat,
          avatar: built.avatar,
          headGroup: built.headGroup,
          armL: built.armL,
          armR: built.armR,
          legL: built.legL,
          legR: built.legR,
          propGroup: built.propGroup,
          padRing: padRing,
          hitSphere: hitSphere,
          sprite: sprite,
          speechSprite: speechSprite,
          bubbleBaseY: 3.04,
          bubbleScaleW: 2.85,
          bubbleScaleH: 0.90,
          bubbleAge: 99,
          bubbleDuration: 4.8,
          sentinelLed: sentinelLed,
          l2Bars: l2Bars,
          holoScreens: holoScreens,
          homePos: new THREE.Vector3(zp.x, -1.5, zp.z + 0.6),
          wanderTarget: new THREE.Vector3((Math.random() - 0.5) * 14, -1.5, (Math.random() - 0.5) * 10),
          pauseTimer: Math.random() * 0.6,
          moveSpeed: ag.id === 'execution' ? 0.068 : (ag.id === 'risk' ? 0.036 : 0.048),
          worldPos: walker.position,
          lastLabel: 'EN VEILLE'
        };
      });

      // Spawn the User's Real-Life Black Cat roaming the studio floor
      blackCat3d = buildBlackCatMesh();
      blackCat3d.group.position.copy(blackCat3d.pos);
      scene3d.add(blackCat3d.group);

      // Kick off lively opening speech bubbles right away so the studio immediately feels alive
      setTimeout(function () {
        if (agentRigs.lead) triggerSpeechBubble(agentRigs.lead, 'Aria', 'Bienvenue dans le studio ! Pause café ?', '#22d3ee', 5.0);
        if (blackCat3d) triggerSpeechBubble(blackCat3d, 'Minou', 'Miaou ! (*inspecte le studio*)', '#f59e0b', 4.6);
      }, 650);
      setTimeout(function () {
        if (agentRigs.execution) triggerSpeechBubble(agentRigs.execution, 'Kira', 'Hover-skates prêts, en balade !', '#10b981', 4.8);
      }, 1700);

      // Ambient holographic data motes across the open studio
      var pGeo = new THREE.BufferGeometry();
      var pCount = 260;
      var pos = new Float32Array(pCount * 3);
      for (var i = 0; i < pCount; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 22;
        pos[i * 3 + 1] = -1.2 + Math.random() * 5.2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pts3d = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.07, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending })
      );
      scene3d.add(pts3d);

      raycaster3d = new THREE.Raycaster();
      pointer3d = new THREE.Vector2();

      var drag = false;
      var prevX = 0;
      var prevY = 0;
      var yaw = 0.28;
      var pitch = 0.50;
      var zoom = 19.8;

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
        zoom = Math.max(9.5, Math.min(34, zoom + e.deltaY * 0.015));
      }, { passive: true });
      renderer3d.domElement.addEventListener('click', function (e) {
        if (!raycaster3d || !camera3d) return;
        var rect = renderer3d.domElement.getBoundingClientRect();
        pointer3d.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer3d.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster3d.setFromCamera(pointer3d, camera3d);
        var targets = Object.keys(agentRigs).map(function (k) { return agentRigs[k].hitSphere; });
        if (blackCat3d && blackCat3d.hitSphere) targets.push(blackCat3d.hitSphere);
        var hits = raycaster3d.intersectObjects(targets);
        if (hits.length) {
          var ud = hits[0].object.userData || {};
          if (ud.catMascot) {
            show3dCatInspector();
            var ct = CAT_THOUGHTS[Math.floor(Math.random() * CAT_THOUGHTS.length)];
            triggerSpeechBubble(blackCat3d, 'Minou', ct, '#f59e0b', 4.5);
          } else if (ud.agentId) {
            show3dAgentInspector(ud.agentId);
            var agm = AGENTS.find(function (a) { return a.id === ud.agentId; });
            var pm = AGENT_PERSONAS[ud.agentId];
            if (pm && agentRigs[ud.agentId]) {
              triggerSpeechBubble(agentRigs[ud.agentId], pm.nick, pm.lines[Math.floor(Math.random() * pm.lines.length)], agm ? agm.color : '#38bdf8', 4.5);
            }
          }
        } else {
          document.getElementById('deskNodeInspector').style.display = 'none';
        }
      });

      var clk = 0;
      var lastAmbientPulseClk = 0;
      var nextSocialBanterClk = 2.5;
      var dialogueIdx = 0;
      var pipeOrder = ['analyst', 'strategist', 'risk', 'execution', 'reviewer', 'lead', 'hunter', 'sentinel'];
      var pipeStep = 0;
      var zoneKeys = Object.keys(STUDIO_ZONES);

      function updateBubblePopAnimation(ent, dt, tClk) {
        if (!ent || !ent.speechSprite || !ent.speechSprite.visible) return;
        ent.bubbleAge += dt;
        var dur = ent.bubbleDuration || 4.8;
        if (ent.bubbleAge >= dur) {
          ent.speechSprite.visible = false;
          ent.speechSprite.scale.set(0.001, 0.001, 1);
          return;
        }
        var popScale = 1.0;
        if (ent.bubbleAge < 0.34) {
          // Elastic bounce pop-up
          var p = ent.bubbleAge / 0.34;
          var c1 = 1.70158;
          var c3 = c1 + 1;
          popScale = Math.max(0.01, 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2));
        } else if (ent.bubbleAge > dur - 0.3) {
          popScale = Math.max(0.01, (dur - ent.bubbleAge) / 0.3);
        }
        ent.speechSprite.scale.set(ent.bubbleScaleW * popScale, ent.bubbleScaleH * popScale, 1);
        ent.speechSprite.position.y = ent.bubbleBaseY + Math.sin(tClk * 2.8) * 0.06;
        ent.speechSprite.material.opacity = ent.bubbleAge > dur - 0.3 ? Math.max(0, (dur - ent.bubbleAge) / 0.3) : 1.0;
      }

      function animate3d() {
        requestAnimationFrame(animate3d);
        if (currentTab !== 'desk') return;
        var dt = prefersReducedMotion ? 0.002 : 0.016;
        clk += dt;

        mouseParallaxX += (targetParallaxX - mouseParallaxX) * 0.06;
        mouseParallaxY += (targetParallaxY - mouseParallaxY) * 0.06;

        var sway = prefersReducedMotion ? 0 : Math.sin(clk * 0.14) * 0.08;
        var camAngle = yaw + sway + mouseParallaxX * 0.14;
        var effPitch = Math.max(0.18, Math.min(1.22, pitch + mouseParallaxY * 0.08));
        var camX = Math.sin(camAngle) * Math.cos(effPitch) * zoom;
        var camY = Math.sin(effPitch) * zoom;
        var camZ = Math.cos(camAngle) * Math.cos(effPitch) * zoom;
        camera3d.position.x = Math.max(-13.2, Math.min(13.2, camX));
        camera3d.position.y = Math.max(0.8, Math.min(8.6, camY));
        camera3d.position.z = Math.max(-10.2, Math.min(13.8, camZ));
        camera3d.lookAt(mouseParallaxX * 0.35, 0.25 + mouseParallaxY * -0.2, 0);

        if (!prefersReducedMotion) {
          pts3d.rotation.y += 0.0009;
          pts3d.position.y = Math.sin(clk * 0.45) * 0.12;

          if (clk - lastAmbientPulseClk > 1.8 && pulseArcs.length < 8) {
            lastAmbientPulseClk = clk;
            var fromId = pipeOrder[pipeStep % pipeOrder.length];
            var toId = pipeOrder[(pipeStep + 1 + (pipeStep % 3)) % pipeOrder.length];
            pipeStep++;
            var agMeta = AGENTS.find(function (a) { return a.id === fromId; });
            spawn3dPulse(fromId, toId, agMeta ? agMeta.color : '#38bdf8');
          }

          // Two-agent / Cat organic social conversations & pop-up bubbles outside of trading
          if (clk >= nextSocialBanterClk) {
            nextSocialBanterClk = clk + 3.4 + Math.random() * 2.2;
            var d = STUDIO_DIALOGUES[dialogueIdx % STUDIO_DIALOGUES.length];
            dialogueIdx++;
            var rigA = agentRigs[d.a];
            var metaA = AGENTS.find(function (a) { return a.id === d.a; });
            var perA = AGENT_PERSONAS[d.a];
            if (rigA) {
              triggerSpeechBubble(rigA, perA ? perA.nick : d.a, d.tA, metaA ? metaA.color : '#38bdf8', 4.6);
              // Walk Agent A toward partner / cat while talking
              if (d.b === 'cat' && blackCat3d) {
                rigA.wanderTarget.set(blackCat3d.pos.x + (Math.random() - 0.5) * 1.8, -1.5, blackCat3d.pos.z + (Math.random() - 0.5) * 1.8);
                rigA.pauseTimer = 0;
              } else if (agentRigs[d.b]) {
                rigA.wanderTarget.set(agentRigs[d.b].worldPos.x + (Math.random() - 0.5) * 2.0, -1.5, agentRigs[d.b].worldPos.z + (Math.random() - 0.5) * 2.0);
                rigA.pauseTimer = 0;
              }
            }
            (function (dialog) {
              setTimeout(function () {
                if (currentTab !== 'desk') return;
                if (dialog.b === 'cat' && blackCat3d) {
                  triggerSpeechBubble(blackCat3d, 'Minou', dialog.tB, '#f59e0b', 4.4);
                } else {
                  var rigB = agentRigs[dialog.b];
                  var metaB = AGENTS.find(function (a) { return a.id === dialog.b; });
                  var perB = AGENT_PERSONAS[dialog.b];
                  if (rigB) triggerSpeechBubble(rigB, perB ? perB.nick : dialog.b, dialog.tB, metaB ? metaB.color : '#38bdf8', 4.6);
                }
              }, 1450);
            })(d);
          }
        }

        // Autonomous Free-Roaming Movement for all 8 Distinct Agents
        AGENTS.forEach(function (ag, idx) {
          var rig = agentRigs[ag.id];
          if (!rig) return;
          var act = deskState && deskState.agentActivity && deskState.agentActivity[ag.id];
          var busy = act && act.status && act.status !== 'idle' && act.status !== 'watch';
          updateBubblePopAnimation(rig, dt, clk);

          if (!prefersReducedMotion) {
            var isWalking = rig.pauseTimer <= 0;
            if (!isWalking) {
              rig.pauseTimer -= dt;
              rig.avatar.position.y = Math.sin(clk * (busy ? 3.5 : 1.7) + idx) * 0.04;
              if (rig.legL && rig.legR) {
                rig.legL.rotation.x *= 0.85;
                rig.legR.rotation.x *= 0.85;
              }
            } else {
              var dx = rig.wanderTarget.x - rig.worldPos.x;
              var dz = rig.wanderTarget.z - rig.worldPos.z;
              var dist = Math.sqrt(dx * dx + dz * dz);
              if (dist < 0.35) {
                rig.pauseTimer = 0.8 + Math.random() * 1.4;
                // Wide studio-wide exploration so every agent noticeably walks all over the floor
                if (Math.random() < 0.28) {
                  rig.wanderTarget.set(
                    Math.max(-10, Math.min(10, rig.homePos.x + (Math.random() - 0.5) * 3.5)),
                    -1.5,
                    Math.max(-7.5, Math.min(7.5, rig.homePos.z + (Math.random() - 0.5) * 3.2))
                  );
                } else if (Math.random() < 0.65) {
                  var friendKey = zoneKeys[(idx + 1 + Math.floor(Math.random() * 6)) % zoneKeys.length];
                  var friendRig = agentRigs[friendKey];
                  var fx = friendRig ? friendRig.worldPos.x : 0;
                  var fz = friendRig ? friendRig.worldPos.z : 0;
                  rig.wanderTarget.set(
                    Math.max(-10, Math.min(10, fx + (Math.random() - 0.5) * 2.8)),
                    -1.5,
                    Math.max(-7.5, Math.min(7.5, fz + (Math.random() - 0.5) * 2.8))
                  );
                } else {
                  rig.wanderTarget.set((Math.random() - 0.5) * 19, -1.5, (Math.random() - 0.5) * 14);
                }
              } else {
                var spd = (rig.moveSpeed || 0.048) * (busy ? 1.25 : 1.0);
                rig.worldPos.x += (dx / dist) * spd;
                rig.worldPos.z += (dz / dist) * spd;
                var targetRot = Math.atan2(dx, dz);
                rig.avatar.rotation.y += Math.sin(targetRot - rig.avatar.rotation.y) * 0.14;
                var stride = clk * (ag.id === 'execution' ? 11.5 : 8.2) + idx;
                rig.avatar.position.y = Math.abs(Math.sin(stride)) * 0.06;
                if (rig.legL && rig.legR) {
                  rig.legL.rotation.x = Math.sin(stride) * 0.52;
                  rig.legR.rotation.x = -Math.sin(stride) * 0.52;
                }
              }
            }

            if (rig.headGroup) {
              rig.headGroup.rotation.y = Math.sin(clk * 1.4 + idx) * 0.24;
            }
            if (rig.armL && rig.armR) {
              var swing = isWalking ? Math.sin(clk * 8.2 + idx) * 0.55 : Math.sin(clk * (busy ? 5.5 : 1.9) + idx) * 0.20;
              rig.armL.rotation.x = swing;
              rig.armR.rotation.x = -swing;
            }
            if (rig.holoScreens && rig.holoScreens.length) {
              rig.holoScreens.forEach(function (hs, si) {
                if (ag.id === 'strategist' && si === 0) {
                  hs.rotation.y += 0.015;
                  hs.rotation.x += 0.008;
                } else {
                  hs.position.y += Math.sin(clk * 2.0 + si + idx) * 0.0014;
                }
              });
            }
          }

          rig.padRing.scale.setScalar(busy && !prefersReducedMotion ? 1.15 + Math.sin(clk * 5) * 0.08 : 1.0);
          rig.padRing.material.opacity = busy ? 0.92 : 0.42;

          if (rig.sentinelLed && deskState && deskState.sentinel) {
            var st = deskState.sentinel;
            var ledColor = (st.latencyHalted || deskState.halted) ? 0xf43f5e : (st.rollingRttMs >= 100 ? 0xfacc15 : 0x10b981);
            rig.sentinelLed.material.color.setHex(ledColor);
            rig.sentinelLed.material.emissive.setHex(ledColor);
            rig.sentinelLed.material.emissiveIntensity = (st.latencyHalted || deskState.halted) ? (0.5 + 1.8 * Math.abs(Math.sin(clk * 8))) : 1.6;
          }

          if (rig.l2Bars && rig.l2Bars.length && deskState && deskState.liquidityHunter && deskState.liquidityHunter.heatBars) {
            var hb = deskState.liquidityHunter.heatBars;
            for (var li = 0; li < rig.l2Bars.length; li++) {
              var scaleY = Math.max(0.2, Number(hb[li] || 0.35) * 1.45);
              rig.l2Bars[li].scale.y = scaleY;
              rig.l2Bars[li].position.y = 0.2 + scaleY * 0.36;
            }
          }
        });

        // Autonomous Free-Roaming Articulated Black Cat Animation + Cat Bubbles
        if (blackCat3d) {
          updateBubblePopAnimation(blackCat3d, dt, clk);
          if (!prefersReducedMotion) {
            if (blackCat3d.pauseTimer > 0) {
              blackCat3d.pauseTimer -= dt;
              blackCat3d.head.rotation.y = Math.sin(clk * 1.3) * 0.28;
              blackCat3d.head.rotation.z = Math.sin(clk * 0.8) * 0.07;
              blackCat3d.earL.rotation.z = 0.26 + (Math.sin(clk * 7.5) > 0.92 ? 0.14 : 0);
              blackCat3d.legFL.rotation.x *= 0.85;
              blackCat3d.legFR.rotation.x *= 0.85;
              blackCat3d.legBL.rotation.x *= 0.85;
              blackCat3d.legBR.rotation.x *= 0.85;
              blackCat3d.tailBase.rotation.z = Math.sin(clk * 2.4) * 0.38;
              blackCat3d.tailMid.rotation.z = Math.sin(clk * 2.4 - 0.6) * 0.42;
            } else {
              var cdx = blackCat3d.target.x - blackCat3d.pos.x;
              var cdz = blackCat3d.target.z - blackCat3d.pos.z;
              var cdist = Math.sqrt(cdx * cdx + cdz * cdz);
              if (cdist < 0.35) {
                blackCat3d.pauseTimer = 0.9 + Math.random() * 1.5;
                if (Math.random() < 0.55) {
                  var vk = zoneKeys[Math.floor(Math.random() * zoneKeys.length)];
                  var vrig = agentRigs[vk];
                  if (vrig) {
                    blackCat3d.target.set(
                      Math.max(-9.5, Math.min(9.5, vrig.worldPos.x + (Math.random() - 0.5) * 1.4)),
                      -1.5,
                      Math.max(-7.2, Math.min(7.2, vrig.worldPos.z + (Math.random() - 0.5) * 1.4))
                    );
                    var vag = AGENT_PERSONAS[vk];
                    blackCat3d.mood = 'Court retrouver ' + (vag ? vag.nick : vk);
                  }
                } else {
                  blackCat3d.target.set((Math.random() - 0.5) * 18, -1.5, (Math.random() - 0.5) * 13);
                  blackCat3d.mood = 'Explore librement le studio 3D';
                }
              } else {
                var cSpd = 0.056;
                blackCat3d.pos.x += (cdx / cdist) * cSpd;
                blackCat3d.pos.z += (cdz / cdist) * cSpd;
                blackCat3d.group.position.copy(blackCat3d.pos);
                var wantRot = Math.atan2(cdx, cdz);
                blackCat3d.group.rotation.y += Math.sin(wantRot - blackCat3d.group.rotation.y) * 0.16;
                var g = clk * 12.0;
                blackCat3d.legFL.rotation.x = Math.sin(g) * 0.58;
                blackCat3d.legBR.rotation.x = Math.sin(g) * 0.58;
                blackCat3d.legFR.rotation.x = -Math.sin(g) * 0.58;
                blackCat3d.legBL.rotation.x = -Math.sin(g) * 0.58;
                blackCat3d.group.position.y = -1.5 + Math.abs(Math.sin(g)) * 0.04;
                blackCat3d.tailBase.rotation.z = Math.sin(clk * 4.8) * 0.28;
                blackCat3d.tailMid.rotation.z = Math.sin(clk * 4.8 - 0.8) * 0.34;
              }
            }
          }
        }

        // Profit coin bursts animation
        for (var pbi = profitBursts3d.length - 1; pbi >= 0; pbi--) {
          var pb = profitBursts3d[pbi];
          pb.life -= 0.018;
          if (pb.life <= 0) {
            scene3d.remove(pb.mesh);
            profitBursts3d.splice(pbi, 1);
          } else {
            pb.mesh.position.y += pb.vy;
            pb.mesh.position.x += pb.vx;
            pb.mesh.position.z += pb.vz;
            pb.mesh.rotation.y += 0.12;
            pb.mesh.material.opacity = Math.max(0, pb.life);
          }
        }

        // Animate inter-agent pulses
        for (var pi = pulseArcs.length - 1; pi >= 0; pi--) {
          var p = pulseArcs[pi];
          p.t += 0.024;
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
          if (pts3d) pts3d.material.color.set(prefs.accent);
        }
      } catch (e) {}
    }

    function update3dAgentSpritesAndPulses() {
      if (!deskState || !scene3d) return;
      AGENTS.forEach(function (ag) {
        var rig = agentRigs[ag.id];
        if (!rig) return;
        var act = deskState.agentActivity && deskState.agentActivity[ag.id];
        var lbl = (act && act.status ? act.status : 'idle').toUpperCase();
        var per = AGENT_PERSONAS[ag.id];
        var dispTitle = per ? (per.nick.toUpperCase() + ' · ' + ag.name.toUpperCase()) : ag.name.toUpperCase();
        if (lbl !== rig.lastLabel) {
          rig.lastLabel = lbl;
          rig.sprite.material.map.dispose();
          rig.sprite.material.map = makeNameplateTexture(dispTitle, lbl, ag.color);
          rig.sprite.material.needsUpdate = true;
        }
      });

      var wins = (deskState.tickets || []).filter(function (t) { return t.status === 'closed' && (t.pnl || 0) > 0; });
      if (lastClosedProfitCount >= 0 && wins.length > lastClosedProfitCount) {
        var execRig = agentRigs['execution'];
        var stratRig = agentRigs['strategist'];
        var lastWin = wins[wins.length - 1];
        if (execRig) {
          spawnProfitBurst(execRig.worldPos, lastWin ? lastWin.pnl : 50);
          triggerSpeechBubble(execRig, 'Kira', 'Belle exécution ! +' + Number(lastWin?.pnl || 0).toFixed(0) + ' €', '#10b981', 4.5);
        }
        if (stratRig) spawnProfitBurst(stratRig.worldPos, lastWin ? lastWin.pnl : 50);
      }
      lastClosedProfitCount = wins.length;

      var pulses = deskState.pulses || [];
      if (pulses.length && pulses[0].id !== lastPulseNonce) {
        lastPulseNonce = pulses[0].id;
        spawn3dPulse(pulses[0].from, pulses[0].to, '#38bdf8');
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

    function show3dCatInspector() {
      var el = document.getElementById('deskNodeInspector');
      if (!el) return;
      el.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<strong style="color:#f59e0b">Minou · Chat Noir du Studio</strong>' +
        '<span class="mono" style="font-size:10px;color:var(--up)">ACTIF</span></div>' +
        '<div style="color:var(--fg-1)">' + (blackCat3d && blackCat3d.mood ? blackCat3d.mood : 'Se promène sur le desk') + '</div>';
      el.style.display = 'block';
    }

    function show3dAgentInspector(agentId) {
      var el = document.getElementById('deskNodeInspector');
      var ag = AGENTS.find(function (a) { return a.id === agentId; });
      if (!ag || !el) return;
      var act = deskState && deskState.agentActivity && deskState.agentActivity[agentId];
      var per = AGENT_PERSONAS[agentId];
      el.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
        '<strong style="color:' + ag.color + '">' + (per ? per.nick + ' · ' : '') + ag.name + '</strong>' +
        '<span class="mono" style="font-size:10px;color:var(--fg-2)">' + (act ? act.status : 'idle') + '</span></div>' +
        (per && per.hobby ? '<div style="font-size:10.5px;color:var(--accent);margin-bottom:4px">' + per.hobby + '</div>' : '') +
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
      chatAutoScroll = true;
      updateChatAutoScrollBtn();
      sendCmd(txt);
      scrollChatToBottom(true);
    }

    function toggleExecutionMode() {
      var isAuto = deskState && deskState.settings && (deskState.settings.executionMode === 'auto' || Boolean(deskState.settings.autoPaperScalp));
      sendCmd(isAuto ? 'mode confirmation' : 'mode auto');
    }

    function toggleAssetDropdown() {
      var menu = document.getElementById('assetDropdownMenu');
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }

    function toggleCategoryAssets(catId, select) {
      var container = document.getElementById('cat-body-' + catId);
      if (!container) return;
      var chks = container.querySelectorAll('.asset-chk');
      chks.forEach(function (c) { c.checked = select; });
    }

    function updateToggleAllAssetsLabel() {
      var btn = document.getElementById('btnToggleAllAssets');
      if (!btn) return;
      var chks = Array.from(document.querySelectorAll('.asset-chk'));
      var allChecked = chks.length > 0 && chks.every(function (c) { return c.checked; });
      btn.textContent = allChecked ? 'Tout Désactiver' : 'Tout Activer';
      btn.classList.toggle('active', allChecked);
    }

    function toggleAllAssetsSelection() {
      var chks = Array.from(document.querySelectorAll('.asset-chk'));
      if (!chks.length) return;
      var allChecked = chks.every(function (c) { return c.checked; });
      chks.forEach(function (c) { c.checked = !allChecked; });
      updateToggleAllAssetsLabel();
    }

    function selectAllAssets() {
      document.querySelectorAll('.asset-chk').forEach(function (c) { c.checked = true; });
      updateToggleAllAssetsLabel();
    }

    function deselectAllAssets() {
      document.querySelectorAll('.asset-chk').forEach(function (c) { c.checked = false; });
      updateToggleAllAssetsLabel();
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
    var chatAutoScroll = true;
    var lastChatRenderSig = '';
    var chatScrollListenerAttached = false;

    function updateChatAutoScrollBtn() {
      var btn = document.getElementById('btnChatAutoScroll');
      if (!btn) return;
      btn.textContent = chatAutoScroll ? 'Auto-défilement : ACTIF' : 'Auto-défilement : PAUSE';
      btn.classList.toggle('auto-on', chatAutoScroll);
    }

    function scrollChatToBottom(force) {
      var host = document.getElementById('chatMessages');
      if (!host) return;
      if (!force && !chatAutoScroll) return;
      host.scrollTop = host.scrollHeight;
      requestAnimationFrame(function () {
        var h = document.getElementById('chatMessages');
        if (h && (force || chatAutoScroll)) h.scrollTop = h.scrollHeight;
      });
    }

    function toggleChatAutoScroll() {
      chatAutoScroll = !chatAutoScroll;
      updateChatAutoScrollBtn();
      if (chatAutoScroll) scrollChatToBottom(true);
    }

    function ensureChatScrollWatcher() {
      if (chatScrollListenerAttached) return;
      var host = document.getElementById('chatMessages');
      if (!host) return;
      chatScrollListenerAttached = true;
      host.addEventListener('scroll', function () {
        if (currentTab !== 'chat') return;
        var distFromBottom = host.scrollHeight - host.scrollTop - host.clientHeight;
        if (distFromBottom > 90 && chatAutoScroll) {
          chatAutoScroll = false;
          updateChatAutoScrollBtn();
        } else if (distFromBottom <= 32 && !chatAutoScroll) {
          chatAutoScroll = true;
          updateChatAutoScrollBtn();
        }
      }, { passive: true });
    }

    function selectChatChannel(ch) {
      activeChannel = ch;
      document.querySelectorAll('.chan-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-chan') === ch);
      });
      document.getElementById('activeChanTitle').textContent = '# ' + ch;
      renderChat(true);
    }

    function classifyMessageChannel(m) {
      var txt = (m.text || '').toUpperCase();
      if (m.speaker === 'sentinel' || txt.indexOf('SYS_OPS') >= 0 || txt.indexOf('LATENCY') >= 0 || txt.indexOf('TOKENBUCKET') >= 0) {
        return 'sys-ops';
      }
      if (m.speaker === 'hunter' || txt.indexOf('LIQUIDITY_L2') >= 0 || txt.indexOf('SPOOFING') >= 0 || txt.indexOf('SQUEEZE') >= 0 || txt.indexOf('DÉSÉQUILIBRE L2') >= 0 || txt.indexOf('AIMANT') >= 0) {
        return 'liquidity-l2';
      }
      if (m.speaker === 'risk' || m.tone === 'veto' || m.tone === 'kill' || txt.indexOf('VETO') >= 0 || txt.indexOf('HALT') >= 0 || txt.indexOf('EMERGENCY') >= 0 || txt.indexOf('LEVIER') >= 0 || txt.indexOf('LIQUIDATION') >= 0 || txt.indexOf('STOP-LOSS') >= 0) {
        return 'risk-veto';
      }
      if (m.speaker === 'analyst' || txt.indexOf('MACRO_ALERT') >= 0 || txt.indexOf('MACROSCORE') >= 0 || txt.indexOf('MACRO FILTER') >= 0 || txt.indexOf('VOLATILITY_SHIELD') >= 0 || txt.indexOf('COPY_SIGNAL') >= 0) {
        return 'macro-alerts';
      }
      if (m.speaker === 'reviewer' || txt.indexOf('GRPO') >= 0 || txt.indexOf('RL_OPTIMIZER') >= 0 || txt.indexOf('WFO') >= 0 || m.tone === 'report') {
        return 'rl-optimizer';
      }
      return 'floor-general';
    }

    function toggleAgentFilter(id) {
      agentFilter = agentFilter === id ? null : id;
      renderChat(true);
    }

    function fmtCountdown15m(lastAt) {
      if (!lastAt) return 'imminent';
      var remMs = Math.max(0, 15 * 60 * 1000 - (Date.now() - Number(lastAt)));
      if (remMs <= 1000) return 'imminent';
      var m = Math.floor(remMs / 60000);
      var s = Math.floor((remMs % 60000) / 1000);
      return m + 'm ' + String(s).padStart(2, '0') + 's';
    }

    async function triggerSelfReflectionNow() {
      var btns = document.querySelectorAll('.btn-trigger-review15m');
      btns.forEach(function (b) { b.disabled = true; b.textContent = 'Review en cours...'; });
      try {
        var res = await fetch('/api/self-reflection', { method: 'POST' });
        var out = await res.json();
        if (out && out.ok && deskState) {
          deskState.current_market_regime_directive = out.directive;
          deskState.selfReflectionHistory = out.history || deskState.selfReflectionHistory;
          deskState.lastSelfReflectionAt = out.lastSelfReflectionAt || Date.now();
          renderReviewerBanner();
          renderRlMetrics();
          renderChat(true);
        }
      } catch (e) {
      } finally {
        btns.forEach(function (b) { b.disabled = false; b.textContent = 'Lancer Review 15m'; });
      }
    }

    function renderReviewerBanner() {
      var box = document.getElementById('chatReviewerBanner');
      if (!box || !deskState) return;
      var hist = Array.isArray(deskState.selfReflectionHistory) ? deskState.selfReflectionHistory.slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); }) : [];
      var latest = hist.length ? hist[0] : null;
      var directive = (latest && latest.directive) || deskState.current_market_regime_directive || 'En attente de la première review 15 min du Trade Reviewer...';
      var tsLabel = (latest && latest.at) ? new Date(latest.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : (deskState.lastSelfReflectionAt ? new Date(deskState.lastSelfReflectionAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--');
      var statsTag = latest
        ? (latest.tradesAnalyzed + ' trades · ' + latest.wins + 'W/' + latest.losses + 'L · PnL ' + (latest.netPnl >= 0 ? '+' : '') + Number(latest.netPnl || 0).toFixed(2) + '€')
        : 'Initialisation';
      box.innerHTML =
        '<div style="flex:1;min-width:240px">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
            '<span class="mono" style="font-size:10px;font-weight:700;color:#c084fc;letter-spacing:.04em">TRADE REVIEWER 15M · MAJ ' + escHtml(tsLabel) + '</span>' +
            '<span class="mono" style="font-size:10px;color:var(--fg-2)">' + escHtml(statsTag) + '</span>' +
            '<span class="mono" style="font-size:10px;color:var(--fg-3)">Prochain cycle : ' + escHtml(fmtCountdown15m(deskState.lastSelfReflectionAt)) + '</span>' +
          '</div>' +
          '<div style="font-size:11.5px;color:var(--fg-0);margin-top:2px;line-height:1.35">' + escHtml(directive) + '</div>' +
        '</div>' +
        '<button type="button" class="pill-btn btn-trigger-review15m" style="font-size:10.5px;padding:4px 10px" onclick="triggerSelfReflectionNow()">Lancer Review 15m</button>';
    }

    function renderChat(forceScroll) {
      if (!deskState) return;
      ensureChatScrollWatcher();
      renderReviewerBanner();
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
        var allBtn = '<button class="agent-chip' + (!agentFilter ? ' active' : '') + '" onclick="agentFilter=null;renderChat(true)">Tous (8)</button>';
        afHost.innerHTML = allBtn + AGENTS.map(function (a) {
          var cls = 'agent-chip' + (agentFilter === a.id ? ' active' : '');
          return '<button class="' + cls + '" title="' + (a.role || '') + '" onclick="toggleAgentFilter(&quot;' + a.id + '&quot;)">' + a.name + '</button>';
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
      var shown = filtered.slice(-80);
      var lastItem = shown[shown.length - 1];
      var sig = activeChannel + '|' + (agentFilter || '') + '|' + shown.length + '|' + (lastItem ? (lastItem.at + ':' + String(lastItem.text || '').length) : '');
      if (sig === lastChatRenderSig && !forceScroll) return;
      lastChatRenderSig = sig;
      host.innerHTML = shown.map(function (m) {
        var ag = AGENTS.find(function (a) { return a.id === m.speaker; });
        var promptCfg = deskState && deskState.agentPrompts && deskState.agentPrompts[m.speaker];
        var name = m.speaker === 'human' ? 'Opérateur Humain' : (ag ? ag.name : m.speaker);
        var roleTag = m.speaker === 'human' ? '' : ((promptCfg && promptCfg.roleTitle) || (ag && ag.role) || '');
        var short = m.speaker === 'human' ? 'HU' : (ag ? ag.short : 'AI');
        var color = m.speaker === 'human' ? '#38bdf8' : (ag ? ag.color : '#94a3b8');
        var ts = new Date(m.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        var cls = 'msg-bubble' + (m.speaker === 'human' ? ' human' : m.tone === 'veto' || m.tone === 'kill' ? ' veto' : m.tone === 'fill' ? ' fill' : '');
        var safeTxt = String(m.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>');
        return (
          '<div class="' + cls + '">' +
          '<div class="msg-avatar" style="background:' + color + '22;color:' + color + ';border-color:' + color + '55">' + short + '</div>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:4px">' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
            '<strong style="font-size:12px;color:' + color + '">' + name + '</strong>' +
            (roleTag ? '<span class="mono" style="font-size:9.5px;color:var(--fg-3);border:1px solid rgba(255,255,255,0.08);padding:1px 6px;border-radius:999px">' + escHtml(roleTag) + '</span>' : '') +
          '</div>' +
          '<span class="mono" style="font-size:10px;color:var(--fg-3)">' + ts + '</span>' +
          '</div>' +
          '<div style="font-size:12px;line-height:1.48;color:var(--fg-1);word-break:break-word">' + safeTxt + '</div>' +
          '</div></div>'
        );
      }).join('');
      if (chatAutoScroll || forceScroll) {
        scrollChatToBottom(Boolean(forceScroll));
      }
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
    var chartEngine = 'desk';
    var activeTimeframe = '15m';
    var chartBarsCache = [];
    var chartProfileCache = {};
    var lastChartExecSig = '';
    var lastChartLoadedKey = '';
    var chartLiveTimer = null;
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
        return '<button class="tf-btn fav' + (activeTimeframe === id ? ' active' : '') + '" onclick="setChartTimeframe(&quot;' + id + '&quot;)" title="Favori"> ' + lbl + '</button>';
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
        starBtn.textContent = isFav ? 'Favori ON' : 'Favori';
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
      ensureChartLiveTimer();
      refreshChartData({ fit: true });
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

    function renderPinnedChartPositions() {
      var host = document.getElementById('chartPinnedPositionsBar');
      if (!host) return;
      var open = deskState && Array.isArray(deskState.tickets)
        ? deskState.tickets.filter(function (t) { return t.status === 'open'; })
        : [];
      if (!open.length) {
        host.innerHTML = '<span style="font-size:10.5px;color:var(--fg-3);font-weight:600">Positions ouvertes épinglées : Aucune position active</span>';
        return;
      }
      var activeSym = getActiveChartSymbol();
      var html = '<span style="font-size:10px;color:var(--fg-2);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap">Épinglées (' + open.length + ') :</span>';
      open.forEach(function (t) {
        var fill = t.fillPrice || t.entry;
        var mark = t.mt5CurrentPrice || tapePriceOf(t.asset, fill);
        var sign = t.direction === 'long' ? 1 : -1;
        var livePnl = t.mt5Profit !== undefined ? t.mt5Profit : ((sign * (mark - fill) * (t.notional || 0)) / Math.max(fill, 1e-9));
        var isSel = activeSym === t.asset;
        var pnlCls = livePnl >= 0 ? 'up' : 'down';
        var beBadge = (t.progressiveStopUsd && t.progressiveStopUsd > 0) ? '<span class="mono up" style="font-size:9px">BE +' + Number(t.progressiveStopUsd).toFixed(0) + '</span>' : '';
        html +=
          '<button type="button" class="pinned-pos-btn' + (isSel ? ' active' : '') + '" onclick="selectChartSymbol(&quot;' + t.asset + '&quot;)" title="Ouvrir le graphique de ' + t.asset + '">' +
          '<strong>' + t.asset + '</strong>' +
          '<span class="' + (t.direction === 'long' ? 'up' : 'down') + '" style="font-size:9.5px">' + t.direction.toUpperCase() + '</span>' +
          '<span class="mono ' + pnlCls + '">' + fmtSignedUsd(livePnl, 2) + '</span>' +
          beBadge +
          '</button>';
      });
      host.innerHTML = html;
    }

    function selectChartSymbol(sym) {
      var sel = document.getElementById('chartSymbolSelect');
      if (sel) {
        var hasOpt = Array.from(sel.options).some(function (o) { return o.value === sym; });
        if (!hasOpt) {
          var opt = document.createElement('option');
          opt.value = sym;
          opt.textContent = sym;
          sel.appendChild(opt);
        }
        sel.value = sym;
      }
      onChartSymbolChange();
    }

    function onChartSymbolChange() {
      loadDrawingsForSymbol(getActiveChartSymbol());
      renderPinnedChartPositions();
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

    function ensureChartLiveTimer() {
      if (chartLiveTimer) {
        clearInterval(chartLiveTimer);
        chartLiveTimer = null;
      }
      if (currentTab === 'charts' && chartEngine === 'desk') {
        chartLiveTimer = setInterval(function () {
          if (currentTab !== 'charts' || chartEngine !== 'desk') {
            clearInterval(chartLiveTimer);
            chartLiveTimer = null;
            return;
          }
          refreshChartData({ fit: false });
        }, activeTimeframe === '1s' || activeTimeframe === '1m' ? 2500 : 5000);
      }
    }

    function initChartTab() {
      renderTimeframeStrip();
      loadDrawingsForSymbol(getActiveChartSymbol());
      renderMarketProfilePanel(getActiveChartSymbol());
      resizeDrawCanvas();
      ensureChartLiveTimer();
      if (chartEngine === 'tv') {
        initTradingViewWidget();
        refreshChartData({ fit: true });
      } else if (lwChart && lwCandleSeries) {
        refreshChartData({ fit: true });
      } else {
        initOrRefreshLwChart();
      }
    }

    function disposeLwChart() {
      if (lwResizeObs) { try { lwResizeObs.disconnect(); } catch (e) {} lwResizeObs = null; }
      lwPriceLines = [];
      lwMpLines = [];
      if (lwChart) { try { lwChart.remove(); } catch (e) {} lwChart = null; }
      lwCandleSeries = null;
      lwVolSeries = null;
      lwEma20Series = null;
      lwEma50Series = null;
      lwVwapSeries = null;
    }

    function getSymbolPriceFormat(sym, refPx) {
      var s = String(sym || '').toUpperCase();
      if (/JPY/.test(s)) return { type: 'price', precision: 3, minMove: 0.001 };
      if (/^(EUR|GBP|USD|AUD|NZD|CAD|CHF){2}$/.test(s)) return { type: 'price', precision: 5, minMove: 0.00001 };
      var px = Number(refPx || 0);
      if (px > 0 && px < 0.01) return { type: 'price', precision: 6, minMove: 0.000001 };
      if (px > 0 && px < 10) return { type: 'price', precision: 4, minMove: 0.0001 };
      return { type: 'price', precision: 2, minMove: 0.01 };
    }

    function tfDurationSec(tf) {
      var m = /^(\d+)(s|m|h|d|j|w|M|sem|mois)$/.exec(String(tf || '15m').trim());
      if (!m) return 900;
      var q = Math.max(1, Number(m[1]));
      var u = m[2];
      if (u === 's') return q;
      if (u === 'm') return q * 60;
      if (u === 'h') return q * 3600;
      if (u === 'd' || u === 'j') return q * 86400;
      if (u === 'w' || u === 'sem') return q * 7 * 86400;
      return q * 30 * 86400;
    }

    function fmtChartPx(v, sym, refPx) {
      var pf = getSymbolPriceFormat(sym, refPx || v);
      var n = Number(v || 0);
      if (!Number.isFinite(n) || n === 0) return '--';
      return n.toFixed(pf.precision);
    }

    function renderChartOhlcvLegend(bar, timeVal) {
      var el = document.getElementById('chartOhlcvLegend');
      if (!el) return;
      var sym = getActiveChartSymbol();
      var b = bar || (chartBarsCache && chartBarsCache.length ? chartBarsCache[chartBarsCache.length - 1] : null);
      if (!b) { el.innerHTML = '<span>--</span>'; return; }
      var diffPct = b.open > 0 ? ((b.close - b.open) / b.open) * 100 : 0;
      var cls = diffPct >= 0 ? 'up' : 'down';
      var tRef = timeVal || b.time;
      var e20 = chartEma20Cache.find(function (x) { return x.time === tRef; }) || chartEma20Cache[chartEma20Cache.length - 1];
      var e50 = chartEma50Cache.find(function (x) { return x.time === tRef; }) || chartEma50Cache[chartEma50Cache.length - 1];
      var vw = chartVwapCache.find(function (x) { return x.time === tRef; }) || chartVwapCache[chartVwapCache.length - 1];
      var pfRef = b.close;
      el.innerHTML =
        '<strong>' + escHtml(sym) + ' · ' + escHtml(activeTimeframe) + '</strong>' +
        '<span>O <b>' + fmtChartPx(b.open, sym, pfRef) + '</b></span>' +
        '<span>H <b>' + fmtChartPx(b.high, sym, pfRef) + '</b></span>' +
        '<span>L <b>' + fmtChartPx(b.low, sym, pfRef) + '</b></span>' +
        '<span>C <b class="' + cls + '">' + fmtChartPx(b.close, sym, pfRef) + ' (' + (diffPct >= 0 ? '+' : '') + diffPct.toFixed(2) + '%)</b></span>' +
        (e20 ? '<span style="color:#38bdf8">EMA20 ' + fmtChartPx(e20.value, sym, pfRef) + '</span>' : '') +
        (e50 ? '<span style="color:#f59e0b">EMA50 ' + fmtChartPx(e50.value, sym, pfRef) + '</span>' : '') +
        (vw ? '<span style="color:#c084fc">VWAP ' + fmtChartPx(vw.value, sym, pfRef) + '</span>' : '') +
        '<span>RSI14 <b>' + Number(chartLastRsi14 || 50).toFixed(1) + '</b></span>' +
        (chartLastAtr14 > 0 ? '<span>ATR ' + fmtChartPx(chartLastAtr14, sym, pfRef) + '</span>' : '');
    }

    function fitChartToContent() {
      if (lwChart && typeof lwChart.timeScale === 'function') {
        try { lwChart.timeScale().fitContent(); } catch (e) {}
      }
    }

    function toggleChartIndicator(kind) {
      if (kind === 'ema') chartShowEma = !chartShowEma;
      else if (kind === 'vwap') chartShowVwap = !chartShowVwap;
      else if (kind === 'mp') chartShowMp = !chartShowMp;
      var btnEma = document.getElementById('btnIndEma');
      var btnVwap = document.getElementById('btnIndVwap');
      var btnMp = document.getElementById('btnIndMp');
      if (btnEma) btnEma.classList.toggle('primary', chartShowEma);
      if (btnVwap) btnVwap.classList.toggle('primary', chartShowVwap);
      if (btnMp) btnMp.classList.toggle('primary', chartShowMp);
      if (lwEma20Series) { try { lwEma20Series.applyOptions({ visible: chartShowEma }); } catch (e) {} }
      if (lwEma50Series) { try { lwEma50Series.applyOptions({ visible: chartShowEma }); } catch (e) {} }
      if (lwVwapSeries) { try { lwVwapSeries.applyOptions({ visible: chartShowVwap }); } catch (e) {} }
      lastChartExecSig = '';
      syncChartExecutionOverlays();
    }

    async function initOrRefreshLwChart() {
      var cont = document.getElementById('lwChartContainer');
      if (!cont || typeof LightweightCharts === 'undefined') return;
      disposeLwChart();

      var sym = getActiveChartSymbol();
      var refPx = tapePriceOf(sym, 0);
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
        crosshair: { mode: LightweightCharts.CrosshairMode ? LightweightCharts.CrosshairMode.Normal : 0 },
        timeScale: { borderColor: bordCol, timeVisible: true, secondsVisible: activeTimeframe === '1s' },
        rightPriceScale: { borderColor: bordCol, scaleMargins: { top: 0.10, bottom: 0.18 } }
      });

      lwCandleSeries = lwChart.addCandlestickSeries({
        upColor: t.up || '#10b981', downColor: t.down || '#f43f5e',
        borderUpColor: t.up || '#10b981', borderDownColor: t.down || '#f43f5e',
        wickUpColor: t.up || '#10b981', wickDownColor: t.down || '#f43f5e',
        priceFormat: getSymbolPriceFormat(sym, refPx)
      });
      lwEma20Series = lwChart.addLineSeries({
        color: '#38bdf8', lineWidth: 1, visible: chartShowEma,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false
      });
      lwEma50Series = lwChart.addLineSeries({
        color: '#f59e0b', lineWidth: 1, visible: chartShowEma,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false
      });
      lwVwapSeries = lwChart.addLineSeries({
        color: '#c084fc', lineWidth: 1, lineStyle: 2, visible: chartShowVwap,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false
      });
      lwVolSeries = lwChart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: ''
      });
      try {
        lwVolSeries.priceScale().applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
      } catch (e) {}

      lwChart.subscribeCrosshairMove(function (param) {
        if (!param || !param.time || !param.seriesData) {
          renderChartOhlcvLegend(null, null);
          return;
        }
        var d = param.seriesData.get(lwCandleSeries);
        if (d) renderChartOhlcvLegend(d, param.time);
        else renderChartOhlcvLegend(null, null);
      });

      lwResizeObs = new ResizeObserver(function (entries) {
        if (!lwChart || !entries.length) return;
        var cr = entries[0].contentRect;
        if (cr.width > 0 && cr.height > 0) {
          lwChart.applyOptions({ width: cr.width, height: Math.max(420, cr.height) });
        }
        resizeDrawCanvas();
      });
      lwResizeObs.observe(cont);

      await refreshChartData({ fit: true });
    }

    function renderMarketProfilePanel(sym) {
      var symEl = document.getElementById('mpSymbolBadge');
      var stEl = document.getElementById('mpStatusBadge');
      var pocEl = document.getElementById('mpPocVal');
      var vahEl = document.getElementById('mpVahVal');
      var valEl = document.getElementById('mpValVal');
      var histEl = document.getElementById('mpVolumeHistogram');
      if (symEl) symEl.textContent = sym || '--';
      var stateMp = deskState && deskState.marketProfiles && deskState.marketProfiles[sym];
      var cachedMp = chartProfileCache && chartProfileCache[sym];
      var mp = (cachedMp && Array.isArray(cachedMp.bins) && cachedMp.bins.length)
        ? cachedMp
        : (stateMp || cachedMp);
      if (!mp) {
        if (stEl) {
          stEl.textContent = 'STATUS: EN ATTENTE';
          stEl.style.color = 'var(--fg-2)';
          stEl.style.borderColor = 'rgba(255,255,255,0.1)';
        }
        if (pocEl) pocEl.textContent = '--';
        if (vahEl) vahEl.textContent = '--';
        if (valEl) valEl.textContent = '--';
        if (histEl) histEl.innerHTML = '<span style="font-size:11px;color:var(--fg-3)">En attente des données de session...</span>';
        return;
      }
      if (pocEl) pocEl.textContent = fmtPx(mp.poc);
      if (vahEl) vahEl.textContent = fmtPx(mp.vah);
      if (valEl) valEl.textContent = fmtPx(mp.val);
      if (stEl) {
        var inRange = Boolean(mp.isRange);
        stEl.textContent = inRange ? 'STATUS: IN RANGE' : 'STATUS: IMBALANCE/TRENDING';
        stEl.style.color = inRange ? '#38bdf8' : '#facc15';
        stEl.style.borderColor = inRange ? 'rgba(56,189,248,0.4)' : 'rgba(250,204,21,0.4)';
      }
      if (histEl) {
        var bins = Array.isArray(mp.bins) ? mp.bins.slice().sort(function (a, b) { return b.price - a.price; }) : [];
        if (!bins.length) {
          histEl.innerHTML = '<span style="font-size:11px;color:var(--fg-3)">Histogramme indisponible</span>';
        } else {
          var maxVol = bins.reduce(function (m, b) { return Math.max(m, Number(b.volume || 0)); }, 1e-9);
          histEl.innerHTML = bins.map(function (b) {
            var wPct = Math.max(4, Math.round((Number(b.volume || 0) / maxVol) * 100));
            var barColor = b.isPoc ? '#facc15' : b.inValueArea ? '#38bdf8' : 'rgba(148,163,184,0.45)';
            var txtColor = b.isPoc ? '#facc15' : b.inValueArea ? '#7dd3fc' : 'var(--fg-3)';
            return (
              '<div class="mp-bar-row" title="Prix ' + fmtPx(b.price) + ' · Vol ' + Number(b.volume || 0).toFixed(1) + '">' +
                '<span style="width:62px;text-align:right;color:' + txtColor + ';font-weight:' + (b.isPoc ? '700' : '500') + '">' + fmtPx(b.price) + '</span>' +
                '<div class="mp-bar-track"><div class="mp-bar-fill" style="width:' + wPct + '%;background:' + barColor + '"></div></div>' +
              '</div>'
            );
          }).join('');
        }
      }
    }

    function snapTsToBarTime(tsMs, bars) {
      if (!bars || !bars.length || !tsMs) return null;
      var targetSec = Math.floor(Number(tsMs) / 1000);
      if (targetSec < bars[0].time || targetSec > bars[bars.length - 1].time + 3600) {
        return bars[bars.length - 1].time;
      }
      var best = bars[0].time;
      for (var i = 0; i < bars.length; i++) {
        if (bars[i].time <= targetSec) best = bars[i].time;
        else break;
      }
      return best;
    }

    function syncChartExecutionOverlays() {
      var sym = getActiveChartSymbol();
      renderMarketProfilePanel(sym);
      if (!lwCandleSeries || !lwChart || !deskState) return;
      var tickets = Array.isArray(deskState.tickets) ? deskState.tickets : [];
      var openTk = tickets.filter(function (tk) { return tk.status === 'open' && tk.asset === sym; });
      var closedTk = tickets.filter(function (tk) { return tk.status === 'closed' && tk.asset === sym; }).slice(-20);
      var execTs = (deskState.executionTraderState && deskState.executionTraderState.updatedAt) || 0;
      var sig = sym + '|' + execTs + '|' + openTk.map(function (t) {
        return t.id + ':' + (t.fillPrice || t.entry) + ':' + t.invalidation + ':' + t.target + ':' + (t.breakEvenActive ? 1 : 0);
      }).join(',') + '|C:' + closedTk.map(function (t) { return t.id + ':' + (t.closedAt || 0); }).join(',');

      if (sig === lastChartExecSig) return;
      lastChartExecSig = sig;

      lwPriceLines.forEach(function (pl) { try { lwCandleSeries.removePriceLine(pl); } catch (e) {} });
      lwPriceLines = [];

      openTk.forEach(function (tk) {
        var entryPx = tk.fillPrice || tk.entry;
        lwPriceLines.push(lwCandleSeries.createPriceLine({
          price: entryPx,
          color: '#38bdf8',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: tk.id + ' OPEN (' + tk.direction.toUpperCase() + ')'
        }));
        lwPriceLines.push(lwCandleSeries.createPriceLine({
          price: tk.invalidation,
          color: '#f43f5e',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'HARD SL' + (tk.breakEvenActive ? ' [BE]' : '')
        }));
        lwPriceLines.push(lwCandleSeries.createPriceLine({
          price: tk.target,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'HARD TP'
        }));
      });

      if (typeof lwCandleSeries.setMarkers === 'function' && chartBarsCache.length) {
        var markers = [];
        closedTk.forEach(function (tk) {
          var closeTs = tk.closedAt || tk.createdAt;
          var snapped = snapTsToBarTime(closeTs, chartBarsCache);
          if (!snapped) return;
          var pnl = Number(tk.pnl || 0);
          var win = pnl >= 0;
          markers.push({
            time: snapped,
            position: win ? 'aboveBar' : 'belowBar',
            color: win ? '#10b981' : '#f43f5e',
            shape: win ? 'arrowDown' : 'arrowUp',
            text: (win ? 'TP ' : 'SL ') + (pnl >= 0 ? '+' : '') + pnl.toFixed(1)
          });
        });
        openTk.forEach(function (tk) {
          var fillTs = tk.filledAt || tk.createdAt;
          var snappedOpen = snapTsToBarTime(fillTs, chartBarsCache);
          if (!snappedOpen) return;
          markers.push({
            time: snappedOpen,
            position: tk.direction === 'long' ? 'belowBar' : 'aboveBar',
            color: '#38bdf8',
            shape: tk.direction === 'long' ? 'arrowUp' : 'arrowDown',
            text: tk.direction.toUpperCase() + ' ' + tk.id
          });
        });
        markers.sort(function (a, b) { return a.time - b.time; });
        try { lwCandleSeries.setMarkers(markers); } catch (e) {}
      }
    }

    function updateLiveDeskChartCandle(sym) {
      if (!lwCandleSeries || !chartBarsCache || !chartBarsCache.length || !deskState) return;
      var openPos = Array.isArray(deskState.tickets)
        ? deskState.tickets.find(function (t) { return t.status === 'open' && t.asset === sym && t.mt5CurrentPrice > 0; })
        : null;
      var livePx = (openPos && openPos.mt5CurrentPrice) || tapePriceOf(sym, 0);
      if (!livePx || livePx <= 0) return;
      var lastBar = chartBarsCache[chartBarsCache.length - 1];
      if (!lastBar) return;
      var stepSec = tfDurationSec(activeTimeframe);
      var curSlot = Math.floor(Date.now() / 1000 / stepSec) * stepSec;
      var updated;
      if (curSlot > lastBar.time) {
        updated = { time: curSlot, open: lastBar.close, high: Math.max(lastBar.close, livePx), low: Math.min(lastBar.close, livePx), close: livePx };
        chartBarsCache.push(updated);
      } else {
        updated = {
          time: lastBar.time,
          open: lastBar.open,
          high: Math.max(lastBar.high, livePx),
          low: Math.min(lastBar.low, livePx),
          close: livePx
        };
        chartBarsCache[chartBarsCache.length - 1] = updated;
      }
      try { lwCandleSeries.update(updated); } catch (e) {}
      renderChartOhlcvLegend(updated, updated.time);
    }

    async function refreshChartData(opts) {
      var sym = getActiveChartSymbol();
      var tf = activeTimeframe;
      var loadKey = sym + '|' + tf;
      var isSameView = (loadKey === lastChartLoadedKey) && chartBarsCache.length > 0;
      var shouldFit = Boolean(opts && opts.fit) || !isSameView;
      renderMarketProfilePanel(sym);
      var res = await fetch('/api/candles?symbol=' + encodeURIComponent(sym) + '&interval=' + encodeURIComponent(tf) + '&limit=240&_ts=' + Date.now(), { cache: 'no-store' });
      var data = await res.json();
      if (!data.ok || !Array.isArray(data.candles)) return;
      if (sym !== getActiveChartSymbol() || tf !== activeTimeframe) return;
      if (data.marketProfile) {
        chartProfileCache[sym] = data.marketProfile;
      }
      renderMarketProfilePanel(sym);

      chartLastRsi14 = Number(data.rsi14 || 50);
      chartLastAtr14 = Number(data.atr14 || 0);
      chartEma20Cache = Array.isArray(data.ema20) ? data.ema20 : [];
      chartEma50Cache = Array.isArray(data.ema50) ? data.ema50 : [];
      chartVwapCache = Array.isArray(data.vwapSeries) ? data.vwapSeries : [];

      var ovEl = document.getElementById('chartOverlayStats');
      if (ovEl) {
        ovEl.innerHTML =
          '<span>VWAP : ' + (data.vwap ? fmtChartPx(data.vwap.vwap, sym) : '--') + '</span>' +
          '<span>FVG : ' + (data.fvg ? fmtChartPx(data.fvg.midPrice, sym) : '--') + '</span>' +
          '<span>TF : ' + tf + ' (' + data.candles.length + ')</span>';
      }

      if (!lwCandleSeries || !lwChart) return;
      lastChartExecSig = '';
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

      var refPx = cBars.length ? cBars[cBars.length - 1].close : tapePriceOf(sym, 0);
      try {
        lwChart.applyOptions({ timeScale: { timeVisible: true, secondsVisible: tf === '1s' } });
        lwCandleSeries.applyOptions({ priceFormat: getSymbolPriceFormat(sym, refPx) });
      } catch (e) {}

      // Sans reset complet sur rafraîchissement de fond : préserve zoom et scroll utilisateur
      var canIncrementalUpdate = isSameView && !shouldFit && cBars.length >= 2 && chartBarsCache.length >= 2 &&
        cBars[cBars.length - 2].time >= chartBarsCache[chartBarsCache.length - 1].time;

      if (canIncrementalUpdate) {
        cBars.slice(-2).forEach(function (b) { try { lwCandleSeries.update(b); } catch (e) {} });
        vBars.slice(-2).forEach(function (v) { try { lwVolSeries.update(v); } catch (e) {} });
        if (lwEma20Series && chartEma20Cache.length) { try { lwEma20Series.update(chartEma20Cache[chartEma20Cache.length - 1]); } catch (e) {} }
        if (lwEma50Series && chartEma50Cache.length) { try { lwEma50Series.update(chartEma50Cache[chartEma50Cache.length - 1]); } catch (e) {} }
        if (lwVwapSeries && chartVwapCache.length) { try { lwVwapSeries.update(chartVwapCache[chartVwapCache.length - 1]); } catch (e) {} }
        chartBarsCache = cBars;
      } else if (cBars.length) {
        chartBarsCache = cBars;
        lwCandleSeries.setData(cBars);
        lwVolSeries.setData(vBars);
        if (lwEma20Series) lwEma20Series.setData(chartEma20Cache);
        if (lwEma50Series) lwEma50Series.setData(chartEma50Cache);
        if (lwVwapSeries) lwVwapSeries.setData(chartVwapCache);
        if (shouldFit) {
          lwChart.timeScale().fitContent();
        }
        lastChartLoadedKey = loadKey;
      }

      renderChartOhlcvLegend(null, null);
      syncChartExecutionOverlays();
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
      if (btn) btn.textContent = chartDrawings[selectedDrawIdx].locked ? 'VERR' : 'LIBRE';
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
          if (btn && selectedDrawIdx >= 0) btn.textContent = chartDrawings[selectedDrawIdx].locked ? 'VERR' : 'LIBRE';
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

    function buildEquitySeriesPoints() {
      if (!deskState) return { points: [], bySec: {} };
      var now = Date.now();
      var cutoff =
        equityRange === '1D' ? now - 86400000
        : equityRange === '1W' ? now - 7 * 86400000
        : equityRange === '1M' ? now - 30 * 86400000
        : equityRange === '2M' ? now - 60 * 86400000
        : 0;

      var hasMt5 = Boolean(deskState.mt5Live && deskState.mt5Live.connected);
      var rawBase = (deskState.curve || []).filter(function (pt) {
        return pt && Number.isFinite(Number(pt.t)) && Number.isFinite(Number(pt.eq)) && Number(pt.eq) > 0;
      });
      // Purge client-side tout pic aberrant isolé (ex: artefact +100% à 174 838€)
      var baseCurve = [];
      for (var bi = 0; bi < rawBase.length; bi++) {
        var bPt = rawBase[bi];
        var win = [];
        for (var bj = Math.max(0, bi - 3); bj <= Math.min(rawBase.length - 1, bi + 3); bj++) {
          if (bj !== bi) win.push(Number(rawBase[bj].eq));
        }
        win.sort(function (a, b) { return a - b; });
        var locMed = win.length ? win[Math.floor(win.length / 2)] : Number(bPt.eq);
        if (locMed > 0 && (Number(bPt.eq) > locMed * 1.30 || Number(bPt.eq) < locMed * 0.70)) {
          continue;
        }
        baseCurve.push(bPt);
      }
      var lastMeasured = baseCurve.length ? baseCurve[baseCurve.length - 1] : null;
      var liveEq = hasMt5
        ? Number(deskState.mt5Live.equity || 0)
        : Number((lastMeasured && lastMeasured.eq) || deskState.startEquity || 10000);
      var liveUnreal = hasMt5
        ? Number(deskState.mt5Live.profit || 0)
        : Number((lastMeasured && lastMeasured.unrealized) || 0);

      var merged = baseCurve.slice();

      // Reconstitution en arrière UNIQUEMENT au démarrage vierge sans historique mesuré (< 2 points)
      if (merged.length < 2) {
        var closedAll = (deskState.tickets || [])
          .filter(function (t) { return t.status === 'closed' && (t.closedAt || t.createdAt); })
          .slice(-200)
          .sort(function (a, b) { return (a.closedAt || a.createdAt) - (b.closedAt || b.createdAt); });
        if (closedAll.length > 0) {
          var anchorEq = liveEq > 0 ? liveEq : Number(deskState.startEquity || 10000);
          var totalClosedPnl = closedAll.reduce(function (s, t) { return s + Number(t.pnl || 0); }, 0);
          var startAnchor = Math.max(1, anchorEq - totalClosedPnl);
          var runEq = startAnchor;
          var runRealized = 0;
          var peak = startAnchor;
          var synth = [{ t: Math.max(0, (closedAll[0].closedAt || closedAll[0].createdAt) - 60000), eq: startAnchor, realized: 0, drawdownPct: 0 }];
          closedAll.forEach(function (t) {
            var p = Number(t.pnl || 0);
            runEq = Math.max(1, runEq + p);
            runRealized += p;
            if (runEq > peak) peak = runEq;
            synth.push({ t: t.closedAt || t.createdAt, eq: runEq, realized: runRealized, drawdownPct: peak > 0 ? (peak - runEq) / peak : 0 });
          });
          merged = synth;
        }
      }

      if (liveEq > 0 && (!lastMeasured || now - lastMeasured.t >= 1000 || Math.abs(lastMeasured.eq - liveEq) >= 0.01)) {
        merged.push({
          t: now,
          eq: liveEq,
          realized: Number(deskState.realizedPnl || 0),
          unrealized: liveUnreal,
          drawdownPct: lastMeasured ? (lastMeasured.drawdownPct || 0) : 0
        });
      }

      var rawCurve = merged.filter(function (pt) { return pt.t >= cutoff; });
      if (rawCurve.length < 2 && merged.length >= 1) {
        var lastVal = merged[merged.length - 1];
        var anchorT = cutoff > 0 ? Math.max(cutoff, now - 3600000) : now - 60000;
        rawCurve = [{ t: Math.min(anchorT, lastVal.t - 60000), eq: lastVal.eq, realized: lastVal.realized || 0, drawdownPct: lastVal.drawdownPct || 0 }, lastVal];
      }

      var bySec = {};
      rawCurve.forEach(function (pt) {
        var sec = Math.floor(Number(pt.t) / 1000);
        bySec[sec] = pt;
      });
      var points = Object.keys(bySec)
        .sort(function (a, b) { return Number(a) - Number(b); })
        .map(function (sec) {
          return { time: Number(sec), value: Number(Number(bySec[sec].eq || 0).toFixed(2)) };
        });
      return { points: points, bySec: bySec };
    }

    function updateLiveEquityChart() {
      if (!eqChart || !eqAreaSeries || !deskState) return;
      var res = buildEquitySeriesPoints();
      window._eqBySec = res.bySec;
      if (res.points.length) {
        eqAreaSeries.setData(res.points);
      }
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
        timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)', scaleMargins: { top: 0.12, bottom: 0.12 } }
      });

      eqAreaSeries = eqChart.addAreaSeries({
        lineColor: upHex,
        topColor: hexToRgba(upHex, 0.35),
        bottomColor: hexToRgba(upHex, 0.02),
        lineWidth: 2
      });

      var res = buildEquitySeriesPoints();
      window._eqBySec = res.bySec;
      if (res.points.length) {
        eqAreaSeries.setData(res.points);
        eqChart.timeScale().fitContent();
      }

      var tip = document.getElementById('equityTooltip');
      eqChart.subscribeCrosshairMove(function (param) {
        if (!tip) return;
        if (!param || !param.time) { tip.style.display = 'none'; return; }
        var match = (window._eqBySec || {})[param.time];
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

    function highlightLevPresets(currentLev) {
      var n = Math.round(Number(currentLev) || 1);
      var btns = document.querySelectorAll('.lev-preset-btn');
      btns.forEach(function (btn) {
        var bLev = Number(btn.getAttribute('data-lev'));
        if (bLev === n) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      var qInput = document.getElementById('navLevQuickInput');
      if (qInput && document.activeElement !== qInput) qInput.value = String(n);
      var navCur = document.getElementById('navLevCurrentBadge');
      if (navCur) {
        if (n <= 3) { navCur.className = 'level-badge prudent'; navCur.textContent = 'Prudent (' + n + 'x)'; }
        else if (n <= 10) { navCur.className = 'level-badge balanced'; navCur.textContent = 'Équilibré (' + n + 'x)'; }
        else { navCur.className = 'level-badge aggressive'; navCur.textContent = 'Agressif (' + n + 'x)'; }
      }
    }

    function toggleNavLevDropdown(e) {
      if (e) e.stopPropagation();
      var dd = document.getElementById('navLevDropdown');
      if (!dd) return;
      var isOpen = dd.style.display === 'block';
      var am = document.getElementById('assetDropdownMenu');
      if (am) am.style.display = 'none';
      if (isOpen) {
        dd.style.display = 'none';
      } else {
        dd.style.display = 'block';
        var curLev = Number((deskState && deskState.settings && deskState.settings.defaultLeverage) || document.getElementById('cfgLev')?.value || 5);
        highlightLevPresets(curLev);
      }
    }

    function closeNavLevDropdown() {
      var dd = document.getElementById('navLevDropdown');
      if (dd) dd.style.display = 'none';
    }

    function applyLeverageDirectly(val, callback) {
      var n = Math.max(1, Math.min(500, Math.round(Number(val) || 1)));
      var slider = document.getElementById('cfgLevSlider');
      var input = document.getElementById('cfgLev');
      var badge = document.getElementById('navLevBadge');
      var applyBtn = document.getElementById('btnApplyLevDirect');
      if (slider) slider.value = String(n);
      if (input) input.value = String(n);
      if (badge) badge.textContent = 'x' + n;
      if (applyBtn) applyBtn.textContent = 'Appliquer';
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
      highlightLevPresets(n);

      var fb = document.getElementById('levApplyFeedback');
      if (fb) {
        fb.style.display = 'inline-block';
        fb.style.color = 'var(--text-muted)';
        fb.textContent = '⏳ Application...';
      }

      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { defaultLeverage: n } })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (deskState) {
          if (!deskState.settings) deskState.settings = {};
          deskState.settings.defaultLeverage = n;
        }
        if (fb) {
          fb.style.display = 'inline-block';
          fb.style.color = 'var(--up)';
          fb.textContent = 'OK · Levier x' + n + ' actif !';
          setTimeout(function () { if (fb) fb.style.display = 'none'; }, 3500);
        }
        if (badge) badge.textContent = 'x' + n;
        highlightLevPresets(n);
        if (typeof callback === 'function') callback(null, n);
      })
      .catch(function (err) {
        if (fb) {
          fb.style.display = 'inline-block';
          fb.style.color = 'var(--down)';
          fb.textContent = 'ERR · Erreur : ' + (err.message || 'échec');
        }
        if (typeof callback === 'function') callback(err);
      });
    }

    function quickSwitchRegime(val) {
      var regime = val || 'standard';
      var sel = document.getElementById('topActiveRegimeSelect');
      if (sel) sel.value = regime;
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { regime: regime } }),
      }).then(function(r) { return r.json(); }).then(function(d) {
        if (deskState && deskState.settings) deskState.settings.regime = regime;
        var rChip = document.getElementById('deskRegimeChip');
        if (rChip) {
          if (regime === 'hft_kamikaze') {
            rChip.textContent = ' RÉGIME : HFT FIAT-TARGET (KAMIKAZE)';
            rChip.style.background = 'rgba(239, 68, 68, 0.25)';
            rChip.style.color = '#fca5a5';
            rChip.style.borderColor = 'rgba(239, 68, 68, 0.6)';
          } else if (regime === 'macro_fvg') {
            rChip.textContent = 'RÉGIME : MACRO FVG';
            rChip.style.background = '';
            rChip.style.color = '';
            rChip.style.borderColor = '';
          } else {
            rChip.textContent = 'RÉGIME : STANDARD (WFO/GRPO)';
            rChip.style.background = '';
            rChip.style.color = '';
            rChip.style.borderColor = '';
          }
        }
      }).catch(function(e) { console.error('Error switching regime:', e); });
    }

    function quickApplyLeverage(val) {
      applyLeverageDirectly(val);
    }

    function highlightCadencePresets(tpm) {
      var n = Math.max(1, Math.min(60, Math.round(Number(tpm) || 4)));
      document.querySelectorAll('.cadence-preset-btn').forEach(function (b) {
        b.classList.toggle('active', Number(b.getAttribute('data-tpm')) === n);
      });
      var sec = Math.max(1, Math.round(60 / n));
      var lbl = document.getElementById('cadenceIntervalLabel');
      if (lbl) lbl.textContent = n + '/min (1 trade / ' + sec + 's)';
      var navB = document.getElementById('navCadenceBadge');
      if (navB) navB.textContent = n + '/min';
    }

    function syncCadenceFromSlider(val) {
      var n = Math.max(1, Math.min(60, Math.round(Number(val) || 4)));
      var el = document.getElementById('cfgTradesPerMin');
      if (el) el.value = String(n);
      highlightCadencePresets(n);
      markStrategyFormDirty();
    }

    function syncCadenceFromNumber(val) {
      var n = Math.max(1, Math.min(60, Math.round(Number(val) || 4)));
      var sl = document.getElementById('cfgTradesPerMinSlider');
      if (sl) sl.value = String(n);
      highlightCadencePresets(n);
      markStrategyFormDirty();
    }

    function applyTradesPerMinDirectly(val) {
      var n = Math.max(1, Math.min(60, Math.round(Number(val) || 4)));
      var sec = Math.max(1, Math.round(60 / n));
      var focusSym = String(document.getElementById('cfgFocusSymbol')?.value || '').trim().toUpperCase();
      var strictQ = Boolean(document.getElementById('cfgStrictQuotaChk')?.checked);
      if (focusSym && !strictQ && n >= 6) {
        strictQ = true;
        var qChk = document.getElementById('cfgStrictQuotaChk');
        if (qChk) qChk.checked = true;
      }
      var el = document.getElementById('cfgTradesPerMin');
      var sl = document.getElementById('cfgTradesPerMinSlider');
      if (el) el.value = String(n);
      if (sl) sl.value = String(n);
      highlightCadencePresets(n);
      var fb = document.getElementById('cadenceApplyFeedback');
      if (fb) {
        fb.style.display = 'inline-block';
        fb.style.color = 'var(--amber)';
        fb.textContent = 'Application...';
      }
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          settings: {
            tradesPerMinute: n,
            scalpIntervalSec: sec,
            focusSymbol: focusSym,
            strictQuotaMode: strictQ
          }
        })
      })
      .then(function (r) { return r.json(); })
      .then(function () {
        if (deskState && deskState.settings) {
          deskState.settings.tradesPerMinute = n;
          deskState.settings.scalpIntervalSec = sec;
          deskState.settings.focusSymbol = focusSym;
          deskState.settings.strictQuotaMode = strictQ;
          if (n >= 6 || (focusSym && strictQ)) {
            deskState.settings.autoPaperScalp = true;
            deskState.settings.executionMode = 'auto';
          }
        }
        isStrategyFormDirty = false;
        if (fb) {
          fb.style.display = 'inline-block';
          fb.style.color = 'var(--up)';
          fb.textContent = 'OK · ' + n + '/min' + (focusSym ? (' sur ' + focusSym) : '') + ' actif !';
          setTimeout(function () { if (fb) fb.style.display = 'none'; }, 3500);
        }
      })
      .catch(function () {
        if (fb) {
          fb.style.display = 'inline-block';
          fb.style.color = 'var(--down)';
          fb.textContent = 'ERR · échec mise à jour';
        }
      });
    }

    function applyFocusHftDirectly() {
      var focusSel = document.getElementById('cfgFocusSymbol');
      var qChk = document.getElementById('cfgStrictQuotaChk');
      var focusSym = String(focusSel?.value || '').trim().toUpperCase();
      if (qChk) qChk.checked = Boolean(focusSym);
      var n = Math.max(1, Math.min(60, Math.round(Number(document.getElementById('cfgTradesPerMin')?.value || 12))));
      if (focusSym && n < 6) {
        n = 12;
        var el = document.getElementById('cfgTradesPerMin');
        var sl = document.getElementById('cfgTradesPerMinSlider');
        if (el) el.value = '12';
        if (sl) sl.value = '12';
      }
      applyTradesPerMinDirectly(n);
    }

    function applyCurrentLeverageInput() {
      var input = document.getElementById('cfgLev');
      var val = Number(input?.value || 5);
      applyLeverageDirectly(val);
    }

    function syncLevFromSlider(val) {
      var n = Math.max(1, Math.min(500, Math.round(Number(val) || 1)));
      var el = document.getElementById('cfgLev');
      if (el) el.value = String(n);
      var btn = document.getElementById('btnApplyLevDirect');
      if (btn) btn.textContent = 'Appliquer x' + n;
      highlightLevPresets(n);
      markStrategyFormDirty();
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function syncLevFromNumber(val) {
      var n = Math.max(1, Math.min(500, Math.round(Number(val) || 1)));
      var el = document.getElementById('cfgLevSlider');
      if (el) el.value = String(n);
      var btn = document.getElementById('btnApplyLevDirect');
      if (btn) btn.textContent = 'Appliquer x' + n;
      highlightLevPresets(n);
      markStrategyFormDirty();
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function setLevPreset(val) {
      quickApplyLeverage(val);
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
      var tpInp = document.getElementById('cfgTpVal');
      if (tpInp) {
        var curTpNum = Number(tpInp.value || 0);
        if (currentTpMode === 'rr' && curTpNum > 15) tpInp.value = '2.0';
        else if (currentTpMode === 'pct' && curTpNum > 20) tpInp.value = '2.5';
        else if (currentTpMode === 'amount' && curTpNum <= 10) tpInp.value = '100';
      }
      var exLbl = document.getElementById('cfgTpExampleLbl');
      var presets = document.getElementById('tpAmountPresets');
      if (presets) presets.style.display = currentTpMode === 'amount' ? 'flex' : 'none';
      if (exLbl) {
        if (currentTpMode === 'rr') exLbl.textContent = 'Ex. : 2.0 = viser 2× le SL';
        else if (currentTpMode === 'amount') exLbl.textContent = 'Ex. : 100 = encaisser dès +100 € de profit';
        else if (currentTpMode === 'pips') exLbl.textContent = 'Ex. : 50 = fermer à +50 pips';
        else if (currentTpMode === 'pct') exLbl.textContent = 'Ex. : 2.5 = gain de 2.5 % du compte';
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
      if (p === 'performance_pro') {
        syncLevFromSlider(20);
        setRiskMode('pct');
        var rElP = document.getElementById('cfgRiskPct');
        if (rElP) rElP.value = '1.5';
        setSlMode('atr');
        syncAtrInputs(1.50);
        var dElP = document.getElementById('cfgDayLossMode');
        if (dElP) dElP.value = 'pct';
        toggleDayLossInputs();
        var dpElP = document.getElementById('cfgDayLossPct');
        if (dpElP) dpElP.value = '4.0';
        var mtElP = document.getElementById('cfgMaxTradeLossMode');
        if (mtElP) mtElP.value = 'pct';
        var mvElP = document.getElementById('cfgMaxTradeLossVal');
        if (mvElP) mvElP.value = '0';
        setTpMode('rr');
        var tpElP = document.getElementById('cfgTpVal');
        if (tpElP) tpElP.value = '2.2';
        var scElP = document.getElementById('cfgAutoStopLossChk');
        if (scElP) scElP.checked = true;
        syncProgressiveStopUi(true);
        saveSettingsToServer({
          regime: 'standard',
          tradingStyle: 'daytrade',
          autoPaperScalp: true,
          executionMode: 'auto',
          defaultLeverage: 20,
          riskMode: 'pct',
          maxRiskPct: 0.015,
          slMode: 'atr',
          slVal: 1.50,
          fixedStopAtr: 1.50,
          tpMode: 'rr',
          tpVal: 2.2,
          maxDayLossMode: 'pct',
          maxDayLossPct: 0.04,
          maxLossPerTradeVal: 0,
          autoStopOnMaxLoss: true,
          progressiveStopEnabled: true
        });
        fetch('/api/train', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ style: 'daytrade' }) }).catch(function () {});
        sendCmd('scan');
      } else if (p === 'conservative' || p === 'prudent') {
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
        saveSettingsToServer({
          defaultLeverage: 2,
          riskMode: 'pct',
          maxRiskPct: 0.01,
          slMode: 'atr',
          slVal: 1.80,
          fixedStopAtr: 1.80,
          tpMode: 'rr',
          tpVal: 2.5,
          maxDayLossMode: 'pct',
          maxDayLossPct: 0.03,
          maxLossPerTradeMode: 'pct',
          maxLossPerTradeVal: 1.5,
          autoStopOnMaxLoss: true
        });
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
        saveSettingsToServer({
          defaultLeverage: 20,
          riskMode: 'pct',
          maxRiskPct: 0.035,
          slMode: 'atr',
          slVal: 1.00,
          fixedStopAtr: 1.00,
          tpMode: 'rr',
          tpVal: 1.5,
          maxDayLossMode: 'pct',
          maxDayLossPct: 0.08,
          maxLossPerTradeMode: 'pct',
          maxLossPerTradeVal: 4.0,
          autoStopOnMaxLoss: true
        });
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
        saveSettingsToServer({
          defaultLeverage: 5,
          riskMode: 'pct',
          maxRiskPct: 0.02,
          slMode: 'atr',
          slVal: 1.35,
          fixedStopAtr: 1.35,
          tpMode: 'rr',
          tpVal: 2.0,
          maxDayLossMode: 'pct',
          maxDayLossPct: 0.05,
          maxLossPerTradeMode: 'pct',
          maxLossPerTradeVal: 3.0,
          autoStopOnMaxLoss: true
        });
      }
      updateRiskLevelBadges();
      updateLiveRiskCalculator();
    }

    function updateRiskLevelBadges() {
      var lev = Number(document.getElementById('cfgLev')?.value || 5);
      var bLev = document.getElementById('badgeLevLevel');
      if (bLev) {
        if (lev <= 3) { bLev.className = 'level-badge conservative'; bLev.textContent = 'Prudent'; }
        else if (lev <= 10) { bLev.className = 'level-badge balanced'; bLev.textContent = 'Équilibré'; }
        else { bLev.className = 'level-badge aggressive'; bLev.textContent = 'Agressif (' + lev + 'x)'; }
      }

      var bRisk = document.getElementById('badgeRiskLevel');
      if (bRisk) {
        var rVal = currentRiskMode === 'pct' ? Number(document.getElementById('cfgRiskPct')?.value || 2) : 2;
        if (rVal <= 1.0) { bRisk.className = 'level-badge conservative'; bRisk.textContent = 'Prudent'; }
        else if (rVal <= 2.5) { bRisk.className = 'level-badge balanced'; bRisk.textContent = 'Équilibré'; }
        else { bRisk.className = 'level-badge aggressive'; bRisk.textContent = 'Agressif'; }
      }

      var bAtr = document.getElementById('badgeAtrLevel');
      if (bAtr) {
        var atrV = Number(document.getElementById('cfgAtrMult')?.value || 1.35);
        if (atrV >= 1.6) { bAtr.className = 'level-badge conservative'; bAtr.textContent = ' Stop Large'; }
        else if (atrV >= 1.2) { bAtr.className = 'level-badge balanced'; bAtr.textContent = 'Équilibré'; }
        else { bAtr.className = 'level-badge aggressive'; bAtr.textContent = 'Stop Serré'; }
      }

      var bDay = document.getElementById('badgeDayLossLevel');
      if (bDay) {
        var dVal = Number(document.getElementById('cfgDayLossPct')?.value || 5);
        if (dVal <= 3.0) { bDay.className = 'level-badge conservative'; bDay.textContent = 'Prudent'; }
        else if (dVal <= 6.0) { bDay.className = 'level-badge balanced'; bDay.textContent = 'Équilibré'; }
        else { bDay.className = 'level-badge aggressive'; bDay.textContent = 'Agressif'; }
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
      var slPips = Number(document.getElementById('cfgSlPips')?.value || 25);
      var slPct = Number(document.getElementById('cfgSlPct')?.value || 2);

      var riskBaseUsd = 0;
      if (rMode === 'amount') {
        riskBaseUsd = rAmt;
      } else if (rMode === 'pct') {
        riskBaseUsd = (eq * rPct) / 100;
      } else if (rMode === 'pips') {
        riskBaseUsd = Math.max(5, rPips * 4.0);
      } else {
        riskBaseUsd = eq * 0.02;
      }

      var riskAmountUsd = riskBaseUsd;
      if (slMode === 'amount' && slAmt > 0) {
        riskAmountUsd = rMode === 'amount' ? Math.min(slAmt, rAmt) : slAmt;
      } else if (slMode === 'pct' && slPct > 0) {
        riskAmountUsd = (eq * slPct) / 100;
      } else if (slMode === 'pips' && slPips > 0) {
        riskAmountUsd = Math.max(5, slPips * 4.0);
      }

      var maxTradeLossMode = document.getElementById('cfgMaxTradeLossMode')?.value || 'amount';
      var maxTradeLossVal = Number(document.getElementById('cfgMaxTradeLossVal')?.value || 0);
      if (maxTradeLossVal > 0) {
        var maxCapUsd = maxTradeLossMode === 'pct' ? (eq * maxTradeLossVal) / 100 : maxTradeLossMode === 'pips' ? Math.max(5, maxTradeLossVal * 4.0) : maxTradeLossVal;
        riskAmountUsd = Math.min(riskAmountUsd, maxCapUsd);
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
        targetProfitUsd = Math.max(5, tpVal * 4.0);
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
      var progSlOn = Boolean(document.getElementById('cfgProgressiveSlEnabled')?.checked);

      var sanityWarn = '';
      if (targetProfitUsd > eq * 0.35 || riskAmountUsd > eq * 0.25) {
        sanityWarn = '<div style="margin-top:4px;padding:4px 7px;border-radius:6px;background:rgba(251,191,36,0.14);border:1px solid rgba(251,191,36,0.4);color:var(--amber);font-size:11px">Attention : le mode actuel (' + (tpMode === 'rr' ? 'Ratio R' : tpMode === 'pct' ? '% Capital' : tpMode) + ') produit un objectif très élevé sur ce capital. Sélectionnez <strong>Montant (€/$)</strong> pour fixer une somme exacte (ex: 25 €, 50 €, 100 €).</div>';
      }

      box.innerHTML =
        '<div style="font-size:12.5px;font-weight:700;color:var(--fg-0);margin-bottom:4px">' +
          ' Simulation par trade (sur capital de ' + Number(eq).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur + ') :' +
        '</div>' +
        '<div style="font-size:12px;line-height:1.55;color:var(--fg-1)">' +
          '• <strong>Stop-Loss (Perte max / trade) :</strong> <strong class="down">-' + Number(riskAmountUsd).toFixed(2) + ' ' + cur + '</strong> (coupure automatique garantie si touché)<br>' +
          '• <strong>Take-Profit (Cible / trade) :</strong> <strong class="up">+' + Number(targetProfitUsd).toFixed(2) + ' ' + cur + '</strong> (clôture automatique dès le montant atteint)<br>' +
          '• <strong>Ratio R/R :</strong> 1 : ' + ratio + ' (Levier ' + lev + 'x · SL mode: ' + slMode.toUpperCase() + ' · TP mode: ' + tpMode.toUpperCase() + ')<br>' +
          '• <strong>Stop-Loss Progressif (Break-Even 50%) :</strong> ' + (progSlOn ? '<strong class="up">ACTIF</strong> (ex: +100 ' + cur + ' latent -> Break-Even verrouillé à +50 ' + cur + ')' : '<span style="color:var(--fg-2)">INACTIF</span>') + '<br>' +
          '• <strong>Coupe-circuit perte max / jour :</strong> <strong class="down">' + Number(dayLossVal).toFixed(2) + ' ' + cur + '</strong>' +
          (dailyTpOn ? ' · Clôture globale PnL ouvert : <strong class="up">+' + Number(dailyTpTarget).toFixed(2) + ' ' + cur + '</strong>' : '') +
        '</div>' + sanityWarn;
    }

    function syncProgressiveStopUi(on) {
      var chk = document.getElementById('cfgProgressiveSlEnabled');
      if (chk) chk.checked = Boolean(on);
      var btn = document.getElementById('btnToggleProgressiveStop');
      var lbl = document.getElementById('lblProgStopState');
      if (btn) btn.classList.toggle('active', Boolean(on));
      if (lbl) lbl.textContent = on ? 'ACTIF' : 'INACTIF';
      updateLiveRiskCalculator();
    }

    async function toggleProgressiveStop() {
      var chk = document.getElementById('cfgProgressiveSlEnabled');
      var nextVal = !(chk && chk.checked);
      syncProgressiveStopUi(nextVal);
      if (deskState && deskState.settings) {
        deskState.settings.progressiveStopEnabled = nextVal;
      }
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ settings: { progressiveStopEnabled: nextVal } })
        });
      } catch (e) {}
    }

    var isAgentPromptDirty = false;
    var lastRenderedPromptAgent = '';

    function renderAgentPromptsEditor() {
      var sel = document.getElementById('agentPromptSelect');
      var meta = document.getElementById('agentPromptRoleMeta');
      var ta = document.getElementById('agentPromptTextarea');
      if (!sel || !ta || !deskState || !deskState.agentPrompts) return;
      var agId = sel.value || 'strategist';
      if (lastRenderedPromptAgent !== agId) {
        isAgentPromptDirty = false;
        lastRenderedPromptAgent = agId;
      }
      var cfg = deskState.agentPrompts[agId];
      if (!cfg) return;
      if (meta) {
        meta.textContent = (cfg.roleTitle || cfg.name) + ' · T=' + Number(cfg.temperature || 0.2).toFixed(2);
      }
      if (!isAgentPromptDirty && document.activeElement !== ta) {
        ta.value = cfg.systemPrompt || '';
      }
    }

    async function saveSelectedAgentPrompt() {
      var sel = document.getElementById('agentPromptSelect');
      var ta = document.getElementById('agentPromptTextarea');
      var meta = document.getElementById('agentPromptRoleMeta');
      if (!sel || !ta) return;
      var agId = sel.value || 'strategist';
      var txt = ta.value || '';
      try {
        var patch = {};
        patch[agId] = { systemPrompt: txt };
        var res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ agentPrompts: patch })
        });
        var out = await res.json();
        if (out && out.ok) {
          isAgentPromptDirty = false;
          if (deskState && deskState.agentPrompts && deskState.agentPrompts[agId]) {
            deskState.agentPrompts[agId].systemPrompt = txt;
          }
          if (meta) meta.textContent = 'Consigne sauvegardée en direct pour ' + agId.toUpperCase();
        }
      } catch (e) {}
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
      highlightLevPresets(lev);

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
      var slPipsEl = document.getElementById('cfgSlPips');
      if (slPipsEl && slM === 'pips' && settings.slVal) slPipsEl.value = String(settings.slVal);
      var slPctEl = document.getElementById('cfgSlPct');
      if (slPctEl && slM === 'pct' && settings.slVal) slPctEl.value = String(settings.slVal);

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

      var tpm = Number(settings.tradesPerMinute || Math.round(60 / Math.max(1, settings.scalpIntervalSec || 15)) || 4);
      tpm = Math.max(1, Math.min(60, Math.round(tpm)));
      var tpmEl = document.getElementById('cfgTradesPerMin');
      var tpmSl = document.getElementById('cfgTradesPerMinSlider');
      if (tpmEl) tpmEl.value = String(tpm);
      if (tpmSl) tpmSl.value = String(tpm);
      highlightCadencePresets(tpm);
      var fSel = document.getElementById('cfgFocusSymbol');
      if (fSel && settings.focusSymbol !== undefined) fSel.value = settings.focusSymbol || '';
      var sqChk = document.getElementById('cfgStrictQuotaChk');
      if (sqChk) sqChk.checked = Boolean(settings.strictQuotaMode);

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
      syncProgressiveStopUi(Boolean(settings.progressiveStopEnabled));

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
      var slVal =
        slMode === 'amount' ? Number(document.getElementById('cfgSlAmount')?.value || rAmt)
        : slMode === 'pips' ? Number(document.getElementById('cfgSlPips')?.value || 25)
        : slMode === 'pct' ? Number(document.getElementById('cfgSlPct')?.value || 2)
        : atr;
      if (slMode === 'amount' && rMode !== 'amount' && slVal > 0) {
        rAmt = slVal;
      }

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
      var progressiveStopEnabled = Boolean(document.getElementById('cfgProgressiveSlEnabled')?.checked);
      var tradesPerMinute = Math.max(1, Math.min(60, Math.round(Number(document.getElementById('cfgTradesPerMin')?.value || 4))));
      var scalpIntervalSec = Math.max(1, Math.round(60 / tradesPerMinute));
      var focusSymbol = String(document.getElementById('cfgFocusSymbol')?.value || '').trim().toUpperCase();
      var strictQuotaMode = Boolean(document.getElementById('cfgStrictQuotaChk')?.checked);

      var errors = [];
      if (lev < 1 || lev > 500) errors.push('Le levier doit être compris entre 1 et 500.');
      if (rMode === 'pct' && (rPct <= 0 || rPct > 1.0)) errors.push('Le risque par trade doit être supérieur à 0.');
      if (rMode === 'amount' && rAmt <= 0) errors.push('Le montant risqué doit être supérieur à 0.');
      if (slMode === 'amount' && slVal <= 0) errors.push('Le Stop-Loss en euro doit être supérieur à 0.');
      if (atr < 0.3 || atr > 5.0) errors.push('Le multiplicateur ATR doit être compris entre 0.3 et 5.0.');
      if (tpVal <= 0) errors.push('La cible Take Profit doit être supérieure à 0.');

      if (errors.length) {
        if (alertBox) {
          alertBox.textContent = 'ALERTE · ' + errors.join(' ');
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
        dailyProfitTargetVal: dailyTpVal,
        progressiveStopEnabled: progressiveStopEnabled,
        tradesPerMinute: tradesPerMinute,
        scalpIntervalSec: scalpIntervalSec,
        focusSymbol: focusSymbol,
        strictQuotaMode: strictQuotaMode
      };

      var prevLev = Number(deskState?.settings?.defaultLeverage || 5);
      var isDangerous = (lev > 50 && lev !== prevLev) || (rMode === 'pct' && rPct > 0.10) || (dayLossMode === 'pct' && dayLossPct > 0.20);
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
          if (settings.defaultLeverage) {
            highlightLevPresets(settings.defaultLeverage);
            var navLev = document.getElementById('navLevBadge');
            if (navLev) navLev.textContent = 'x' + settings.defaultLeverage;
          }
          if (btn) {
            btn.textContent = 'OK · Réglages enregistrés !';
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
        alertBox.textContent = 'ℹ Réglages réinitialisés aux valeurs recommandées (Levier 5x, Risque 2%, Stop ATR 1.35x). Cliquez sur "Sauvegarder les réglages" pour les appliquer.';
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
          st.textContent = 'OK · IA entraînée (Ép #' + out.training.episode + ') · Full Auto ACTIVÉ · ' + out.openPositions + ' position(s) ouverte(s) !';
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

    function onLlmProviderChanged() {
      var prov = document.getElementById('llmProviderSelect').value;
      var modelSel = document.getElementById('llmModelSelect');
      var badge = document.getElementById('llmStatusBadge');
      if (prov === 'freellm') {
        modelSel.innerHTML = '<option value="auto:fast">auto:fast</option><option value="auto">auto</option>';
        badge.textContent = 'URL : http://127.0.0.1:31415/v1 · Routes : auto / auto:fast';
      } else if (prov === 'gemini') {
        modelSel.innerHTML = '<option value="gemini-2.5-flash-lite">flash-lite</option><option value="gemini-2.5-flash">flash</option>';
        badge.textContent = 'Google AI Studio / GenerativeLanguage API';
      } else if (prov === 'groq') {
        modelSel.innerHTML = '<option value="llama-3.3-70b-versatile">llama-3.3-70b</option><option value="llama-3.1-8b-instant">llama-3.1-8b</option>';
        badge.textContent = 'Groq Cloud API (Llama 3.3)';
      } else if (prov === 'ollama') {
        modelSel.innerHTML = '<option value="qwen2.5:7b">qwen2.5:7b</option><option value="llama3.2">llama3.2</option>';
        badge.textContent = 'Ollama local sur 127.0.0.1:11434';
      } else {
        modelSel.innerHTML = '<option value="auto">auto</option>';
        badge.textContent = 'Sélection automatique selon les clés configurées';
      }
    }

    async function saveLlmApiKey() {
      var k = document.getElementById('llmKeyInput').value.trim();
      var prov = document.getElementById('llmProviderSelect').value;
      var model = document.getElementById('llmModelSelect').value;
      var badge = document.getElementById('llmStatusBadge');
      badge.textContent = 'Activation en cours...';
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            llmApiKey: k || undefined,
            settings: {
              llmEnabled: true,
              llmProvider: prov,
              llmModel: model
            }
          })
        });
        badge.textContent = 'Passerelle active · ' + prov + ' (' + model + ')';
        document.getElementById('llmKeyInput').value = '';
      } catch (e) {
        badge.textContent = "Erreur lors de l'activation de la passerelle";
      }
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
            ? 'OK · Synchronisé MT5 #' + ((out.mt5Live && out.mt5Live.login) || '--') + ' · ' + (out.openTickets ? out.openTickets.length : 0) + ' position(s) active(s)'
            : 'ALERTE · Erreur sync : ' + (out.error || 'inconnue');
        }
      } catch (e) {
        if (stEl) stEl.textContent = 'ALERTE · Erreur réseau sync MT5';
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
      stEl.textContent = (out.ok ? 'OK · ' : 'ALERTE · ') + (out.message || 'Terminé');
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
      stEl.textContent = (out.ok ? 'OK · ' : 'ALERTE · ') + (out.message || 'Terminé');
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
      stEl.textContent = (out.ok ? 'OK · ' : 'ALERTE · ') + (out.message || 'Terminé');
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
      stEl.textContent = (out.ok ? 'OK · ' : 'ALERTE · ') + (out.message || 'Terminé');
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
      var directive15m = (deskState && deskState.current_market_regime_directive) || 'En attente du prochain cycle 15 min (analyse Reviewer -> Stratège).';
      var reviews15m = (deskState && Array.isArray(deskState.selfReflectionHistory)) ? deskState.selfReflectionHistory.slice().reverse() : [];
      var lastRevAt = deskState && deskState.lastSelfReflectionAt;

      var reviewsHtml = '';
      if (reviews15m.length > 0) {
        reviewsHtml =
          '<div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto">' +
            reviews15m.slice(0, 8).map(function (rv) {
              var tStr = new Date(rv.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              var pnlColor = Number(rv.netPnl || 0) >= 0 ? 'var(--up)' : 'var(--down)';
              return (
                '<div style="padding:7px 9px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid var(--border)">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:10px">' +
                    '<span class="mono" style="color:#c084fc;font-weight:700">' + escHtml(tStr) + ' · ' + rv.tradesAnalyzed + ' trades (' + rv.wins + 'W/' + rv.losses + 'L)</span>' +
                    '<span class="mono" style="color:' + pnlColor + '">' + (rv.netPnl >= 0 ? '+' : '') + Number(rv.netPnl || 0).toFixed(2) + '€ · Range ' + rv.rangeCount + '/' + rv.totalProfiles + '</span>' +
                  '</div>' +
                  '<div style="font-size:11px;color:var(--fg-0);margin-top:3px;line-height:1.35">' + escHtml(rv.directive) + '</div>' +
                  (rv.breakdown ? '<div class="mono" style="font-size:9.5px;color:var(--fg-3);margin-top:2px">' + escHtml(rv.breakdown) + '</div>' : '') +
                '</div>'
              );
            }).join('') +
          '</div>';
      } else {
        reviewsHtml = '<div style="font-size:10.5px;color:var(--fg-3);margin-top:6px">Aucune review enregistrée pour le moment. Cliquez sur « Lancer Review 15m » ou attendez le prochain cycle.</div>';
      }

      var html =
        '<div class="ai-metric-card" style="border-left:3px solid var(--accent);display:block">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
            '<div style="font-weight:700">Auto-Réflexion 15 min (Trade Reviewer -> Stratège)</div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span class="mono" style="font-size:10px;color:var(--fg-3)">Prochain : ' + escHtml(fmtCountdown15m(lastRevAt)) + '</span>' +
              '<button type="button" class="pill-btn btn-trigger-review15m" style="font-size:10px;padding:3px 9px" onclick="triggerSelfReflectionNow()">Lancer Review 15m</button>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:11.5px;color:var(--fg-0);margin-top:4px;line-height:1.38;font-weight:600">' + escHtml(directive15m) + '</div>' +
          reviewsHtml +
        '</div>' +
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
      btn.textContent = gridLocked ? 'VERR Grille Verrouillée' : 'LIBRE Grille Déverrouillée';
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
        btnExec.textContent = isAuto ? 'Full Auto' : 'Confirmation Humaine';
        btnExec.className = 'pill-btn ' + (isAuto ? 'auto-on' : 'auto-off');
      }

      var isHalted = Boolean(deskState.halted);
      var hDot = document.getElementById('liveHealthDot');
      if (hDot) hDot.classList.toggle('halted', isHalted);
      var haltBtn = document.getElementById('btnPanicHalt');
      if (haltBtn) haltBtn.classList.toggle('resuming', isHalted);
      var emerHaltLbl = document.getElementById('emergencyHaltLabel');
      if (emerHaltLbl) emerHaltLbl.textContent = isHalted ? 'RESUME' : 'HALT DESK';

      var lev = (deskState && deskState.settings && deskState.settings.defaultLeverage) || s.defaultLeverage || 5;
      var navLevEl = document.getElementById('navLevBadge');
      if (navLevEl) navLevEl.textContent = 'x' + lev;
      highlightLevPresets(lev);
      var tpmLive = Math.max(1, Math.min(60, Math.round(Number(s.tradesPerMinute || (60 / Math.max(1, s.scalpIntervalSec || 15))) || 4)));
      var focusLive = String(s.focusSymbol || '').trim().toUpperCase();
      var navCadEl = document.getElementById('navCadenceBadge');
      if (navCadEl) {
        navCadEl.textContent = (focusLive ? (focusLive + ' · ') : '') + tpmLive + '/min';
        navCadEl.style.borderColor = focusLive ? 'var(--up-ring)' : '';
        navCadEl.style.color = focusLive ? 'var(--up)' : '';
      }
      var focusSel = document.getElementById('cfgFocusSymbol');
      if (focusSel) {
        var symPool = (s.symbols && s.symbols.length ? s.symbols : (deskState.tape || []).map(function (r) { return r.symbol; }));
        var cryptoDisabled = Boolean(deskState.mt5Live && deskState.mt5Live.connected && deskState.mt5Live.cryptoSupported === false);
        var symsKey = symPool.join(',') + '|' + (cryptoDisabled ? 'nocryp' : 'all');
        if (focusSel.dataset.syms !== symsKey) {
          var prevVal = focusSel.value || focusLive;
          focusSel.innerHTML = '<option value="">Multi-Actifs (Analyse générale)</option>' + symPool.map(function (sym) {
            var u = String(sym).toUpperCase();
            var tag = (cryptoDisabled && u.endsWith('USDT')) ? ' (Paper · hors MT5 Demo)' : (deskState.mt5Live && deskState.mt5Live.connected ? ' (MT5 Live)' : '');
            return '<option value="' + u + '">' + u + tag + '</option>';
          }).join('');
          focusSel.dataset.syms = symsKey;
          focusSel.value = prevVal;
        } else if (!isStrategyFormDirty && document.activeElement !== focusSel) {
          focusSel.value = focusLive;
        }
      }
      var qMeter = document.getElementById('quotaLiveMeter');
      if (qMeter) {
        var qt = deskState.quotaTelemetry;
        var ex60 = qt ? Number(qt.executedLast60s || 0) : 0;
        var tgt60 = qt ? Number(qt.tradesPerMinTarget || tpmLive) : tpmLive;
        qMeter.textContent = 'Quota 60s : ' + ex60 + ' / ' + tgt60 + (focusLive ? (' · Focus : ' + focusLive) : ' · Multi-Actifs');
        qMeter.style.color = (focusLive && ex60 >= tgt60) ? 'var(--up)' : 'var(--fg-2)';
      }

      var open = (deskState.tickets || []).filter(function (t) { return t.status === 'open'; });
      var pending = (deskState.tickets || []).filter(function (t) { return t.status === 'pending'; });
      var lastPt = (deskState.curve && deskState.curve[deskState.curve.length - 1]) || { eq: deskState.startEquity };
      var hasMt5Live = Boolean(deskState.mt5Live && deskState.mt5Live.connected);
      var eq = hasMt5Live ? deskState.mt5Live.equity : (lastPt.eq || deskState.startEquity || 10000);
      var dayPnl = hasMt5Live ? deskState.mt5Live.profit : (eq - (deskState.dayStartEquity || deskState.startEquity || eq));

      // Synchronisation HUD Permanent KPI Top-Left
      var hudEq = document.getElementById('hudTotalEquityVal');
      if (hudEq) hudEq.textContent = fmtUsd(eq, 2);
      var hudPnl = document.getElementById('hudSessionPnlVal');
      if (hudPnl) {
        hudPnl.textContent = fmtSignedUsd(dayPnl, 2);
        hudPnl.className = 'hud-kpi-val mono ' + (dayPnl >= 0 ? 'up' : 'down');
      }
      var hudRisk = document.getElementById('hudActiveRiskVal');
      if (hudRisk) {
        var totalRiskUsd = open.reduce(function (sum, t) {
          var slDist = Math.abs(t.entry - t.invalidation) / Math.max(t.entry, 1e-9);
          return sum + (t.notional * slDist);
        }, 0);
        var riskPct = eq > 0 ? (totalRiskUsd / eq) * 100 : 0;
        hudRisk.textContent = riskPct.toFixed(2) + '% (' + fmtUsd(totalRiskUsd, 0) + ')';
        hudRisk.style.color = riskPct > 3 ? '#fbbf24' : '#38bdf8';
      }

      var mt5Chip = document.getElementById('deskMt5LiveChip');
      if (mt5Chip) {
        if (hasMt5Live) {
          mt5Chip.style.display = 'inline-flex';
          mt5Chip.style.borderColor = 'rgba(16,185,129,0.55)';
          mt5Chip.style.color = '#10b981';
          mt5Chip.textContent = 'MT5 LIVE #' + deskState.mt5Live.login + ' · Capital Synchronisé (' + Number(deskState.mt5Live.equity || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (deskState.mt5Live.currency || 'EUR') + ')';
        } else {
          mt5Chip.style.display = 'none';
        }
      }
      var localStEl = document.getElementById('mt5LocalBridgeStatus');
      if (localStEl) {
        if (hasMt5Live) {
          localStEl.style.color = '#10b981';
          localStEl.textContent = 'Connecté MT5 #' + deskState.mt5Live.login + ' (' + deskState.mt5Live.server + ') · Solde ' + Number(deskState.mt5Live.balance).toFixed(2) + ' ' + deskState.mt5Live.currency + ' · ' + deskState.mt5Live.positionsCount + ' position(s)';
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
      var heEl = document.getElementById('heroEquity');
      if (heEl) heEl.textContent = fmtUsd(eq, 2);

      var dayStartMs = new Date().setHours(0, 0, 0, 0);
      var closedToday = (deskState.tickets || [])
        .filter(function (t) { return t.status === 'closed' && (t.closedAt || 0) >= dayStartMs; })
        .reduce(function (acc, t) { return acc + Number(t.pnl || 0); }, 0);
      var hcEl = document.getElementById('heroClosedProfit');
      if (hcEl) {
        hcEl.textContent = fmtSignedUsd(closedToday, 2);
        hcEl.className = 'mono ' + (closedToday >= 0 ? 'up' : 'down');
      }

      var rlSum = deskState.rlSummary || {};
      var activeRegime = (deskState.settings && deskState.settings.regime) || 'standard';
      var regSel = document.getElementById('topActiveRegimeSelect');
      if (regSel && regSel.value !== activeRegime) {
        regSel.value = activeRegime;
      }
      var rChip = document.getElementById('deskRegimeChip');
      if (rChip) {
        if (activeRegime === 'hft_kamikaze') {
          rChip.textContent = ' RÉGIME : HFT FIAT-TARGET (KAMIKAZE)';
          rChip.style.background = 'rgba(239, 68, 68, 0.25)';
          rChip.style.color = '#fca5a5';
          rChip.style.borderColor = 'rgba(239, 68, 68, 0.6)';
        } else if (activeRegime === 'macro_fvg') {
          rChip.textContent = 'RÉGIME : MACRO FVG';
          rChip.style.background = '';
          rChip.style.color = '';
          rChip.style.borderColor = '';
        } else {
          rChip.textContent = 'RÉGIME : ' + (rlSum.regime || 'STANDARD (WFO/GRPO)');
          rChip.style.background = '';
          rChip.style.color = '';
          rChip.style.borderColor = '';
        }
      }
      document.getElementById('deskRlChip').textContent = 'IA ÉPISODE #' + (rlSum.totalEpisodes || 0);
      var shieldOn = (deskState.volatilityShieldUntil || 0) > Date.now();
      document.getElementById('deskShieldChip').style.display = shieldOn ? 'inline-flex' : 'none';

      // Live Goal Tracker Widget Update
      var goal = deskState.sessionGoal;
      var goalWidget = document.getElementById('goalTrackerWidget');
      if (goal && goalWidget) {
        var gTarget = goal.targetProfitFiat || 2000;
        var gCurrent = goal.currentProfitFiat || 0;
        var gReqVel = goal.requiredVelocityPerHour || 0;
        var gAgg = goal.aggressiveness || 'normal';
        var gStatus = goal.statusLabel || 'SUR LA TRAJECTOIRE';

        var dDate = new Date(goal.deadlineTimestamp || (Date.now() + 4 * 3600 * 1000));
        var dStr = String(dDate.getHours()).padStart(2, '0') + ':' + String(dDate.getMinutes()).padStart(2, '0');

        var tgtEl = document.getElementById('goalTargetVal');
        if (tgtEl) tgtEl.textContent = '$' + Number(gTarget).toLocaleString();
        var gCurEl = document.getElementById('goalCurrentVal');
        if (gCurEl) {
          gCurEl.textContent = (gCurrent >= 0 ? '+$' : '-$') + Math.abs(gCurrent).toFixed(2);
          gCurEl.className = 'goal-metric-val mono ' + (gCurrent >= 0 ? 'up' : 'down');
        }
        var deadEl = document.getElementById('goalDeadlineVal');
        if (deadEl) deadEl.textContent = dStr;
        var velEl = document.getElementById('goalVelocityVal');
        if (velEl) velEl.textContent = '$' + Math.round(gReqVel) + '/h';

        var statBadge = document.getElementById('goalTrackerStatusBadge');
        if (statBadge) statBadge.textContent = gStatus;

        var pct = Math.min(100, Math.max(0, (gCurrent / gTarget) * 100));
        var progBar = document.getElementById('goalProgressBar');
        if (progBar) progBar.style.width = pct.toFixed(1) + '%';

        goalWidget.classList.remove('lagging', 'reached');
        if (gAgg === 'lagging_aggressive') {
          goalWidget.classList.add('lagging');
        } else if (gAgg === 'target_reached') {
          goalWidget.classList.add('reached');
        }
      }

      var activeSyms = s.symbols || ['BTCUSDT', 'ETHUSDT'];
      var chkHost = document.getElementById('assetChecklistHost');
      if (chkHost && !chkHost.dataset.ready) {
        chkHost.innerHTML = ASSET_CATALOG.map(function (grp) {
          var hasActive = grp.items.some(function (it) { return activeSyms.indexOf(it.s) >= 0; });
          var openAttr = hasActive ? ' open' : '';
          return (
            '<details class="asset-accordion"' + openAttr + '>' +
              '<summary>' +
                '<div class="asset-summary-left">' +
                  '<span class="asset-cat-tag">' + grp.tag + '</span>' +
                  '<span>' + grp.cat + ' (' + grp.items.length + ')</span>' +
                '</div>' +
                '<div class="asset-summary-actions" onclick="event.stopPropagation()">' +
                  '<button type="button" class="asset-quick-btn" data-cat="' + grp.id + '" onclick="toggleCategoryAssets(this.dataset.cat, true)">Tous</button>' +
                  '<button type="button" class="asset-quick-btn" data-cat="' + grp.id + '" onclick="toggleCategoryAssets(this.dataset.cat, false)">Aucun</button>' +
                '</div>' +
              '</summary>' +
              '<div class="asset-grid" id="cat-body-' + grp.id + '">' +
                grp.items.map(function (it) {
                  var checked = activeSyms.indexOf(it.s) >= 0 ? ' checked' : '';
                  return '<label class="asset-item"><input type="checkbox" class="asset-chk" value="' + it.s + '"' + checked + ' /><span>' + it.l + '</span></label>';
                }).join('') +
              '</div>' +
            '</details>'
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
        if (s.mt5LastStatus) document.getElementById('mt5StatusMsg').textContent = (s.mt5Connected ? 'OK · ' : '') + s.mt5LastStatus;
        if (s.tgBotsConfigured > 0 && s.tgChatId) {
          document.getElementById('tgStatusMsg').textContent = 'OK · ' + s.tgBotsConfigured + ' bot(s) Telegram actif(s) · Chat ID ' + s.tgChatId;
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
      renderPinnedChartPositions();
      if (currentTab === 'charts') {
        if (chartEngine === 'desk') {
          updateLiveDeskChartCandle(getActiveChartSymbol());
        }
        syncChartExecutionOverlays();
      }
      updateToggleAllAssetsLabel();
      renderChat();
      renderJournalView();
      renderRlMetrics();
      renderAgentPromptsEditor();
      renderReviewerTab();
      if (currentTab === 'journal') {
        if (!eqChart) renderEquityChart();
        else updateLiveEquityChart();
      }
    }

    function renderReviewerTab() {
      if (!deskState) return;
      var hist = Array.isArray(deskState.selfReflectionHistory)
        ? deskState.selfReflectionHistory.slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); })
        : [];
      var latest = hist.length > 0 ? hist[0] : null;

      var nextAt = deskState.lastSelfReflectionAt ? (deskState.lastSelfReflectionAt + 15 * 60 * 1000) : 0;
      var remSec = nextAt > 0 ? Math.max(0, Math.round((nextAt - Date.now()) / 1000)) : 0;
      var cdEl = document.getElementById('revTabCountdown');
      if (cdEl) {
        var mm = String(Math.floor(remSec / 60)).padStart(2, '0');
        var ss = String(remSec % 60).padStart(2, '0');
        cdEl.textContent = nextAt > 0 ? ('Prochain audit : ' + mm + ':' + ss) : 'Premier audit en attente';
      }

      var dirEl = document.getElementById('revTabDirective');
      if (dirEl) {
        dirEl.textContent = (latest && latest.directive) || deskState.current_market_regime_directive || 'En attente du premier audit 15m...';
      }

      var wrEl = document.getElementById('revKpiWinRate');
      var wlEl = document.getElementById('revKpiWlCount');
      var awEl = document.getElementById('revKpiAvgWin');
      var alEl = document.getElementById('revKpiAvgLoss');
      var dsEl = document.getElementById('revKpiDirSplit');
      var npEl = document.getElementById('revKpiNetPnl');

      if (latest) {
        var wr = latest.winRatePct != null ? latest.winRatePct : (latest.tradesAnalyzed > 0 ? Math.round((latest.wins / latest.tradesAnalyzed) * 1000) / 10 : 0);
        if (wrEl) {
          wrEl.textContent = wr.toFixed(1) + '%';
          wrEl.className = 'mono ' + (wr >= 50 ? 'up' : 'down');
        }
        if (wlEl) wlEl.textContent = (latest.wins || 0) + 'W / ' + (latest.losses || 0) + 'L (' + (latest.tradesAnalyzed || 0) + ' trades)';
        if (awEl) awEl.textContent = '+' + Number(latest.avgWin || 0).toFixed(2) + '€';
        if (alEl) alEl.textContent = Number(latest.avgLoss || 0).toFixed(2) + '€';
        if (dsEl) {
          var ls = latest.longStats || { n: 0, wins: 0, pnl: 0 };
          var ss2 = latest.shortStats || { n: 0, wins: 0, pnl: 0 };
          dsEl.textContent = 'L ' + (ls.n || 0) + 't (' + (ls.pnl >= 0 ? '+' : '') + Number(ls.pnl || 0).toFixed(1) + '€) · S ' + (ss2.n || 0) + 't (' + (ss2.pnl >= 0 ? '+' : '') + Number(ss2.pnl || 0).toFixed(1) + '€)';
        }
        if (npEl) {
          npEl.textContent = 'Net : ' + (latest.netPnl >= 0 ? '+' : '') + Number(latest.netPnl || 0).toFixed(2) + '€ · Range ' + (latest.rangeCount || 0) + '/' + (latest.totalProfiles || 0);
        }
      }

      var recHost = document.getElementById('revTabRecommendations');
      if (recHost) {
        var recs = (latest && Array.isArray(latest.recommendations) && latest.recommendations.length > 0)
          ? latest.recommendations
          : ["Cliquez sur 'Lancer Audit Complet Reviewer' pour générer une analyse détaillée des derniers trades et des recommandations pour chaque agent."];
        recHost.innerHTML = recs.map(function (r, idx) {
          return '<div style="padding:7px 9px;border-radius:7px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.22)"><strong>#' + (idx + 1) + '</strong> · ' + escHtml(r) + '</div>';
        }).join('');
      }

      var detHost = document.getElementById('revTabDetailedReport');
      if (detHost) {
        detHost.textContent = (latest && latest.detailedReport) ? latest.detailedReport : (latest ? (latest.breakdown + '\\n\\nDirective : ' + latest.directive) : 'Aucun rapport généré pour le moment.');
      }

      var bdHost = document.getElementById('revTabBreakdowns');
      if (bdHost) {
        var assets = (latest && Array.isArray(latest.assetBreakdown)) ? latest.assetBreakdown : [];
        var setups = (latest && Array.isArray(latest.setupBreakdown)) ? latest.setupBreakdown : [];
        var htmlParts = [];
        if (assets.length > 0) {
          htmlParts.push('<div style="font-weight:700;color:var(--fg-2)">Actifs</div>' + assets.map(function (a) {
            var cls = a.pnl >= 0 ? 'up' : 'down';
            return '<div style="display:flex;justify-content:space-between"><span>' + escHtml(a.symbol) + ' (' + (a.n || 0) + 't, ' + a.wins + 'W)</span><span class="mono ' + cls + '">' + (a.pnl >= 0 ? '+' : '') + Number(a.pnl).toFixed(2) + '€</span></div>';
          }).join(''));
        }
        if (setups.length > 0) {
          htmlParts.push('<div style="font-weight:700;color:var(--fg-2);margin-top:6px">Setups</div>' + setups.map(function (st) {
            var cls = st.pnl >= 0 ? 'up' : 'down';
            return '<div style="display:flex;justify-content:space-between"><span>' + escHtml(st.setup) + ' (' + (st.n || 0) + 't, ' + st.wins + 'W)</span><span class="mono ' + cls + '">' + (st.pnl >= 0 ? '+' : '') + Number(st.pnl).toFixed(2) + '€</span></div>';
          }).join(''));
        }
        if (!htmlParts.length) {
          htmlParts.push('<span style="color:var(--fg-3)">' + escHtml((latest && latest.breakdown) || 'Aucune ventilation disponible.') + '</span>');
        }
        bdHost.innerHTML = htmlParts.join('');
      }

      var tlHost = document.getElementById('revTabTimeline');
      if (tlHost) {
        if (!hist.length) {
          tlHost.innerHTML = '<div style="color:var(--fg-3);font-size:11px">Aucun cycle 15m enregistré.</div>';
        } else {
          tlHost.innerHTML = hist.slice(0, 12).map(function (ev) {
            var hh = String(ev.atIso || '').slice(11, 16) || '--:--';
            var cls = ev.netPnl >= 0 ? 'up' : 'down';
            return '<div style="padding:7px 9px;border-radius:7px;background:rgba(255,255,255,0.03);border:1px solid var(--border)">' +
              '<div style="display:flex;justify-content:space-between;font-size:11px"><strong class="mono">' + hh + ' UTC</strong><span class="mono ' + cls + '">' + ev.wins + 'W/' + ev.losses + 'L · ' + (ev.netPnl >= 0 ? '+' : '') + Number(ev.netPnl).toFixed(2) + '€</span></div>' +
              '<div style="font-size:11px;color:var(--fg-2);margin-top:3px">' + escHtml(ev.directive || '') + '</div>' +
            '</div>';
          }).join('');
        }
      }

      var pmBody = document.getElementById('revTabPostMortemBody');
      if (pmBody) {
        var closedTickets = (deskState.tickets || [])
          .filter(function (t) { return t.status === 'closed'; })
          .slice()
          .sort(function (a, b) { return (b.closedAt || 0) - (a.closedAt || 0); })
          .slice(0, 25);
        if (!closedTickets.length) {
          pmBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--fg-3)">Aucun trade clôturé.</td></tr>';
        } else {
          pmBody.innerHTML = closedTickets.map(function (t) {
            var ts = t.closedAt ? new Date(t.closedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            var pnl = Number(t.pnl || 0);
            var cls = pnl >= 0 ? 'up' : 'down';
            var dirCls = t.direction === 'long' ? 'up' : 'down';
            var reason = t.closeReason || 'closed';
            if (t.progressiveLockRatio) reason += ' (BE ' + Math.round(t.progressiveLockRatio * 100) + '%)';
            return '<tr>' +
              '<td class="mono">' + ts + '</td>' +
              '<td><strong>' + escHtml(t.asset) + '</strong></td>' +
              '<td class="mono ' + dirCls + '">' + String(t.direction || '').toUpperCase() + '</td>' +
              '<td>' + escHtml(t.engine || t.playbook || '-') + '</td>' +
              '<td style="color:var(--fg-2)">' + escHtml(reason) + '</td>' +
              '<td class="mono ' + cls + '" style="text-align:right">' + (pnl >= 0 ? '+' : '') + pnl.toFixed(2) + '€</td>' +
            '</tr>';
          }).join('');
        }
      }

      var msgHost = document.getElementById('revTabMessages');
      if (msgHost) {
        var revMsgs = (deskState.messages || [])
          .filter(function (m) { return m.speaker === 'reviewer' || m.agentId === 'reviewer'; })
          .slice(-20)
          .reverse();
        if (!revMsgs.length) {
          msgHost.innerHTML = '<div style="color:var(--fg-3)">Aucun message du Reviewer pour le moment.</div>';
        } else {
          msgHost.innerHTML = revMsgs.map(function (m) {
            var ts = m.at ? new Date(m.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
            return '<div style="padding:7px 9px;border-radius:7px;background:rgba(255,255,255,0.03);border:1px solid var(--border)">' +
              '<div class="mono" style="font-size:10px;color:var(--fg-3);margin-bottom:3px">' + ts + ' · ' + escHtml(m.kind || 'report') + '</div>' +
              '<div style="color:var(--fg-1);line-height:1.4">' + escHtml(m.text || '') + '</div>' +
            '</div>';
          }).join('');
        }
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
