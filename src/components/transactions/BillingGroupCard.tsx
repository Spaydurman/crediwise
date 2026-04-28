import { useState } from "react";
import { View } from "react-native";
import { TransactionItem } from "./TransactionItem";
import { BillingGroupHeader } from "./BillingGroupHeader";
import type { BillingGroup } from "./types";

interface BillingGroupCardProps {
  group: BillingGroup;
  onPayAll: (
    regularIds: string[],
    installmentItems: { transactionId: string; periodKey: string }[]
  ) => Promise<void> | void;
  onPressTxn: (txn: BillingGroup["transactions"][0]) => void;
  onDeleteTxn: (txn: BillingGroup["transactions"][0]) => void;
  onTogglePaidTxn: (txn: BillingGroup["transactions"][0], isPaidForPeriod: boolean) => void;
}

export function BillingGroupCard({
  group,
  onPayAll,
  onPressTxn,
  onDeleteTxn,
  onTogglePaidTxn,
}: BillingGroupCardProps) {
  const [paying, setPaying] = useState(false);

  const statementTotal = group.transactions.reduce(
    (sum, t) =>
      sum + (t.is_installment && t.monthly_amount ? t.monthly_amount : t.amount),
    0
  );
  const unpaidRegularIds = group.transactions
    .filter((t) => !t.is_installment && !t.is_paid)
    .map((t) => t.id);
  const unpaidInstallmentItems = group.transactions
    .filter(
      (t) =>
        t.is_installment &&
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
        statementTotal={statementTotal}
        allPaid={allPaid}
        paying={paying}
        onPayAll={handlePayAll}
      />
      {group.transactions.map((txn) => {
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
          />
        );
      })}
    </View>
  );
}
