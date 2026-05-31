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
    const paid_periods_count = t.installment_payments?.length ?? 0;
    return {
      ...t,
      total_saved: totalSaved,
      remaining,
      is_fully_saved: remaining === 0,
      paid_periods_count,
    };
  });
}

const TRANSACTION_SELECT = `
  *,
  credit_card:credit_cards(name, bank, color, last_four_digits),
  savings(id, amount, notes, saved_date, created_at),
  installment_payments(id, period_key, created_at)
`;

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (input: AddTransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  togglePaid: (id: string, isPaid: boolean) => Promise<void>;
  setSubscriptionActive: (id: string, active: boolean) => Promise<void>;
  toggleInstallmentPeriodPaid: (transactionId: string, periodKey: string, paid: boolean) => Promise<void>;
  markGroupPaid: (regularIds: string[], installmentItems: { transactionId: string; periodKey: string }[]) => Promise<void>;
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

  setSubscriptionActive: async (id, active) => {
    const inactiveAt = active ? null : new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("transactions")
      .update({
        subscription_active: active,
        subscription_inactive_at: inactiveAt,
      })
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

  toggleInstallmentPeriodPaid: async (transactionId, periodKey, paid) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    if (paid) {
      const { error } = await supabase
        .from("installment_payments")
        .insert({ transaction_id: transactionId, user_id: user.id, period_key: periodKey });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("installment_payments")
        .delete()
        .eq("transaction_id", transactionId)
        .eq("period_key", periodKey);
      if (error) throw error;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("id", transactionId)
      .single();
    if (error) throw error;
    const enriched = enrichTransactions([data as Transaction])[0];
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === transactionId ? enriched : t)),
    }));
  },

  markGroupPaid: async (regularIds, installmentItems) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const promises: Promise<unknown>[] = [];

    if (regularIds.length > 0) {
      promises.push(
        (async () => supabase.from("transactions").update({ is_paid: true }).in("id", regularIds))()
      );
    }
    if (installmentItems.length > 0) {
      promises.push(
        (async () =>
          supabase.from("installment_payments").upsert(
            installmentItems.map((item) => ({
              transaction_id: item.transactionId,
              user_id: user.id,
              period_key: item.periodKey,
            })),
            { onConflict: "transaction_id,period_key", ignoreDuplicates: true }
          ))()
      );
    }

    await Promise.all(promises);

    const allIds = [
      ...regularIds,
      ...installmentItems.map((i) => i.transactionId),
    ];
    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .in("id", allIds);
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
