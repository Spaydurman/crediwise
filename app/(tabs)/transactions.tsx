import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddSavingSheet } from "@/components/savings/AddSavingSheet";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CARD_COLOR_BG_MAP, CURRENCY } from "@/constants";
import { useCards } from "@/hooks/useCards";
import { useSavings } from "@/hooks/useSavings";
import { useTransactions } from "@/hooks/useTransactions";
import type { AddSavingInput, AddTransactionInput, Transaction } from "@/types";

export default function TransactionsScreen() {
  const { cards } = useCards();
  const {
    transactions,
    loading,
    totalSpending,
    totalSaved,
    totalRemaining,
    addTransaction,
    deleteTransaction,
    togglePaid,
  } = useTransactions();
  const { addSaving } = useSavings();

  const [selectedCardFilter, setSelectedCardFilter] = useState<string | null>(null);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [savingTarget, setSavingTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredTransactions = selectedCardFilter
    ? transactions.filter((t) => t.card_id === selectedCardFilter)
    : transactions;

  const handleAddSaving = async (data: AddSavingInput) => {
    await addSaving(data);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error handled in hook
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Transactions</Text>
          <Pressable
            onPress={() => setShowAddTxn(true)}
            className="flex-row items-center gap-2 bg-indigo-600 px-4 py-2.5 rounded-xl active:bg-indigo-700"
          >
            <Ionicons name="add" size={18} color="white" />
            <Text className="text-white text-sm font-semibold">Add</Text>
          </Pressable>
        </View>

        <View className="px-5 pb-3">
          <View className="flex-row gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Spent</Text>
              <Text className="text-white text-sm font-bold">
                {CURRENCY}
                {totalSpending.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="w-px bg-slate-800" />
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Saved</Text>
              <Text className="text-emerald-400 text-sm font-bold">
                {CURRENCY}
                {totalSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="w-px bg-slate-800" />
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Shortage</Text>
              <Text className="text-amber-400 text-sm font-bold">
                {CURRENCY}
                {totalRemaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {cards.length > 0 && (
          <View className="mb-3">
            <FlatList
              horizontal
              data={[{ id: null, name: "All Cards", bank: "", color: "indigo" as const }, ...cards]}
              keyExtractor={(item) => item.id ?? "all"}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 px-5"
              renderItem={({ item }) => {
                const isSelected = selectedCardFilter === item.id;
                const colorClass = item.id
                  ? CARD_COLOR_BG_MAP[item.color]
                  : "bg-indigo-600";

                return (
                  <Pressable
                    onPress={() => setSelectedCardFilter(item.id ?? null)}
                    className={`
                      flex-row items-center gap-2 px-3 py-2 rounded-xl border
                      ${isSelected
                        ? "bg-indigo-600/20 border-indigo-600"
                        : "bg-slate-900 border-slate-800"
                      }
                    `}
                  >
                    {item.id && (
                      <View className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                    )}
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? "text-indigo-400" : "text-slate-400"
                      }`}
                    >
                      {item.id ? item.bank : "All Cards"}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No transactions yet"
            description="Add your first credit card transaction to start tracking your savings progress."
          />
        ) : (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-6 gap-3"
            renderItem={({ item }) => (
              <TransactionItem
                transaction={item}
                onPress={() => setSavingTarget(item)}
                onDelete={() => setDeleteTarget(item)}
                onTogglePaid={() => togglePaid(item.id, !item.is_paid)}
              />
            )}
          />
        )}
      </View>

      <AddTransactionSheet
        visible={showAddTxn}
        onClose={() => setShowAddTxn(false)}
        onAdd={async (data: AddTransactionInput) => {
          await addTransaction(data);
        }}
        cards={cards}
      />

      <AddSavingSheet
        visible={savingTarget !== null}
        onClose={() => setSavingTarget(null)}
        onAdd={handleAddSaving}
        transaction={savingTarget}
      />

      <ConfirmModal
        visible={deleteTarget !== null}
        title="Delete Transaction"
        message={`Delete "${deleteTarget?.description}"? All savings recorded for this transaction will also be deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}
