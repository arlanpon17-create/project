import { useState } from 'react';
import { GraduationCap, Lightbulb } from 'lucide-react';

const exercises = [
  {
    title: 'Set up the queen',
    prompt: 'Where does White’s queen start?',
    choices: ['d1', 'e1', 'h1', 'a8'],
    answer: 'd1',
    hint: 'The queen starts on her own color, next to her king.',
    explanation: 'White’s queen starts on d1, a light square. Black’s queen starts on d8.',
  },
  {
    title: 'Move the knight',
    prompt: 'A knight is on e4. Which square can it jump to?',
    choices: ['f6', 'e6', 'g4', 'c4'],
    answer: 'f6',
    hint: 'A knight moves two squares one way, then one square sideways.',
    explanation: 'f6 is two ranks up and one file over from e4, an L-shaped knight move.',
  },
  {
    title: 'Protect your king',
    prompt: 'Your king is in check. What must you do?',
    choices: ['Make a legal move that escapes check', 'Ignore it and move a pawn', 'Move your queen anywhere', 'Wait for the next turn'],
    answer: 'Make a legal move that escapes check',
    hint: 'Your king cannot stay under attack after your move.',
    explanation: 'You must escape check by moving the king, capturing the attacker, or blocking the attack.',
  },
  {
    title: 'Plan the opening',
    prompt: 'What is a good opening plan?',
    choices: ['Control the center and develop pieces', 'Move the same piece over and over', 'Bring the queen out alone', 'Leave the king in the center forever'],
    answer: 'Control the center and develop pieces',
    hint: 'Bring your knights and bishops into the game, then keep your king safe.',
    explanation: 'Center control gives pieces room to move. Developing pieces helps you castle and defend.',
  },
];

export default function ChessTrainer() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState('');
  const [showHint, setShowHint] = useState(false);
  const exercise = exercises[step];
  const isCorrect = selected === exercise?.answer;

  function chooseAnswer(answer: string) {
    setSelected(answer);
    setShowHint(answer !== exercise.answer);
  }

  function nextExercise() {
    setStep((value) => value + 1);
    setSelected('');
    setShowHint(false);
  }

  if (!exercise) {
    return <section className="chess-trainer"><GraduationCap aria-hidden="true" size={30} /><h3>Training complete!</h3><p>You practiced setup, piece movement, king safety, and opening plans.</p><button type="button" onClick={() => { setStep(0); setSelected(''); }}>Train again</button></section>;
  }

  return (
    <section className="chess-trainer" aria-live="polite">
      <p className="eyebrow">Chess trainer · Exercise {step + 1} of {exercises.length}</p>
      <div className="chess-trainer-heading"><GraduationCap aria-hidden="true" size={25} /><h3>{exercise.title}</h3></div>
      <p>Trainer: {exercise.prompt}</p>
      <div className="trainer-answer-list">
        {exercise.choices.map((choice) => <button className={selected === choice ? 'trainer-answer trainer-answer--selected' : 'trainer-answer'} type="button" key={choice} onClick={() => chooseAnswer(choice)}>{choice}</button>)}
      </div>
      {showHint && <p className="trainer-hint"><Lightbulb aria-hidden="true" size={17} /> Trainer hint: {exercise.hint}</p>}
      {isCorrect && <p className="trainer-success">Correct! {exercise.explanation}</p>}
      {isCorrect && <button type="button" onClick={nextExercise}>{step === exercises.length - 1 ? 'Finish training' : 'Next exercise'}</button>}
    </section>
  );
}
