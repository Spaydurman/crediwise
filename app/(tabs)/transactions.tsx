import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddSavingSheet } from "@/components/savings/AddSavingSheet";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CARD_COLOR_BG_MAP, CURRENCY, DATE_FORMAT } from "@/constants";
import { useCards } from "@/hooks/useCards";
import { useSavings } from "@/hooks/useSavings";
import { useTransactions } from "@/hooks/useTransactions";
import { getBillingPeriod } from "@/lib/billing";
import type { AddSavingInput, AddTransactionInput, CreditCard, Transaction } from "@/types";

interface BillingGroup {
  key: string;
  card: CreditCard;
  statementDate: Date;
  billingDate: Date;
  isOverdue: boolean;
  isDueSoon: boolean;
  transactions: Transaction[];
}

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
    markAllPaid,
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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const billingGroups = useMemo<BillingGroup[]>(() => {
    const cardMap = new Map(cards.map((c) => [c.id, c]));
    const groupMap = new Map<string, BillingGroup>();

    const addToGroup = (
      txn: (typeof filteredTransactions)[0],
      card: (typeof cards)[0],
      statementDate: Date,
      billingDate: Date,
      periodKey: string
    ) => {
      const groupKey = `${card.id}-${periodKey}`;
      if (!groupMap.has(groupKey)) {
        const billMs = billingDate.getTime();
        const todayMs = today.getTime();
        groupMap.set(groupKey, {
          key: groupKey,
          card,
          statementDate,
          billingDate,
          isOverdue: billMs < todayMs,
          isDueSoon: billMs >= todayMs && billMs <= todayMs + 7 * 86_400_000,
          transactions: [],
        });
      }
      groupMap.get(groupKey)!.transactions.push(txn);
    };

    for (const txn of filteredTransactions) {
      const card = cardMap.get(txn.card_id);
      if (!card) continue;

      // Fall back to billing_cycle_date - 5 if no statement_date set
      const statDay =
        card.statement_date ??
        Math.max(1, Math.min(28, card.billing_cycle_date - 5));
      const billDay = card.billing_cycle_date;
      const txDate = new Date(txn.transaction_date);

      if (txn.is_installment && txn.installment_months && txn.monthly_amount) {
        // Fan out one entry per installment month; stop at future statement periods
        let currentDate = txDate;
        for (let i = 0; i < txn.installment_months; i++) {
          const { statementDate, billingDate, periodKey } = getBillingPeriod(
            currentDate,
            statDay,
            billDay
          );
          // Skip periods whose statement hasn't closed yet
          if (statementDate > today) break;
          addToGroup(txn, card, statementDate, billingDate, periodKey);
          // Advance to the next billing period
          currentDate = new Date(
            statementDate.getFullYear(),
            statementDate.getMonth(),
            statementDate.getDate() + 1
          );
        }
      } else {
        const { statementDate, billingDate, periodKey } = getBillingPeriod(
          txDate,
          statDay,
          billDay
        );
        addToGroup(txn, card, statementDate, billingDate, periodKey);
      }
    }

    // Overdue first, then by billing date descending
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.billingDate.getTime() - a.billingDate.getTime();
    });
  }, [filteredTransactions, cards, today]);

  const overdueGroups = billingGroups.filter((g) => g.isOverdue);
  const dueSoonGroups = billingGroups.filter((g) => g.isDueSoon);

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
        {/* Header */}
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

        {/* Summary bar */}
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

        {/* Notification banners */}
        {overdueGroups.length > 0 && (
          <View className="mx-5 mb-2 bg-red-950 border border-red-700 rounded-xl p-3 flex-row items-center gap-3">
            <Ionicons name="alert-circle" size={18} color="#f87171" />
            <Text className="text-red-400 text-sm font-medium flex-1">
              {overdueGroups.length} billing period
              {overdueGroups.length > 1 ? "s are" : " is"} overdue — payment
              required!
            </Text>
          </View>
        )}
        {dueSoonGroups.length > 0 && (
          <View className="mx-5 mb-2 bg-amber-950 border border-amber-700 rounded-xl p-3 flex-row items-center gap-3">
            <Ionicons name="warning" size={18} color="#fbbf24" />
            <Text className="text-amber-400 text-sm font-medium flex-1">
              {dueSoonGroups.length} billing period
              {dueSoonGroups.length > 1 ? "s are" : " is"} due within 7 days
            </Text>
          </View>
        )}

        {/* Card filter tabs */}
        {cards.length > 0 && (
          <View className="mb-3">
            <FlatList
              horizontal
              data={[
                { id: null, name: "All Cards", bank: "", color: "indigo" as const },
                ...cards,
              ]}
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
                    className={`flex-row items-center gap-2 px-3 py-2 rounded-xl border ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-600"
                        : "bg-slate-900 border-slate-800"
                    }`}
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

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : billingGroups.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No transactions yet"
            description="Add your first credit card transaction to start tracking your savings progress."
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-6 gap-4"
          >
            {billingGroups.map((group) => {
              const statementTotal = group.transactions.reduce(
                (sum, t) => sum + (t.is_installment && t.monthly_amount ? t.monthly_amount : t.amount),
                0
              );
              const unpaidIds = group.transactions.filter((t) => !t.is_paid).map((t) => t.id);
              return (
                <View key={group.key} className="gap-2">
                  {/* Billing period section header */}
                  <View
                    className={`rounded-xl border px-4 py-3 gap-3 ${
                      group.isOverdue
                        ? "border-red-600 bg-red-950/30"
                        : group.isDueSoon
                        ? "border-amber-600 bg-amber-950/30"
                        : "border-slate-700 bg-slate-900/60"
                    }`}
                  >
                    {/* Top row: card info + status badge */}
                    <View className="flex-row items-center justify-between">
                      <View className="gap-0.5 flex-1 mr-2">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`w-2 h-2 rounded-full ${CARD_COLOR_BG_MAP[group.card.color]}`}
                          />
                          <Text className="text-white text-sm font-semibold">
                            {group.card.bank} — {group.card.name}
                          </Text>
                        </View>
                        <Text className="text-slate-400 text-xs">
                          Statement closes:{" "}
                          {format(group.statementDate, DATE_FORMAT)}
                        </Text>
                        <Text
                          className={`text-xs font-medium ${
                            group.isOverdue
                              ? "text-red-400"
                              : group.isDueSoon
                              ? "text-amber-400"
                              : "text-slate-400"
                          }`}
                        >
                          Due: {format(group.billingDate, DATE_FORMAT)}
                        </Text>
                        <Text className="text-slate-500 text-xs">
                          {group.transactions.length} transaction
                          {group.transactions.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                      {group.isOverdue && (
                        <View className="bg-red-500/20 border border-red-500 rounded-lg px-2 py-1">
                          <Text className="text-red-400 text-xs font-bold">
                            OVERDUE
                          </Text>
                        </View>
                      )}
                      {group.isDueSoon && !group.isOverdue && (
                        <View className="bg-amber-500/20 border border-amber-500 rounded-lg px-2 py-1">
                          <Text className="text-amber-400 text-xs font-bold">
                            DUE SOON
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Divider */}
                    <View className="h-px bg-slate-700/60" />

                    {/* Bottom row: statement total + Pay All */}
                    <View className="flex-row items-center justify-between">
                      <View className="gap-0.5">
                        <Text className="text-slate-500 text-xs">Statement Total</Text>
                        <Text className="text-white text-sm font-bold">
                          {CURRENCY}{statementTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                      {unpaidIds.length > 0 ? (
                        <Pressable
                          onPress={() => markAllPaid(unpaidIds)}
                          className="flex-row items-center gap-1.5 bg-emerald-700 border border-emerald-600 rounded-xl px-3 py-2 active:bg-emerald-800"
                        >
                          <Ionicons name="checkmark-done" size={15} color="white" />
                          <Text className="text-white text-xs font-semibold">Pay All</Text>
                        </Pressable>
                      ) : (
                        <View className="flex-row items-center gap-1.5 bg-emerald-950/50 border border-emerald-700 rounded-xl px-3 py-2">
                          <Ionicons name="checkmark-done" size={15} color="#34d399" />
                          <Text className="text-emerald-400 text-xs font-semibold">All Paid</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Transactions in this billing period */}
                  {group.transactions.map((txn) => (
                    <TransactionItem
                      key={txn.id}
                      transaction={txn}
                      isOverdue={group.isOverdue}
                      onPress={() => setSavingTarget(txn)}
                      onDelete={() => setDeleteTarget(txn)}
                      onTogglePaid={() => togglePaid(txn.id, !txn.is_paid)}
                    />
                  ))}
                </View>
              );
            })}
          </ScrollView>
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

