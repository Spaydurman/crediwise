-- ============================================================
-- CrediWise — Add statement_date to credit_cards
-- Run this in your Supabase SQL Editor
-- ============================================================

-- statement_date: day of month when the billing statement closes (cut-off date).
-- billing_cycle_date: day of month when payment is due (already exists).
-- Limit to 28 so the day is always valid even in February.
alter table public.credit_cards
  add column if not exists statement_date smallint default null
  check (statement_date is null or statement_date between 1 and 28);
