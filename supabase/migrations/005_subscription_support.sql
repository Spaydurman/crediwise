-- ============================================================
-- CrediWise — Subscription Support
-- Run this in your Supabase SQL Editor
-- ============================================================

alter table public.transactions
  add column if not exists is_subscription boolean not null default false,
  add column if not exists subscription_active boolean not null default true,
  add column if not exists subscription_inactive_at date default null;

create index if not exists transactions_is_subscription_idx
  on public.transactions(is_subscription);

create index if not exists transactions_subscription_active_idx
  on public.transactions(subscription_active)
  where is_subscription = true;