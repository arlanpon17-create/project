import { useState } from 'react';
import { GraduationCap, Lightbulb } from 'lucide-react';
import { noteNames } from '../lib/musicCourseData';

const exercises = [
  { midi: 60, name: 'C4', idea: 'This is middle C, a useful starting point on the keyboard.', hint: 'Choose the first C key.' },
  { midi: 64, name: 'E4', idea: 'E is higher than C. The notes C, D, E move upward step by step.', hint: 'Count up from C: C, D, E.' },
  { midi: 67, name: 'G4', idea: 'G is the fifth note in the C major scale. It sounds stable with C.', hint: 'From C, count C, D, E, F, G.' },
  { midi: 72, name: 'C5', idea: 'This C is one octave above middle C. The note name repeats, but the pitch is higher.', hint: 'Choose the C at the far right.' },
];

export default function MusicTrainer({ onPlayNote }: { onPlayNote: (midi: number) => void }) {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const exercise = exercises[step];

  function tryNote(midi: number) {
    onPlayNote(midi);
    setComplete(midi === exercise.midi);
    setShowHint(midi !== exercise.midi);
  }

  function nextExercise() {
    setStep((value) => value + 1);
    setComplete(false);
    setShowHint(false);
  }

  if (!exercise) {
    return <section className="music-trainer"><GraduationCap aria-hidden="true" size={28} /><h3>Lesson complete!</h3><p>You played four notes and learned how pitch moves across an octave.</p><button type="button" onClick={() => { setStep(0); setComplete(false); }}>Practice again</button></section>;
  }

  return (
    <section className="music-trainer" aria-live="polite">
      <p className="eyebrow">Music trainer · Note {step + 1} of {exercises.length}</p>
      <div className="music-trainer-heading"><GraduationCap aria-hidden="true" size={24} /><h3>Play {exercise.name}</h3></div>
      <p>Trainer: Tap the {exercise.name} key and listen to its pitch.</p>
      <div className="trainer-note-keys">
        {noteNames.map((note, index) => <button className={note.midi === exercise.midi ? 'trainer-note-key trainer-note-key--target' : 'trainer-note-key'} type="button" key={`${note.name}-${index}`} onClick={() => tryNote(note.midi)}>{note.name}{index === 7 ? '5' : '4'}</button>)}
      </div>
      {showHint && <p className="trainer-hint"><Lightbulb aria-hidden="true" size={17} /> Trainer hint: {exercise.hint}</p>}
      {complete && <p className="trainer-success">That’s it! {exercise.idea}</p>}
      {complete && <button type="button" onClick={nextExercise}>{step === exercises.length - 1 ? 'Finish lesson' : 'Next note'}</button>}
    </section>
  );
}
