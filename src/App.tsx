import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Coins,
  Diamond,
  Flame,
  Gamepad2,
  Gem,
  Gift,
  Globe2,
  GraduationCap,
  Heart,
  Home,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Music,
  PackageOpen,
  Play,
  RotateCcw,
  Save,
  Settings,
  ShoppingBag,
  Sparkles,
  Timer,
  Trophy,
  UserPlus,
  Volume2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import AITutor from './components/AITutor';
import BackgroundMusic from './components/BackgroundMusic';
import DailyReward from './components/DailyReward';
import DesignEditor from './components/DesignEditor';
import InterfaceLanguageSelect from './components/InterfaceLanguageSelect';
import LessonAiPicker from './components/LessonAiPicker';
import type { AiLessonOption } from './components/LessonAiPicker';
import Leaderboard from './components/Leaderboard';
import QuestionAiHelp from './components/QuestionAiHelp';
import {
  createAiHint,
  createAiQuestion,
  type QuestionContext,
} from './lib/aiQuestions';
import {
  getInterfaceMessage,
  type InterfaceLanguage,
  type InterfaceMessageKey,
} from './lib/interfaceLanguage';
import { supabase } from './lib/supabase';
import type { PlayerSnapshot } from './lib/rewards';

type Language =
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
  | 'Filipino';
type View = 'start' | 'quest' | 'languages' | 'lessons' | 'shop' | 'rewards' | 'leaderboard' | 'login' | 'register' | 'settings';
type LessonPackId = string;
type LessonPack = {
  id: LessonPackId;
  title: string;
  description: string;
  keywords: string[];
  language?: Exclude<Language, 'All'>;
  size?: number;
};
type ChestRarity = 'Super rare' | 'Rare' | 'Epic' | 'Mythic' | 'Legendary' | 'Ultimate' | 'Ultra ultimate';
type RarityInventory = Record<ChestRarity, number>;
type ChestPrize = {
  kind: 'xp' | 'diamonds' | 'freeze';
  amount: number;
  label: string;
};

function ButtonLabel({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="button-label">
      <Icon aria-hidden="true" size={18} strokeWidth={2.4} />
      <span>{children}</span>
    </span>
  );
}

function StatLabel({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="stat-label">
      <Icon aria-hidden="true" size={16} strokeWidth={2.4} />
      <span>{children}</span>
    </span>
  );
}

function GoogleAuthButton({ mode, onSignIn }: { mode: 'login' | 'register' | 'continue'; onSignIn: () => void }) {
  const googleLabel = mode === 'register' ? 'Register with Google' : mode === 'continue' ? 'Continue with Google' : 'Google Sign In';

  return (
    <div className="oauth-actions" aria-label="Social login">
      <button className="secondary" type="button" onClick={onSignIn}>
        <ButtonLabel icon={Mail}>{googleLabel}</ButtonLabel>
      </button>
    </div>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  return initials || 'G';
}

function ProfileAvatar({ name, imageUrl }: { name: string; imageUrl: string }) {
  return (
    <div className="profile-avatar" aria-label={`${name || 'Guest'} profile picture`}>
      {imageUrl ? <img src={imageUrl} alt="" /> : <span>{getInitials(name || 'Guest')}</span>}
    </div>
  );
}

const languageFlags: Record<Language, string> = {
  All: '🌐',
  Kazakh: '🇰🇿',
  Spanish: '🇪🇸',
  French: '🇫🇷',
  German: '🇩🇪',
  English: '🇬🇧',
  Portuguese: '🇵🇹',
  Italian: '🇮🇹',
  Russian: '🇷🇺',
  Japanese: '🇯🇵',
  Chinese: '🇨🇳',
  Korean: '🇰🇷',
  Arabic: '🇸🇦',
  Hindi: '🇮🇳',
  Turkish: '🇹🇷',
  Swedish: '🇸🇪',
  Dutch: '🇳🇱',
  Vietnamese: '🇻🇳',
  Polish: '🇵🇱',
  Greek: '🇬🇷',
  Indonesian: '🇮🇩',
  Thai: '🇹🇭',
  Ukrainian: '🇺🇦',
  Finnish: '🇫🇮',
  Norwegian: '🇳🇴',
  Danish: '🇩🇰',
  Czech: '🇨🇿',
  Romanian: '🇷🇴',
  Hebrew: '🇮🇱',
  Malay: '🇲🇾',
  Filipino: '🇵🇭',
};

function FlagLabel({ language }: { language: Language }) {
  return (
    <span className="flag-label">
      <span className="language-flag" aria-hidden="true">{languageFlags[language]}</span>
      <span>{language}</span>
    </span>
  );
}

type PlayerProgress = {
  selectedLanguage: Language;
  questIndex: number;
  hearts: number;
  score: number;
  streak: number;
  xp: number;
  diamonds: number;
  shopChests: number;
  rarityChests: RarityInventory;
  streakFreezes: number;
  streakShieldUntil: string | null;
  lastDailyLessonDate: string | null;
  chestOpened: boolean;
  heartRefillAt: number | null;
  country: string;
  city: string;
};

type PlayerSettings = {
  sound: boolean;
  music: boolean;
  hardMode: boolean;
  bossMode: boolean;
};

type Account = {
  password: string;
  progress: PlayerProgress;
  settings: PlayerSettings;
  avatarUrl?: string;
};

type Accounts = Record<string, Account>;

type Quest = {
  prompt: string;
  answer: string;
  options: string[];
  hint: string;
  world: string;
  language: Exclude<Language, 'All'>;
};

const accountsKey = 'language-quest-accounts';
const guestProgressKey = 'language-quest-guest-progress';
const guestSettingsKey = 'language-quest-guest-settings';
const interfaceLanguageKey = 'language-quest-interface-language';
const tutorialSeenKey = 'language-quest-tutorial-seen';
const oauthPlayerKey = 'language-quest-oauth-player';
const maxHearts = 5;
const heartRefillMs = 60 * 60 * 1000;
const defaultLessonQuestionCount = 10;
const bossModeTimeLimit = 120;
const shopChestXpCost = 700;
const shopChestDiamondCost = 700;
const xpBundleDiamondCost = 100;
const xpBundleReward = 500;
const diamondBundleXpCost = 200;
const diamondBundleReward = 400;
const streakFreezeXpCost = 1000;
const streakFreezeDiamondCost = 1000;
const maxStreakFreezes = 5;
const weeklyShieldCost = maxStreakFreezes;
const weeklyShieldDays = 7;
const chestRarities: ChestRarity[] = ['Super rare', 'Rare', 'Epic', 'Mythic', 'Legendary', 'Ultimate', 'Ultra ultimate'];
const chestRarityWeights: Record<ChestRarity, number> = {
  'Super rare': 32,
  Rare: 26,
  Epic: 18,
  Mythic: 11,
  Legendary: 7,
  Ultimate: 4,
  'Ultra ultimate': 2,
};
const rarityRewards: Record<ChestRarity, { xp: number; diamonds: number; freezes: number }> = {
  'Super rare': { xp: 80, diamonds: 20, freezes: 0 },
  Rare: { xp: 120, diamonds: 35, freezes: 0 },
  Epic: { xp: 180, diamonds: 55, freezes: 1 },
  Mythic: { xp: 260, diamonds: 80, freezes: 1 },
  Legendary: { xp: 380, diamonds: 100, freezes: 2 },
  Ultimate: { xp: 400, diamonds: 100, freezes: 2 },
  'Ultra ultimate': { xp: 400, diamonds: 100, freezes: 2 },
};

function getRandomChestPrize(reward: { xp: number; diamonds: number; freezes: number }): ChestPrize {
  const prizes: ChestPrize[] = [
    { kind: 'xp', amount: reward.xp, label: `${reward.xp} XP` },
    { kind: 'diamonds', amount: reward.diamonds, label: `${reward.diamonds} diamonds` },
  ];

  if (reward.freezes > 0) {
    prizes.push({ kind: 'freeze', amount: reward.freezes, label: `${reward.freezes} streak freeze${reward.freezes === 1 ? '' : 's'}` });
  }

  return prizes[Math.floor(Math.random() * prizes.length)];
}

function createEmptyRarityInventory(): RarityInventory {
  return chestRarities.reduce(
    (inventory, rarity) => ({ ...inventory, [rarity]: 0 }),
    {} as RarityInventory,
  );
}

function normalizeRarityInventory(inventory?: Partial<RarityInventory>): RarityInventory {
  return chestRarities.reduce(
    (nextInventory, rarity) => ({
      ...nextInventory,
      [rarity]: inventory?.[rarity] ?? 0,
    }),
    {} as RarityInventory,
  );
}

function getRandomChestRarity(): ChestRarity {
  const totalWeight = chestRarities.reduce((total, rarity) => total + chestRarityWeights[rarity], 0);
  let roll = Math.random() * totalWeight;

  for (const rarity of chestRarities) {
    roll -= chestRarityWeights[rarity];
    if (roll <= 0) return rarity;
  }

  return 'Super rare';
}

const defaultProgress: PlayerProgress = {
  selectedLanguage: 'All',
  questIndex: 0,
  hearts: maxHearts,
  score: 0,
  streak: 0,
  xp: 100,
  diamonds: 100,
  shopChests: 0,
  rarityChests: createEmptyRarityInventory(),
  streakFreezes: 0,
  streakShieldUntil: null,
  lastDailyLessonDate: null,
  chestOpened: false,
  heartRefillAt: null,
  country: '',
  city: '',
};
const defaultSettings: PlayerSettings = {
  sound: false,
  music: false,
  hardMode: false,
  bossMode: false,
};
const countryOptions = [
  'Kazakhstan',
  'United States',
  'United Kingdom',
  'Turkey',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Japan',
  'South Korea',
  'China',
  'India',
  'Brazil',
  'Other',
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
}

function readAccounts(): Accounts {
  return readJson<Accounts>(accountsKey, {});
}

function writeAccounts(accounts: Accounts) {
  localStorage.setItem(accountsKey, JSON.stringify(accounts));
}

function normalizeSettings(settings: Partial<PlayerSettings> = {}): PlayerSettings {
  return {
    ...defaultSettings,
    ...settings,
  };
}

function getOAuthProgressKey(userId: string) {
  return `language-quest-oauth-${userId}-progress`;
}

function getOAuthSettingsKey(userId: string) {
  return `language-quest-oauth-${userId}-settings`;
}

function getOAuthAvatarKey(userId: string) {
  return `language-quest-oauth-${userId}-avatar`;
}

function readOAuthProgress(userId: string) {
  return getDailyCheckedProgress(readJson(getOAuthProgressKey(userId), defaultProgress));
}

function getProfileText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

function capStreakFreezes(value: number) {
  return Math.min(maxStreakFreezes, Math.max(0, value));
}

function getStreakCalendarDays(streak: number, lastDate: string | null) {
  const today = getLocalDateKey();
  const streakDates = new Set<string>();

  if (lastDate) {
    for (let index = 0; index < streak; index += 1) {
      streakDates.add(addDays(lastDate, -index));
    }
  }

  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addDays(today, index - 6);
    const date = new Date(`${dateKey}T00:00:00`);

    return {
      dateKey,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      number: date.getDate(),
      complete: streakDates.has(dateKey),
      today: dateKey === today,
    };
  });
}

function isShieldActive(shieldUntil: string | null, dateKey = getLocalDateKey()) {
  return Boolean(shieldUntil && getDaysBetween(dateKey, shieldUntil) >= 0);
}

function getDailyCheckedProgress(progress: PlayerProgress): PlayerProgress {
  if (!progress.lastDailyLessonDate) {
    return {
      ...progress,
      streakFreezes: capStreakFreezes(progress.streakFreezes ?? defaultProgress.streakFreezes),
      streakShieldUntil: progress.streakShieldUntil ?? defaultProgress.streakShieldUntil,
      lastDailyLessonDate: null,
    };
  }

  const today = getLocalDateKey();
  const missedDays = getDaysBetween(progress.lastDailyLessonDate, today) - 1;
  const streakShieldUntil = progress.streakShieldUntil ?? defaultProgress.streakShieldUntil;

  if (missedDays <= 0) {
    return {
      ...progress,
      streakFreezes: capStreakFreezes(progress.streakFreezes ?? defaultProgress.streakFreezes),
      streakShieldUntil,
    };
  }

  if (isShieldActive(streakShieldUntil, today)) {
    return {
      ...progress,
      streakFreezes: capStreakFreezes(progress.streakFreezes ?? defaultProgress.streakFreezes),
      streakShieldUntil,
      lastDailyLessonDate: today,
    };
  }

  const freezes = capStreakFreezes(progress.streakFreezes ?? defaultProgress.streakFreezes);
  const usedFreezes = Math.min(freezes, missedDays);
  const missedAfterFreeze = missedDays - usedFreezes;

  return {
    ...progress,
    streak: missedAfterFreeze > 0 ? 0 : progress.streak,
    streakFreezes: freezes - usedFreezes,
    streakShieldUntil,
    lastDailyLessonDate: missedAfterFreeze > 0 ? null : addDays(progress.lastDailyLessonDate, usedFreezes),
  };
}

function readStoredProgress() {
  const accounts = readAccounts();
  const savedPlayer = localStorage.getItem('language-quest-player') || '';
  const progress = savedPlayer && accounts[savedPlayer] ? accounts[savedPlayer].progress : readJson(guestProgressKey, defaultProgress);
  return getDailyCheckedProgress(progress);
}

function getRefilledHeartState(progress: PlayerProgress, now = Date.now()) {
  let hearts = Math.min(progress.hearts, maxHearts);
  const refillAt = progress.heartRefillAt;

  if (hearts >= maxHearts) {
    return { hearts: maxHearts, heartRefillAt: null };
  }

  if (!refillAt) {
    return { hearts, heartRefillAt: now + heartRefillMs };
  }

  if (now < refillAt) {
    return { hearts, heartRefillAt: refillAt };
  }

  const restoredHearts = Math.floor((now - refillAt) / heartRefillMs) + 1;
  hearts = Math.min(maxHearts, hearts + restoredHearts);

  return {
    hearts,
    heartRefillAt: hearts >= maxHearts ? null : refillAt + restoredHearts * heartRefillMs,
  };
}

