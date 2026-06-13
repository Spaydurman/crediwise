import { Ionicons } from "@expo/vector-icons";
import { addMonths, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddSavingSheet } from "@/components/savings/AddSavingSheet";
import {
  AddTransactionSheet,
  type AddTransactionInitialValues,
} from "@/components/transactions/AddTransactionSheet";
import { BillingGroupCard } from "@/components/transactions/BillingGroupCard";
import { NotificationPopup } from "@/components/transactions/NotificationPopup";
import { PaidStatementsSection } from "@/components/transactions/PaidStatementsSection";
import type { BillingGroup } from "@/components/transactions/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CARD_COLOR_BG_MAP, CURRENCY } from "@/constants";
import { useCards } from "@/hooks/useCards";
import { useSavings } from "@/hooks/useSavings";
import { useTransactions } from "@/hooks/useTransactions";
import { getBillingPeriod } from "@/lib/billing";
import { scanReceipt, type ReceiptSource } from "@/lib/receiptOcr";
import { useThemeStore } from "@/stores/theme.store";
import type { AddSavingInput, AddTransactionInput, Transaction } from "@/types";

const MAX_RECURRING_PERIODS = 240;

export default function TransactionsScreen() {
  const { cards } = useCards();
  const isDark = useThemeStore((state) => state.themeMode === "dark");
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
  const [addInitialValues, setAddInitialValues] =
    useState<AddTransactionInitialValues | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showScanSheet, setShowScanSheet] = useState(false);
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

  const openManualAdd = () => {
    setAddInitialValues(null);
    setShowAddTxn(true);
  };

  const runScan = async (source: ReceiptSource) => {
    setShowScanSheet(false);
    try {
      setScanning(true);
      const parsed = await scanReceipt(source);
      if (!parsed) return;
      setAddInitialValues({
        description: parsed.description ?? undefined,
        amount: parsed.amount != null ? parsed.amount.toFixed(2) : undefined,
        transaction_date: parsed.transaction_date ?? undefined,
      });
      setShowAddTxn(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to scan receipt.";
      Alert.alert("Scan failed", message);
    } finally {
      setScanning(false);
    }
  };

  const handleScanPress = () => {
    if (scanning) return;
    setShowScanSheet(true);
  };

  const notificationColor = overdueGroups.length > 0
    ? isDark
      ? "#f87171"
      : "#dc2626"
    : isDark
    ? "#fbbf24"
    : "#a16207";
  const scanAccentColor = isDark ? "#ffffff" : "#0f766e";
  const addAccentColor = isDark ? "#ffffff" : "#4338ca";

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <Text className="text-slate-950 dark:text-white text-2xl font-bold">Transactions</Text>
          <View className="flex-row items-center gap-2">
            {(overdueGroups.length > 0 || dueSoonGroups.length > 0) && (
              <Pressable
                onPress={() => setShowNotifications((v) => !v)}
                className="relative w-10 h-10 bg-white border border-slate-200 rounded-xl items-center justify-center active:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:active:bg-slate-700"
              >
                <Ionicons
                  name={showNotifications ? "notifications" : "notifications-outline"}
                  size={18}
                  color={notificationColor}
                />
                <View
                  className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                    overdueGroups.length > 0 ? "bg-red-600" : "bg-amber-600"
                  }`}
                />
              </Pressable>
            )}
            <Pressable
              onPress={handleScanPress}
              disabled={scanning}
              accessibilityLabel="Scan receipt"
              className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl border ${
                scanning
                  ? "bg-teal-100 border-teal-200 dark:bg-teal-900/40 dark:border-teal-800"
                  : "bg-teal-50 border-teal-200 active:bg-teal-100 dark:bg-teal-700 dark:border-teal-600 dark:active:bg-teal-800"
              }`}
            >
              {scanning ? (
                <ActivityIndicator size={14} color={scanAccentColor} />
              ) : (
                <Ionicons name="scan-outline" size={18} color={scanAccentColor} />
              )}
            </Pressable>
            <Pressable
              onPress={openManualAdd}
              className="flex-row items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-xl active:bg-indigo-100 dark:bg-indigo-600 dark:border-indigo-500 dark:active:bg-indigo-700"
            >
              <Ionicons name="add" size={18} color={addAccentColor} />
              <Text className="text-indigo-700 dark:text-white text-sm font-semibold">Add</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-5 pb-3">
          <View className="flex-row gap-2 bg-white border border-slate-200 rounded-2xl p-3 dark:bg-slate-900 dark:border-slate-800">
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Spent</Text>
              <Text className="text-slate-950 dark:text-white text-sm font-bold">
                {CURRENCY}{activeSpending.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="w-px bg-slate-200 dark:bg-slate-800" />
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Saved</Text>
              <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                {CURRENCY}{activeSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="w-px bg-slate-200 dark:bg-slate-800" />
            <View className="flex-1 items-center gap-0.5">
              <Text className="text-slate-500 text-xs">Shortage</Text>
              <Text className="text-amber-700 dark:text-amber-400 text-sm font-bold">
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
                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-600/20 dark:border-indigo-600"
                        : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                    }`}
                  >
                    {item.id && <View className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />}
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "text-indigo-700 dark:text-indigo-300"
                          : "text-slate-700 dark:text-slate-400"
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
        onClose={() => {
          setShowAddTxn(false);
          setAddInitialValues(null);
        }}
        onAdd={async (data: AddTransactionInput) => {
          await addTransaction(data);
        }}
        cards={cards}
        initialValues={addInitialValues}
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
      <BottomSheet
        visible={showScanSheet}
        onClose={() => setShowScanSheet(false)}
        title="Scan Receipt"
        snapHeight={360}
      >
        <View className="px-5 pt-4 pb-5 gap-3">
          <Text className="text-slate-600 dark:text-slate-400 text-sm leading-5">
            Capture a new photo or choose one from your library. We&apos;ll prefill
            the merchant, amount, and date from the receipt.
          </Text>

          <Pressable
            onPress={() => runScan("camera")}
            className="flex-row items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 active:bg-teal-100 dark:border-teal-700/60 dark:bg-teal-600/15 dark:active:bg-teal-600/25"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-600">
              <Ionicons name="camera-outline" size={22} color={isDark ? "#ffffff" : "#0f766e"} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold text-slate-950 dark:text-white">Use Camera</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                Take a fresh photo of your receipt
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>

          <Pressable
            onPress={() => runScan("library")}
            className="flex-row items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 active:bg-indigo-100 dark:border-indigo-700/60 dark:bg-indigo-600/15 dark:active:bg-indigo-600/25"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-600">
              <Ionicons name="images-outline" size={22} color={isDark ? "#ffffff" : "#4338ca"} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold text-slate-950 dark:text-white">Choose from Library</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                Pick an existing receipt image
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>

          <Pressable
            onPress={() => setShowScanSheet(false)}
            className="mt-1 items-center py-3"
          >
            <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">Cancel</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}