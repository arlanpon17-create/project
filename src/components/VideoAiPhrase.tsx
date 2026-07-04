import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { createVideoPhrase, type VideoPhrase } from '../lib/aiVideoCall';

type Props = {
  language: string;
  topic: string;
  onPhraseReady: (phrase: VideoPhrase) => void;
};

export default function VideoAiPhrase({ language, topic, onPhraseReady }: Props) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function createPhrase() {
    setIsLoading(true);
    setMessage('');

    const { phrase, error } = await createVideoPhrase(language, topic);
    if (!phrase) {
      setMessage(error || 'AI made a broken phrase. Try again.');
    } else {
      onPhraseReady(phrase);
      setMessage('AI trainer added a new line.');
    }

    setIsLoading(false);
  }

  return (
    <div className="video-ai-phrase">
      <button className="secondary" type="button" onClick={() => void createPhrase()} disabled={isLoading}>
        <span className="button-label">
          <Sparkles aria-hidden="true" size={18} />
          <span>{isLoading ? 'Thinking...' : 'AI trainer line'}</span>
        </span>
      </button>
      {message && <p className="speech-result">{message}</p>}
    </div>
  );
}
