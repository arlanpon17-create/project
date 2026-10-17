export type Song = { title: string; origin: string; notes: number[] };

export const songs: Song[] = [
  { title: 'Twinkle, Twinkle, Little Star', origin: 'Traditional', notes: [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60] },
  { title: 'Ode to Joy', origin: 'Ludwig van Beethoven', notes: [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62] },
  { title: 'Frère Jacques', origin: 'Traditional', notes: [60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67, 64, 65, 67] },
];

export const noteNames = [
  { name: 'C', midi: 60 }, { name: 'D', midi: 62 }, { name: 'E', midi: 64 },
  { name: 'F', midi: 65 }, { name: 'G', midi: 67 }, { name: 'A', midi: 69 },
  { name: 'B', midi: 71 }, { name: 'C', midi: 72 },
];

export const musicLessons = [
  { title: 'Pitch', text: 'Notes can sound high or low. On a keyboard, notes to the right sound higher.' },
  { title: 'Rhythm', text: 'Rhythm is the pattern of long and short sounds. Tap a steady beat as you play.' },
  { title: 'Melody', text: 'A melody is a line of notes you can hum. Songs are built from small repeating patterns.' },
];
