import React, { useState, useEffect, useMemo } from "react";
import {
  Account,
  Category,
  TransactionType,
  Currency,
} from "../types";
import {
  X,
  RefreshCw,
  Sprout,
  Edit2,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onSave: (data: any) => void;
  currentExchangeRate: number;
  initialData?: Partial<{
    type: TransactionType;
    amount: number;
    accountId: string;
    toAccountId: string;
    categoryId: string;
    note: string;
    isSavingsMode?: boolean;
  }> | null;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  onSave,
  currentExchangeRate,
  initialData,
  onAddCategory,
  onEditCategory,
}) => {
  const userCountry = localStorage.getItem("user_country") || "Venezuela";
  const mainCurrency = localStorage.getItem("main_currency") || "USD";

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState("");
  const [inputCurrency, setInputCurrency] = useState<Currency | string>(
    Currency.USD,
  );
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [customExchangeRate, setCustomExchangeRate] = useState<string>("");

  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);

  const isSavings = initialData?.isSavingsMode;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || TransactionType.EXPENSE);
        setAmount(initialData.amount ? initialData.amount.toString() : "");
        setAccountId(initialData.accountId || accounts[0]?.id || "");
        const initialAcc = accounts.find(
          (a) => a.id === (initialData.accountId || accounts[0]?.id),
        );
        setInputCurrency(
          userCountry === "Venezuela"
            ? initialAcc?.currency || Currency.USD
            : mainCurrency,
        );
        setToAccountId(
          initialData.toAccountId ||
            (accounts.length > 1 ? accounts[1].id : ""),
        );
        setCategoryId(initialData.categoryId || categories[0]?.id || "");
        setNote(initialData.note || "");
      } else {
        setType(TransactionType.EXPENSE);
        setAmount("");
        setAccountId(accounts[0]?.id || "");
        const initialAcc = accounts[0];
        setInputCurrency(
          userCountry === "Venezuela"
            ? initialAcc?.currency || Currency.USD
            : mainCurrency,
        );
        setToAccountId(accounts.length > 1 ? accounts[1].id : "");
        setCategoryId(categories[0]?.id || "");
        setNote("");
      }
      setDate(new Date().toISOString().split("T")[0]);
      setCustomExchangeRate(currentExchangeRate.toString());

      setIsCategoryEditMode(false);
    }
  }, [
    isOpen,
    initialData,
    accounts,
    currentExchangeRate,
    categories,
    userCountry,
    mainCurrency,
  ]);

  const sourceAccount = accounts.find((a) => a.id === accountId);
  const targetAccount = accounts.find((a) => a.id === toAccountId);

  const isRateNeeded = useMemo(() => {
    if (userCountry !== "Venezuela") return false;
    if (!sourceAccount) return false;
    if (inputCurrency !== sourceAccount.currency) return true;
    if (type === TransactionType.TRANSFER && targetAccount) {
      if (sourceAccount.currency !== targetAccount.currency) return true;
    }
    return false;
  }, [inputCurrency, sourceAccount, targetAccount, type, userCountry]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccount) return;

    let finalAmount = parseFloat(amount);

    // NUEVO: Siempre guardar la tasa en Venezuela
    let finalRate: number | undefined = undefined;
    if (userCountry === "Venezuela") {
      finalRate = parseFloat(customExchangeRate) || currentExchangeRate;
    }

    if (
      userCountry === "Venezuela" &&
      inputCurrency !== sourceAccount.currency
    ) {
      if (
        inputCurrency === Currency.USD &&
        sourceAccount.currency === Currency.VES
      ) {
        finalAmount = parseFloat(amount) * (finalRate || currentExchangeRate);
      } else if (
        inputCurrency === Currency.VES &&
        sourceAccount.currency === Currency.USD
      ) {
        finalAmount = parseFloat(amount) / (finalRate || currentExchangeRate);
      }
    }

    onSave({
      type,
      amount: finalAmount,
      currency: sourceAccount.currency,
      accountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      categoryId: type === TransactionType.TRANSFER ? "TRANSFER" : categoryId,
      note,
      date,
      exchangeRate: finalRate,
    });
    onClose();
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    if (userCountry === "Venezuela") {
      return currencyCode === "USD"
        ? `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : `Bs.${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    return `${mainCurrency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const getSummary = () => {
    if (!sourceAccount || !amount) return null;
    const val = parseFloat(amount);
    const rate = parseFloat(customExchangeRate) || currentExchangeRate;
    let sourceDeduction = val;
    let sourceCurrency = inputCurrency;

    if (
      userCountry === "Venezuela" &&
      inputCurrency !== sourceAccount.currency
    ) {
      if (
        inputCurrency === Currency.USD &&
        sourceAccount.currency === Currency.VES
      ) {
        sourceDeduction = val * rate;
        sourceCurrency = Currency.VES;
      } else if (
        inputCurrency === Currency.VES &&
        sourceAccount.currency === Currency.USD
      ) {
        sourceDeduction = val / rate;
        sourceCurrency = Currency.USD;
      }
    } else {
      sourceCurrency = sourceAccount.currency;
    }

    let targetAddition = sourceDeduction;
    if (
      userCountry === "Venezuela" &&
      type === TransactionType.TRANSFER &&
      targetAccount
    ) {
      if (sourceAccount.currency !== targetAccount.currency) {
        if (
          sourceAccount.currency === Currency.USD &&
          targetAccount.currency === Currency.VES
        ) {
          targetAddition = sourceDeduction * rate;
        } else if (
          sourceAccount.currency === Currency.VES &&
          targetAccount.currency === Currency.USD
        ) {
          targetAddition = sourceDeduction / rate;
        }
      }
    }

    if (isSavings) {
      return (
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs space-y-1 mt-2">
          <div className="flex justify-between">
            <span className="text-emerald-700">
              Moverás desde ({sourceAccount.name}):
            </span>
            <span className="font-bold text-emerald-800">
              {formatCurrency(sourceDeduction, sourceAccount.currency)}
            </span>
          </div>
          {targetAccount && (
            <div className="flex justify-between pt-1 border-t border-emerald-200">
              <span className="text-emerald-700">
                Tu hucha recibirá ({targetAccount.name}):
              </span>
              <span className="font-bold text-emerald-900">
                + {formatCurrency(targetAddition, targetAccount.currency)}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mt-4">
        <div className="flex justify-between">
          <span
            className={
              type === TransactionType.INCOME ? "text-emerald-700" : ""
            }
          >
            {type === TransactionType.INCOME
              ? "Se depositará en"
              : "Se descontará de"}{" "}
            ({sourceAccount.name}):
          </span>
          <span
            className={`font-bold ${type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"}`}
          >
            {type === TransactionType.INCOME ? "+" : "-"}{" "}
            {formatCurrency(sourceDeduction, sourceAccount.currency)}
          </span>
        </div>
        {type === TransactionType.TRANSFER && targetAccount && (
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span>Se recibirá en ({targetAccount.name}):</span>
            <span className="font-bold text-emerald-600">
              + {formatCurrency(targetAddition, targetAccount.currency)}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (isSavings) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background:
              "linear-gradient(160deg, #064e3b 0%, #065f46 40%, #047857 100%)",
          }}
        >
          <div className="relative px-6 pt-8 pb-6 text-white overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest">
                  Modo Ahorro
                </p>
                <h2 className="text-xl font-black text-white leading-tight">
                  Págate a ti mismo
                </h2>
              </div>
            </div>
            <p className="text-emerald-200/80 text-xs leading-relaxed">
              Transfiere ahora a tu cuenta de ahorros antes de gastar. ¡Tu yo
              del futuro te lo agradecerá! 🌱
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-t-3xl px-5 pt-6 pb-8 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                ¿Cuánto vas a ahorrarte hoy?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-lg">
                    {userCountry === "Venezuela"
                      ? inputCurrency === "USD"
                        ? "$"
                        : "Bs."
                      : mainCurrency}
                  </span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-16 pr-4 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:outline-none text-2xl font-black text-emerald-900 placeholder:text-emerald-300"
                    placeholder="0.00"
                  />
                </div>
                {userCountry === "Venezuela" && (
                  <div className="w-20">
                    <select
                      value={inputCurrency}
                      onChange={(e) => setInputCurrency(e.target.value)}
                      className="w-full h-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl font-bold text-emerald-800 text-center focus:ring-2 focus:ring-emerald-400 outline-none appearance-none"
                    >
                      <option value={Currency.USD}>USD</option>
                      <option value={Currency.VES}>VES</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Desde
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tu hucha 🐖
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-sm font-semibold text-emerald-800"
              >
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
              </select>
            </div>

            {isRateNeeded && (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
                  <RefreshCw className="w-4 h-4" /> Tasa de Cambio
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={customExchangeRate}
                  onChange={(e) => setCustomExchangeRate(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-sm"
                  placeholder="Ej. 65.00"
                />
              </div>
            )}

            {getSummary()}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nota (opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Mi meta de ahorro..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />

            <button
              type="submit"
              className="w-full py-4 font-black rounded-2xl shadow-lg transition-all active:scale-95 text-white text-base"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              }}
            >
              🌱 Ahorrar ahora
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── NORMAL MODE RENDER ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800">
            Nueva Transacción
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === TransactionType.EXPENSE ? "bg-white text-red-500 shadow-sm" : "text-slate-500"}`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === TransactionType.INCOME ? "bg-white text-emerald-500 shadow-sm" : "text-slate-500"}`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.TRANSFER)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === TransactionType.TRANSFER ? "bg-white text-blue-500 shadow-sm" : "text-slate-500"}`}
            >
              Transferir
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Monto
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  {userCountry === "Venezuela"
                    ? inputCurrency === "USD"
                      ? "$"
                      : "Bs."
                    : mainCurrency}
                </span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full ${userCountry === "Venezuela" ? "pl-8" : "pl-12"} pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xl font-bold text-slate-800`}
                  placeholder="0.00"
                />
              </div>
              <div className="w-24">
                <select
                  value={inputCurrency}
                  onChange={(e) => setInputCurrency(e.target.value)}
                  disabled={userCountry !== "Venezuela"}
                  className={`w-full h-full bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 text-center focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${userCountry !== "Venezuela" ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {userCountry === "Venezuela" ? (
                    <>
                      <option value={Currency.USD}>USD</option>
                      <option value={Currency.VES}>VES</option>
                    </>
                  ) : (
                    <option value={mainCurrency}>{mainCurrency}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {type === TransactionType.TRANSFER ? "Desde" : "Cuenta"}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
            {type === TransactionType.TRANSFER && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hacia
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {isRateNeeded && (
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                <RefreshCw className="w-4 h-4" /> Tasa de Cambio Requerida
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1">
                  Tasa (Bs/USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={customExchangeRate}
                  onChange={(e) => setCustomExchangeRate(e.target.value)}
                  className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm"
                  placeholder="Ej. 65.00"
                />
              </div>
            </div>
          )}

          {getSummary()}

          {/* Categories */}
          {type !== TransactionType.TRANSFER && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Categoría
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCategoryEditMode(!isCategoryEditMode)}
                    className={`text-xs font-bold transition-colors flex items-center gap-1 ${isCategoryEditMode ? "text-amber-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Edit2 className="w-3 h-3" />
                    {isCategoryEditMode ? "Terminar Edición" : "Editar"}
                  </button>
                  <button
                    type="button"
                    onClick={onAddCategory}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    + Crear Nueva
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                {categories
                  .filter(
                    (c) =>
                      c.type === type ||
                      (c.id === "10" && type === TransactionType.INCOME),
                  )
                  .map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (isCategoryEditMode) {
                          onEditCategory(cat);
                        } else {
                          setCategoryId(cat.id);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                        isCategoryEditMode
                          ? "border-amber-300 bg-amber-50"
                          : categoryId === cat.id
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-slate-100 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {isCategoryEditMode && (
                        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-1 rounded-full shadow-sm animate-pulse">
                          <Edit2 className="w-2.5 h-2.5" />
                        </div>
                      )}

                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span className="text-[10px] truncate w-full text-center">
                        {cat.name}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nota
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opcional..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 font-bold rounded-xl shadow-lg transition-colors mt-4 bg-primary text-white hover:bg-slate-800"
          >
            Guardar Transacción
          </button>
        </form>
      </div>
    </div>
  );
};