/**
 * FinancialTipsCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tarjeta de tips financieros rotativos para el Dashboard.
 * Muestra un tip diferente cada día (basado en la fecha) y permite
 * navegar manualmente entre ellos.
 *
 * USO en DashboardView:
 *   import { FinancialTipsCard } from "../components/FinancialTipsCard";
 *   <FinancialTipsCard />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { FINANCIAL_TIPS, FinancialTip } from "../types";

const TAG_COLORS: Record<FinancialTip["tag"], string> = {
  ahorro: "bg-emerald-100 text-emerald-700",
  inversión: "bg-blue-100 text-blue-700",
  deuda: "bg-red-100 text-red-600",
  hábito: "bg-violet-100 text-violet-700",
  presupuesto: "bg-amber-100 text-amber-700",
};

/** Devuelve el índice del tip del día basado en la fecha actual */
function getDailyIndex(): number {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return dayOfYear % FINANCIAL_TIPS.length;
}

export const FinancialTipsCard: React.FC = () => {
  const [index, setIndex] = useState(() => getDailyIndex());
  const [isAnimating, setIsAnimating] = useState(false);

  const tip = FINANCIAL_TIPS[index];

  const navigate = (dir: 1 | -1) => {
    setIsAnimating(true);
    setTimeout(() => {
      setIndex(
        (prev) => (prev + dir + FINANCIAL_TIPS.length) % FINANCIAL_TIPS.length,
      );
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Tip del día
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[tip.tag]}`}
        >
          {tip.tag}
        </span>
      </div>

      {/* Contenido */}
      <div
        className="px-4 pb-4 transition-opacity duration-150"
        style={{ opacity: isAnimating ? 0 : 1 }}
      >
        <div className="flex gap-3 items-start mb-2">
          <span className="text-3xl leading-none mt-0.5">{tip.emoji}</span>
          <div>
            <p className="font-black text-slate-800 text-sm leading-tight mb-1">
              {tip.title}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">{tip.body}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between px-4 pb-3 border-t border-slate-50 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Puntos indicadores */}
        <div className="flex gap-1">
          {FINANCIAL_TIPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              className={
                "rounded-full transition-all cursor-pointer " +
                (i === index
                  ? "w-4 h-1.5 bg-amber-400"
                  : "w-1.5 h-1.5 bg-slate-200")
              }
            />
          ))}
        </div>

        <button
          onClick={() => navigate(1)}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
