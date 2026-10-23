import { DragDropProvider, KeyboardSensor, PointerSensor } from '@dnd-kit/react';
import type { DragEndEvent } from '@dnd-kit/react';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import { isSortable } from '@dnd-kit/react/sortable';
import type { Entry, Plan, Result, Sort } from '../model/types';

import { FileRow } from './row/FileRow';
import styles from './FileList.module.css';
import { FileToolbar } from './toolbar/FileToolbar';

const sensors = [
  PointerSensor.configure({
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 6 })],
  }),
  KeyboardSensor,
];

type Props = {
  entries: Entry[];
  plan: Plan;
  result?: Result;
  sort: Sort;
  locked: boolean;
  canClear: boolean;
  onSort: (sort: Sort) => void;
  onReorder: (source: string, target: string) => void;
  onRemove: (path: string) => void;
  onClear: () => void;
};

export function FileList(props: Props) {
  const { entries, plan, result, sort, locked, canClear, onSort, onReorder, onRemove, onClear } =
    props;
  function handleDragEnd({ operation, canceled }: DragEndEvent) {
    const { source } = operation;

    if (!locked && !canceled && isSortable(source)) {
      const target = entries[source.index];

      if (target && source.initialIndex !== source.index && typeof source.id === 'string') {
        onReorder(source.id, target.path);
      }
    }
  }

  return (
    <section className={styles.workspace} data-locked={locked}>
      <FileToolbar
        count={entries.length}
        sort={sort}
        disabled={locked}
        canClear={canClear}
        onSort={onSort}
        onClear={onClear}
      />
      <div className={styles.scroll}>
        <DragDropProvider sensors={sensors} onDragEnd={handleDragEnd}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th colSpan={2} className={styles.orderHeading}>
                  順序
                </th>
                <th>元のファイル名</th>
                <th className={styles.createdHeading}>作成日時</th>
                <th>変更後のファイル名</th>
                <th aria-label="除外" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <FileRow
                  key={entry.path}
                  entry={entry}
                  index={index}
                  plan={plan.items[index]}
                  result={result?.items[index]}
                  disabled={locked}
                  onRemove={onRemove}
                />
              ))}
            </tbody>
          </table>
        </DragDropProvider>
      </div>
    </section>
  );
}
