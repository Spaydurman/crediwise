import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddCardSheet } from "@/components/cards/AddCardSheet";
import { EditCardSheet } from "@/components/cards/EditCardSheet";
import { CreditCardVisual } from "@/components/cards/CreditCardVisual";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CURRENCY } from "@/constants";
import { useCards } from "@/hooks/useCards";
import { useTransactions } from "@/hooks/useTransactions";
import { useThemeStore } from "@/stores/theme.store";
import type { CreditCard } from "@/types";

export default function CardsScreen() {
  const isDark = useThemeStore((state) => state.themeMode === "dark");
  const { cards, loading, addCard, updateCard, deleteCard } = useCards();
  const { transactions } = useTransactions();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editCard, setEditCard] = useState<CreditCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreditCard | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getCardSpending = (cardId: string) =>
    transactions
      .filter((t) => t.card_id === cardId)
      .reduce((sum, t) => {
        if (t.is_installment && t.monthly_amount && t.installment_months) {
          const paidPeriods = t.paid_periods_count ?? 0;
          const unpaidPeriods = Math.max(0, t.installment_months - paidPeriods);
          return sum + t.monthly_amount * unpaidPeriods;
        }
        if (t.is_paid) return sum;
        return sum + t.amount;
      }, 0);

  const getCardSaved = (cardId: string) =>
    transactions
      .filter((t) => t.card_id === cardId)
      .reduce((sum, t) => {
        if (t.is_installment && (t.paid_periods_count ?? 0) >= (t.installment_months ?? 0))
          return sum;
        return sum + (t.total_saved ?? 0);
      }, 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteCard(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error handled in hook
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <Text className="text-slate-950 dark:text-white text-2xl font-bold">My Cards</Text>
          <Pressable
            onPress={() => setShowAddSheet(true)}
            className="flex-row items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-xl active:bg-indigo-100 dark:bg-indigo-600 dark:border-indigo-500 dark:active:bg-indigo-700"
          >
            <Ionicons name="add" size={18} color={isDark ? "white" : "#4338ca"} />
            <Text className="text-indigo-700 dark:text-white text-sm font-semibold">Add Card</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : cards.length === 0 ? (
          <EmptyState
            icon="card-outline"
            title="No credit cards yet"
            description="Add your first credit card to start tracking your spending and savings."
          />
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-6 gap-5"
          >
            {cards.map((card) => {
              const spending = getCardSpending(card.id);
              const saved = getCardSaved(card.id);
              const remaining = Math.max(0, spending - saved);
              const txnCount = transactions.filter(
                (t) => t.card_id === card.id
              ).length;

              return (
                <View key={card.id} className="gap-3">
                  <CreditCardVisual card={card} totalSpending={spending} />

                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-white border border-slate-200 rounded-xl p-3 gap-0.5 dark:bg-slate-900 dark:border-slate-800">
                      <Text className="text-slate-500 text-xs">Saved</Text>
                      <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                        {CURRENCY}
                        {saved.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                    <View className="flex-1 bg-white border border-slate-200 rounded-xl p-3 gap-0.5 dark:bg-slate-900 dark:border-slate-800">
                      <Text className="text-slate-500 text-xs">Shortage</Text>
                      <Text className="text-amber-700 dark:text-amber-400 text-sm font-bold">
                        {CURRENCY}
                        {remaining.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                    <View className="flex-1 bg-white border border-slate-200 rounded-xl p-3 gap-0.5 dark:bg-slate-900 dark:border-slate-800">
                      <Text className="text-slate-500 text-xs">Transactions</Text>
                      <Text className="text-slate-950 dark:text-white text-sm font-bold">
                        {txnCount}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => setEditCard(card)}
                      className="flex-1 flex-row items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-2.5 active:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:active:bg-slate-700"
                    >
                      <Ionicons name="pencil-outline" size={16} color={isDark ? "#818cf8" : "#4338ca"} />
                      <Text className="text-indigo-700 dark:text-indigo-400 text-sm font-semibold">
                        Edit
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setDeleteTarget(card)}
                      className="flex-1 flex-row items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-xl py-2.5 active:bg-red-100 dark:bg-red-950/40 dark:border-red-900/50 dark:active:bg-red-900/50"
                    >
                      <Ionicons name="trash-outline" size={16} color={isDark ? "#f87171" : "#dc2626"} />
                      <Text className="text-red-700 dark:text-red-400 text-sm font-semibold">
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <AddCardSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onAdd={addCard}
      />

      <EditCardSheet
        card={editCard}
        visible={editCard !== null}
        onClose={() => setEditCard(null)}
        onUpdate={updateCard}
      />

      <ConfirmModal
        visible={deleteTarget !== null}
        title="Delete Card"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All transactions and savings for this card will also be deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}
