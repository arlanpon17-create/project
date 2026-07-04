import { useMemo, useState } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  buildLessonPrompt,
  findClosestLesson,
  lessonPickerSystemPrompt,
  parseLessonChoice,
  type AiLessonOption,
} from '../lib/aiLessons';
export type { AiLessonOption } from '../lib/aiLessons';

type AiResponse = {
  text?: string;
  error?: string;
};

type Props = {
  lessons: AiLessonOption[];
  onStartLesson: (lessonId: string) => void;
};

export default function LessonAiPicker({ lessons, onStartLesson }: Props) {
  const [request, setRequest] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  );

  async function chooseLesson() {
    if (!request.trim()) {
      setMessage('Write what lesson you want first.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setSelectedLessonId('');

    const { data, error } = await supabase.functions.invoke<AiResponse>('ai', {
      body: {
        prompt: buildLessonPrompt(request.trim(), lessons),
        system: lessonPickerSystemPrompt,
      },
    });

    if (error || data?.error || !data?.text) {
      const fallback = findClosestLesson(request, lessons);
      setSelectedLessonId(fallback.lessonId);
      setMessage(fallback.reason);
      setIsLoading(false);
      return;
    }

    try {
      const choice = parseLessonChoice(data.text) ?? findClosestLesson(request, lessons);
      const lesson = choice ? lessons.find((item) => item.id === choice.lessonId) : null;
      if (!choice || !lesson) {
        const fallback = findClosestLesson(request, lessons);
        setSelectedLessonId(fallback.lessonId);
        setMessage(fallback.reason);
      } else {
        setSelectedLessonId(choice.lessonId);
        setMessage(choice.reason || 'This lesson matches your filters.');
      }
    } catch {
      const fallback = findClosestLesson(request, lessons);
      setSelectedLessonId(fallback.lessonId);
      setMessage(fallback.reason);
    }

    setIsLoading(false);
  }

  return (
    <div className="ai-lesson-picker">
      <div>
        <strong>AI lesson picker</strong>
        <p>Type your filters and AI will choose a lesson.</p>
      </div>
      <div className="ai-lesson-form">
        <input
          value={request}
          onChange={(event) => setRequest(event.target.value)}
          placeholder="Spanish travel, easy school words, colors..."
        />
        <button type="button" onClick={() => void chooseLesson()} disabled={isLoading}>
          <span className="button-label">
            <Sparkles aria-hidden="true" size={18} />
            <span>{isLoading ? 'Choosing...' : 'Choose'}</span>
          </span>
        </button>
      </div>
      {message && <p className="feedback">{message}</p>}
      {selectedLesson && (
        <div className="ai-lesson-result">
          <div>
            <strong>{selectedLesson.title}</strong>
            <p>{selectedLesson.description}</p>
            <small>{selectedLesson.size} questions</small>
          </div>
          <button type="button" onClick={() => onStartLesson(selectedLesson.id)}>
            <span className="button-label">
              <Play aria-hidden="true" size={18} />
              <span>Start lesson</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
