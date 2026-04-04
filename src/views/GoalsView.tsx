import React, { useState } from "react";
import { Goal, GoalCategory, GOAL_CATEGORY_META, Currency } from "../types";
import {
  Plus,
  Target,
  Trash2,
  PlusCircle,
  CheckCircle2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

// ── Sub-componente: Modal para crear/editar meta ───────────────────────────

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    goal: Omit<Goal, "id" | "createdAt" | "isCompleted" | "savedAmount">,
  ) => void;
  mainCurrency: string;
  userCountry: string;
}

const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mainCurrency,
  userCountry,
}) => {
  const defaultCurrency =
    userCountry === "Venezuela" ? Currency.USD : (mainCurrency as Currency);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<GoalCategory>(GoalCategory.HOME);
  const [targetAmount, setTargetAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [targetDate, setTargetDate] = useState("");
  const [note, setNote] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(7);
  const [enableReminder, setEnableReminder] = useState(false);

  const reset = () => {
    setName("");
    setCategory(GoalCategory.HOME);
    setTargetAmount("");
    setCurrency(defaultCurrency);
    setTargetDate("");
    setNote("");
    setReminderDaysBefore(7);
    setEnableReminder(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0) return;
    onSave({
      name: name.trim(),
      category,
      targetAmount: parseFloat(targetAmount),
      currency,
      targetDate: targetDate || undefined,
      note: note.trim() || undefined,
      reminderDaysBefore:
        enableReminder && targetDate ? reminderDaysBefore : undefined,
    });
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const catMeta = GOAL_CATEGORY_META[category];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800">Nueva Meta</h3>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nombre */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            ¿Para qué estás ahorrando?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Reparar el techo"
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Categoría
          </label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {Object.entries(GOAL_CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCategory(key as GoalCategory)}
                className={
                  "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-bold " +
                  (category === key
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-100 bg-slate-50 text-slate-500")
                }
              >
                <span className="text-xl">{meta.icon}</span>
                <span className="text-[10px] leading-tight text-center">
                  {meta.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Monto objetivo */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Monto objetivo
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>
          {userCountry === "Venezuela" && (
            <div className="w-24">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
              >
                <option value={Currency.USD}>USD</option>
                <option value={Currency.VES}>VES</option>
              </select>
            </div>
          )}
        </div>

        {/* Fecha objetivo */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Fecha objetivo (opcional)
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          />
        </div>

        {/* Recordatorio */}
        {targetDate && (
          <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-bold text-violet-700">
                  Recordatorio
                </span>
              </div>
              <button
                onClick={() => setEnableReminder((p) => !p)}
                className={
                  "w-10 h-6 rounded-full transition-colors relative " +
                  (enableReminder ? "bg-violet-500" : "bg-slate-200")
                }
              >
                <div
                  className={
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all " +
                    (enableReminder ? "left-5" : "left-1")
                  }
                />
              </button>
            </div>
            {enableReminder && (
              <div className="mt-3">
                <label className="text-xs text-violet-600 font-medium">
                  Avisar cuántos días antes:
                </label>
                <select
                  value={reminderDaysBefore}
                  onChange={(e) =>
                    setReminderDaysBefore(Number(e.target.value))
                  }
                  className="w-full mt-1 p-2 bg-white border border-violet-200 rounded-lg text-sm"
                >
                  {[1, 3, 7, 14, 30].map((d) => (
                    <option key={d} value={d}>
                      {d === 1 ? "1 día antes" : `${d} días antes`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Nota */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Nota (opcional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Para el verano de 2025"
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={
            !name.trim() || !targetAmount || parseFloat(targetAmount) <= 0
          }
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          Crear Meta
        </button>
      </div>
    </div>
  );
};

// ── Sub-componente: Modal para abonar a una meta ───────────────────────────

interface ContributeModalProps {
  goal: Goal | null;
  onClose: () => void;
  onContribute: (goalId: string, amount: number) => void;
}

const ContributeModal: React.FC<ContributeModalProps> = ({
  goal,
  onClose,
  onContribute,
}) => {
  const [amount, setAmount] = useState("");

  if (!goal) return null;

  const remaining = goal.targetAmount - goal.savedAmount;
  const currencyLabel = goal.currency === Currency.USD ? "$" : "Bs.";

  const handleConfirm = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onContribute(goal.id, val);
    setAmount("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800">
            Abonar a "{goal.name}"
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
          Falta{" "}
          <span className="font-bold text-slate-800">
            {currencyLabel}
            {remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>{" "}
          para completar la meta.
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Monto a abonar ({currencyLabel})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            max={remaining}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
            autoFocus
          />
        </div>

        <button
          onClick={handleConfirm}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          Confirmar abono
        </button>
      </div>
    </div>
  );
};

// ── Componente de tarjeta de meta ──────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  onContribute: (goal: Goal) => void;
  onDelete: (id: string) => void;
  mainCurrency: string;
  userCountry: string;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onContribute,
  onDelete,
  mainCurrency,
  userCountry,
}) => {
  const [expanded, setExpanded] = useState(false);
  const meta = GOAL_CATEGORY_META[goal.category];
  const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
  const currencyLabel = goal.currency === Currency.USD ? "$" : "Bs.";

  const daysLeft = goal.targetDate
    ? Math.ceil(
        (new Date(goal.targetDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const urgencyColor =
    daysLeft !== null
      ? daysLeft <= 7
        ? "text-red-500"
        : daysLeft <= 30
          ? "text-amber-500"
          : "text-slate-400"
      : "text-slate-400";

  return (
    <div
      className={
        "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all " +
        (goal.isCompleted
          ? "border-emerald-200 opacity-80"
          : "border-slate-100")
      }
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: meta.color + "18" }}
        >
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 text-sm truncate">
              {goal.name}
            </p>
            {goal.isCompleted && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-400">{meta.label}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-slate-800">
            {currencyLabel}
            {goal.savedAmount.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-[10px] text-slate-400">
            de {currencyLabel}
            {goal.targetAmount.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="ml-1 text-slate-300">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Barra de progreso siempre visible */}
      <div className="px-4 pb-3">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: goal.isCompleted ? "#10b981" : meta.color,
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] text-slate-400 font-bold">
            {Math.round(progress)}% completado
          </span>
          {daysLeft !== null && (
            <span className={`text-[10px] font-bold ${urgencyColor}`}>
              {daysLeft > 0
                ? `${daysLeft} días restantes`
                : daysLeft === 0
                  ? "¡Vence hoy!"
                  : "Fecha vencida"}
            </span>
          )}
        </div>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
          {goal.note && (
            <p className="text-xs text-slate-500 italic">"{goal.note}"</p>
          )}
          {goal.reminderDaysBefore && goal.targetDate && (
            <div className="flex items-center gap-1 text-xs text-violet-600">
              <CalendarDays className="w-3 h-3" />
              <span>
                Recordatorio {goal.reminderDaysBefore} días antes del
                vencimiento
              </span>
            </div>
          )}
          <div className="flex gap-2">
            {!goal.isCompleted && (
              <button
                onClick={() => onContribute(goal)}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <PlusCircle className="w-4 h-4" /> Abonar
              </button>
            )}
            <button
              onClick={() => onDelete(goal.id)}
              className="w-11 h-10 flex items-center justify-center bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Vista principal ────────────────────────────────────────────────────────

interface Props {
  goals: Goal[];
  userCountry: string;
  mainCurrency: string;
  onAddGoal: (
    goalData: Omit<Goal, "id" | "createdAt" | "isCompleted" | "savedAmount">,
  ) => void;
  onContributeGoal: (goalId: string, amount: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalsView: React.FC<Props> = ({
  goals,
  userCountry,
  mainCurrency,
  onAddGoal,
  onContributeGoal,
  onDeleteGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [filterCompleted, setFilterCompleted] = useState(false);

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);
  const displayed = filterCompleted ? completed : active;

  // Totales para el resumen
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = active.reduce((s, g) => s + g.savedAmount, 0);

  return (
    <div className="space-y-5 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Metas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gastos futuros e inversiones
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {/* Resumen */}
      {active.length > 0 && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
          <p className="text-xs text-blue-200 uppercase font-bold tracking-wide mb-1">
            Progreso total activo
          </p>
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-2xl font-black">
                $
                {totalSaved.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-blue-300 text-sm ml-1">ahorrado</span>
            </div>
            <span className="text-blue-300 text-sm">
              de $
              {totalTarget.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width:
                  totalTarget > 0
                    ? `${Math.min((totalSaved / totalTarget) * 100, 100)}%`
                    : "0%",
              }}
            />
          </div>
        </div>
      )}

      {/* Filtro activas / completadas */}
      {completed.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCompleted(false)}
            className={
              "flex-1 py-2 rounded-xl text-xs font-bold transition-colors " +
              (!filterCompleted
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-500")
            }
          >
            Activas ({active.length})
          </button>
          <button
            onClick={() => setFilterCompleted(true)}
            className={
              "flex-1 py-2 rounded-xl text-xs font-bold transition-colors " +
              (filterCompleted
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-500")
            }
          >
            Completadas ({completed.length})
          </button>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {filterCompleted
                ? "Aún no has completado ninguna meta"
                : "No tienes metas activas"}
            </p>
            {!filterCompleted && (
              <p className="text-xs mt-1">
                Crea una para planificar tus gastos futuros
              </p>
            )}
          </div>
        ) : (
          displayed.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onContribute={setContributeGoal}
              onDelete={onDeleteGoal}
              mainCurrency={mainCurrency}
              userCountry={userCountry}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onAddGoal}
        mainCurrency={mainCurrency}
        userCountry={userCountry}
      />
      <ContributeModal
        goal={contributeGoal}
        onClose={() => setContributeGoal(null)}
        onContribute={onContributeGoal}
      />
    </div>
  );
};
