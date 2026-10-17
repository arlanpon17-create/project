import { useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, Volume2 } from 'lucide-react';
import { musicLessons, noteNames, songs } from '../lib/musicCourseData';
import MusicTrainer from './MusicTrainer';

type Instrument = 'Piano' | 'Flute' | 'Guitar' | 'Organ';
type CourseMode = 'trainer' | 'studio';
const instruments: Instrument[] = ['Piano', 'Flute', 'Guitar', 'Organ'];
const noteLabels: Record<number, string> = { 60: 'C4', 62: 'D4', 64: 'E4', 65: 'F4', 67: 'G4', 69: 'A4', 71: 'B4', 72: 'C5' };

export default function MusicCourse() {
  const [courseMode, setCourseMode] = useState<CourseMode>('trainer');
  const [instrument, setInstrument] = useState<Instrument>('Piano');
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const timerRef = useRef<number | null>(null);

  function getAudio() {
    audioRef.current ??= new AudioContext();
    if (audioRef.current.state === 'suspended') void audioRef.current.resume();
    return audioRef.current;
  }

  function playNote(midi: number, duration = 0.42, startsAt?: number) {
    const audio = getAudio();
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    const wave: OscillatorType = instrument === 'Guitar' ? 'sawtooth' : instrument === 'Organ' ? 'square' : instrument === 'Flute' ? 'sine' : 'triangle';
    const start = startsAt ?? audio.currentTime;
    oscillator.type = wave;
    oscillator.frequency.value = 440 * (2 ** ((midi - 69) / 12));
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(instrument === 'Guitar' ? 0.14 : 0.1, start + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume);
    volume.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
    nodesRef.current.push(oscillator);
    oscillator.onended = () => { nodesRef.current = nodesRef.current.filter((node) => node !== oscillator); };
  }

  function stopSong() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    nodesRef.current.forEach((node) => { try { node.stop(); } catch { /* Already ended. */ } });
    nodesRef.current = [];
    setPlayingSong(null);
  }

  function playSong(title: string, notes: number[]) {
    stopSong();
    setPlayingSong(title);
    const audio = getAudio();
    const start = audio.currentTime + 0.08;
    notes.forEach((note, index) => playNote(note, 0.36, start + index * 0.42));
    timerRef.current = window.setTimeout(() => setPlayingSong(null), notes.length * 420 + 200);
  }

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    nodesRef.current.forEach((node) => { try { node.stop(); } catch { /* Already ended. */ } });
    void audioRef.current?.close();
  }, []);

  return (
    <section className="menu-panel music-course" aria-label="Music course">
      <div className="music-course-heading"><div><p className="eyebrow">New course</p><h2>Music Studio</h2><p>Learn the basics, choose an instrument sound, and play a song.</p></div><Music aria-hidden="true" size={30} /></div>
      <div className="music-mode-picker" role="group" aria-label="Music course mode">
        <button className={courseMode === 'trainer' ? 'chess-mode chess-mode--active' : 'chess-mode'} type="button" onClick={() => setCourseMode('trainer')}>Study with trainer</button>
        <button className={courseMode === 'studio' ? 'chess-mode chess-mode--active' : 'chess-mode'} type="button" onClick={() => setCourseMode('studio')}>Play songs</button>
      </div>
      {courseMode === 'trainer' ? <>
        <div className="music-lesson-grid">
          {musicLessons.map((lesson) => <article className="music-lesson" key={lesson.title}><h3>{lesson.title}</h3><p>{lesson.text}</p></article>)}
        </div>
        <MusicTrainer onPlayNote={(midi) => playNote(midi)} />
      </> : <>
      <label className="music-instrument-picker">Instrument sound
        <select value={instrument} onChange={(event) => setInstrument(event.target.value as Instrument)}>
          {instruments.map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <div className="music-song-list">
        {songs.map((song) => <article className="music-song" key={song.title}>
          <div><strong>{song.title}</strong><small>{song.origin} · {song.notes.length} notes</small></div>
          <button type="button" onClick={() => playingSong === song.title ? stopSong() : playSong(song.title, song.notes)}>
            {playingSong === song.title ? <><Pause aria-hidden="true" size={17} /> Stop</> : <><Play aria-hidden="true" size={17} /> Play song</>}
          </button>
        </article>)}
      </div>
      <div className="music-keyboard-heading"><div><Volume2 aria-hidden="true" size={18} /><strong>Play the notes yourself</strong></div><span>{activeNote === null ? 'Tap a key to hear it.' : `Playing ${noteLabels[activeNote]}`}</span></div>
      <div className="music-keyboard" aria-label="One octave keyboard">
        {noteNames.map((note, index) => <button className={activeNote === note.midi ? 'music-key music-key--active' : 'music-key'} type="button" key={`${note.name}-${index}`} onClick={() => {
          setActiveNote(note.midi);
          playNote(note.midi);
          window.setTimeout(() => setActiveNote((value) => value === note.midi ? null : value), 250);
        }}><span>{note.name}</span></button>)}
      </div>
      <p className="music-note">Instrument sounds are made in your browser. Use headphones or turn your volume down before playing.</p>
      </>}
    </section>
  );
}
