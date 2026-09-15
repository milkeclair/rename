import type { Sort } from '../../model/types';
import styles from './FileToolbar.module.css';
import controls from '../../controls.module.css';

type Props = {
  count: number;
  sort: Sort;
  disabled: boolean;
  canClear: boolean;
  onSort: (sort: Sort) => void;
  onClear: () => void;
};

export function FileToolbar({ count, sort, disabled, canClear, onSort, onClear }: Props) {
  function handleSort(value: string) {
    switch (value) {
      case 'name':
      case 'created':
      case 'manual':
        onSort({ ...sort, field: value });
    }
  }

  return (
    <div className={styles.toolbar}>
      <span className={styles.count}>
        {count}
        <small>ファイル</small>
      </span>
      <div className={styles.sort}>
        <label htmlFor="sort">並び順</label>
        <select
          id="sort"
          value={sort.field}
          disabled={disabled}
          onChange={(event) => handleSort(event.target.value)}
        >
          <option value="name">ファイル名</option>
          <option value="created">作成日時</option>
          <option value="manual">手動順</option>
        </select>
        <button
          className={`${controls.secondary} ${styles.compact}`}
          disabled={disabled || sort.field === 'manual'}
          onClick={() => onSort({ ...sort, descending: !sort.descending })}
        >
          {sort.descending ? '↓ 降順' : '↑ 昇順'}
        </button>
      </div>
      <button className={styles.clear} disabled={!canClear} onClick={onClear}>
        クリア
      </button>
    </div>
  );
}
