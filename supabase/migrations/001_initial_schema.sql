-- ============================================================
-- CrediWise — Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid        references auth.users on delete cascade primary key,
  full_name  text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── Credit Cards ──────────────────────────────────────────────
create table if not exists public.credit_cards (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references auth.users on delete cascade not null,
  name                text        not null,
  bank                text        not null,
  last_four_digits    char(4),
  credit_limit        numeric(12, 2) not null default 0,
  billing_cycle_date  smallint    not null default 1 check (billing_cycle_date between 1 and 31),
  color               text        not null default 'indigo',
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

alter table public.credit_cards enable row level security;

create policy "Users can manage their own credit cards"
  on public.credit_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists credit_cards_user_id_idx on public.credit_cards(user_id);


-- ── Transactions ──────────────────────────────────────────────
create table if not exists public.transactions (
  id               uuid        default gen_random_uuid() primary key,
  card_id          uuid        references public.credit_cards on delete cascade not null,
  user_id          uuid        references auth.users on delete cascade not null,
  description      text        not null,
  amount           numeric(12, 2) not null check (amount > 0),
  category         text        not null default 'Others',
  transaction_date date        not null,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

alter table public.transactions enable row level security;

create policy "Users can manage their own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists transactions_user_id_idx     on public.transactions(user_id);
create index if not exists transactions_card_id_idx     on public.transactions(card_id);
create index if not exists transactions_date_idx        on public.transactions(transaction_date desc);


-- ── Savings ───────────────────────────────────────────────────
create table if not exists public.savings (
  id             uuid        default gen_random_uuid() primary key,
  transaction_id uuid        references public.transactions on delete cascade not null,
  user_id        uuid        references auth.users on delete cascade not null,
  amount         numeric(12, 2) not null check (amount > 0),
  notes          text,
  saved_date     date        not null,
  created_at     timestamptz default now() not null
);

alter table public.savings enable row level security;

create policy "Users can manage their own savings"
  on public.savings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists savings_user_id_idx        on public.savings(user_id);
create index if not exists savings_transaction_id_idx on public.savings(transaction_id);


-- ── Updated-at trigger helper ─────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger credit_cards_updated_at
  before update on public.credit_cards
  for each row execute function public.set_updated_at();

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
