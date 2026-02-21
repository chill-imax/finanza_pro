import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PiggyBank,
  Flame,
  CalendarRange,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "finanzapro_onboarding_done";

interface Slide {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  subtitle: string;
  body: string;
  fact?: string;
  factLabel?: string;
  color: {
    bg: string;
    iconBg: string;
    pill: string;
    pillText: string;
    button: string;
    factBg: string;
    factText: string;
    factBorder: string;
  };
}

const SLIDES: Slide[] = [
  {
    emoji: "👋",
    icon: <Sparkles className="w-7 h-7" />,
    title: "Bienvenido a FinanzaPro",
    subtitle: "Tu bolsillo inteligente",
    body: "Controla tus gastos, ingresos, deudas y ahorros desde un solo lugar. En menos de 2 minutos estarás listo para tomar el control de tu dinero.",
    fact: "El 78% de las personas que registran sus gastos logran ahorrar al menos un 20% más al mes.",
    factLabel: "¿Sabías que?",
    color: {
      bg: "from-indigo-600 to-violet-700",
      iconBg: "bg-white/15",
      pill: "bg-white/15",
      pillText: "text-indigo-100",
      button: "bg-white text-indigo-700",
      factBg: "bg-white/10",
      factText: "text-indigo-100",
      factBorder: "border-white/20",
    },
  },
  {
    emoji: "➕",
    icon: <Plus className="w-7 h-7" />,
    title: "El botón +",
    subtitle: "Tu acción más importante",
    body: "El botón redondo en la barra inferior es tu atajo para registrar cualquier movimiento: gastos, ingresos o transferencias entre cuentas. Úsalo cada vez que toques tu dinero.",
    fact: "Tip: regístralo en el momento. Después lo olvidas. 😅",
    factLabel: "Consejo pro",
    color: {
      bg: "from-slate-800 to-slate-900",
      iconBg: "bg-white/15",
      pill: "bg-white/10",
      pillText: "text-slate-300",
      button: "bg-white text-slate-800",
      factBg: "bg-white/10",
      factText: "text-slate-300",
      factBorder: "border-white/20",
    },
  },
  {
    emoji: "🏠",
    icon: <LayoutDashboard className="w-7 h-7" />,
    title: "Inicio",
    subtitle: "Tu resumen en un vistazo",
    body: "Ve tu patrimonio total, los últimos movimientos y tu gráfica de gastos. También encontrarás tu racha de días registrando — ¡intenta no romperla!",
    fact: "La racha funciona como los idiomas en Duolingo: un pequeño compromiso diario genera grandes cambios.",
    factLabel: "La ciencia del hábito",
    color: {
      bg: "from-blue-600 to-cyan-600",
      iconBg: "bg-white/15",
      pill: "bg-white/10",
      pillText: "text-blue-100",
      button: "bg-white text-blue-700",
      factBg: "bg-white/10",
      factText: "text-blue-100",
      factBorder: "border-white/20",
    },
  },
  {
    emoji: "💼",
    icon: <Wallet className="w-7 h-7" />,
    title: "Mis Cuentas",
    subtitle: "Todo tu dinero organizado",
    body: "Crea cuentas para cada lugar donde guardas dinero: efectivo, bancos, Zelle, Paypal... El app calculará tu patrimonio total sumando todas.",
    fact: "Puedes transferir entre cuentas usando el botón + y eligiendo 'Transferir'. El saldo se mueve automáticamente.",
    factLabel: "Truco útil",
    color: {
      bg: "from-violet-600 to-purple-700",
      iconBg: "bg-white/15",
      pill: "bg-white/10",
      pillText: "text-violet-100",
      button: "bg-white text-violet-700",
      factBg: "bg-white/10",
      factText: "text-violet-100",
      factBorder: "border-white/20",
    },
  },
  {
    emoji: "🤝",
    icon: <ArrowRightLeft className="w-7 h-7" />,
    title: "Control de Deudas",
    subtitle: "Sabe siempre quién te debe",
    body: "Registra lo que debes y lo que te deben. Cuando alguien te pague (o tú pagues), registra el abono y el saldo se actualiza solo. ¡Se acabó el 'creo que me debes algo'!",
    fact: "Las deudas entre amigos son la causa #1 de conflictos relacionales según estudios de finanzas conductuales.",
    factLabel: "Dato curioso",
    color: {
      bg: "from-rose-600 to-pink-700",
      iconBg: "bg-white/15",
      pill: "bg-white/10",
      pillText: "text-rose-100",
      button: "bg-white text-rose-700",
      factBg: "bg-white/10",
      factText: "text-rose-100",
      factBorder: "border-white/20",
    },
  },
  {
    emoji: "🌱",
    icon: <PiggyBank className="w-7 h-7" />,
    title: "Págate a ti mismo",
    subtitle: "El secreto del ahorro real",
    body: "Antes de pagar cualquier gasto del mes, transfiérete a ti mismo una cantidad fija a tu cuenta de ahorros. Es la estrategia #1 recomendada por planificadores financieros.",
    fact: "México, Colombia y España ya enseñan este método en programas de educación financiera escolar. En EE.UU. se llama 'Pay Yourself First' y es la base de la mayoría de planes de jubilación.",
    factLabel: "🌍 Adoptado globalmente",
    color: {
      bg: "from-emerald-600 to-teal-700",
      iconBg: "bg-white/15",
      pill: "bg-white/10",
      pillText: "text-emerald-100",
      button: "bg-white text-emerald-700",
      factBg: "bg-white/10",
      factText: "text-emerald-100",
      factBorder: "border-white/20",
    },
  },
  {
    emoji: "🔁",
    icon: <CalendarRange className="w-7 h-7" />,
    title: "Transacciones Recurrentes",
    subtitle: "Automatiza lo predecible",
    body: "Al registrar un gasto o ingreso, activa el switch 'Recurrente' y elige la frecuencia. El app lo generará automáticamente: suscripciones, alquileres, salarios...",
    fact: "El 30% de los gastos mensuales son fijos y predecibles. Automatizarlos te da una visión real de tu dinero disponible sin cálculos manuales.",
    factLabel: "Por qué importa",
    color: {
      bg: "from-amber-500 to-orange-600",
      iconBg: "bg-white/15",
      pill: "bg-white/10",
      pillText: "text-amber-100",
      button: "bg-white text-amber-700",
      factBg: "bg-white/10",
      factText: "text-amber-100",
      factBorder: "border-white/20",
    },
  },
  {
    emoji: "🔥",
    icon: <Flame className="w-7 h-7" />,
    title: "Tu Racha",
    subtitle: "El hábito que cambia todo",
    body: "Cada día que registras al menos un movimiento (o marcas 'Sin Movimientos'), tu racha crece. Es tu motivación diaria. Cuida tu racha como cuidas tu billetera.",
    fact: "Estudios de psicología del comportamiento muestran que los hábitos financieros toman entre 21 y 66 días en consolidarse. ¡Tú puedes!",
    factLabel: "La ciencia lo dice",
    color: {
      bg: "from-orange-500 to-red-600",
      iconBg: "bg-white/15",
      pill: "bg-white/10",
      pillText: "text-orange-100",
      button: "bg-white text-orange-700",
      factBg: "bg-white/10",
      factText: "text-orange-100",
      factBorder: "border-white/20",
    },
  },
];

