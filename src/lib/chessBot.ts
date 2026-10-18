import { Chess } from 'chess.js';

export type ChessBotDifficulty = 'easy' | 'medium' | 'hard';

const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const mateScore = 10000;

export function chooseBotMove(game: Chess, difficulty: ChessBotDifficulty) {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;
  if (difficulty === 'easy') return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  if (difficulty === 'medium') {
    const rankedMoves = legalMoves.map((move) => ({
      move,
      score: (move.captured ? values[move.captured] * 2 : 0)
        + (move.promotion ? 8 : 0)
        + (move.san.endsWith('+') ? 2 : 0)
        + Math.random() * 2,
    }));
    return rankedMoves.sort((a, b) => b.score - a.score)[0].move;
  }

  return legalMoves.map((move) => {
    const position = new Chess(game.fen());
    position.move({ from: move.from, to: move.to, promotion: move.promotion });
    return { move, score: search(position, 2, -mateScore, mateScore) };
  }).sort((a, b) => b.score - a.score)[0].move;
}

function search(game: Chess, depth: number, alpha: number, beta: number): number {
  if (game.isCheckmate()) return game.turn() === 'b' ? -mateScore - depth : mateScore + depth;
  if (game.isDraw() || depth === 0) return evaluateMaterial(game);

  const maximizing = game.turn() === 'b';
  let best = maximizing ? -mateScore : mateScore;
  for (const move of game.moves({ verbose: true })) {
    const position = new Chess(game.fen());
    position.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = search(position, depth - 1, alpha, beta);
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
    if (maximizing) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function evaluateMaterial(game: Chess) {
  return game.board().flat().reduce((score, piece) => {
    if (!piece) return score;
    return score + values[piece.type] * (piece.color === 'b' ? 1 : -1);
  }, 0);
}
