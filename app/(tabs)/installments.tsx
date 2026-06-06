import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { CARD_COLOR_BG_MAP, CARD_COLOR_ICON_MAP, CURRENCY, DATE_FORMAT } from "@/constants";
import { useTransactions } from "@/hooks/useTransactions";
import { useThemeStore } from "@/stores/theme.store";
import type { Transaction } from "@/types";

export default function InstallmentsScreen() {
  const isDark = useThemeStore((state) => state.themeMode === "dark");
  const { transactions, loading, setSubscriptionActive } = useTransactions();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const installments = useMemo(
    () => transactions.filter((t) => t.is_installment),
    [transactions]
  );

  const subscriptions = useMemo(
    () => transactions.filter((t) => t.is_subscription),
    [transactions]
  );

  const activeSubscriptions = subscriptions.filter((s) => s.subscription_active);
  const inactiveSubscriptions = subscriptions.filter((s) => !s.subscription_active);
  const monthlySubscriptionTotal = activeSubscriptions.reduce(
    (sum, s) => sum + s.amount,
    0
  );

  const handleToggleSubscription = async (txn: Transaction) => {
    setTogglingId(txn.id);
    try {
      await setSubscriptionActive(txn.id, !txn.subscription_active);
    } finally {
      setTogglingId(null);
    }
  };

  const active = useMemo(
    () =>
      installments.filter(
        (t) => (t.paid_periods_count ?? 0) < (t.installment_months ?? 0)
      ),
    [installments]
  );

  const completed = useMemo(
    () =>
      installments.filter(
        (t) => (t.paid_periods_count ?? 0) >= (t.installment_months ?? 0)
      ),
    [installments]
  );

  // Summary totals for active installments
  const monthlyCommitment = active.reduce(
    (sum, t) => sum + (t.monthly_amount ?? 0),
    0
  );
  const totalRemainingPayments = active.reduce((sum, t) => {
    const remaining = (t.installment_months ?? 0) - (t.paid_periods_count ?? 0);
    return sum + remaining * (t.monthly_amount ?? 0);
  }, 0);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-slate-950 dark:text-white text-2xl font-bold">Recurring</Text>
        <Text className="text-slate-500 text-sm mt-0.5">
          {active.length} installment{active.length === 1 ? "" : "s"} ·{" "}
          {activeSubscriptions.length} subscription
          {activeSubscriptions.length === 1 ? "" : "s"}
        </Text>
      </View>

      {installments.length === 0 && subscriptions.length === 0 ? (
        <EmptyState
          icon="layers-outline"
          title="Nothing recurring yet"
          description="Add a transaction and enable Installment or Subscription to start tracking recurring payments."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-8 gap-5"
        >
          {/* Installment summary */}
          {active.length > 0 && (
            <View className="flex-row gap-2 bg-white border border-slate-200 rounded-2xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Monthly Due</Text>
                <Text className="text-slate-950 dark:text-white text-sm font-bold">
                  {CURRENCY}
                  {monthlyCommitment.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View className="w-px bg-slate-200 dark:bg-slate-800" />
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Total Remaining</Text>
                <Text className="text-amber-700 dark:text-amber-400 text-sm font-bold">
                  {CURRENCY}
                  {totalRemainingPayments.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View className="w-px bg-slate-200 dark:bg-slate-800" />
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Active</Text>
                <Text className="text-indigo-700 dark:text-indigo-400 text-sm font-bold">
                  {active.length}
                </Text>
              </View>
            </View>
          )}

          {/* Active installments */}
          {active.length > 0 && (
            <View className="gap-3">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Active Installments
              </Text>
              {active.map((txn) => (
                <InstallmentCard key={txn.id} transaction={txn} />
              ))}
            </View>
          )}

          {/* Completed installments */}
          {completed.length > 0 && (
            <View className="gap-3">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Completed Installments
              </Text>
              {completed.map((txn) => (
                <InstallmentCard key={txn.id} transaction={txn} />
              ))}
            </View>
          )}

          {/* Subscription summary */}
          {subscriptions.length > 0 && (
            <View className="flex-row gap-2 bg-white border border-slate-200 rounded-2xl p-3 dark:bg-slate-900 dark:border-slate-800">
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Monthly Subs</Text>
                <Text className="text-slate-950 dark:text-white text-sm font-bold">
                  {CURRENCY}
                  {monthlySubscriptionTotal.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View className="w-px bg-slate-200 dark:bg-slate-800" />
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Active</Text>
                <Text className="text-teal-700 dark:text-teal-400 text-sm font-bold">
                  {activeSubscriptions.length}
                </Text>
              </View>
              <View className="w-px bg-slate-200 dark:bg-slate-800" />
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Inactive</Text>
                <Text className="text-slate-400 text-sm font-bold">
                  {inactiveSubscriptions.length}
                </Text>
              </View>
            </View>
          )}

          {activeSubscriptions.length > 0 && (
            <View className="gap-3">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Active Subscriptions
              </Text>
              {activeSubscriptions.map((txn) => (
                <SubscriptionCard
                  key={txn.id}
                  transaction={txn}
                  toggling={togglingId === txn.id}
                  onToggle={() => handleToggleSubscription(txn)}
                />
              ))}
            </View>
          )}

          {inactiveSubscriptions.length > 0 && (
            <View className="gap-3">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Inactive Subscriptions
              </Text>
              {inactiveSubscriptions.map((txn) => (
                <SubscriptionCard
                  key={txn.id}
                  transaction={txn}
                  toggling={togglingId === txn.id}
                  onToggle={() => handleToggleSubscription(txn)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SubscriptionCard({
  transaction: t,
  toggling,
  onToggle,
}: {
  transaction: Transaction;
  toggling: boolean;
  onToggle: () => void;
}) {
  const isDark = useThemeStore((state) => state.themeMode === "dark");
  const cardColor = t.credit_card?.color ?? "indigo";
  const cardBgClass = CARD_COLOR_BG_MAP[cardColor];
  const cardIconColor = CARD_COLOR_ICON_MAP[cardColor];
  const isActive = t.subscription_active;

  return (
    <View
      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 gap-3 ${
        isActive
          ? "border-teal-200 dark:border-teal-800/50"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`${isDark ? cardBgClass : "bg-slate-100 border border-slate-200"} w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`}
        >
          <Ionicons name="repeat-outline" size={18} color={isDark ? "white" : cardIconColor} />
        </View>

        <View className="flex-1 gap-0.5">
          <Text className="text-slate-950 dark:text-white font-semibold text-sm" numberOfLines={1}>
            {t.description}
          </Text>
          <Text className="text-slate-500 text-xs">
            {t.credit_card?.bank} · {t.credit_card?.name}
          </Text>
          <Text className="text-slate-500 text-xs">
            Started: {format(new Date(t.transaction_date), DATE_FORMAT)}
          </Text>
          {!isActive && t.subscription_inactive_at && (
            <Text className="text-slate-500 text-xs">
              Stopped: {format(new Date(t.subscription_inactive_at), DATE_FORMAT)}
            </Text>
          )}
        </View>

        <View className="items-end gap-1">
          <Text className="text-slate-950 dark:text-white font-bold text-base">
            {CURRENCY}
            {t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-teal-700 dark:text-teal-400 text-xs font-semibold">per month</Text>
          <View
            className={`px-2 py-0.5 rounded-full border ${
              isActive
                ? "bg-teal-50 border-teal-200 dark:bg-teal-900/60 dark:border-teal-700"
                : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isActive ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-400"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={toggling ? undefined : onToggle}
        disabled={toggling}
        className={`flex-row items-center justify-center gap-2 rounded-xl py-2.5 border ${
          isActive
            ? "bg-slate-100 border-slate-200 active:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:active:bg-slate-700"
            : "bg-teal-50 border-teal-200 active:bg-teal-100 dark:bg-teal-700 dark:border-teal-600 dark:active:bg-teal-800"
        } ${toggling ? "opacity-60" : ""}`}
      >
        {toggling ? (
          <ActivityIndicator size={14} color={isActive ? (isDark ? "#cbd5e1" : "#475569") : (isDark ? "white" : "#0f766e")} />
        ) : (
          <Ionicons
            name={isActive ? "pause-circle-outline" : "play-circle-outline"}
            size={16}
            color={isActive ? (isDark ? "#cbd5e1" : "#475569") : (isDark ? "white" : "#0f766e")}
          />
        )}
        <Text
          className={`text-xs font-semibold ${
            isActive ? "text-slate-700 dark:text-slate-200" : "text-teal-700 dark:text-white"
          }`}
        >
          {isActive ? "Set Inactive" : "Set Active"}
        </Text>
      </Pressable>
    </View>
  );
}

function InstallmentCard({
  transaction: t,
}: {
  transaction: ReturnType<typeof useTransactions>["transactions"][0];
}) {
  const isDark = useThemeStore((state) => state.themeMode === "dark");
  const paidMonths = t.paid_periods_count ?? 0;
  const totalMonths = t.installment_months ?? 0;
  const remainingMonths = Math.max(0, totalMonths - paidMonths);
  const progressPercent = totalMonths > 0 ? (paidMonths / totalMonths) * 100 : 0;
  const isCompleted = paidMonths >= totalMonths;

  const paidAmount = paidMonths * (t.monthly_amount ?? 0);
  const remainingAmount = remainingMonths * (t.monthly_amount ?? 0);

  const cardColor = t.credit_card?.color ?? "indigo";
  const cardBgClass = CARD_COLOR_BG_MAP[cardColor];
  const cardIconColor = CARD_COLOR_ICON_MAP[cardColor];

  return (
    <View
      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 gap-3 ${
        isCompleted
          ? "border-emerald-200 dark:border-emerald-800/50"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* Top row */}
      <View className="flex-row items-start gap-3">
        <View
          className={`${isDark ? cardBgClass : "bg-slate-100 border border-slate-200"} w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`}
        >
          <Ionicons name="layers-outline" size={18} color={isDark ? "white" : cardIconColor} />
        </View>

        <View className="flex-1 gap-0.5">
          <Text className="text-slate-950 dark:text-white font-semibold text-sm" numberOfLines={1}>
            {t.description}
          </Text>
          <Text className="text-slate-500 text-xs">
            {t.credit_card?.bank} · {t.credit_card?.name}
          </Text>
          <Text className="text-slate-500 text-xs">
            Started: {format(new Date(t.transaction_date), DATE_FORMAT)}
          </Text>
        </View>

        <View className="items-end gap-1">
          <Text className="text-slate-950 dark:text-white font-bold text-base">
            {CURRENCY}
            {t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
            {CURRENCY}
            {(t.monthly_amount ?? 0).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
            /mo
          </Text>
          {isCompleted && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={12} color={isDark ? "#34d399" : "#047857"} />
              <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                Done
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress */}
      <View className="gap-2">
        {/* Progress bar */}
        <View className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              isCompleted ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>

        {/* Month counter */}
        <View className="flex-row items-center justify-between">
          <Text className="text-slate-700 dark:text-slate-400 text-xs font-semibold">
            {paidMonths}/{totalMonths} months paid
          </Text>
          {!isCompleted && (
            <Text className="text-slate-500 text-xs">
              {remainingMonths} month{remainingMonths !== 1 ? "s" : ""} left
            </Text>
          )}
        </View>

        {/* Amount breakdown */}
        <View className="flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
          <View className="gap-0.5">
            <Text className="text-slate-500 text-xs">Paid so far</Text>
            <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">
              {CURRENCY}
              {paidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          {!isCompleted && (
            <View className="items-end gap-0.5">
              <Text className="text-slate-500 text-xs">Still to pay</Text>
              <Text className="text-amber-700 dark:text-amber-400 text-sm font-bold">
                {CURRENCY}
                {remainingAmount.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
