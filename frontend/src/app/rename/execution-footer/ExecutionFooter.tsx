import type { Progress } from '../model/types';
import type { Feedback } from './feedback';
import styles from './ExecutionFooter.module.css';

type Props = {
  feedback: Feedback;
  progress?: Progress;
  canExecute: boolean;
  onExecute: () => Promise<void>;
};

export function ExecutionFooter({ feedback, progress, canExecute, onExecute }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={styles.feedback} aria-live="polite">
        {progress ? (
          <>
            <progress value={progress.completed} max={progress.total || 1} />
            <span>
              {progress.completed} / {progress.total} 件
            </span>
          </>
        ) : (
          <span className={feedback.tone ? styles[feedback.tone] : undefined}>{feedback.text}</span>
        )}
      </div>
      <button
        className={styles.execute}
        disabled={!canExecute}
        onClick={() => {
          void onExecute();
        }}
      >
        {progress ? '実行中…' : 'リネーム実行'}
      </button>
    </footer>
  );
}
