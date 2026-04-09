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

  const totalSpending = transactions.reduce((sum, t) => {
    // if (t.is_installment && t.monthly_amount && t.installment_months) {
    //   const paidPeriods = t.paid_periods_count ?? 0;
    //   const unpaidPeriods = Math.max(0, t.installment_months - paidPeriods);
    //   return sum + t.monthly_amount * unpaidPeriods;
    // }
    return sum + t.amount;
  }, 0);
  const totalSaved = transactions.reduce((sum, t) => {
    if (t.is_installment && (t.paid_periods_count ?? 0) >= (t.installment_months ?? 0)) return sum;
    return sum + (t.total_saved ?? 0);
  }, 0);
  const totalRemaining = transactions.reduce((sum, t) => {
    if (t.is_installment && (t.paid_periods_count ?? 0) >= (t.installment_months ?? 0)) return sum;
    return sum + (t.remaining ?? t.amount);
  }, 0);

  const unpaidTransactions = transactions.filter((t) =>
    t.is_installment
      ? (t.paid_periods_count ?? 0) < (t.installment_months ?? 0)
      : !t.is_paid
  );
  const unpaidSpending = unpaidTransactions.reduce((sum, t) => {
    if (t.is_installment && t.monthly_amount && t.installment_months) {
      const paidPeriods = t.paid_periods_count ?? 0;
      const unpaidPeriods = Math.max(0, t.installment_months - paidPeriods);
      return sum + t.monthly_amount * unpaidPeriods;
    }
    return sum + t.amount;
  }, 0);
  const unpaidSaved = unpaidTransactions.reduce(
    (sum, t) => sum + (t.total_saved ?? 0),
    0
  );
  const unpaidShortage = unpaidTransactions.reduce(
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
    unpaidSpending,
    unpaidSaved,
    unpaidShortage,
    addTransaction,
    deleteTransaction,
    togglePaid,
    toggleInstallmentPeriodPaid,
    markGroupPaid,
    refetch: fetchTransactions,
  };
}
