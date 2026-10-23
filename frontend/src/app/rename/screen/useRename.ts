import { useReducer } from 'react';
import { initialState } from '../workflow/initialState';
import { reducer } from '../workflow/reducer';
import { useInteraction } from '../workflow/useInteraction';
import type { InputChange } from '../workflow/types';
import type { Settings, Sort } from '../model/types';
import { useFileImport } from '../file-list/useFileImport';
import { usePreview } from '../file-list/preview/usePreview';
import { useOutputDirectory } from '../settings/useOutputDirectory';
import { useExecution } from '../execution/useExecution';
import { canExecute } from '../execution/canExecute';

export function useRename() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const interaction = useInteraction();
  const execute = useExecution(state, dispatch, interaction);
  const chooseOutput = useOutputDirectory(dispatch, interaction);

  useFileImport(dispatch, interaction);
  usePreview(state, dispatch);

  function edit(change: InputChange) {
    if (!interaction.locked.current) {
      dispatch({ type: 'input', change, revision: interaction.invalidate() });
    }
  }

  function clear() {
    const executing = interaction.locked.current && state.execution.status !== 'result';

    if (!executing && state.imports === 0) {
      interaction.locked.current = false;
      dispatch({ type: 'clear', revision: interaction.invalidate() });
    }
  }

  return {
    state,
    canExecute: canExecute(state),
    execute,
    chooseOutput,
    clear,
    setSettings: (settings: Settings) => edit({ type: 'settings', settings }),
    setSort: (sort: Sort) => edit({ type: 'sort', sort }),
    reorder: (source: string, target: string) => edit({ type: 'reorder', source, target }),
    remove: (path: string) => edit({ type: 'remove', path }),
  };
}
