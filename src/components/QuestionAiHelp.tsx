import { useState } from 'react';
import { CircleHelp, Sparkles } from 'lucide-react';
import {
  createAiHint,
  createAiQuestion,
  type QuestionContext,
} from '../lib/aiQuestions';

type Props = {
  question: QuestionContext;
  onQuestionGenerated: (question: Required<QuestionContext>) => void;
};

export default function QuestionAiHelp({ question, onQuestionGenerated }: Props) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  async function askAi() {
    setIsLoading(true);
    setMessage('');

    const { text, error } = await createAiHint(question);
    if (error || !text) {
      setMessage(error || 'AI did not return a tip. Try again.');
      setIsLoading(false);
      return;
    }

    setMessage(text);
    setIsLoading(false);
  }

  async function generateQuestion() {
    setIsGenerating(true);
    setMessage('');

    const { question: nextQuestion, error } = await createAiQuestion(question);
    if (nextQuestion) {
      setMessage('New AI question is ready.');
      onQuestionGenerated(nextQuestion);
    } else {
      setMessage(error || 'AI made a broken question. Try again.');
    }

    setIsGenerating(false);
  }

  return (
    <div className="ai-question-help">
      <div className="ai-question-actions">
        <button className="secondary" type="button" onClick={() => void askAi()} disabled={isLoading || isGenerating}>
          <span className="button-label">
            <Sparkles aria-hidden="true" size={18} />
            <span>{isLoading ? 'Thinking...' : 'Ask AI'}</span>
          </span>
        </button>
        <button className="secondary" type="button" onClick={() => void generateQuestion()} disabled={isLoading || isGenerating}>
          <span className="button-label">
            <Sparkles aria-hidden="true" size={18} />
            <span>{isGenerating ? 'Making...' : 'AI question'}</span>
          </span>
        </button>
      </div>
      {message && (
        <p>
          <CircleHelp aria-hidden="true" size={18} />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
