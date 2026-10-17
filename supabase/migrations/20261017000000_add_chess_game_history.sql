create table if not exists public.chess_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode text not null check (mode in ('trainer', 'local', 'online')),
  result text not null,
  pgn text not null,
  white_points integer not null default 0 check (white_points >= 0),
  black_points integer not null default 0 check (black_points >= 0),
  played_at timestamptz not null default now()
);

alter table public.chess_games enable row level security;

create policy "read own chess games"
  on public.chess_games for select
  using (auth.uid() = user_id);

create policy "insert own chess games"
  on public.chess_games for insert
  with check (auth.uid() = user_id);
