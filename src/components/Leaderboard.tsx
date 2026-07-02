import { RefreshCw, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { loadLeaderboard, syncPlayerStats, type LeaderboardEntry, type PlayerSnapshot } from '../lib/rewards';

type LeaderboardProps = {
  snapshot: PlayerSnapshot;
  isSignedIn: boolean;
};

export default function Leaderboard({ snapshot, isSignedIn }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function refreshLeaderboard() {
    setIsLoading(true);
    try {
      if (isSignedIn) {
        await syncPlayerStats(snapshot);
      }
      const nextEntries = await loadLeaderboard(10);
      setEntries(nextEntries);
      setMessage(nextEntries.length ? '' : 'No players on the leaderboard yet.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load leaderboard.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshLeaderboard();
  }, []);

  return (
    <section className="menu-panel leaderboard-panel" aria-label="Leaderboard">
      <div className="leaderboard-header">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h2>Top language heroes</h2>
        </div>
        <button className="secondary icon-text-button" type="button" onClick={refreshLeaderboard} disabled={isLoading}>
          <RefreshCw aria-hidden="true" size={18} strokeWidth={2.4} />
          <span>{isLoading ? 'Loading' : 'Refresh'}</span>
        </button>
      </div>
      <div className="leaderboard-list">
        {entries.map((entry, index) => (
          <div className="leaderboard-row" key={`${entry.player_name}-${index}`}>
            <span className="leaderboard-rank">
              {index === 0 ? <Trophy aria-hidden="true" size={18} strokeWidth={2.4} /> : index + 1}
            </span>
            <strong>{entry.player_name}</strong>
            <span>{entry.xp} XP</span>
            <span>{entry.score} score</span>
            <span>{entry.streak} streak</span>
          </div>
        ))}
      </div>
      {message && <p className="feedback">{message}</p>}
    </section>
  );
}
