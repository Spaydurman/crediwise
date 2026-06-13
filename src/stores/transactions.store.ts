import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "./auth.store";
import type {
  AddTransactionInput,
  InstallmentPayment,
  Saving,
  Transaction,
} from "../types";

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

function enrichTransaction(transaction: Transaction): Transaction {
  return enrichTransactions([transaction])[0];
}

function createLocalInstallmentPayment(
  transactionId: string,
  userId: string,
  periodKey: string
): InstallmentPayment {
  return {
    id: `local-${transactionId}-${periodKey}`,
    transaction_id: transactionId,
    user_id: userId,
    period_key: periodKey,
    created_at: new Date().toISOString(),
  };
}

function upsertInstallmentPayment(
  payments: InstallmentPayment[] | undefined,
  payment: InstallmentPayment
) {
  const currentPayments = payments ?? [];

  if (currentPayments.some((item) => item.period_key === payment.period_key)) {
    return currentPayments;
  }

  return [...currentPayments, payment];
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
  addSavingsToTransactions: (savings: Saving[]) => void;
  removeSavingFromTransaction: (savingId: string, transactionId: string) => void;
  togglePaid: (id: string, isPaid: boolean) => Promise<void>;
  setSubscriptionActive: (id: string, active: boolean) => Promise<void>;
  toggleInstallmentPeriodPaid: (transactionId: string, periodKey: string, paid: boolean) => Promise<void>;
  markGroupPaid: (regularIds: string[], installmentItems: { transactionId: string; periodKey: string }[]) => Promise<void>;
  reset: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
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

  addSavingsToTransactions: (savings) => {
    if (savings.length === 0) return;

    const savingsByTransactionId = new Map<string, Saving[]>();

    for (const saving of savings) {
      const existingSavings = savingsByTransactionId.get(saving.transaction_id) ?? [];
      savingsByTransactionId.set(saving.transaction_id, [...existingSavings, saving]);
    }

    set((state) => {
      let didUpdate = false;
      const transactions = state.transactions.map((transaction) => {
        const transactionSavings = savingsByTransactionId.get(transaction.id);
        if (!transactionSavings || transactionSavings.length === 0) {
          return transaction;
        }

        didUpdate = true;

        return enrichTransaction({
          ...transaction,
          savings: [...(transaction.savings ?? []), ...transactionSavings],
        });
      });

      return didUpdate ? { transactions } : {};
    });
  },

  removeSavingFromTransaction: (savingId, transactionId) => {
    set((state) => ({
      transactions: state.transactions.map((transaction) => {
        if (transaction.id !== transactionId) {
          return transaction;
        }

        return enrichTransaction({
          ...transaction,
          savings: (transaction.savings ?? []).filter((saving) => saving.id !== savingId),
        });
      }),
    }));
  },

  togglePaid: async (id, isPaid) => {
    const previousTransaction = get().transactions.find((transaction) => transaction.id === id);

    if (previousTransaction) {
      set((state) => ({
        transactions: state.transactions.map((transaction) =>
          transaction.id === id
            ? enrichTransaction({
                ...transaction,
                is_paid: isPaid,
              })
            : transaction
        ),
      }));
    }

    const { error } = await supabase
      .from("transactions")
      .update({ is_paid: isPaid })
      .eq("id", id);

    if (error) {
      if (previousTransaction) {
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? previousTransaction : transaction
          ),
        }));
      }

      throw error;
    }
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

    const previousTransaction = get().transactions.find(
      (transaction) => transaction.id === transactionId
    );

    if (previousTransaction) {
      const localPayment = createLocalInstallmentPayment(
        transactionId,
        user.id,
        periodKey
      );

      set((state) => ({
        transactions: state.transactions.map((transaction) => {
          if (transaction.id !== transactionId) {
            return transaction;
          }

          return enrichTransaction({
            ...transaction,
            installment_payments: paid
              ? upsertInstallmentPayment(transaction.installment_payments, localPayment)
              : (transaction.installment_payments ?? []).filter(
                  (payment) => payment.period_key !== periodKey
                ),
          });
        }),
      }));
    }

    try {
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
    } catch (error) {
      if (previousTransaction) {
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === transactionId ? previousTransaction : transaction
          ),
        }));
      }

      throw error;
    }
  },

  markGroupPaid: async (regularIds, installmentItems) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const regularIdSet = new Set(regularIds);
    const installmentPeriodsByTransactionId = new Map<string, string[]>();

    for (const item of installmentItems) {
      const periods = installmentPeriodsByTransactionId.get(item.transactionId) ?? [];
      installmentPeriodsByTransactionId.set(item.transactionId, [...periods, item.periodKey]);
    }

    const allIds = Array.from(
      new Set([
        ...regularIds,
        ...installmentItems.map((item) => item.transactionId),
      ])
    );

    const previousTransactions = new Map(
      get()
        .transactions
        .filter((transaction) => allIds.includes(transaction.id))
        .map((transaction) => [transaction.id, transaction] as const)
    );

    if (previousTransactions.size > 0) {
      set((state) => ({
        transactions: state.transactions.map((transaction) => {
          const periodKeys = installmentPeriodsByTransactionId.get(transaction.id) ?? [];
          const isRegularMatch = regularIdSet.has(transaction.id);

          if (!isRegularMatch && periodKeys.length === 0) {
            return transaction;
          }

          let installmentPayments = transaction.installment_payments;
          if (periodKeys.length > 0) {
            installmentPayments = periodKeys.reduce<InstallmentPayment[] | undefined>(
              (payments, periodKey) =>
                upsertInstallmentPayment(
                  payments,
                  createLocalInstallmentPayment(transaction.id, user.id, periodKey)
                ),
              transaction.installment_payments
            );
          }

          return enrichTransaction({
            ...transaction,
            is_paid: isRegularMatch ? true : transaction.is_paid,
            installment_payments: installmentPayments,
          });
        }),
      }));
    }

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

    try {
      await Promise.all(promises);
    } catch (error) {
      if (previousTransactions.size > 0) {
        set((state) => ({
          transactions: state.transactions.map(
            (transaction) => previousTransactions.get(transaction.id) ?? transaction
          ),
        }));
      }

      throw error;
    }
  },

  reset: () => set({ transactions: [], loading: true, error: null }),
}));
