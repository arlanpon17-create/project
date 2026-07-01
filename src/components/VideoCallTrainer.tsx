import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, UserRound } from 'lucide-react';
import SpeechPractice from './SpeechPractice';

type Phrase = {
  text: string;
  sound: string;
  translation: string;
};

type Props = {
  language: string;
  phrases: Phrase[];
  onPassed: (text: string) => void;
  onComplete: () => void;
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

function getTopicPhrase(language: string, topic: string): Phrase {
  const opener = topicOpeners[language] ?? topicOpeners.English;
  return {
    text: `${opener.start} ${topic}.`,
    sound: `${opener.sound} ${topic}`,
    translation: `I want to talk about ${topic}.`,
  };
}

export default function VideoCallTrainer({ language, phrases, onPassed, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [topic, setTopic] = useState('');
  const [spokenCount, setSpokenCount] = useState(0);
  const [cameraMessage, setCameraMessage] = useState('');
  const cleanTopic = topic.trim();
  const callPhrases = cleanTopic ? [getTopicPhrase(language, cleanTopic), ...phrases] : phrases;
  const phrase = callPhrases[phraseIndex] ?? callPhrases[0];

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    setPhraseIndex(0);
  }, [language, cleanTopic]);

  async function startCall() {
    setCameraMessage('');
    setSpokenCount(0);

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

      <div className="call-task">
        <strong>Your turn</strong>
        <p>{phrase.translation}</p>
        {isCallActive ? (
          <SpeechPractice language={language} target={phrase.text} onPassed={handlePassed} />
        ) : (
          <small>Start the call to answer with your voice.</small>
        )}
      </div>
    </section>
  );
}
