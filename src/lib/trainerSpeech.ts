const languageCodes: Record<string, string> = {
  English: 'en-US',
  Spanish: 'es-ES',
  French: 'fr-FR',
  German: 'de-DE',
  Portuguese: 'pt-BR',
  Italian: 'it-IT',
  Russian: 'ru-RU',
  Kazakh: 'kk-KZ',
  Japanese: 'ja-JP',
  Chinese: 'zh-CN',
  Korean: 'ko-KR',
  Arabic: 'ar-SA',
};

export function getTrainerVoices() {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function getLanguageCode(language: string) {
  return languageCodes[language] ?? languageCodes.English;
}

export function stopTrainerSpeech() {
  window.speechSynthesis?.cancel();
}

type SpeechCallbacks = {
  onStart: () => void;
  onEnd: () => void;
};

export function speakTrainerPhrase(text: string, language: string, voiceUri: string, { onStart, onEnd }: SpeechCallbacks) {
  if (!('speechSynthesis' in window)) return false;

  stopTrainerSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getLanguageCode(language);
  const voices = getTrainerVoices();
  const matchingVoice = voices.find((voice) => voice.voiceURI === voiceUri)
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()));
  if (matchingVoice) utterance.voice = matchingVoice;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
  return true;
}