function formatRefillTime(refillAt: number | null) {
  if (!refillAt) return '';
  const remainingSeconds = Math.max(0, Math.ceil((refillAt - Date.now()) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function shuffleOptions(options: string[]) {
  const shuffled = [...options];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

const kazakhQuests: Omit<Quest, 'language'>[] = [
  {
    prompt: 'What does "travel" mean?',
    answer: 'sayahat',
    options: ['sayahat', 'qala', 'kitap', 'dost'],
    hint: 'Moving from one place to another.',
    world: 'Desert Gate',
  },
  {
    prompt: 'Choose the English word for "qalam".',
    answer: 'pen',
    options: ['river', 'pen', 'apple', 'house'],
    hint: 'You write with it.',
    world: 'Ink Market',
  },
  {
    prompt: 'Complete: I ___ a new word every day.',
    answer: 'learn',
    options: ['learn', 'sleep', 'throw', 'paint'],
    hint: 'This is what language heroes do.',
    world: 'Verb Bridge',
  },
  {
    prompt: 'What does "friend" mean?',
    answer: 'dos',
    options: ['aspan', 'dos', 'su', 'kun'],
    hint: 'A person you trust and like.',
    world: 'Friend Forest',
  },
  {
    prompt: 'Choose the opposite of "fast".',
    answer: 'slow',
    options: ['bright', 'slow', 'young', 'soft'],
    hint: 'Not quick.',
    world: 'River Turn',
  },
  {
    prompt: 'Translate "I am ready".',
    answer: 'Men daiynmyn',
    options: ['Men daiynmyn', 'Sen barasyn', 'Biz oqushymyz', 'Ol uide'],
    hint: 'It means prepared now.',
    world: 'Final Camp',
  },
  {
    prompt: 'What does "water" mean?',
    answer: 'su',
    options: ['nan', 'su', 'tau', 'ai'],
    hint: 'You drink it.',
    world: 'Blue Well',
  },
  {
    prompt: 'Choose the English word for "mektep".',
    answer: 'school',
    options: ['school', 'garden', 'window', 'market'],
    hint: 'A place where students learn.',
    world: 'School Yard',
  },
  {
    prompt: 'Complete: She ___ English on Monday.',
    answer: 'studies',
    options: ['studies', 'study', 'studying', 'studied'],
    hint: 'Use the present simple form for she.',
    world: 'Grammar Hill',
  },
  {
    prompt: 'What does "book" mean?',
    answer: 'kitap',
    options: ['qalam', 'kitap', 'esik', 'alma'],
    hint: 'You read it.',
    world: 'Library Steps',
  },
  {
    prompt: 'Choose the opposite of "big".',
    answer: 'small',
    options: ['small', 'warm', 'near', 'full'],
    hint: 'Tiny is another clue.',
    world: 'Tiny Cave',
  },
  {
    prompt: 'Translate "Good morning".',
    answer: 'Qaiyrly tan',
    options: ['Qaiyrly tan', 'Qaiyrly tun', 'Sau bol', 'Keshiriniz'],
    hint: 'A greeting at the start of the day.',
    world: 'Sunrise Road',
  },
  {
    prompt: 'What does "city" mean?',
    answer: 'qala',
    options: ['dala', 'qala', 'orman', 'kol'],
    hint: 'A large place with many streets and buildings.',
    world: 'City Gate',
  },
  {
    prompt: 'Choose the English word for "aspan".',
    answer: 'sky',
    options: ['sky', 'stone', 'song', 'table'],
    hint: 'Look up.',
    world: 'Cloud Pass',
  },
  {
    prompt: 'Complete: We ___ three new phrases.',
    answer: 'know',
    options: ['knows', 'know', 'known', 'knowing'],
    hint: 'Use the present simple form for we.',
    world: 'Phrase Camp',
  },
  {
    prompt: 'What does "apple" mean?',
    answer: 'alma',
    options: ['alma', 'atai', 'bala', 'nan'],
    hint: 'A fruit that can be red or green.',
    world: 'Orchard Lane',
  },
  {
    prompt: 'Choose the opposite of "cold".',
    answer: 'hot',
    options: ['early', 'hot', 'quiet', 'open'],
    hint: 'Tea can be this.',
    world: 'Tea House',
  },
  {
    prompt: 'Translate "Thank you".',
    answer: 'Raqmet',
    options: ['Raqmet', 'Salem', 'Iya', 'Joq'],
    hint: 'You say it after someone helps you.',
    world: 'Kindness Square',
  },
  {
    prompt: 'What does "family" mean?',
    answer: 'otbasy',
    options: ['otbasy', 'sagat', 'jol', 'koz'],
    hint: 'Parents, children, and relatives.',
    world: 'Home Lantern',
  },
  {
    prompt: 'Choose the English word for "ustaz".',
    answer: 'teacher',
    options: ['teacher', 'doctor', 'driver', 'singer'],
    hint: 'This person helps students learn.',
    world: 'Lesson Hall',
  },
  {
    prompt: 'Complete: They ___ football after school.',
    answer: 'play',
    options: ['plays', 'play', 'played', 'playing'],
    hint: 'Use the present simple form for they.',
    world: 'Field Path',
  },
  {
    prompt: 'What does "bread" mean?',
    answer: 'nan',
    options: ['sut', 'nan', 'bal', 'et'],
    hint: 'A common food served with meals.',
    world: 'Bakery Corner',
  },
  {
    prompt: 'Choose the opposite of "open".',
    answer: 'closed',
    options: ['closed', 'clean', 'early', 'kind'],
    hint: 'A door can be this.',
    world: 'Door Puzzle',
  },
  {
    prompt: 'Translate "See you".',
    answer: 'Kezdeskenshe',
    options: ['Kezdeskenshe', 'Kosh keldiniz', 'Qaiyrly kun', 'Magan unaidy'],
    hint: 'A casual goodbye.',
    world: 'Farewell Bridge',
  },
  {
    prompt: 'What does "road" mean?',
    answer: 'jol',
    options: ['jol', 'ui', 'qol', 'gul'],
    hint: 'Cars and people travel on it.',
    world: 'Stone Road',
  },
  {
    prompt: 'Choose the English word for "terese".',
    answer: 'window',
    options: ['window', 'chair', 'clock', 'bag'],
    hint: 'You look outside through it.',
    world: 'Glass Tower',
  },
  {
    prompt: 'Complete: He ___ to music every night.',
    answer: 'listens',
    options: ['listen', 'listens', 'listening', 'listened'],
    hint: 'Use the present simple form for he.',
    world: 'Music Cave',
  },
  {
    prompt: 'What does "flower" mean?',
    answer: 'gul',
    options: ['gul', 'tas', 'qus', 'qyz'],
    hint: 'It grows in a garden.',
    world: 'Garden Ring',
  },
  {
    prompt: 'Choose the opposite of "happy".',
    answer: 'sad',
    options: ['sad', 'long', 'near', 'strong'],
    hint: 'Not joyful.',
    world: 'Feeling Fork',
  },
  {
    prompt: 'Translate "I like it".',
    answer: 'Magan unaidy',
    options: ['Magan unaidy', 'Men biledim', 'Ol zhaksy', 'Biz kuttik'],
    hint: 'A phrase for something you enjoy.',
    world: 'Choice Plaza',
  },
  {
    prompt: 'What does "time" mean?',
    answer: 'uaqyt',
    options: ['uaqyt', 'bala', 'aua', 'qalam'],
    hint: 'Clocks measure it.',
    world: 'Clock Garden',
  },
  {
    prompt: 'Choose the English word for "aua".',
    answer: 'air',
    options: ['air', 'fire', 'milk', 'sound'],
    hint: 'You breathe it.',
    world: 'Wind Steps',
  },
  {
    prompt: 'Complete: I can ___ this sentence.',
    answer: 'read',
    options: ['read', 'reads', 'reading', 'reader'],
    hint: 'Use the base verb after can.',
    world: 'Sentence Gate',
  },
  {
    prompt: 'What does "milk" mean?',
    answer: 'sut',
    options: ['shai', 'sut', 'mai', 'tuz'],
    hint: 'A white drink.',
    world: 'White Spring',
  },
  {
    prompt: 'Choose the opposite of "near".',
    answer: 'far',
    options: ['far', 'new', 'thin', 'right'],
    hint: 'A long distance away.',
    world: 'Far Ridge',
  },
  {
    prompt: 'Translate "Welcome".',
    answer: 'Kosh keldiniz',
    options: ['Kosh keldiniz', 'Keshiriniz', 'Men daiynmyn', 'Qaiyrly tan'],
    hint: 'You say it when someone arrives.',
    world: 'Welcome Arch',
  },
];

const extraLanguageQuests: Quest[] = [
  // Spanish - expanded
  { language: 'Spanish', prompt: 'What does "hello" mean in Spanish?', answer: 'hola', options: ['hola', 'gracias', 'noche', 'libro'], hint: 'A greeting at the start of a conversation.', world: 'Spanish Plaza' },
  { language: 'Spanish', prompt: 'Choose the English word for "agua".', answer: 'water', options: ['water', 'bread', 'street', 'friend'], hint: 'You drink it.', world: 'Fountain Street' },
  { language: 'Spanish', prompt: 'Translate "thank you" into Spanish.', answer: 'gracias', options: ['gracias', 'perro', 'manana', 'rojo'], hint: 'You say it after someone helps you.', world: 'Market Smile' },
  { language: 'Spanish', prompt: 'What does "casa" mean?', answer: 'house', options: ['house', 'music', 'teacher', 'flower'], hint: 'A place where someone lives.', world: 'Tile House' },
  { language: 'Spanish', prompt: 'Choose the Spanish word for "book".', answer: 'libro', options: ['mesa', 'libro', 'verde', 'leche'], hint: 'You read it.', world: 'Book Stall' },
  { language: 'Spanish', prompt: 'What does "buenos dias" mean?', answer: 'good morning', options: ['good morning', 'good night', 'see you', 'excuse me'], hint: 'A greeting early in the day.', world: 'Morning Square' },
  { language: 'Spanish', prompt: 'Choose the Spanish word for "friend".', answer: 'amigo', options: ['amigo', 'hermano', 'vecino', 'profesor'], hint: 'A person you trust and like.', world: 'Friend Valley' },
  { language: 'Spanish', prompt: 'What does "no" mean?', answer: 'no', options: ['no', 'si', 'tal vez', 'que'], hint: 'The opposite of yes.', world: 'Decision Point' },
  { language: 'Spanish', prompt: 'Translate "I am ready".', answer: 'Estoy listo', options: ['Estoy listo', 'Tengo hambre', 'Me duele', 'Estoy cansado'], hint: 'Prepared and prepared to go.', world: 'Ready Gate' },
  { language: 'Spanish', prompt: 'What does "rojo" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A color like a rose.', world: 'Color Garden' },
  { language: 'Spanish', prompt: 'Choose the Spanish word for "dog".', answer: 'perro', options: ['perro', 'gato', 'pajaro', 'pez'], hint: 'A common household pet.', world: 'Friendly Meadow' },
  { language: 'Spanish', prompt: 'What does "noche" mean?', answer: 'night', options: ['night', 'morning', 'afternoon', 'evening'], hint: 'The time when it is dark.', world: 'Night Sky' },
  { language: 'Spanish', prompt: 'Translate "good night".', answer: 'buenas noches', options: ['buenas noches', 'buenos dias', 'buenas tardes', 'adios'], hint: 'A polite farewell before sleep.', world: 'Moonlit Tower' },
  { language: 'Spanish', prompt: 'What does "comida" mean?', answer: 'food', options: ['food', 'water', 'air', 'sun'], hint: 'What you eat.', world: 'Kitchen Garden' },
  { language: 'Spanish', prompt: 'Choose the Spanish word for "school".', answer: 'escuela', options: ['escuela', 'hospital', 'mercado', 'iglesia'], hint: 'A place where students learn.', world: 'Learning Haven' },
  { language: 'Spanish', prompt: 'What does "grande" mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not small.', world: 'Giant Hill' },
  { language: 'Spanish', prompt: 'Translate "I love it".', answer: 'Me encanta', options: ['Me encanta', 'No me gusta', 'Me duele', 'Tengo miedo'], hint: 'You really like something.', world: 'Heart Valley' },
  { language: 'Spanish', prompt: 'What does "tiempo" mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'What clocks measure.', world: 'Clock Tower' },
  { language: 'Spanish', prompt: 'Choose the Spanish word for "apple".', answer: 'manzana', options: ['manzana', 'platano', 'naranja', 'limon'], hint: 'A red or green fruit.', world: 'Orchard Path' },
  { language: 'Spanish', prompt: 'What does "feliz" mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Joy Castle' },
  { language: 'Spanish', prompt: 'Translate "excuse me".', answer: 'disculpe', options: ['disculpe', 'por favor', 'de nada', 'lo siento'], hint: 'A polite way to get attention.', world: 'Polite Plaza' },

  // French - expanded
  { language: 'French', prompt: 'What does "hello" mean in French?', answer: 'bonjour', options: ['bonjour', 'merci', 'pomme', 'rue'], hint: 'A polite greeting.', world: 'French Cafe' },
  { language: 'French', prompt: 'Choose the English word for "eau".', answer: 'water', options: ['water', 'school', 'air', 'road'], hint: 'You drink it.', world: 'River Cafe' },
  { language: 'French', prompt: 'Translate "thank you" into French.', answer: 'merci', options: ['merci', 'chien', 'bleu', 'porte'], hint: 'A polite word after help.', world: 'Kind Cafe' },
  { language: 'French', prompt: 'What does "livre" mean?', answer: 'book', options: ['book', 'city', 'milk', 'teacher'], hint: 'You read it.', world: 'Paper Bridge' },
  { language: 'French', prompt: 'Choose the French word for "friend".', answer: 'ami', options: ['ami', 'pain', 'soleil', 'fenetre'], hint: 'Someone you trust and like.', world: 'Friend Cafe' },
  { language: 'French', prompt: 'What does "bonne nuit" mean?', answer: 'good night', options: ['good night', 'good morning', 'welcome', 'I am ready'], hint: 'A phrase before sleep.', world: 'Moon Balcony' },
  { language: 'French', prompt: 'What does "non" mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'never'], hint: 'The opposite of oui.', world: 'Decision Grove' },
  { language: 'French', prompt: 'Translate "I am ready".', answer: 'Je suis pret', options: ['Je suis pret', 'J\'ai faim', 'J\'ai froid', 'Je suis fatigue'], hint: 'Prepared and prepared.', world: 'Ready Hall' },
  { language: 'French', prompt: 'What does "rouge" mean?', answer: 'red', options: ['red', 'blue', 'green', 'white'], hint: 'The color of wine or rose.', world: 'Red Square' },
  { language: 'French', prompt: 'Choose the French word for "dog".', answer: 'chien', options: ['chien', 'chat', 'oiseau', 'poisson'], hint: 'A loyal pet.', world: 'Pet Corner' },
  { language: 'French', prompt: 'What does "nuit" mean?', answer: 'night', options: ['night', 'day', 'morning', 'evening'], hint: 'When it is dark.', world: 'Night Path' },
  { language: 'French', prompt: 'Translate "good morning".', answer: 'bonjour', options: ['bonjour', 'bonsoir', 'bonne nuit', 'a bientot'], hint: 'A daytime greeting.', world: 'Morning Light' },
  { language: 'French', prompt: 'What does "nourriture" mean?', answer: 'food', options: ['food', 'water', 'air', 'light'], hint: 'What you eat to survive.', world: 'Feast Hall' },
  { language: 'French', prompt: 'Choose the French word for "school".', answer: 'ecole', options: ['ecole', 'hopital', 'marche', 'eglise'], hint: 'A place for learning.', world: 'School Gate' },
  { language: 'French', prompt: 'What does "grand" mean?', answer: 'big', options: ['big', 'small', 'medium', 'large'], hint: 'Not petit.', world: 'Big Plaza' },
  { language: 'French', prompt: 'Translate "I love it".', answer: 'J\'aime beaucoup', options: ['J\'aime beaucoup', 'Je n\'aime pas', 'C\'est mal', 'C\'est ennuyeux'], hint: 'You adore something.', world: 'Love Temple' },
  { language: 'French', prompt: 'What does "temps" mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Clock' },
  { language: 'French', prompt: 'Choose the French word for "apple".', answer: 'pomme', options: ['pomme', 'banane', 'orange', 'citron'], hint: 'A red or green fruit.', world: 'Apple Grove' },
  { language: 'French', prompt: 'What does "heureux" mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'scared'], hint: 'Full of joy.', world: 'Happy Village' },
  { language: 'French', prompt: 'Translate "excuse me".', answer: 'excusez-moi', options: ['excusez-moi', 's\'il vous plait', 'de rien', 'je suis desole'], hint: 'A polite interruption.', world: 'Polite Lane' },

  // German - expanded
  { language: 'German', prompt: 'What does "hello" mean in German?', answer: 'hallo', options: ['hallo', 'danke', 'brot', 'stadt'], hint: 'A greeting.', world: 'German Gate' },
  { language: 'German', prompt: 'Choose the English word for "wasser".', answer: 'water', options: ['water', 'bread', 'time', 'flower'], hint: 'You drink it.', world: 'Water Mill' },
  { language: 'German', prompt: 'Translate "thank you" into German.', answer: 'danke', options: ['danke', 'schule', 'haus', 'apfel'], hint: 'A polite word after help.', world: 'Danke Hall' },
  { language: 'German', prompt: 'What does "schule" mean?', answer: 'school', options: ['school', 'street', 'window', 'milk'], hint: 'A place where students learn.', world: 'Classroom Road' },
  { language: 'German', prompt: 'Choose the German word for "apple".', answer: 'apfel', options: ['apfel', 'freund', 'buch', 'luft'], hint: 'A fruit that can be red or green.', world: 'Apple Hill' },
  { language: 'German', prompt: 'What does "guten morgen" mean?', answer: 'good morning', options: ['good morning', 'good night', 'see you', 'welcome'], hint: 'A greeting at the start of the day.', world: 'Morning Gate' },
  { language: 'German', prompt: 'What does "nein" mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'always'], hint: 'The opposite of ja.', world: 'No Bridge' },
  { language: 'German', prompt: 'Translate "I am ready".', answer: 'Ich bin bereit', options: ['Ich bin bereit', 'Ich habe Hunger', 'Ich bin kalt', 'Ich bin müde'], hint: 'Prepared and ready.', world: 'Ready Tower' },
  { language: 'German', prompt: 'What does "rot" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'The color of fire.', world: 'Red Forest' },
  { language: 'German', prompt: 'Choose the German word for "friend".', answer: 'freund', options: ['freund', 'bruder', 'vater', 'lehrer'], hint: 'Someone you like.', world: 'Friend Hall' },
  { language: 'German', prompt: 'What does "nacht" mean?', answer: 'night', options: ['night', 'day', 'morning', 'evening'], hint: 'When the sun sets.', world: 'Night Gate' },
  { language: 'German', prompt: 'Translate "good night".', answer: 'gute nacht', options: ['gute nacht', 'guten morgen', 'guten tag', 'auf wiedersehen'], hint: 'Before sleep.', world: 'Sleep Tower' },
  { language: 'German', prompt: 'What does "essen" mean?', answer: 'food', options: ['food', 'water', 'air', 'sun'], hint: 'What you eat.', world: 'Food Market' },
  { language: 'German', prompt: 'Choose the German word for "dog".', answer: 'hund', options: ['hund', 'katze', 'vogel', 'fisch'], hint: 'Man\'s best friend.', world: 'Pet Land' },
  { language: 'German', prompt: 'What does "gross" mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not klein.', world: 'Big Mountain' },
  { language: 'German', prompt: 'Translate "I love it".', answer: 'Ich liebe es', options: ['Ich liebe es', 'Ich mag es nicht', 'Es tut mir weh', 'Ich habe Angst'], hint: 'You adore something.', world: 'Love Valley' },
  { language: 'German', prompt: 'What does "zeit" mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Hall' },
  { language: 'German', prompt: 'Choose the German word for "house".', answer: 'haus', options: ['haus', 'strasse', 'schule', 'baum'], hint: 'A place where you live.', world: 'Home Sweet' },
  { language: 'German', prompt: 'What does "glucklich" mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Happy Peak' },
  { language: 'German', prompt: 'Translate "excuse me".', answer: 'entschuldigung', options: ['entschuldigung', 'bitte', 'gerne', 'tut mir leid'], hint: 'A polite interruption.', world: 'Polite Way' },

  // English - expanded
  { language: 'English', prompt: 'Choose the correct sentence.', answer: 'She likes music.', options: ['She likes music.', 'She like music.', 'She liking music.', 'She liked music now.'], hint: 'Use present simple with she.', world: 'English Studio' },
  { language: 'English', prompt: 'Choose the opposite of "early".', answer: 'late', options: ['late', 'clean', 'quiet', 'small'], hint: 'Not on time at the beginning.', world: 'Clock Tower' },
  { language: 'English', prompt: 'Complete: I am ___ a book.', answer: 'reading', options: ['read', 'reads', 'reading', 'reader'], hint: 'Use the -ing form after am.', world: 'Reading Room' },
  { language: 'English', prompt: 'Choose the synonym of "quick".', answer: 'fast', options: ['fast', 'cold', 'sad', 'closed'], hint: 'It means moving with speed.', world: 'Speed Lane' },
  { language: 'English', prompt: 'What does "understand" mean?', answer: 'comprehend', options: ['comprehend', 'ignore', 'forget', 'escape'], hint: 'To grasp the meaning.', world: 'Knowledge Peak' },
  { language: 'English', prompt: 'Choose the opposite of "inside".', answer: 'outside', options: ['outside', 'upside', 'beside', 'inside'], hint: 'Not within.', world: 'Outside Gate' },
  { language: 'English', prompt: 'Complete: He ___ to the gym every day.', answer: 'goes', options: ['go', 'goes', 'went', 'going'], hint: 'Use present simple with he.', world: 'Gym Path' },
  { language: 'English', prompt: 'What is the past tense of "eat"?', answer: 'ate', options: ['ate', 'eating', 'eats', 'eaten'], hint: 'What you did yesterday.', world: 'Past Valley' },
  { language: 'English', prompt: 'Choose the correct article: ___ cat is sleeping.', answer: 'The', options: ['The', 'A', 'An', 'Some'], hint: 'Use the definite article.', world: 'Grammar Gate' },
  { language: 'English', prompt: 'What is a synonym of "beautiful"?', answer: 'lovely', options: ['lovely', 'ugly', 'plain', 'dull'], hint: 'Another word for pretty.', world: 'Beauty Garden' },
  { language: 'English', prompt: 'Choose the correct form: I wish I ___ you yesterday.', answer: 'had seen', options: ['had seen', 'have seen', 'saw', 'see'], hint: 'Past perfect form.', world: 'Memory Lane' },
  { language: 'English', prompt: 'What does "curious" mean?', answer: 'inquisitive', options: ['inquisitive', 'shy', 'angry', 'tired'], hint: 'Wanting to know more.', world: 'Wonder Peak' },
  { language: 'English', prompt: 'Complete: If I ___ earlier, I would have caught the bus.', answer: 'had woken up', options: ['woke up', 'would wake up', 'had woken up', 'wake up'], hint: 'Conditional past.', world: 'If Valley' },
  { language: 'English', prompt: 'What is the opposite of "gain"?', answer: 'lose', options: ['lose', 'find', 'keep', 'take'], hint: 'To misplace or forfeit.', world: 'Loss Point' },
  { language: 'English', prompt: 'Choose the correct sentence: Neither of the students ___ their homework.', answer: 'did', options: ['did', 'have', 'has', 'were'], hint: 'With neither use singular verb.', world: 'Grammar Hall' },
  { language: 'English', prompt: 'What does "persistent" mean?', answer: 'continuous', options: ['continuous', 'lazy', 'careless', 'quick'], hint: 'Continuing despite difficulty.', world: 'Strong Tower' },
  { language: 'English', prompt: 'Choose the synonym of "terrified".', answer: 'scared', options: ['scared', 'happy', 'tired', 'bored'], hint: 'Full of fear.', world: 'Fear Forest' },
  { language: 'English', prompt: 'Complete: You should ___ more vegetables.', answer: 'eat', options: ['eating', 'ate', 'eat', 'eats'], hint: 'Use base form after should.', world: 'Health Trail' },
  { language: 'English', prompt: 'What is the past participle of "write"?', answer: 'written', options: ['written', 'wrote', 'writing', 'writes'], hint: 'Used in perfect tenses.', world: 'Writer Way' },
  { language: 'English', prompt: 'Choose the opposite of "success".', answer: 'failure', options: ['failure', 'trial', 'effort', 'attempt'], hint: 'Lack of success.', world: 'Result Peak' },

  // Portuguese - NEW
  { language: 'Portuguese', prompt: 'What does "olá" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'yes'], hint: 'A greeting.', world: 'Portuguese Plaza' },
  { language: 'Portuguese', prompt: 'Choose the Portuguese word for "water".', answer: 'agua', options: ['agua', 'pao', 'livro', 'amigo'], hint: 'You drink it.', world: 'Water Spring' },
  { language: 'Portuguese', prompt: 'Translate "thank you" into Portuguese.', answer: 'obrigado', options: ['obrigado', 'desculpe', 'por favor', 'de nada'], hint: 'A polite word after help.', world: 'Gratitude Hall' },
  { language: 'Portuguese', prompt: 'What does "não" mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'always'], hint: 'The opposite of sim.', world: 'No Gate' },
  { language: 'Portuguese', prompt: 'Choose the Portuguese word for "friend".', answer: 'amigo', options: ['amigo', 'inimigo', 'primo', 'vizinho'], hint: 'Someone you trust.', world: 'Friend Path' },
  { language: 'Portuguese', prompt: 'What does "casa" mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where you live.', world: 'Home Valley' },
  { language: 'Portuguese', prompt: 'Translate "good morning".', answer: 'bom dia', options: ['bom dia', 'boa noite', 'boa tarde', 'adeus'], hint: 'A daytime greeting.', world: 'Morning Light' },
  { language: 'Portuguese', prompt: 'What does "comida" mean?', answer: 'food', options: ['food', 'water', 'air', 'fire'], hint: 'What you eat.', world: 'Kitchen Garden' },
  { language: 'Portuguese', prompt: 'Choose the Portuguese word for "red".', answer: 'vermelho', options: ['vermelho', 'azul', 'verde', 'amarelo'], hint: 'The color of fire.', world: 'Red Forest' },
  { language: 'Portuguese', prompt: 'What does "livro" mean?', answer: 'book', options: ['book', 'table', 'chair', 'door'], hint: 'You read it.', world: 'Library Steps' },
  { language: 'Portuguese', prompt: 'Translate "I am ready".', answer: 'Estou pronto', options: ['Estou pronto', 'Tenho fome', 'Estou cansado', 'Tenho frio'], hint: 'Prepared and set.', world: 'Ready Gate' },
  { language: 'Portuguese', prompt: 'What does "escola" mean?', answer: 'school', options: ['school', 'hospital', 'market', 'church'], hint: 'A place for learning.', world: 'School Yard' },
  { language: 'Portuguese', prompt: 'Choose the Portuguese word for "dog".', answer: 'cao', options: ['cao', 'gato', 'passaro', 'peixe'], hint: 'A common pet.', world: 'Pet Corner' },
  { language: 'Portuguese', prompt: 'What does "grande" mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not small.', world: 'Big Mountain' },
  { language: 'Portuguese', prompt: 'Translate "good night".', answer: 'boa noite', options: ['boa noite', 'bom dia', 'boa tarde', 'até logo'], hint: 'Before sleep.', world: 'Night Rest' },
  { language: 'Portuguese', prompt: 'What does "tempo" mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Clock' },
  { language: 'Portuguese', prompt: 'Choose the Portuguese word for "apple".', answer: 'maca', options: ['maca', 'banana', 'laranja', 'limao'], hint: 'A red or green fruit.', world: 'Orchard Lane' },
  { language: 'Portuguese', prompt: 'What does "feliz" mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Joy Castle' },
  { language: 'Portuguese', prompt: 'Translate "I love it".', answer: 'Eu amo', options: ['Eu amo', 'Eu odeio', 'Eu gosto', 'Eu tenho medo'], hint: 'You adore something.', world: 'Love Temple' },
  { language: 'Portuguese', prompt: 'Translate "excuse me".', answer: 'desculpe-me', options: ['desculpe-me', 'por favor', 'de nada', 'tudo bem'], hint: 'A polite interruption.', world: 'Polite Plaza' },

  // Italian - NEW
  { language: 'Italian', prompt: 'What does "ciao" mean?', answer: 'hello/goodbye', options: ['hello/goodbye', 'thank you', 'water', 'friend'], hint: 'An informal greeting.', world: 'Italian Piazza' },
  { language: 'Italian', prompt: 'Choose the Italian word for "water".', answer: 'acqua', options: ['acqua', 'pane', 'libro', 'amico'], hint: 'You drink it.', world: 'Fountain Street' },
  { language: 'Italian', prompt: 'Translate "thank you" into Italian.', answer: 'grazie', options: ['grazie', 'scusa', 'per favore', 'prego'], hint: 'A polite word after help.', world: 'Gratitude Plaza' },
  { language: 'Italian', prompt: 'What does "no" mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'never'], hint: 'The opposite of si.', world: 'No Tower' },
  { language: 'Italian', prompt: 'Choose the Italian word for "friend".', answer: 'amico', options: ['amico', 'nemico', 'cugino', 'vicino'], hint: 'Someone you like.', world: 'Friend Valley' },
  { language: 'Italian', prompt: 'What does "casa" mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where you live.', world: 'Home Sweet' },
  { language: 'Italian', prompt: 'Translate "good morning".', answer: 'buongiorno', options: ['buongiorno', 'buonasera', 'buonanotte', 'arrivederci'], hint: 'A daytime greeting.', world: 'Morning Light' },
  { language: 'Italian', prompt: 'What does "cibo" mean?', answer: 'food', options: ['food', 'water', 'air', 'fire'], hint: 'What you eat.', world: 'Kitchen Garden' },
  { language: 'Italian', prompt: 'Choose the Italian word for "red".', answer: 'rosso', options: ['rosso', 'blu', 'verde', 'giallo'], hint: 'The color of fire.', world: 'Red Square' },
  { language: 'Italian', prompt: 'What does "libro" mean?', answer: 'book', options: ['book', 'table', 'chair', 'door'], hint: 'You read it.', world: 'Library Steps' },
  { language: 'Italian', prompt: 'Translate "I am ready".', answer: 'Sono pronto', options: ['Sono pronto', 'Ho fame', 'Sono stanco', 'Ho freddo'], hint: 'Prepared and set.', world: 'Ready Gate' },
  { language: 'Italian', prompt: 'What does "scuola" mean?', answer: 'school', options: ['school', 'hospital', 'market', 'church'], hint: 'A place for learning.', world: 'School Yard' },
  { language: 'Italian', prompt: 'Choose the Italian word for "dog".', answer: 'cane', options: ['cane', 'gatto', 'uccello', 'pesce'], hint: 'A common pet.', world: 'Pet Corner' },
  { language: 'Italian', prompt: 'What does "grande" mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not small.', world: 'Big Mountain' },
  { language: 'Italian', prompt: 'Translate "good night".', answer: 'buonanotte', options: ['buonanotte', 'buongiorno', 'buonasera', 'a presto'], hint: 'Before sleep.', world: 'Night Rest' },
  { language: 'Italian', prompt: 'What does "tempo" mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Clock' },
  { language: 'Italian', prompt: 'Choose the Italian word for "apple".', answer: 'mela', options: ['mela', 'banana', 'arancia', 'limone'], hint: 'A red or green fruit.', world: 'Orchard Lane' },
  { language: 'Italian', prompt: 'What does "felice" mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Joy Castle' },
  { language: 'Italian', prompt: 'Translate "I love it".', answer: 'Amo molto', options: ['Amo molto', 'Odio', 'Mi piace', 'Ho paura'], hint: 'You adore something.', world: 'Love Temple' },
  { language: 'Italian', prompt: 'Translate "excuse me".', answer: 'scusa', options: ['scusa', 'per favore', 'prego', 'va bene'], hint: 'A polite interruption.', world: 'Polite Plaza' },

  // Russian - NEW
  { language: 'Russian', prompt: 'What does "привет" (privet) mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'yes'], hint: 'A casual greeting.', world: 'Russian Square' },
  { language: 'Russian', prompt: 'Choose the Russian word for "water".', answer: 'вода (voda)', options: ['вода (voda)', 'хлеб (khleb)', 'книга (kniga)', 'друг (drug)'], hint: 'You drink it.', world: 'Water Well' },
  { language: 'Russian', prompt: 'Translate "thank you" into Russian.', answer: 'спасибо (spasibo)', options: ['спасибо (spasibo)', 'извините (izvinite)', 'пожалуйста (pozhaluysta)', 'да (da)'], hint: 'A polite word after help.', world: 'Gratitude Hall' },
  { language: 'Russian', prompt: 'What does "нет" (nyet) mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'always'], hint: 'The opposite of да.', world: 'No Gate' },
  { language: 'Russian', prompt: 'Choose the Russian word for "friend".', answer: 'друг (drug)', options: ['друг (drug)', 'враг (vrag)', 'брат (brat)', 'сосед (sosed)'], hint: 'Someone you trust.', world: 'Friend Path' },
  { language: 'Russian', prompt: 'What does "дом" (dom) mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where you live.', world: 'Home Valley' },
  { language: 'Russian', prompt: 'Translate "good morning".', answer: 'доброе утро (dobroye utro)', options: ['доброе утро (dobroye utro)', 'добрый вечер (dobryy vecher)', 'спокойной ночи (spokoynoy nochi)', 'до свидания (do svidaniya)'], hint: 'A daytime greeting.', world: 'Morning Light' },
  { language: 'Russian', prompt: 'What does "еда" (yeda) mean?', answer: 'food', options: ['food', 'water', 'air', 'fire'], hint: 'What you eat.', world: 'Kitchen Garden' },
  { language: 'Russian', prompt: 'Choose the Russian word for "red".', answer: 'красный (krasnyy)', options: ['красный (krasnyy)', 'синий (siniy)', 'зеленый (zelenyy)', 'желтый (zheltyy)'], hint: 'The color of fire.', world: 'Red Forest' },
  { language: 'Russian', prompt: 'What does "книга" (kniga) mean?', answer: 'book', options: ['book', 'table', 'chair', 'door'], hint: 'You read it.', world: 'Library Steps' },
  { language: 'Russian', prompt: 'Translate "I am ready".', answer: 'Я готов (Ya gotov)', options: ['Я готов (Ya gotov)', 'Я голоден (Ya goloden)', 'Я устал (Ya ustal)', 'Я холодно (Ya kholodno)'], hint: 'Prepared and set.', world: 'Ready Gate' },
  { language: 'Russian', prompt: 'What does "школа" (shkola) mean?', answer: 'school', options: ['school', 'hospital', 'market', 'church'], hint: 'A place for learning.', world: 'School Yard' },
  { language: 'Russian', prompt: 'Choose the Russian word for "dog".', answer: 'собака (sobaka)', options: ['собака (sobaka)', 'кошка (koshka)', 'птица (ptitsa)', 'рыба (ryba)'], hint: 'A common pet.', world: 'Pet Corner' },
  { language: 'Russian', prompt: 'What does "большой" (bolshoy) mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not small.', world: 'Big Mountain' },
  { language: 'Russian', prompt: 'Translate "good night".', answer: 'спокойной ночи (spokoynoy nochi)', options: ['спокойной ночи (spokoynoy nochi)', 'доброе утро (dobroye utro)', 'добрый вечер (dobryy vecher)', 'до встречи (do vstrechi)'], hint: 'Before sleep.', world: 'Night Rest' },
  { language: 'Russian', prompt: 'What does "время" (vremya) mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Clock' },
  { language: 'Russian', prompt: 'Choose the Russian word for "apple".', answer: 'яблоко (yabloko)', options: ['яблоко (yabloko)', 'банан (banan)', 'апельсин (apelsin)', 'лимон (limon)'], hint: 'A red or green fruit.', world: 'Orchard Lane' },
  { language: 'Russian', prompt: 'What does "счастливый" (schastlivyy) mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Joy Castle' },
  { language: 'Russian', prompt: 'Translate "I love it".', answer: 'Я люблю это (Ya lyublyu eto)', options: ['Я люблю это (Ya lyublyu eto)', 'Я ненавижу (Ya nenavizhу)', 'Мне нравится (Mne nravitsa)', 'Я боюсь (Ya boyus)'], hint: 'You adore something.', world: 'Love Temple' },
  { language: 'Russian', prompt: 'Translate "excuse me".', answer: 'извините (izvinite)', options: ['извините (izvinite)', 'пожалуйста (pozhaluysta)', 'пожалуйста (pozhaluysta)', 'все хорошо (vse khorosho)'], hint: 'A polite interruption.', world: 'Polite Plaza' },

  // Japanese - NEW
  { language: 'Japanese', prompt: 'What does "こんにちは" (konnichiha) mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'yes'], hint: 'A polite greeting.', world: 'Japanese Garden' },
  { language: 'Japanese', prompt: 'Choose the Japanese word for "water".', answer: '水 (mizu)', options: ['水 (mizu)', 'パン (pan)', '本 (hon)', '友達 (tomodachi)'], hint: 'You drink it.', world: 'Water Temple' },
  { language: 'Japanese', prompt: 'Translate "thank you" into Japanese.', answer: 'ありがとう (arigatou)', options: ['ありがとう (arigatou)', 'すみません (sumimasen)', 'お願いします (onegaishimasu)', 'はい (hai)'], hint: 'A polite word after help.', world: 'Gratitude Shrine' },
  { language: 'Japanese', prompt: 'What does "いいえ" (iie) mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'never'], hint: 'The opposite of はい.', world: 'No Tower' },
  { language: 'Japanese', prompt: 'Choose the Japanese word for "friend".', answer: '友達 (tomodachi)', options: ['友達 (tomodachi)', '敵 (teki)', '兄弟 (kyoudai)', '隣人 (rinjin)'], hint: 'Someone you trust.', world: 'Friend Path' },
  { language: 'Japanese', prompt: 'What does "家" (ie) mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where you live.', world: 'Home Valley' },
  { language: 'Japanese', prompt: 'Translate "good morning".', answer: 'おはよう (ohayou)', options: ['おはよう (ohayou)', 'こんばんは (konbanha)', 'おやすみなさい (oyasuminasai)', 'さようなら (sayounara)'], hint: 'A daytime greeting.', world: 'Morning Light' },
  { language: 'Japanese', prompt: 'What does "食べ物" (tabemono) mean?', answer: 'food', options: ['food', 'water', 'air', 'fire'], hint: 'What you eat.', world: 'Kitchen Garden' },
  { language: 'Japanese', prompt: 'Choose the Japanese word for "red".', answer: '赤 (aka)', options: ['赤 (aka)', '青 (ao)', '緑 (midori)', '黄色 (kiiro)'], hint: 'The color of fire.', world: 'Red Square' },
  { language: 'Japanese', prompt: 'What does "本" (hon) mean?', answer: 'book', options: ['book', 'table', 'chair', 'door'], hint: 'You read it.', world: 'Library Steps' },
  { language: 'Japanese', prompt: 'Translate "I am ready".', answer: 'I\'m ready (Junbi dekita)', options: ['I\'m ready (Junbi dekita)', 'I\'m hungry (Onaka suite iru)', 'I\'m tired (Tsukarete iru)', 'I\'m cold (Samui)'], hint: 'Prepared and set.', world: 'Ready Gate' },
  { language: 'Japanese', prompt: 'What does "学校" (gakkou) mean?', answer: 'school', options: ['school', 'hospital', 'market', 'church'], hint: 'A place for learning.', world: 'School Yard' },
  { language: 'Japanese', prompt: 'Choose the Japanese word for "dog".', answer: '犬 (inu)', options: ['犬 (inu)', '猫 (neko)', '鳥 (tori)', '魚 (sakana)'], hint: 'A common pet.', world: 'Pet Corner' },
  { language: 'Japanese', prompt: 'What does "大きい" (ookii) mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not small.', world: 'Big Mountain' },
  { language: 'Japanese', prompt: 'Translate "good night".', answer: 'おやすみなさい (oyasuminasai)', options: ['おやすみなさい (oyasuminasai)', 'おはよう (ohayou)', 'こんばんは (konbanha)', 'また明日 (mata ashita)'], hint: 'Before sleep.', world: 'Night Rest' },
  { language: 'Japanese', prompt: 'What does "時間" (jikan) mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Clock' },
  { language: 'Japanese', prompt: 'Choose the Japanese word for "apple".', answer: 'リンゴ (ringo)', options: ['リンゴ (ringo)', 'バナナ (banana)', 'オレンジ (orenji)', 'レモン (remon)'], hint: 'A red or green fruit.', world: 'Orchard Lane' },
  { language: 'Japanese', prompt: 'What does "幸せ" (shiawase) mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Joy Castle' },
  { language: 'Japanese', prompt: 'Translate "I love it".', answer: '大好き (daisuki)', options: ['大好き (daisuki)', 'キライ (kirai)', '好き (suki)', '怖い (kowai)'], hint: 'You adore something.', world: 'Love Temple' },
  { language: 'Japanese', prompt: 'Translate "excuse me".', answer: 'すみません (sumimasen)', options: ['すみません (sumimasen)', 'お願いします (onegaishimasu)', 'どうぞ (douzo)', 'いいえ (iie)'], hint: 'A polite interruption.', world: 'Polite Plaza' },

  // Chinese - NEW
  { language: 'Chinese', prompt: 'What does "你好" (nǐ hǎo) mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'yes'], hint: 'A polite greeting.', world: 'Chinese Plaza' },
  { language: 'Chinese', prompt: 'Choose the Chinese word for "water".', answer: '水 (shuǐ)', options: ['水 (shuǐ)', '面包 (miànbāo)', '书 (shū)', '朋友 (péngyou)'], hint: 'You drink it.', world: 'Water Dragon' },
  { language: 'Chinese', prompt: 'Translate "thank you" into Chinese.', answer: '谢谢 (xièxie)', options: ['谢谢 (xièxie)', '对不起 (duìbùqǐ)', '请 (qǐng)', '是 (shì)'], hint: 'A polite word after help.', world: 'Gratitude Hall' },
  { language: 'Chinese', prompt: 'What does "不" (bù) mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'never'], hint: 'The opposite of 是.', world: 'No Tower' },
  { language: 'Chinese', prompt: 'Choose the Chinese word for "friend".', answer: '朋友 (péngyou)', options: ['朋友 (péngyou)', '敌人 (díren)', '兄弟 (xiōngdi)', '邻居 (línjū)'], hint: 'Someone you trust.', world: 'Friend Path' },
  { language: 'Chinese', prompt: 'What does "房子" (fángzi) mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where you live.', world: 'Home Valley' },
  { language: 'Chinese', prompt: 'Translate "good morning".', answer: '早上好 (zǎoshang hǎo)', options: ['早上好 (zǎoshang hǎo)', '晚上好 (wǎnshang hǎo)', '晚安 (wǎn\'ān)', '再见 (zàijiàn)'], hint: 'A daytime greeting.', world: 'Morning Light' },
  { language: 'Chinese', prompt: 'What does "食物" (shíwù) mean?', answer: 'food', options: ['food', 'water', 'air', 'fire'], hint: 'What you eat.', world: 'Kitchen Garden' },
  { language: 'Chinese', prompt: 'Choose the Chinese word for "red".', answer: '红色 (hóngse)', options: ['红色 (hóngse)', '蓝色 (lánsè)', '绿色 (lǜsè)', '黄色 (huángsè)'], hint: 'The color of fire.', world: 'Red Square' },
  { language: 'Chinese', prompt: 'What does "书" (shū) mean?', answer: 'book', options: ['book', 'table', 'chair', 'door'], hint: 'You read it.', world: 'Library Steps' },
  { language: 'Chinese', prompt: 'Translate "I am ready".', answer: '我准备好了 (Wǒ zhǔnbèi hǎo le)', options: ['我准备好了 (Wǒ zhǔnbèi hǎo le)', '我饿了 (Wǒ è le)', '我累了 (Wǒ lèi le)', '我冷 (Wǒ lěng)'], hint: 'Prepared and set.', world: 'Ready Gate' },
  { language: 'Chinese', prompt: 'What does "学校" (xuéxiào) mean?', answer: 'school', options: ['school', 'hospital', 'market', 'church'], hint: 'A place for learning.', world: 'School Yard' },
  { language: 'Chinese', prompt: 'Choose the Chinese word for "dog".', answer: '狗 (gǒu)', options: ['狗 (gǒu)', '猫 (māo)', '鸟 (niǎo)', '鱼 (yú)'], hint: 'A common pet.', world: 'Pet Corner' },
  { language: 'Chinese', prompt: 'What does "大" (dà) mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not small.', world: 'Big Mountain' },
  { language: 'Chinese', prompt: 'Translate "good night".', answer: '晚安 (wǎn\'ān)', options: ['晚安 (wǎn\'ān)', '早上好 (zǎoshang hǎo)', '晚上好 (wǎnshang hǎo)', '明天见 (míngtiān jiàn)'], hint: 'Before sleep.', world: 'Night Rest' },
  { language: 'Chinese', prompt: 'What does "时间" (shíjiān) mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Clock' },
  { language: 'Chinese', prompt: 'Choose the Chinese word for "apple".', answer: '苹果 (píngguǒ)', options: ['苹果 (píngguǒ)', '香蕉 (xiāngjiāo)', '橙子 (chéngzi)', '柠檬 (níngméng)'], hint: 'A red or green fruit.', world: 'Orchard Lane' },
  { language: 'Chinese', prompt: 'What does "快乐" (kuàilè) mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Joy Castle' },
  { language: 'Chinese', prompt: 'Translate "I love it".', answer: '我喜欢它 (Wǒ xǐhuān tā)', options: ['我喜欢它 (Wǒ xǐhuān tā)', '我讨厌它 (Wǒ tǎoyàn tā)', '我喜欢 (Wǒ xǐhuān)', '我害怕 (Wǒ hàipà)'], hint: 'You adore something.', world: 'Love Temple' },
  { language: 'Chinese', prompt: 'Translate "excuse me".', answer: '对不起 (duìbùqǐ)', options: ['对不起 (duìbùqǐ)', '请 (qǐng)', '好的 (hǎo de)', '没关系 (méi guānxi)'], hint: 'A polite interruption.', world: 'Polite Plaza' },

  // Korean - NEW
  { language: 'Korean', prompt: 'What does "안녕하세요" (annyeonghaseyo) mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'yes'], hint: 'A polite greeting.', world: 'Korean Gate' },
  { language: 'Korean', prompt: 'Choose the Korean word for "water".', answer: '물 (mul)', options: ['물 (mul)', '빵 (ppang)', '책 (chaek)', '친구 (chingu)'], hint: 'You drink it.', world: 'Water Spring' },
  { language: 'Korean', prompt: 'Translate "thank you" into Korean.', answer: '감사합니다 (gamsahamnida)', options: ['감사합니다 (gamsahamnida)', '죄송합니다 (joeseonghamnida)', '부탁합니다 (butakhamnida)', '예 (ye)'], hint: 'A polite word after help.', world: 'Gratitude Hall' },
  { language: 'Korean', prompt: 'What does "아니요" (aniyo) mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'never'], hint: 'The opposite of 예.', world: 'No Tower' },
  { language: 'Korean', prompt: 'Choose the Korean word for "friend".', answer: '친구 (chingu)', options: ['친구 (chingu)', '적 (jeok)', '형제 (hyungje)', '이웃 (iut)'], hint: 'Someone you trust.', world: 'Friend Path' },
  { language: 'Korean', prompt: 'What does "집" (jip) mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where you live.', world: 'Home Valley' },
  { language: 'Korean', prompt: 'Translate "good morning".', answer: '좋은 아침 (joeun achim)', options: ['좋은 아침 (joeun achim)', '좋은 저녁 (joeun jeonyeok)', '안녕히 주무세요 (annyeonghi jumuseyo)', '안녕히 가세요 (annyeonghi gaseyo)'], hint: 'A daytime greeting.', world: 'Morning Light' },
  { language: 'Korean', prompt: 'What does "음식" (eumsik) mean?', answer: 'food', options: ['food', 'water', 'air', 'fire'], hint: 'What you eat.', world: 'Kitchen Garden' },
  { language: 'Korean', prompt: 'Choose the Korean word for "red".', answer: '빨강 (ppalggang)', options: ['빨강 (ppalggang)', '파랑 (pararang)', '초록 (chorок)', '노랑 (norang)'], hint: 'The color of fire.', world: 'Red Square' },
  { language: 'Korean', prompt: 'What does "책" (chaek) mean?', answer: 'book', options: ['book', 'table', 'chair', 'door'], hint: 'You read it.', world: 'Library Steps' },
  { language: 'Korean', prompt: 'Translate "I am ready".', answer: '준비됐어요 (junbidwasseoyo)', options: ['준비됐어요 (junbidwasseoyo)', '배고파요 (baegopayo)', '피곤해요 (pigonhaeyo)', '추워요 (chuweoyo)'], hint: 'Prepared and set.', world: 'Ready Gate' },
  { language: 'Korean', prompt: 'What does "학교" (hakgyo) mean?', answer: 'school', options: ['school', 'hospital', 'market', 'church'], hint: 'A place for learning.', world: 'School Yard' },
  { language: 'Korean', prompt: 'Choose the Korean word for "dog".', answer: '개 (gae)', options: ['개 (gae)', '고양이 (goyangi)', '새 (sae)', '물고기 (mulgogi)'], hint: 'A common pet.', world: 'Pet Corner' },
  { language: 'Korean', prompt: 'What does "크다" (keuda) mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not small.', world: 'Big Mountain' },
  { language: 'Korean', prompt: 'Translate "good night".', answer: '안녕히 주무세요 (annyeonghi jumuseyo)', options: ['안녕히 주무세요 (annyeonghi jumuseyo)', '좋은 아침 (joeun achim)', '좋은 저녁 (joeun jeonyeok)', '내일 봐요 (naeil bwayo)'], hint: 'Before sleep.', world: 'Night Rest' },
  { language: 'Korean', prompt: 'What does "시간" (sigan) mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Clock' },
  { language: 'Korean', prompt: 'Choose the Korean word for "apple".', answer: '사과 (sagwa)', options: ['사과 (sagwa)', '바나나 (banana)', '오렌지 (orenji)', '레몬 (remon)'], hint: 'A red or green fruit.', world: 'Orchard Lane' },
  { language: 'Korean', prompt: 'What does "행복" (haengbok) mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Joy Castle' },
  { language: 'Korean', prompt: 'Translate "I love it".', answer: '사랑해요 (saranghaeyo)', options: ['사랑해요 (saranghaeyo)', '싫어요 (silheoyo)', '좋아요 (joahyo)', '무서워요 (museowoyeo)'], hint: 'You adore something.', world: 'Love Temple' },
  { language: 'Korean', prompt: 'Translate "excuse me".', answer: '죄송합니다 (joeseonghamnida)', options: ['죄송합니다 (joeseonghamnida)', '부탁합니다 (butakhamnida)', '괜찮아요 (gwaenchanayo)', '아니요 (aniyo)'], hint: 'A polite interruption.', world: 'Polite Plaza' },

  // Arabic - NEW
  { language: 'Arabic', prompt: 'What does "مرحبا" (marhaba) mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'yes'], hint: 'A friendly greeting.', world: 'Arabic Souk' },
  { language: 'Arabic', prompt: 'Choose the Arabic word for "water".', answer: 'ماء (maa)', options: ['ماء (maa)', 'خبز (khubz)', 'كتاب (kitaab)', 'صديق (sadeeq)'], hint: 'You drink it.', world: 'Water Oasis' },
  { language: 'Arabic', prompt: 'Translate "thank you" into Arabic.', answer: 'شكرا (shukran)', options: ['شكرا (shukran)', 'معذرة (muadharah)', 'من فضلك (min fadhlak)', 'نعم (naam)'], hint: 'A polite word after help.', world: 'Gratitude Square' },
  { language: 'Arabic', prompt: 'What does "لا" (la) mean?', answer: 'no', options: ['no', 'yes', 'maybe', 'never'], hint: 'The opposite of نعم.', world: 'No Gate' },
  { language: 'Arabic', prompt: 'Choose the Arabic word for "friend".', answer: 'صديق (sadeeq)', options: ['صديق (sadeeq)', 'عدو (aduw)', 'أخ (akh)', 'جار (jar)'], hint: 'Someone you trust.', world: 'Friend Path' },
  { language: 'Arabic', prompt: 'What does "بيت" (bayt) mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where you live.', world: 'Home Valley' },
  { language: 'Arabic', prompt: 'Translate "good morning".', answer: 'صباح الخير (sabah al-khair)', options: ['صباح الخير (sabah al-khair)', 'مساء الخير (masaa al-khair)', 'تصبح على خير (tasba7 ala khair)', 'وداعا (wadaana)'], hint: 'A daytime greeting.', world: 'Morning Light' },
  { language: 'Arabic', prompt: 'What does "طعام" (taam) mean?', answer: 'food', options: ['food', 'water', 'air', 'fire'], hint: 'What you eat.', world: 'Kitchen Garden' },
  { language: 'Arabic', prompt: 'Choose the Arabic word for "red".', answer: 'أحمر (ahmar)', options: ['أحمر (ahmar)', 'أزرق (azraq)', 'أخضر (akhdar)', 'أصفر (asfar)'], hint: 'The color of fire.', world: 'Red Square' },
  { language: 'Arabic', prompt: 'What does "كتاب" (kitaab) mean?', answer: 'book', options: ['book', 'table', 'chair', 'door'], hint: 'You read it.', world: 'Library Steps' },
  { language: 'Arabic', prompt: 'Translate "I am ready".', answer: 'أنا جاهز (ana jahiz)', options: ['أنا جاهز (ana jahiz)', 'أنا جوعان (ana jouaan)', 'أنا متعب (ana motaab)', 'أنا بارد (ana barid)'], hint: 'Prepared and set.', world: 'Ready Gate' },
  { language: 'Arabic', prompt: 'What does "مدرسة" (madrasa) mean?', answer: 'school', options: ['school', 'hospital', 'market', 'church'], hint: 'A place for learning.', world: 'School Yard' },
  { language: 'Arabic', prompt: 'Choose the Arabic word for "dog".', answer: 'كلب (kalb)', options: ['كلب (kalb)', 'قطة (qitta)', 'طير (tair)', 'سمك (samak)'], hint: 'A common pet.', world: 'Pet Corner' },
  { language: 'Arabic', prompt: 'What does "كبير" (kabir) mean?', answer: 'big', options: ['big', 'small', 'medium', 'tiny'], hint: 'Not small.', world: 'Big Mountain' },
  { language: 'Arabic', prompt: 'Translate "good night".', answer: 'تصبح على خير (tasba7 ala khair)', options: ['تصبح على خير (tasba7 ala khair)', 'صباح الخير (sabah al-khair)', 'مساء الخير (masaa al-khair)', 'إلى غد (ila ghad)'], hint: 'Before sleep.', world: 'Night Rest' },
  { language: 'Arabic', prompt: 'What does "وقت" (waqt) mean?', answer: 'time', options: ['time', 'space', 'place', 'thing'], hint: 'Hours and minutes.', world: 'Time Clock' },
  { language: 'Arabic', prompt: 'Choose the Arabic word for "apple".', answer: 'تفاحة (tuffaha)', options: ['تفاحة (tuffaha)', 'موز (mooz)', 'برتقالة (burtuqala)', 'ليمون (limon)'], hint: 'A red or green fruit.', world: 'Orchard Lane' },
  { language: 'Arabic', prompt: 'What does "سعيد" (saeed) mean?', answer: 'happy', options: ['happy', 'sad', 'angry', 'tired'], hint: 'Full of joy.', world: 'Joy Castle' },
  { language: 'Arabic', prompt: 'Translate "I love it".', answer: 'أنا أحبها (ana ahibha)', options: ['أنا أحبها (ana ahibha)', 'أنا أكرهها (ana akrahha)', 'أنا أحب (ana ahib)', 'أنا خائف (ana khayif)'], hint: 'You adore something.', world: 'Love Temple' },
  { language: 'Arabic', prompt: 'Translate "excuse me".', answer: 'معذرة (muadharah)', options: ['معذرة (muadharah)', 'من فضلك (min fadhlak)', 'لا يهمك (la yahumak)', 'حسنا (hasna)'], hint: 'A polite interruption.', world: 'Polite Plaza' },

  // Extra practice lessons
  { language: 'Spanish', prompt: 'What does "sol" mean?', answer: 'sun', options: ['sun', 'moon', 'river', 'tree'], hint: 'It shines in the sky.', world: 'Sun Plaza' },
  { language: 'Spanish', prompt: 'Choose the Spanish word for "music".', answer: 'música', options: ['música', 'comida', 'cielo', 'puerta'], hint: 'You can listen to it.', world: 'Sound Garden' },
  { language: 'French', prompt: 'What does "maison" mean?', answer: 'house', options: ['house', 'street', 'garden', 'river'], hint: 'A place where someone lives.', world: 'Home Lane' },
  { language: 'French', prompt: 'Choose the French word for "sun".', answer: 'soleil', options: ['soleil', 'lune', 'eau', 'pain'], hint: 'It gives light in the day.', world: 'Sunny Square' },
  { language: 'German', prompt: 'What does "brot" mean?', answer: 'bread', options: ['bread', 'water', 'milk', 'stone'], hint: 'A common food.', world: 'Bakery Road' },
  { language: 'German', prompt: 'Choose the German word for "music".', answer: 'musik', options: ['musik', 'haus', 'feld', 'baum'], hint: 'Something you can listen to.', world: 'Music Hall' },
  { language: 'English', prompt: 'Choose the opposite of "full".', answer: 'empty', options: ['empty', 'bright', 'kind', 'cold'], hint: 'Not filled.', world: 'Empty Harbor' },
  { language: 'English', prompt: 'Complete: We ___ home after school.', answer: 'go', options: ['go', 'goes', 'going', 'went'], hint: 'Use the base verb with we.', world: 'Journey Lane' },
  { language: 'Portuguese', prompt: 'What does "casa" mean?', answer: 'house', options: ['house', 'car', 'road', 'tree'], hint: 'A place where you live.', world: 'Home Square' },
  { language: 'Portuguese', prompt: 'Translate "goodbye" into Portuguese.', answer: 'tchau', options: ['tchau', 'obrigado', 'por favor', 'sim'], hint: 'A friendly farewell.', world: 'Farewell Beach' },
  { language: 'Italian', prompt: 'What does "cibo" mean?', answer: 'food', options: ['food', 'water', 'book', 'air'], hint: 'What you eat.', world: 'Kitchen Street' },
  { language: 'Italian', prompt: 'Choose the Italian word for "friend".', answer: 'amico', options: ['amico', 'casa', 'mare', 'libro'], hint: 'Someone you trust and like.', world: 'Friend Bridge' },
  { language: 'Russian', prompt: 'What does "друг" mean?', answer: 'friend', options: ['friend', 'enemy', 'teacher', 'river'], hint: 'Someone you care about.', world: 'Friend Square' },
  { language: 'Russian', prompt: 'Choose the Russian word for "water".', answer: 'вода', options: ['вода', 'молоко', 'хлеб', 'солнце'], hint: 'You drink it.', world: 'River Bank' },
  { language: 'Japanese', prompt: 'What does "おはよう" mean?', answer: 'good morning', options: ['good morning', 'good night', 'thank you', 'hello'], hint: 'A greeting in the morning.', world: 'Morning Gate' },
  { language: 'Japanese', prompt: 'Choose the Japanese word for "friend".', answer: '友達 (tomodachi)', options: ['友達 (tomodachi)', '家 (ie)', '水 (mizu)', '本 (hon)'], hint: 'Someone you trust and like.', world: 'Friend Path' },
  { language: 'Chinese', prompt: 'What does "太阳" (tàiyáng) mean?', answer: 'sun', options: ['sun', 'moon', 'rain', 'wind'], hint: 'It shines in the sky.', world: 'Sun Court' },
  { language: 'Chinese', prompt: 'Choose the Chinese word for "music".', answer: '音乐 (yīnyuè)', options: ['音乐 (yīnyuè)', '水果 (shuǐguǒ)', '老师 (lǎoshī)', '街道 (jiēdào)'], hint: 'You can listen to it.', world: 'Song Bridge' },
  { language: 'Korean', prompt: 'What does "음악" (eumak) mean?', answer: 'music', options: ['music', 'food', 'book', 'sky'], hint: 'Something you can listen to.', world: 'Music Hall' },
  { language: 'Korean', prompt: 'Choose the Korean word for "sun".', answer: '태양 (taeyang)', options: ['태양 (taeyang)', '달 (dal)', '바다 (bada)', '비 (bi)'], hint: 'It shines during the day.', world: 'Sunny Peak' },
  { language: 'Arabic', prompt: 'What does "شمس" (shams) mean?', answer: 'sun', options: ['sun', 'moon', 'cloud', 'tree'], hint: 'It shines in the sky.', world: 'Sun Oasis' },
  { language: 'Arabic', prompt: 'Choose the Arabic word for "music".', answer: 'موسيقى (musiiqa)', options: ['موسيقى (musiiqa)', 'طعام (taam)', 'بيت (bayt)', 'نهر (nahr)'], hint: 'Something you can listen to.', world: 'Music Court' },

  { language: 'Spanish', prompt: 'Choose the Spanish word for "river".', answer: 'río', options: ['río', 'cielo', 'música', 'pan'], hint: 'A stream of water.', world: 'River Walk' },
  { language: 'Spanish', prompt: 'What does "verde" mean?', answer: 'green', options: ['green', 'red', 'yellow', 'black'], hint: 'The color of grass.', world: 'Green Meadow' },
  { language: 'French', prompt: 'What does "lune" mean?', answer: 'moon', options: ['moon', 'sun', 'star', 'cloud'], hint: 'It shines at night.', world: 'Moon Square' },
  { language: 'French', prompt: 'Choose the French word for "tree".', answer: 'arbre', options: ['arbre', 'pont', 'rue', 'mer'], hint: 'It grows from the ground.', world: 'Forest Path' },
  { language: 'German', prompt: 'What does "baum" mean?', answer: 'tree', options: ['tree', 'road', 'sky', 'stone'], hint: 'It has branches and leaves.', world: 'Tree Grove' },
  { language: 'German', prompt: 'Choose the German word for "moon".', answer: 'mond', options: ['mond', 'sonne', 'stern', 'fluss'], hint: 'It shines at night.', world: 'Moonlight Lane' },
  { language: 'English', prompt: 'Choose the synonym of "happy".', answer: 'joyful', options: ['joyful', 'angry', 'rough', 'kind'], hint: 'It means full of delight.', world: 'Joy Valley' },
  { language: 'English', prompt: 'Complete: The cat is ___ the box.', answer: 'under', options: ['under', 'over', 'inside', 'between'], hint: 'It is below something.', world: 'Cat Corner' },
  { language: 'Portuguese', prompt: 'What does "sol" mean?', answer: 'sun', options: ['sun', 'moon', 'rain', 'wind'], hint: 'It shines during the day.', world: 'Sun Street' },
  { language: 'Portuguese', prompt: 'Choose the Portuguese word for "tree".', answer: 'árvore', options: ['árvore', 'rio', 'paz', 'caminho'], hint: 'It grows outside.', world: 'Forest Road' },
  { language: 'Italian', prompt: 'What does "mare" mean?', answer: 'sea', options: ['sea', 'mountain', 'city', 'field'], hint: 'A large body of water.', world: 'Coastal Path' },
  { language: 'Italian', prompt: 'Choose the Italian word for "sun".', answer: 'sole', options: ['sole', 'luna', 'vento', 'neve'], hint: 'It shines in daytime.', world: 'Sunny Square' },
  { language: 'Russian', prompt: 'What does "солнце" mean?', answer: 'sun', options: ['sun', 'moon', 'star', 'cloud'], hint: 'It shines in the sky.', world: 'Sun Hill' },
  { language: 'Russian', prompt: 'Choose the Russian word for "tree".', answer: 'дерево', options: ['дерево', 'река', 'дом', 'мост'], hint: 'It has branches and leaves.', world: 'Forest Gate' },
  { language: 'Japanese', prompt: 'What does "月" mean?', answer: 'moon', options: ['moon', 'sun', 'river', 'mountain'], hint: 'It glows at night.', world: 'Night Sky' },
  { language: 'Japanese', prompt: 'Choose the Japanese word for "tree".', answer: '木 (ki)', options: ['木 (ki)', '川 (kawa)', '川 (kawa)', '石 (ishi)'], hint: 'A tall plant with branches.', world: 'Forest Path' },
  { language: 'Chinese', prompt: 'What does "月亮" (yuèliàng) mean?', answer: 'moon', options: ['moon', 'sun', 'star', 'rain'], hint: 'It shines at night.', world: 'Moon Court' },
  { language: 'Chinese', prompt: 'Choose the Chinese word for "river".', answer: '河 (hé)', options: ['河 (hé)', '山 (shān)', '云 (yún)', '花 (huā)'], hint: 'A flowing body of water.', world: 'River Gate' },
  { language: 'Korean', prompt: 'What does "달" (dal) mean?', answer: 'moon', options: ['moon', 'sun', 'star', 'cloud'], hint: 'It appears in the night sky.', world: 'Moon Peak' },
  { language: 'Korean', prompt: 'Choose the Korean word for "tree".', answer: '나무 (namu)', options: ['나무 (namu)', '바다 (bada)', '도시 (dosi)', '길 (gil)'], hint: 'A tall plant with branches.', world: 'Tree Grove' },
  { language: 'Arabic', prompt: 'What does "قمر" (qamar) mean?', answer: 'moon', options: ['moon', 'sun', 'star', 'river'], hint: 'It shines at night.', world: 'Moon Oasis' },
  { language: 'Arabic', prompt: 'Choose the Arabic word for "tree".', answer: 'شجرة (shajara)', options: ['شجرة (shajara)', 'نهر (nahr)', 'بيت (bayt)', 'مطر (matar)'], hint: 'It grows from the ground.', world: 'Tree Court' },
];

const topicQuests: Quest[] = [
  { language: 'Kazakh', prompt: 'Tech: What does "computer" mean?', answer: 'kompyuter', options: ['kompyuter', 'dop', 'dari', 'suret'], hint: 'A machine used for apps, games, and study.', world: 'Tech Lab' },
  { language: 'Kazakh', prompt: 'Health: Choose the Kazakh word for "medicine".', answer: 'dari', options: ['dari', 'qala', 'qalam', 'aspaz'], hint: 'It helps someone feel better.', world: 'Health Tent' },
  { language: 'Spanish', prompt: 'Tech: What does "pantalla" mean?', answer: 'screen', options: ['screen', 'helmet', 'river', 'brush'], hint: 'You look at it on a phone or computer.', world: 'Screen Plaza' },
  { language: 'Spanish', prompt: 'Sports: Choose the Spanish word for "team".', answer: 'equipo', options: ['equipo', 'pincel', 'salud', 'tecla'], hint: 'Players working together.', world: 'Team Field' },
  { language: 'French', prompt: 'Art: What does "peinture" mean?', answer: 'painting', options: ['painting', 'keyboard', 'medicine', 'score'], hint: 'A picture made with colors.', world: 'Art Cafe' },
  { language: 'French', prompt: 'Health: Choose the French word for "health".', answer: 'sante', options: ['sante', 'ecran', 'equipe', 'pinceau'], hint: 'How well your body feels.', world: 'Health Garden' },
  { language: 'German', prompt: 'Tech: What does "tastatur" mean?', answer: 'keyboard', options: ['keyboard', 'team', 'painting', 'medicine'], hint: 'You type with it.', world: 'Keyboard Hall' },
  { language: 'German', prompt: 'Sports: Choose the German word for "goal".', answer: 'tor', options: ['tor', 'arzt', 'bild', 'taste'], hint: 'A point in football.', world: 'Goal Arena' },
  { language: 'English', prompt: 'Tech: Choose the device used to type.', answer: 'keyboard', options: ['keyboard', 'helmet', 'brush', 'vitamin'], hint: 'It has many keys.', world: 'Typing Lab' },
  { language: 'English', prompt: 'Health: Complete: Drinking water is a healthy ___.', answer: 'habit', options: ['habit', 'score', 'screen', 'brush'], hint: 'Something you do often.', world: 'Habit Trail' },
  { language: 'Portuguese', prompt: 'Art: What does "pintura" mean?', answer: 'painting', options: ['painting', 'keyboard', 'team', 'medicine'], hint: 'Art made with paint.', world: 'Paint Street' },
  { language: 'Portuguese', prompt: 'Sports: Choose the Portuguese word for "score".', answer: 'placar', options: ['placar', 'saude', 'tela', 'pincel'], hint: 'The number of points in a game.', world: 'Score Beach' },
  { language: 'Italian', prompt: 'Tech: What does "schermo" mean?', answer: 'screen', options: ['screen', 'team', 'doctor', 'painting'], hint: 'A phone or laptop has one.', world: 'Screen Lane' },
  { language: 'Italian', prompt: 'Health: Choose the Italian word for "doctor".', answer: 'dottore', options: ['dottore', 'squadra', 'tastiera', 'quadro'], hint: 'A person who helps sick people.', world: 'Clinic Road' },
  { language: 'Russian', prompt: 'Tech: What does "ekran" mean?', answer: 'screen', options: ['screen', 'team', 'medicine', 'brush'], hint: 'You watch videos on it.', world: 'Screen Square' },
  { language: 'Russian', prompt: 'Art: Choose the Russian word for "painting".', answer: 'kartina', options: ['kartina', 'komanda', 'zdorovye', 'klaviatura'], hint: 'A picture made by an artist.', world: 'Art Square' },
  { language: 'Japanese', prompt: 'Sports: What does "chiimu" mean?', answer: 'team', options: ['team', 'screen', 'doctor', 'brush'], hint: 'Players working together.', world: 'Team Garden' },
  { language: 'Japanese', prompt: 'Tech: Choose the Japanese word for "computer".', answer: 'pasokon', options: ['pasokon', 'kusuri', 'e', 'tokuten'], hint: 'A device used for school and games.', world: 'Tech Path' },
  { language: 'Chinese', prompt: 'Health: What does "jiankang" mean?', answer: 'health', options: ['health', 'team', 'keyboard', 'painting'], hint: 'How well your body feels.', world: 'Health Court' },
  { language: 'Chinese', prompt: 'Tech: Choose the Chinese word for "screen".', answer: 'pingmu', options: ['pingmu', 'qiu dui', 'yao', 'hua bi'], hint: 'The display on a phone.', world: 'Screen Gate' },
  { language: 'Korean', prompt: 'Art: What does "geurim" mean?', answer: 'painting', options: ['painting', 'doctor', 'keyboard', 'score'], hint: 'A picture or drawing.', world: 'Art Hall' },
  { language: 'Korean', prompt: 'Sports: Choose the Korean word for "team".', answer: 'tim', options: ['tim', 'yak', 'hwamyeon', 'bus'], hint: 'Players working together.', world: 'Team Peak' },
  { language: 'Arabic', prompt: 'Tech: What does "hashub" mean?', answer: 'computer', options: ['computer', 'medicine', 'team', 'painting'], hint: 'A device for apps and study.', world: 'Tech Oasis' },
  { language: 'Arabic', prompt: 'Health: Choose the Arabic word for "health".', answer: 'sihha', options: ['sihha', 'fariq', 'shasha', 'rasm'], hint: 'How well your body feels.', world: 'Health Oasis' },
];

const newLanguageQuests: Quest[] = [
  { language: 'Hindi', prompt: 'What does "namaste" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A common greeting.', world: 'Hindi Gate' },
  { language: 'Hindi', prompt: 'Choose the Hindi word for "water".', answer: 'paani', options: ['paani', 'roti', 'dost', 'kitab'], hint: 'You drink it.', world: 'Water Stepwell' },
  { language: 'Hindi', prompt: 'Translate "thank you" into Hindi.', answer: 'dhanyavaad', options: ['dhanyavaad', 'namaste', 'kripya', 'haan'], hint: 'A polite word after help.', world: 'Thanks Courtyard' },
  { language: 'Hindi', prompt: 'What does "dost" mean?', answer: 'friend', options: ['friend', 'teacher', 'market', 'house'], hint: 'Someone you trust.', world: 'Friend Road' },
  { language: 'Hindi', prompt: 'Choose the Hindi word for "book".', answer: 'kitab', options: ['kitab', 'ghar', 'seb', 'laal'], hint: 'You read it.', world: 'Library Gate' },
  { language: 'Hindi', prompt: 'What does "ghar" mean?', answer: 'house', options: ['house', 'school', 'street', 'city'], hint: 'A place where you live.', world: 'Home Courtyard' },
  { language: 'Hindi', prompt: 'Translate "good night".', answer: 'shubh raatri', options: ['shubh raatri', 'subah bakhair', 'phir milenge', 'maaf kijiye'], hint: 'A phrase before sleep.', world: 'Night Palace' },
  { language: 'Hindi', prompt: 'What does "laal" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A color like a rose.', world: 'Color Market' },
  { language: 'Hindi', prompt: 'Choose the Hindi word for "apple".', answer: 'seb', options: ['seb', 'doodh', 'roti', 'paani'], hint: 'A red or green fruit.', world: 'Apple Garden' },
  { language: 'Hindi', prompt: 'Translate "excuse me".', answer: 'maaf kijiye', options: ['maaf kijiye', 'dhanyavaad', 'kripya', 'nahi'], hint: 'A polite interruption.', world: 'Polite Hall' },

  { language: 'Turkish', prompt: 'What does "merhaba" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'yes'], hint: 'A friendly greeting.', world: 'Turkish Gate' },
  { language: 'Turkish', prompt: 'Choose the Turkish word for "water".', answer: 'su', options: ['su', 'ekmek', 'kitap', 'arkadas'], hint: 'You drink it.', world: 'Blue Fountain' },
  { language: 'Turkish', prompt: 'Translate "thank you" into Turkish.', answer: 'tesekkurler', options: ['tesekkurler', 'lutfen', 'affedersiniz', 'evet'], hint: 'A polite word after help.', world: 'Thanks Street' },
  { language: 'Turkish', prompt: 'What does "arkadas" mean?', answer: 'friend', options: ['friend', 'doctor', 'teacher', 'house'], hint: 'Someone you like.', world: 'Friend Bridge' },
  { language: 'Turkish', prompt: 'Choose the Turkish word for "book".', answer: 'kitap', options: ['kitap', 'ev', 'elma', 'kirmizi'], hint: 'You read it.', world: 'Book Bazaar' },
  { language: 'Turkish', prompt: 'What does "ev" mean?', answer: 'house', options: ['house', 'school', 'market', 'road'], hint: 'A place where you live.', world: 'Home Hill' },
  { language: 'Turkish', prompt: 'Translate "good morning".', answer: 'gunaydin', options: ['gunaydin', 'iyi geceler', 'hos geldiniz', 'gorusuruz'], hint: 'A daytime greeting.', world: 'Morning Bay' },
  { language: 'Turkish', prompt: 'What does "kirmizi" mean?', answer: 'red', options: ['red', 'blue', 'green', 'white'], hint: 'The color of a tomato.', world: 'Color Bazaar' },
  { language: 'Turkish', prompt: 'Choose the Turkish word for "apple".', answer: 'elma', options: ['elma', 'sut', 'ekmek', 'su'], hint: 'A red or green fruit.', world: 'Orchard Bay' },
  { language: 'Turkish', prompt: 'Translate "excuse me".', answer: 'affedersiniz', options: ['affedersiniz', 'lutfen', 'tesekkurler', 'hayir'], hint: 'A polite interruption.', world: 'Polite Bridge' },

  { language: 'Swedish', prompt: 'What does "hej" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A common greeting.', world: 'Swedish Harbor' },
  { language: 'Swedish', prompt: 'Choose the Swedish word for "water".', answer: 'vatten', options: ['vatten', 'brod', 'bok', 'van'], hint: 'You drink it.', world: 'Lake Path' },
  { language: 'Swedish', prompt: 'Translate "thank you" into Swedish.', answer: 'tack', options: ['tack', 'hej', 'snalla', 'ja'], hint: 'A polite word after help.', world: 'Thanks Dock' },
  { language: 'Swedish', prompt: 'What does "van" mean?', answer: 'friend', options: ['friend', 'teacher', 'city', 'house'], hint: 'Someone you trust.', world: 'Friend Fjord' },
  { language: 'Swedish', prompt: 'Choose the Swedish word for "book".', answer: 'bok', options: ['bok', 'hus', 'apple', 'rod'], hint: 'You read it.', world: 'Book Cabin' },
  { language: 'Swedish', prompt: 'What does "hus" mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where people live.', world: 'Home Cabin' },
  { language: 'Swedish', prompt: 'Translate "good night".', answer: 'god natt', options: ['god natt', 'god morgon', 'valkommen', 'hej da'], hint: 'A phrase before sleep.', world: 'Northern Night' },
  { language: 'Swedish', prompt: 'What does "rod" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Red Cabin' },
  { language: 'Swedish', prompt: 'Choose the Swedish word for "school".', answer: 'skola', options: ['skola', 'sjukhus', 'marknad', 'gata'], hint: 'A place to learn.', world: 'School Harbor' },
  { language: 'Swedish', prompt: 'Translate "excuse me".', answer: 'ursakta', options: ['ursakta', 'tack', 'snalla', 'nej'], hint: 'A polite interruption.', world: 'Polite Dock' },

  { language: 'Dutch', prompt: 'What does "hallo" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'yes'], hint: 'A greeting.', world: 'Dutch Canal' },
  { language: 'Dutch', prompt: 'Choose the Dutch word for "water".', answer: 'water', options: ['water', 'brood', 'boek', 'vriend'], hint: 'You drink it.', world: 'Canal Water' },
  { language: 'Dutch', prompt: 'Translate "thank you" into Dutch.', answer: 'dank je', options: ['dank je', 'alsjeblieft', 'sorry', 'ja'], hint: 'A polite word after help.', world: 'Thanks Canal' },
  { language: 'Dutch', prompt: 'What does "vriend" mean?', answer: 'friend', options: ['friend', 'doctor', 'teacher', 'house'], hint: 'Someone you trust.', world: 'Friend Bridge' },
  { language: 'Dutch', prompt: 'Choose the Dutch word for "book".', answer: 'boek', options: ['boek', 'huis', 'appel', 'rood'], hint: 'You read it.', world: 'Book House' },
  { language: 'Dutch', prompt: 'What does "huis" mean?', answer: 'house', options: ['house', 'school', 'market', 'road'], hint: 'A place where you live.', world: 'Home Canal' },
  { language: 'Dutch', prompt: 'Translate "good morning".', answer: 'goedemorgen', options: ['goedemorgen', 'goedenacht', 'welkom', 'tot ziens'], hint: 'A daytime greeting.', world: 'Morning Canal' },
  { language: 'Dutch', prompt: 'What does "rood" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A color like a rose.', world: 'Color Canal' },
  { language: 'Dutch', prompt: 'Choose the Dutch word for "apple".', answer: 'appel', options: ['appel', 'melk', 'brood', 'water'], hint: 'A red or green fruit.', world: 'Orchard Canal' },
  { language: 'Dutch', prompt: 'Translate "excuse me".', answer: 'sorry', options: ['sorry', 'dank je', 'alsjeblieft', 'nee'], hint: 'A polite interruption.', world: 'Polite Canal' },

  { language: 'Vietnamese', prompt: 'What does "xin chao" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A greeting.', world: 'Vietnamese Market' },
  { language: 'Vietnamese', prompt: 'Choose the Vietnamese word for "water".', answer: 'nuoc', options: ['nuoc', 'banh mi', 'sach', 'ban'], hint: 'You drink it.', world: 'River Market' },
  { language: 'Vietnamese', prompt: 'Translate "thank you" into Vietnamese.', answer: 'cam on', options: ['cam on', 'xin chao', 'lam on', 'vang'], hint: 'A polite word after help.', world: 'Thanks Market' },
  { language: 'Vietnamese', prompt: 'What does "ban" mean?', answer: 'friend', options: ['friend', 'teacher', 'city', 'house'], hint: 'Someone you trust.', world: 'Friend Market' },
  { language: 'Vietnamese', prompt: 'Choose the Vietnamese word for "book".', answer: 'sach', options: ['sach', 'nha', 'tao', 'do'], hint: 'You read it.', world: 'Book Market' },
  { language: 'Vietnamese', prompt: 'What does "nha" mean?', answer: 'house', options: ['house', 'school', 'market', 'street'], hint: 'A place where you live.', world: 'Home Market' },
  { language: 'Vietnamese', prompt: 'Translate "good morning".', answer: 'chao buoi sang', options: ['chao buoi sang', 'chuc ngu ngon', 'tam biet', 'xin loi'], hint: 'A daytime greeting.', world: 'Morning River' },
  { language: 'Vietnamese', prompt: 'What does "do" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A color like a rose.', world: 'Color Market' },
  { language: 'Vietnamese', prompt: 'Choose the Vietnamese word for "apple".', answer: 'tao', options: ['tao', 'sua', 'banh mi', 'nuoc'], hint: 'A red or green fruit.', world: 'Orchard Market' },
  { language: 'Vietnamese', prompt: 'Translate "excuse me".', answer: 'xin loi', options: ['xin loi', 'cam on', 'lam on', 'khong'], hint: 'A polite interruption.', world: 'Polite Market' },
];

const moreLanguageQuests: Quest[] = [
  { language: 'Polish', prompt: 'What does "czesc" mean?', answer: 'hello', options: ['hello', 'goodbye', 'water', 'book'], hint: 'A friendly greeting.', world: 'Polish Square' },
  { language: 'Polish', prompt: 'Choose the Polish word for "water".', answer: 'woda', options: ['woda', 'chleb', 'ksiazka', 'dom'], hint: 'You drink it.', world: 'River Square' },
  { language: 'Polish', prompt: 'Translate "thank you" into Polish.', answer: 'dziekuje', options: ['dziekuje', 'prosze', 'tak', 'nie'], hint: 'A polite word after help.', world: 'Thanks Square' },
  { language: 'Polish', prompt: 'What does "dom" mean?', answer: 'house', options: ['house', 'school', 'friend', 'apple'], hint: 'A place where you live.', world: 'Home Square' },
  { language: 'Polish', prompt: 'Choose the Polish word for "friend".', answer: 'przyjaciel', options: ['przyjaciel', 'nauczyciel', 'miasto', 'pies'], hint: 'Someone you trust.', world: 'Friend Square' },
  { language: 'Polish', prompt: 'What does "czerwony" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Color Square' },
  { language: 'Polish', prompt: 'Choose the Polish word for "school".', answer: 'szkola', options: ['szkola', 'rynek', 'droga', 'okno'], hint: 'A place to learn.', world: 'School Square' },
  { language: 'Polish', prompt: 'Translate "good night".', answer: 'dobranoc', options: ['dobranoc', 'dzien dobry', 'do widzenia', 'przepraszam'], hint: 'A phrase before sleep.', world: 'Night Square' },

  { language: 'Greek', prompt: 'What does "yassou" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A friendly greeting.', world: 'Greek Island' },
  { language: 'Greek', prompt: 'Choose the Greek word for "water".', answer: 'nero', options: ['nero', 'psomi', 'vivlio', 'spiti'], hint: 'You drink it.', world: 'Blue Island' },
  { language: 'Greek', prompt: 'Translate "thank you" into Greek.', answer: 'efharisto', options: ['efharisto', 'parakalo', 'nai', 'ochi'], hint: 'A polite word after help.', world: 'Thanks Island' },
  { language: 'Greek', prompt: 'What does "spiti" mean?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Island' },
  { language: 'Greek', prompt: 'Choose the Greek word for "friend".', answer: 'filos', options: ['filos', 'daskalos', 'poli', 'skylos'], hint: 'Someone you like.', world: 'Friend Island' },
  { language: 'Greek', prompt: 'What does "kokkino" mean?', answer: 'red', options: ['red', 'blue', 'green', 'white'], hint: 'A warm color.', world: 'Color Island' },
  { language: 'Greek', prompt: 'Choose the Greek word for "book".', answer: 'vivlio', options: ['vivlio', 'milo', 'nero', 'psomi'], hint: 'You read it.', world: 'Book Island' },
  { language: 'Greek', prompt: 'Translate "excuse me".', answer: 'signomi', options: ['signomi', 'efharisto', 'parakalo', 'ochi'], hint: 'A polite interruption.', world: 'Polite Island' },

  { language: 'Indonesian', prompt: 'What does "halo" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A greeting.', world: 'Island Market' },
  { language: 'Indonesian', prompt: 'Choose the Indonesian word for "water".', answer: 'air', options: ['air', 'roti', 'buku', 'teman'], hint: 'You drink it.', world: 'Water Market' },
  { language: 'Indonesian', prompt: 'Translate "thank you" into Indonesian.', answer: 'terima kasih', options: ['terima kasih', 'tolong', 'ya', 'tidak'], hint: 'A polite word after help.', world: 'Thanks Market' },
  { language: 'Indonesian', prompt: 'What does "rumah" mean?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Market' },
  { language: 'Indonesian', prompt: 'Choose the Indonesian word for "friend".', answer: 'teman', options: ['teman', 'guru', 'kota', 'anjing'], hint: 'Someone you trust.', world: 'Friend Market' },
  { language: 'Indonesian', prompt: 'What does "merah" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A color like a rose.', world: 'Color Market' },
  { language: 'Indonesian', prompt: 'Choose the Indonesian word for "book".', answer: 'buku', options: ['buku', 'apel', 'air', 'roti'], hint: 'You read it.', world: 'Book Market' },
  { language: 'Indonesian', prompt: 'Translate "good morning".', answer: 'selamat pagi', options: ['selamat pagi', 'selamat malam', 'sampai jumpa', 'maaf'], hint: 'A daytime greeting.', world: 'Morning Market' },

  { language: 'Thai', prompt: 'What does "sawasdee" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A greeting.', world: 'Thai Temple' },
  { language: 'Thai', prompt: 'Choose the Thai word for "water".', answer: 'nam', options: ['nam', 'khanom pang', 'nangsue', 'phuean'], hint: 'You drink it.', world: 'Water Temple' },
  { language: 'Thai', prompt: 'Translate "thank you" into Thai.', answer: 'khop khun', options: ['khop khun', 'karuna', 'chai', 'mai'], hint: 'A polite word after help.', world: 'Thanks Temple' },
  { language: 'Thai', prompt: 'What does "baan" mean?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Temple' },
  { language: 'Thai', prompt: 'Choose the Thai word for "friend".', answer: 'phuean', options: ['phuean', 'khru', 'mueang', 'ma'], hint: 'Someone you trust.', world: 'Friend Temple' },
  { language: 'Thai', prompt: 'What does "daeng" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Color Temple' },
  { language: 'Thai', prompt: 'Choose the Thai word for "book".', answer: 'nangsue', options: ['nangsue', 'phonlamai', 'nam', 'baan'], hint: 'You read it.', world: 'Book Temple' },
  { language: 'Thai', prompt: 'Translate "excuse me".', answer: 'kho thot', options: ['kho thot', 'khop khun', 'karuna', 'mai'], hint: 'A polite interruption.', world: 'Polite Temple' },

  { language: 'Ukrainian', prompt: 'What does "pryvit" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A friendly greeting.', world: 'Ukrainian Field' },
  { language: 'Ukrainian', prompt: 'Choose the Ukrainian word for "water".', answer: 'voda', options: ['voda', 'khlib', 'knyha', 'dim'], hint: 'You drink it.', world: 'River Field' },
  { language: 'Ukrainian', prompt: 'Translate "thank you" into Ukrainian.', answer: 'dyakuyu', options: ['dyakuyu', 'bud laska', 'tak', 'ni'], hint: 'A polite word after help.', world: 'Thanks Field' },
  { language: 'Ukrainian', prompt: 'What does "dim" mean?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Field' },
  { language: 'Ukrainian', prompt: 'Choose the Ukrainian word for "friend".', answer: 'druh', options: ['druh', 'uchytel', 'misto', 'pes'], hint: 'Someone you trust.', world: 'Friend Field' },
  { language: 'Ukrainian', prompt: 'What does "chervonyi" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Color Field' },
  { language: 'Ukrainian', prompt: 'Choose the Ukrainian word for "book".', answer: 'knyha', options: ['knyha', 'yabluko', 'voda', 'khlib'], hint: 'You read it.', world: 'Book Field' },
  { language: 'Ukrainian', prompt: 'Translate "good night".', answer: 'nadobranich', options: ['nadobranich', 'dobryi ranok', 'do pobachennia', 'vybachte'], hint: 'A phrase before sleep.', world: 'Night Field' },

  { language: 'Finnish', prompt: 'What does "hei" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A greeting.', world: 'Finnish Lake' },
  { language: 'Finnish', prompt: 'Choose the Finnish word for "water".', answer: 'vesi', options: ['vesi', 'leipa', 'kirja', 'ystava'], hint: 'You drink it.', world: 'Lake Water' },
  { language: 'Finnish', prompt: 'Translate "thank you" into Finnish.', answer: 'kiitos', options: ['kiitos', 'ole hyva', 'kylla', 'ei'], hint: 'A polite word after help.', world: 'Thanks Lake' },
  { language: 'Finnish', prompt: 'What does "talo" mean?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Lake' },
  { language: 'Finnish', prompt: 'Choose the Finnish word for "friend".', answer: 'ystava', options: ['ystava', 'opettaja', 'kaupunki', 'koira'], hint: 'Someone you trust.', world: 'Friend Lake' },
  { language: 'Finnish', prompt: 'What does "punainen" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Color Lake' },
  { language: 'Finnish', prompt: 'Choose the Finnish word for "book".', answer: 'kirja', options: ['kirja', 'omena', 'vesi', 'leipa'], hint: 'You read it.', world: 'Book Lake' },
  { language: 'Finnish', prompt: 'Translate "good night".', answer: 'hyvaa yota', options: ['hyvaa yota', 'hyvaa huomenta', 'nakemiin', 'anteeksi'], hint: 'A phrase before sleep.', world: 'Night Lake' },

  { language: 'Norwegian', prompt: 'What does "hei" mean in Norwegian?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A greeting.', world: 'Norwegian Fjord' },
  { language: 'Norwegian', prompt: 'Choose the Norwegian word for "water".', answer: 'vann', options: ['vann', 'brod', 'bok', 'venn'], hint: 'You drink it.', world: 'Fjord Water' },
  { language: 'Norwegian', prompt: 'Translate "thank you" into Norwegian.', answer: 'takk', options: ['takk', 'vaer sa snill', 'ja', 'nei'], hint: 'A polite word after help.', world: 'Thanks Fjord' },
  { language: 'Norwegian', prompt: 'What does "hus" mean in Norwegian?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Fjord' },
  { language: 'Norwegian', prompt: 'Choose the Norwegian word for "friend".', answer: 'venn', options: ['venn', 'laerer', 'by', 'hund'], hint: 'Someone you trust.', world: 'Friend Fjord' },
  { language: 'Norwegian', prompt: 'What does "rod" mean in Norwegian?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Color Fjord' },
  { language: 'Norwegian', prompt: 'Choose the Norwegian word for "book".', answer: 'bok', options: ['bok', 'eple', 'vann', 'brod'], hint: 'You read it.', world: 'Book Fjord' },
  { language: 'Norwegian', prompt: 'Translate "good night".', answer: 'god natt', options: ['god natt', 'god morgen', 'ha det', 'unnskyld'], hint: 'A phrase before sleep.', world: 'Night Fjord' },

  { language: 'Danish', prompt: 'What does "hej" mean in Danish?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A greeting.', world: 'Danish Harbor' },
  { language: 'Danish', prompt: 'Choose the Danish word for "water".', answer: 'vand', options: ['vand', 'brod', 'bog', 'ven'], hint: 'You drink it.', world: 'Harbor Water' },
  { language: 'Danish', prompt: 'Translate "thank you" into Danish.', answer: 'tak', options: ['tak', 'vaer venlig', 'ja', 'nej'], hint: 'A polite word after help.', world: 'Thanks Harbor' },
  { language: 'Danish', prompt: 'What does "hus" mean in Danish?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Harbor' },
  { language: 'Danish', prompt: 'Choose the Danish word for "friend".', answer: 'ven', options: ['ven', 'laerer', 'by', 'hund'], hint: 'Someone you trust.', world: 'Friend Harbor' },
  { language: 'Danish', prompt: 'What does "rod" mean in Danish?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Color Harbor' },
  { language: 'Danish', prompt: 'Choose the Danish word for "book".', answer: 'bog', options: ['bog', 'aeble', 'vand', 'brod'], hint: 'You read it.', world: 'Book Harbor' },
  { language: 'Danish', prompt: 'Translate "good night".', answer: 'godnat', options: ['godnat', 'godmorgen', 'farvel', 'undskyld'], hint: 'A phrase before sleep.', world: 'Night Harbor' },
];

const evenMoreLanguageQuests: Quest[] = [
  { language: 'Czech', prompt: 'What does "ahoj" mean?', answer: 'hello', options: ['hello', 'goodbye', 'water', 'book'], hint: 'A friendly greeting.', world: 'Czech Bridge' },
  { language: 'Czech', prompt: 'Choose the Czech word for "water".', answer: 'voda', options: ['voda', 'chleb', 'kniha', 'dum'], hint: 'You drink it.', world: 'River Bridge' },
  { language: 'Czech', prompt: 'Translate "thank you" into Czech.', answer: 'dekuji', options: ['dekuji', 'prosim', 'ano', 'ne'], hint: 'A polite word after help.', world: 'Thanks Bridge' },
  { language: 'Czech', prompt: 'What does "dum" mean?', answer: 'house', options: ['house', 'school', 'friend', 'apple'], hint: 'A place where you live.', world: 'Home Bridge' },
  { language: 'Czech', prompt: 'Choose the Czech word for "friend".', answer: 'pritel', options: ['pritel', 'ucitel', 'mesto', 'pes'], hint: 'Someone you trust.', world: 'Friend Bridge' },
  { language: 'Czech', prompt: 'Translate "good night".', answer: 'dobrou noc', options: ['dobrou noc', 'dobre rano', 'nashledanou', 'prominte'], hint: 'A phrase before sleep.', world: 'Night Bridge' },

  { language: 'Romanian', prompt: 'What does "salut" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A friendly greeting.', world: 'Romanian Hill' },
  { language: 'Romanian', prompt: 'Choose the Romanian word for "water".', answer: 'apa', options: ['apa', 'paine', 'carte', 'casa'], hint: 'You drink it.', world: 'Water Hill' },
  { language: 'Romanian', prompt: 'Translate "thank you" into Romanian.', answer: 'multumesc', options: ['multumesc', 'te rog', 'da', 'nu'], hint: 'A polite word after help.', world: 'Thanks Hill' },
  { language: 'Romanian', prompt: 'What does "casa" mean in Romanian?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Hill' },
  { language: 'Romanian', prompt: 'Choose the Romanian word for "friend".', answer: 'prieten', options: ['prieten', 'profesor', 'oras', 'caine'], hint: 'Someone you like.', world: 'Friend Hill' },
  { language: 'Romanian', prompt: 'What does "rosu" mean?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Color Hill' },

  { language: 'Hebrew', prompt: 'What does "shalom" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A greeting that can also mean peace.', world: 'Hebrew Gate' },
  { language: 'Hebrew', prompt: 'Choose the Hebrew word for "water".', answer: 'mayim', options: ['mayim', 'lechem', 'sefer', 'bayit'], hint: 'You drink it.', world: 'Water Gate' },
  { language: 'Hebrew', prompt: 'Translate "thank you" into Hebrew.', answer: 'toda', options: ['toda', 'bevakasha', 'ken', 'lo'], hint: 'A polite word after help.', world: 'Thanks Gate' },
  { language: 'Hebrew', prompt: 'What does "bayit" mean?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Gate' },
  { language: 'Hebrew', prompt: 'Choose the Hebrew word for "friend".', answer: 'chaver', options: ['chaver', 'moreh', 'ir', 'kelev'], hint: 'Someone you trust.', world: 'Friend Gate' },
  { language: 'Hebrew', prompt: 'Translate "good morning".', answer: 'boker tov', options: ['boker tov', 'layla tov', 'lehitraot', 'slicha'], hint: 'A daytime greeting.', world: 'Morning Gate' },

  { language: 'Malay', prompt: 'What does "halo" mean in Malay?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A greeting.', world: 'Malay Coast' },
  { language: 'Malay', prompt: 'Choose the Malay word for "water".', answer: 'air', options: ['air', 'roti', 'buku', 'kawan'], hint: 'You drink it.', world: 'Water Coast' },
  { language: 'Malay', prompt: 'Translate "thank you" into Malay.', answer: 'terima kasih', options: ['terima kasih', 'tolong', 'ya', 'tidak'], hint: 'A polite word after help.', world: 'Thanks Coast' },
  { language: 'Malay', prompt: 'What does "rumah" mean in Malay?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Coast' },
  { language: 'Malay', prompt: 'Choose the Malay word for "friend".', answer: 'kawan', options: ['kawan', 'guru', 'bandar', 'anjing'], hint: 'Someone you trust.', world: 'Friend Coast' },
  { language: 'Malay', prompt: 'What does "merah" mean in Malay?', answer: 'red', options: ['red', 'blue', 'green', 'yellow'], hint: 'A warm color.', world: 'Color Coast' },

  { language: 'Filipino', prompt: 'What does "kumusta" mean?', answer: 'hello', options: ['hello', 'goodbye', 'thank you', 'water'], hint: 'A friendly greeting.', world: 'Filipino Bay' },
  { language: 'Filipino', prompt: 'Choose the Filipino word for "water".', answer: 'tubig', options: ['tubig', 'tinapay', 'libro', 'kaibigan'], hint: 'You drink it.', world: 'Water Bay' },
  { language: 'Filipino', prompt: 'Translate "thank you" into Filipino.', answer: 'salamat', options: ['salamat', 'pakiusap', 'oo', 'hindi'], hint: 'A polite word after help.', world: 'Thanks Bay' },
  { language: 'Filipino', prompt: 'What does "bahay" mean?', answer: 'house', options: ['house', 'school', 'market', 'friend'], hint: 'A place where you live.', world: 'Home Bay' },
  { language: 'Filipino', prompt: 'Choose the Filipino word for "friend".', answer: 'kaibigan', options: ['kaibigan', 'guro', 'lungsod', 'aso'], hint: 'Someone you trust.', world: 'Friend Bay' },
  { language: 'Filipino', prompt: 'Translate "good night".', answer: 'magandang gabi', options: ['magandang gabi', 'magandang umaga', 'paalam', 'pasensya'], hint: 'A phrase for the evening or night.', world: 'Night Bay' },
];

const hardLanguageQuests: Quest[] = [
  { language: 'Kazakh', prompt: 'Hard: What does "evidence" mean?', answer: 'dalel', options: ['dalel', 'qalgan', 'arzan', 'zharys'], hint: 'Proof that helps show something is true.', world: 'Proof Ridge' },
  { language: 'Kazakh', prompt: 'Hard: Choose the English word for "mindet".', answer: 'responsibility', options: ['responsibility', 'weather', 'shortcut', 'blanket'], hint: 'A duty you should take care of.', world: 'Duty Gate' },
  { language: 'Spanish', prompt: 'Hard: What does "consecuencia" mean?', answer: 'consequence', options: ['consequence', 'shortcut', 'blanket', 'window'], hint: 'A result of an action.', world: 'Cause Plaza' },
  { language: 'Spanish', prompt: 'Hard: Choose the Spanish word for "challenge".', answer: 'desafio', options: ['desafio', 'almohada', 'bolsillo', 'rueda'], hint: 'Something difficult that tests you.', world: 'Desafio Hill' },
  { language: 'French', prompt: 'Hard: What does "preuve" mean?', answer: 'evidence', options: ['evidence', 'promise', 'mirror', 'ladder'], hint: 'Proof for an idea or claim.', world: 'Proof Cafe' },
  { language: 'French', prompt: 'Hard: Choose the French word for "although".', answer: 'bien que', options: ['bien que', 'pres de', 'autour de', 'plus tard'], hint: 'It shows contrast between two ideas.', world: 'Contrast Bridge' },
  { language: 'German', prompt: 'Hard: What does "verantwortung" mean?', answer: 'responsibility', options: ['responsibility', 'arrival', 'blanket', 'noise'], hint: 'A duty or thing you must handle.', world: 'Duty Hall' },
  { language: 'German', prompt: 'Hard: Choose the German word for "evidence".', answer: 'beweis', options: ['beweis', 'miete', 'larm', 'schirm'], hint: 'Proof that supports a claim.', world: 'Beweis Tower' },
  { language: 'English', prompt: 'Hard: Choose the synonym of "scarce".', answer: 'rare', options: ['rare', 'simple', 'loud', 'wide'], hint: 'There is not much of it.', world: 'Rare Pass' },
  { language: 'English', prompt: 'Hard: Complete: Although it was late, they ___ practicing.', answer: 'continued', options: ['continued', 'continue', 'continuing', 'continues'], hint: 'Use past tense after "was late".', world: 'Grammar Summit' },
  { language: 'Portuguese', prompt: 'Hard: What does "evidencia" mean?', answer: 'evidence', options: ['evidence', 'shortcut', 'pencil', 'helmet'], hint: 'Proof for something.', world: 'Proof Beach' },
  { language: 'Portuguese', prompt: 'Hard: Choose the Portuguese word for "improve".', answer: 'melhorar', options: ['melhorar', 'alugar', 'cobrir', 'pular'], hint: 'To make something better.', world: 'Better Street' },
  { language: 'Italian', prompt: 'Hard: What does "conseguenza" mean?', answer: 'consequence', options: ['consequence', 'ladder', 'curtain', 'wallet'], hint: 'A result caused by something.', world: 'Cause Road' },
  { language: 'Italian', prompt: 'Hard: Choose the Italian word for "patience".', answer: 'pazienza', options: ['pazienza', 'tasca', 'ruota', 'nebbia'], hint: 'Staying calm while waiting.', world: 'Calm Square' },
  { language: 'Russian', prompt: 'Hard: What does "dokazatelstvo" mean?', answer: 'evidence', options: ['evidence', 'blanket', 'shortcut', 'pocket'], hint: 'Proof that something is true.', world: 'Proof Square' },
  { language: 'Russian', prompt: 'Hard: Choose the Russian word for "responsibility".', answer: 'otvetstvennost', options: ['otvetstvennost', 'pogoda', 'koleso', 'sumka'], hint: 'A duty you must take care of.', world: 'Duty Square' },
  { language: 'Japanese', prompt: 'Hard: What does "shouko" mean?', answer: 'evidence', options: ['evidence', 'curtain', 'ladder', 'wallet'], hint: 'Proof for a statement.', world: 'Proof Garden' },
  { language: 'Japanese', prompt: 'Hard: Choose the Japanese word for "challenge".', answer: 'chousen', options: ['chousen', 'kaidan', 'kasa', 'kaban'], hint: 'A difficult test or goal.', world: 'Challenge Path' },
  { language: 'Chinese', prompt: 'Hard: What does "zhengju" mean?', answer: 'evidence', options: ['evidence', 'mirror', 'blanket', 'ladder'], hint: 'Proof that supports an answer.', world: 'Proof Court' },
  { language: 'Chinese', prompt: 'Hard: Choose the Chinese word for "improve".', answer: 'gaishan', options: ['gaishan', 'zulin', 'tiaowu', 'zhedie'], hint: 'To make better.', world: 'Better Gate' },
  { language: 'Korean', prompt: 'Hard: What does "jeungeo" mean?', answer: 'evidence', options: ['evidence', 'noise', 'pocket', 'wheel'], hint: 'Proof that supports a claim.', world: 'Proof Hall' },
  { language: 'Korean', prompt: 'Hard: Choose the Korean word for "patience".', answer: 'inchim', options: ['inchim', 'badak', 'moja', 'sori'], hint: 'Calm waiting without giving up.', world: 'Calm Peak' },
  { language: 'Arabic', prompt: 'Hard: What does "daleel" mean?', answer: 'evidence', options: ['evidence', 'mirror', 'ladder', 'wallet'], hint: 'Proof for an idea.', world: 'Proof Oasis' },
  { language: 'Arabic', prompt: 'Hard: Choose the Arabic word for "responsibility".', answer: 'masuliyya', options: ['masuliyya', 'ghita', 'dawda', 'jayb'], hint: 'A duty you must handle.', world: 'Duty Oasis' },
];

const quests: Quest[] = [
  ...kazakhQuests.map((quest) => ({ ...quest, language: 'Kazakh' as const })),
  ...extraLanguageQuests,
  ...topicQuests,
  ...newLanguageQuests,
  ...moreLanguageQuests,
  ...evenMoreLanguageQuests,
];
const allQuests = [...quests, ...hardLanguageQuests];
const availableLanguages: Exclude<Language, 'All'>[] = Array.from(new Set(allQuests.map((quest) => quest.language)));
const playableLanguageOptions: Language[] = ['All', ...availableLanguages];

const tutorialLessonPack: LessonPack = {
  id: 'tutorial',
  title: 'Tutorial lesson',
  description: 'Learn the basics: choose answers, continue, and watch hearts.',
  keywords: ['hello', 'water', 'book', 'school', 'friend', 'house', 'red', 'thank you'],
  size: 5,
};

const topicLessonPacks: LessonPack[] = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Greetings, simple words, and everyday phrases.',
    keywords: ['hello', 'thank you', 'friend', 'house', 'school', 'food', 'no', 'water', 'book'],
  },
  {
    id: 'daily-life',
    title: 'Daily life',
    description: 'Practice home, routine, and common objects.',
    keywords: ['music', 'time', 'school', 'house', 'food', 'book', 'day', 'morning', 'city'],
  },
  {
    id: 'nature',
    title: 'Nature & weather',
    description: 'Words for the sky, sun, moon, trees, and water.',
    keywords: ['sun', 'moon', 'tree', 'river', 'sea', 'green', 'water', 'rain', 'wind'],
  },
  {
    id: 'travel',
    title: 'Travel',
    description: 'Words that help you explore new places and talk about journeys.',
    keywords: ['travel', 'road', 'city', 'bridge', 'journey', 'welcome', 'goodbye', 'ready'],
  },
  {
    id: 'greetings',
    title: 'Greetings',
    description: 'Hello, goodbye, welcome, and polite first phrases.',
    keywords: ['hello', 'good morning', 'good night', 'welcome', 'see you', 'greeting', 'goodbye'],
  },
  {
    id: 'school',
    title: 'School',
    description: 'Words for class, teachers, books, and learning.',
    keywords: ['school', 'teacher', 'book', 'pen', 'learn', 'read', 'student', 'sentence'],
  },
  {
    id: 'food',
    title: 'Food',
    description: 'Meals, drinks, fruits, and useful food words.',
    keywords: ['food', 'water', 'bread', 'milk', 'apple', 'comida', 'essen', 'drink'],
  },
  {
    id: 'colors',
    title: 'Colors',
    description: 'Practice common color words.',
    keywords: ['red', 'blue', 'green', 'yellow', 'white', 'color', 'rouge', 'rojo', 'rot'],
  },
  {
    id: 'feelings',
    title: 'Feelings',
    description: 'Happy, sad, ready, tired, and simple emotions.',
    keywords: ['happy', 'sad', 'ready', 'love', 'like', 'tired', 'scared', 'angry'],
  },
  {
    id: 'animals',
    title: 'Animals',
    description: 'Pets and animal words from different languages.',
    keywords: ['dog', 'cat', 'bird', 'fish', 'perro', 'chien', 'hund', 'pet'],
  },
  {
    id: 'home',
    title: 'Home',
    description: 'House, family, doors, windows, and home objects.',
    keywords: ['house', 'home', 'family', 'door', 'window', 'chair', 'table', 'room'],
  },
  {
    id: 'time',
    title: 'Time',
    description: 'Clock words, days, morning, night, and time phrases.',
    keywords: ['time', 'clock', 'morning', 'night', 'day', 'evening', 'today', 'Monday'],
  },
  {
    id: 'grammar',
    title: 'Grammar',
    description: 'Short grammar practice with simple sentence patterns.',
    keywords: ['complete', 'present simple', 'can', 'studies', 'listen', 'plays', 'know'],
  },
  {
    id: 'city',
    title: 'City',
    description: 'Places, roads, markets, streets, and city words.',
    keywords: ['city', 'road', 'street', 'market', 'plaza', 'gate', 'school', 'hospital'],
  },
  {
    id: 'polite',
    title: 'Polite words',
    description: 'Thank you, excuse me, please, and friendly phrases.',
    keywords: ['thank you', 'excuse me', 'please', 'sorry', 'polite', 'gracias', 'merci', 'danke'],
  },
  {
    id: 'shopping',
    title: 'Shopping',
    description: 'Market, food, colors, numbers, and useful shop words.',
    keywords: ['market', 'food', 'apple', 'bread', 'milk', 'red', 'water', 'buy', 'shop', 'bazaar'],
  },
  {
    id: 'travel-phrases',
    title: 'Travel phrases',
    description: 'Ready, welcome, roads, cities, and polite travel phrases.',
    keywords: ['travel', 'road', 'city', 'welcome', 'ready', 'excuse me', 'good morning', 'good night', 'street'],
  },
  {
    id: 'friends-family',
    title: 'Friends & family',
    description: 'Practice people words, home phrases, and warm everyday sentences.',
    keywords: ['friend', 'family', 'house', 'home', 'teacher', 'student', 'love', 'like', 'happy'],
  },
  {
    id: 'review-mix',
    title: 'Review mix',
    description: 'A mixed review lesson across common beginner words.',
    keywords: ['hello', 'water', 'thank you', 'friend', 'book', 'house', 'school', 'red', 'apple', 'excuse me'],
  },
  {
    id: 'starter-50',
    title: 'Starter 50',
    description: 'Fast review from many languages with the most useful beginner words.',
    keywords: ['hello', 'water', 'thank you', 'friend', 'book', 'house', 'school', 'good night', 'good morning'],
    size: 10,
  },
  {
    id: 'northern-languages',
    title: 'Northern languages',
    description: 'Swedish, Finnish, Norwegian, and Danish starter practice.',
    keywords: ['hej', 'hei', 'vesi', 'vann', 'vand', 'takk', 'tak', 'kiitos', 'fjord', 'lake', 'harbor'],
    size: 10,
  },
  {
    id: 'asia-starter',
    title: 'Asia starter',
    description: 'Hindi, Indonesian, Thai, Vietnamese, Japanese, Chinese, and Korean basics.',
    keywords: ['namaste', 'halo', 'sawasdee', 'xin chao', 'paani', 'air', 'nam', 'nuoc', 'friend', 'book'],
    size: 10,
  },
  {
    id: 'europe-starter',
    title: 'Europe starter',
    description: 'Polish, Greek, Ukrainian, Dutch, German, French, Italian, and Spanish basics.',
    keywords: ['czesc', 'yassou', 'pryvit', 'hallo', 'bonjour', 'hola', 'dom', 'spiti', 'huis', 'friend'],
    size: 10,
  },
  {
    id: 'more-europe',
    title: 'More Europe',
    description: 'Czech, Romanian, Greek, Polish, and Ukrainian starter words.',
    keywords: ['ahoj', 'salut', 'czesc', 'yassou', 'pryvit', 'dekuji', 'multumesc', 'dom', 'dum'],
    size: 10,
  },
  {
    id: 'island-languages',
    title: 'Island languages',
    description: 'Indonesian, Malay, Filipino, Thai, and Vietnamese basics.',
    keywords: ['halo', 'kumusta', 'sawasdee', 'xin chao', 'air', 'tubig', 'nam', 'nuoc', 'rumah'],
    size: 10,
  },
  {
    id: 'thank-you-world',
    title: 'Thank you world',
    description: 'Practice thank-you phrases across many languages.',
    keywords: ['thank you', 'gracias', 'merci', 'danke', 'tack', 'tak', 'toda', 'salamat', 'dziekuje', 'kiitos'],
    size: 10,
  },
  {
    id: 'home-around-world',
    title: 'Home around world',
    description: 'House and home words from many languages.',
    keywords: ['house', 'home', 'casa', 'dom', 'dum', 'bayit', 'rumah', 'bahay', 'talo', 'hus'],
    size: 10,
  },
  {
    id: 'night-morning',
    title: 'Morning & night',
    description: 'Practice greetings for starting and ending the day.',
    keywords: ['good morning', 'good night', 'morgen', 'natt', 'night', 'morning', 'pagi', 'raat', 'dobranoc'],
    size: 10,
  },
  {
    id: 'technology',
    title: 'Technology',
    description: 'Computer, screen, keyboard, and useful digital words.',
    keywords: ['tech:', 'computer', 'screen', 'keyboard', 'pantalla', 'tastatur', 'schermo'],
  },
  {
    id: 'health',
    title: 'Health',
    description: 'Health, medicine, doctors, and healthy habits.',
    keywords: ['health:', 'health', 'medicine', 'doctor', 'habit', 'sante', 'sihha'],
  },
  {
    id: 'sports',
    title: 'Sports',
    description: 'Teams, goals, scores, and sports words.',
    keywords: ['sports:', 'team', 'goal', 'score', 'equipo', 'placar'],
  },
  {
    id: 'art',
    title: 'Art',
    description: 'Painting, pictures, brushes, and creative words.',
    keywords: ['art:', 'painting', 'peinture', 'pintura', 'kartina', 'geurim'],
  },
  {
    id: 'a1',
    title: 'A1 random',
    description: 'Beginner random practice with simple everyday words.',
    keywords: ['hello', 'water', 'book', 'school', 'friend', 'house', 'food', 'no', 'apple', 'red'],
  },
  {
    id: 'a2',
    title: 'A2 random',
    description: 'Easy-medium random practice with phrases and common situations.',
    keywords: ['ready', 'time', 'city', 'travel', 'morning', 'night', 'happy', 'family', 'teacher', 'welcome'],
  },
  {
    id: 'a3',
    title: 'A3 random',
    description: 'Harder random practice with grammar, opposites, and sentence patterns.',
    keywords: ['complete', 'opposite', 'translate', 'present simple', 'can', 'studies', 'listens', 'plays', 'know', 'sentence'],
  },
  {
    id: 'hard-words',
    title: 'Hard words',
    description: 'Advanced words like evidence, consequence, responsibility, and patience.',
    keywords: ['hard:', 'evidence', 'consequence', 'responsibility', 'challenge', 'patience', 'improve', 'although'],
    size: 10,
  },
];

const languageLessonPacks: LessonPack[] = availableLanguages.map((language) => ({
  id: `language-${language.toLowerCase()}`,
  title: `${language} random`,
  description: `Random ${language} practice with 10 questions.`,
  keywords: [],
  language,
}));

const miniLanguageLessonPacks: LessonPack[] = [
  {
    id: 'language-kazakh-mini',
    title: 'Kazakh mini lesson',
    description: 'Short Kazakh practice with 10 questions.',
    keywords: [],
    language: 'Kazakh',
    size: 10,
  },
  {
    id: 'language-russian-mini',
    title: 'Russian mini lesson',
    description: 'Short Russian practice with 10 questions.',
    keywords: [],
    language: 'Russian',
    size: 10,
  },
  {
    id: 'language-english-mini',
    title: 'English mini lesson',
    description: 'Short English practice with 10 questions.',
    keywords: [],
    language: 'English',
    size: 10,
  },
];

const lessonPacks: LessonPack[] = [
  ...topicLessonPacks,
  ...languageLessonPacks,
  ...miniLanguageLessonPacks,
];
const playableLessonPacks: LessonPack[] = [tutorialLessonPack, ...lessonPacks];

type LessonAlbumId = 'topics' | 'languages' | 'world' | 'challenge';

const lessonAlbums: { id: LessonAlbumId; title: string; description: string }[] = [
  { id: 'topics', title: 'Topics', description: 'Daily words, travel, food, grammar, and practice themes.' },
  { id: 'languages', title: 'Languages', description: 'One random album for each language.' },
  { id: 'world', title: 'World albums', description: 'Regions, greetings, home, and review mixes.' },
  { id: 'challenge', title: 'Challenge', description: 'Hard words, skills, tech, health, sports, and art.' },
];

function getLessonAlbumId(pack: LessonPack): LessonAlbumId {
  if (pack.language) return 'languages';
  if (['a3', 'hard-words', 'technology', 'health', 'sports', 'art'].includes(pack.id)) return 'challenge';
  if (
    [
      'starter-50',
      'northern-languages',
      'asia-starter',
      'europe-starter',
      'more-europe',
      'island-languages',
      'thank-you-world',
      'home-around-world',
      'night-morning',
      'review-mix',
    ].includes(pack.id)
  ) {
    return 'world';
  }

  return 'topics';
}

const languageCards = availableLanguages.map((language) => ({
  language,
  questionCount: allQuests.filter((quest) => quest.language === language).length,
  lessonCount: lessonPacks.filter((pack) => pack.language === language).length,
  randomPackId: `language-${language.toLowerCase()}`,
}));

function matchesLessonPack(quest: Quest, packId: LessonPackId | null): boolean {
  if (!packId) return true;
  const pack = playableLessonPacks.find((item) => item.id === packId);
  if (!pack) return true;

  if (pack.language) {
    return quest.language === pack.language;
  }

  const haystack = `${quest.prompt} ${quest.answer} ${quest.options.join(' ')}`.toLowerCase();
  return pack.keywords.some((keyword) => haystack.includes(keyword));
}

function getRandomLessonQuestions(packId: LessonPackId, hardMode = false) {
  const pack = playableLessonPacks.find((item) => item.id === packId);
  const questionCount = pack?.size ?? defaultLessonQuestionCount;
  const questionPool = hardMode ? hardLanguageQuests : allQuests;
  const matchingQuests = questionPool.filter((quest) => matchesLessonPack(quest, packId));
  const fallbackPool = hardMode ? hardLanguageQuests : quests;
  const sourceQuests = matchingQuests.length > 0 ? matchingQuests : fallbackPool;
  const selectedQuestions: Quest[] = [];

  while (selectedQuestions.length < questionCount) {
    selectedQuestions.push(...[...sourceQuests].sort(() => Math.random() - 0.5));
  }

  return selectedQuestions.slice(0, questionCount);
}

export default function App() {
  const [view, setView] = useState<View>('quest');
  const [interfaceLanguage, setInterfaceLanguage] = useState<InterfaceLanguage>(() => {
    const savedLanguage = localStorage.getItem(interfaceLanguageKey);
    return savedLanguage === 'ru' || savedLanguage === 'kk' ? savedLanguage : 'en';
  });
  const t = (key: InterfaceMessageKey) => getInterfaceMessage(interfaceLanguage, key);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem(tutorialSeenKey) !== 'true');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('language-quest-player') || '');
  const [oauthUserId, setOauthUserId] = useState(() => localStorage.getItem(oauthPlayerKey) || '');
  const [selectedLessonPack, setSelectedLessonPack] = useState<LessonPackId | null>(null);
  const [selectedLessonAlbum, setSelectedLessonAlbum] = useState<LessonAlbumId>('topics');
  const [selectedLessonQuests, setSelectedLessonQuests] = useState<Quest[] | null>(null);
  const [lessonStreakAwarded, setLessonStreakAwarded] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState(() => {
    const accounts = readAccounts();
    const savedPlayer = localStorage.getItem('language-quest-player') || '';
    const savedOAuthUserId = localStorage.getItem(oauthPlayerKey) || '';

    if (savedOAuthUserId) {
      return localStorage.getItem(getOAuthAvatarKey(savedOAuthUserId)) || '';
    }

    return savedPlayer && accounts[savedPlayer] ? accounts[savedPlayer].avatarUrl ?? '' : '';
  });
  const [country, setCountry] = useState(() => {
    const progress = readStoredProgress();
    return progress.country ?? defaultProgress.country;
  });
  const [city, setCity] = useState(() => {
    const progress = readStoredProgress();
    return progress.city ?? defaultProgress.city;
  });
  const [settings, setSettings] = useState<PlayerSettings>(() => {
    const accounts = readAccounts();
    const savedPlayer = localStorage.getItem('language-quest-player') || '';
    const savedSettings = savedPlayer && accounts[savedPlayer]
      ? accounts[savedPlayer].settings
      : readJson(guestSettingsKey, defaultSettings);
    return normalizeSettings(savedSettings);
  });
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    const progress = readStoredProgress();
    return progress.selectedLanguage;
  });
  const [questIndex, setQuestIndex] = useState(() => {
    const progress = readStoredProgress();
    return progress.questIndex;
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [hearts, setHearts] = useState(() => {
    const progress = readStoredProgress();
    return getRefilledHeartState(progress).hearts;
  });
  const [heartRefillAt, setHeartRefillAt] = useState<number | null>(() => {
    const progress = readStoredProgress();
    return getRefilledHeartState(progress).heartRefillAt;
  });
  const [score, setScore] = useState(() => {
    const progress = readStoredProgress();
    return progress.score;
  });
  const [streak, setStreak] = useState(() => {
    const progress = readStoredProgress();
    return progress.streak;
  });
  const [xp, setXp] = useState(() => {
    const progress = readStoredProgress();
    return progress.xp ?? defaultProgress.xp;
  });
  const [diamonds, setDiamonds] = useState(() => {
    const progress = readStoredProgress();
    return progress.diamonds ?? defaultProgress.diamonds;
  });
  const [shopChests, setShopChests] = useState(() => {
    const progress = readStoredProgress();
    return progress.shopChests ?? defaultProgress.shopChests;
  });
  const [rarityChests, setRarityChests] = useState(() => {
    const progress = readStoredProgress();
    return normalizeRarityInventory(progress.rarityChests);
  });
  const [streakFreezes, setStreakFreezes] = useState(() => {
    const progress = readStoredProgress();
    return capStreakFreezes(progress.streakFreezes ?? defaultProgress.streakFreezes);
  });
  const [streakShieldUntil, setStreakShieldUntil] = useState<string | null>(() => {
    const progress = readStoredProgress();
    return progress.streakShieldUntil ?? defaultProgress.streakShieldUntil;
  });
  const [lastDailyLessonDate, setLastDailyLessonDate] = useState<string | null>(() => {
    const progress = readStoredProgress();
    return progress.lastDailyLessonDate ?? defaultProgress.lastDailyLessonDate;
  });
  const [chestOpened, setChestOpened] = useState(() => {
    const progress = readStoredProgress();
    return progress.chestOpened ?? defaultProgress.chestOpened;
  });
  const [showHint, setShowHint] = useState(false);
  const [aiHint, setAiHint] = useState('');
  const [isAiHintLoading, setIsAiHintLoading] = useState(false);
  const [aiQuestionMessage, setAiQuestionMessage] = useState('');
  const [isAutoGeneratingQuestion, setIsAutoGeneratingQuestion] = useState(false);
  const [shopMessage, setShopMessage] = useState('');
  const [rewardAnimation, setRewardAnimation] = useState('');
  const [streakAnimation, setStreakAnimation] = useState('');
  const [timeLeft, setTimeLeft] = useState(bossModeTimeLimit);
  const [refillLabel, setRefillLabel] = useState(() => formatRefillTime(heartRefillAt));
  const generatedAiQuestionSlots = useRef(new Set<string>());

  const activeQuests = useMemo(() => {
    if (selectedLessonQuests) {
      return selectedLessonQuests;
    }

    const questPool = settings.hardMode ? hardLanguageQuests : quests;

    if (selectedLanguage !== 'All') {
      const filtered = questPool.filter((quest) => quest.language === selectedLanguage);
      return filtered.length > 0 ? filtered : questPool;
    }

    return questPool;
  }, [selectedLanguage, selectedLessonQuests, settings.hardMode]);
  const streakCalendarDays = useMemo(
    () => getStreakCalendarDays(streak, lastDailyLessonDate),
    [lastDailyLessonDate, streak],
  );
  const shieldActive = isShieldActive(streakShieldUntil);
  const currentQuest = activeQuests[questIndex];
  const currentOptions = useMemo(() => (currentQuest ? shuffleOptions(currentQuest.options) : []), [currentQuest]);
  const selectedLesson = selectedLessonPack ? playableLessonPacks.find((lessonPack) => lessonPack.id === selectedLessonPack) ?? null : null;
  const visibleLessonPacks = useMemo(
    () => lessonPacks.filter((lessonPack) => getLessonAlbumId(lessonPack) === selectedLessonAlbum),
    [selectedLessonAlbum],
  );
  const aiLessonOptions: AiLessonOption[] = useMemo(
    () => lessonPacks.map((lessonPack) => ({
      id: lessonPack.id,
      title: lessonPack.title,
      description: lessonPack.description,
      keywords: lessonPack.keywords,
      language: lessonPack.language,
      size: lessonPack.size ?? defaultLessonQuestionCount,
    })),
    [],
  );
  const selectedLessonAlbumInfo = lessonAlbums.find((album) => album.id === selectedLessonAlbum) ?? lessonAlbums[0];
  const isLessonRun = Boolean(selectedLessonPack);
  const isComplete = questIndex >= activeQuests.length;
  const progress = activeQuests.length > 0 ? Math.round((questIndex / activeQuests.length) * 100) : 0;
  const hardModeEnabled = settings.hardMode;
  const bossModeEnabled = settings.bossMode;
  const heartText = 'HP '.repeat(hearts).trim() || '0';
  const refillText = hearts < maxHearts && heartRefillAt ? `+1 in ${refillLabel}` : 'Full';
  const playerSnapshot: PlayerSnapshot = {
    playerName: playerName || 'Guest',
    score,
    xp,
    diamonds,
    streak,
  };
  const feedback = useMemo(() => {
    if (!selected) return '';
    const heartLoss = hardModeEnabled ? 2 : 1;
    return selected === currentQuest?.answer ? 'Correct. The path opens.' : `Not quite. -${heartLoss} heart${heartLoss === 1 ? '' : 's'}. Try the hint and keep moving.`;
  }, [currentQuest?.answer, hardModeEnabled, selected]);

  useEffect(() => {
    localStorage.setItem(interfaceLanguageKey, interfaceLanguage);
  }, [interfaceLanguage]);

  useEffect(() => {
    function applyOAuthSession(session: Session | null) {
      if (!session) {
        setOauthUserId('');
        localStorage.removeItem(oauthPlayerKey);
        return;
      }

      const metadata = session.user.user_metadata;
      const displayName =
        getProfileText(metadata.full_name) ||
        getProfileText(metadata.name) ||
        session.user.email ||
        'OAuth player';
      const providerAvatar = getProfileText(metadata.avatar_url) || getProfileText(metadata.picture);
      const savedAvatar = localStorage.getItem(getOAuthAvatarKey(session.user.id)) || '';
      const nextAvatar = savedAvatar || providerAvatar;

      setOauthUserId(session.user.id);
      setPlayerName(displayName);
      setProfileImageUrl(nextAvatar);
      localStorage.setItem(oauthPlayerKey, session.user.id);
      localStorage.setItem('language-quest-player', displayName);
      if (nextAvatar) {
        localStorage.setItem(getOAuthAvatarKey(session.user.id), nextAvatar);
      }
      applyProgress(readOAuthProgress(session.user.id), normalizeSettings(readJson(getOAuthSettingsKey(session.user.id), defaultSettings)));
      setAuthMessage('');
      setView('quest');
    }

    supabase.auth.getSession().then(({ data }) => {
      applyOAuthSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      applyOAuthSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const safeQuestIndex = Math.min(questIndex, activeQuests.length);
    const progress: PlayerProgress = {
      selectedLanguage,
      questIndex: safeQuestIndex,
      hearts,
      score,
      streak,
      xp,
      diamonds,
      shopChests,
      rarityChests,
      streakFreezes,
      streakShieldUntil,
      lastDailyLessonDate,
      chestOpened,
      heartRefillAt,
      country,
      city,
    };

    if (oauthUserId) {
      localStorage.setItem(getOAuthProgressKey(oauthUserId), JSON.stringify(progress));
      localStorage.setItem(getOAuthSettingsKey(oauthUserId), JSON.stringify(settings));
      localStorage.setItem(getOAuthAvatarKey(oauthUserId), profileImageUrl);
      localStorage.setItem(oauthPlayerKey, oauthUserId);
      localStorage.setItem('language-quest-player', playerName);
      return;
    }

    if (playerName) {
      const accounts = readAccounts();
      if (accounts[playerName]) {
        accounts[playerName] = { ...accounts[playerName], progress, settings, avatarUrl: profileImageUrl };
        writeAccounts(accounts);
      }
      localStorage.setItem('language-quest-player', playerName);
      return;
    }

    localStorage.removeItem('language-quest-player');
    localStorage.setItem(guestProgressKey, JSON.stringify(progress));
    localStorage.setItem(guestSettingsKey, JSON.stringify(settings));
  }, [activeQuests.length, chestOpened, city, country, diamonds, heartRefillAt, hearts, lastDailyLessonDate, oauthUserId, playerName, profileImageUrl, questIndex, rarityChests, score, selectedLanguage, settings, shopChests, streak, streakFreezes, streakShieldUntil, xp]);

  useEffect(() => {
    if (questIndex > activeQuests.length) {
      setQuestIndex(activeQuests.length);
    }
  }, [activeQuests.length, questIndex]);

  useEffect(() => {
    if (view !== 'quest' || isComplete || selected || !currentQuest || isAutoGeneratingQuestion) {
      return;
    }

    const slotKey = `${selectedLessonPack ?? selectedLanguage}-${questIndex}`;
    if (generatedAiQuestionSlots.current.has(slotKey)) {
      return;
    }

    let isCancelled = false;
    generatedAiQuestionSlots.current.add(slotKey);
    setIsAutoGeneratingQuestion(true);
    setAiQuestionMessage('AI is creating a question...');

    async function createQuestion() {
      const questionContext: QuestionContext = {
        prompt: currentQuest.prompt,
        options: currentQuest.options,
        hint: currentQuest.hint,
        language: currentQuest.language,
      };
      const { question: nextQuestion, error } = await createAiQuestion(questionContext);
      if (isCancelled) return;
      if (nextQuestion) {
        useAiQuestion(nextQuestion);
        setAiQuestionMessage('AI made this question.');
      } else {
        setAiQuestionMessage(error || 'AI made a broken question, so this normal question stays.');
      }

      setIsAutoGeneratingQuestion(false);
    }

    void createQuestion();

    return () => {
      isCancelled = true;
    };
  }, [activeQuests, currentQuest, isComplete, questIndex, selected, selectedLanguage, selectedLessonPack, view]);

  useEffect(() => {
    if (!selectedLessonPack || !isComplete || lessonStreakAwarded) {
      return;
    }

    completeDailyLesson();
    setLessonStreakAwarded(true);
  }, [isComplete, lessonStreakAwarded, selectedLessonPack]);

  useEffect(() => {
    if (!saveMessage) return;

    const timeoutId = window.setTimeout(() => setSaveMessage(''), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [saveMessage]);

  useEffect(() => {
    if (!rewardAnimation) return;

    const timeoutId = window.setTimeout(() => setRewardAnimation(''), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [rewardAnimation]);

  useEffect(() => {
    if (!streakAnimation) return;

    const timeoutId = window.setTimeout(() => setStreakAnimation(''), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [streakAnimation]);

  useEffect(() => {
    if (!bossModeEnabled || isComplete || selected || view !== 'quest') {
      return;
    }

    if (timeLeft <= 0) {
      loseHearts(1);
      setShowHint(false);
      setSelected(null);
      setQuestIndex((value) => value + 1);
      setTimeLeft(bossModeTimeLimit);
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((value) => value - 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [bossModeEnabled, isComplete, selected, view, timeLeft, questIndex]);

  useEffect(() => {
    if (!heartRefillAt) {
      setRefillLabel('');
      return;
    }

    setRefillLabel(formatRefillTime(heartRefillAt));

    const timerId = window.setInterval(() => {
      setRefillLabel(formatRefillTime(heartRefillAt));
      const refilled = getRefilledHeartState({ ...getCurrentProgress(), hearts, heartRefillAt });

      if (refilled.hearts !== hearts) {
        setHearts(refilled.hearts);
      }

      if (refilled.heartRefillAt !== heartRefillAt) {
        setHeartRefillAt(refilled.heartRefillAt);
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [heartRefillAt]);

  useEffect(() => {
    const refilled = getRefilledHeartState({ ...getCurrentProgress(), hearts, heartRefillAt });

    if (refilled.hearts !== hearts) {
      setHearts(refilled.hearts);
    }

    if (refilled.heartRefillAt !== heartRefillAt) {
      setHeartRefillAt(refilled.heartRefillAt);
    }
  }, [heartRefillAt, hearts]);

  useEffect(() => {
    // (removed) automatic restart when hearts reach zero — keep player in current run
  }, [/* hearts, isComplete, view (no-op) */]);

  function getCurrentProgress(): PlayerProgress {
    return {
      selectedLanguage,
      questIndex: Math.min(questIndex, activeQuests.length),
      hearts,
      score,
      streak,
      xp,
      diamonds,
      shopChests,
      rarityChests,
      streakFreezes,
      streakShieldUntil,
      lastDailyLessonDate,
      chestOpened,
      heartRefillAt,
      country,
      city,
    };
  }

  function persistProgress(progress: PlayerProgress) {
    if (oauthUserId) {
      localStorage.setItem(getOAuthProgressKey(oauthUserId), JSON.stringify(progress));
      localStorage.setItem(getOAuthSettingsKey(oauthUserId), JSON.stringify(settings));
      localStorage.setItem(getOAuthAvatarKey(oauthUserId), profileImageUrl);
      localStorage.setItem(oauthPlayerKey, oauthUserId);
      localStorage.setItem('language-quest-player', playerName);
      return;
    }

    if (playerName) {
      const accounts = readAccounts();
      if (accounts[playerName]) {
        accounts[playerName] = { ...accounts[playerName], progress, settings, avatarUrl: profileImageUrl };
        writeAccounts(accounts);
        localStorage.setItem('language-quest-player', playerName);
        return;
      }
    }

    localStorage.setItem(guestProgressKey, JSON.stringify(progress));
    localStorage.setItem(guestSettingsKey, JSON.stringify(settings));
  }

  function saveGame() {
    const progress = getCurrentProgress();

    persistProgress(progress);

    if (oauthUserId) {
      setSaveMessage(`Saved ${playerName}'s game.`);
      return;
    }

    if (playerName) {
      const accounts = readAccounts();
      if (accounts[playerName]) {
        setSaveMessage(`Saved ${playerName}'s game.`);
        return;
      }
    }

    setSaveMessage('Saved guest game.');
  }

  function resetRun(restoreHearts = false) {
    setQuestIndex(0);
    setSelected(null);
    generatedAiQuestionSlots.current.clear();
    if (restoreHearts) {
      setHearts(maxHearts);
      setHeartRefillAt(null);
    }
    setScore(0);
    setLessonStreakAwarded(false);
    setChestOpened(false);
    setShowHint(false);
    setAiHint('');
    setIsAiHintLoading(false);
    setAiQuestionMessage('');
    setIsAutoGeneratingQuestion(false);
    setTimeLeft(bossModeTimeLimit);
  }

  function chooseOption(option: string) {
    if (selected || isComplete || !currentQuest) return;

    setSelected(option);

    if (option === currentQuest.answer) {
      const multiplier = bossModeEnabled ? 2 : 1;
      const rewardMultiplier = hardModeEnabled || bossModeEnabled ? 5 : 1;
      setScore((value) => value + (100 + streak * 20) * multiplier);
      if (Math.random() < 0.5) {
        setXp((value) => value + 20 * rewardMultiplier);
      } else {
        setDiamonds((value) => value + 10 * rewardMultiplier);
      }
      return;
    }

    loseHearts(hardModeEnabled ? 2 : 1);
  }

  function loseHearts(amount: number) {
    setHearts((value) => {
      const nextHearts = Math.max(0, value - amount);
      if (nextHearts < maxHearts) {
        setHeartRefillAt((currentRefillAt) => currentRefillAt ?? Date.now() + heartRefillMs);
      }
      return nextHearts;
    });
  }

  function completeDailyLesson() {
    const today = getLocalDateKey();
    if (lastDailyLessonDate === today) {
      persistProgress(getCurrentProgress());
      setRewardAnimation('Lesson complete');
      return;
    }

    const nextProgress = {
      ...getCurrentProgress(),
      streak: streak + 1,
      lastDailyLessonDate: today,
    };

    setStreak(nextProgress.streak);
    setLastDailyLessonDate(today);
    persistProgress(nextProgress);
    setStreakAnimation(`${nextProgress.streak} day streak`);
    setRewardAnimation('Daily lesson complete +1 streak');
  }

  function claimLocalDailyReward(reward: { xp: number; diamonds: number }) {
    setXp((value) => value + reward.xp);
    setDiamonds((value) => value + reward.diamonds);
    setRewardAnimation(`+${reward.xp} XP +${reward.diamonds} diamonds`);
  }

  function awardRarityChest() {
    const rarity = getRandomChestRarity();
    setRarityChests((inventory) => ({
      ...inventory,
      [rarity]: inventory[rarity] + 1,
    }));
    return rarity;
  }

  function openChest() {
    if (!isComplete || chestOpened) return;

    const rarity = awardRarityChest();
    setShopMessage(`Reward chest gave you a ${rarity} chest.`);
    setRewardAnimation(`${rarity} chest unlocked`);
    setChestOpened(true);
  }

  function completeSpeakingTraining() {
    const rarity = awardRarityChest();
    setShopMessage(`Speaking training gave you a ${rarity} chest.`);
    setRewardAnimation(`You did it + ${rarity} chest`);
  }

  function buyShopChest(currency: 'xp' | 'diamonds') {
    if (currency === 'xp') {
      if (xp < shopChestXpCost) {
        setShopMessage(`Need ${shopChestXpCost} XP to buy this chest.`);
        return;
      }

      setXp((value) => value - shopChestXpCost);
    } else {
      if (diamonds < shopChestDiamondCost) {
        setShopMessage(`Need ${shopChestDiamondCost} diamonds to buy this chest.`);
        return;
      }

      setDiamonds((value) => value - shopChestDiamondCost);
    }

    setShopChests((value) => value + 1);
    setShopMessage('Chest added to your shop inventory.');
  }

  function buyStreakFreeze(currency: 'xp' | 'diamonds') {
    if (streakFreezes >= maxStreakFreezes) {
      setShopMessage(`You can hold only ${maxStreakFreezes} streak freezes.`);
      return;
    }

    if (currency === 'xp') {
      if (xp < streakFreezeXpCost) {
        setShopMessage(`Need ${streakFreezeXpCost} XP to buy a streak freeze.`);
        return;
      }

      setXp((value) => value - streakFreezeXpCost);
    } else {
      if (diamonds < streakFreezeDiamondCost) {
        setShopMessage(`Need ${streakFreezeDiamondCost} diamonds to buy a streak freeze.`);
        return;
      }

      setDiamonds((value) => value - streakFreezeDiamondCost);
    }

    setStreakFreezes((value) => capStreakFreezes(value + 1));
    setShopMessage('Streak freeze added.');
  }

  function activateWeeklyShield() {
    if (shieldActive) {
      setShopMessage(`Your 1 week shield is active until ${streakShieldUntil}.`);
      return;
    }

    if (streakFreezes < weeklyShieldCost) {
      setShopMessage(`Need ${weeklyShieldCost} streak freezes to activate a 1 week shield.`);
      return;
    }

    const shieldUntil = addDays(getLocalDateKey(), weeklyShieldDays - 1);
    setStreakFreezes((value) => capStreakFreezes(value - weeklyShieldCost));
    setStreakShieldUntil(shieldUntil);
    setShopMessage(`1 week streak shield active until ${shieldUntil}.`);
    setRewardAnimation('1 week streak shield active');
  }

  function exchangeCurrency(type: 'diamonds-to-xp' | 'xp-to-diamonds') {
    if (type === 'diamonds-to-xp') {
      if (diamonds < xpBundleDiamondCost) {
        setShopMessage(`Need ${xpBundleDiamondCost} diamonds to get ${xpBundleReward} XP.`);
        return;
      }

      setDiamonds((value) => value - xpBundleDiamondCost);
      setXp((value) => value + xpBundleReward);
      setShopMessage(`Exchanged ${xpBundleDiamondCost} diamonds for ${xpBundleReward} XP.`);
      return;
    }

    if (xp < diamondBundleXpCost) {
      setShopMessage(`Need ${diamondBundleXpCost} XP to get ${diamondBundleReward} diamonds.`);
      return;
    }

    setXp((value) => value - diamondBundleXpCost);
    setDiamonds((value) => value + diamondBundleReward);
    setShopMessage(`Exchanged ${diamondBundleXpCost} XP for ${diamondBundleReward} diamonds.`);
  }

  function openShopChest() {
    if (shopChests <= 0) {
      setShopMessage('Buy a chest first.');
      return;
    }

    setShopChests((value) => value - 1);
    const rarity = awardRarityChest();
    setShopMessage(`Shop chest gave you a ${rarity} chest.`);
    setRewardAnimation(`${rarity} chest unlocked`);
  }

  function openRarityChest(rarity: ChestRarity) {
    if (rarityChests[rarity] <= 0) return;

    const reward = rarityRewards[rarity];
    const prize = getRandomChestPrize(reward);
    setRarityChests((inventory) => ({
      ...inventory,
      [rarity]: inventory[rarity] - 1,
    }));

    if (prize.kind === 'xp') {
      setXp((value) => value + prize.amount);
    } else if (prize.kind === 'diamonds') {
      setDiamonds((value) => value + prize.amount);
    } else {
      setStreakFreezes((value) => capStreakFreezes(value + prize.amount));
    }

    setShopMessage(`${rarity} chest gave ${prize.label}.`);
    setRewardAnimation(`+${prize.label}`);
  }

  function nextQuest() {
    if (!selected) return;
    setQuestIndex((value) => value + 1);
    setSelected(null);
    setShowHint(false);
    setAiHint('');
    setIsAutoGeneratingQuestion(false);
    setAiQuestionMessage('');
    setTimeLeft(bossModeTimeLimit);
  }

  async function showAiHint() {
    if (!currentQuest || isAiHintLoading) return;
    setShowHint(true);
    setAiHint('AI is making a hint...');
    setIsAiHintLoading(true);

    const { text, error } = await createAiHint({
      prompt: currentQuest.prompt,
      options: currentOptions,
      hint: currentQuest.hint,
      language: currentQuest.language,
    });

    setAiHint(text || error || currentQuest.hint);
    setIsAiHintLoading(false);
  }

  function useAiQuestion(question: Required<QuestionContext>) {
    const language = playableLanguageOptions.includes(question.language as Language)
      ? question.language as Exclude<Language, 'All'>
      : currentQuest.language;
    const nextQuestion: Quest = {
      prompt: question.prompt,
      answer: question.answer,
      options: question.options,
      hint: question.hint,
      world: question.world,
      language,
    };
    const nextQuests = [...activeQuests];
    nextQuests[questIndex] = nextQuestion;

    setSelectedLessonQuests(nextQuests);
    setSelected(null);
    setShowHint(false);
    setAiHint('');
    setTimeLeft(bossModeTimeLimit);
  }

  function restartQuest() {
    resetRun(false);
  }

  function startNewQuest() {
    setSelectedLessonPack(null);
    setSelectedLessonQuests(null);
    resetRun(true);
    setView('quest');
  }

  function chooseLanguage(language: Language) {
    setSelectedLessonPack(null);
    setSelectedLessonQuests(null);
    setSelectedLanguage(language);
    resetRun();
  }

  function startLanguageQuest(language: Exclude<Language, 'All'>) {
    chooseLanguage(language);
    setView('quest');
  }

  function startLessonPack(packId: LessonPackId) {
    setSelectedLessonPack(packId);
    setSelectedLessonQuests(getRandomLessonQuestions(packId, settings.hardMode));
    setSelectedLanguage('All');
    resetRun();
    setView('quest');
  }

  function closeLesson() {
    setSelectedLessonPack(null);
    setSelectedLessonQuests(null);
    resetRun();
    setView('lessons');
  }

  function applyProgress(progress: PlayerProgress, nextSettings: PlayerSettings) {
    const dailyCheckedProgress = getDailyCheckedProgress(progress);
    const refilled = getRefilledHeartState(dailyCheckedProgress);

    setSelectedLanguage(dailyCheckedProgress.selectedLanguage);
    setQuestIndex(dailyCheckedProgress.questIndex);
    setHearts(refilled.hearts);
    setHeartRefillAt(refilled.heartRefillAt);
    setScore(dailyCheckedProgress.score);
    setStreak(dailyCheckedProgress.streak);
    setXp(dailyCheckedProgress.xp ?? defaultProgress.xp);
    setDiamonds(dailyCheckedProgress.diamonds ?? defaultProgress.diamonds);
    setShopChests(dailyCheckedProgress.shopChests ?? defaultProgress.shopChests);
    setRarityChests(normalizeRarityInventory(dailyCheckedProgress.rarityChests));
    setStreakFreezes(capStreakFreezes(dailyCheckedProgress.streakFreezes ?? defaultProgress.streakFreezes));
    setStreakShieldUntil(dailyCheckedProgress.streakShieldUntil ?? defaultProgress.streakShieldUntil);
    setLastDailyLessonDate(dailyCheckedProgress.lastDailyLessonDate ?? defaultProgress.lastDailyLessonDate);
    setChestOpened(dailyCheckedProgress.chestOpened ?? defaultProgress.chestOpened);
    setCountry(dailyCheckedProgress.country ?? defaultProgress.country);
    setCity(dailyCheckedProgress.city ?? defaultProgress.city);
    setSettings(normalizeSettings(nextSettings));
    setSelected(null);
    setShowHint(false);
    setTimeLeft(bossModeTimeLimit);
  }

  function clearAuthForm() {
    setAuthName('');
    setAuthPassword('');
    setAuthMessage('');
    setAuthMode(null);
  }

  async function signInWithGoogle() {
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthMessage(error.message);
    }
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    const name = authName.trim();
    const accounts = readAccounts();

    if (!accounts[name] || accounts[name].password !== authPassword) {
      setAuthMessage('Player name or password is wrong.');
      return;
    }

    setOauthUserId('');
    localStorage.removeItem(oauthPlayerKey);
    void supabase.auth.signOut();
    setPlayerName(name);
    setProfileImageUrl(accounts[name].avatarUrl ?? '');
    applyProgress(accounts[name].progress, normalizeSettings(accounts[name].settings));
    clearAuthForm();
    setView('quest');
  }

  function handleRegister(event: FormEvent) {
    event.preventDefault();
    const name = authName.trim();
    const accounts = readAccounts();

    if (name.length < 2) {
      setAuthMessage('Use at least 2 characters for the player name.');
      return;
    }

    if (authPassword.length < 4) {
      setAuthMessage('Use at least 4 characters for the password.');
      return;
    }

    if (accounts[name]) {
      setAuthMessage('That player already exists. Try logging in.');
      return;
    }

    const progress: PlayerProgress = {
      selectedLanguage,
      questIndex,
      hearts,
      score,
      streak,
      xp,
      diamonds,
      shopChests,
      rarityChests,
      streakFreezes,
      streakShieldUntil,
      lastDailyLessonDate,
      chestOpened,
      heartRefillAt,
      country,
      city,
    };

    accounts[name] = {
      password: authPassword,
      progress,
      settings,
      avatarUrl: '',
    };
    writeAccounts(accounts);
    setOauthUserId('');
    localStorage.removeItem(oauthPlayerKey);
    void supabase.auth.signOut();
    setPlayerName(name);
    setProfileImageUrl('');
    clearAuthForm();
    setView('quest');
  }

  function logout() {
    if (oauthUserId) {
      void supabase.auth.signOut();
    }

    setPlayerName('');
    setOauthUserId('');
    setProfileImageUrl('');
    localStorage.removeItem(oauthPlayerKey);
    applyProgress(readJson(guestProgressKey, defaultProgress), normalizeSettings(readJson(guestSettingsKey, defaultSettings)));
    setView('quest');
  }

  function clearSavedProgress() {
    resetRun();
    setStreak(defaultProgress.streak);
    setXp(defaultProgress.xp);
    setDiamonds(defaultProgress.diamonds);
    setShopChests(defaultProgress.shopChests);
    setRarityChests(defaultProgress.rarityChests);
    setStreakFreezes(defaultProgress.streakFreezes);
    setStreakShieldUntil(defaultProgress.streakShieldUntil);
    setLastDailyLessonDate(defaultProgress.lastDailyLessonDate);
    setChestOpened(defaultProgress.chestOpened);
    setCountry(defaultProgress.country);
    setCity(defaultProgress.city);

    if (!playerName) {
      localStorage.setItem(guestProgressKey, JSON.stringify(defaultProgress));
      return;
    }

    const accounts = readAccounts();
    if (accounts[playerName]) {
      accounts[playerName] = { ...accounts[playerName], progress: defaultProgress };
      writeAccounts(accounts);
    }
  }

  function finishTutorial() {
    localStorage.setItem(tutorialSeenKey, 'true');
    setShowTutorial(false);
    setView('start');
  }

  function startTutorialLesson() {
    localStorage.setItem(tutorialSeenKey, 'true');
    setShowTutorial(false);
    startLessonPack('tutorial');
  }

  return (
    <main className="game-shell">
      <BackgroundMusic enabled={Boolean(settings.music)} />
      {showWelcomeScreen && (
        <button className="welcome-screen" type="button" onClick={() => setShowWelcomeScreen(false)}>
          <span className="eyebrow">{t('languageQuest')}</span>
          <strong>{t('welcome')}</strong>
          <span>{t('clickToContinue')}</span>
        </button>
      )}
      {!showWelcomeScreen && showTutorial && (
        <section className="tutorial-screen" aria-label="New player tutorial">
          <div className="tutorial-card">
            <p className="eyebrow">Quick tutorial</p>
            <h2>How to start</h2>
            <div className="tutorial-steps">
              <div>
                <strong>1. Choose a language</strong>
                <p>Use Languages or Play. Flags help you find each language fast.</p>
              </div>
              <div>
                <strong>2. Answer questions</strong>
                <p>Pick an answer, press Continue, and earn score, XP, or diamonds.</p>
              </div>
              <div>
                <strong>3. Watch hearts</strong>
                <p>Each mistake takes -1 heart in normal mode. Hard mode takes -2 hearts.</p>
              </div>
            </div>
            <div className="tutorial-actions">
              <button className="secondary" type="button" onClick={finishTutorial}>
                Skip tutorial
              </button>
              <button type="button" onClick={startTutorialLesson}>
                <ButtonLabel icon={GraduationCap}>Start tutorial lesson</ButtonLabel>
              </button>
              <button type="button" onClick={finishTutorial}>
                <ButtonLabel icon={Play}>Start learning</ButtonLabel>
              </button>
            </div>
          </div>
        </section>
      )}
      {rewardAnimation && (
        <div className="reward-pop" role="status" aria-live="polite">
          <span>{rewardAnimation}</span>
        </div>
      )}
      {streakAnimation && (
        <div className="streak-pop" role="status" aria-live="polite">
          <Flame aria-hidden="true" size={34} strokeWidth={2.4} />
          <strong>{streakAnimation}</strong>
          <span>Keep going</span>
        </div>
      )}
      <section className="quest-panel" aria-label="Language Quest">
        <div className="topbar">
          <div>
            <p className="eyebrow">{t('languageQuest')}</p>
            <h1>{t('wordTrail')}</h1>
          </div>
          <div className="topbar-actions">
            <InterfaceLanguageSelect language={interfaceLanguage} onChange={setInterfaceLanguage} />
            <button className="icon-button" type="button" onClick={restartQuest} aria-label={t('restartQuest')} title={t('restartQuest')}>
              <RotateCcw aria-hidden="true" size={22} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <nav className="main-menu" aria-label="Main menu">
          <button className={view === 'start' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('start')}>
            <ButtonLabel icon={Home}>{t('start')}</ButtonLabel>
          </button>
          <button className={view === 'quest' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('quest')}>
            <ButtonLabel icon={Play}>{t('play')}</ButtonLabel>
          </button>
          <button className={view === 'languages' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('languages')}>
            <ButtonLabel icon={Globe2}>{t('languages')}</ButtonLabel>
          </button>
          <button className={view === 'lessons' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('lessons')}>
            <ButtonLabel icon={GraduationCap}>{t('lessons')}</ButtonLabel>
          </button>
          <button className={view === 'shop' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('shop')}>
            <ButtonLabel icon={ShoppingBag}>{t('shop')}</ButtonLabel>
          </button>
          <button className={view === 'rewards' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('rewards')}>
            <ButtonLabel icon={Gift}>{t('rewards')}</ButtonLabel>
          </button>
          <button className={view === 'leaderboard' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('leaderboard')}>
            <ButtonLabel icon={Trophy}>{t('leaderboard')}</ButtonLabel>
          </button>
          {playerName ? (
            <button className="menu-button" type="button" onClick={logout}>
              <ButtonLabel icon={LogOut}>{t('logout')}</ButtonLabel>
            </button>
          ) : (
            <>
              <button className={view === 'login' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('login')}>
                <ButtonLabel icon={LogIn}>{t('login')}</ButtonLabel>
              </button>
              <button className={view === 'register' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('register')}>
                <ButtonLabel icon={UserPlus}>{t('register')}</ButtonLabel>
              </button>
            </>
          )}
          <button className={view === 'settings' ? 'menu-button menu-button--active' : 'menu-button'} type="button" onClick={() => setView('settings')}>
            <ButtonLabel icon={Settings}>{t('settings')}</ButtonLabel>
          </button>
          <button className="menu-button" type="button" onClick={saveGame}>
            <ButtonLabel icon={Save}>{t('saveGame')}</ButtonLabel>
          </button>
        </nav>

        <div className="player-line">
          <ProfileAvatar name={playerName || 'Guest'} imageUrl={profileImageUrl} />
          <p>
            {playerName ? `${t('signedInAs')} ${playerName}.` : t('guestLine')}
            {(city || country) && <span className="player-location"> {city}{city && country ? ', ' : ''}{country}</span>}
          </p>
          {!playerName && (
            <button className="google-signin-button" type="button" onClick={() => void signInWithGoogle()}>
              <ButtonLabel icon={Mail}>{t('continueWithGoogle')}</ButtonLabel>
            </button>
          )}
        </div>
        {saveMessage && <p className="save-line">{saveMessage}</p>}

        {view === 'start' && (
          <section className="menu-panel start-panel" aria-label="Start menu">
            <p className="eyebrow">Welcome</p>
            <h2>Begin your language journey.</h2>
            <p className="start-copy">Choose a world and follow the word trail. Save your progress with a profile or continue as guest.</p>
            <div className="motivation-list" aria-label="Motivation">
              <p>Small practice today becomes easy words tomorrow.</p>
              <p>One correct answer is still progress.</p>
              <p>Keep your streak alive and let your XP grow.</p>
            </div>
            <div className="start-actions">
              <button type="button" onClick={startNewQuest}>
                <ButtonLabel icon={Gamepad2}>Play now</ButtonLabel>
              </button>
              {!playerName && (
                <button type="button" onClick={() => void signInWithGoogle()}>
                  <ButtonLabel icon={Mail}>Google Sign In</ButtonLabel>
                </button>
              )}
              <button type="button" onClick={() => setView('lessons')}>
                <ButtonLabel icon={GraduationCap}>Lessons</ButtonLabel>
              </button>
              <button type="button" onClick={() => setView('languages')}>
                <ButtonLabel icon={Globe2}>Languages</ButtonLabel>
              </button>
              <button type="button" onClick={() => setView('shop')}>
                <ButtonLabel icon={ShoppingBag}>Shop</ButtonLabel>
              </button>
              <button type="button" onClick={() => setView('rewards')}>
                <ButtonLabel icon={Gift}>Daily reward</ButtonLabel>
              </button>
              <button type="button" onClick={() => setView('leaderboard')}>
                <ButtonLabel icon={Trophy}>Leaderboard</ButtonLabel>
              </button>
              {!playerName && (
                <>
                  <button type="button" onClick={() => setView('login')}>
                    <ButtonLabel icon={LogIn}>Login</ButtonLabel>
                  </button>
                  <button type="button" onClick={() => setView('register')}>
                    <ButtonLabel icon={UserPlus}>Register</ButtonLabel>
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {view === 'languages' && (
          <section className="menu-panel language-panel" aria-label="Languages">
            <p className="eyebrow">Languages</p>
            <h2>Choose your language</h2>
            <p className="start-copy">Pick a language to see its practice path, start a random quest, or open its lessons.</p>
            <div className="language-grid">
              {languageCards.map((card) => (
                <article className="language-card" key={card.language}>
                  <div>
                    <strong className="language-card-title"><FlagLabel language={card.language} /></strong>
                    <p>{card.questionCount} questions ready</p>
                  </div>
                  <span>{card.lessonCount} lesson packs</span>
                  <div className="language-card-actions">
                    <button type="button" onClick={() => startLanguageQuest(card.language)}>
                      <ButtonLabel icon={Play}>Play</ButtonLabel>
                    </button>
                    <button className="secondary" type="button" onClick={() => startLessonPack(card.randomPackId)}>
                      <ButtonLabel icon={BookOpen}>10 questions</ButtonLabel>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === 'lessons' && (
          <section className="menu-panel lessons-panel" aria-label="Lessons">
            <p className="eyebrow">Lessons</p>
            <h2>Choose an album</h2>
            <p className="start-copy">Open an album, then pick a 10-question lesson inside it.</p>
            <label className="toggle-row" style={{ marginBottom: '1rem' }}>
              <span>
                <strong>Hard mode</strong>
                <small>No hints and tougher penalties for mistakes.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.hardMode}
                onChange={(event) => setSettings((value) => ({ ...value, hardMode: event.target.checked }))}
              />
            </label>
            <label className="toggle-row" style={{ marginBottom: '1rem' }}>
              <span>
                <strong>Boss mode</strong>
                <small>Beat the clock and earn double points.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.bossMode}
                onChange={(event) => setSettings((value) => ({ ...value, bossMode: event.target.checked }))}
              />
            </label>
            <div className="speaking-card">
              <strong>Speaking practice</strong>
              <p>Use Speaking Trainer to practice real phrases with translations, pronunciation, and word-by-word meaning.</p>
            </div>
            <AITutor languages={playableLanguageOptions} onTrainingComplete={completeSpeakingTraining} />

            <LessonAiPicker lessons={aiLessonOptions} onStartLesson={startLessonPack} />

            <div className="lesson-albums" aria-label="Lesson albums">
              {lessonAlbums.map((album) => {
                const albumCount = lessonPacks.filter((lessonPack) => getLessonAlbumId(lessonPack) === album.id).length;

                return (
                  <button
                    className={album.id === selectedLessonAlbum ? 'lesson-album lesson-album--active' : 'lesson-album'}
                    type="button"
                    key={album.id}
                    onClick={() => setSelectedLessonAlbum(album.id)}
                  >
                    <strong>{album.title}</strong>
                    <span>{album.description}</span>
                    <small>{albumCount} lessons</small>
                  </button>
                );
              })}
            </div>

            <div className="lesson-album-header">
              <div>
                <strong>{selectedLessonAlbumInfo.title}</strong>
                <p>{selectedLessonAlbumInfo.description}</p>
              </div>
              <span>{visibleLessonPacks.length} lessons</span>
            </div>

            <div className="start-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              {visibleLessonPacks.map((lessonPack) => (
                <div key={lessonPack.id} className="card lesson-card">
                  <div>
                    <strong>{lessonPack.title}</strong>
                    <p>{lessonPack.description}</p>
                    <small>{lessonPack.size ?? defaultLessonQuestionCount} questions</small>
                  </div>
                  <button type="button" onClick={() => startLessonPack(lessonPack.id)}>
                    <ButtonLabel icon={Play}>Start {lessonPack.title}</ButtonLabel>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'shop' && (
          <section className="menu-panel" aria-label="Shop">
            <p className="eyebrow">Shop</p>
            <h2>Chest shop</h2>
            <p className="start-copy">Spend your rewards on a shop chest. Open it for a random prize.</p>

            <div className="shop-wallet" aria-label="Wallet">
              <span>XP: <strong>{xp}</strong></span>
              <span>Diamonds: <strong>{diamonds}</strong></span>
              <span>Chests: <strong>{shopChests}</strong></span>
              <span>Freezes: <strong>{streakFreezes}</strong></span>
            </div>

            <div className="rarity-inventory" aria-label="Rarity chest inventory">
              {chestRarities.map((rarity) => {
                const reward = rarityRewards[rarity];

                return (
                  <div key={rarity} className="rarity-card">
                    <strong>{rarity}</strong>
                    <span>Owned: {rarityChests[rarity]}</span>
                    <small>
                      One prize: {reward.xp} XP or {reward.diamonds} diamonds{reward.freezes ? ` or ${reward.freezes} freezes` : ''}
                    </small>
                    <button type="button" onClick={() => openRarityChest(rarity)} disabled={rarityChests[rarity] <= 0}>
                      <ButtonLabel icon={PackageOpen}>Open</ButtonLabel>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="shop-item">
              <div>
                <strong>Shop chest</strong>
                <p>Costs {shopChestXpCost} XP or {shopChestDiamondCost} diamonds.</p>
              </div>
              <div className="shop-actions">
                <button type="button" onClick={() => buyShopChest('xp')} disabled={xp < shopChestXpCost}>
                  <ButtonLabel icon={Coins}>Buy for {shopChestXpCost} XP</ButtonLabel>
                </button>
                <button type="button" onClick={() => buyShopChest('diamonds')} disabled={diamonds < shopChestDiamondCost}>
                  <ButtonLabel icon={Diamond}>Buy for {shopChestDiamondCost} diamonds</ButtonLabel>
                </button>
                <button type="button" onClick={openShopChest} disabled={shopChests <= 0}>
                  <ButtonLabel icon={Gift}>Open chest</ButtonLabel>
                </button>
              </div>
            </div>

            <div className="shop-item">
              <div>
                <strong>Currency exchange</strong>
                <p>Trade rewards when you need more XP or diamonds.</p>
              </div>
              <div className="shop-actions">
                <button type="button" onClick={() => exchangeCurrency('diamonds-to-xp')} disabled={diamonds < xpBundleDiamondCost}>
                  <ButtonLabel icon={Coins}>{xpBundleDiamondCost} diamonds = {xpBundleReward} XP</ButtonLabel>
                </button>
                <button type="button" onClick={() => exchangeCurrency('xp-to-diamonds')} disabled={xp < diamondBundleXpCost}>
                  <ButtonLabel icon={Diamond}>{diamondBundleXpCost} XP = {diamondBundleReward} diamonds</ButtonLabel>
                </button>
              </div>
            </div>

            <div className="shop-item">
              <div>
                <strong>Streak freeze</strong>
                <p>Saves your streak if you miss one daily lesson. Max {maxStreakFreezes}.</p>
              </div>
              <div className="shop-actions">
                <button type="button" onClick={() => buyStreakFreeze('xp')} disabled={xp < streakFreezeXpCost || streakFreezes >= maxStreakFreezes}>
                  <ButtonLabel icon={Coins}>Buy for {streakFreezeXpCost} XP</ButtonLabel>
                </button>
                <button type="button" onClick={() => buyStreakFreeze('diamonds')} disabled={diamonds < streakFreezeDiamondCost || streakFreezes >= maxStreakFreezes}>
                  <ButtonLabel icon={Diamond}>Buy for {streakFreezeDiamondCost} diamonds</ButtonLabel>
                </button>
              </div>
            </div>

            <div className="shop-item">
              <div>
                <strong>1 week streak shield</strong>
                <p>Uses {weeklyShieldCost} streak freezes to protect your streak for {weeklyShieldDays} days.</p>
              </div>
              <div className="shop-actions">
                <button type="button" onClick={activateWeeklyShield} disabled={shieldActive || streakFreezes < weeklyShieldCost}>
                  <ButtonLabel icon={CalendarDays}>{shieldActive ? `Active until ${streakShieldUntil}` : 'Activate shield'}</ButtonLabel>
                </button>
              </div>
            </div>

            {shopMessage && <p className="save-line">{shopMessage}</p>}
          </section>
        )}

        {view === 'rewards' && (
          <DailyReward
            snapshot={playerSnapshot}
            isSignedIn={Boolean(oauthUserId)}
            onClaim={claimLocalDailyReward}
            onSignIn={() => void signInWithGoogle()}
          />
        )}

        {view === 'leaderboard' && (
          <Leaderboard snapshot={playerSnapshot} isSignedIn={Boolean(oauthUserId)} />
        )}

        {view === 'login' && (
          <section className="menu-panel" aria-label="Login">
            <p className="eyebrow">{t('login')}</p>
            <h2>Continue your quest.</h2>
            <GoogleAuthButton mode="login" onSignIn={() => void signInWithGoogle()} />
            <p className="auth-divider">or use a local player profile</p>
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Player name
                <input value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="username" required />
              </label>
              <label>
                Password
                <input
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button type="submit">
                <ButtonLabel icon={LogIn}>Login</ButtonLabel>
              </button>
            </form>
            {authMessage && <p className="feedback">{authMessage}</p>}
          </section>
        )}

        {view === 'register' && (
          <section className="menu-panel" aria-label="Register">
            <p className="eyebrow">{t('register')}</p>
            <h2>{t('createPlayer')}</h2>
            <GoogleAuthButton mode="register" onSignIn={() => void signInWithGoogle()} />
            <p className="auth-divider">{t('createLocalProfile')}</p>
            <form className="auth-form" onSubmit={handleRegister}>
              <label>
                Player name
                <input value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="username" required />
              </label>
              <label>
                Password
                <input
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  minLength={4}
                  required
                />
              </label>
              <button type="submit">
                <ButtonLabel icon={UserPlus}>{t('createAccount')}</ButtonLabel>
              </button>
            </form>
            {authMessage && <p className="feedback">{authMessage}</p>}
          </section>
        )}

        {view === 'settings' && (
          <section className="menu-panel" aria-label="Settings">
            <p className="eyebrow">{t('settings')}</p>
            <h2>{t('playerOptions')}</h2>

            <label className="toggle-row">
              <span>
                <strong><StatLabel icon={Globe2}>{t('interfaceLanguage')}</StatLabel></strong>
                <small>{t('interfaceLanguageHint')}</small>
              </span>
              <InterfaceLanguageSelect language={interfaceLanguage} onChange={setInterfaceLanguage} />
            </label>

            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>{t('account')}</p>
              {playerName ? (
                <>
                  <div className="profile-settings">
                    <ProfileAvatar name={playerName} imageUrl={profileImageUrl} />
                    <div>
                      <p style={{ margin: '0 0 0.75rem' }}>{t('signedInAs')} {playerName}.</p>
                      <label>
                        {t('profilePictureUrl')}
                        <input
                          value={profileImageUrl}
                          onChange={(event) => setProfileImageUrl(event.target.value.trim())}
                          placeholder="https://example.com/avatar.png"
                          type="url"
                        />
                      </label>
                      <div className="location-fields">
                        <label>
                          {t('country')}
                          <select value={country} onChange={(event) => setCountry(event.target.value)}>
                            <option value="">{t('chooseCountry')}</option>
                            {countryOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          {t('city')}
                          <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Your city" />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="start-actions" style={{ justifyContent: 'flex-start' }}>
                    <button type="button" onClick={saveGame}>
                      <ButtonLabel icon={Save}>{t('saveGame')}</ButtonLabel>
                    </button>
                    <button type="button" onClick={logout}>
                      <ButtonLabel icon={LogOut}>{t('logout')}</ButtonLabel>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 0.75rem' }}>{t('guestLine')}</p>
                  <div className="location-fields">
                    <label>
                      {t('country')}
                      <select value={country} onChange={(event) => setCountry(event.target.value)}>
                        <option value="">{t('chooseCountry')}</option>
                        {countryOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t('city')}
                      <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Your city" />
                    </label>
                  </div>
                  <GoogleAuthButton mode="continue" onSignIn={() => void signInWithGoogle()} />
                  <div className="start-actions" style={{ justifyContent: 'flex-start' }}>
                    <button type="button" onClick={() => setAuthMode('login')}>
                      <ButtonLabel icon={LogIn}>{t('login')}</ButtonLabel>
                    </button>
                    <button type="button" onClick={() => setAuthMode('register')}>
                      <ButtonLabel icon={UserPlus}>{t('register')}</ButtonLabel>
                    </button>
                    <button type="button" onClick={saveGame}>
                      <ButtonLabel icon={Save}>{t('saveGame')}</ButtonLabel>
                    </button>
                  </div>
                </>
              )}

              {authMode === 'login' && (
                <form className="auth-form" onSubmit={handleLogin} style={{ marginTop: '1rem' }}>
                  <label>
                    Player name
                    <input value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="username" required />
                  </label>
                  <label>
                    Password
                    <input
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <div className="start-actions" style={{ justifyContent: 'flex-start' }}>
                    <button type="submit">
                      <ButtonLabel icon={LogIn}>Login</ButtonLabel>
                    </button>
                    <button type="button" className="ghost" onClick={() => setAuthMode(null)}>
                      <ButtonLabel icon={X}>Cancel</ButtonLabel>
                    </button>
                  </div>
                </form>
              )}

              {authMode === 'register' && (
                <form className="auth-form" onSubmit={handleRegister} style={{ marginTop: '1rem' }}>
                  <label>
                    Player name
                    <input value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="username" required />
                  </label>
                  <label>
                    Password
                    <input
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      type="password"
                      autoComplete="new-password"
                      minLength={4}
                      required
                    />
                  </label>
                  <div className="start-actions" style={{ justifyContent: 'flex-start' }}>
                    <button type="submit">
                      <ButtonLabel icon={UserPlus}>Create account</ButtonLabel>
                    </button>
                    <button type="button" className="ghost" onClick={() => setAuthMode(null)}>
                      <ButtonLabel icon={X}>Cancel</ButtonLabel>
                    </button>
                  </div>
                </form>
              )}

              {authMessage && <p className="feedback">{authMessage}</p>}
            </div>

            <DesignEditor />

            <label className="toggle-row">
              <span>
                <strong><StatLabel icon={Volume2}>{t('sound')}</StatLabel></strong>
                <small>{t('soundHint')}</small>
              </span>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(event) => setSettings((value) => ({ ...value, sound: event.target.checked }))}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong><StatLabel icon={Music}>{t('music')}</StatLabel></strong>
                <small>{t('musicHint')}</small>
              </span>
              <input
                type="checkbox"
                checked={Boolean(settings.music)}
                onChange={(event) => setSettings((value) => ({ ...value, music: event.target.checked }))}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong><StatLabel icon={Lock}>{t('hardMode')}</StatLabel></strong>
                <small>{t('hardModeHint')}</small>
              </span>
              <input
                type="checkbox"
                checked={settings.hardMode}
                onChange={(event) => setSettings((value) => ({ ...value, hardMode: event.target.checked }))}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong><StatLabel icon={Timer}>{t('bossMode')}</StatLabel></strong>
                <small>{t('bossModeHint')}</small>
              </span>
              <input
                type="checkbox"
                checked={settings.bossMode}
                onChange={(event) => setSettings((value) => ({ ...value, bossMode: event.target.checked }))}
              />
            </label>
            <button className="danger-button" type="button" onClick={clearSavedProgress}>
              <ButtonLabel icon={RotateCcw}>{t('resetSavedProgress')}</ButtonLabel>
            </button>
          </section>
        )}

        {view === 'quest' && (
          <>
        <section className="instructions" aria-label="How to play">
          <div>
            <p className="eyebrow">{t('quickStart')}</p>
            <h2>{t('howToPlay')}</h2>
          </div>
          <ul>
            <li><StatLabel icon={Globe2}>Choose a language or keep All for mixed practice.</StatLabel></li>
            <li><StatLabel icon={Check}>Pick the correct answer, then press Continue.</StatLabel></li>
            <li><StatLabel icon={GraduationCap}>Use Lessons for focused 10-question practice.</StatLabel></li>
            <li><StatLabel icon={Gift}>Complete quests to earn chests, XP, and diamonds.</StatLabel></li>
          </ul>
        </section>
        <div className="stats" aria-label="Quest stats">
          <div>
            <StatLabel icon={Trophy}>Score</StatLabel>
            <strong>{score}</strong>
          </div>
          <div>
            <StatLabel icon={Heart}>Hearts</StatLabel>
            <strong>{heartText}</strong>
            <small>{refillText}</small>
          </div>
          <div>
            <StatLabel icon={Flame}>Streak</StatLabel>
            <strong>{streak}</strong>
            <small>Freezes: {streakFreezes}</small>
          </div>
          <div>
            <StatLabel icon={Sparkles}>XP</StatLabel>
            <strong>{xp}</strong>
          </div>
          <div>
            <StatLabel icon={Gem}>Diamonds</StatLabel>
            <strong>{diamonds}</strong>
          </div>
          <div>
            <StatLabel icon={Timer}>Time</StatLabel>
            <strong>{bossModeEnabled ? formatTimer(timeLeft) : '∞'}</strong>
          </div>
        </div>

        <section className="streak-calendar" aria-label="Streak calendar">
          <div className="streak-calendar-header">
            <StatLabel icon={CalendarDays}>Streak calendar</StatLabel>
            <span>{shieldActive ? `Shield until ${streakShieldUntil}` : `${streakFreezes}/${maxStreakFreezes} freezes`}</span>
          </div>
          <div className="streak-days">
            {streakCalendarDays.map((day) => (
              <div
                className={[
                  'streak-day',
                  day.complete ? 'streak-day--complete' : '',
                  day.today ? 'streak-day--today' : '',
                ].join(' ')}
                key={day.dateKey}
              >
                <span>{day.day}</span>
                <strong>{day.number}</strong>
              </div>
            ))}
          </div>
        </section>

        {isLessonRun ? (
          <section className="lesson-run-header" aria-label="Current lesson">
            <div>
              <p className="eyebrow">Lesson mode</p>
              <h2>{selectedLesson?.title ?? 'Lesson'}</h2>
            </div>
            <button className="secondary" type="button" onClick={closeLesson}>
              <ButtonLabel icon={X}>Close lesson</ButtonLabel>
            </button>
          </section>
        ) : (
          <div className="language-filter-summary" aria-label="Language filter">
            <span>
              <FlagLabel language={selectedLanguage} />
              <small>Practice language</small>
            </span>
            <button className="secondary" type="button" onClick={() => setView('languages')}>
              <ButtonLabel icon={Globe2}>Change</ButtonLabel>
            </button>
          </div>
        )}

        <div className="progress" aria-label={`Progress ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        {isComplete ? (
          <div className="victory">
            <p className="eyebrow">{isLessonRun ? 'Lesson complete' : 'Quest complete'}</p>
            <h2>{isLessonRun ? 'You finished the lesson.' : 'You cleared the trail.'}</h2>
            <p>
              Your final score is {score}.{' '}
              {isLessonRun ? 'Close the lesson to return to lesson packs.' : 'Restart for a cleaner run or open Lessons for focused practice.'}
            </p>
            <div className="chest-reward">
              <strong>{chestOpened ? 'Chest opened' : 'Reward chest'}</strong>
              <span>{chestOpened ? 'A rarity chest was added to your inventory.' : 'Open it to collect a rarity chest.'}</span>
              <button type="button" onClick={openChest} disabled={chestOpened}>
                <ButtonLabel icon={chestOpened ? Check : Gift}>{chestOpened ? 'Claimed' : 'Open chest'}</ButtonLabel>
              </button>
            </div>
            <button type="button" onClick={restartQuest}>
              <ButtonLabel icon={RotateCcw}>{isLessonRun ? 'Repeat lesson' : 'Play again'}</ButtonLabel>
            </button>
            {isLessonRun && (
              <button className="secondary" type="button" onClick={closeLesson}>
                <ButtonLabel icon={X}>Close lesson</ButtonLabel>
              </button>
            )}
          </div>
        ) : (
          <div className="challenge">
            <p className="world">{currentQuest.world}</p>
            <p className="quest-count">{currentQuest.language} quest {questIndex + 1} of {activeQuests.length}</p>
            <h2>{currentQuest.prompt}</h2>
            {aiQuestionMessage && <p className="feedback">{aiQuestionMessage}</p>}

            <div className="answers">
              {currentOptions.map((option) => {
                const isRight = option === currentQuest.answer;
                const isPicked = option === selected;
                const className = [
                  'answer',
                  selected && isRight ? 'answer--right' : '',
                  isPicked && !isRight ? 'answer--wrong' : '',
                ].join(' ');

                return (
                  <button className={className} type="button" key={option} onClick={() => chooseOption(option)}>
                    {option}
                  </button>
                );
              })}
            </div>

            <QuestionAiHelp
              key={`${currentQuest.language}-${currentQuest.world}-${currentQuest.prompt}`}
              question={{
                prompt: currentQuest.prompt,
                options: currentOptions,
                hint: currentQuest.hint,
                language: currentQuest.language,
              }}
              onQuestionGenerated={useAiQuestion}
            />

            <div className="quest-actions">
              {!hardModeEnabled ? (
                <button className="secondary" type="button" onClick={() => void showAiHint()} disabled={isAiHintLoading}>
                  <ButtonLabel icon={Sparkles}>{isAiHintLoading ? 'AI hint...' : 'AI Hint'}</ButtonLabel>
                </button>
              ) : (
                <span className="feedback" style={{ marginRight: '0.75rem' }}>Hints are off in hard mode.</span>
              )}
              <button type="button" onClick={nextQuest} disabled={!selected}>
                <ButtonLabel icon={ArrowRight}>Continue</ButtonLabel>
              </button>
            </div>

            {(showHint || feedback) && (
              <p className={selected === currentQuest.answer ? 'feedback feedback--good' : `feedback ${feedback ? '' : 'feedback--hint'}`}>
                {feedback || aiHint || currentQuest.hint}
              </p>
            )}
          </div>
        )}
          </>
        )}
        <p className="copyright-line">© 2026 Arlan Kim Vladimirovich</p>
      </section>
    </main>
  );
}
