create table if not exists public.player_stats (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  player_name text not null default 'Player',
  score integer not null default 0,
  xp integer not null default 0,
  diamonds integer not null default 0,
  streak integer not null default 0,
  last_daily_reward_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_stats enable row level security;

create policy "read own player stats"
  on public.player_stats for select
  using (auth.uid() = user_id);

create policy "insert own player stats"
  on public.player_stats for insert
  with check (auth.uid() = user_id);

create policy "update own player stats"
  on public.player_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.get_leaderboard(limit_count integer default 10)
returns table (
  player_name text,
  score integer,
  xp integer,
  diamonds integer,
  streak integer
)
language sql
security definer
set search_path = public
as $$
  select
    player_stats.player_name,
    player_stats.score,
    player_stats.xp,
    player_stats.diamonds,
    player_stats.streak
  from public.player_stats
  order by player_stats.xp desc, player_stats.score desc, player_stats.streak desc, player_stats.updated_at asc
  limit greatest(1, least(limit_count, 50));
$$;

grant execute on function public.get_leaderboard(integer) to anon, authenticated;
