import type { BillingGroup } from "./types";

export interface BillingGroupSummary {
  itemCount: number;
  statementTotal: number;
  statementSaved: number;
  statementShortage: number;
}

export function getStatementTransactionAmount(
  transaction: BillingGroup["transactions"][number]
) {
  return transaction.is_installment && transaction.monthly_amount
    ? transaction.monthly_amount
    : transaction.amount;
}

export function getTransactionSavedAmount(
  transaction: BillingGroup["transactions"][number]
) {
  return transaction.total_saved ?? 0;
}

export function getTransactionRemainingAmount(
  transaction: BillingGroup["transactions"][number]
) {
  return transaction.remaining ?? Math.max(
    0,
    getStatementTransactionAmount(transaction) - getTransactionSavedAmount(transaction)
  );
}

export function getBillingGroupSummary(group: BillingGroup): BillingGroupSummary {
  return group.transactions.reduce<BillingGroupSummary>(
    (summary, transaction) => {
      const trackableAmount = getStatementTransactionAmount(transaction);

      return {
        itemCount: summary.itemCount + 1,
        statementTotal: summary.statementTotal + trackableAmount,
        statementSaved: summary.statementSaved + getTransactionSavedAmount(transaction),
        statementShortage:
          summary.statementShortage + getTransactionRemainingAmount(transaction),
      };
    },
    {
      itemCount: 0,
      statementTotal: 0,
      statementSaved: 0,
      statementShortage: 0,
    }
  );
}