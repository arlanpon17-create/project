import { useState } from 'react';
import { BookOpen, Globe2, RotateCcw, UserRound, Users } from 'lucide-react';
import ChessGame from './ChessGame';
import ChessLessons from './ChessLessons';
import ChessTrainer from './ChessTrainer';
import OnlineChess from './OnlineChess';

type CourseView = 'home' | 'study' | 'trainer' | 'play' | 'online';
type GameMode = 'trainer' | 'local';

export default function ChessCourse({ displayName }: { displayName: string }) {
  const [courseView, setCourseView] = useState<CourseView>('home');
  const [gameMode, setGameMode] = useState<GameMode>('trainer');

  return (
    <section className="menu-panel chess-course" aria-label="Chess course">
      <div className="chess-course-topline">
        <div><p className="eyebrow">New course</p><h2>Chess Academy</h2></div>
        {courseView !== 'home' && <button className="secondary" type="button" onClick={() => setCourseView('home')}><RotateCcw aria-hidden="true" size={16} /> Course menu</button>}
      </div>
      {courseView === 'home' && (
        <div className="chess-choice-grid">
          <button className="chess-choice" type="button" onClick={() => setCourseView('study')}>
            <BookOpen aria-hidden="true" size={28} /><strong>Study chess</strong><span>Learn the board, pieces, checks, and opening ideas.</span>
          </button>
          <button className="chess-choice" type="button" onClick={() => setCourseView('play')}>
            <Users aria-hidden="true" size={28} /><strong>Play a game</strong><span>Practice against the trainer or play with someone beside you.</span>
          </button>
          <button className="chess-choice" type="button" onClick={() => setCourseView('trainer')}>
            <BookOpen aria-hidden="true" size={28} /><strong>Guided chess trainer</strong><span>Practice chess ideas with fixed lessons and hints.</span>
          </button>
          <button className="chess-choice" type="button" onClick={() => setCourseView('online')}>
            <Globe2 aria-hidden="true" size={28} /><strong>Random online player</strong><span>Challenge someone online. They can accept or decline.</span>
          </button>
        </div>
      )}
      {courseView === 'study' && <ChessLessons onStartTrainer={() => setCourseView('trainer')} />}
      {courseView === 'trainer' && <ChessTrainer />}
      {courseView === 'online' && <OnlineChess displayName={displayName} />}
      {courseView === 'play' && (
        <>
          <div className="chess-mode-picker" role="group" aria-label="Choose opponent">
            <button className={gameMode === 'trainer' ? 'chess-mode chess-mode--active' : 'chess-mode'} type="button" onClick={() => setGameMode('trainer')}>
              <UserRound aria-hidden="true" size={18} /> Play trainer
            </button>
            <button className={gameMode === 'local' ? 'chess-mode chess-mode--active' : 'chess-mode'} type="button" onClick={() => setGameMode('local')}>
              <Users aria-hidden="true" size={18} /> Play someone here
            </button>
          </div>
          <ChessGame key={gameMode} mode={gameMode} />
        </>
      )}
    </section>
  );
}
