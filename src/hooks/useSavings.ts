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
    addSavings: storeAddSavings,
    deleteSaving: storeDeleteSaving,
    deleteSavings: storeDeleteSavings,
  } = useSavingsStore();

  const {
    addSavingsToTransactions,
    removeSavingFromTransaction,
    removeSavingsFromTransactions,
  } =
    useTransactionsStore();

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
    addSavingsToTransactions([result]);
    return result;
  };

  const addSavings = async (inputs: AddSavingInput[]): Promise<Saving[]> => {
    if (inputs.length === 0) return [];

    const result = await storeAddSavings(inputs);
    addSavingsToTransactions(result);
    return result;
  };

  const deleteSaving = async (id: string): Promise<void> => {
    const savingToRemove = allSavings.find((saving) => saving.id === id);

    await storeDeleteSaving(id);

    if (savingToRemove) {
      removeSavingFromTransaction(id, savingToRemove.transaction_id);
    }
  };

  const deleteSavings = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;

    const idsSet = new Set(ids);
    const savingsToRemove = allSavings.filter((saving) => idsSet.has(saving.id));

    await storeDeleteSavings(ids);

    if (savingsToRemove.length > 0) {
      removeSavingsFromTransactions(savingsToRemove);
    }
  };

  const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);

  return {
    savings,
    loading,
    error,
    totalSaved,
    addSaving,
    addSavings,
    deleteSaving,
    deleteSavings,
    refetch: fetchSavings,
  };
}
