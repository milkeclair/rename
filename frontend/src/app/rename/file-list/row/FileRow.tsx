import { useSortable } from '@dnd-kit/react/sortable';
import type { Item, ResultItem } from '../../model/types';
import { completed } from '../../execution/completed';
import type { Entry } from '../../model/types';
import styles from './FileRow.module.css';

const dateFormat = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const STATUS_LABELS: Record<string, string> = {
  done: '完了',
  unchanged: '変更なし',
  pending: '未処理',
  failed: '失敗',
  partial: '元ファイルが残っています',
};

export function ResultDetails({ result }: { result: ResultItem }) {
  const label = STATUS_LABELS[result.status] ?? result.status;

  return (
    <>
      <div className={styles.resultStatus} data-status={result.status}>
        {label}
      </div>
      {!completed(result.status) && (
        <div className={styles.resultPath} title={result.currentPath}>
          現在：{result.currentPath}
        </div>
      )}
      {result.status === 'partial' && (
        <div className={styles.resultPath}>出力先：{result.destination}</div>
      )}
    </>
  );
}

type RowProps = {
  entry: Entry;
  index: number;
  plan?: Item;
  result?: ResultItem;
  disabled: boolean;
  onRemove: (path: string) => void;
};

export function FileRow({ entry, index, plan, result, disabled, onRemove }: RowProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: entry.path,
    index,
    disabled,
  });
  const issue = result?.issue || plan?.issue;

  return (
    <tr ref={ref} className={styles.row} data-dragging={isDragging}>
      <td className={styles.handleCell}>
        <button
          className={styles.handle}
          disabled={disabled}
          aria-label={`${entry.name}を並べ替え`}
          ref={handleRef}
        >
          ⠿
        </button>
      </td>
      <td className={styles.number}>{String(index + 1).padStart(2, '0')}</td>
      <td>
        <div className={styles.filename} title={entry.name}>
          {entry.name}
        </div>
        <div className={styles.directory} title={entry.path}>
          {entry.directory}
        </div>
      </td>
      <td className={styles.created}>{dateFormat.format(entry.createdAt)}</td>
      <td>
        <div
          className={`${styles.filename} ${issue ? styles.invalid : styles.outputName}`}
          title={plan?.name}
        >
          {plan?.name || '—'}
        </div>
        {issue && <div className={styles.issue}>{issue}</div>}
        {result && <ResultDetails result={result} />}
      </td>
      <td>
        <button
          className={styles.remove}
          disabled={disabled}
          onClick={() => onRemove(entry.path)}
          aria-label={`${entry.name}を一覧から除外`}
        >
          ×
        </button>
      </td>
    </tr>
  );
}
