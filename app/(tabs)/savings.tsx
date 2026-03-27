import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
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
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CURRENCY, DATE_FORMAT } from "@/constants";
import { useSavings } from "@/hooks/useSavings";
import { useTransactions } from "@/hooks/useTransactions";
import type { AddSavingInput, Saving, Transaction } from "@/types";

function SavingHistoryItem({
  saving,
  onDelete,
}: {
  saving: Saving;
  onDelete: () => void;
}) {
  return (
    <View className="bg-slate-900 border border-slate-800 rounded-xl p-4 gap-2.5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-9 h-9 rounded-xl bg-emerald-900/60 border border-emerald-700/50 items-center justify-center flex-shrink-0">
            <Ionicons name="wallet-outline" size={16} color="#34d399" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text
              className="text-white text-sm font-semibold"
              numberOfLines={1}
            >
              {saving.transaction?.description ?? "Transaction"}
            </Text>
            <Text className="text-slate-500 text-xs">
              {format(new Date(saving.saved_date), DATE_FORMAT)}
            </Text>
            {saving.notes ? (
              <Text className="text-slate-400 text-xs italic" numberOfLines={1}>
                {saving.notes}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="items-end gap-1">
          <Text className="text-emerald-400 font-bold text-base">
            +{CURRENCY}
            {saving.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          <Pressable
            onPress={onDelete}
            className="flex-row items-center gap-1 px-2 py-1 rounded-lg active:bg-red-900/30"
          >
            <Ionicons name="trash-outline" size={12} color="#f87171" />
            <Text className="text-red-400 text-xs">Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function SavingsScreen() {
  const { savings, loading, totalSaved, deleteSaving, addSaving, refetch } =
    useSavings();
  const { transactions, refetch: refetchTransactions } = useTransactions();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Saving | null>(null);
  const [deleting, setDeleting] = useState(false);

  const unsavedTransactions = transactions.filter((t) => !t.is_fully_saved);
  const fullyPaidTransactions = transactions.filter((t) => t.is_fully_saved);

  const handleAddSaving = async (data: AddSavingInput) => {
    await addSaving(data);
    await refetch();
    refetchTransactions();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteSaving(deleteTarget.id);
      await refetch();
      refetchTransactions();
      setDeleteTarget(null);
    } catch {
      // error handled in hook
    } finally {
      setDeleting(false);
    }
  };

  const openSavingSheet = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setShowAddSheet(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        <View className="px-5 pt-4 pb-3">
          <Text className="text-white text-2xl font-bold">Natabi Tracker</Text>
          <Text className="text-slate-400 text-sm mt-0.5">
            Track money you've set aside for each transaction
          </Text>
        </View>

        <View className="px-5 pb-4">
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-row gap-4">
            <View className="flex-1 items-center gap-1">
              <View className="w-10 h-10 bg-emerald-900/50 rounded-xl border border-emerald-700/50 items-center justify-center">
                <Ionicons name="checkmark-circle" size={20} color="#34d399" />
              </View>
              <Text className="text-emerald-400 text-lg font-bold">
                {fullyPaidTransactions.length}
              </Text>
              <Text className="text-slate-500 text-xs text-center">
                Fully Natabi
              </Text>
            </View>
            <View className="w-px bg-slate-800" />
            <View className="flex-1 items-center gap-1">
              <View className="w-10 h-10 bg-amber-900/50 rounded-xl border border-amber-700/50 items-center justify-center">
                <Ionicons name="time" size={20} color="#fbbf24" />
              </View>
              <Text className="text-amber-400 text-lg font-bold">
                {unsavedTransactions.length}
              </Text>
              <Text className="text-slate-500 text-xs text-center">
                In Progress
              </Text>
            </View>
            <View className="w-px bg-slate-800" />
            <View className="flex-1 items-center gap-1">
              <View className="w-10 h-10 bg-indigo-900/50 rounded-xl border border-indigo-700/50 items-center justify-center">
                <Ionicons name="wallet" size={20} color="#818cf8" />
              </View>
              <Text className="text-indigo-400 text-lg font-bold">
                {CURRENCY}
                {totalSaved.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
              </Text>
              <Text className="text-slate-500 text-xs text-center">
                Total Saved
              </Text>
            </View>
          </View>
        </View>

        {unsavedTransactions.length > 0 && (
          <View className="px-5 pb-3">
            <Text className="text-white text-sm font-bold mb-2">
              Still Need to Set Aside
            </Text>
            <FlatList
              horizontal
              data={unsavedTransactions}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => openSavingSheet(item)}
                  className="bg-slate-900 border border-amber-700/40 rounded-xl p-3 w-44 gap-1.5 active:bg-slate-800"
                >
                  <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text className="text-slate-500 text-xs">
                    {item.credit_card?.bank}
                  </Text>
                  <View className="gap-0.5">
                    <Text className="text-amber-400 text-sm font-bold">
                      {CURRENCY}
                      {(item.remaining ?? item.amount).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    <Text className="text-slate-600 text-xs">remaining</Text>
                  </View>
                  <View className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((item.total_saved ?? 0) / item.amount) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </View>
                  <View className="flex-row items-center justify-center gap-1 mt-1">
                    <Ionicons name="add-circle-outline" size={14} color="#6366f1" />
                    <Text className="text-indigo-400 text-xs font-semibold">
                      Natabi
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        <View className="px-5 pb-2 flex-row items-center justify-between">
          <Text className="text-white text-sm font-bold">Savings History</Text>
          <Pressable
            onPress={() => {
              setSelectedTransaction(null);
              setShowAddSheet(true);
            }}
            className="flex-row items-center gap-1 bg-indigo-600 px-3 py-1.5 rounded-xl active:bg-indigo-700"
          >
            <Ionicons name="add" size={14} color="white" />
            <Text className="text-white text-xs font-semibold">Record</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : savings.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="No savings recorded yet"
            description={"Tap \"Record\" or tap on a transaction to start recording money you've set aside."}
          />
        ) : (
          <FlatList
            data={savings}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-6 gap-3"
            renderItem={({ item }) => (
              <SavingHistoryItem
                saving={item}
                onDelete={() => setDeleteTarget(item)}
              />
            )}
          />
        )}
      </View>

      <AddSavingSheet
        visible={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setSelectedTransaction(null);
        }}
        onAdd={handleAddSaving}
        transaction={
          selectedTransaction ??
          (unsavedTransactions.length > 0 ? unsavedTransactions[0] : null)
        }
      />

      <ConfirmModal
        visible={deleteTarget !== null}
        title="Remove Saving"
        message="Remove this saving record? This will update the remaining amount for the transaction."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}
