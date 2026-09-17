create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  birth_date date,
  start_weight_kg numeric(5,2) check (start_weight_kg between 25 and 400),
  target_weight_kg numeric(5,2) check (target_weight_kg between 25 and 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  run_date date not null,
  distance_km numeric(6,2) not null check (distance_km > 0 and distance_km <= 500),
  duration_seconds integer not null check (duration_seconds > 0),
  avg_heart_rate integer not null check (avg_heart_rate between 30 and 240),
  perceived_effort smallint check (perceived_effort between 1 and 10),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now()
);

create table public.run_splits (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  kilometer numeric(6,2) not null check (kilometer > 0),
  split_seconds integer not null check (split_seconds between 60 and 3600),
  heart_rate integer not null check (heart_rate between 30 and 240),
  created_at timestamptz not null default now(),
  unique (run_id, kilometer)
);

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(5,2) not null check (weight_kg between 25 and 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, entry_date)
);

create index athletes_name_idx on public.athletes (name);
create index runs_athlete_date_idx on public.runs (athlete_id, run_date desc);
create index run_splits_run_idx on public.run_splits (run_id, kilometer);
create index weight_entries_athlete_date_idx on public.weight_entries (athlete_id, entry_date desc);

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.runs enable row level security;
alter table public.run_splits enable row level security;
alter table public.weight_entries enable row level security;

create policy "Authenticated users share profiles" on public.profiles
  for all to authenticated using (true) with check (true);
create policy "Authenticated users share athletes" on public.athletes
  for all to authenticated using (true) with check (true);
create policy "Authenticated users share runs" on public.runs
  for all to authenticated using (true) with check (true);
create policy "Authenticated users share splits" on public.run_splits
  for all to authenticated using (true) with check (true);
create policy "Authenticated users share weights" on public.weight_entries
  for all to authenticated using (true) with check (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.touch_updated_at();
create trigger athletes_updated_at before update on public.athletes
for each row execute procedure public.touch_updated_at();
create trigger weight_entries_updated_at before update on public.weight_entries
for each row execute procedure public.touch_updated_at();

grant usage on schema public to anon, authenticated;
grant all on public.profiles, public.athletes, public.runs, public.run_splits, public.weight_entries to authenticated;
