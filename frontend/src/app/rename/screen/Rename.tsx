import { executionFeedback } from '../execution-footer/executionFeedback';
import { FileList } from '../file-list';
import { RenameSettings } from '../settings';
import { ExecutionFooter } from '../execution-footer';
import { useRename } from './useRename';
import styles from './Rename.module.css';

export function Rename() {
  const rename = useRename();
  const { state } = rename;
  const locked = state.execution.status !== 'editing';
  const canClear = state.execution.status !== 'running' && state.imports === 0;

  return (
    <main className={styles.main}>
      <FileList
        entries={state.input.entries}
        plan={state.preview ?? { items: [], issue: '' }}
        result={state.execution.status === 'result' ? state.execution.result : undefined}
        sort={state.input.sort}
        locked={locked}
        canClear={canClear}
        onSort={rename.setSort}
        onReorder={rename.reorder}
        onRemove={rename.remove}
        onClear={rename.clear}
      />
      <RenameSettings
        settings={state.input.settings}
        disabled={locked}
        onChange={rename.setSettings}
        onChooseOutput={rename.chooseOutput}
      />
      <ExecutionFooter
        feedback={executionFeedback(state)}
        progress={state.execution.status === 'running' ? state.execution.progress : undefined}
        canExecute={rename.canExecute}
        onExecute={rename.execute}
      />
    </main>
  );
}
