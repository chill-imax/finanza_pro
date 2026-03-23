import { useState, useEffect, useMemo } from "react";
import {
  Account,
  Transaction,
  Debt,
  Category,
  RecurringTransaction,
  Currency,
  AccountType,
  TransactionType,
  Frequency,
  DEFAULT_CATEGORIES,
} from "../types";
import { getBCVRate } from "../services/exchangeRateService";

export function useAppState() {
  // ── Country & Currency ──────────────────────────────────────────────
  const [userCountry, setUserCountry] = useState<string>(
    () => localStorage.getItem("user_country") || "",
  );
  const [mainCurrency, setMainCurrency] = useState<string>(
    () => localStorage.getItem("main_currency") || "USD",
  );

  // ── Core data ───────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem("accounts");
    return saved ? JSON.parse(saved) : [];
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });
  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem("debts");
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("categories");
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >(() => {
    const saved = localStorage.getItem("recurringTransactions");
    return saved ? JSON.parse(saved) : [];
  });

  // ── Streak ──────────────────────────────────────────────────────────
  const [streakCount, setStreakCount] = useState<number>(() => {
    const saved = localStorage.getItem("streakCount");
    return saved ? parseInt(saved) : 0;
  });
  const [lastLogDate, setLastLogDate] = useState<string>(
    () => localStorage.getItem("lastLogDate") || "",
  );

  // ── Exchange rate ───────────────────────────────────────────────────
  const [bcvRate, setBcvRate] = useState<number>(0);

  // ── Persist to localStorage ─────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("debts", JSON.stringify(debts));
    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem(
      "recurringTransactions",
      JSON.stringify(recurringTransactions),
    );
  }, [accounts, transactions, debts, categories, recurringTransactions]);

  useEffect(() => {
    localStorage.setItem("streakCount", streakCount.toString());
    localStorage.setItem("lastLogDate", lastLogDate);
  }, [streakCount, lastLogDate]);

  // ── Fetch BCV rate ──────────────────────────────────────────────────
  useEffect(() => {
    if (userCountry === "Venezuela") {
      getBCVRate().then((rate) => {
        if (rate) setBcvRate(rate);
      });
    }
  }, [userCountry]);

  // ── Streak reset check ──────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (lastLogDate && lastLogDate !== today) {
      const diffDays = Math.ceil(
        Math.abs(new Date(today).getTime() - new Date(lastLogDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (diffDays > 1) setStreakCount(0);
    }
  }, [lastLogDate]);

  // ── Derived balances ────────────────────────────────────────────────
  const totalBalanceUSD = accounts
    .filter((a) => a.currency === "USD")
    .reduce((sum, a) => sum + a.balance, 0);
  const totalBalanceVES = accounts
    .filter((a) => a.currency === "VES")
    .reduce((sum, a) => sum + a.balance, 0);
  const totalBalanceGlobal = accounts.reduce((sum, a) => sum + a.balance, 0);
  const grandTotalUSD = useMemo(() => {
    if (bcvRate === 0) return totalBalanceUSD;
    return totalBalanceUSD + totalBalanceVES / bcvRate;
  }, [totalBalanceUSD, totalBalanceVES, bcvRate]);

  // ── Expenses chart data ─────────────────────────────────────────────
  // AHORA: Incluye VES convertidos a USD usando la tasa de la transacción (o bcvRate de respaldo)
  const expensesData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    
    transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .forEach((t) => {
        const catName = categories.find((c) => c.id === t.categoryId)?.name || "Otros";
        
        let amountInUSD = t.amount;
        
        if (userCountry === "Venezuela" && t.currency === Currency.VES) {
            // Usa la tasa de cambio guardada en la transacción, si no existe usa bcvRate.
            // Protegemos contra división por cero
            const rate = t.exchangeRate && t.exchangeRate > 0 ? t.exchangeRate : bcvRate; 
            if (rate > 0) {
                amountInUSD = t.amount / rate;
            }
        }

        dataMap[catName] = (dataMap[catName] || 0) + amountInUSD;
      });
      
    return Object.entries(dataMap)
        // Opcional: Filtrar montos muy pequeños o ceros (debido a conversiones)
        .filter(([_, value]) => value > 0.01) 
        .map(([name, value]) => ({ name, value }));
  }, [transactions, categories, userCountry, bcvRate]);

  // ── Setup ───────────────────────────────────────────────────────────
  const handleSetupComplete = (country: string, currency: string) => {
    setUserCountry(country);
    setMainCurrency(currency);
    localStorage.setItem("user_country", country);
    localStorage.setItem("main_currency", currency);

    if (accounts.length === 0) {
      const initialAccounts: Account[] =
        country === "Venezuela"
          ? [
              {
                id: "1",
                name: "Efectivo USD",
                type: AccountType.CASH,
                currency: Currency.USD,
                balance: 0,
                color: "#10b981",
                icon: "💵",
              },
              {
                id: "2",
                name: "Banesco",
                type: AccountType.BANK,
                currency: Currency.VES,
                balance: 0,
                color: "#3b82f6",
                icon: "🏦",
              },
              {
                id: "3",
                name: "Zelle",
                type: AccountType.WALLET,
                currency: Currency.USD,
                balance: 0,
                color: "#8b5cf6",
                icon: "📱",
              },
              {
                id: "4",
                name: "Ahorros",
                type: AccountType.SAVINGS,
                currency: Currency.USD,
                balance: 0,
                color: "#8b5cf6",
                icon: "🐖",
              },
            ]
          : [
              {
                id: "1",
                name: "Efectivo",
                type: AccountType.CASH,
                currency: currency as Currency,
                balance: 0,
                color: "#10b981",
                icon: "💵",
              },
              {
                id: "2",
                name: "Banco",
                type: AccountType.BANK,
                currency: currency as Currency,
                balance: 0,
                color: "#3b82f6",
                icon: "🏦",
              },
              {
                id: "3",
                name: "Ahorros",
                type: AccountType.SAVINGS,
                currency: currency as Currency,
                balance: 0,
                color: "#8b5cf6",
                icon: "🐖",
              },
            ];
      setAccounts(initialAccounts);
    }
  };

  return {
    // state
    userCountry,
    mainCurrency,
    accounts,
    setAccounts,
    transactions,
    setTransactions,
    debts,
    setDebts,
    categories,
    setCategories,
    recurringTransactions,
    setRecurringTransactions,
    streakCount,
    setStreakCount,
    lastLogDate,
    setLastLogDate,
    bcvRate,
    // derived
    totalBalanceUSD,
    totalBalanceVES,
    totalBalanceGlobal,
    grandTotalUSD,
    expensesData,
    // actions
    handleSetupComplete,
  };
}