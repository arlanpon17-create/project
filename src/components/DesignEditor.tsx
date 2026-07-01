import { useEffect, useState } from 'react';
import { Paintbrush, RotateCcw } from 'lucide-react';

type DesignSettings = {
  bg: string;
  panel: string;
  ink: string;
  green: string;
  blue: string;
  gold: string;
};

const storageKey = 'language-quest-design';
const defaultDesign: DesignSettings = {
  bg: '#eef2ec',
  panel: '#fffdf8',
  ink: '#17211c',
  green: '#207c57',
  blue: '#315f9f',
  gold: '#d49a25',
};

const controls: Array<{ key: keyof DesignSettings; label: string }> = [
  { key: 'bg', label: 'Background' },
  { key: 'panel', label: 'Cards' },
  { key: 'ink', label: 'Text' },
  { key: 'green', label: 'Main' },
  { key: 'blue', label: 'Second' },
  { key: 'gold', label: 'Reward' },
];

function readDesign() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? { ...defaultDesign, ...JSON.parse(saved) } as DesignSettings : defaultDesign;
  } catch {
    return defaultDesign;
  }
}

function applyDesign(design: DesignSettings) {
  const root = document.documentElement;
  root.style.setProperty('--bg', design.bg);
  root.style.setProperty('--panel', design.panel);
  root.style.setProperty('--ink', design.ink);
  root.style.setProperty('--green', design.green);
  root.style.setProperty('--green-dark', design.green);
  root.style.setProperty('--blue', design.blue);
  root.style.setProperty('--gold', design.gold);
}

export default function DesignEditor() {
  const [design, setDesign] = useState<DesignSettings>(() => readDesign());

  useEffect(() => {
    applyDesign(design);
    localStorage.setItem(storageKey, JSON.stringify(design));
  }, [design]);

  function updateColor(key: keyof DesignSettings, value: string) {
    setDesign((current) => ({ ...current, [key]: value }));
  }

  function resetDesign() {
    setDesign(defaultDesign);
  }

  return (
    <section className="design-editor" aria-label="Design editor">
      <div className="design-editor-header">
        <strong><Paintbrush aria-hidden="true" size={18} /> Design editor</strong>
        <button className="secondary" type="button" onClick={resetDesign}>
          <span className="button-label"><RotateCcw aria-hidden="true" size={18} /><span>Reset</span></span>
        </button>
      </div>
      <div className="design-grid">
        {controls.map((control) => (
          <label key={control.key}>
            <span>{control.label}</span>
            <input type="color" value={design[control.key]} onChange={(event) => updateColor(control.key, event.target.value)} />
          </label>
        ))}
      </div>
    </section>
  );
}
