import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, RefreshCw, Volume2 } from 'lucide-react';
import SpeechPractice from './SpeechPractice';
import TrainerAvatar from './TrainerAvatar';
import VideoAiPhrase from './VideoAiPhrase';
import { createVideoPhrase, getTopicPhrase, type VideoPhrase } from '../lib/aiVideoCall';
import { getLanguageCode, getTrainerVoices, speakTrainerPhrase, stopTrainerSpeech } from '../lib/trainerSpeech';

type Props = {
  language: string;
  phrases: VideoPhrase[];
  onPassed: (text: string) => void;
  onComplete: () => void;
};

export default function VideoCallTrainer({ language, phrases, onPassed, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [topic, setTopic] = useState('');
  const [aiPhrases, setAiPhrases] = useState<VideoPhrase[]>([]);
  const [spokenCount, setSpokenCount] = useState(0);
  const [cameraMessage, setCameraMessage] = useState('');
  const [trainerMessage, setTrainerMessage] = useState('');
  const [isTrainerSpeaking, setIsTrainerSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState('');
  const cleanTopic = topic.trim();
  const callPhrases = cleanTopic ? [...aiPhrases, getTopicPhrase(language, cleanTopic), ...phrases] : [...aiPhrases, ...phrases];
  const phrase = callPhrases[phraseIndex] ?? callPhrases[0];

  useEffect(() => {
    return () => {
      stopCamera();
      stopTrainerSpeech();
    };
  }, []);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    function loadVoices() {
      setVoices(getTrainerVoices());
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    const languageCode = getLanguageCode(language).slice(0, 2).toLowerCase();
    const matchingVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(languageCode));
    setVoiceUri(matchingVoice?.voiceURI ?? '');
  }, [language, voices]);

  useEffect(() => {
    if (isCallActive) speakPhrase();
  }, [phrase?.text]);

  useEffect(() => {
    setPhraseIndex(0);
    setAiPhrases([]);
    setTrainerMessage('');
  }, [language, cleanTopic]);

  async function startCall() {
    setCameraMessage('');
    setTrainerMessage('Trainer is starting the conversation...');
    setSpokenCount(0);
    setPhraseIndex(0);
    setIsCallActive(true);
    speakPhrase();
    void createOpeningLine();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera is not supported in this browser. You can still practice by voice.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

    } catch {
      setCameraMessage('Camera blocked. Allow camera access, or continue with voice practice.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function endCall() {
    stopCamera();
    stopTrainerSpeech();
    setIsTrainerSpeaking(false);
    if (isCallActive && spokenCount > 0) {
      onComplete();
    }
    setTrainerMessage('');
    setIsCallActive(false);
  }

  function nextPhrase() {
    setPhraseIndex((index) => (index + 1) % callPhrases.length);
  }

  function speakPhrase() {
    if (!phrase) return;
    const canSpeak = speakTrainerPhrase(phrase.text, language, voiceUri, {
      onStart: () => setIsTrainerSpeaking(true),
      onEnd: () => setIsTrainerSpeaking(false),
    });
    if (!canSpeak) setTrainerMessage('Speech is not supported in this browser.');
  }

  function refreshVoices() {
    setVoices(getTrainerVoices());
  }

  function handlePassed() {
    onPassed(phrase.text);
    setSpokenCount((count) => count + 1);
    nextPhrase();
  }

  async function createOpeningLine() {
    const { phrase: openingPhrase, error } = await createVideoPhrase(language, cleanTopic);
    if (openingPhrase) addAiPhrase(openingPhrase);
    setTrainerMessage(openingPhrase ? 'Trainer started the conversation.' : error || 'Trainer started with a practice line.');
  }

  function addAiPhrase(nextPhrase: VideoPhrase) {
    setAiPhrases((items) => [nextPhrase, ...items]);
    setPhraseIndex(0);
  }

  if (!phrase) return null;

  return (
    <section className="video-trainer" aria-label="Video call trainer">
      <div className="video-call-header">
        <div>
          <strong>Video Call Trainer</strong>
          <p>Choose any topic, then answer the trainer aloud.</p>
        </div>
        <button className={isCallActive ? 'danger-button' : ''} type="button" onClick={isCallActive ? endCall : startCall}>
          <span className="button-label">
            {isCallActive ? <PhoneOff aria-hidden="true" size={18} /> : <Phone aria-hidden="true" size={18} />}
            <span>{isCallActive ? 'End call' : 'Start call'}</span>
          </span>
        </button>
      </div>

      <label className="call-topic">
        What do you want to talk about?
        <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Example: football, music, school, movies..." />
      </label>

      <VideoAiPhrase language={language} topic={cleanTopic} onPhraseReady={addAiPhrase} />

      <div className="video-call-grid">
        <div className="trainer-window">
          <span className="call-status"><i />Trainer online</span>
          <TrainerAvatar isSpeaking={isTrainerSpeaking} />
          <span className="trainer-name">Trainer {isTrainerSpeaking && 'is speaking...'}</span>
          <strong>{phrase.text}</strong>
          <small>{phrase.sound}</small>
          <button className="trainer-replay" type="button" onClick={speakPhrase} aria-label="Hear the trainer phrase again">
            <Volume2 aria-hidden="true" size={16} /> Hear again
          </button>
        </div>
        <div className="student-window">
          <video ref={videoRef} autoPlay muted playsInline />
          <span className="call-status"><i />You</span>
          {!streamRef.current && <span>Your camera preview</span>}
        </div>
      </div>

      {cameraMessage && <p className="speech-result">{cameraMessage}</p>}
      {trainerMessage && <p className="speech-result">{trainerMessage}</p>}

      <div className="trainer-voice-panel">
        <label className="trainer-voice-select">
          Trainer voice ({voices.length})
          <select value={voiceUri} onChange={(event) => setVoiceUri(event.target.value)}>
            <option value="">Automatic ({language})</option>
            {voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} — {voice.lang}</option>)}
          </select>
        </label>
        <button className="trainer-refresh-voices" type="button" onClick={refreshVoices}>
          <RefreshCw aria-hidden="true" size={16} /> Refresh voices
        </button>
        {voices.length === 0 && <small>Install a Windows voice, then press Refresh voices.</small>}
      </div>

      <div className="call-task">
        <strong>Your turn</strong>
        <p>{phrase.translation}</p>
        {isCallActive ? <SpeechPractice language={language} target={phrase.text} onPassed={handlePassed} /> : <small>Start the call to answer with your voice.</small>}
      </div>
    </section>
  );
}
