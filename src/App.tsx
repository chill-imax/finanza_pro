import React, { useState, useEffect } from "react";
import {
  Account,
  Transaction,
  Debt,
  Category,
  AccountType,
  TransactionType,
  Currency,
  Goal,
  GoalCategory,
} from "./types";
import {
  backupToDrive,
  restoreFromDrive,
  signOutGoogle,
} from "./services/driveBackupService";

// Hooks
import { useAppState } from "./hooks/useAppState";
import { useTransactions } from "./hooks/useTransactions";
import { useDebts } from "./hooks/useDebts";
import { useStreak } from "./hooks/useStreak";
import {
  useNotifications,
  requestNotificationPermission,
} from "./hooks/useNotifications";

// Views
import { DashboardView } from "./views/DashboardView";
import { AccountsView } from "./views/AccountsView";
import { DebtsView } from "./views/DebtsView";
import { AdvisorView } from "./views/AdvisorView";
import { SettingsView } from "./views/SettingsView";
import { GoalsView } from "./views/GoalsView";

// Modals & components
import { TransactionModal } from "./components/TransactionModal";
import { DebtModal } from "./components/DebtModal";
import { PayDebtModal } from "./components/PayDebtModal";
import { AccountModal } from "./components/AccountModal";
import { CategoryModal } from "./components/CategoryModal";
import { TransactionListModal } from "./components/TransactionListModal";
import { TransactionDetailModal } from "./components/TransactionDetailModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { SetupModal } from "./components/SetupModal";
import { OnboardingTour } from "./components/OnboardingTour";
import { SpotlightTour, useResetTour } from "./components/SpotlightTour";
import { useToast } from "./components/ToastProvider";

// Services
import { getFinancialAdvice } from "./services/geminiService";

// Icons
import {
  Plus,
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  Settings,
  Target,
} from "lucide-react";

type ActiveTab =
  | "dashboard"
  | "accounts"
  | "debts"
  | "goals"
  | "advisor"
  | "settings";

const TAB_TOUR_IDS: Record<string, string> = {
  dashboard: "tab-dashboard",
  accounts: "tab-accounts",
  debts: "tab-debts",
};

