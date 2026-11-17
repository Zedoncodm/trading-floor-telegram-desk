import React from "react";
import type { DeskState, TradingRegime } from "../types.ts";
import { Desk3D } from "./Desk3D.tsx";
import { Charts } from "./Charts.tsx";
import { NotionJournal } from "./NotionJournal.tsx";
import { Salon } from "./Salon.tsx";

export type ViewMode = "spatial" | "charts" | "ledger" | "training";

export interface AppProps {
  state: DeskState;
  activeTab?: "desk" | "charts" | "chat" | "journal";
  onRegimeChange?: (r: TradingRegime) => void;
  onCloseAll?: () => void;
  onToggleHalt?: () => void;
  onResetMt5Profile?: () => void;
}

// Icônes SVG Inline Ultra-Clean (aucun emoji)
const Icons = {
  SpatialDesk: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Charts: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Ledger: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Training: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  CloseAll: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Power: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  ),
  RefreshUser: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  )
};

export const App: React.FC<AppProps> = ({
  state,
  activeTab: initialTab = "desk",
  onCloseAll,
  onToggleHalt,
  onResetMt5Profile,
}) => {
  const [currentView, setCurrentView] = React.useState<ViewMode>(
    initialTab === "charts" ? "charts" : initialTab === "journal" ? "ledger" : "spatial"
  );

  const closedTrades = state.tickets.filter((t) => t.status === "closed");
  const openPositions = state.tickets.filter((t) => t.status === "open");
  const lastCurve = state.curve[state.curve.length - 1];
  
  // KPI Synchronisé MT5 / Paper
  const totalEquity = state.mt5Live?.connected ? state.mt5Live.equity : (lastCurve?.eq ?? state.startEquity);
  const sessionPnl = state.mt5Live?.connected
    ? state.mt5Live.profit
    : openPositions.reduce((s, t) => s + (t.mt5Profit ?? t.pnl ?? 0), 0);

  const dayStart = new Date().setHours(0, 0, 0, 0);
  const dailyClosedProfit = closedTrades
    .filter((t) => (t.closedAt ?? 0) >= dayStart)
    .reduce((s, t) => s + (t.pnl ?? 0), 0);

  // Active Risk = Somme des montants au stop sur les positions ouvertes
  const activeRiskUsd = openPositions.reduce((s, t) => {
    const slDist = Math.abs(t.entry - t.invalidation) / Math.max(t.entry, 1e-9);
    return s + (t.notional * slDist);
  }, 0);
  const activeRiskPct = totalEquity > 0 ? (activeRiskUsd / totalEquity) * 100 : 0;

  return (
    <div className="relative w-screen h-screen bg-[#000000] text-neutral-100 overflow-hidden select-none">
      {/* 1. HUD PERMANENT KPI TOP-LEFT (TOUJOURS VISIBLE) */}
      <div className="absolute top-5 left-6 z-50 flex items-center gap-4 pointer-events-auto">
        <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-5">
          <div>
            <div className="text-[9.5px] uppercase font-mono tracking-wider text-neutral-400">Total Equity (MT5)</div>
            <div className="text-sm font-mono font-bold text-neutral-100">
              {totalEquity.toLocaleString("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-[1px] h-7 bg-white/10" />
          <div>
            <div className="text-[9.5px] uppercase font-mono tracking-wider text-neutral-400">Session PnL</div>
            <div className={`text-sm font-mono font-bold ${sessionPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {sessionPnl >= 0 ? "+" : ""}{sessionPnl.toLocaleString("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-[1px] h-7 bg-white/10" />
          <div>
            <div className="text-[9.5px] uppercase font-mono tracking-wider text-neutral-400">Active Risk</div>
            <div className={`text-sm font-mono font-bold ${activeRiskPct > 3 ? "text-amber-400" : "text-sky-400"}`}>
              {activeRiskPct.toFixed(2)}% ({activeRiskUsd.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 })})
            </div>
          </div>
        </div>
      </div>

      {/* 2. EMERGENCY WIDGET TOP-RIGHT (CLOSE ALL, HALT DESK, NEW MT5 PROFILE) */}
      <div className="absolute top-5 right-6 z-50 flex items-center gap-2.5 pointer-events-auto">
        <button
          onClick={onCloseAll}
          className="glass-panel flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border-rose-500/30 transition-all font-mono font-semibold text-xs"
          title="Fermer immédiatement toutes les positions ouvertes"
        >
          <Icons.CloseAll />
          <span>CLOSE ALL</span>
        </button>

        <button
          onClick={onToggleHalt}
          className={`glass-panel flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all font-mono font-semibold text-xs ${
            state.halted
              ? "bg-amber-500/20 text-amber-300 border-amber-500"
              : "text-amber-400 hover:bg-amber-500/20 border-amber-500/30"
          }`}
          title={state.halted ? "Reprendre le desk" : "Mettre le desk en pause d'urgence"}
        >
          <Icons.Power />
          <span>{state.halted ? "RESUME" : "HALT DESK"}</span>
        </button>

        <button
          onClick={onResetMt5Profile}
          className="glass-panel flex items-center gap-2 px-3.5 py-2 rounded-xl text-sky-400 hover:bg-sky-500/20 border-sky-500/30 transition-all font-mono font-semibold text-xs"
          title="Réinitialiser un compte / profil MT5 pour les tests"
        >
          <Icons.RefreshUser />
          <span>NEW MT5 PROFILE</span>
        </button>
      </div>

      {/* 3. CONTENU PRINCIPAL PAR VUE SPATIALE */}
      <div className="w-full h-full">
        {currentView === "spatial" && (
          <Desk3D
            activities={state.activities}
            pulses={state.pulses}
            equity={totalEquity}
            currentPnl={sessionPnl}
            dailyClosedProfit={dailyClosedProfit}
          />
        )}

        {currentView === "charts" && (
          <div className="w-full h-full pt-20 pb-24 px-6 bg-[#000000]">
            <Charts symbol={state.settings.symbols[0] ?? "BTCUSDT"} />
          </div>
        )}

        {currentView === "ledger" && (
          <div className="w-full h-full pt-20 pb-24 px-6 bg-[#000000] overflow-y-auto">
            <NotionJournal
              startEquity={state.startEquity}
              closedTrades={closedTrades}
              openPositions={openPositions}
              curve={state.curve}
              timeframe="ALL"
              onSelectTimeframe={() => {}}
            />
          </div>
        )}

        {currentView === "training" && (
          <div className="w-full h-full pt-20 pb-24 px-6 bg-[#000000] overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="glass-panel p-6 rounded-2xl border-white/10">
                <h2 className="text-lg font-mono font-bold text-sky-400 mb-2">Entraînement Renforcement RL & GRPO</h2>
                <p className="text-xs text-neutral-400 font-mono mb-4">
                  Modèle d'optimisation WFO 90j + OOS sans contamination. Ajustement automatique des paramètres ATR, Lookback et Reward.
                </p>
                <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-neutral-400 mb-1">Episodes Évalués</div>
                    <div className="text-lg font-bold text-white">{state.rlSummary?.totalEpisodes ?? 0}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-neutral-400 mb-1">Avantage Moyen (Â)</div>
                    <div className="text-lg font-bold text-emerald-400">+{((state.rlSummary?.meanAdvantage ?? 0) * 100).toFixed(2)}%</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-neutral-400 mb-1">Dernier Rapport</div>
                    <div className="text-xs text-neutral-300 truncate">{state.lastTrainingReport?.recommendation ?? "Modèle stable (Prêt)"}</div>
                  </div>
                </div>
              </div>

              {/* Console des messages agents */}
              <div className="glass-panel p-6 rounded-2xl border-white/10 h-80">
                <h3 className="text-sm font-mono font-bold text-neutral-300 mb-3">Salon & Télémétrie Agents</h3>
                <Salon messages={state.messages} activeChannel="floor-general" onSelectChannel={() => {}} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAC OS FLOATING DOCK (CENTRÉ TOUT EN BAS) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="glass-panel rounded-3xl flex items-center gap-2 p-2 px-3 shadow-2xl border-white/10">
          {[
            { id: "spatial", label: "Spatial Desk", icon: <Icons.SpatialDesk /> },
            { id: "charts", label: "Charts", icon: <Icons.Charts /> },
            { id: "ledger", label: "Ledger", icon: <Icons.Ledger /> },
            { id: "training", label: "RL Training", icon: <Icons.Training /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewMode)}
              className={`
                dock-icon relative group flex flex-col items-center justify-center
                w-12 h-12 rounded-2xl transition-all duration-200
                ${currentView === item.id ? "bg-white/15 text-sky-400 shadow-inner" : "text-neutral-400 hover:text-white"}
              `}
            >
              {item.icon}

              {/* Tooltip macOS */}
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono whitespace-nowrap border border-white/10 pointer-events-none">
                {item.label}
              </div>

              {/* Indicateur actif macOS */}
              {currentView === item.id && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-sky-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
