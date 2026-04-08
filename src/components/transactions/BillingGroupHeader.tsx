import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Pressable, Text, View } from "react-native";
import { CARD_COLOR_BG_MAP, CURRENCY, DATE_FORMAT } from "../../constants";
import type { BillingGroup } from "./types";

interface BillingGroupHeaderProps {
  group: BillingGroup;
  statementTotal: number;
  allPaid: boolean;
  onPayAll: () => void;
}

export function BillingGroupHeader({
  group,
  statementTotal,
  allPaid,
  onPayAll,
}: BillingGroupHeaderProps) {
  const cardBgClass = CARD_COLOR_BG_MAP[group.card.color];

  return (
    <View
      className={`rounded-xl border overflow-hidden
        ${
            group.isOverdue
            ? "border-red-700"
            : group.isDueSoon
            ? "border-amber-700"
            : "border-slate-700"
        }
      `}
    >
      {/* Card color accent stripe */}
      <View className={`h-1.5 ${cardBgClass}`} />

      <View className="px-4 py-3 gap-3">
        {/* Card identity row */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
            <View
              className={`${cardBgClass} w-9 h-9 rounded-xl items-center justify-center flex-shrink-0`}
            >
              <Ionicons name="card-outline" size={16} color="white" />
            </View>
            <View className="gap-0.5 flex-1">
              <Text className="text-white text-sm font-bold" numberOfLines={1}>
                {group.card.bank}
              </Text>
              <Text className="text-slate-400 text-xs" numberOfLines={1}>
                {group.card.name}
                {group.card.last_four_digits
                  ? ` ••••${group.card.last_four_digits}`
                  : ""}
              </Text>
            </View>
          </View>
          {group.isOverdue ? (
            <View className="bg-red-500/20 border border-red-500 rounded-lg px-2 py-1">
              <Text className="text-red-400 text-xs font-bold">OVERDUE</Text>
            </View>
          ) : group.isDueSoon ? (
            <View className="bg-amber-500/20 border border-amber-500 rounded-lg px-2 py-1">
              <Text className="text-amber-400 text-xs font-bold">DUE SOON</Text>
            </View>
          ) : null}
        </View>

        {/* Date chips */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-slate-800/80 rounded-lg px-3 py-2 gap-0.5">
            <Text className="text-slate-500 text-xs">Statement closes</Text>
            <Text className="text-white text-xs font-semibold">
              {format(group.statementDate, DATE_FORMAT)}
            </Text>
          </View>
          <View
            className={`flex-1 rounded-lg px-3 py-2 gap-0.5 ${
              group.isOverdue
                ? "bg-red-950/80"
                : group.isDueSoon
                ? "bg-amber-950/80"
                : "bg-slate-800/80"
            }`}
          >
            <Text className="text-slate-500 text-xs">Payment due</Text>
            <Text
              className={`text-xs font-semibold ${
                group.isOverdue
                  ? "text-red-400"
                  : group.isDueSoon
                  ? "text-amber-400"
                  : "text-white"
              }`}
            >
              {format(group.billingDate, DATE_FORMAT)}
            </Text>
          </View>
        </View>

        {/* Total + Pay All */}
        <View className="flex-row items-center justify-between border-t border-slate-700/60 pt-2.5">
          <View className="gap-0.5">
            <Text className="text-slate-500 text-xs">
              {group.transactions.length} item
              {group.transactions.length !== 1 ? "s" : ""} · Total
            </Text>
            <Text className="text-white text-base font-bold">
              {CURRENCY}
              {statementTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          {!allPaid ? (
            <Pressable
              onPress={onPayAll}
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
    </View>
  );
}
