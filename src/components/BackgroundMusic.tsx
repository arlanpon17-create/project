import { useEffect, useRef } from 'react';

type BackgroundMusicProps = {
  enabled: boolean;
};

const melody = [220, 246.94, 261.63, 293.66, 261.63, 246.94, 220, 196];
const bass = [110, 123.47, 130.81, 98];
const noteMs = 1200;

function playTone(
  context: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType,
) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

export default function BackgroundMusic({ enabled }: BackgroundMusicProps) {
  const contextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const stepRef = useRef(0);

  useEffect(() => {
    async function startMusic() {
      const audioWindow = window as Window & typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;

      if (context.state === 'suspended') {
        await context.resume();
      }

      timerRef.current = window.setInterval(() => {
        const step = stepRef.current;
        const startTime = context.currentTime + 0.02;
        const melodyFrequency = melody[step % melody.length];
        const bassFrequency = bass[Math.floor(step / 2) % bass.length];

        playTone(context, melodyFrequency, startTime, 1.05, 0.026, 'sine');
        if (step % 2 === 0) {
          playTone(context, bassFrequency, startTime, 1.4, 0.018, 'sine');
        }

        stepRef.current = step + 1;
      }, noteMs);
    }

    function stopMusic() {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    if (enabled) {
      void startMusic();
    } else {
      stopMusic();
    }

    return stopMusic;
  }, [enabled]);

  return null;
}
