import { supabase } from './supabase';

export type PlayerProfile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted';
};

export async function saveProfile(profile: PlayerProfile) {
  const { error } = await supabase.from('player_profiles').upsert({
    ...profile,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function findProfiles(username: string, ownId: string) {
  const { data, error } = await supabase.from('player_profiles')
    .select('user_id, username, display_name, bio, avatar_url')
    .ilike('username', `%${username}%`)
    .neq('user_id', ownId)
    .limit(15);
  if (error) throw error;
  return (data ?? []) as PlayerProfile[];
}

export async function loadCommunity(userId: string) {
  const { data, error } = await supabase.from('friendships')
    .select('id, requester_id, recipient_id, status')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);
  if (error) throw error;
  const friendships = (data ?? []) as Friendship[];
  const otherIds = [...new Set(friendships.map((friendship) => (
    friendship.requester_id === userId ? friendship.recipient_id : friendship.requester_id
  )))];
  if (otherIds.length === 0) return { friendships, profiles: [] as PlayerProfile[] };
  const result = await supabase.from('player_profiles')
    .select('user_id, username, display_name, bio, avatar_url')
    .in('user_id', otherIds);
  if (result.error) throw result.error;
  return { friendships, profiles: (result.data ?? []) as PlayerProfile[] };
}

export async function sendFriendRequest(requesterId: string, recipientId: string) {
  const existing = await supabase.from('friendships').select('id')
    .or(`and(requester_id.eq.${requesterId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${requesterId})`)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) throw new Error('A friend request or friendship already exists.');
  const { error } = await supabase.from('friendships').insert({ requester_id: requesterId, recipient_id: recipientId });
  if (error) throw error;
}

export async function acceptFriendRequest(id: string) {
  const { error } = await supabase.rpc('accept_friend_request', { request_id: id });
  if (error) throw error;
}

export async function removeFriendship(id: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', id);
  if (error) throw error;
}
