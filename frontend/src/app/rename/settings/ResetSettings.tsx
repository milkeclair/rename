import { useRef } from 'react';
import type { ResetSettings as Settings } from './useResetSettings';
import controls from '../controls.module.css';
import styles from './ResetSettings.module.css';

type Props = {
  settings: Settings;
  onChange: (settings: Settings) => void;
  message: string;
  disabled: boolean;
};

export function ResetSettings({ settings, onChange, message, disabled }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <div className={styles.trigger}>
      <button
        className={controls.secondary}
        disabled={disabled}
        onClick={() => dialog.current?.showModal()}
      >
        設定
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="reset-settings-title">
        <h2 id="reset-settings-title">クリア時の設定</h2>
        <p>「クリア」でリセットする項目を選んでください。</p>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={settings.start}
            onChange={(event) => onChange({ ...settings, start: event.target.checked })}
          />
          <span>開始番号を1に戻す</span>
        </label>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={settings.outputDir}
            onChange={(event) => onChange({ ...settings, outputDir: event.target.checked })}
          />
          <span>出力先フォルダを空にする</span>
        </label>
        <p className={styles.hint}>
          チェックを外した項目は現在の値を保持します。一覧は常に空になります。
        </p>
        <p className={styles.hint}>設定は変更すると自動保存されます。</p>
        {message && <p role="status">{message}</p>}
        <div className={styles.actions}>
          <button className={controls.secondary} onClick={() => dialog.current?.close()}>
            閉じる
          </button>
        </div>
      </dialog>
    </div>
  );
}
