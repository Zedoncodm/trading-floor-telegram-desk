import type React from "react";
import type { SessionGoal } from "../types.ts";

export interface Desk3DProps {
  sessionGoal?: SessionGoal;
}

export const Desk3D: React.FC<Desk3DProps> = ({ sessionGoal }) => {
  if (!sessionGoal) return null;

  const current = sessionGoal.currentProfitFiat ?? 0;
  const target = sessionGoal.targetProfitFiat ?? 2000;
  const progressPct = Math.min(100, Math.max(0, (current / target) * 100));
  const isLagging = sessionGoal.aggressiveness === "lagging_aggressive";
  const isReached = sessionGoal.aggressiveness === "target_reached";

  const deadlineDate = new Date(sessionGoal.deadlineTimestamp);
  const deadlineStr = `${deadlineDate.getHours().toString().padStart(2, "0")}:${deadlineDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* 3D Canvas Mock / Target Container */}
      <div id="desk-3d-canvas-container" className="absolute inset-0 z-0 bg-neutral-950" />

      {/* LIVE GOAL TRACKER WIDGET FLOATING OVER 3D CANVAS */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl">
        <div
          className={`px-5 py-3.5 rounded-xl border backdrop-blur-xl transition-all shadow-2xl ${
            isLagging
              ? "bg-red-950/60 border-red-500/80 shadow-[0_0_24px_rgba(239,68,68,0.5)] animate-pulse"
              : isReached
                ? "bg-emerald-950/60 border-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.5)]"
                : "bg-neutral-900/80 border-neutral-700/80 shadow-[0_0_16px_rgba(0,0,0,0.6)]"
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLagging
                    ? "bg-red-500 animate-ping"
                    : isReached
                      ? "bg-emerald-400"
                      : "bg-amber-400 animate-pulse"
                }`}
              />
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-300 font-semibold">
                Objectif de Session
              </span>
            </div>

            <div
              className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded ${
                isLagging
                  ? "bg-red-500/20 text-red-300 border border-red-500/50"
                  : isReached
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                    : "bg-neutral-800 text-neutral-300 border border-neutral-700"
              }`}
            >
              {sessionGoal.statusLabel}
            </div>
          </div>

          {/* Metric Details */}
          <div className="grid grid-cols-4 gap-2 text-center py-1">
            <div className="bg-black/40 rounded px-2 py-1">
              <div className="text-[9px] font-mono text-neutral-500 uppercase">Cible</div>
              <div className="text-xs font-mono font-bold text-neutral-200">${target}</div>
            </div>
            <div className="bg-black/40 rounded px-2 py-1">
              <div className="text-[9px] font-mono text-neutral-500 uppercase">Actuel</div>
              <div
                className={`text-xs font-mono font-bold ${
                  current >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                ${current >= 0 ? "+" : ""}
                {current}
              </div>
            </div>
            <div className="bg-black/40 rounded px-2 py-1">
              <div className="text-[9px] font-mono text-neutral-500 uppercase">Échéance</div>
              <div className="text-xs font-mono font-bold text-neutral-200">{deadlineStr}</div>
            </div>
            <div className="bg-black/40 rounded px-2 py-1">
              <div className="text-[9px] font-mono text-neutral-500 uppercase">Vitesse Req.</div>
              <div className="text-xs font-mono font-bold text-amber-300">
                ${sessionGoal.requiredVelocityPerHour}/h
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 w-full bg-neutral-950/80 h-2 rounded-full overflow-hidden border border-neutral-800">
            <div
              className={`h-full transition-all duration-500 ${
                isLagging
                  ? "bg-gradient-to-r from-orange-500 to-red-500"
                  : isReached
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-blue-500 to-emerald-400"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Desk3D;
