export enum Currency {
  VES = 'VES',
  USD = 'USD',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum AccountType {
  CASH = 'CASH',
  BANK = 'BANK',
  WALLET = 'WALLET',
  SAVINGS = 'SAVINGS',
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
  debtPaymentAmount?: number; // <--- NUEVO CAMPO PARA REVERSIÓN
}

export enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY', 
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM'
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
  customUnit?: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'; 
  nextDueDate: string;
  active: boolean;
}

export interface Debt {
  id: string;
  name: string; 
  type: 'I_OWE' | 'OWES_ME';
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
  type: 'INCOME' | 'EXPENSE';
  isCustom?: boolean; 
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Comida', icon: '🍔', type: 'EXPENSE' },
  { id: '2', name: 'Transporte', icon: '🚌', type: 'EXPENSE' },
  { id: '3', name: 'Vivienda', icon: '🏠', type: 'EXPENSE' },
  { id: '4', name: 'Salud', icon: '💊', type: 'EXPENSE' },
  { id: '5', name: 'Entretenimiento', icon: '🎬', type: 'EXPENSE' },
  { id: '6', name: 'Salario', icon: '💰', type: 'INCOME' },
  { id: '7', name: 'Negocio', icon: '💼', type: 'INCOME' },
  { id: '8', name: 'Freelance', icon: '💻', type: 'INCOME' },
  { id: '9', name: 'Ahorro', icon: '🐷', type: 'EXPENSE' }, 
  { id: '10', name: 'Deudas', icon: '🤝', type: 'EXPENSE' }, 
];