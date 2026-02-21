import React, { useState, useEffect, useMemo } from "react";
import {
  Account,
  Transaction,
  Debt,
  Currency,
  TransactionType,
  AccountType,
  DEFAULT_CATEGORIES,
  Category,
  RecurringTransaction,
  Frequency,
} from "./types";
import { AccountCard } from "./components/AccountCard";
import { TransactionModal } from "./components/TransactionModal";
import { DebtModal } from "./components/DebtModal";
import { PayDebtModal } from "./components/PayDebtModal";
import { AccountModal } from "./components/AccountModal";
import { CategoryModal } from "./components/CategoryModal";
import { TransactionListModal } from "./components/TransactionListModal";
import { TransactionDetailModal } from "./components/TransactionDetailModal";
import { ConfirmationModal } from "./components/ConfirmationModal"; // New
import { getFinancialAdvice } from "./services/geminiService";
import { getBCVRate } from "./services/exchangeRateService";
import {
  Plus,
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  TrendingUp,
  Bot,
  PiggyBank,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Flame,
  CheckCircle,
  RefreshCcw,
  Layers,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

// --- Default Data ---
const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: "1",
    name: "Efectivo",
    type: AccountType.CASH,
    currency: Currency.USD,
    balance: 150,
    color: "#10b981",
    icon: "💵",
  },
  {
    id: "2",
    name: "Banesco",
    type: AccountType.BANK,
    currency: Currency.VES,
    balance: 5000,
    color: "#10b981",
    icon: "🏦",
  },
  {
    id: "3",
    name: "Zelle",
    type: AccountType.WALLET,
    currency: Currency.USD,
    balance: 1200,
    color: "#8b5cf6",
    icon: "📱",
  },
  {
    id: "4",
    name: "Ahorros",
    type: AccountType.SAVINGS,
    currency: Currency.USD,
    balance: 500,
    color: "#3b82f6",
    icon: "🐖",
  },
];

