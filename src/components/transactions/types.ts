import type { CreditCard, Transaction } from "../../types";

export interface BillingGroup {
  key: string;
  periodKey: string;
  card: CreditCard;
  statementDate: Date;
  billingDate: Date;
  isOverdue: boolean;
  isDueSoon: boolean;
  transactions: Transaction[];
}
