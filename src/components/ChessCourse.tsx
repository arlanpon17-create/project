import { useState } from 'react';
import { BookOpen, Globe2, History, RotateCcw, UserRound, Users } from 'lucide-react';
import ChessGame from './ChessGame';
import ChessLessons from './ChessLessons';
import ChessTrainer from './ChessTrainer';
import ChessHistory from './ChessHistory';
import OnlineChess from './OnlineChess';
import type { ChessBotDifficulty } from '../lib/chessBot';

type CourseView = 'home' | 'study' | 'trainer' | 'play' | 'online' | 'history';
type GameMode = 'trainer' | 'local';

export default function ChessCourse({ displayName, accountId }: { displayName: string; accountId?: string }) {
  const [courseView, setCourseView] = useState<CourseView>('home');
  const [gameMode, setGameMode] = useState<GameMode>('trainer');
  const [botDifficulty, setBotDifficulty] = useState<ChessBotDifficulty>('medium');

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
          <button className="chess-choice" type="button" onClick={() => setCourseView('history')}>
            <History aria-hidden="true" size={28} /><strong>Game history & analysis</strong><span>Review completed games, results, and capture points.</span>
          </button>
        </div>
      )}
      {courseView === 'study' && <ChessLessons onStartTrainer={() => setCourseView('trainer')} />}
      {courseView === 'trainer' && <ChessTrainer />}
      {courseView === 'history' && <ChessHistory />}
      {courseView === 'online' && <OnlineChess displayName={displayName} accountId={accountId} />}
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
          {gameMode === 'trainer' && <div className="chess-mode-picker" role="group" aria-label="Choose bot difficulty">
            <span>Bot difficulty</span>
            {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
              <button className={botDifficulty === difficulty ? 'chess-mode chess-mode--active' : 'chess-mode'} type="button" key={difficulty} onClick={() => setBotDifficulty(difficulty)}>
                {difficulty[0].toUpperCase() + difficulty.slice(1)}
              </button>
            ))}
          </div>}
          <ChessGame key={gameMode} mode={gameMode} botDifficulty={botDifficulty} />
        </>
      )}
    </section>
  );
}
