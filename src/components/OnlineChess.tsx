import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { chessLobbyName, createChessClientId, type ActiveState, type Invite, type Match, type PlayerStatus, type PresencePlayer, type RemoteMove, type Response } from '../lib/onlineChessTypes';
import ChessGame from './ChessGame';
import OnlineChessLobby from './OnlineChessLobby';
import { loadCommunity } from '../lib/community';

export default function OnlineChess({ displayName, accountId }: { displayName: string; accountId?: string }) {
  const [playerId] = useState(createChessClientId);
  const onlineName = displayName === 'Guest' ? `Guest-${playerId.slice(0, 4)}` : displayName;
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<PresencePlayer[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [incoming, setIncoming] = useState<Invite | null>(null);
  const [outgoing, setOutgoing] = useState<Invite | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [remoteMove, setRemoteMove] = useState<RemoteMove | null>(null);
  const [notice, setNotice] = useState('Connecting to the chess lobby…');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const activeRef = useRef<ActiveState>({ incoming: null, outgoing: null, match: null });
  const timeoutRef = useRef<number | null>(null);
  activeRef.current = { incoming, outgoing, match };

  useEffect(() => {
    if (!accountId) return;
    void loadCommunity(accountId).then(({ friendships }) => {
      setFriendIds(friendships.filter((friendship) => friendship.status === 'accepted')
        .map((friendship) => friendship.requester_id === accountId ? friendship.recipient_id : friendship.requester_id));
    }).catch(() => setFriendIds([]));
  }, [accountId]);

  useEffect(() => {
    const channel = supabase.channel(chessLobbyName, {
      config: { presence: { key: playerId }, broadcast: { self: false, ack: true } },
    });
    channelRef.current = channel;
    channel.on('presence', { event: 'sync' }, () => {
      const connectedPlayers = Object.values(channel.presenceState<PresencePlayer>()).flat();
      setPlayers(connectedPlayers.filter((player) => player.playerId !== playerId));
      const currentMatch = activeRef.current.match;
      if (currentMatch && !connectedPlayers.some((player) => player.playerId === currentMatch.opponentId)) {
        activeRef.current.match = null;
        setMatch(null);
        setRemoteMove(null);
        setNotice('Your opponent disconnected. Find another player when you’re ready.');
        void channel.track(createPresence(playerId, accountId, onlineName, 'available'));
      }
    });
    channel.on('broadcast', { event: 'invite' }, ({ payload }) => {
      const invite = payload as Invite;
      if (invite.toId !== playerId || invite.fromId === playerId) return;
      const current = activeRef.current;
      if (current.incoming || current.outgoing || current.match) {
        void channel.send({ type: 'broadcast', event: 'response', payload: { inviteId: invite.inviteId, fromId: playerId, fromName: onlineName, toId: invite.fromId, accepted: false } satisfies Response });
        return;
      }
      setIncoming(invite);
      setNotice(`${invite.fromName} challenged you to chess.`);
      void channel.track(createPresence(playerId, accountId, onlineName, 'invited'));
    });
    channel.on('broadcast', { event: 'response' }, ({ payload }) => {
      const response = payload as Response;
      if (response.toId !== playerId) return;
      const currentState = activeRef.current;
      if (!currentState.outgoing && currentState.incoming?.inviteId === response.inviteId && !response.accepted) {
        setIncoming(null);
        setNotice('The challenge was cancelled by the other player.');
        void channel.track(createPresence(playerId, accountId, onlineName, 'available'));
        return;
      }
      const current = currentState.outgoing;
      if (!current || response.inviteId !== current.inviteId) return;
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setOutgoing(null);
      if (response.accepted) {
        setMatch({ inviteId: response.inviteId, opponentId: response.fromId, opponentName: response.fromName ?? 'Player', color: 'w' });
        setNotice('Challenge accepted. You are White.');
        void channel.track(createPresence(playerId, accountId, onlineName, 'playing'));
      } else {
        setNotice('That player declined. Choose another player.');
        void channel.track(createPresence(playerId, accountId, onlineName, 'available'));
      }
    });
    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      const move = payload as RemoteMove;
      const current = activeRef.current.match;
      if (!current || move.matchId !== current.inviteId || move.toId !== playerId || move.fromId === playerId) return;
      setRemoteMove({ ...move, id: createChessClientId() });
    });
    channel.on('broadcast', { event: 'leave' }, ({ payload }) => {
      const message = payload as { matchId: string; fromId: string };
      const current = activeRef.current.match;
      if (!current || message.matchId !== current.inviteId || message.fromId === playerId) return;
      setMatch(null);
      activeRef.current.match = null;
      setRemoteMove(null);
      setNotice('Your opponent left the game. Find another player when you’re ready.');
      void channel.track(createPresence(playerId, accountId, onlineName, 'available'));
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        setNotice('You are in the chess lobby. Find a random player to challenge.');
        void channel.track(createPresence(playerId, accountId, onlineName, 'available'));
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnected(false);
        setNotice('Could not connect to the chess lobby. Check the internet and try again.');
      }
    });
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [accountId, displayName, onlineName, playerId]);

  function updatePresence(status: PlayerStatus) {
    void channelRef.current?.track(createPresence(playerId, accountId, onlineName, status));
  }

  function findRandomPlayer(targetPlayer?: PresencePlayer) {
    const candidates = targetPlayer ? [targetPlayer] : players.filter((player) => player.status === 'available');
    if (!connected) return setNotice('Still connecting to the chess lobby.');
    if (match || outgoing) return;
    if (candidates.length === 0) return setNotice('No other players are waiting right now. Keep this page open and try again.');
    const opponent = candidates[Math.floor(Math.random() * candidates.length)];
    const invite: Invite = { inviteId: createChessClientId(), fromId: playerId, fromName: onlineName, toId: opponent.playerId };
    setOutgoing(invite);
    setNotice(`Challenge sent to ${opponent.displayName}. Waiting for a reply…`);
    updatePresence('invited');
    void channelRef.current?.send({ type: 'broadcast', event: 'invite', payload: invite });
    timeoutRef.current = window.setTimeout(() => {
      if (activeRef.current.outgoing?.inviteId !== invite.inviteId) return;
      setOutgoing(null);
      setNotice('No response yet. Choose a player and send another challenge.');
      updatePresence('available');
    }, 25000);
  }

  function respondToInvite(accepted: boolean) {
    if (!incoming) return;
    const invite = incoming;
    setIncoming(null);
    void channelRef.current?.send({
      type: 'broadcast', event: 'response',
      payload: { inviteId: invite.inviteId, fromId: playerId, fromName: onlineName, toId: invite.fromId, accepted } satisfies Response,
    });
    if (accepted) {
      setMatch({ inviteId: invite.inviteId, opponentId: invite.fromId, opponentName: invite.fromName, color: 'b' });
      setNotice(`You accepted ${invite.fromName}’s challenge. You are Black.`);
      updatePresence('playing');
    } else {
      setNotice('Challenge declined. You are back in the lobby.');
      updatePresence('available');
    }
  }

  function sendMove(move: { from: string; to: string; promotion: 'q' }) {
    if (!match) return;
    void channelRef.current?.send({
      type: 'broadcast', event: 'move',
      payload: { ...move, matchId: match.inviteId, fromId: playerId, toId: match.opponentId },
    });
  }

  function leaveMatch() {
    if (match) void channelRef.current?.send({ type: 'broadcast', event: 'leave', payload: { matchId: match.inviteId, fromId: playerId } });
    activeRef.current.match = null;
    setMatch(null);
    setRemoteMove(null);
    setNotice('You left the match. Find another player when you’re ready.');
    updatePresence('available');
  }

  return (
    <OnlineChessLobby
      connected={connected}
      players={players}
      friendIds={friendIds}
      hasAccount={Boolean(accountId)}
      incoming={incoming}
      outgoing={outgoing}
      match={match}
      notice={notice}
      onFind={() => findRandomPlayer()}
      onChallengeFriend={(player) => findRandomPlayer(player)}
      onCancel={() => {
        if (!outgoing) return;
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        void channelRef.current?.send({ type: 'broadcast', event: 'response', payload: { inviteId: outgoing.inviteId, fromId: playerId, fromName: onlineName, toId: outgoing.toId, accepted: false } satisfies Response });
        setOutgoing(null);
        setNotice('Challenge cancelled.');
        updatePresence('available');
      }}
      onRespond={respondToInvite}
      onLeave={leaveMatch}
    >
      {match && <ChessGame key={match.inviteId} mode="online" playerColor={match.color} remoteMove={remoteMove} onMove={sendMove} />}
    </OnlineChessLobby>
  );
}

function createPresence(playerId: string, accountId: string | undefined, displayName: string, status: PlayerStatus): PresencePlayer {
  return { playerId, accountId, displayName, status };
}
