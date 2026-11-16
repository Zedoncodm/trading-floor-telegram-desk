import type React from "react";
import type { SessionGoal, TradingRegime } from "../types.ts";

export interface HeaderProps {
  currentRegime: TradingRegime;
  onRegimeChange: (regime: TradingRegime) => void;
  sessionGoal?: SessionGoal;
  equity: number;
  realizedPnl: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRegime,
  onRegimeChange,
  sessionGoal,
  equity,
  realizedPnl,
}) => {
  const isLagging = sessionGoal?.aggressiveness === "lagging_aggressive";
  const isKamikaze = currentRegime === "hft_kamikaze";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-sm font-semibold tracking-wider text-neutral-100 uppercase">
            Trading Floor Desk
          </h1>
        </div>

        {/* ACTIVE REGIME FAST SWITCHER */}
        <div className="flex items-center gap-2 pl-4 border-l border-neutral-800">
          <label htmlFor="regime-select" className="text-xs font-mono text-neutral-400 font-medium">
            RÉGIME ACTIF :
          </label>
          <select
            id="regime-select"
            value={currentRegime}
            onChange={(e: any) => onRegimeChange(e.target.value as TradingRegime)}
            className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isKamikaze
                ? "bg-red-950/70 border-red-500/80 text-red-200 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                : "bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-500"
            }`}
          >
            <option value="standard">Standard (WFO/GRPO)</option>
            <option value="macro_fvg">Macro FVG</option>
            <option value="hft_kamikaze">HFT FIAT-TARGET (KAMIKAZE)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">Équité Totale</div>
          <div className="text-sm font-mono font-bold text-neutral-100">
            {equity.toLocaleString("fr-FR", { style: "currency", currency: "USD" })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-neutral-500 uppercase">PnL Réalisé</div>
          <div
            className={`text-sm font-mono font-bold ${
              realizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {realizedPnl >= 0 ? "+" : ""}
            {realizedPnl.toLocaleString("fr-FR", { style: "currency", currency: "USD" })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
