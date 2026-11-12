import { useRef } from 'react';
import type { Dispatch } from 'react';
import { renameBackend } from '../backend/client';
import type { Action } from '../workflow/types';
import type { Interaction } from '../workflow/useInteraction';

export function useDirectoryImport(dispatch: Dispatch<Action>, interaction: Interaction) {
  const choosing = useRef(false);

  return async () => {
    if (interaction.locked.current || choosing.current) {
      return;
    }

    choosing.current = true;
    const signal = interaction.lifetime.current?.signal;
    dispatch({ type: 'import-started', revision: interaction.invalidate() });

    try {
      const parent = await renameBackend.chooseParent();
      if (signal?.aborted) {
        return;
      }
      if (!parent) {
        dispatch({ type: 'import-cancelled', revision: interaction.invalidate() });
        return;
      }

      const entries = await renameBackend.inspectChildren(parent);
      if (!signal?.aborted) {
        dispatch({ type: 'directories-imported', entries, revision: interaction.invalidate() });
      }
    } catch (error) {
      if (!signal?.aborted) {
        dispatch({
          type: 'import-failed',
          message: error instanceof Error ? error.message : String(error),
          revision: interaction.invalidate(),
        });
      }
    } finally {
      choosing.current = false;
    }
  };
}
