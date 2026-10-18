create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 24),
  display_name text not null,
  bio text not null default '' check (char_length(bio) <= 180),
  avatar_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;
create policy "profiles are visible to everyone" on public.player_profiles
  for select using (true);
create policy "users create their profile" on public.player_profiles
  for insert with check (auth.uid() = user_id);
create policy "users update their profile" on public.player_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint friendship_not_self check (requester_id <> recipient_id),
  constraint friendship_pair_unique unique (requester_id, recipient_id)
);

alter table public.friendships enable row level security;
create policy "users see their friendships" on public.friendships
  for select using (auth.uid() in (requester_id, recipient_id));
create policy "users send friend requests" on public.friendships
  for insert with check (auth.uid() = requester_id and status = 'pending');
create policy "users remove their friendships" on public.friendships
  for delete using (auth.uid() in (requester_id, recipient_id));

create or replace function public.accept_friend_request(request_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.friendships
  set status = 'accepted'
  where id = request_id
    and recipient_id = auth.uid()
    and status = 'pending';
$$;

revoke all on function public.accept_friend_request(uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;
