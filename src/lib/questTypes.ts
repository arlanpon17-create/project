export type Language =
  | 'All'
  | 'Kazakh'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'English'
  | 'Portuguese'
  | 'Italian'
  | 'Russian'
  | 'Japanese'
  | 'Chinese'
  | 'Korean'
  | 'Arabic'
  | 'Hindi'
  | 'Turkish'
  | 'Swedish'
  | 'Dutch'
  | 'Vietnamese'
  | 'Polish'
  | 'Greek'
  | 'Indonesian'
  | 'Thai'
  | 'Ukrainian'
  | 'Finnish'
  | 'Norwegian'
  | 'Danish'
  | 'Czech'
  | 'Romanian'
  | 'Hebrew'
  | 'Malay'
  | 'Filipino'
  | 'Swahili'
  | 'Bengali'
  | 'Urdu'
  | 'Persian';

export type Quest = {
  prompt: string;
  answer: string;
  options: string[];
  hint: string;
  world: string;
  language: Exclude<Language, 'All'>;
};
