import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BillingGroupHeader } from "./BillingGroupHeader";
import { getBillingGroupSummary } from "./summary";
import { TransactionItem } from "./TransactionItem";
import type { BillingGroup } from "./types";

interface PaidStatementsSectionProps {
  groups: BillingGroup[];
  onPressTxn: (txn: BillingGroup["transactions"][0]) => void;
  onDeleteTxn: (txn: BillingGroup["transactions"][0]) => void;
  onTogglePaidTxn: (txn: BillingGroup["transactions"][0], isPaidForPeriod: boolean) => void;
}

interface PaidStatementCardProps {
  group: BillingGroup;
  onPressTxn: PaidStatementsSectionProps["onPressTxn"];
  onDeleteTxn: PaidStatementsSectionProps["onDeleteTxn"];
  onTogglePaidTxn: PaidStatementsSectionProps["onTogglePaidTxn"];
}

function PaidStatementCard({
  group,
  onPressTxn,
  onDeleteTxn,
  onTogglePaidTxn,
}: PaidStatementCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { itemCount, statementTotal, statementSaved, statementShortage } =
    getBillingGroupSummary(group);

  return (
    <View className="gap-1.5 opacity-60">
      <BillingGroupHeader
        group={group}
        itemCount={itemCount}
        statementTotal={statementTotal}
        statementSaved={statementSaved}
        statementShortage={statementShortage}
        allPaid
        expanded={expanded}
        onToggleExpanded={() => setExpanded((value) => !value)}
      />

      {expanded &&
        group.transactions.map((txn) => {
          const isPaidForPeriod = txn.is_installment
            ? (txn.installment_payments?.some(
                (payment) => payment.period_key === group.periodKey
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
        groups.map((group) => (
          <PaidStatementCard
            key={group.key}
            group={group}
            onPressTxn={onPressTxn}
            onDeleteTxn={onDeleteTxn}
            onTogglePaidTxn={onTogglePaidTxn}
          />
        ))}
    </View>
  );
}
