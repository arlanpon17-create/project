import { Gift, LogIn, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { claimDailyReward, type DailyRewardResult, type PlayerSnapshot } from '../lib/rewards';

type DailyRewardProps = {
  snapshot: PlayerSnapshot;
  isSignedIn: boolean;
  onClaim: (reward: { xp: number; diamonds: number }) => void;
  onSignIn: () => void;
};

function getMessage(result: DailyRewardResult) {
  if (result.status === 'claimed') {
    return `Claimed ${result.reward.xp} XP and ${result.reward.diamonds} diamonds.`;
  }

  if (result.status === 'already-claimed') {
    return `Already claimed today. Next reward: ${result.nextClaimDate}.`;
  }

  return 'Sign in to claim daily rewards.';
}

export default function DailyReward({ snapshot, isSignedIn, onClaim, onSignIn }: DailyRewardProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleClaim() {
    if (!isSignedIn) {
      setMessage('Sign in with Google to save daily rewards.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await claimDailyReward(snapshot);
      setMessage(getMessage(result));
      if (result.status === 'claimed') {
        onClaim(result.reward);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not claim reward.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="menu-panel reward-panel" aria-label="Daily reward">
      <p className="eyebrow">Daily reward</p>
      <h2>Collect today's bonus.</h2>
      <div className="reward-card">
        <div className="reward-icon">
          <Gift aria-hidden="true" size={30} strokeWidth={2.4} />
        </div>
        <div>
          <strong>Daily chest</strong>
          <p>Get XP and diamonds once per day. Higher streaks add more XP.</p>
        </div>
      </div>
      <div className="reward-actions">
        <button type="button" onClick={handleClaim} disabled={isLoading}>
          <span className="button-label">
            <Sparkles aria-hidden="true" size={18} strokeWidth={2.4} />
            <span>{isLoading ? 'Checking...' : 'Claim reward'}</span>
          </span>
        </button>
        {!isSignedIn && (
          <button className="secondary" type="button" onClick={onSignIn}>
            <span className="button-label">
              <LogIn aria-hidden="true" size={18} strokeWidth={2.4} />
              <span>Google Sign In</span>
            </span>
          </button>
        )}
      </div>
      {message && <p className="feedback feedback--good">{message}</p>}
    </section>
  );
}
