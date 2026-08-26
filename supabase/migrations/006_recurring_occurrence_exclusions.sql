-- Allow one generated recurring occurrence to be hidden without deleting its
-- parent transaction (and therefore all future occurrences).
create table if not exists public.recurring_occurrence_exclusions (
  id             uuid        primary key default gen_random_uuid(),
  transaction_id uuid        references public.transactions on delete cascade not null,
  user_id        uuid        references auth.users on delete cascade not null,
  period_key     text        not null,
  created_at     timestamptz default now() not null,
  constraint recurring_occurrence_exclusions_unique unique (transaction_id, period_key)
);

alter table public.recurring_occurrence_exclusions enable row level security;

create policy "Users can manage their own recurring occurrence exclusions"
  on public.recurring_occurrence_exclusions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists recurring_occurrence_exclusions_transaction_idx
  on public.recurring_occurrence_exclusions(transaction_id);

create index if not exists recurring_occurrence_exclusions_user_idx
  on public.recurring_occurrence_exclusions(user_id);
