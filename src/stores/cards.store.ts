import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "./auth.store";
import type { AddCardInput, CreditCard } from "../types";

interface CardsState {
  cards: CreditCard[];
  loading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  addCard: (input: AddCardInput) => Promise<CreditCard>;
  updateCard: (id: string, updates: Partial<AddCardInput>) => Promise<CreditCard>;
  deleteCard: (id: string) => Promise<void>;
  reset: () => void;
}

export const useCardsStore = create<CardsState>((set, get) => ({
  cards: [],
  loading: true,
  error: null,

  fetchCards: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ cards: data ?? [], loading: false });
    }
  },

  addCard: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("credit_cards")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ cards: [...state.cards, data] }));
    return data;
  },

  updateCard: async (id, updates) => {
    const { data, error } = await supabase
      .from("credit_cards")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? data : c)),
    }));
    return data;
  },

  deleteCard: async (id) => {
    const { error } = await supabase
      .from("credit_cards")
      .delete()
      .eq("id", id);

    if (error) throw error;
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
  },

  reset: () => set({ cards: [], loading: true, error: null }),
}));