export const OnboardingTour: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // pequeño delay para que la app termine de cargar primero
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
    }, 300);
  };

  const next = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((p) => p + 1);
    } else {
      closeTour();
    }
  };

  const prev = () => {
    if (currentSlide > 0) setCurrentSlide((p) => p - 1);
  };

  if (!isVisible) return null;

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${isExiting ? "opacity-0" : "opacity-100"}`}
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isExiting ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100"}`}
      >
        {/* Gradient header */}
        <div
          className={`bg-gradient-to-br ${slide.color.bg} px-6 pt-8 pb-6 relative overflow-hidden`}
        >
          {/* decorative blobs */}
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 -left-4 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none" />

          {/* close */}
          <button
            onClick={closeTour}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* slide counter pills */}
          <div className="flex gap-1 mb-5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? "w-6 bg-white" : "w-2 bg-white/30"}`}
              />
            ))}
          </div>

          {/* icon + emoji */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-14 h-14 rounded-2xl ${slide.color.iconBg} flex items-center justify-center text-white`}
            >
              {slide.icon}
            </div>
            <span className="text-4xl leading-none">{slide.emoji}</span>
          </div>

          <h2 className="text-2xl font-black text-white leading-tight mb-1">
            {slide.title}
          </h2>
          <p className={`text-sm font-semibold ${slide.color.pillText}`}>
            {slide.subtitle}
          </p>
        </div>

        {/* White body */}
        <div className="bg-white px-6 pt-5 pb-6 space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed">{slide.body}</p>

          {slide.fact && (
            <div
              className={`rounded-2xl border p-4 bg-slate-50 border-slate-100`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {slide.factLabel}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {slide.fact}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-1">
            {currentSlide > 0 && (
              <button
                onClick={prev}
                className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}

            <button
              onClick={next}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 bg-gradient-to-r ${slide.color.bg} text-white shadow-lg`}
            >
              {isLast ? (
                <>¡Comenzar! 🚀</>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={closeTour}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Saltar introducción
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
