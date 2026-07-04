import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, UserRound } from 'lucide-react';
import SpeechPractice from './SpeechPractice';
import VideoAiPhrase from './VideoAiPhrase';
import { createVideoPhrase, getTopicPhrase, type VideoPhrase } from '../lib/aiVideoCall';

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
  const cleanTopic = topic.trim();
  const callPhrases = cleanTopic ? [...aiPhrases, getTopicPhrase(language, cleanTopic), ...phrases] : [...aiPhrases, ...phrases];
  const phrase = callPhrases[phraseIndex] ?? callPhrases[0];

  useEffect(() => {
    return () => stopCamera();
  }, []);

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
    void createOpeningLine();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera is not supported in this browser. You can still practice by voice.');
      setIsCallActive(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCallActive(true);
    } catch {
      setCameraMessage('Camera blocked. Allow camera access, or continue with voice practice.');
      setIsCallActive(true);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function endCall() {
    stopCamera();
    if (isCallActive && spokenCount > 0) {
      onComplete();
    }
    setTrainerMessage('');
    setIsCallActive(false);
  }

  function nextPhrase() {
    setPhraseIndex((index) => (index + 1) % callPhrases.length);
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
          <div className="trainer-avatar"><UserRound aria-hidden="true" size={42} /></div>
          <span>Trainer</span>
          <strong>{phrase.text}</strong>
          <small>{phrase.sound}</small>
        </div>
        <div className="student-window">
          <video ref={videoRef} autoPlay muted playsInline />
          {!streamRef.current && <span>Your camera preview</span>}
        </div>
      </div>

      {cameraMessage && <p className="speech-result">{cameraMessage}</p>}
      {trainerMessage && <p className="speech-result">{trainerMessage}</p>}

      <div className="call-task">
        <strong>Your turn</strong>
        <p>{phrase.translation}</p>
        {isCallActive ? <SpeechPractice language={language} target={phrase.text} onPassed={handlePassed} /> : <small>Start the call to answer with your voice.</small>}
      </div>
    </section>
  );
}
