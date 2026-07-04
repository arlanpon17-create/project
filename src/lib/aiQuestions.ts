import { supabase } from './supabase';

export type QuestionContext = {
  prompt: string;
  options: string[];
  hint: string;
  language: string;
  answer?: string;
  world?: string;
};

type AiResponse = {
  text?: string;
  error?: string;
};

export const helpSystemPrompt = [
  'You are a friendly language tutor for a teen learning app.',
  'Explain the question in simple English.',
  'Give one small clue and one way to think about the options.',
  'Do not reveal the exact correct option or final answer.',
  'Keep the answer under 70 words.',
].join(' ');

export const questionSystemPrompt = [
  'You create short multiple-choice language learning questions for teens.',
  'Return only valid JSON, with no markdown.',
  'Use this exact shape: {"prompt":"...","answer":"...","options":["...","...","...","..."],"hint":"...","world":"...","language":"..."}',
  'The answer must appear in options.',
  'Make one clear correct answer and three believable wrong answers.',
].join(' ');

export function buildHelpPrompt(question: QuestionContext) {
  return [
    `Language: ${question.language}`,
    `Question: ${question.prompt}`,
    `Options: ${question.options.join(', ')}`,
    `App hint: ${question.hint}`,
    'Help the student understand the question without giving the answer.',
  ].join('\n');
}

export function buildQuestionPrompt(question: QuestionContext) {
  return [
    `Create one new ${question.language} practice question.`,
    `Use similar difficulty to this question: ${question.prompt}`,
    `Current options style: ${question.options.join(', ')}`,
    'Keep the prompt and hint simple.',
  ].join('\n');
}

export function parseAiQuestion(text: string, fallbackLanguage: string): Required<QuestionContext> | null {
  const cleanText = text.replace(/```json|```/g, '').trim();
  const parsed: unknown = JSON.parse(cleanText);

  if (!parsed || typeof parsed !== 'object') return null;
  const item = parsed as Record<string, unknown>;
  const prompt = typeof item.prompt === 'string' ? item.prompt.trim() : '';
  const answer = typeof item.answer === 'string' ? item.answer.trim() : '';
  const hint = typeof item.hint === 'string' ? item.hint.trim() : '';
  const world = typeof item.world === 'string' ? item.world.trim() : '';
  const language = typeof item.language === 'string' ? item.language.trim() : fallbackLanguage;
  const options = Array.isArray(item.options)
    ? item.options.filter((option): option is string => typeof option === 'string').map((option) => option.trim())
    : [];

  const uniqueOptions = [...new Set(options)].filter(Boolean).slice(0, 4);
  if (!prompt || !answer || !hint || uniqueOptions.length !== 4 || !uniqueOptions.includes(answer)) {
    return null;
  }

  return { prompt, answer, options: uniqueOptions, hint, world: world || 'AI Gate', language };
}

export async function createAiHint(question: QuestionContext) {
  const { data, error } = await supabase.functions.invoke<AiResponse>('ai', {
    body: {
      prompt: buildHelpPrompt(question),
      system: helpSystemPrompt,
    },
  });

  return {
    text: data?.text?.trim() || '',
    error: data?.error || error?.message || '',
  };
}

export async function createAiQuestion(question: QuestionContext) {
  const { data, error } = await supabase.functions.invoke<AiResponse>('ai', {
    body: {
      prompt: buildQuestionPrompt(question),
      system: questionSystemPrompt,
    },
  });

  if (error || data?.error || !data?.text) {
    return { question: null, error: data?.error || error?.message || 'AI question generator is not ready yet.' };
  }

  try {
    return { question: parseAiQuestion(data.text, question.language), error: '' };
  } catch {
    return { question: null, error: 'AI made a broken question.' };
  }
}
