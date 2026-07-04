export type AiLessonOption = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  language?: string;
  size: number;
};

export type AiLessonChoice = {
  lessonId: string;
  reason: string;
};

export const lessonPickerSystemPrompt = [
  'You choose the closest lesson for a teen language learning app.',
  'Return only valid JSON, no markdown.',
  'Use this exact shape: {"lessonId":"...","reason":"..."}',
  'lessonId must be one id from the provided lessons.',
  'If there is no exact match, still choose the closest useful lesson.',
  'Keep reason under 18 words.',
].join(' ');

export function buildLessonPrompt(request: string, lessons: AiLessonOption[]) {
  const lessonList = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    language: lesson.language ?? 'Any',
    description: lesson.description,
    keywords: lesson.keywords,
    size: lesson.size,
  }));

  return [
    `Student request: ${request}`,
    `Lessons: ${JSON.stringify(lessonList)}`,
    'Pick the single closest lesson. Never answer that no lesson exists.',
  ].join('\n');
}

export function parseLessonChoice(text: string) {
  const cleanText = text.replace(/```json|```/g, '').trim();
  const parsed: unknown = JSON.parse(cleanText);
  if (!parsed || typeof parsed !== 'object') return null;

  const item = parsed as Record<string, unknown>;
  const lessonId = typeof item.lessonId === 'string' ? item.lessonId.trim() : '';
  const reason = typeof item.reason === 'string' ? item.reason.trim() : '';
  return lessonId ? { lessonId, reason } : null;
}

export function findClosestLesson(request: string, lessons: AiLessonOption[]): AiLessonChoice {
  const terms = request.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const scored = lessons.map((lesson) => {
    const haystack = [
      lesson.title,
      lesson.description,
      lesson.language ?? '',
      ...lesson.keywords,
    ].join(' ').toLowerCase();
    const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
    return { lesson, score };
  });

  scored.sort((left, right) => right.score - left.score || left.lesson.title.localeCompare(right.lesson.title));
  const best = scored[0]?.lesson ?? lessons[0];

  return {
    lessonId: best.id,
    reason: scored[0]?.score ? 'Closest match to your filters.' : 'No exact match, so this is the best starter lesson.',
  };
}
