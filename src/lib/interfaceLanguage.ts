import { interfaceMessages } from './interfaceMessages';

export type InterfaceLanguage = 'en' | 'ru' | 'kk';

export type InterfaceMessageKey =
  | 'account'
  | 'bossMode'
  | 'bossModeHint'
  | 'chooseCountry'
  | 'city'
  | 'clickToContinue'
  | 'continueWithGoogle'
  | 'country'
  | 'createAccount'
  | 'createLocalProfile'
  | 'createPlayer'
  | 'guestLine'
  | 'hardMode'
  | 'hardModeHint'
  | 'howToPlay'
  | 'interfaceLanguage'
  | 'interfaceLanguageHint'
  | 'languageQuest'
  | 'languages'
  | 'leaderboard'
  | 'lessons'
  | 'login'
  | 'logout'
  | 'music'
  | 'musicHint'
  | 'play'
  | 'playerOptions'
  | 'profilePictureUrl'
  | 'quickStart'
  | 'register'
  | 'resetSavedProgress'
  | 'restartQuest'
  | 'rewards'
  | 'saveGame'
  | 'settings'
  | 'shop'
  | 'signedInAs'
  | 'sound'
  | 'soundHint'
  | 'start'
  | 'welcome'
  | 'wordTrail';

export const interfaceLanguageLabels: Record<InterfaceLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  kk: 'Kazakh',
};

export function getInterfaceMessage(language: InterfaceLanguage, key: InterfaceMessageKey) {
  return interfaceMessages[language][key];
}
