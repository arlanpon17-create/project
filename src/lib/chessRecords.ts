import { supabase } from './supabase';

export type ChessRecord = {
  id: string;
  mode: string;
  result: string;
  pgn: string;
  white_points: number;
  black_points: number;
  played_at: string;
};

const localRecordsKey = 'chess-game-history';

export async function saveChessRecord(record: Omit<ChessRecord, 'id' | 'played_at'>) {
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const { error } = await supabase.from('chess_games').insert({
      ...record,
      user_id: data.user.id,
    });
    if (error) throw error;
    return;
  }

  const records = loadLocalRecords();
  records.unshift({ ...record, id: crypto.randomUUID(), played_at: new Date().toISOString() });
  localStorage.setItem(localRecordsKey, JSON.stringify(records.slice(0, 30)));
}

export async function loadChessRecords(): Promise<ChessRecord[]> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return loadLocalRecords();

  const { data: records, error } = await supabase
    .from('chess_games')
    .select('id, mode, result, pgn, white_points, black_points, played_at')
    .eq('user_id', data.user.id)
    .order('played_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return records ?? [];
}

function loadLocalRecords(): ChessRecord[] {
  try {
    return JSON.parse(localStorage.getItem(localRecordsKey) ?? '[]') as ChessRecord[];
  } catch {
    return [];
  }
}
