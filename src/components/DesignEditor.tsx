import { useEffect, useState } from 'react';
import { MousePointer2, Paintbrush, RotateCcw } from 'lucide-react';

type DesignSettings = {
  bg: string;
  panel: string;
  ink: string;
  panelSoft: string;
  accent: string;
  reward: string;
  cursor: CursorStyle;
};

type CursorStyle = 'default' | 'pointer' | 'crosshair' | 'grab';
type ColorKey = Exclude<keyof DesignSettings, 'cursor'>;

const storageKey = 'language-quest-design';
const defaultDesign: DesignSettings = {
  bg: '#faf9f5',
  panel: '#faf9f5',
  ink: '#141413',
  panelSoft: '#f5f0e8',
  accent: '#cc785c',
  reward: '#d49a25',
  cursor: 'default',
};

const controls: Array<{ key: ColorKey; label: string }> = [
  { key: 'bg', label: 'Background' },
  { key: 'panel', label: 'Cards' },
  { key: 'ink', label: 'Text' },
  { key: 'panelSoft', label: 'Soft panels' },
  { key: 'accent', label: 'Main color' },
  { key: 'reward', label: 'Reward color' },
];

const palettes: Array<{ name: string; design: Omit<DesignSettings, 'cursor'> }> = [
  { name: 'Warm', design: { bg: '#faf9f5', panel: '#faf9f5', ink: '#141413', panelSoft: '#f5f0e8', accent: '#cc785c', reward: '#d49a25' } },
  { name: 'Forest', design: { bg: '#eef4ee', panel: '#fbfff8', ink: '#17211c', panelSoft: '#e4eddf', accent: '#2f7d5c', reward: '#c18b2c' } },
  { name: 'Ocean', design: { bg: '#eef6f8', panel: '#fbfeff', ink: '#132027', panelSoft: '#e0eef2', accent: '#2f6f8f', reward: '#caa33a' } },
  { name: 'Berry', design: { bg: '#fbf4f7', panel: '#fffafd', ink: '#24151c', panelSoft: '#f2e3eb', accent: '#b64f74', reward: '#b9822b' } },
];

const cursors: CursorStyle[] = ['default', 'pointer', 'crosshair', 'grab'];

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
  root.style.setProperty('--panel-strong', design.panelSoft);
  root.style.setProperty('--panel-soft', design.panelSoft);
  root.style.setProperty('--ink', design.ink);
  root.style.setProperty('--accent', design.accent);
  root.style.setProperty('--accent-hover', design.accent);
  root.style.setProperty('--accent-focus', `${design.accent}2e`);
  root.style.setProperty('--gold', design.reward);
  root.style.setProperty('--app-cursor', design.cursor);
  root.style.setProperty('--action-cursor', design.cursor === 'default' ? 'pointer' : design.cursor);
}

export default function DesignEditor() {
  const [design, setDesign] = useState<DesignSettings>(() => readDesign());

  useEffect(() => {
    applyDesign(design);
    localStorage.setItem(storageKey, JSON.stringify(design));
  }, [design]);

  function updateColor(key: ColorKey, value: string) {
    setDesign((current) => ({ ...current, [key]: value }));
  }

  function usePalette(palette: Omit<DesignSettings, 'cursor'>) {
    setDesign((current) => ({ ...current, ...palette }));
  }

  function updateCursor(cursor: CursorStyle) {
    setDesign((current) => ({ ...current, cursor }));
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
      <div className="palette-row" aria-label="Color palettes">
        {palettes.map((palette) => (
          <button className="palette-button" type="button" key={palette.name} onClick={() => usePalette(palette.design)}>
            <span>{palette.name}</span>
            <span className="palette-swatches" aria-hidden="true">
              <i style={{ background: palette.design.bg }} />
              <i style={{ background: palette.design.accent }} />
              <i style={{ background: palette.design.reward }} />
            </span>
          </button>
        ))}
      </div>
      <div className="design-grid">
        {controls.map((control) => (
          <label key={control.key}>
            <span>{control.label}</span>
            <input type="color" value={design[control.key]} onChange={(event) => updateColor(control.key, event.target.value)} />
          </label>
        ))}
        <label>
          <span><MousePointer2 aria-hidden="true" size={15} /> Cursor</span>
          <select value={design.cursor} onChange={(event) => updateCursor(event.target.value as CursorStyle)}>
            {cursors.map((cursor) => (
              <option key={cursor} value={cursor}>{cursor}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
