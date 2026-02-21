import {
  Account,
  Transaction,
  RecurringTransaction,
  Currency,
  TransactionType,
  Frequency,
} from "../types";
import React from "react";
import { useToast } from "../components/ToastProvider";

interface UseTransactionsProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  recurringTransactions: RecurringTransaction[];
  setRecurringTransactions: React.Dispatch<
    React.SetStateAction<RecurringTransaction[]>
  >;
  setSelectedTransaction: (t: Transaction | null) => void;
  updateStreak: () => void;
}

export function useTransactions({
  accounts,
  setAccounts,
  transactions,
  setTransactions,
  recurringTransactions,
  setRecurringTransactions,
  setSelectedTransaction,
  updateStreak,
}: UseTransactionsProps) {
  const { showToast } = useToast();

  const addTransaction = (data: any) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      ...data,
      isRecurring: undefined,
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (data.isRecurring) {
      let nextDate = new Date(data.date);
      const freq = data.frequency || Frequency.MONTHLY;
      const interval = data.customInterval || 1;
      const unit = data.customUnit || "MONTHS";
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

  const processRecurring = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    let hasChanges = false;
    const newTxs: Transaction[] = [];

    const calcNextDate = (
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
          const i = rt.customInterval || 1;
          if (rt.customUnit === "DAYS") date.setDate(date.getDate() + i);
          if (rt.customUnit === "WEEKS") date.setDate(date.getDate() + i * 7);
          if (rt.customUnit === "MONTHS") date.setMonth(date.getMonth() + i);
          if (rt.customUnit === "YEARS")
            date.setFullYear(date.getFullYear() + i);
          break;
        default:
          date.setMonth(date.getMonth() + 1);
      }
      return date.toISOString().split("T")[0];
    };

    const updatedRecurring = recurringTransactions.map((rt) => {
      if (rt.active && rt.nextDueDate <= todayStr) {
        newTxs.push({
          id: crypto.randomUUID(),
          amount: rt.amount,
          currency: rt.currency,
          type: rt.type,
          accountId: rt.accountId,
          categoryId: rt.categoryId,
          date: rt.nextDueDate,
          note: `(Recurrente) ${rt.note}`,
        });
        hasChanges = true;
        return { ...rt, nextDueDate: calcNextDate(rt.nextDueDate, rt) };
      }
      return rt;
    });

    if (hasChanges) {
      setRecurringTransactions(updatedRecurring);
      newTxs.forEach((tx) => {
        setTransactions((prev) => [tx, ...prev]);
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === tx.accountId
              ? {
                  ...acc,
                  balance:
                    tx.type === "INCOME"
                      ? acc.balance + tx.amount
                      : acc.balance - tx.amount,
                }
              : acc,
          ),
        );
      });
      // Toast instead of alert
      showToast(
        "info",
        `${newTxs.length} transacciones generadas`,
        "Se procesaron tus pagos recurrentes pendientes.",
      );
    }
  };

  return { addTransaction, deleteTransaction, processRecurring };
}
