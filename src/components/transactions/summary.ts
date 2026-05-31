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

export function getBillingGroupSummary(group: BillingGroup): BillingGroupSummary {
  return group.transactions.reduce<BillingGroupSummary>(
    (summary, transaction) => {
      const trackableAmount = getStatementTransactionAmount(transaction);

      return {
        itemCount: summary.itemCount + 1,
        statementTotal: summary.statementTotal + trackableAmount,
        statementSaved: summary.statementSaved + (transaction.total_saved ?? 0),
        statementShortage:
          summary.statementShortage + (transaction.remaining ?? trackableAmount),
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