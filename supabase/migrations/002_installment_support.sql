-- ============================================================
-- CrediWise — Installment & Paid Support
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add installment columns to transactions
alter table public.transactions
  add column if not exists is_installment    boolean        not null default false,
  add column if not exists installment_months smallint      default null,
  add column if not exists monthly_amount    numeric(12, 2) default null,
  add column if not exists is_paid           boolean        not null default false;

-- Add constraint: installment_months must be > 0 when set
alter table public.transactions
  add constraint chk_installment_months
  check (installment_months is null or installment_months > 0);

-- Add constraint: monthly_amount must be > 0 when set
alter table public.transactions
  add constraint chk_monthly_amount
  check (monthly_amount is null or monthly_amount > 0);

-- Index for filtering by payment status
create index if not exists transactions_is_paid_idx on public.transactions(is_paid);
