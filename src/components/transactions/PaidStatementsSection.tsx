import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CARD_COLOR_BG_MAP, CURRENCY, DATE_FORMAT } from "../../constants";
import { TransactionItem } from "./TransactionItem";
import type { BillingGroup } from "./types";

interface PaidStatementsSectionProps {
  groups: BillingGroup[];
  onPressTxn: (txn: BillingGroup["transactions"][0]) => void;
  onDeleteTxn: (txn: BillingGroup["transactions"][0]) => void;
  onTogglePaidTxn: (txn: BillingGroup["transactions"][0], isPaidForPeriod: boolean) => void;
}

export function PaidStatementsSection({
  groups,
  onPressTxn,
  onDeleteTxn,
  onTogglePaidTxn,
}: PaidStatementsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (groups.length === 0) return null;

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 active:bg-slate-800"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-done-circle" size={16} color="#34d399" />
          <Text className="text-slate-300 text-sm font-semibold">Paid Statements</Text>
          <View className="bg-emerald-900/60 border border-emerald-700 rounded-full px-2 py-0.5">
            <Text className="text-emerald-400 text-xs font-semibold">{groups.length}</Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#64748b"
        />
      </Pressable>

      {expanded &&
        groups.map((group) => {
          const cardBgClass = CARD_COLOR_BG_MAP[group.card.color];
          const statementTotal = group.transactions.reduce(
            (sum, t) =>
              sum + (t.is_installment && t.monthly_amount ? t.monthly_amount : t.amount),
            0
          );
          return (
            <View key={group.key} className="gap-1.5 opacity-60">
              <View className="rounded-xl border border-emerald-900/60 overflow-hidden">
                <View className={`h-1.5 ${cardBgClass}`} />
                <View className="px-4 py-3 gap-3">
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
                    <View className="flex-row items-center gap-1.5 bg-emerald-950/50 border border-emerald-700 rounded-lg px-2 py-1">
                      <Ionicons name="checkmark-done" size={12} color="#34d399" />
                      <Text className="text-emerald-400 text-xs font-bold">PAID</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 bg-slate-800/80 rounded-lg px-3 py-2 gap-0.5">
                      <Text className="text-slate-500 text-xs">Statement closes</Text>
                      <Text className="text-white text-xs font-semibold">
                        {format(group.statementDate, DATE_FORMAT)}
                      </Text>
                    </View>
                    <View className="flex-1 bg-slate-800/80 rounded-lg px-3 py-2 gap-0.5">
                      <Text className="text-slate-500 text-xs">Payment due</Text>
                      <Text className="text-white text-xs font-semibold">
                        {format(group.billingDate, DATE_FORMAT)}
                      </Text>
                    </View>
                  </View>

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
                  </View>
                </View>
              </View>

              {group.transactions.map((txn) => {
                const isPaidForPeriod = txn.is_installment
                  ? (txn.installment_payments?.some(
                      (p) => p.period_key === group.periodKey
                    ) ?? false)
                  : txn.is_paid;
                return (
                  <TransactionItem
                    key={`${txn.id}-${group.periodKey}`}
                    transaction={txn}
                    isOverdue={false}
                    isPaidForPeriod={isPaidForPeriod}
                    onPress={() => onPressTxn(txn)}
                    onDelete={() => onDeleteTxn(txn)}
                    onTogglePaid={() => onTogglePaidTxn(txn, isPaidForPeriod)}
                  />
                );
              })}
            </View>
          );
        })}
    </View>
  );
}
