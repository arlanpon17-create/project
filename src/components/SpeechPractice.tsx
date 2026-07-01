import { useRef, useState } from 'react';
import { Check, Mic, Square, X } from 'lucide-react';

type Props = {
  language: string;
  target: string;
  onPassed: () => void;
};
type SpeechRecognitionResult = {
  transcript: string;
};
type SpeechRecognitionEvent = Event & {
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
};
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
};

function isLocalhost() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

const languageCodes: Record<string, string> = {
  English: 'en-US',
  Spanish: 'es-ES',
  French: 'fr-FR',
  German: 'de-DE',
  Portuguese: 'pt-PT',
  Italian: 'it-IT',
  Russian: 'ru-RU',
  Kazakh: 'kk-KZ',
  Japanese: 'ja-JP',
  Chinese: 'zh-CN',
  Korean: 'ko-KR',
  Arabic: 'ar-SA',
};

function normalizeSpeech(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getScore(target: string, transcript: string) {
  const targetWords = normalizeSpeech(target).split(' ').filter(Boolean);
  const transcriptText = normalizeSpeech(transcript);

  if (targetWords.length === 0 || !transcriptText) return 0;

  const matchedWords = targetWords.filter((word) => transcriptText.includes(word));
  return Math.round((matchedWords.length / targetWords.length) * 100);
}

export default function SpeechPractice({ language, target, onPassed }: Props) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showFallback, setShowFallback] = useState(false);

  function showMessage(nextMessage: string) {
    setMessage(nextMessage);
    setTranscript('');
    setScore(null);
  }

  function startListening() {
    setShowFallback(false);
    setTranscript('');
    setScore(null);
    setMessage('Starting microphone...');

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setShowFallback(true);
      showMessage('Speech listening is not supported here. Try Chrome or Edge.');
      return;
    }

    if (!window.isSecureContext && !isLocalhost()) {
      setShowFallback(true);
      showMessage('Microphone needs HTTPS or localhost. Open the app with npm run dev or on the deployed site.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = languageCodes[language] ?? 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const heard = event.results[0]?.[0]?.transcript ?? '';
      const nextScore = getScore(target, heard);
      setTranscript(heard);
      setScore(nextScore);
      setMessage(nextScore >= 60 ? 'Good speaking. Keep repeating it.' : 'Try again slowly, word by word.');
      if (nextScore >= 60) onPassed();
    };
    recognition.onerror = () => setMessage('I could not hear clearly. Try again closer to the microphone.');
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setTranscript('');
    setScore(null);
    setMessage('Listening...');
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setShowFallback(true);
      showMessage('Tap again and allow microphone access when the browser asks.');
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function passManually() {
    setShowFallback(false);
    setTranscript(target);
    setScore(100);
    setMessage('Marked as spoken. Keep practicing aloud.');
    onPassed();
  }

  return (
    <div className="speech-practice">
      <button className={isListening ? 'listen-button listen-button--active' : 'listen-button'} type="button" onClick={isListening ? stopListening : startListening}>
        <span className="button-label">
          {isListening ? <Square aria-hidden="true" size={18} /> : <Mic aria-hidden="true" size={18} />}
          <span>{isListening ? 'Stop listening' : 'Listen to me'}</span>
        </span>
      </button>
      {(message || transcript) && (
        <div className="speech-result">
          {score !== null && (score >= 60 ? <Check aria-hidden="true" size={18} /> : <X aria-hidden="true" size={18} />)}
          <span>
            {message}
            {transcript && <small>Heard: {transcript}{score !== null ? ` (${score}%)` : ''}</small>}
          </span>
        </div>
      )}
      {showFallback && (
        <button className="secondary speech-fallback-button" type="button" onClick={passManually}>
          <span className="button-label">
            <Check aria-hidden="true" size={18} />
            <span>I said it</span>
          </span>
        </button>
      )}
    </div>
  );
}
