import React, { useState, useEffect } from "react";
import {
  Account,
  Transaction,
  Debt,
  Category,
  AccountType,
  TransactionType,
  Currency,
} from "./types";

// Hooks
import { useAppState } from "./hooks/useAppState";
import { useTransactions } from "./hooks/useTransactions";
import { useDebts } from "./hooks/useDebts";
import { useStreak } from "./hooks/useStreak";

// Views
import { DashboardView } from "./views/DashboardView";
import { AccountsView } from "./views/AccountsView";
import { DebtsView } from "./views/DebtsView";
import { AdvisorView } from "./views/AdvisorView";

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
import { useToast } from "./components/ToastProvider";

// Services
import { getFinancialAdvice } from "./services/geminiService";

// Icons
import { Plus, LayoutDashboard, Wallet, ArrowRightLeft } from "lucide-react";

type ActiveTab = "dashboard" | "accounts" | "debts" | "advisor";

function App() {
  const { showToast } = useToast();

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
    recurringTransactions,
    setRecurringTransactions,
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

  // ── Modal state ────────────────────────────────────────────────────
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalInitialData, setTxModalInitialData] = useState<any>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

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

  // ── Hooks ──────────────────────────────────────────────────────────
  const { updateStreak, skipLogDay } = useStreak(
    lastLogDate,
    setLastLogDate,
    setStreakCount,
  );

  const { addTransaction, deleteTransaction, editTransaction, processRecurring } =
    useTransactions({
      accounts,
      setAccounts,
      transactions,
      setTransactions,
      recurringTransactions,
      setRecurringTransactions,
      setSelectedTransaction,
      updateStreak,
      debts,    // NUEVO: Pasamos debts
      setDebts  // NUEVO: Pasamos setDebts
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

  useEffect(() => {
    if (recurringTransactions.length > 0) processRecurring();
  }, []); 

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

  // Lógica para guardar/editar categorías
  const saveCategory = (categoryData: Category) => {
    setCategories((prev) => {
      const exists = prev.find(c => c.id === categoryData.id);
      if (exists) {
        return prev.map(c => c.id === categoryData.id ? categoryData : c);
      } else {
        return [...prev, categoryData];
      }
    });
    showToast("success", editingCategory ? "Categoría actualizada" : "Categoría creada", categoryData.name);
    setEditingCategory(null);
  };

  const handleDeleteCategoryAttempt = (categoryId: string) => {
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    // NUEVO: Protegemos las categorías por defecto
    if (!categoryToDelete.isCustom) {
      showToast(
        "error", 
        "No permitido", 
        `La categoría "${categoryToDelete.name}" es del sistema y no puede ser eliminada.`
      );
      return; 
    }

    const isInUse = transactions.some(t => t.categoryId === categoryId);
    if (isInUse) {
      showToast(
        "error", 
        "No se puede eliminar", 
        `La categoría "${categoryToDelete.name}" ya está siendo usada en tus movimientos.`
      );
      return; 
    }

    openConfirmation({
      title: "Eliminar Categoría",
      message: `¿Estás seguro de eliminar la categoría "${categoryToDelete.name}"?`,
      isDanger: true,
      onConfirm: () => {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        showToast("success", "Categoría eliminada", "");
      }
    });
  };

  // ── Other actions ──────────────────────────────────────────────────
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

  const handleGetAdvice = async () => {
    setIsLoadingAi(true);
    const advice = await getFinancialAdvice(transactions, accounts, debts);
    setAiAdvice(advice);
    setIsLoadingAi(false);
  };

  // ── Render ─────────────────────────────────────────────────────────
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
            userCountry={userCountry}
            mainCurrency={mainCurrency}
            onDeleteDebt={deleteDebt}
            onPayDebt={setPayDebtData}
            onAddDebt={() => setIsDebtModalOpen(true)}
          />
        )}
        {activeTab === "advisor" && (
          <AdvisorView
            aiAdvice={aiAdvice}
            isLoadingAi={isLoadingAi}
            onGetAdvice={handleGetAdvice}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-100 px-6 py-2 flex items-center z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="relative -top-4 ml-2 mr-6 shrink-0">
          <button
            onClick={openNewTransaction}
            className="w-14 h-14 bg-primary rounded-full shadow-xl shadow-blue-900/20 text-white flex items-center justify-center border-4 border-white hover:scale-105 transition-transform"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
        <div className="flex items-center justify-around flex-1">
          {(["dashboard", "accounts", "debts"] as ActiveTab[]).map((tab) => {
            const icons: Record<string, React.ReactNode> = {
              dashboard: <LayoutDashboard className="w-6 h-6" />,
              accounts: <Wallet className="w-6 h-6" />,
              debts: <ArrowRightLeft className="w-6 h-6" />,
            };
            const labels: Record<string, string> = {
              dashboard: "Inicio",
              accounts: "Cuentas",
              debts: "Deudas",
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  "flex flex-col items-center gap-1 transition-colors " +
                  (activeTab === tab ? "text-primary" : "text-slate-400")
                }
              >
                {icons[tab]}
                <span className="text-[10px] font-medium">{labels[tab]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
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
      <OnboardingTour />
    </div>
  );
}

export default App;