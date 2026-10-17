type Props = {
  isSpeaking: boolean;
};

export default function TrainerAvatar({ isSpeaking }: Props) {
  return (
    <div className="trainer-avatar trainer-face" role="img" aria-label="Friendly language trainer">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <path className="trainer-face__hair" d="M35 74c0-37 18-57 46-57 30 0 50 21 50 56v25H35V74Z" />
        <circle className="trainer-face__ear" cx="38" cy="90" r="10" />
        <circle className="trainer-face__ear" cx="122" cy="90" r="10" />
        <path className="trainer-face__skin" d="M43 62c4-24 19-35 37-35 24 0 39 18 39 43v27c0 25-17 42-39 42s-37-17-37-42V62Z" />
        <path className="trainer-face__hair" d="M43 64c6-27 24-37 45-37 20 0 33 9 39 27-17-9-31-19-46-16-13 3-24 13-38 26Z" />
        <path className="trainer-face__brow" d="M57 79c6-4 13-4 19 0M85 79c6-4 13-4 19 0" />
        <circle className="trainer-face__eye" cx="67" cy="91" r="4" />
        <circle className="trainer-face__eye" cx="94" cy="91" r="4" />
        <path className="trainer-face__nose" d="M81 93v13l-5 3" />
        <path className={`trainer-face__mouth${isSpeaking ? ' trainer-face__mouth--speaking' : ''}`} d="M67 119c8 5 18 5 26 0" />
        <path className="trainer-face__neck" d="M65 136v11h30v-11" />
        <path className="trainer-face__shirt" d="M45 160c5-17 17-24 35-24s30 7 35 24H45Z" />
      </svg>
    </div>
  );
}
