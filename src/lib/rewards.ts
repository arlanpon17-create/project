import { supabase } from './supabase';

export type PlayerSnapshot = {
  playerName: string;
  score: number;
  xp: number;
  diamonds: number;
  streak: number;
};

export type LeaderboardEntry = {
  player_name: string;
  score: number;
  xp: number;
  diamonds: number;
  streak: number;
};

type PlayerStats = LeaderboardEntry & {
  user_id: string;
  last_daily_reward_date: string | null;
};

type DailyReward = {
  xp: number;
  diamonds: number;
};

export type DailyRewardResult =
  | { status: 'claimed'; reward: DailyReward; nextClaimDate: string }
  | { status: 'already-claimed'; nextClaimDate: string }
  | { status: 'signed-out' };

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowDateKey() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateKey(tomorrow);
}

function getRewardForStreak(streak: number): DailyReward {
  const streakBonus = Math.min(Math.max(streak, 0), 10) * 5;
  return {
    xp: 75 + streakBonus,
    diamonds: 25,
  };
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

async function loadOwnStats(userId: string) {
  const { data, error } = await supabase
    .from('player_stats')
    .select('user_id, player_name, score, xp, diamonds, streak, last_daily_reward_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as PlayerStats | null;
}

export async function syncPlayerStats(snapshot: PlayerSnapshot) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from('player_stats').upsert({
    user_id: userId,
    player_name: snapshot.playerName || 'Player',
    score: snapshot.score,
    xp: snapshot.xp,
    diamonds: snapshot.diamonds,
    streak: snapshot.streak,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function claimDailyReward(snapshot: PlayerSnapshot): Promise<DailyRewardResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { status: 'signed-out' };

  const today = getLocalDateKey();
  const currentStats = await loadOwnStats(userId);
  if (currentStats?.last_daily_reward_date === today) {
    return { status: 'already-claimed', nextClaimDate: getTomorrowDateKey() };
  }

  const reward = getRewardForStreak(snapshot.streak);
  const baseXp = Math.max(currentStats?.xp ?? 0, snapshot.xp);
  const baseDiamonds = Math.max(currentStats?.diamonds ?? 0, snapshot.diamonds);
  const baseScore = Math.max(currentStats?.score ?? 0, snapshot.score);

  const { error } = await supabase.from('player_stats').upsert({
    user_id: userId,
    player_name: snapshot.playerName || 'Player',
    score: baseScore,
    xp: baseXp + reward.xp,
    diamonds: baseDiamonds + reward.diamonds,
    streak: Math.max(currentStats?.streak ?? 0, snapshot.streak),
    last_daily_reward_date: today,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return { status: 'claimed', reward, nextClaimDate: getTomorrowDateKey() };
}

export async function loadLeaderboard(limit = 10) {
  const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: limit });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}
