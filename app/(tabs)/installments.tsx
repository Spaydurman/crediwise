import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { CARD_COLOR_BG_MAP, CURRENCY, DATE_FORMAT } from "@/constants";
import { useTransactions } from "@/hooks/useTransactions";

export default function InstallmentsScreen() {
  const { transactions, loading } = useTransactions();

  const installments = useMemo(
    () => transactions.filter((t) => t.is_installment),
    [transactions]
  );

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
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-white text-2xl font-bold">Installments</Text>
        <Text className="text-slate-500 text-sm mt-0.5">
          {active.length} active · {completed.length} completed
        </Text>
      </View>

      {installments.length === 0 ? (
        <EmptyState
          icon="layers-outline"
          title="No installments yet"
          description="Add a transaction and enable the installment toggle to start tracking monthly payments."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-8 gap-5"
        >
          {/* Summary */}
          {active.length > 0 && (
            <View className="flex-row gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Monthly Due</Text>
                <Text className="text-white text-sm font-bold">
                  {CURRENCY}
                  {monthlyCommitment.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View className="w-px bg-slate-800" />
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Total Remaining</Text>
                <Text className="text-amber-400 text-sm font-bold">
                  {CURRENCY}
                  {totalRemainingPayments.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View className="w-px bg-slate-800" />
              <View className="flex-1 items-center gap-0.5">
                <Text className="text-slate-500 text-xs">Active</Text>
                <Text className="text-indigo-400 text-sm font-bold">
                  {active.length}
                </Text>
              </View>
            </View>
          )}

          {/* Active installments */}
          {active.length > 0 && (
            <View className="gap-3">
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Active
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
                Completed
              </Text>
              {completed.map((txn) => (
                <InstallmentCard key={txn.id} transaction={txn} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InstallmentCard({
  transaction: t,
}: {
  transaction: ReturnType<typeof useTransactions>["transactions"][0];
}) {
  const paidMonths = t.paid_periods_count ?? 0;
  const totalMonths = t.installment_months ?? 0;
  const remainingMonths = Math.max(0, totalMonths - paidMonths);
  const progressPercent = totalMonths > 0 ? (paidMonths / totalMonths) * 100 : 0;
  const isCompleted = paidMonths >= totalMonths;

  const paidAmount = paidMonths * (t.monthly_amount ?? 0);
  const remainingAmount = remainingMonths * (t.monthly_amount ?? 0);

  const cardColor = t.credit_card?.color ?? "indigo";
  const cardBgClass = CARD_COLOR_BG_MAP[cardColor];

  return (
    <View
      className={`bg-slate-900 border rounded-xl p-4 gap-3 ${
        isCompleted ? "border-emerald-800/50" : "border-slate-800"
      }`}
    >
      {/* Top row */}
      <View className="flex-row items-start gap-3">
        <View
          className={`${cardBgClass} w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`}
        >
          <Ionicons name="layers-outline" size={18} color="white" />
        </View>

        <View className="flex-1 gap-0.5">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
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
          <Text className="text-white font-bold text-base">
            {CURRENCY}
            {t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-indigo-400 text-xs font-semibold">
            {CURRENCY}
            {(t.monthly_amount ?? 0).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
            /mo
          </Text>
          {isCompleted && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={12} color="#34d399" />
              <Text className="text-emerald-400 text-xs font-semibold">
                Done
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress */}
      <View className="gap-2">
        {/* Progress bar */}
        <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              isCompleted ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>

        {/* Month counter */}
        <View className="flex-row items-center justify-between">
          <Text className="text-slate-400 text-xs font-semibold">
            {paidMonths}/{totalMonths} months paid
          </Text>
          {!isCompleted && (
            <Text className="text-slate-500 text-xs">
              {remainingMonths} month{remainingMonths !== 1 ? "s" : ""} left
            </Text>
          )}
        </View>

        {/* Amount breakdown */}
        <View className="flex-row items-center justify-between border-t border-slate-800 pt-2">
          <View className="gap-0.5">
            <Text className="text-slate-500 text-xs">Paid so far</Text>
            <Text className="text-emerald-400 text-sm font-bold">
              {CURRENCY}
              {paidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          {!isCompleted && (
            <View className="items-end gap-0.5">
              <Text className="text-slate-500 text-xs">Still to pay</Text>
              <Text className="text-amber-400 text-sm font-bold">
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
