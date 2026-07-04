import {
  getInterfaceMessage,
  interfaceLanguageLabels,
  type InterfaceLanguage,
} from '../lib/interfaceLanguage';

type InterfaceLanguageSelectProps = {
  language: InterfaceLanguage;
  onChange: (language: InterfaceLanguage) => void;
};

const interfaceLanguageOptions: InterfaceLanguage[] = ['en', 'ru', 'kk'];

export default function InterfaceLanguageSelect({
  language,
  onChange,
}: InterfaceLanguageSelectProps) {
  return (
    <label className="interface-language-select">
      <span>{getInterfaceMessage(language, 'interfaceLanguage')}</span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value as InterfaceLanguage)}
      >
        {interfaceLanguageOptions.map((option) => (
          <option key={option} value={option}>
            {interfaceLanguageLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
