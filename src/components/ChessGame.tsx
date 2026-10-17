import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { saveChessRecord } from '../lib/chessRecords';

type OnlineMove = { id: string; from: string; to: string; promotion: 'q' };
type Props = {
  mode: 'trainer' | 'local' | 'online';
  playerColor?: 'w' | 'b';
  remoteMove?: OnlineMove | null;
  onMove?: (move: { from: string; to: string; promotion: 'q' }) => void;
};
type PieceKey = `${'w' | 'b'}${'k' | 'q' | 'r' | 'b' | 'n' | 'p'}`;

const symbols: Record<PieceKey, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};
const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function getStatus(game: Chess, mode: Props['mode'], playerColor: 'w' | 'b' = 'w') {
  if (game.isCheckmate()) return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`;
  if (game.isStalemate()) return 'Draw by stalemate.';
  if (game.isDraw()) return 'The game is a draw.';
  const side = mode === 'online'
    ? game.turn() === playerColor ? 'Your turn' : 'Opponent’s turn'
    : game.turn() === 'w' ? 'White' : mode === 'trainer' ? 'Trainer' : 'Black';
  return `${side} to move${game.isCheck() ? ' — check!' : '.'}`;
}

export default function ChessGame({ mode, playerColor = 'w', remoteMove, onMove }: Props) {
  const gameRef = useRef(new Chess());
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const lastRemoteMoveRef = useRef('');
  const savedGameRef = useRef(false);
  const game = gameRef.current;
  const legalMoves = useMemo(
    () => selected ? game.moves({ square: selected, verbose: true }) : [],
    // The game object is updated in place; revision refreshes its legal moves.
    [game, revision, selected],
  );
  const targets = new Set(legalMoves.map((move) => move.to));
  const moves = game.history({ verbose: true });
  const whitePoints = moves.reduce((total, move) => {
    if (!move.captured) return total;
    const value = pieceValues[move.captured];
    return total + (move.color === 'w' ? value : -value);
  }, 0);
  const blackPoints = -whitePoints;
  const yourPoints = mode === 'online' && playerColor === 'b' ? blackPoints : whitePoints;

  useEffect(() => {
    if (!game.isGameOver() || savedGameRef.current) return;
    savedGameRef.current = true;
    const result = game.isCheckmate()
      ? `${game.turn() === 'w' ? 'Black' : 'White'} won by checkmate`
      : game.isStalemate() ? 'Draw by stalemate' : 'Draw';
    void saveChessRecord({ mode, result, pgn: game.pgn(), white_points: whitePoints, black_points: blackPoints }).catch(() => {
      savedGameRef.current = false;
    });
  }, [blackPoints, game, mode, revision, whitePoints]);

  useEffect(() => {
    if (mode !== 'trainer' || game.turn() !== 'b' || game.isGameOver()) return;
    const timer = window.setTimeout(() => {
      const moves = game.moves({ verbose: true });
      const move = moves
        .map((candidate) => ({
          candidate,
          score: (candidate.captured ? pieceValues[candidate.captured] : 0)
            + (candidate.promotion ? 8 : 0)
            + (candidate.san.endsWith('+') ? 2 : 0)
            + Math.random(),
        }))
        .sort((first, second) => second.score - first.score)[0]?.candidate;
      if (move) game.move(move);
      setSelected(null);
      setRevision((value) => value + 1);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [game, mode, revision]);

  useEffect(() => {
    if (mode !== 'online' || !remoteMove || remoteMove.id === lastRemoteMoveRef.current) return;
    lastRemoteMoveRef.current = remoteMove.id;
    try {
      game.move({ from: remoteMove.from as Square, to: remoteMove.to as Square, promotion: remoteMove.promotion });
      setSelected(null);
      setRevision((value) => value + 1);
    } catch {
      // Ignore a stale or invalid network move and keep the board playable.
    }
  }, [game, mode, remoteMove]);

  function startNewGame() {
    gameRef.current = new Chess();
    savedGameRef.current = false;
    setSelected(null);
    setRevision((value) => value + 1);
  }

  function clickSquare(square: Square) {
    if (game.isGameOver()) return;
    if (mode === 'online' && game.turn() !== playerColor) return;
    const piece = game.get(square);
    if (selected && targets.has(square)) {
      const move = { from: selected, to: square, promotion: 'q' as const };
      game.move(move);
      onMove?.(move);
      setSelected(null);
      setRevision((value) => value + 1);
      return;
    }
    if (piece?.color === game.turn() && (mode === 'local' || (mode === 'online' ? piece.color === playerColor : piece.color === 'w'))) {
      setSelected(square);
    } else {
      setSelected(null);
    }
  }

  const history = game.history();
  const board = game.board();
  const squares = Array.from({ length: 64 }, (_, index) => {
    const flip = mode === 'online' && playerColor === 'b';
    const rowIndex = flip ? 7 - Math.floor(index / 8) : Math.floor(index / 8);
    const columnIndex = flip ? 7 - (index % 8) : index % 8;
    const square = `${'abcdefgh'[columnIndex]}${8 - rowIndex}` as Square;
    return { piece: board[rowIndex][columnIndex], rowIndex, columnIndex, square };
  });
  return (
    <section className="chess-game" aria-label="Chess game">
      <div className="chess-game-header">
        <div>
          <p className="eyebrow">{mode === 'trainer' ? 'Play vs trainer' : 'Two players'}</p>
          <h2
            className={game.isCheckmate() ? 'chess-game-status--checkmate' : undefined}
            role={game.isCheckmate() ? 'alert' : undefined}
            aria-live="polite"
          >
            {getStatus(game, mode, playerColor)}
          </h2>
          <p>{mode === 'trainer' ? 'You play White. The trainer plays Black.' : mode === 'online' ? `You play ${playerColor === 'w' ? 'White' : 'Black'}.` : 'Take turns on one device. Pass it to Black after White moves.'}</p>
        </div>
        {mode !== 'online' && <button className="secondary" type="button" onClick={startNewGame}>New game</button>}
      </div>
      <div className="chess-board" role="grid" aria-label="Chess board">
        {squares.map(({ piece, rowIndex, columnIndex, square }) => {
          const isLight = (rowIndex + columnIndex) % 2 === 1;
          const isFlipped = mode === 'online' && playerColor === 'b';
          const showRank = isFlipped ? columnIndex === 7 : columnIndex === 0;
          const showFile = isFlipped ? rowIndex === 0 : rowIndex === 7;
          const isTarget = targets.has(square);
          const classes = [
            'chess-square', isLight ? 'chess-square--light' : 'chess-square--dark',
            selected === square ? 'chess-square--selected' : '',
            isTarget ? (piece ? 'chess-square--capture' : 'chess-square--target') : '',
          ].filter(Boolean).join(' ');
          const key = piece ? `${piece.color}${piece.type}` as PieceKey : null;
          return (
            <button className={classes} type="button" role="gridcell" key={square} onClick={() => clickSquare(square)} aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}>
              {showRank && <span className="chess-coordinate chess-coordinate--rank">{8 - rowIndex}</span>}
              {showFile && <span className="chess-coordinate chess-coordinate--file">{'abcdefgh'[columnIndex]}</span>}
              {key && <span className={piece?.color === 'w' ? 'chess-piece chess-piece--white' : 'chess-piece chess-piece--black'}>{symbols[key]}</span>}
              {isTarget && !piece && <span className="chess-target-dot" />}
            </button>
          );
        })}
      </div>
      <div className="chess-capture-points" aria-live="polite">
        <strong>{mode === 'local' ? 'Capture points' : `Your points: ${yourPoints}`}</strong>
        <span>White: {whitePoints} · Black: {blackPoints}</span>
        <small>Taking a piece adds its value; losing one deducts it. Pawn 1 · Knight/Bishop 3 · Rook 5 · Queen 9</small>
      </div>
      {game.isGameOver() && <p className="chess-game-result">Game saved to your history: {game.isCheckmate() ? 'checkmate' : 'draw'}.</p>}
      <div className="chess-move-list"><strong>Moves</strong><span>{history.length ? history.slice(-8).join(' · ') : 'Make the first move.'}</span></div>
    </section>
  );
}
