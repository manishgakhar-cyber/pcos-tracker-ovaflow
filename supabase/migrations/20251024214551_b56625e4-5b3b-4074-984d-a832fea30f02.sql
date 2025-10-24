-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PCOS assessments
create table if not exists public.pcos_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_data jsonb not null,
  risk_score integer,
  risk_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daily symptom logs
create table if not exists public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  symptoms text[],
  flow_intensity text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

-- Cycle tracking
create table if not exists public.cycle_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start_date date not null,
  period_end_date date,
  cycle_length integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.pcos_assessments enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.cycle_data enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their profile" on public.profiles;
drop policy if exists "Users can insert their profile" on public.profiles;
drop policy if exists "Users can update their profile" on public.profiles;
drop policy if exists "Users view own assessments" on public.pcos_assessments;
drop policy if exists "Users insert own assessments" on public.pcos_assessments;
drop policy if exists "Users update own assessments" on public.pcos_assessments;
drop policy if exists "Users delete own assessments" on public.pcos_assessments;
drop policy if exists "Users view own symptom logs" on public.symptom_logs;
drop policy if exists "Users insert own symptom logs" on public.symptom_logs;
drop policy if exists "Users update own symptom logs" on public.symptom_logs;
drop policy if exists "Users delete own symptom logs" on public.symptom_logs;
drop policy if exists "Users view own cycle data" on public.cycle_data;
drop policy if exists "Users insert own cycle data" on public.cycle_data;
drop policy if exists "Users update own cycle data" on public.cycle_data;
drop policy if exists "Users delete own cycle data" on public.cycle_data;

-- Basic owner-only policies
create policy "Users can view their profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

create policy "Users view own assessments"
  on public.pcos_assessments
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own assessments"
  on public.pcos_assessments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own assessments"
  on public.pcos_assessments
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users delete own assessments"
  on public.pcos_assessments
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users view own symptom logs"
  on public.symptom_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own symptom logs"
  on public.symptom_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own symptom logs"
  on public.symptom_logs
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users delete own symptom logs"
  on public.symptom_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users view own cycle data"
  on public.cycle_data
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own cycle data"
  on public.cycle_data
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own cycle data"
  on public.cycle_data
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users delete own cycle data"
  on public.cycle_data
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Drop existing triggers if they exist
drop trigger if exists update_profiles_updated_at on public.profiles;
drop trigger if exists update_pcos_assessments_updated_at on public.pcos_assessments;
drop trigger if exists update_symptom_logs_updated_at on public.symptom_logs;
drop trigger if exists update_cycle_data_updated_at on public.cycle_data;
drop trigger if exists on_auth_user_created on auth.users;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_pcos_assessments_updated_at
  before update on public.pcos_assessments
  for each row execute function public.update_updated_at_column();

create trigger update_symptom_logs_updated_at
  before update on public.symptom_logs
  for each row execute function public.update_updated_at_column();

create trigger update_cycle_data_updated_at
  before update on public.cycle_data
  for each row execute function public.update_updated_at_column();

-- Handle new user to create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();