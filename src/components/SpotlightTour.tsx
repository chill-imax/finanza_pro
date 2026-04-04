/**
 * SpotlightTour.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tour interactivo que resalta cada elemento de la UI con un spotlight.
 *
 * CÓMO USARLO:
 * 1. Importa y monta <SpotlightTour /> en App.tsx (ya lo tienes)
 * 2. Agrega data-tour="nombre-paso" a cada elemento que quieras resaltar:
 *
 *    // Botón +
 *    <button data-tour="btn-add" onClick={openNewTransaction} ...>
 *
 *    // Tab Dashboard
 *    <button data-tour="tab-dashboard" onClick={() => setActiveTab('dashboard')} ...>
 *
 *    // Tab Cuentas
 *    <button data-tour="tab-accounts" onClick={() => setActiveTab('accounts')} ...>
 *
 *    // Tab Deudas
 *    <button data-tour="tab-debts" onClick={() => setActiveTab('debts')} ...>
 *
 *    // Header (logo)
 *    <h1 data-tour="header-logo" ...>
 *
 *    // Sección racha (en DashboardView)
 *    <div data-tour="streak-widget" ...>
 *
 *    // Sección balance total (en DashboardView)
 *    <div data-tour="balance-total" ...>
 *
 *    // Botón "Págate a ti mismo" (en DashboardView)
 *    <button data-tour="pay-yourself" ...>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const STORAGE_KEY = "finanzapro_spotlight_done";

interface TourStep {
  target: string; // valor del data-tour="..."
  title: string;
  body: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right" | "auto";
  padding?: number; // espacio extra alrededor del elemento resaltado
}

const STEPS: TourStep[] = [
  {
    target: "btn-add",
    title: "Registra un movimiento",
    body: (
      <>
        Este es tu <strong>botón principal</strong>. Úsalo cada vez que gastes,
        recibas dinero o transfieras entre cuentas. ¡Tócalo ahora para probarlo!
      </>
    ),
    position: "top",
    padding: 10,
  },
  {
    target: "tab-dashboard",
    title: "Inicio — tu resumen",
    body: (
      <>
        Aquí ves tu <strong>patrimonio total</strong>, los últimos movimientos y
        tus gráficas de gastos. Es tu pantalla principal.
      </>
    ),
    position: "top",
    padding: 8,
  },
  {
    target: "tab-accounts",
    title: "Mis Cuentas",
    body: (
      <>
        Crea cuentas para <strong>cada lugar donde guardas dinero</strong>:
        efectivo, banco, Zelle, PayPal... El total se calcula solo.
      </>
    ),
    position: "top",
    padding: 8,
  },
  {
    target: "tab-debts",
    title: "Control de Deudas",
    body: (
      <>
        Registra <strong>lo que debes y lo que te deben</strong>. Cuando alguien
        pague, registra el abono y el saldo se actualiza automáticamente.
      </>
    ),
    position: "top",
    padding: 8,
  },
  {
    target: "balance-total",
    title: "Tu patrimonio total",
    body: (
      <>
        Este número suma <strong>todas tus cuentas en tiempo real</strong>. Es
        tu foto financiera del momento. Mantenlo siempre actualizado.
      </>
    ),
    position: "bottom",
    padding: 12,
  },
  {
    target: "streak-widget",
    title: "Tu racha diaria",
    body: (
      <>
        Cada día que registras un movimiento, tu racha crece <strong>🔥</strong>
        . Funciona como Duolingo: un pequeño hábito diario genera grandes
        cambios financieros.
      </>
    ),
    position: "bottom",
    padding: 8,
  },
  {
    target: "pay-yourself",
    title: "Págate a ti mismo",
    body: (
      <>
        Antes de gastar, <strong>transfiérete a ti mismo a ahorros</strong>. Es
        la estrategia #1 de los planificadores financieros. ¡Pruébalo!
      </>
    ),
    position: "top",
    padding: 8,
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOOLTIP_HEIGHT = 160;
const TOOLTIP_WIDTH = 280;
const SCREEN_PADDING = 16;

export const SpotlightTour: React.FC = () => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Arranca el tour después de que el OnboardingTour termine
  // Escucha el evento custom que lanzaremos desde OnboardingTour
  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (done) return;

    const handler = () => {
      // Pequeño delay para que el modal de onboarding cierre primero
      setTimeout(() => {
        setActive(true);
        setStepIndex(0);
      }, 600);
    };

    window.addEventListener("finanzapro:onboarding-done", handler);
    return () =>
      window.removeEventListener("finanzapro:onboarding-done", handler);
  }, []);

  const measureTarget = useCallback((target: string) => {
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // Actualiza la posición del spotlight en cada frame (por si hay scroll)
  useEffect(() => {
    if (!active) return;
    const step = STEPS[stepIndex];

    const update = () => {
      const rect = measureTarget(step.target);
      setTargetRect(rect);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, stepIndex, measureTarget]);

  const goTo = (index: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStepIndex(index);
      setIsAnimating(false);
    }, 200);
  };

  const next = () => {
    if (stepIndex < STEPS.length - 1) {
      goTo(stepIndex + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (stepIndex > 0) goTo(stepIndex - 1);
  };

  const finish = () => {
    setIsAnimating(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      setActive(false);
      setIsAnimating(false);
    }, 300);
  };

  if (!active) return null;

  const step = STEPS[stepIndex];
  const pad = step.padding ?? 8;
  const isLast = stepIndex === STEPS.length - 1;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // ── Calcular posición del tooltip ──────────────────────────────────────────
  let tooltipTop = 0;
  let tooltipLeft = 0;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (targetRect) {
    const spotTop = targetRect.top - pad;
    const spotBottom = targetRect.top + targetRect.height + pad;
    const spotLeft = targetRect.left - pad;
    const spotCenterX = targetRect.left + targetRect.width / 2;

    // Posición vertical
    const preferredPos = step.position ?? "auto";
    const spaceBelow = vh - spotBottom;
    const spaceAbove = spotTop;

    let placeAbove =
      preferredPos === "top" ||
      (preferredPos === "auto" && spaceAbove > TOOLTIP_HEIGHT + 20);

    if (preferredPos === "bottom") placeAbove = false;

    tooltipTop = placeAbove ? spotTop - TOOLTIP_HEIGHT - 16 : spotBottom + 16;

    // Clamp vertical
    tooltipTop = Math.max(
      SCREEN_PADDING,
      Math.min(tooltipTop, vh - TOOLTIP_HEIGHT - SCREEN_PADDING),
    );

    // Posición horizontal (centrado sobre el elemento)
    tooltipLeft = spotCenterX - TOOLTIP_WIDTH / 2;
    tooltipLeft = Math.max(
      SCREEN_PADDING,
      Math.min(tooltipLeft, vw - TOOLTIP_WIDTH - SCREEN_PADDING),
    );
  } else {
    // Fallback: centro de pantalla
    tooltipTop = vh / 2 - TOOLTIP_HEIGHT / 2;
    tooltipLeft = vw / 2 - TOOLTIP_WIDTH / 2;
  }

  // ── SVG clip path para el "agujero" del spotlight ──────────────────────────
  const spotX = targetRect ? targetRect.left - pad : 0;
  const spotY = targetRect ? targetRect.top - pad : 0;
  const spotW = targetRect ? targetRect.width + pad * 2 : 0;
  const spotH = targetRect ? targetRect.height + pad * 2 : 0;
  const r = 14; // border-radius del recorte

  return (
    <>
      {/* ── Overlay oscuro con agujero ────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          opacity: isAnimating ? 0 : 1,
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <mask id="spotlight-mask">
              {/* Todo blanco = visible (oscuro) */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* El "agujero" en negro = transparente */}
              {targetRect && (
                <rect
                  x={spotX}
                  y={spotY}
                  width={spotW}
                  height={spotH}
                  rx={r}
                  ry={r}
                  fill="black"
                  style={{
                    transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.72)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Borde brillante alrededor del elemento resaltado */}
        {targetRect && (
          <div
            style={{
              position: "absolute",
              top: spotY - 2,
              left: spotX - 2,
              width: spotW + 4,
              height: spotH + 4,
              borderRadius: r + 2,
              border: "2px solid rgba(255,255,255,0.6)",
              boxShadow:
                "0 0 0 4px rgba(255,255,255,0.12), 0 0 24px rgba(255,255,255,0.15)",
              pointerEvents: "none",
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}
      </div>

      {/* ── Tooltip ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: tooltipTop,
          left: tooltipLeft,
          width: TOOLTIP_WIDTH,
          zIndex: 9999,
          borderRadius: 20,
          background: "white",
          boxShadow:
            "0 24px 48px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,0,0.08)",
          padding: "20px",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? "scale(0.96)" : "scale(1)",
        }}
      >
        {/* Barra de progreso */}
        <div
          style={{
            height: 3,
            background: "#f1f5f9",
            borderRadius: 99,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #3b82f6, #6366f1)",
              borderRadius: 99,
              transition: "width 0.35s ease",
            }}
          />
        </div>

        {/* Contador */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94a3b8",
            margin: "0 0 6px",
          }}
        >
          {stepIndex + 1} / {STEPS.length}
        </p>

        {/* Título */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 8px",
            lineHeight: 1.3,
          }}
        >
          {step.title}
        </p>

        {/* Cuerpo */}
        <p
          style={{
            fontSize: 13,
            color: "#475569",
            lineHeight: 1.6,
            margin: "0 0 16px",
          }}
          className="[&_strong]:text-slate-900 [&_strong]:font-bold"
        >
          {step.body}
        </p>

        {/* Navegación */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {stepIndex > 0 && (
            <button
              onClick={prev}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1.5px solid #e2e8f0",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={16} color="#64748b" />
            </button>
          )}

          <button
            onClick={next}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {isLast ? (
              "¡Listo! 🚀"
            ) : (
              <>
                Siguiente <ChevronRight size={14} />
              </>
            )}
          </button>

          <button
            onClick={finish}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            title="Saltar tour"
          >
            <X size={14} color="#94a3b8" />
          </button>
        </div>
      </div>
    </>
  );
};

/**
 * Hook para reiniciar el tour manualmente (útil para un botón "Ver tutorial" en Settings)
 */
export function useResetTour() {
  return () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("finanzapro_onboarding_done");
    window.location.reload();
  };
}
