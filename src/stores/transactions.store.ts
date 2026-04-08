import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "./auth.store";
import type { AddTransactionInput, Transaction } from "../types";

function enrichTransactions(raw: Transaction[]): Transaction[] {
  return raw.map((t) => {
    const totalSaved = t.savings?.reduce((sum, s) => sum + s.amount, 0) ?? 0;
    // For installment transactions, track against monthly_amount; otherwise full amount
    const trackableAmount =
      t.is_installment && t.monthly_amount ? t.monthly_amount : t.amount;
    const remaining = Math.max(0, trackableAmount - totalSaved);
    return {
      ...t,
      total_saved: totalSaved,
      remaining,
      is_fully_saved: remaining === 0,
    };
  });
}

const TRANSACTION_SELECT = `
  *,
  credit_card:credit_cards(name, bank, color, last_four_digits),
  savings(id, amount, notes, saved_date, created_at)
`;

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (input: AddTransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  togglePaid: (id: string, isPaid: boolean) => Promise<void>;
  markAllPaid: (ids: string[]) => Promise<void>;
  reset: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: [],
  loading: true,
  error: null,

  fetchTransactions: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({
        transactions: enrichTransactions((data as Transaction[]) ?? []),
        loading: false,
      });
    }
  },

  addTransaction: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...input, user_id: user.id })
      .select(TRANSACTION_SELECT)
      .single();

    if (error) throw error;
    const enriched = enrichTransactions([data as Transaction])[0];
    set((state) => ({ transactions: [enriched, ...state.transactions] }));
    return enriched;
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  togglePaid: async (id, isPaid) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({ is_paid: isPaid })
      .eq("id", id)
      .select(TRANSACTION_SELECT)
      .single();

    if (error) throw error;
    const enriched = enrichTransactions([data as Transaction])[0];
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? enriched : t
      ),
    }));
  },

  markAllPaid: async (ids) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({ is_paid: true })
      .in("id", ids)
      .select(TRANSACTION_SELECT);

    if (error) throw error;
    const enriched = enrichTransactions((data as Transaction[]) ?? []);
    set((state) => ({
      transactions: state.transactions.map(
        (t) => enriched.find((e) => e.id === t.id) ?? t
      ),
    }));
  },

  reset: () => set({ transactions: [], loading: true, error: null }),
}));
