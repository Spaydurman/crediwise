import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Pressable, Text, View } from "react-native";
import { CARD_COLOR_BG_MAP, CARD_COLOR_ICON_MAP, CURRENCY, DATE_FORMAT } from "../../constants";
import { useThemeStore } from "../../stores/theme.store";
import type { Transaction } from "../../types";
import { Badge } from "../ui/Badge";

interface TransactionItemProps {
  transaction: Transaction;
  isOverdue?: boolean;
  isPaidForPeriod?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  onTogglePaid?: () => void;
}

function getSavingsVariant(
  isFullySaved: boolean,
  remaining: number,
  totalSaved: number
): "success" | "warning" | "danger" {
  if (isFullySaved) return "success";
  if (totalSaved > 0) return "warning";
  return "danger";
}

function getSavingsLabel(
  isFullySaved: boolean,
  remaining: number,
  totalSaved: number
): string {
  if (isFullySaved) return "Saved ✓";
  if (totalSaved > 0) return `${CURRENCY}${remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })} pa`;
  return "Not yet saved";
}

export function TransactionItem({
  transaction,
  isOverdue = false,
  isPaidForPeriod,
  onPress,
  onDelete,
  onTogglePaid,
}: TransactionItemProps) {
  const isDark = useThemeStore((state) => state.themeMode === "dark");
  const isSubscription = transaction.is_subscription;
  const totalSaved = transaction.total_saved ?? 0;
  const remaining = transaction.remaining ?? transaction.amount;
  const isFullySaved = transaction.is_fully_saved ?? false;
  const cardColor = transaction.credit_card?.color ?? "indigo";
  const cardBgClass = CARD_COLOR_BG_MAP[cardColor];
  const cardIconColor = CARD_COLOR_ICON_MAP[cardColor];

  // For installments, use the per-period paid flag; for regular, use the transaction flag
  const effectivePaid = isPaidForPeriod ?? transaction.is_paid;

  const paidPeriodsCount = transaction.paid_periods_count ?? 0;
  const totalMonths = transaction.installment_months ?? 0;

  const savingsVariant = getSavingsVariant(isFullySaved, remaining, totalSaved);
  const savingsLabel = getSavingsLabel(isFullySaved, remaining, totalSaved);

  const trackableAmount =
    transaction.is_installment && transaction.monthly_amount
      ? transaction.monthly_amount
      : transaction.amount;

  const progressPercent =
    trackableAmount > 0
      ? Math.min((totalSaved / trackableAmount) * 100, 100)
      : 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 gap-3 active:bg-slate-50 dark:active:bg-slate-800 ${
        isOverdue
          ? "border-red-200 dark:border-red-500"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`${isDark ? cardBgClass : "bg-slate-100 border border-slate-200"} w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`}
        >
          <Ionicons name="receipt-outline" size={18} color={isDark ? "#ffffff" : cardIconColor} />
        </View>

        <View className="flex-1 gap-0.5">
          <Text className="text-slate-950 dark:text-white font-semibold text-sm" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs">
            {transaction.credit_card?.bank} •{" "}
            {transaction.credit_card?.name} •{" "}
            {format(new Date(transaction.transaction_date), DATE_FORMAT)}
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-xs">{transaction.category}</Text>
          {/* {isSubscription && (
            <Text className="text-teal-300/80 text-xs">
              Repeats every statement until marked inactive.
            </Text>
          )} */}
        </View>

        <View className="items-end gap-1">
          <Text className="text-slate-950 dark:text-white font-bold text-base">
            {CURRENCY}
            {transaction.amount.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
          {transaction.is_installment && transaction.monthly_amount && (
            <Badge
              label={`${CURRENCY}${transaction.monthly_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}/mo`}
              variant="info"
            />
          )}
          {transaction.is_installment && totalMonths > 0 && (
            <Badge
              label={`${paidPeriodsCount}/${totalMonths} mo paid`}
              variant={paidPeriodsCount >= totalMonths ? "success" : paidPeriodsCount > 0 ? "warning" : "neutral"}
            />
          )}
          {isSubscription && (
            <Badge label="Subscription" variant="info" />
          )}
          {isSubscription && (
            <Badge
              label={transaction.subscription_active ? "Active" : "Inactive"}
              variant={transaction.subscription_active ? "success" : "neutral"}
            />
          )}
          {!transaction.is_installment && !isSubscription && (
            effectivePaid ? (
              <Badge label="Paid ✓" variant="success" />
            ) : (
              <Badge label={savingsLabel} variant={savingsVariant} />
            )
          )}
          {/* {(transaction.is_installment || isSubscription) && effectivePaid && (
            <Badge label="This period paid ✓" variant="success" />
          )}
          {isSubscription && !effectivePaid && (
            <Badge label="This period due" variant={isOverdue ? "danger" : "warning"} />
          )} */}
        </View>
      </View>

      <View className="gap-1.5">
        <View className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              isFullySaved ? "bg-emerald-500" : totalSaved > 0 ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-slate-600 dark:text-slate-500 text-xs">
            Saved: {CURRENCY}
            {totalSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          {!isFullySaved && (
            <Text className="text-slate-600 dark:text-slate-500 text-xs">
              Remaining: {CURRENCY}
              {remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          )}
        </View>
      </View>

      {(onDelete || onTogglePaid) && (
        <View className="flex-row justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-2">
          {onTogglePaid && (
            <Pressable
              onPress={onTogglePaid}
              className={`flex-row items-center gap-1 px-3 py-1 rounded-lg ${
                effectivePaid
                  ? "active:bg-amber-50 dark:active:bg-amber-900/30"
                  : "active:bg-indigo-50 dark:active:bg-indigo-900/30"
              }`}
            >
              <Ionicons
                name={effectivePaid ? "close-circle-outline" : "checkmark-circle-outline"}
                size={14}
                color={effectivePaid ? (isDark ? "#f59e0b" : "#b45309") : (isDark ? "#818cf8" : "#4338ca")}
              />
              <Text className={`text-xs font-medium ${
                effectivePaid
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-indigo-700 dark:text-indigo-400"
              }`}>
                {effectivePaid ? "Unpaid" : "Mark Paid"}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onDelete}
            className="flex-row items-center gap-1 px-3 py-1 rounded-lg active:bg-red-50 dark:active:bg-red-900/30"
          >
            <Ionicons name="trash-outline" size={14} color={isDark ? "#f87171" : "#dc2626"} />
            <Text className="text-red-700 dark:text-red-400 text-xs font-medium">Delete</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
