import type { ReactNode } from 'react';
import type { Invite, Match, PresencePlayer } from '../lib/onlineChessTypes';

type Props = {
  connected: boolean;
  players: PresencePlayer[];
  friendIds: string[];
  hasAccount: boolean;
  incoming: Invite | null;
  outgoing: Invite | null;
  match: Match | null;
  notice: string;
  onFind: () => void;
  onChallengeFriend: (player: PresencePlayer) => void;
  onCancel: () => void;
  onRespond: (accepted: boolean) => void;
  onLeave: () => void;
  children?: ReactNode;
};

export default function OnlineChessLobby({ connected, players, friendIds, hasAccount, incoming, outgoing, match, notice, onFind, onChallengeFriend, onCancel, onRespond, onLeave, children }: Props) {
  const availableCount = players.filter((player) => player.status === 'available').length;
  const onlineFriends = players.filter((player) => player.accountId && friendIds.includes(player.accountId) && player.status === 'available');
  return (
    <section className="online-chess" aria-label="Online chess lobby">
      {!match ? (
        <>
          <div className="online-lobby-header">
            <div><p className="eyebrow">Random player</p><h3>Chess lobby</h3><p>{notice}</p></div>
            <span className="online-count">{availableCount} player{availableCount === 1 ? '' : 's'} waiting</span>
          </div>
          {incoming && <div className="challenge-invite" role="alert"><strong>{incoming.fromName} wants to play chess.</strong><div><button type="button" onClick={() => onRespond(true)}>Accept</button><button className="secondary" type="button" onClick={() => onRespond(false)}>Decline</button></div></div>}
          {outgoing ? <button className="secondary" type="button" onClick={onCancel}>Cancel challenge</button> : <button type="button" onClick={onFind} disabled={!connected || availableCount === 0}>Find random player</button>}
          <div className="online-player-list"><strong>Players online</strong>{players.length === 0 ? <span>No other players are online yet.</span> : players.map((player) => <span key={player.playerId}>{player.displayName} · {player.status}</span>)}</div>
          {hasAccount && <div className="online-player-list"><strong>Friends online</strong>{onlineFriends.length === 0 ? <span>Your friends are not in the chess lobby right now.</span> : onlineFriends.map((player) => <button className="secondary" type="button" key={player.playerId} disabled={!connected || Boolean(outgoing) || Boolean(incoming)} onClick={() => onChallengeFriend(player)}>Challenge {player.displayName}</button>)}</div>}
        </>
      ) : (
        <>
          <div className="online-lobby-header"><div><p className="eyebrow">Online match</p><h3>You vs {match.opponentName}</h3></div><button className="secondary" type="button" onClick={onLeave}>Leave match</button></div>
          {children}
        </>
      )}
    </section>
  );
}
