import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth.store";
import type { AddTransactionInput, Transaction } from "../types";

function enrichTransactions(raw: Transaction[]): Transaction[] {
  return raw.map((t) => {
    const totalSaved =
      t.savings?.reduce((sum, s) => sum + s.amount, 0) ?? 0;
    const remaining = Math.max(0, t.amount - totalSaved);
    return {
      ...t,
      total_saved: totalSaved,
      remaining,
      is_fully_saved: remaining === 0,
    };
  });
}

export function useTransactions(cardId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        credit_card:credit_cards(name, bank, color, last_four_digits),
        savings(id, amount, notes, saved_date, created_at)
      `
      )
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });

    if (cardId) {
      query = query.eq("card_id", cardId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTransactions(enrichTransactions((data as Transaction[]) ?? []));
    }
    setLoading(false);
  }, [user, cardId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (
    input: AddTransactionInput
  ): Promise<Transaction> => {
    if (!user) throw new Error("Not authenticated");

    const { data, error: insertError } = await supabase
      .from("transactions")
      .insert({ ...input, user_id: user.id })
      .select(
        `
        *,
        credit_card:credit_cards(name, bank, color, last_four_digits),
        savings(id, amount, notes, saved_date, created_at)
      `
      )
      .single();

    if (insertError) throw insertError;
    const enriched = enrichTransactions([data as Transaction])[0];
    setTransactions((prev) => [enriched, ...prev]);
    return enriched;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

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
    refetch: fetchTransactions,
  };
}
