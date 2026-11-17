import type React from "react";
import type { MarketProfileSummary, Ticket } from "../types.ts";

export interface ChartsProps {
  symbol: string;
  marketProfile?: MarketProfileSummary;
  tickets?: Ticket[];
}

export const Charts: React.FC<ChartsProps> = ({ symbol, marketProfile, tickets = [] }) => {
  const bins = (marketProfile?.bins ?? []).slice().sort((a, b) => b.price - a.price);
  const maxBinVol = Math.max(1e-9, ...bins.map((b) => b.volume));
  const openTickets = tickets.filter((t) => t.status === "open" && t.asset === symbol);
  const statusText = marketProfile
    ? marketProfile.isRange
      ? "STATUS: IN RANGE"
      : "STATUS: IMBALANCE/TRENDING"
    : "STATUS: EN ATTENTE";

  return (
    <div className="flex w-full h-[calc(100vh-64px)] pt-16 bg-[#050811]">
      {/* Zone Gauche (75%) : Chandeliers purs + positions ExecutionTrader / marqueurs */}
      <div className="relative w-3/4 h-full min-w-0">
        <div
          id="lightweight-charts-viewport"
          data-symbol={symbol}
          data-open-positions={openTickets.length}
          className="h-full w-full"
        />
      </div>

      {/* Zone Droite (25%) : Panneau latéral Market Profile & Volume Node */}
      <aside
        aria-label="Market Profile & Volume Node"
        className="w-1/4 h-full min-w-[240px] bg-black/40 border-l border-white/10 p-4 flex flex-col gap-4 overflow-y-auto text-slate-200"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Market Profile & Volume Node
          </h3>
          <span className="font-mono text-[11px] text-slate-400">{symbol}</span>
        </div>

        <div className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 text-xs font-mono font-bold tracking-wide">
          {statusText}
        </div>

        <div className="grid grid-cols-1 gap-2 font-mono text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-yellow-500/30">
            <span className="text-slate-400">POC (Point of Control)</span>
            <span className="text-yellow-400 font-bold">
              {marketProfile ? marketProfile.poc.toFixed(4) : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-sky-500/30">
            <span className="text-slate-400">VAH (Value Area High)</span>
            <span className="text-sky-400 font-bold">
              {marketProfile ? marketProfile.vah.toFixed(4) : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-sky-500/30">
            <span className="text-slate-400">VAL (Value Area Low)</span>
            <span className="text-sky-400 font-bold">
              {marketProfile ? marketProfile.val.toFixed(4) : "--"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-h-0">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Distribution Volume par Prix
          </div>
          {bins.length === 0 ? (
            <div className="text-xs text-slate-500">En attente des bougies de session...</div>
          ) : (
            <div className="flex flex-col gap-1 overflow-y-auto pr-1">
              {bins.map((bin) => {
                const widthPct = Math.max(4, Math.round((bin.volume / maxBinVol) * 100));
                const barClass = bin.isPoc
                  ? "bg-yellow-400"
                  : bin.inValueArea
                    ? "bg-sky-400/80"
                    : "bg-slate-600/60";
                return (
                  <div key={bin.price} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className={`w-16 text-right ${bin.isPoc ? "text-yellow-400 font-bold" : bin.inValueArea ? "text-sky-300" : "text-slate-500"}`}>
                      {bin.price.toFixed(2)}
                    </span>
                    <div className="flex-1 h-2 bg-white/5 rounded overflow-hidden">
                      <div className={`h-full ${barClass} rounded`} style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Charts;
