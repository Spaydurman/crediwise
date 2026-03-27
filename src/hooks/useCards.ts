import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth.store";
import type { AddCardInput, CreditCard } from "../types";

export function useCards() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setCards(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const addCard = async (input: AddCardInput): Promise<CreditCard> => {
    if (!user) throw new Error("Not authenticated");

    const { data, error: insertError } = await supabase
      .from("credit_cards")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (insertError) throw insertError;
    setCards((prev) => [...prev, data]);
    return data;
  };

  const updateCard = async (
    id: string,
    updates: Partial<AddCardInput>
  ): Promise<CreditCard> => {
    const { data, error: updateError } = await supabase
      .from("credit_cards")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    setCards((prev) => prev.map((c) => (c.id === id ? data : c)));
    return data;
  };

  const deleteCard = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from("credit_cards")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    cards,
    loading,
    error,
    addCard,
    updateCard,
    deleteCard,
    refetch: fetchCards,
  };
}
