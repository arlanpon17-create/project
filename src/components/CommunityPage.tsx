import { useCallback, useEffect, useState } from 'react';
import {
  acceptFriendRequest, findProfiles, loadCommunity, removeFriendship,
  saveProfile, sendFriendRequest, type Friendship, type PlayerProfile,
} from '../lib/community';
import { supabase } from '../lib/supabase';

type Props = { userId: string; displayName: string; avatarUrl: string; onSignIn: () => void };

export default function CommunityPage({ userId, displayName, avatarUrl, onSignIn }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [friends, setFriends] = useState<{ friendships: Friendship[]; profiles: PlayerProfile[] }>({ friendships: [], profiles: [] });
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PlayerProfile[]>([]);
  const [message, setMessage] = useState('Loading your account…');

  const refreshFriends = useCallback(async () => {
    setFriends(await loadCommunity(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void Promise.all([
      supabaseProfile(userId), loadCommunity(userId),
    ]).then(([ownProfile, community]) => {
      if (!active) return;
      const profileData = ownProfile ?? {
        user_id: userId,
        username: displayName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) || `player${userId.slice(0, 6)}`,
        display_name: displayName,
        bio: '',
        avatar_url: avatarUrl,
      };
      setProfile(profileData);
      setFriends(community);
      setMessage('');
      if (!ownProfile) void saveProfile(profileData).catch(() => setMessage('Set up your account profile after the database migration is applied.'));
    }).catch(() => setMessage('Could not load accounts. Check your Supabase connection and apply the migration.'));
    return () => { active = false; };
  }, [avatarUrl, displayName, userId]);

  if (!userId) return <section className="menu-panel community-page"><h2>Account & Friends</h2><p>Sign in with Google to create a public player profile, find friends, and challenge them to chess.</p><button type="button" onClick={onSignIn}>Sign in with Google</button></section>;

  async function searchPlayers(event: React.FormEvent) {
    event.preventDefault();
    try {
      setResults(await findProfiles(search.trim(), userId));
      setMessage('');
    } catch {
      setMessage('Could not search accounts.');
    }
  }

  async function runAction(action: () => Promise<void>, success: string) {
    try {
      await action();
      await refreshFriends();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not complete that action.');
    }
  }

  if (!profile) return <section className="menu-panel"><p role="status">{message}</p></section>;
  const friendsById = new Map(friends.profiles.map((item) => [item.user_id, item]));
  const relationships = new Map(friends.friendships.map((item) => [
    item.requester_id === userId ? item.recipient_id : item.requester_id, item,
  ]));

  return (
    <section className="menu-panel community-page" aria-label="Account and friends">
      <p className="eyebrow">Your account</p><h2>{profile.display_name}</h2>
      <form className="community-profile-form" onSubmit={(event) => {
        event.preventDefault();
        void runAction(() => saveProfile(profile), 'Profile saved.');
      }}>
        <label>Username<input value={profile.username} minLength={2} maxLength={24} onChange={(event) => setProfile({ ...profile, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} required /></label>
        <label>Display name<input value={profile.display_name} maxLength={40} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} required /></label>
        <label>About you<textarea value={profile.bio} maxLength={180} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /></label>
        <button type="submit">Save account</button>
      </form>
      <h3>Find players</h3>
      <form className="community-search" onSubmit={(event) => void searchPlayers(event)}>
        <input aria-label="Search usernames" placeholder="Search by username" value={search} onChange={(event) => setSearch(event.target.value)} />
        <button type="submit" disabled={!search.trim()}>Search</button>
      </form>
      {results.map((player) => {
        const relationship = relationships.get(player.user_id);
        return <article className="community-player" key={player.user_id}>
          <strong>{player.display_name} <small>@{player.username}</small></strong><p>{player.bio || 'No bio yet.'}</p>
          {relationship?.status === 'accepted' ? <span>Friend</span>
            : relationship ? <span>{relationship.requester_id === userId ? 'Request sent' : 'Request received'}</span>
              : <button type="button" onClick={() => void runAction(() => sendFriendRequest(userId, player.user_id), 'Friend request sent.')}>Add friend</button>}
        </article>;
      })}
      <h3>Friends and requests</h3>
      {friends.friendships.length === 0 && <p>No friends yet. Search for a username to add someone.</p>}
      {friends.friendships.map((friendship) => {
        const otherId = friendship.requester_id === userId ? friendship.recipient_id : friendship.requester_id;
        const player = friendsById.get(otherId);
        const incoming = friendship.recipient_id === userId && friendship.status === 'pending';
        return <article className="community-player" key={friendship.id}>
          <strong>{player?.display_name ?? 'Player'} <small>@{player?.username ?? 'unknown'}</small></strong>
          {player?.bio && <p>{player.bio}</p>}
          {incoming ? <button type="button" onClick={() => void runAction(() => acceptFriendRequest(friendship.id), 'Friend request accepted.')}>Accept</button>
            : friendship.status === 'pending' ? <span>Request sent</span>
              : <span>Friend</span>}
          <button className="secondary" type="button" onClick={() => void runAction(() => removeFriendship(friendship.id), 'Friend removed.')}>Remove</button>
        </article>;
      })}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

async function supabaseProfile(userId: string) {
  const { data, error } = await supabase.from('player_profiles')
    .select('user_id, username, display_name, bio, avatar_url').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as PlayerProfile | null;
}