function App() {
  const { showToast } = useToast();
  const resetTour = useResetTour();
  const {
    scheduleDailyReminder,
    cancelDailyReminder,
    scheduleGoalReminder,
    cancelGoalReminder,
    notifyGoalCompleted,
  } = useNotifications();

  // ── Core state ─────────────────────────────────────────────────────
  const state = useAppState();
  const {
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
    goals,
    setGoals,
    streakCount,
    setStreakCount,
    lastLogDate,
    setLastLogDate,
    bcvRate,
    totalBalanceUSD,
    totalBalanceVES,
    totalBalanceGlobal,
    grandTotalUSD,
    expensesData,
    handleSetupComplete,
  } = state;

  // ── UI state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [aiAdvice, setAiAdvice] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // ── Modal state ────────────────────────────────────────────────────
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalInitialData, setTxModalInitialData] = useState<any>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | null
  >(null);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [payDebtData, setPayDebtData] = useState<Debt | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isTxListModalOpen, setIsTxListModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
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

  const openConfirmation = (data: {
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }) => {
    setConfirmationData({ isOpen: true, ...data });
  };

  // ── Inicializar notificaciones al montar ───────────────────────────
  useEffect(() => {
    // Solo pide permisos si el usuario ya completó el setup
    const isSetupDone = localStorage.getItem("app_setup_complete");
    if (!isSetupDone) return;

    requestNotificationPermission().then((granted) => {
      if (granted) {
        scheduleDailyReminder();
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hooks ──────────────────────────────────────────────────────────
  const { updateStreak, skipLogDay } = useStreak(
    lastLogDate,
    setLastLogDate,
    setStreakCount,
  );

  const {
    addTransaction,
    deleteTransaction,
    editTransaction,
  
  } = useTransactions({
    accounts,
    setAccounts,
    transactions,
    setTransactions,
  
    setSelectedTransaction,
    updateStreak,
    debts,
    setDebts,
  });

  const { addDebt, deleteDebt, handleDebtPayment } = useDebts({
    accounts,
    setAccounts,
    debts,
    setDebts,
    setTransactions,
    payDebtData,
    setPayDebtData,
    updateStreak,
    openConfirmation,
  });


  // ── Account actions ────────────────────────────────────────────────
  const saveAccount = (account: Account) => {
    if (editingAccount && editingAccount.name !== "") {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? account : a)),
      );
      showToast("success", "Cuenta actualizada", account.name);
    } else {
      setAccounts((prev) => [...prev, account]);
      showToast("success", "Cuenta creada", account.name);
    }
    setEditingAccount(null);
    setIsAccountModalOpen(false);
  };

  const handleDeleteAccountAttempt = (account: Account) => {
    const hasTransactions = transactions.some(
      (t) => t.accountId === account.id || t.toAccountId === account.id,
    );
    if (hasTransactions) {
      showToast(
        "error",
        "No se puede eliminar",
        "Esta cuenta tiene transacciones asociadas.",
      );
      return;
    }
    openConfirmation({
      title: "Eliminar Cuenta",
      message: `¿Eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`,
      isDanger: true,
      onConfirm: () => {
        setAccounts((prev) => prev.filter((a) => a.id !== account.id));
        showToast("success", "Cuenta eliminada");
      },
    });
  };

  // ── Category actions ───────────────────────────────────────────────
  const saveCategory = (categoryData: Category) => {
    setCategories((prev) => {
      const exists = prev.find((c) => c.id === categoryData.id);
      if (exists)
        return prev.map((c) => (c.id === categoryData.id ? categoryData : c));
      return [...prev, categoryData];
    });
    showToast(
      "success",
      editingCategory ? "Categoría actualizada" : "Categoría creada",
      categoryData.name,
    );
    setEditingCategory(null);
  };

  const handleDeleteCategoryAttempt = (categoryId: string) => {
    const categoryToDelete = categories.find((c) => c.id === categoryId);
    if (!categoryToDelete) return;
    if (!categoryToDelete.isCustom) {
      showToast(
        "error",
        "No permitido",
        `La categoría "${categoryToDelete.name}" es del sistema.`,
      );
      return;
    }
    if (transactions.some((t) => t.categoryId === categoryId)) {
      showToast(
        "error",
        "No se puede eliminar",
        `"${categoryToDelete.name}" ya está en uso.`,
      );
      return;
    }
    openConfirmation({
      title: "Eliminar Categoría",
      message: `¿Eliminar la categoría "${categoryToDelete.name}"?`,
      isDanger: true,
      onConfirm: () => {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        showToast("success", "Categoría eliminada", "");
      },
    });
  };

  // ── Transaction actions ────────────────────────────────────────────
  const payYourselfFirst = () => {
    const savingsAcc = accounts.find((a) => a.type === AccountType.SAVINGS);
    if (!savingsAcc) {
      showToast(
        "warning",
        "Sin cuenta de ahorros",
        "Crea una cuenta de tipo 'Ahorros' primero.",
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
    setEditingTransactionId(null);
    setIsTxModalOpen(true);
  };

  const openNewTransaction = () => {
    if (accounts.length === 0) {
      showToast("warning", "Sin cuentas", "Primero debes crear una cuenta.");
      return;
    }
    setTxModalInitialData(null);
    setEditingTransactionId(null);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = (data: any) => {
    if (editingTransactionId) {
      editTransaction(editingTransactionId, data);
      showToast("success", "Transacción actualizada", "");
    } else {
      addTransaction(data);
      showToast("success", "Transacción guardada", "");
    }
    setEditingTransactionId(null);
    setIsTxModalOpen(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(null);
    setEditingTransactionId(transaction.id);
    setTxModalInitialData({
      type: transaction.type,
      amount: transaction.amount,
      accountId: transaction.accountId,
      toAccountId: transaction.toAccountId,
      categoryId: transaction.categoryId,
      note: transaction.note,
    });
    setIsTxModalOpen(true);
  };

  // ── Goal actions ───────────────────────────────────────────────────
  const handleAddGoal = async (
    goalData: Omit<Goal, "id" | "createdAt" | "isCompleted" | "savedAmount">,
  ) => {
    const newGoal: Goal = {
      ...goalData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split("T")[0],
      isCompleted: false,
      savedAmount: 0,
    };

    // Programa notificación si tiene fecha y recordatorio
    if (newGoal.reminderDaysBefore && newGoal.targetDate) {
      const notifId = await scheduleGoalReminder(newGoal);
      if (notifId) newGoal.notificationId = notifId;
    }

    setGoals((prev) => [newGoal, ...prev]);
    showToast("success", "Meta creada", newGoal.name);
  };

  const handleContributeGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const newSaved = Math.min(g.savedAmount + amount, g.targetAmount);
        const isNowCompleted = newSaved >= g.targetAmount;

        if (isNowCompleted && !g.isCompleted) {
          // Cancela el recordatorio y envía notif de celebración
          if (g.notificationId) cancelGoalReminder(g.notificationId);
          notifyGoalCompleted(g.name);
          showToast("success", "¡Meta completada! 🎉", g.name);
        } else {
          showToast(
            "success",
            "Abono registrado",
            `+${amount.toLocaleString()} a "${g.name}"`,
          );
        }

        return {
          ...g,
          savedAmount: newSaved,
          isCompleted: isNowCompleted,
        };
      }),
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    openConfirmation({
      title: "Eliminar Meta",
      message: `¿Eliminar la meta "${goal?.name}"? Esta acción no se puede deshacer.`,
      isDanger: true,
      onConfirm: () => {
        if (goal?.notificationId) cancelGoalReminder(goal.notificationId);
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        showToast("success", "Meta eliminada");
      },
    });
  };

  // ── AI Advisor ─────────────────────────────────────────────────────
  const handleGetAdvice = async () => {
    setIsLoadingAi(true);
    const advice = await getFinancialAdvice(transactions, accounts, debts);
    setAiAdvice(advice);
    setIsLoadingAi(false);
  };

  // ── Drive backup ───────────────────────────────────────────────────
const handleBackup = async () => {
  setIsBackingUp(true);
  const result = await backupToDrive();
  
  showToast(
    result.success ? "success" : "error",
    result.success ? "Respaldo completado" : "Error al respaldar",
    result.message,
  );

  setIsBackingUp(false);

  if (result.success) {
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
};

  const handleRestore = () => {
    openConfirmation({
      title: "Restaurar datos",
      message:
        "¿Seguro? Esto sobreescribirá TODOS tus datos actuales con los del respaldo en Drive.",
      isDanger: true,
      onConfirm: async () => {
        setIsRestoring(true);
        const result = await restoreFromDrive();
        showToast(
          result.success ? "success" : "error",
          result.success ? "Restauración completada" : "Error al restaurar",
          result.message,
        );
        if (result.success) setTimeout(() => window.location.reload(), 2000);
        setIsRestoring(false);
      },
    });
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    showToast("success", "Sesión cerrada", "Cuenta de Google desconectada.");
  };

  const handleSaveReminderTime = (
    hour: number,
    minute: number,
    enabled: boolean,
  ) => {
    if (enabled) {
      scheduleDailyReminder(hour, minute);
      showToast(
        "success",
        "Recordatorio guardado",
        `Te avisaremos cada día a las ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
    } else {
      cancelDailyReminder();
      showToast(
        "success",
        "Recordatorio desactivado",
        "No recibirás notificaciones diarias.",
      );
    }
  };

  // ── Nav config ─────────────────────────────────────────────────────
  // "advisor" y "settings" se acceden desde el header, no aparecen en el nav
  const NAV_TABS: ActiveTab[] = ["dashboard", "accounts", "debts", "goals"];
  const NAV_ICONS: Record<string, React.ReactNode> = {
    dashboard: <LayoutDashboard className="w-5 h-5" />,
    accounts: <Wallet className="w-5 h-5" />,
    debts: <ArrowRightLeft className="w-5 h-5" />,
    goals: <Target className="w-5 h-5" />,
  };
  const NAV_LABELS: Record<string, string> = {
    dashboard: "Inicio",
    accounts: "Cuentas",
    debts: "Deudas",
    goals: "Metas",
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto shadow-2xl overflow-hidden relative font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h1
          data-tour="header-logo"
          className="text-xl font-black text-slate-800 tracking-tight"
        >
          Finanza<span className="text-primary">Pro</span>
        </h1>
        <button
          onClick={() => setActiveTab("settings")}
          className={
            "w-9 h-9 rounded-full flex items-center justify-center transition-colors " +
            (activeTab === "settings"
              ? "bg-primary/10 text-primary"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200")
          }
          aria-label="Ajustes"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="p-6 min-h-[calc(100vh-140px)]">
        {activeTab === "dashboard" && (
          <DashboardView
            userCountry={userCountry}
            mainCurrency={mainCurrency}
            bcvRate={bcvRate}
            streakCount={streakCount}
            lastLogDate={lastLogDate}
            grandTotalUSD={grandTotalUSD}
            totalBalanceUSD={totalBalanceUSD}
            totalBalanceVES={totalBalanceVES}
            totalBalanceGlobal={totalBalanceGlobal}
            expensesData={expensesData}
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            onSkipDay={skipLogDay}
            onPayYourself={payYourselfFirst}
            onViewAll={() => setIsTxListModalOpen(true)}
            onSelectTransaction={setSelectedTransaction}
          />
        )}
        {activeTab === "accounts" && (
          <AccountsView
            accounts={accounts}
            userCountry={userCountry}
            mainCurrency={mainCurrency}
            onEdit={(acc) => {
              setEditingAccount(acc);
              setIsAccountModalOpen(true);
            }}
            onDeleteAttempt={handleDeleteAccountAttempt}
            onAddAccount={() => {
              setEditingAccount({
                id: crypto.randomUUID(),
                name: "",
                type: AccountType.BANK,
                currency: (userCountry === "Venezuela"
                  ? "USD"
                  : mainCurrency) as Currency,
                balance: 0,
                color: "#3b82f6",
                icon: "🏦",
              });
              setIsAccountModalOpen(true);
            }}
          />
        )}
        {activeTab === "debts" && (
          <DebtsView
            debts={debts}
            accounts={accounts}
            transactions={transactions}
            userCountry={userCountry}
            mainCurrency={mainCurrency}
            onDeleteDebt={deleteDebt}
            onPayDebt={setPayDebtData}
            onAddDebt={() => setIsDebtModalOpen(true)}
          />
        )}
        {activeTab === "goals" && (
          <GoalsView
            goals={goals}
            userCountry={userCountry}
            mainCurrency={mainCurrency}
            onAddGoal={handleAddGoal}
            onContributeGoal={handleContributeGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}
        {activeTab === "advisor" && (
          <AdvisorView
            aiAdvice={aiAdvice}
            isLoadingAi={isLoadingAi}
            onGetAdvice={handleGetAdvice}
          />
        )}
        {activeTab === "settings" && (
          <SettingsView
            isBackingUp={isBackingUp}
            isRestoring={isRestoring}
            onBackup={handleBackup}
            onRestore={handleRestore}
            onSignOut={handleSignOut}
            onResetTour={resetTour}
            onSaveReminderTime={handleSaveReminderTime}
          />
        )}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-100 px-4 py-2 flex items-center z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {/* Botón + central */}
        <div className="relative -top-4 ml-1 mr-3 shrink-0">
          <button
            data-tour="btn-add"
            onClick={openNewTransaction}
            className="w-14 h-14 bg-primary rounded-full shadow-xl shadow-blue-900/20 text-white flex items-center justify-center border-4 border-white hover:scale-105 transition-transform"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-around flex-1">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              {...(TAB_TOUR_IDS[tab] ? { "data-tour": TAB_TOUR_IDS[tab] } : {})}
              onClick={() => setActiveTab(tab)}
              className={
                "flex flex-col items-center gap-1 transition-colors px-1 " +
                (activeTab === tab ? "text-primary" : "text-slate-400")
              }
            >
              {NAV_ICONS[tab]}
              <span className="text-[10px] font-medium">{NAV_LABELS[tab]}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Modals ── */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransactionId(null);
        }}
        accounts={accounts}
        categories={categories}
        onSave={handleSaveTransaction}
        currentExchangeRate={bcvRate}
        initialData={txModalInitialData}
        onAddCategory={() => {
          setEditingCategory(null);
          setIsCategoryModalOpen(true);
        }}
        onEditCategory={(cat) => {
          setEditingCategory(cat);
          setIsCategoryModalOpen(true);
        }}
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
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={saveCategory}
        initialCategory={editingCategory}
        onDelete={handleDeleteCategoryAttempt}
      />
      <TransactionListModal
        isOpen={isTxListModalOpen}
        onClose={() => setIsTxListModalOpen(false)}
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        onSelectTransaction={setSelectedTransaction}
      />
      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        categories={categories}
        accounts={accounts}
        onEdit={handleEditTransaction}
        onDelete={(id) =>
          openConfirmation({
            title: "Eliminar Transacción",
            message: "¿Eliminar esta transacción? Los saldos serán revertidos.",
            isDanger: true,
            onConfirm: () => deleteTransaction(id),
          })
        }
      />
      <ConfirmationModal
        isOpen={confirmationData.isOpen}
        onClose={() => setConfirmationData((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmationData.onConfirm}
        title={confirmationData.title}
        message={confirmationData.message}
        isDanger={confirmationData.isDanger}
      />
      <SetupModal onSetupComplete={handleSetupComplete} />

      {/* ── Tours ── */}
      <OnboardingTour />
      <SpotlightTour />
    </div>
  );
}

export default App;
