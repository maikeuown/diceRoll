-- The 100-Dice Gauntlet: Database Schema
-- Run this in the Supabase SQL Editor

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  total_score bigint default 0,
  last_drop timestamptz,
  active_skin text default 'matte' check (active_skin in ('neon', 'glass', 'matte', 'gold'))
);

-- Drops history table
create table if not exists public.drops (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  score int not null,
  dice_values int[] not null,
  dropped_at timestamptz default now()
);

-- Indexes for leaderboard performance
create index if not exists idx_profiles_total_score_desc on public.profiles(total_score desc);
create index if not exists idx_drops_user_dropped on public.drops(user_id, dropped_at desc);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.drops enable row level security;

-- Profiles: anyone can read (leaderboard), only owner can update
create policy "Public read access" on public.profiles for select using (true);
create policy "Owner update access" on public.profiles for update using (auth.uid() = id);

-- Drops: owner can insert, anyone can read
create policy "Owner insert access" on public.drops for insert with check (auth.uid() = user_id);
create policy "Public read access" on public.drops for select using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(split_part(new.email, '@', 1), 'user_' || left(new.id::text, 8)));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Monthly score reset function (called by cron)
create or replace function public.reset_monthly_scores()
returns void as $$
begin
  update public.profiles set total_score = 0;
end;
$$ language plpgsql security definer;
