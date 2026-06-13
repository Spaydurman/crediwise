import { useState } from "react";
import { View } from "react-native";
import { TransactionItem } from "./TransactionItem";
import { BillingGroupHeader } from "./BillingGroupHeader";
import { getBillingGroupSummary } from "./summary";
import type { BillingGroup } from "./types";

interface BillingGroupCardProps {
  group: BillingGroup;
  onPayAll: (
    regularIds: string[],
    installmentItems: { transactionId: string; periodKey: string }[]
  ) => Promise<void> | void;
  onSaveAll?: (group: BillingGroup) => Promise<void> | void;
  onPressTxn: (txn: BillingGroup["transactions"][0]) => void;
  onDeleteTxn: (txn: BillingGroup["transactions"][0]) => void;
  onTogglePaidTxn: (txn: BillingGroup["transactions"][0], isPaidForPeriod: boolean) => void;
  onSaveTxn?: (txn: BillingGroup["transactions"][0]) => void;
  onWithdrawTxn?: (txn: BillingGroup["transactions"][0]) => void;
  savingAll?: boolean;
  savingTransactionIds?: string[];
  withdrawingTransactionIds?: string[];
}

export function BillingGroupCard({
  group,
  onPayAll,
  onSaveAll,
  onPressTxn,
  onDeleteTxn,
  onTogglePaidTxn,
  onSaveTxn,
  onWithdrawTxn,
  savingAll = false,
  savingTransactionIds = [],
  withdrawingTransactionIds = [],
}: BillingGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);

  const { itemCount, statementTotal, statementSaved, statementShortage } =
    getBillingGroupSummary(group);
  const allSaved = statementShortage <= 0;
  const unpaidRegularIds = group.transactions
    .filter((t) => !t.is_installment && !t.is_subscription && !t.is_paid)
    .map((t) => t.id);
  const unpaidInstallmentItems = group.transactions
    .filter(
      (t) =>
        (t.is_installment || t.is_subscription) &&
        !t.installment_payments?.some((p) => p.period_key === group.periodKey)
    )
    .map((t) => ({ transactionId: t.id, periodKey: group.periodKey }));
  const allPaid = unpaidRegularIds.length === 0 && unpaidInstallmentItems.length === 0;

  const handlePayAll = async () => {
    setPaying(true);
    try {
      await onPayAll(unpaidRegularIds, unpaidInstallmentItems);
    } finally {
      setPaying(false);
    }
  };

  return (
    <View className="gap-1.5">
      <BillingGroupHeader
        group={group}
        itemCount={itemCount}
        statementTotal={statementTotal}
        statementSaved={statementSaved}
        statementShortage={statementShortage}
        allPaid={allPaid}
        allSaved={allSaved}
        paying={paying}
        savingAll={savingAll}
        onPayAll={handlePayAll}
        onSaveAll={onSaveAll ? () => onSaveAll(group) : undefined}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((value) => !value)}
      />
      {expanded &&
        group.transactions.map((txn) => {
        const isPaidForPeriod = txn.is_installment
          ? (txn.installment_payments?.some((p) => p.period_key === group.periodKey) ?? false)
          : txn.is_paid;
        return (
          <TransactionItem
            key={`${txn.id}-${group.periodKey}`}
            transaction={txn}
            isOverdue={group.isOverdue}
            isPaidForPeriod={isPaidForPeriod}
            onPress={() => onPressTxn(txn)}
            onDelete={() => onDeleteTxn(txn)}
            onTogglePaid={() => onTogglePaidTxn(txn, isPaidForPeriod)}
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
