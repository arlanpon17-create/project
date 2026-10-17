export type PlayerStatus = 'available' | 'invited' | 'playing';
export type PresencePlayer = { playerId: string; displayName: string; status: PlayerStatus };
export type Invite = { inviteId: string; fromId: string; fromName: string; toId: string };
export type Response = { inviteId: string; fromId: string; fromName?: string; toId: string; accepted: boolean };
export type Match = { inviteId: string; opponentId: string; opponentName: string; color: 'w' | 'b' };
export type RemoteMove = { id: string; matchId: string; fromId: string; toId: string; from: string; to: string; promotion: 'q' };
export type ActiveState = { incoming: Invite | null; outgoing: Invite | null; match: Match | null };

export const chessLobbyName = 'teachling-chess-lobby';

export function createChessClientId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
