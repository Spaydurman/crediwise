import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "./auth.store";
import type { AddSavingInput, Saving } from "../types";

const SAVING_SELECT = `
  *,
  transaction:transactions(description, amount)
`;

interface SavingsState {
  savings: Saving[];
  loading: boolean;
  error: string | null;
  fetchSavings: () => Promise<void>;
  addSaving: (input: AddSavingInput) => Promise<Saving>;
  addSavings: (inputs: AddSavingInput[]) => Promise<Saving[]>;
  deleteSaving: (id: string) => Promise<void>;
  deleteSavings: (ids: string[]) => Promise<void>;
  reset: () => void;
}

export const useSavingsStore = create<SavingsState>((set) => ({
  savings: [],
  loading: true,
  error: null,

  fetchSavings: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("savings")
      .select(SAVING_SELECT)
      .eq("user_id", user.id)
      .order("saved_date", { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ savings: (data as Saving[]) ?? [], loading: false });
    }
  },

  addSaving: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("savings")
      .insert({ ...input, user_id: user.id })
      .select(SAVING_SELECT)
      .single();

    if (error) throw error;
    set((state) => ({ savings: [data as Saving, ...state.savings] }));
    return data as Saving;
  },

  addSavings: async (inputs) => {
    if (inputs.length === 0) return [];

    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("savings")
      .insert(inputs.map((input) => ({ ...input, user_id: user.id })))
      .select(SAVING_SELECT);

    if (error) throw error;

    const createdSavings = (data as Saving[]) ?? [];
    set((state) => ({ savings: [...createdSavings, ...state.savings] }));
    return createdSavings;
  },

  deleteSaving: async (id) => {
    const { error } = await supabase
      .from("savings")
      .delete()
      .eq("id", id);

    if (error) throw error;
    set((state) => ({
      savings: state.savings.filter((s) => s.id !== id),
    }));
  },

  deleteSavings: async (ids) => {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from("savings")
      .delete()
      .in("id", ids);

    if (error) throw error;

    const idsSet = new Set(ids);
    set((state) => ({
      savings: state.savings.filter((saving) => !idsSet.has(saving.id)),
    }));
  },

  reset: () => set({ savings: [], loading: true, error: null }),
}));
