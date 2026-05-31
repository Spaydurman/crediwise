import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { CARD_COLOR_BG_MAP, CURRENCY, DATE_FORMAT } from "../../constants";
import type { BillingGroup } from "./types";

interface BillingGroupHeaderProps {
  group: BillingGroup;
  itemCount: number;
  statementTotal: number;
  statementSaved: number;
  statementShortage: number;
  allPaid: boolean;
  paying?: boolean;
  expanded?: boolean;
  onPayAll?: () => void;
  onToggleExpanded?: () => void;
}

export function BillingGroupHeader({
  group,
  itemCount,
  statementTotal,
  statementSaved,
  statementShortage,
  allPaid,
  paying = false,
  onPayAll,
  expanded = true,
  onToggleExpanded,
}: BillingGroupHeaderProps) {
  const cardBgClass = CARD_COLOR_BG_MAP[group.card.color];
  const shortageIsClear = statementShortage <= 0;
  const shortageContainerClass = shortageIsClear
    ? "bg-emerald-950/40 border border-emerald-800/50"
    : group.isOverdue && !allPaid
    ? "bg-red-950/50 border border-red-800/50"
    : "bg-amber-950/50 border border-amber-800/50";
  const shortageTextClass = shortageIsClear
    ? "text-emerald-400"
    : group.isOverdue && !allPaid
    ? "text-red-400"
    : "text-amber-400";

  return (
    <View
      className={`rounded-xl border overflow-hidden border-slate-700`}
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
          <View className="flex-row items-center gap-2">
            {!allPaid && group.isOverdue ? (
              <View className="bg-red-500/20 border border-red-500 rounded-lg px-2 py-1">
                <Text className="text-red-400 text-xs font-bold">OVERDUE</Text>
              </View>
            ) : !allPaid && group.isDueSoon ? (
              <View className="bg-amber-500/20 border border-amber-500 rounded-lg px-2 py-1">
                <Text className="text-amber-400 text-xs font-bold">DUE SOON</Text>
              </View>
            ) : null}
            {onToggleExpanded ? (
              <Pressable
                onPress={onToggleExpanded}
                accessibilityRole="button"
                accessibilityLabel={expanded ? "Collapse statement" : "Expand statement"}
                className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 items-center justify-center active:bg-slate-700"
              >
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#cbd5e1"
                />
              </Pressable>
            ) : null}
          </View>
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
        <View className="flex-row gap-2">
          <View className="flex-1 bg-slate-800/80 rounded-lg px-3 py-2 gap-0.5">
            <Text className="text-slate-500 text-xs">Total</Text>
            <Text className="text-white text-xs font-semibold">
              {CURRENCY}
              {statementTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View className="flex-1 bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-3 py-2 gap-0.5">
            <Text className="text-slate-500 text-xs">Saved</Text>
            <Text className="text-emerald-400 text-xs font-semibold">
              {CURRENCY}
              {statementSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View className={`flex-1 rounded-lg px-3 py-2 gap-0.5 ${shortageContainerClass}`}>
            <Text className="text-slate-500 text-xs">Shortage</Text>
            <Text className={`text-xs font-semibold ${shortageTextClass}`}>
              {CURRENCY}
              {statementShortage.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between border-t border-slate-700/60 pt-2.5">
          <View className="gap-0.5">
            <Text className="text-slate-500 text-xs">
              {itemCount} item
              {itemCount !== 1 ? "s" : ""} in this statement
            </Text>
            <Text className="text-white text-base font-bold">
              {expanded ? "Items shown" : "Items hidden"}
            </Text>
          </View>
          {!allPaid ? (
            <Pressable
              onPress={paying || !onPayAll ? undefined : onPayAll}
              disabled={paying || !onPayAll}
              className={`flex-row items-center gap-1.5 border rounded-xl px-3 py-2 ${
                paying || !onPayAll
                  ? "bg-emerald-900/60 border-emerald-700/50"
                  : "bg-emerald-700 border-emerald-600 active:bg-emerald-800"
              }`}
            >
              {paying ? (
                <ActivityIndicator size={15} color="white" />
              ) : (
                <Ionicons name="checkmark-done" size={15} color="white" />
              )}
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
