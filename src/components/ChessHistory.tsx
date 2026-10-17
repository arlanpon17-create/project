import { useEffect, useState } from 'react';
import { loadChessRecords, type ChessRecord } from '../lib/chessRecords';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function ChessHistory() {
  const [records, setRecords] = useState<ChessRecord[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadChessRecords().then(setRecords).catch(() => setError('Could not load chess history. Check your connection and database setup.'));
  }, []);

  return (
    <section className="chess-history" aria-label="Chess game history">
      <h3>Game history & analysis</h3>
      <p>Completed games show the result, captured piece points, and move record.</p>
      {error && <p role="alert">{error}</p>}
      {!error && records.length === 0 && <p>Finish a game to see its analysis here.</p>}
      <div className="chess-history-list">
        {records.map((record) => (
          <article className="chess-history-card" key={record.id}>
            <strong>{record.result}</strong>
            <small>{formatDate(record.played_at)} · {record.mode} game</small>
            <span>Capture points — White {record.white_points}, Black {record.black_points}</span>
            <details><summary>Review moves</summary><p>{record.pgn || 'No moves recorded.'}</p></details>
          </article>
        ))}
      </div>
    </section>
  );
}
