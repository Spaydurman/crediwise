-- ============================================================
-- CrediWise — Per-Period Installment Payment Tracking
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Tracks which billing-period payment has been made for each installment transaction.
-- period_key matches the periodKey produced by getBillingPeriod() (YYYY-MM-DD of statement close).

create table if not exists public.installment_payments (
  id             uuid        default gen_random_uuid() primary key,
  transaction_id uuid        references public.transactions on delete cascade not null,
  user_id        uuid        references auth.users on delete cascade not null,
  period_key     text        not null,
  created_at     timestamptz default now() not null,
  constraint installment_payments_unique unique (transaction_id, period_key)
);

alter table public.installment_payments enable row level security;

create policy "Users can manage their installment payments"
  on public.installment_payments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists installment_payments_txn_idx  on public.installment_payments(transaction_id);
create index if not exists installment_payments_user_idx on public.installment_payments(user_id);
