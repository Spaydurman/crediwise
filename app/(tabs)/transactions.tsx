import { Ionicons } from "@expo/vector-icons";
import { addMonths, parseISO } from "date-fns";
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
import { BillingGroupCard } from "@/components/transactions/BillingGroupCard";
import { NotificationPopup } from "@/components/transactions/NotificationPopup";
import { PaidStatementsSection } from "@/components/transactions/PaidStatementsSection";
import type { BillingGroup } from "@/components/transactions/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CARD_COLOR_BG_MAP, CURRENCY } from "@/constants";
import { useCards } from "@/hooks/useCards";
import { useSavings } from "@/hooks/useSavings";
import { useTransactions } from "@/hooks/useTransactions";
import { getBillingPeriod } from "@/lib/billing";
import type { AddSavingInput, AddTransactionInput, Transaction } from "@/types";

const MAX_RECURRING_PERIODS = 240;

export default function TransactionsScreen() {
  const { cards } = useCards();
  const {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    togglePaid,
    toggleInstallmentPeriodPaid,
    markGroupPaid,
  } = useTransactions();
  const { addSaving } = useSavings();

  const [selectedCardFilter, setSelectedCardFilter] = useState<string | null>(null);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [savingTarget, setSavingTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
          periodKey,
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
      const statDay =
        card.statement_date ??
        Math.max(1, Math.min(28, card.billing_cycle_date - 5));
      const billDay = card.billing_cycle_date;
      const txDate = parseISO(txn.transaction_date);

      if (txn.is_installment && txn.installment_months && txn.monthly_amount) {
        let currentDate = txDate;
        for (let i = 0; i < txn.installment_months; i++) {
          const { statementDate, billingDate, periodKey } = getBillingPeriod(
            currentDate, statDay, billDay
          );
          if (statementDate > today) {
            addToGroup(txn, card, statementDate, billingDate, periodKey);
            break;
          }
          addToGroup(txn, card, statementDate, billingDate, periodKey);
          currentDate = new Date(
            statementDate.getFullYear(),
            statementDate.getMonth(),
            statementDate.getDate() + 1
          );
        }
      } else if (txn.is_subscription) {
        const inactiveAt = txn.subscription_inactive_at
          ? parseISO(txn.subscription_inactive_at)
          : null;
        const stopDate = inactiveAt ?? today;

        for (let i = 0; i < MAX_RECURRING_PERIODS; i++) {
          const occurrenceDate = addMonths(txDate, i);
          if (!txn.subscription_active && occurrenceDate > stopDate) {
            break;
          }

          const { statementDate, billingDate, periodKey } = getBillingPeriod(
            occurrenceDate,
            statDay,
            billDay
          );

          addToGroup(txn, card, statementDate, billingDate, periodKey);

          if (txn.subscription_active && statementDate > today) {
            break;
          }
        }
      } else {
        const { statementDate, billingDate, periodKey } = getBillingPeriod(
          txDate, statDay, billDay
        );
        addToGroup(txn, card, statementDate, billingDate, periodKey);
      }
    }

    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.billingDate.getTime() - a.billingDate.getTime();
    });
  }, [filteredTransactions, cards, today]);

  const isGroupFullyPaid = (g: BillingGroup) =>
    g.transactions.every((t) =>
      t.is_installment || t.is_subscription
        ? (t.installment_payments?.some((p) => p.period_key === g.periodKey) ?? false)
        : t.is_paid
    );

  const { activeGroups, paidStatements } = useMemo(() => {
    const active: BillingGroup[] = [];
    const paid: BillingGroup[] = [];
    for (const g of billingGroups) {
      if (isGroupFullyPaid(g)) paid.push(g);
      else active.push(g);
    }
    return { activeGroups: active, paidStatements: paid };
  }, [billingGroups]);

  const overdueGroups = activeGroups.filter((g) => g.isOverdue);
  const dueSoonGroups = activeGroups.filter((g) => g.isDueSoon);

  const { activeSpending, activeSaved, activeShortage } = useMemo(() => {
    // Spending: sum per-period amounts across all active groups (installments count monthly_amount each period)
    const spending = activeGroups.reduce(
      (sum, g) =>
        sum +
        g.transactions.reduce(
          (s, t) =>
            s + (t.is_installment && t.monthly_amount ? t.monthly_amount : t.amount),
          0
        ),
      0
    );
    // Saved/shortage: deduplicate per transaction since total_saved/remaining are per-transaction metrics
    const seenIds = new Set<string>();
    let saved = 0;
    let shortage = 0;
    for (const g of activeGroups) {
      for (const t of g.transactions) {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          saved += t.total_saved ?? 0;
          shortage += t.remaining ?? (t.is_installment && t.monthly_amount ? t.monthly_amount : t.amount);
        }
      }
    }
    return { activeSpending: spending, activeSaved: saved, activeShortage: shortage };
  }, [activeGroups]);

  const handleTogglePaidTxn = (
    txn: Transaction,
    group: BillingGroup,
    isPaidForPeriod: boolean
  ) => {
    if (txn.is_installment || txn.is_subscription) {
      toggleInstallmentPeriodPaid(txn.id, group.periodKey, !isPaidForPeriod);
    } else {
      togglePaid(txn.id, !txn.is_paid);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Transactions</Text>
          <View className="flex-row items-center gap-2">
            {(overdueGroups.length > 0 || dueSoonGroups.length > 0) && (
              <Pressable
                onPress={() => setShowNotifications((v) => !v)}
                className="relative w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl items-center justify-center active:bg-slate-700"
              >
                <Ionicons
                  name={showNotifications ? "notifications" : "notifications-outline"}
                  size={18}
                  color={overdueGroups.length > 0 ? "#f87171" : "#fbbf24"}
                />
                <View
                  className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                    overdueGroups.length > 0 ? "bg-red-500" : "bg-amber-400"
                  }`}
                />
              </Pressable>
            )}
            <Pressable
              onPress={() => setShowAddTxn(true)}
              className="flex-row items-center gap-2 bg-indigo-600 px-4 py-2.5 rounded-xl active:bg-indigo-700"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white text-sm font-semibold">Add</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-5 pb-3">
          <View className="flex-row gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Spent</Text>
              <Text className="text-white text-sm font-bold">
                {CURRENCY}{activeSpending.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="w-px bg-slate-800" />
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Saved</Text>
              <Text className="text-emerald-400 text-sm font-bold">
                {CURRENCY}{activeSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="w-px bg-slate-800" />
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Shortage</Text>
              <Text className="text-amber-400 text-sm font-bold">
                {CURRENCY}{activeShortage.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

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
                const colorClass = item.id ? CARD_COLOR_BG_MAP[item.color] : "bg-indigo-600";
                return (
                  <Pressable
                    onPress={() => setSelectedCardFilter(item.id ?? null)}
                    className={`flex-row items-center gap-2 px-3 py-2 rounded-xl border ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-600"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    {item.id && <View className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />}
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
            {activeGroups.map((group) => (
              <BillingGroupCard
                key={group.key}
                group={group}
                onPayAll={(regularIds, installmentItems) =>
                  markGroupPaid(regularIds, installmentItems)
                }
                onPressTxn={(txn) => setSavingTarget(txn)}
                onDeleteTxn={(txn) => setDeleteTarget(txn)}
                onTogglePaidTxn={(txn, isPaidForPeriod) =>
                  handleTogglePaidTxn(txn, group, isPaidForPeriod)
                }
              />
            ))}
            <PaidStatementsSection
              groups={paidStatements}
              onPressTxn={(txn) => setSavingTarget(txn)}
              onDeleteTxn={(txn) => setDeleteTarget(txn)}
              onTogglePaidTxn={(txn, group, isPaidForPeriod) => {
                handleTogglePaidTxn(txn, group, isPaidForPeriod);
              }}
            />
          </ScrollView>
        )}

        {showNotifications && (
          <NotificationPopup
            overdueGroups={overdueGroups}
            dueSoonGroups={dueSoonGroups}
            onClose={() => setShowNotifications(false)}
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
        onAdd={async (data: AddSavingInput) => { await addSaving(data); }}
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