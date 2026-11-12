import { useState } from 'react';

export type ResetSettings = { start: boolean; outputDir: boolean };

const storageKey = 'rename.resetSettings';

function loadSettings(): ResetSettings {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (
      typeof saved === 'object' &&
      saved !== null &&
      'start' in saved &&
      typeof saved.start === 'boolean' &&
      'outputDir' in saved &&
      typeof saved.outputDir === 'boolean'
    ) {
      return { start: saved.start, outputDir: saved.outputDir };
    }
  } catch {}
  return { start: true, outputDir: true };
}

export function useResetSettings() {
  const [settings, setSettings] = useState(loadSettings);
  const [message, setMessage] = useState('');

  function update(settings: ResetSettings) {
    setSettings(settings);
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      setMessage('');
    } catch {
      setMessage('設定を保存できませんでした。今回の起動中のみ適用されます。');
    }
  }

  return { settings, update, message };
}
