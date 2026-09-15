import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { Action, RenameState } from '../../workflow/types';
import { previewInput } from './previewInput';

export function usePreview(state: RenameState, dispatch: Dispatch<Action>) {
  const { input, imports, revision } = state;
  const editing = state.execution.status === 'editing';

  useEffect(() => {
    if (!editing || imports > 0 || input.entries.length === 0) {
      return;
    }

    const controller = new AbortController();

    void previewInput(input).then((plan) => {
      if (!controller.signal.aborted) {
        dispatch({ type: 'preview', plan, revision });
      }
    });

    return () => controller.abort();
  }, [input, imports, revision, editing, dispatch]);
}
