import { useEffect, useMemo } from "react";
import { useTransactionsStore } from "../stores/transactions.store";

export function useTransactions(cardId?: string) {
  const {
    transactions: allTransactions,
    loading,
    error,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    togglePaid,
    toggleInstallmentPeriodPaid,
    markGroupPaid,
  } = useTransactionsStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const transactions = useMemo(
    () =>
      cardId
        ? allTransactions.filter((t) => t.card_id === cardId)
        : allTransactions,
    [allTransactions, cardId]
  );

  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalSaved = transactions.reduce(
    (sum, t) => sum + (t.total_saved ?? 0),
    0
  );
  const totalRemaining = transactions.reduce(
    (sum, t) => sum + (t.remaining ?? t.amount),
    0
  );

  return {
    transactions,
    loading,
    error,
    totalSpending,
    totalSaved,
    totalRemaining,
    addTransaction,
    deleteTransaction,
    togglePaid,
    toggleInstallmentPeriodPaid,
    markGroupPaid,
    refetch: fetchTransactions,
  };
}
