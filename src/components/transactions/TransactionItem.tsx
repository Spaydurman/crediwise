import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Pressable, Text, View } from "react-native";
import { CARD_COLOR_BG_MAP, CURRENCY, DATE_FORMAT } from "../../constants";
import type { Transaction } from "../../types";
import { Badge } from "../ui/Badge";

interface TransactionItemProps {
  transaction: Transaction;
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
  if (isFullySaved) return "Natabi na ✓";
  if (totalSaved > 0) return `${CURRENCY}${remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })} pa`;
  return "Hindi pa natabi";
}

export function TransactionItem({
  transaction,
  onPress,
  onDelete,
  onTogglePaid,
}: TransactionItemProps) {
  const totalSaved = transaction.total_saved ?? 0;
  const remaining = transaction.remaining ?? transaction.amount;
  const isFullySaved = transaction.is_fully_saved ?? false;
  const cardColor = transaction.credit_card?.color ?? "indigo";
  const cardBgClass = CARD_COLOR_BG_MAP[cardColor];

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
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 gap-3 active:bg-slate-800"
    >
      <View className="flex-row items-start gap-3">
        <View className={`${cardBgClass} w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`}>
          <Ionicons name="receipt-outline" size={18} color="white" />
        </View>

        <View className="flex-1 gap-0.5">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text className="text-slate-500 text-xs">
            {transaction.credit_card?.bank} •{" "}
            {transaction.credit_card?.name} •{" "}
            {format(new Date(transaction.transaction_date), DATE_FORMAT)}
          </Text>
          <Text className="text-slate-400 text-xs">{transaction.category}</Text>
        </View>

        <View className="items-end gap-1">
          <Text className="text-white font-bold text-base">
            {CURRENCY}
            {transaction.amount.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
          {transaction.is_installment && transaction.monthly_amount && (
            <Badge
              label={`${CURRENCY}${transaction.monthly_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}/mo × ${transaction.installment_months}`}
              variant="info"
            />
          )}
          {transaction.is_paid ? (
            <Badge label="Paid ✓" variant="success" />
          ) : (
            <Badge label={savingsLabel} variant={savingsVariant} />
          )}
        </View>
      </View>

      <View className="gap-1.5">
        <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              isFullySaved ? "bg-emerald-500" : totalSaved > 0 ? "bg-amber-500" : "bg-slate-700"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-slate-500 text-xs">
            Saved: {CURRENCY}
            {totalSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          {!isFullySaved && (
            <Text className="text-slate-500 text-xs">
              Remaining: {CURRENCY}
              {remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          )}
        </View>
      </View>

      {onDelete && (
        <View className="flex-row justify-end gap-3 border-t border-slate-800 pt-2">
          {onTogglePaid && (
            <Pressable
              onPress={onTogglePaid}
              className="flex-row items-center gap-1 px-3 py-1 rounded-lg active:bg-indigo-900/30"
            >
              <Ionicons
                name={transaction.is_paid ? "close-circle-outline" : "checkmark-circle-outline"}
                size={14}
                color={transaction.is_paid ? "#f59e0b" : "#6366f1"}
              />
              <Text className={`text-xs font-medium ${transaction.is_paid ? "text-amber-400" : "text-indigo-400"}`}>
                {transaction.is_paid ? "Unpaid" : "Mark Paid"}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onDelete}
            className="flex-row items-center gap-1 px-3 py-1 rounded-lg active:bg-red-900/30"
          >
            <Ionicons name="trash-outline" size={14} color="#f87171" />
            <Text className="text-red-400 text-xs font-medium">Delete</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
