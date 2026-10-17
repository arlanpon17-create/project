const lessons = [
  {
    title: '1. The board and pieces',
    text: 'The board has 64 squares. White starts at the bottom. The queen starts on her own color. Each side has a king, queen, two rooks, two bishops, two knights, and eight pawns.',
    tip: 'Set up the board with a light square in each player’s right-hand corner.',
  },
  {
    title: '2. How pieces move',
    text: 'Rooks move in straight lines. Bishops move diagonally. Queens do both. Knights move in an L shape and can jump. Kings move one square. Pawns move forward, but capture diagonally.',
    tip: 'Try to picture the knight’s move as two squares, then one to the side.',
  },
  {
    title: '3. Check and checkmate',
    text: 'Check means your king is under attack. You must move the king, capture the attacking piece, or block the attack. Checkmate means there is no legal way to escape check, so the game ends.',
    tip: 'Never make a move that leaves your own king in check.',
  },
  {
    title: '4. A strong opening',
    text: 'Bring pawns toward the center, develop knights and bishops, and castle to protect your king. Try not to move the same piece again and again while your other pieces stay at home.',
    tip: 'Before each move, ask: “Is my king safe, and what is my opponent threatening?”',
  },
];

export default function ChessLessons({ onStartTrainer }: { onStartTrainer: () => void }) {
  return (
    <div className="chess-lessons">
      <div className="chess-course-intro">
        <p className="eyebrow">Chess course</p>
        <h2>Learn one move at a time.</h2>
        <p>Start with the board, learn how each piece moves, then practice check, checkmate, and good opening habits.</p>
      </div>
      <div className="chess-lesson-list">
        {lessons.map((lesson) => (
          <article className="chess-lesson" key={lesson.title}>
            <h3>{lesson.title}</h3>
            <p>{lesson.text}</p>
            <small>{lesson.tip}</small>
          </article>
        ))}
      </div>
      <button type="button" onClick={onStartTrainer}>Practice with trainer</button>
    </div>
  );
}
