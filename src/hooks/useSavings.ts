import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth.store";
import type { AddSavingInput, Saving } from "../types";

export function useSavings(transactionId?: string) {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchSavings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from("savings")
      .select(
        `
        *,
        transaction:transactions(description, amount)
      `
      )
      .eq("user_id", user.id)
      .order("saved_date", { ascending: false });

    if (transactionId) {
      query = query.eq("transaction_id", transactionId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setSavings((data as Saving[]) ?? []);
    }
    setLoading(false);
  }, [user, transactionId]);

  useEffect(() => {
    fetchSavings();
  }, [fetchSavings]);

  const addSaving = async (input: AddSavingInput): Promise<Saving> => {
    if (!user) throw new Error("Not authenticated");

    const { data, error: insertError } = await supabase
      .from("savings")
      .insert({ ...input, user_id: user.id })
      .select(
        `
        *,
        transaction:transactions(description, amount)
      `
      )
      .single();

    if (insertError) throw insertError;
    setSavings((prev) => [data as Saving, ...prev]);
    return data as Saving;
  };

  const deleteSaving = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from("savings")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
    setSavings((prev) => prev.filter((s) => s.id !== id));
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
