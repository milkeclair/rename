import styles from './RenameSettings.module.css';
import controls from '../controls.module.css';
import type { Settings } from '../model/types';

type Props = {
  settings: Settings;
  disabled: boolean;
  onChange: (settings: Settings) => void;
  onChooseOutput: () => Promise<void>;
};

export function RenameSettings({ settings, disabled, onChange, onChooseOutput }: Props) {
  return (
    <section className={styles.settings}>
      <div>
        <label htmlFor="pattern">連番形式</label>
        <input
          id="pattern"
          value={settings.pattern}
          disabled={disabled}
          spellCheck={false}
          onChange={(event) => onChange({ ...settings, pattern: event.target.value })}
        />
      </div>
      <div>
        <label htmlFor="start">開始番号</label>
        <input
          id="start"
          type="number"
          min="0"
          max="999999999999"
          step="1"
          value={settings.start}
          disabled={disabled}
          onChange={(event) => onChange({ ...settings, start: event.target.value })}
        />
      </div>
      <div>
        <label htmlFor="destination">出力先フォルダ</label>
        <div className={styles.destination}>
          <input
            id="destination"
            value={settings.outputDir}
            disabled={disabled}
            spellCheck={false}
            onChange={(event) => onChange({ ...settings, outputDir: event.target.value })}
            placeholder="パスを入力または選択"
            title={settings.outputDir}
          />
          <button
            className={controls.secondary}
            disabled={disabled}
            onClick={() => {
              void onChooseOutput();
            }}
          >
            選択
          </button>
        </div>
      </div>
    </section>
  );
}
