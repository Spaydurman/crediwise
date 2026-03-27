export type CardColor =
  | "indigo"
  | "violet"
  | "sky"
  | "emerald"
  | "rose"
  | "amber"
  | "slate"
  | "fuchsia";

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  last_four_digits: string | null;
  credit_limit: number;
  billing_cycle_date: number;
  color: CardColor;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  card_id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  credit_card?: Pick<CreditCard, "name" | "bank" | "color" | "last_four_digits">;
  savings?: Saving[];
  total_saved?: number;
  remaining?: number;
  is_fully_saved?: boolean;
}

export interface Saving {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  notes: string | null;
  saved_date: string;
  created_at: string;
  transaction?: Pick<Transaction, "description" | "amount">;
}

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_spending: number;
  total_saved: number;
  total_remaining: number;
  cards_count: number;
  transactions_count: number;
  fully_saved_count: number;
}

export interface AddCardInput {
  name: string;
  bank: string;
  last_four_digits: string | null;
  credit_limit: number;
  billing_cycle_date: number;
  color: CardColor;
}

export interface AddTransactionInput {
  card_id: string;
  description: string;
  amount: number;
  category: string;
  transaction_date: string;
}

export interface AddSavingInput {
  transaction_id: string;
  amount: number;
  notes: string;
  saved_date: string;
}
