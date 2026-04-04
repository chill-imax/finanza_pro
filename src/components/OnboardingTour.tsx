/**
 * OnboardingTour.tsx — VERSIÓN ACTUALIZADA
 * ─────────────────────────────────────────────────────────────────────────────
 * Cambios respecto a la versión anterior:
 *  1. Reducido a 1 slide de bienvenida (el resto lo hace SpotlightTour)
 *  2. Al cerrar/terminar, dispara el evento "finanzapro:onboarding-done"
 *     para que SpotlightTour arranque automáticamente.
 *
 * Si prefieres mantener los slides originales, simplemente restaura el array
 * SLIDES con todos los slides anteriores — el evento al final funciona igual.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from "react";
import { X, Sparkles, ChevronRight } from "lucide-react";

const STORAGE_KEY = "finanzapro_onboarding_done";

export const OnboardingTour: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeTour = () => {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsVisible(false);
      setIsExiting(false);
      // ← Lanza el evento para que SpotlightTour arranque
      window.dispatchEvent(new CustomEvent("finanzapro:onboarding-done"));
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${
          isExiting ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-6 pt-8 pb-6 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 -left-4 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none" />

          <button
            onClick={closeTour}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Dot indicator — solo 1 punto porque es 1 slide */}
          <div className="flex gap-1 mb-5">
            <div className="h-1 w-6 rounded-full bg-white" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-white">
              <Sparkles className="w-7 h-7" />
            </div>
            <span className="text-4xl leading-none">👋</span>
          </div>

          <h2 className="text-2xl font-black text-white leading-tight mb-1">
            Bienvenido a FinanzaPro
          </h2>
          <p className="text-sm font-semibold text-indigo-100">
            Tu bolsillo inteligente
          </p>
        </div>

        {/* White body */}
        <div className="bg-white px-6 pt-5 pb-6 space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed [&_strong]:text-slate-900 [&_strong]:font-bold">
            Controla tus <strong>gastos, ingresos, deudas y ahorros</strong>{" "}
            desde un solo lugar. En menos de <strong>2 minutos</strong> te
            mostramos cómo funciona cada parte de la app.
          </p>

          <div className="rounded-2xl border p-4 bg-slate-50 border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              ¿Sabías que?
            </p>
            <p className="text-xs text-slate-600 leading-relaxed [&_strong]:text-slate-800 [&_strong]:font-bold">
              El <strong>78% de las personas</strong> que registran sus gastos
              logran ahorrar al menos un <strong>20% más</strong> al mes.
            </p>
          </div>

          <button
            onClick={closeTour}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-lg"
          >
            Mostrarme cómo funciona
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
