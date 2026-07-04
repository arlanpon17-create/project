import { supabase } from './supabase';

export type VideoPhrase = {
  text: string;
  sound: string;
  translation: string;
};

type AiResponse = {
  text?: string;
  error?: string;
};

const topicOpeners: Record<string, { start: string; sound: string }> = {
  English: { start: 'I want to talk about', sound: 'ai want tuh tawk uh-bout' },
  Spanish: { start: 'Quiero hablar de', sound: 'kee-EH-roh ah-BLAR deh' },
  French: { start: 'Je veux parler de', sound: 'zhuh vuh par-LAY duh' },
  German: { start: 'Ich mochte uber sprechen:', sound: 'ikh MURKH-tuh oo-ber SHPREH-khen' },
  Portuguese: { start: 'Eu quero falar sobre', sound: 'eh-oo KEH-roh fah-LAR SOH-breh' },
  Italian: { start: 'Voglio parlare di', sound: 'VOH-lyoh par-LAH-reh dee' },
  Russian: { start: 'Ya khochu pogovorit pro', sound: 'yah khoh-CHOO pah-gah-vah-REET proh' },
  Kazakh: { start: 'Men turaly soileskim keledi:', sound: 'men too-rah-LY soy-les-KEEM keh-leh-DEE' },
  Japanese: { start: 'Watashi wa hanashitai desu:', sound: 'wah-tah-shee wah hah-nah-shee-tai dess' },
  Chinese: { start: 'Wo xiang tan', sound: 'woh shyahng tahn' },
  Korean: { start: 'Jeoneun iyagi hago sipeoyo:', sound: 'joh-nun ee-yah-gee hah-go shee-poh-yoh' },
  Arabic: { start: 'Ureed an atahadath an', sound: 'oo-reed an ah-tah-hah-dath an' },
};

export const videoPhraseSystemPrompt = [
  'You are a video-call language trainer for teens.',
  'Return only valid JSON, no markdown.',
  'Use this exact shape: {"text":"...","sound":"...","translation":"..."}',
  'Create one short phrase the trainer says to the student.',
  'The phrase must match the requested language and topic.',
  'Keep it beginner friendly.',
].join(' ');

export function getTopicPhrase(language: string, topic: string): VideoPhrase {
  const opener = topicOpeners[language] ?? topicOpeners.English;
  return {
    text: `${opener.start} ${topic}.`,
    sound: `${opener.sound} ${topic}`,
    translation: `I want to talk about ${topic}.`,
  };
}

export function buildVideoPhrasePrompt(language: string, topic: string) {
  return [
    `Language: ${language}`,
    `Topic: ${topic || 'everyday conversation'}`,
    'Make one useful speaking practice phrase.',
    'sound should be simple pronunciation help using Latin letters.',
    'translation should be English.',
  ].join('\n');
}

export function parseVideoPhrase(text: string): VideoPhrase | null {
  const cleanText = text.replace(/```json|```/g, '').trim();
  const parsed: unknown = JSON.parse(cleanText);
  if (!parsed || typeof parsed !== 'object') return null;

  const item = parsed as Record<string, unknown>;
  const phrase = typeof item.text === 'string' ? item.text.trim() : '';
  const sound = typeof item.sound === 'string' ? item.sound.trim() : '';
  const translation = typeof item.translation === 'string' ? item.translation.trim() : '';

  return phrase && sound && translation ? { text: phrase, sound, translation } : null;
}

export async function createVideoPhrase(language: string, topic: string) {
  const { data, error } = await supabase.functions.invoke<AiResponse>('ai', {
    body: {
      prompt: buildVideoPhrasePrompt(language, topic),
      system: videoPhraseSystemPrompt,
    },
  });

  if (error || data?.error || !data?.text) {
    return { phrase: null, error: data?.error || error?.message || 'AI trainer is not ready yet.' };
  }

  try {
    return { phrase: parseVideoPhrase(data.text), error: '' };
  } catch {
    return { phrase: null, error: 'AI made a broken phrase. Try again.' };
  }
}
