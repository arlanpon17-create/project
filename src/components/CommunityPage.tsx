import { useCallback, useEffect, useState } from 'react';
import {
  acceptFriendRequest, deletePreviousAvatar, findProfiles, loadCommunity,
  removeFriendship, saveProfile, sendFriendRequest, type Friendship,
  type PlayerProfile, uploadProfileAvatar,
} from '../lib/community';
import { supabase } from '../lib/supabase';
import CommunityAvatar from './CommunityAvatar';

type Props = { userId: string; displayName: string; avatarUrl: string; onSignIn: () => void; onAvatarChanged: (url: string) => void };

export default function CommunityPage({ userId, displayName, avatarUrl, onSignIn, onAvatarChanged }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [friends, setFriends] = useState<{ friendships: Friendship[]; profiles: PlayerProfile[] }>({ friendships: [], profiles: [] });
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PlayerProfile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
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
      const profileData = ownProfile ? {
        ...ownProfile,
        avatar_url: ownProfile.avatar_url || avatarUrl,
      } : {
        user_id: userId,
        username: `${displayName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15) || 'player'}_${userId.slice(0, 6)}`,
        display_name: displayName,
        bio: '',
        avatar_url: avatarUrl,
      };
      setProfile(profileData);
      setFriends(community);
      setMessage('');
      if (!ownProfile || (!ownProfile.avatar_url && avatarUrl)) {
        void saveProfile(profileData).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not save your account profile.'));
      }
    }).catch((error: unknown) => setMessage(error instanceof Error ? `Could not load accounts: ${error.message}` : 'Could not load accounts.'));
    return () => { active = false; };
  }, [avatarUrl, displayName, loadAttempt, userId]);

  if (!userId) return <section className="menu-panel community-page"><h2>Account & Friends</h2><p>These features use cloud accounts. The app’s username/password accounts are saved only on this device, so sign in with Google to create a public profile, find friends, and challenge them to chess.</p><button type="button" onClick={onSignIn}>Sign in with Google</button></section>;

  async function searchPlayers(event: React.FormEvent) {
    event.preventDefault();
    try {
      setResults(await findProfiles(search.trim(), userId));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? `Could not search accounts: ${error.message}` : 'Could not search accounts.');
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

  if (!profile) return <section className="menu-panel"><p role="status">{message}</p><button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>Try again</button></section>;
  const friendsById = new Map(friends.profiles.map((item) => [item.user_id, item]));
  const relationships = new Map(friends.friendships.map((item) => [
    item.requester_id === userId ? item.recipient_id : item.requester_id, item,
  ]));

  return (
    <section className="menu-panel community-page" aria-label="Account and friends">
      <p className="eyebrow">Your account</p><h2>{profile.display_name}</h2>
      <div className="community-avatar-editor">
        <CommunityAvatar name={profile.display_name} imageUrl={profile.avatar_url} />
        <label className="secondary community-upload-button">
          {uploading ? 'Uploading…' : 'Choose profile picture'}
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setUploading(true);
            setMessage('Uploading your picture…');
            void uploadProfileAvatar(userId, file).then(async (url) => {
              const updatedProfile = { ...profile, avatar_url: url };
              await saveProfile(updatedProfile);
              setProfile(updatedProfile);
              onAvatarChanged(url);
              await deletePreviousAvatar(userId, profile.avatar_url).catch(() => undefined);
              setMessage('Profile picture saved.');
            }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not upload the picture.')).finally(() => setUploading(false));
            event.target.value = '';
          }} />
        </label>
        <small>JPG, PNG, or WebP · up to 3 MB</small>
      </div>
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
          <CommunityAvatar name={player.display_name} imageUrl={player.avatar_url} small />
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
          {player && <CommunityAvatar name={player.display_name} imageUrl={player.avatar_url} small />}
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