function App() {
  // --- State ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem("accounts");
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
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

  // Streak State
  const [streakCount, setStreakCount] = useState<number>(() => {
    const saved = localStorage.getItem("streakCount");
    return saved ? parseInt(saved) : 0;
  });
  const [lastLogDate, setLastLogDate] = useState<string>(() => {
    return localStorage.getItem("lastLogDate") || "";
  });

  // Exchange Rate State
  const [bcvRate, setBcvRate] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "accounts" | "debts" | "advisor"
  >("dashboard");

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalInitialData, setTxModalInitialData] = useState<any>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [payDebtData, setPayDebtData] = useState<Debt | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTxListModalOpen, setIsTxListModalOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Confirmation Modal State
  const [confirmationData, setConfirmationData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDanger: false,
  });

  // AI Advice State
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // --- Effects ---
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

  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getBCVRate();
      if (rate) setBcvRate(rate);
    };
    fetchRate();
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (lastLogDate) {
      const last = new Date(lastLogDate);
      const now = new Date(today);
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1 && lastLogDate !== today) {
        setStreakCount(0);
      }
    }
  }, [lastLogDate]);

  // Recurring Transactions Processor
  useEffect(() => {
    const processRecurring = () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      let hasChanges = false;
      let newTransactions: Transaction[] = [];

      const calculateNextDueDate = (
        current: string,
        rt: RecurringTransaction,
      ): string => {
        const date = new Date(current);
        switch (rt.frequency) {
          case Frequency.DAILY:
            date.setDate(date.getDate() + 1);
            break;
          case Frequency.WEEKLY:
            date.setDate(date.getDate() + 7);
            break;
          case Frequency.BIWEEKLY:
            date.setDate(date.getDate() + 15);
            break;
          case Frequency.MONTHLY:
            date.setMonth(date.getMonth() + 1);
            break;
          case Frequency.YEARLY:
            date.setFullYear(date.getFullYear() + 1);
            break;
          case Frequency.CUSTOM:
            const interval = rt.customInterval || 1;
            if (rt.customUnit === "DAYS")
              date.setDate(date.getDate() + interval);
            else if (rt.customUnit === "WEEKS")
              date.setDate(date.getDate() + interval * 7);
            else if (rt.customUnit === "MONTHS")
              date.setMonth(date.getMonth() + interval);
            else if (rt.customUnit === "YEARS")
              date.setFullYear(date.getFullYear() + interval);
            break;
          default:
            date.setMonth(date.getMonth() + 1);
        }
        return date.toISOString().split("T")[0];
      };

      const updatedRecurring = recurringTransactions.map((rt) => {
        if (rt.active && rt.nextDueDate <= todayStr) {
          const newTx: Transaction = {
            id: crypto.randomUUID(),
            amount: rt.amount,
            currency: rt.currency,
            type: rt.type,
            accountId: rt.accountId,
            categoryId: rt.categoryId,
            date: rt.nextDueDate,
            note: `(Recurrente) ${rt.note}`,
          };
          newTransactions.push(newTx);
          const nextDate = calculateNextDueDate(rt.nextDueDate, rt);
          hasChanges = true;
          return { ...rt, nextDueDate: nextDate };
        }
        return rt;
      });

      if (hasChanges) {
        setRecurringTransactions(updatedRecurring);
        newTransactions.forEach((tx) => {
          setTransactions((prev) => [tx, ...prev]);
          setAccounts((prevAccs) =>
            prevAccs.map((acc) => {
              if (acc.id === tx.accountId) {
                return {
                  ...acc,
                  balance:
                    tx.type === "INCOME"
                      ? acc.balance + tx.amount
                      : acc.balance - tx.amount,
                };
              }
              return acc;
            }),
          );
        });
        alert(
          `Se han generado ${newTransactions.length} transacciones recurrentes pendientes.`,
        );
      }
    };

    if (recurringTransactions.length > 0) processRecurring();
  }, []);

  // --- Actions ---

  const updateStreak = () => {
    const today = new Date().toISOString().split("T")[0];
    if (lastLogDate !== today) {
      if (lastLogDate) {
        const last = new Date(lastLogDate);
        const now = new Date(today);
        const diffDays = Math.ceil(
          Math.abs(now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays === 1) {
          setStreakCount((prev) => prev + 1);
        } else {
          setStreakCount(1);
        }
      } else {
        setStreakCount(1);
      }
      setLastLogDate(today);
    }
  };

  const skipLogDay = () => {
    updateStreak();
    alert("¡Racha mantenida! No hubo movimientos hoy.");
  };

  const addTransaction = (data: any) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      ...data,
      isRecurring: undefined,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Handle Recurring Logic Setup
    if (data.isRecurring) {
      // Initial next date calc based on frequency selection
      let nextDate = new Date(data.date);
      const freq = data.frequency || Frequency.MONTHLY;
      const interval = data.customInterval || 1;
      const unit = data.customUnit || "MONTHS";

      // Calculate first future occurrence logic (reuse logic or simple set for now)
      // Note: Logic inside processRecurring handles the increment.
      // Here we just need to set the initial "Next Due Date".
      // The transaction just added covers the current date. So we schedule next one.
      switch (freq) {
        case Frequency.DAILY:
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case Frequency.WEEKLY:
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case Frequency.BIWEEKLY:
          nextDate.setDate(nextDate.getDate() + 15);
          break;
        case Frequency.MONTHLY:
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case Frequency.YEARLY:
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        case Frequency.CUSTOM:
          if (unit === "DAYS") nextDate.setDate(nextDate.getDate() + interval);
          else if (unit === "WEEKS")
            nextDate.setDate(nextDate.getDate() + interval * 7);
          else if (unit === "MONTHS")
            nextDate.setMonth(nextDate.getMonth() + interval);
          else if (unit === "YEARS")
            nextDate.setFullYear(nextDate.getFullYear() + interval);
          break;
      }

      const newRecurring: RecurringTransaction = {
        id: crypto.randomUUID(),
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        accountId: data.accountId,
        categoryId: data.categoryId,
        note: data.note || "Pago recurrente",
        frequency: freq,
        customInterval: interval,
        customUnit: unit,
        nextDueDate: nextDate.toISOString().split("T")[0],
        active: true,
      };
      setRecurringTransactions((prev) => [...prev, newRecurring]);
    }

    let transferAddAmount = 0;
    if (newTx.type === TransactionType.TRANSFER && newTx.toAccountId) {
      const fromAcc = accounts.find((a) => a.id === newTx.accountId);
      const toAcc = accounts.find((a) => a.id === newTx.toAccountId);

      if (fromAcc && toAcc) {
        transferAddAmount = newTx.amount;
        if (fromAcc.currency !== toAcc.currency && newTx.exchangeRate) {
          if (
            fromAcc.currency === Currency.USD &&
            toAcc.currency === Currency.VES
          ) {
            transferAddAmount = newTx.amount * newTx.exchangeRate;
          } else if (
            fromAcc.currency === Currency.VES &&
            toAcc.currency === Currency.USD
          ) {
            transferAddAmount = newTx.amount / newTx.exchangeRate;
          }
        }
      }
    }

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === newTx.accountId) {
        if (newTx.type === TransactionType.INCOME)
          return { ...acc, balance: acc.balance + newTx.amount };
        if (newTx.type === TransactionType.EXPENSE)
          return { ...acc, balance: acc.balance - newTx.amount };
        if (newTx.type === TransactionType.TRANSFER)
          return { ...acc, balance: acc.balance - newTx.amount };
      }
      if (
        newTx.type === TransactionType.TRANSFER &&
        acc.id === newTx.toAccountId
      ) {
        return { ...acc, balance: acc.balance + transferAddAmount };
      }
      return acc;
    });
    setAccounts(updatedAccounts);
    setTxModalInitialData(null);
    updateStreak();
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === tx.accountId) {
        if (tx.type === TransactionType.INCOME)
          return { ...acc, balance: acc.balance - tx.amount };
        if (tx.type === TransactionType.EXPENSE)
          return { ...acc, balance: acc.balance + tx.amount };
        if (tx.type === TransactionType.TRANSFER)
          return { ...acc, balance: acc.balance + tx.amount };
      }
      if (tx.type === TransactionType.TRANSFER && acc.id === tx.toAccountId) {
        let addedAmount = tx.amount;
        if (tx.exchangeRate) {
          const sourceAcc = accounts.find((a) => a.id === tx.accountId);
          if (
            sourceAcc?.currency === Currency.USD &&
            acc.currency === Currency.VES
          )
            addedAmount = tx.amount * tx.exchangeRate;
          else if (
            sourceAcc?.currency === Currency.VES &&
            acc.currency === Currency.USD
          )
            addedAmount = tx.amount / tx.exchangeRate;
        }
        return { ...acc, balance: acc.balance - addedAmount };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setSelectedTransaction(null);
  };

  const saveAccount = (account: Account) => {
    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? account : a)),
      );
      setEditingAccount(null);
    } else {
      setAccounts((prev) => [...prev, account]);
    }
    setIsAccountModalOpen(false);
  };

  const handleDeleteAccountAttempt = (account: Account) => {
    // Check for transactions
    const hasTransactions = transactions.some(
      (t) => t.accountId === account.id || t.toAccountId === account.id,
    );

    if (hasTransactions) {
      alert(
        "No se puede eliminar esta cuenta porque tiene transacciones asociadas. Elimina las transacciones primero.",
      );
      return;
    }

    setConfirmationData({
      isOpen: true,
      title: "Eliminar Cuenta",
      message: `¿Estás seguro de que deseas eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`,
      isDanger: true,
      onConfirm: () => {
        setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      },
    });
  };

  const saveCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
  };

  const addDebt = (data: Omit<Debt, "id" | "paidAmount" | "isPaid">) => {
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      ...data,
      paidAmount: 0,
      isPaid: false,
    };
    setDebts((prev) => [newDebt, ...prev]);
  };

  const deleteDebt = (id: string) => {
    setConfirmationData({
      isOpen: true,
      title: "Eliminar Deuda",
      message: "¿Estás seguro de que deseas eliminar esta deuda?",
      isDanger: true,
      onConfirm: () => setDebts((prev) => prev.filter((d) => d.id !== id)),
    });
  };

  const handleDebtPayment = (
    amount: number,
    accountId: string,
    exchangeRate?: number,
  ) => {
    if (!payDebtData) return;

    const updatedDebts = debts.map((d) => {
      if (d.id !== payDebtData.id) return d;
      const newPaid = d.paidAmount + amount;
      return {
        ...d,
        paidAmount: newPaid,
        isPaid: newPaid >= d.amount,
      };
    });
    setDebts(updatedDebts);

    const isPaying = payDebtData.type === "I_OWE";

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === accountId) {
        let deductionAmount = amount;
        if (acc.currency !== payDebtData.currency && exchangeRate) {
          if (
            payDebtData.currency === Currency.USD &&
            acc.currency === Currency.VES
          ) {
            deductionAmount = amount * exchangeRate;
          } else if (
            payDebtData.currency === Currency.VES &&
            acc.currency === Currency.USD
          ) {
            deductionAmount = amount / exchangeRate;
          }
        }

        return {
          ...acc,
          balance: isPaying
            ? acc.balance - deductionAmount
            : acc.balance + deductionAmount,
        };
      }
      return acc;
    });
    setAccounts(updatedAccounts);

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount: amount,
      currency: payDebtData.currency,
      type: isPaying ? TransactionType.EXPENSE : TransactionType.INCOME,
      accountId: accountId,
      categoryId: "10",
      date: new Date().toISOString().split("T")[0],
      note: `${isPaying ? "Pago de deuda" : "Cobro de deuda"}: ${payDebtData.name} (Tasa: ${exchangeRate || "N/A"})`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    setPayDebtData(null);
    updateStreak();
  };

  const payYourselfFirst = () => {
    const savingsAcc = accounts.find((a) => a.type === AccountType.SAVINGS);
    if (!savingsAcc) {
      alert(
        "Para usar esta función, primero crea una cuenta del tipo 'Ahorros' en la sección Cuentas.",
      );
      setActiveTab("accounts");
      return;
    }
    const sourceAcc =
      accounts.find((a) => a.type === AccountType.BANK) ||
      accounts.find((a) => a.type === AccountType.WALLET) ||
      accounts[0];
    setTxModalInitialData({
      type: TransactionType.TRANSFER,
      amount: 0,
      accountId: sourceAcc?.id,
      toAccountId: savingsAcc.id,
      categoryId: "9",
      note: "Pago a mi mismo (Ahorro)",
      isSavingsMode: true,
    });
    setIsTxModalOpen(true);
  };

  const handleGetAdvice = async () => {
    setIsLoadingAi(true);
    const advice = await getFinancialAdvice(transactions, accounts, debts);
    setAiAdvice(advice);
    setIsLoadingAi(false);
  };

  const openNewTransaction = () => {
    setTxModalInitialData(null);
    setIsTxModalOpen(true);
  };

  const totalBalanceUSD = accounts
    .filter((a) => a.currency === Currency.USD)
    .reduce((sum, a) => sum + a.balance, 0);
  const totalBalanceVES = accounts
    .filter((a) => a.currency === Currency.VES)
    .reduce((sum, a) => sum + a.balance, 0);

  const grandTotalUSD = useMemo(() => {
    if (bcvRate === 0) return totalBalanceUSD;
    return totalBalanceUSD + totalBalanceVES / bcvRate;
  }, [totalBalanceUSD, totalBalanceVES, bcvRate]);

  const expensesData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    transactions
      .filter(
        (t) =>
          t.type === TransactionType.EXPENSE && t.currency === Currency.USD,
      )
      .forEach((t) => {
        const catName =
          categories.find((c) => c.id === t.categoryId)?.name || "Otros";
        dataMap[catName] = (dataMap[catName] || 0) + t.amount;
      });
    return Object.entries(dataMap).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
  const today = new Date().toISOString().split("T")[0];

  const renderDashboard = () => (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">
              Tasa BCV
            </p>
            <p className="font-bold text-slate-800">
              {bcvRate > 0 ? `Bs. ${bcvRate.toFixed(2)}` : "Cargando..."}
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-2">
          <Flame
            className={`w-5 h-5 ${streakCount > 0 ? "text-orange-500 fill-orange-500" : "text-slate-300"}`}
          />
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">
              Racha
            </p>
            <p className="font-bold text-slate-800">{streakCount} días</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
          Patrimonio Total Estimado
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black">
            $
            {grandTotalUSD.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-lg text-slate-400 font-medium">USD</span>
        </div>
        <div className="mt-4 flex gap-4 text-sm text-slate-300">
          <div>
            <span className="block text-[10px] uppercase text-slate-500">
              En Dólares
            </span>
            <span className="font-semibold">
              ${totalBalanceUSD.toLocaleString()}
            </span>
          </div>
          <div className="w-px bg-white/10"></div>
          <div>
            <span className="block text-[10px] uppercase text-slate-500">
              En Bolívares
            </span>
            <span className="font-semibold">
              Bs. {totalBalanceVES.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={openNewTransaction}
          className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold shadow-lg whitespace-nowrap active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" /> Nueva Transacción
        </button>
        {lastLogDate !== today && (
          <button
            onClick={skipLogDay}
            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-xl font-semibold whitespace-nowrap active:scale-95 transition-transform border border-slate-200"
          >
            <CheckCircle className="w-5 h-5" /> Sin Movimientos
          </button>
        )}
        <button
          onClick={payYourselfFirst}
          className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-3 rounded-xl font-semibold whitespace-nowrap active:scale-95 transition-transform"
        >
          <PiggyBank className="w-5 h-5" /> Págate a ti
        </button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800">Recientes</h3>
          <button
            onClick={() => setIsTxListModalOpen(true)}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            Ver todo
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Sin transacciones aún
            </div>
          ) : (
            transactions.slice(0, 5).map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${tx.type === "INCOME" ? "bg-emerald-100 text-emerald-600" : tx.type === "TRANSFER" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"}`}
                    >
                      {tx.type === "INCOME" ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : tx.type === "TRANSFER" ? (
                        <ArrowRightLeft className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {cat
                          ? cat.name
                          : tx.type === "TRANSFER"
                            ? "Transferencia"
                            : "Otro"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tx.note || tx.date}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${tx.type === "INCOME" ? "text-emerald-600" : "text-slate-800"}`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {tx.currency === "USD" ? "$" : "Bs."}
                    {tx.amount.toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {expensesData.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-4">
            Gastos (USD)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expensesData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccounts = () => (
    <div className="space-y-4 pb-20">
      <h2 className="text-2xl font-bold text-slate-800">Mis Cuentas</h2>
      <div className="grid grid-cols-1 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="relative group">
            <AccountCard
              account={acc}
              onClick={() => {}}
              onEdit={(e) => {
                e.stopPropagation();
                setEditingAccount(acc);
                setIsAccountModalOpen(true);
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAccountAttempt(acc);
              }}
              className="absolute top-2 left-2 p-2 bg-black/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            setEditingAccount(null);
            setIsAccountModalOpen(true);
          }}
          className="p-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 font-medium hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          + Agregar Cuenta
        </button>
      </div>
    </div>
  );

  const renderDebts = () => (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-slate-800">Control de Deudas</h2>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-red-50 p-4 rounded-xl border border-red-100">
          <span className="text-red-500 text-xs uppercase font-bold">
            Por Pagar
          </span>
          <p className="text-xl font-bold text-red-700 mt-1">
            $
            {debts
              .filter(
                (d) => d.type === "I_OWE" && !d.isPaid && d.currency === "USD",
              )
              .reduce((a, b) => a + (b.amount - b.paidAmount), 0)}
          </p>
        </div>
        <div className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <span className="text-emerald-500 text-xs uppercase font-bold">
            Por Cobrar
          </span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            $
            {debts
              .filter(
                (d) =>
                  d.type === "OWES_ME" && !d.isPaid && d.currency === "USD",
              )
              .reduce((a, b) => a + (b.amount - b.paidAmount), 0)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 ${debt.isPaid ? "opacity-60" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-800">{debt.name}</h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${debt.type === "I_OWE" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
                >
                  {debt.type === "I_OWE" ? "Debo" : "Me deben"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <p className="font-bold text-lg">
                  {debt.currency === "USD" ? "$" : "Bs."}
                  {debt.amount}
                </p>
                <button
                  onClick={() => deleteDebt(debt.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Eliminar deuda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 mb-3 overflow-hidden">
              <div
                className={`h-full ${debt.type === "I_OWE" ? "bg-red-500" : "bg-emerald-500"}`}
                style={{
                  width: `${Math.min((debt.paidAmount / debt.amount) * 100, 100)}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
              <span>Pagado: {debt.paidAmount}</span>
              <span>Restante: {debt.amount - debt.paidAmount}</span>
            </div>

            {!debt.isPaid && (
              <button
                onClick={() => setPayDebtData(debt)}
                className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Abonar
              </button>
            )}
          </div>
        ))}
        {debts.length === 0 && (
          <p className="text-center text-slate-400 py-8">
            ¡Estás libre de deudas!
          </p>
        )}

        <button
          onClick={() => setIsDebtModalOpen(true)}
          className="w-full p-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 font-medium hover:border-blue-500 hover:text-blue-500 transition-colors mt-4"
        >
          + Agregar Deuda
        </button>
      </div>
    </div>
  );

  const renderAdvisor = () => (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg">
        <Bot className="w-12 h-12 mb-4 bg-white/20 p-2 rounded-xl" />
        <h2 className="text-2xl font-bold">Asistente Financiero</h2>
        <p className="text-blue-100 mt-2">
          Utiliza la IA para analizar tus finanzas en VES y USD y obtener
          recomendaciones personalizadas.
        </p>

        <button
          onClick={handleGetAdvice}
          disabled={isLoadingAi}
          className="mt-6 w-full bg-white text-blue-600 font-bold py-3 rounded-xl shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isLoadingAi ? "Analizando..." : "Analizar mis finanzas"}
        </button>
      </div>

      {aiAdvice && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Recomendaciones
          </h3>
          <div className="prose prose-sm text-slate-600 whitespace-pre-line">
            {aiAdvice}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto shadow-2xl overflow-hidden relative font-sans">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">
          Finanza<span className="text-primary">Pro</span>
        </h1>
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
          <img src="https://picsum.photos/100/100" alt="Avatar" />
        </div>
      </header>

      <main className="p-6 min-h-[calc(100vh-140px)]">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "accounts" && renderAccounts()}
        {activeTab === "debts" && renderDebts()}
        {activeTab === "advisor" && renderAdvisor()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-40 pb-safe">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "dashboard" ? "text-primary" : "text-slate-400"}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Inicio</span>
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "accounts" ? "text-primary" : "text-slate-400"}`}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Cuentas</span>
        </button>
        <div className="w-12"></div>
        <button
          onClick={() => setActiveTab("debts")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "debts" ? "text-primary" : "text-slate-400"}`}
        >
          <ArrowRightLeft className="w-6 h-6" />
          <span className="text-[10px] font-medium">Deudas</span>
        </button>
        <button
          onClick={() => setActiveTab("advisor")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "advisor" ? "text-primary" : "text-slate-400"}`}
        >
          <Bot className="w-6 h-6" />
          <span className="text-[10px] font-medium">Asesor</span>
        </button>
      </nav>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={openNewTransaction}
          className="w-14 h-14 bg-primary rounded-full shadow-xl shadow-blue-900/20 text-white flex items-center justify-center border-4 border-gray-50 hover:scale-105 transition-transform"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSave={addTransaction}
        currentExchangeRate={bcvRate}
        initialData={txModalInitialData}
        onAddCategory={() => setIsCategoryModalOpen(true)}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSave={addDebt}
      />

      <PayDebtModal
        isOpen={!!payDebtData}
        onClose={() => setPayDebtData(null)}
        debt={payDebtData}
        accounts={accounts}
        onConfirm={handleDebtPayment}
        currentExchangeRate={bcvRate}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={saveAccount}
        initialData={editingAccount}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={saveCategory}
      />

      <TransactionListModal
        isOpen={isTxListModalOpen}
        onClose={() => setIsTxListModalOpen(false)}
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        onSelectTransaction={(t) => setSelectedTransaction(t)}
      />

      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        categories={categories}
        accounts={accounts}
        onDelete={(id) => {
          setConfirmationData({
            isOpen: true,
            title: "Eliminar Transacción",
            message:
              "¿Estás seguro de que deseas eliminar esta transacción? Los saldos serán revertidos.",
            isDanger: true,
            onConfirm: () => deleteTransaction(id),
          });
        }}
      />

      <ConfirmationModal
        isOpen={confirmationData.isOpen}
        onClose={() =>
          setConfirmationData((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmationData.onConfirm}
        title={confirmationData.title}
        message={confirmationData.message}
        isDanger={confirmationData.isDanger}
      />
    </div>
  );
}

export default App;
