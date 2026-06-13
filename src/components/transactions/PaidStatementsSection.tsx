import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BillingGroupHeader } from "./BillingGroupHeader";
import { getBillingGroupSummary } from "./summary";
import { TransactionItem } from "./TransactionItem";
import type { BillingGroup } from "./types";

interface PaidStatementsSectionProps {
  groups: BillingGroup[];
  onSaveAll?: (group: BillingGroup) => Promise<void> | void;
  onPressTxn: (txn: BillingGroup["transactions"][0]) => void;
  onDeleteTxn: (txn: BillingGroup["transactions"][0]) => void;
  onTogglePaidTxn: (
    txn: BillingGroup["transactions"][0],
    group: BillingGroup,
    isPaidForPeriod: boolean
  ) => void;
  onSaveTxn?: (txn: BillingGroup["transactions"][0]) => void;
  onWithdrawTxn?: (txn: BillingGroup["transactions"][0]) => void;
  savingGroupKey?: string | null;
  savingTransactionIds?: string[];
  withdrawingTransactionIds?: string[];
}

interface PaidStatementCardProps {
  group: BillingGroup;
  onSaveAll?: PaidStatementsSectionProps["onSaveAll"];
  onPressTxn: PaidStatementsSectionProps["onPressTxn"];
  onDeleteTxn: PaidStatementsSectionProps["onDeleteTxn"];
  onTogglePaidTxn: PaidStatementsSectionProps["onTogglePaidTxn"];
  onSaveTxn?: PaidStatementsSectionProps["onSaveTxn"];
  onWithdrawTxn?: PaidStatementsSectionProps["onWithdrawTxn"];
  savingGroupKey?: string | null;
  savingTransactionIds?: string[];
  withdrawingTransactionIds?: string[];
}

function PaidStatementCard({
  group,
  onSaveAll,
  onPressTxn,
  onDeleteTxn,
  onTogglePaidTxn,
  onSaveTxn,
  onWithdrawTxn,
  savingGroupKey,
  savingTransactionIds = [],
  withdrawingTransactionIds = [],
}: PaidStatementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { itemCount, statementTotal, statementSaved, statementShortage } =
    getBillingGroupSummary(group);
  const allSaved = statementShortage <= 0;

  return (
    <View className="gap-1.5">
      <BillingGroupHeader
        group={group}
        itemCount={itemCount}
        statementTotal={statementTotal}
        statementSaved={statementSaved}
        statementShortage={statementShortage}
        allPaid
        allSaved={allSaved}
        savingAll={savingGroupKey === group.key}
        onSaveAll={onSaveAll ? () => onSaveAll(group) : undefined}
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
              onTogglePaid={() => onTogglePaidTxn(txn, group, isPaidForPeriod)}
              onSave={onSaveTxn ? () => onSaveTxn(txn) : undefined}
              onWithdraw={onWithdrawTxn ? () => onWithdrawTxn(txn) : undefined}
              saving={savingTransactionIds.includes(txn.id)}
              withdrawing={withdrawingTransactionIds.includes(txn.id)}
            />
          );
        })}
    </View>
  );
}

export function PaidStatementsSection({
  groups,
  onSaveAll,
  onPressTxn,
  onDeleteTxn,
  onTogglePaidTxn,
  onSaveTxn,
  onWithdrawTxn,
  savingGroupKey = null,
  savingTransactionIds = [],
  withdrawingTransactionIds = [],
}: PaidStatementsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (groups.length === 0) return null;

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 active:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:active:bg-slate-800"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-done-circle" size={16} color="#047857" />
          <Text className="text-slate-800 dark:text-slate-300 text-sm font-semibold">Paid Statements</Text>
          <View className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/60 dark:border-emerald-700 rounded-full px-2 py-0.5">
            <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">{groups.length}</Text>
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
            onSaveAll={onSaveAll}
            onPressTxn={onPressTxn}
            onDeleteTxn={onDeleteTxn}
            onTogglePaidTxn={onTogglePaidTxn}
            onSaveTxn={onSaveTxn}
            onWithdrawTxn={onWithdrawTxn}
            savingGroupKey={savingGroupKey}
            savingTransactionIds={savingTransactionIds}
            withdrawingTransactionIds={withdrawingTransactionIds}
          />
        ))}
    </View>
  );
}
