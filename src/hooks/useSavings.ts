import { useEffect, useMemo } from "react";
import { useSavingsStore } from "../stores/savings.store";
import { useTransactionsStore } from "../stores/transactions.store";
import type { AddSavingInput, Saving } from "../types";

export function useSavings(transactionId?: string) {
  const {
    savings: allSavings,
    loading,
    error,
    fetchSavings,
    addSaving: storeAddSaving,
    deleteSaving: storeDeleteSaving,
  } = useSavingsStore();

  const { fetchTransactions } = useTransactionsStore();

  useEffect(() => {
    fetchSavings();
  }, [fetchSavings]);

  const savings = useMemo(
    () =>
      transactionId
        ? allSavings.filter((s) => s.transaction_id === transactionId)
        : allSavings,
    [allSavings, transactionId]
  );

  const addSaving = async (input: AddSavingInput): Promise<Saving> => {
    const result = await storeAddSaving(input);
    await fetchTransactions();
    return result;
  };

  const deleteSaving = async (id: string): Promise<void> => {
    await storeDeleteSaving(id);
    await fetchTransactions();
  };

  const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);

  return {
    savings,
    loading,
    error,
    totalSaved,
    addSaving,
    deleteSaving,
    refetch: fetchSavings,
  };
}
