import {
  Account,
  Debt,
  Transaction,
  Currency,
  TransactionType,
} from "../types";
import React from "react";

interface UseDebtsProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  payDebtData: Debt | null;
  setPayDebtData: (d: Debt | null) => void;
  updateStreak: () => void;
  openConfirmation: (data: {
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }) => void;
}

export function useDebts({
  accounts,
  setAccounts,
  debts,
  setDebts,
  setTransactions,
  payDebtData,
  setPayDebtData,
  updateStreak,
  openConfirmation,
}: UseDebtsProps) {
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
    openConfirmation({
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
    
    // 1. Encontramos la cuenta para saber en qué moneda está
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const isPaying = payDebtData.type === "I_OWE";

    // 2. Calculamos cuánto se descuenta de la cuenta bancaria realmente
    let deductionAmount = amount;
    if (account.currency !== payDebtData.currency && exchangeRate) {
      if (
        payDebtData.currency === Currency.USD &&
        account.currency === Currency.VES
      )
        deductionAmount = amount * exchangeRate;
      else if (
        payDebtData.currency === Currency.VES &&
        account.currency === Currency.USD
      )
        deductionAmount = amount / exchangeRate;
    }

    // 3. Actualizamos la deuda
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== payDebtData.id) return d;
        const newPaid = d.paidAmount + amount;
        return { ...d, paidAmount: newPaid, isPaid: newPaid >= d.amount };
      }),
    );

    // 4. Actualizamos la cuenta
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        return {
          ...acc,
          balance: isPaying
            ? acc.balance - deductionAmount
            : acc.balance + deductionAmount,
        };
      }),
    );

    // 5. Creamos la transacción
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount: deductionAmount,
      currency: account.currency, 
      type: isPaying ? TransactionType.EXPENSE : TransactionType.INCOME,
      accountId,
      categoryId: "10",
      date: new Date().toISOString().split("T")[0],
      note: `${isPaying ? "Pago a deuda" : "Cobro de deuda"}: ${payDebtData.name} (Abonado: ${amount} ${payDebtData.currency})`,
      linkedDebtId: payDebtData.id,
      debtPaymentAmount: amount, 
      exchangeRate,
    };
    
    setTransactions((prev) => [newTx, ...prev]);
    setPayDebtData(null);
    updateStreak();
  };

  return { addDebt, deleteDebt, handleDebtPayment };
}