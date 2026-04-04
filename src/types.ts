export enum Currency {
  VES = "VES",
  USD = "USD",
}

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
}

export enum AccountType {
  CASH = "CASH",
  BANK = "BANK",
  WALLET = "WALLET",
  SAVINGS = "SAVINGS",
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  color?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  date: string;
  note: string;
  exchangeRate?: number;
  linkedDebtId?: string;
  debtPaymentAmount?: number;
}

export enum Frequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM",
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  note: string;
  frequency: Frequency;
  customInterval?: number;
  customUnit?: "DAYS" | "WEEKS" | "MONTHS" | "YEARS";
  nextDueDate: string;
  active: boolean;
}

export interface Debt {
  id: string;
  name: string;
  type: "I_OWE" | "OWES_ME";
  amount: number;
  currency: Currency;
  paidAmount: number;
  dueDate?: string;
  isPaid: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: "INCOME" | "EXPENSE";
  isCustom?: boolean;
}

// ── Goals (Gastos a Futuro / Metas) ────────────────────────────────────────

export enum GoalCategory {
  HOME = "HOME", // Reparaciones del hogar
  VEHICLE = "VEHICLE", // Carro / moto
  TRAVEL = "TRAVEL", // Viajes / vacaciones
  TECH = "TECH", // Tecnología / gadgets
  EDUCATION = "EDUCATION", // Educación / cursos
  INVEST = "INVEST", // Inversión / negocio
  HEALTH = "HEALTH", // Salud / emergencia médica
  OTHER = "OTHER", // Otro
}

export const GOAL_CATEGORY_META: Record<
  GoalCategory,
  { label: string; icon: string; color: string }
> = {
  [GoalCategory.HOME]: { label: "Hogar", icon: "🏠", color: "#3b82f6" },
  [GoalCategory.VEHICLE]: { label: "Vehículo", icon: "🚗", color: "#f59e0b" },
  [GoalCategory.TRAVEL]: { label: "Viaje", icon: "✈️", color: "#06b6d4" },
  [GoalCategory.TECH]: { label: "Tecnología", icon: "💻", color: "#8b5cf6" },
  [GoalCategory.EDUCATION]: {
    label: "Educación",
    icon: "📚",
    color: "#10b981",
  },
  [GoalCategory.INVEST]: { label: "Inversión", icon: "📈", color: "#6366f1" },
  [GoalCategory.HEALTH]: { label: "Salud", icon: "💊", color: "#ef4444" },
  [GoalCategory.OTHER]: { label: "Otro", icon: "🎯", color: "#64748b" },
};

export interface Goal {
  id: string;
  name: string; // Ej: "Reparar el techo"
  category: GoalCategory;
  targetAmount: number;
  savedAmount: number; // Cuánto se ha apartado ya
  currency: Currency;
  targetDate?: string; // Fecha objetivo (ISO YYYY-MM-DD)
  note?: string;
  isCompleted: boolean;
  createdAt: string; // ISO date
  // Notificación: recordar al usuario X días antes de targetDate
  reminderDaysBefore?: number;
  notificationId?: number; // ID guardado del LocalNotification para poder cancelarlo
}

// ── Financial Tips ─────────────────────────────────────────────────────────

export interface FinancialTip {
  id: number;
  emoji: string;
  title: string;
  body: string;
  tag: "ahorro" | "inversión" | "deuda" | "hábito" | "presupuesto";
}

export const FINANCIAL_TIPS: FinancialTip[] = [
  {
    id: 1,
    emoji: "🐷",
    title: "Regla del 50/30/20",
    body: "Destina el 50% de tus ingresos a necesidades, 30% a deseos y 20% a ahorro. Es el presupuesto más usado en el mundo.",
    tag: "presupuesto",
  },
  {
    id: 2,
    emoji: "🔥",
    title: "El poder del interés compuesto",
    body: "Ahorrar $5 al día durante 30 años, con un 7% anual, equivale a más de $185,000. Empieza hoy, aunque sea poco.",
    tag: "inversión",
  },
  {
    id: 3,
    emoji: "✂️",
    title: "Elimina deudas de mayor interés primero",
    body: 'El método "avalancha" dice: paga primero la deuda con el interés más alto. Ahorrarás mucho dinero en el largo plazo.',
    tag: "deuda",
  },
  {
    id: 4,
    emoji: "📦",
    title: "Fondo de emergencia",
    body: "Tener entre 3 y 6 meses de gastos guardados en una cuenta de fácil acceso puede salvarte de una crisis inesperada.",
    tag: "ahorro",
  },
  {
    id: 5,
    emoji: "🛒",
    title: "La lista antes de comprar",
    body: "Hacer una lista antes de ir al supermercado puede reducir tus gastos en comida hasta un 25%. Los impulsos cuestan.",
    tag: "hábito",
  },
  {
    id: 6,
    emoji: "📱",
    title: "Audita tus suscripciones",
    body: "El usuario promedio paga por 3 a 4 servicios que no usa. Revisa tus suscripciones activas cada 3 meses.",
    tag: "presupuesto",
  },
  {
    id: 7,
    emoji: "🎯",
    title: "Págate a ti mismo primero",
    body: "Antes de pagar cualquier gasto, transfiérete a ti mismo a ahorros. Lo que no ves, no lo gastas.",
    tag: "hábito",
  },
  {
    id: 8,
    emoji: "🏠",
    title: "Alquilar vs. comprar",
    body: "Comprar no siempre es mejor que alquilar. Considera el mantenimiento, impuestos y oportunidad de inversión antes de decidir.",
    tag: "inversión",
  },
  {
    id: 9,
    emoji: "💡",
    title: "Gastos hormiga",
    body: 'Los "gastos hormiga" (café diario, snacks, apps) pueden sumar más de $200 al mes sin que lo notes. Regístralos.',
    tag: "hábito",
  },
  {
    id: 10,
    emoji: "📉",
    title: "No inviertas lo que no puedes perder",
    body: "Toda inversión tiene riesgo. Nunca pongas en activos volátiles (criptos, acciones) dinero que necesitas a corto plazo.",
    tag: "inversión",
  },
  {
    id: 11,
    emoji: "🤝",
    title: "Negocia tus tarifas",
    body: "Internet, seguro, teléfono: muchas empresas tienen tarifas más bajas disponibles solo si las pides. Una llamada puede ahorrarte $20/mes.",
    tag: "presupuesto",
  },
  {
    id: 12,
    emoji: "🗓️",
    title: "Revisión financiera mensual",
    body: "Dedicar 15 minutos al mes a revisar tus finanzas puede ayudarte a detectar gastos innecesarios y ajustar tu presupuesto a tiempo.",
    tag: "hábito",
  },
];

// ── Default Categories ────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Comida", icon: "🍔", type: "EXPENSE" },
  { id: "2", name: "Transporte", icon: "🚌", type: "EXPENSE" },
  { id: "3", name: "Vivienda", icon: "🏠", type: "EXPENSE" },
  { id: "4", name: "Salud", icon: "💊", type: "EXPENSE" },
  { id: "5", name: "Entretenimiento", icon: "🎬", type: "EXPENSE" },
  { id: "6", name: "Salario", icon: "💰", type: "INCOME" },
  { id: "7", name: "Negocio", icon: "💼", type: "INCOME" },
  { id: "8", name: "Freelance", icon: "💻", type: "INCOME" },
  { id: "9", name: "Ahorro", icon: "🐷", type: "EXPENSE" },
  { id: "10", name: "Deudas", icon: "🤝", type: "EXPENSE" },
];
