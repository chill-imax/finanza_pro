import {
  Account,
  Transaction,
  Currency,
  TransactionType,
  Debt,
} from "../types";
import React from "react";
import { useToast } from "../components/ToastProvider";

interface UseTransactionsProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setSelectedTransaction: (t: Transaction | null) => void;
  updateStreak: () => void;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
}

export function useTransactions({
  accounts,
  setAccounts,
  transactions,
  setTransactions,
  setSelectedTransaction,
  updateStreak,
  debts,
  setDebts,
}: UseTransactionsProps) {
  const { showToast } = useToast();

  const addTransaction = (data: any) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      ...data,
    };
    setTransactions((prev) => [newTx, ...prev]);

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
          )
            transferAddAmount = newTx.amount * newTx.exchangeRate;
          else if (
            fromAcc.currency === Currency.VES &&
            toAcc.currency === Currency.USD
          )
            transferAddAmount = newTx.amount / newTx.exchangeRate;
        }
      }
    }

    setAccounts((prev) =>
      prev.map((acc) => {
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
        )
          return { ...acc, balance: acc.balance + transferAddAmount };
        return acc;
      }),
    );
    updateStreak();
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // 1. REVERSIÓN DE LA DEUDA
    if (tx.linkedDebtId) {
      setDebts((prevDebts) =>
        prevDebts.map((d) => {
          if (d.id === tx.linkedDebtId) {
            const amountToRevert = tx.debtPaymentAmount || tx.amount;
            const newPaidAmount = Math.max(0, d.paidAmount - amountToRevert);
            return {
              ...d,
              paidAmount: newPaidAmount,
              isPaid: newPaidAmount >= d.amount,
            };
          }
          return d;
        }),
      );
    } else if (
      String(tx.categoryId) === "10" ||
      (tx.note && tx.note.toLowerCase().includes("deuda"))
    ) {
      // Mensaje para abonos viejos (que no tienen el linkedDebtId)
      setTimeout(() => {
        showToast(
          "info",
          "Aviso",
          "Se eliminó el abono antiguo y devolvió a tu cuenta, pero debes ajustar la deuda manualmente.",
        );
      }, 500);
    }

    // 2. REVERSIÓN DE LA CUENTA BANCARIA
    setAccounts((prev) =>
      prev.map((acc) => {
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
      }),
    );
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setSelectedTransaction(null);
  };

  const editTransaction = (id: string, updatedData: any) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t)),
    );

    setAccounts((prev) => {
      let tempAccounts = [...prev];

      const applyAmount = (
        accId: string,
        amount: number,
        type: TransactionType,
        isRevert: boolean,
      ) => {
        const index = tempAccounts.findIndex((a) => a.id === accId);
        if (index === -1) return;

        let modifier = isRevert ? -1 : 1;
        if (
          type === TransactionType.EXPENSE ||
          type === TransactionType.TRANSFER
        ) {
          modifier *= -1;
        }

        tempAccounts[index] = {
          ...tempAccounts[index],
          balance: tempAccounts[index].balance + amount * modifier,
        };
      };

      // 1. REVERTIR la transacción vieja
      applyAmount(oldTx.accountId, oldTx.amount, oldTx.type, true);
      if (oldTx.type === TransactionType.TRANSFER && oldTx.toAccountId) {
        let revertAmount = oldTx.amount;
        if (oldTx.exchangeRate) {
          const sourceAcc = prev.find((a) => a.id === oldTx.accountId);
          const targetAcc = prev.find((a) => a.id === oldTx.toAccountId);
          if (
            sourceAcc?.currency === Currency.USD &&
            targetAcc?.currency === Currency.VES
          ) {
            revertAmount = oldTx.amount * oldTx.exchangeRate;
          } else if (
            sourceAcc?.currency === Currency.VES &&
            targetAcc?.currency === Currency.USD
          ) {
            revertAmount = oldTx.amount / oldTx.exchangeRate;
          }
        }
        applyAmount(
          oldTx.toAccountId,
          revertAmount,
          TransactionType.INCOME,
          true,
        );
      }

      // 2. APLICAR la transacción nueva
      applyAmount(
        updatedData.accountId,
        updatedData.amount,
        updatedData.type,
        false,
      );
      if (
        updatedData.type === TransactionType.TRANSFER &&
        updatedData.toAccountId
      ) {
        let applyAm = updatedData.amount;
        if (updatedData.exchangeRate) {
          const sourceAcc = prev.find((a) => a.id === updatedData.accountId);
          const targetAcc = prev.find((a) => a.id === updatedData.toAccountId);
          if (
            sourceAcc?.currency === Currency.USD &&
            targetAcc?.currency === Currency.VES
          ) {
            applyAm = updatedData.amount * updatedData.exchangeRate;
          } else if (
            sourceAcc?.currency === Currency.VES &&
            targetAcc?.currency === Currency.USD
          ) {
            applyAm = updatedData.amount / updatedData.exchangeRate;
          }
        }
        applyAmount(
          updatedData.toAccountId,
          applyAm,
          TransactionType.INCOME,
          false,
        );
      }

      return tempAccounts;
    });
    updateStreak();
    setSelectedTransaction(null);
  };

  return {
    addTransaction,
    deleteTransaction,
    editTransaction,
  };
}