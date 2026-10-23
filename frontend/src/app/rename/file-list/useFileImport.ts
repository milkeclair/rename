import { useEffect, useEffectEvent } from 'react';
import type { Dispatch } from 'react';
import { renameBackend, subscribeToFiles } from '../backend/client';
import type { Action } from '../workflow/types';
import type { Interaction } from '../workflow/useInteraction';

export function useFileImport(dispatch: Dispatch<Action>, interaction: Interaction) {
  const onDrop = useEffectEvent(async (paths: string[]) => {
    if (interaction.locked.current) {
      return;
    }

    const signal = interaction.lifetime.current?.signal;
    dispatch({ type: 'import-started', revision: interaction.invalidate() });

    try {
      const entries = await renameBackend.inspect(paths);

      if (!signal?.aborted) {
        dispatch({ type: 'imported', entries, revision: interaction.invalidate() });
      }
    } catch (error) {
      if (!signal?.aborted) {
        dispatch({
          type: 'import-failed',
          message: error instanceof Error ? error.message : String(error),
          revision: interaction.invalidate(),
        });
      }
    }
  });

  useEffect(
    () =>
      subscribeToFiles((paths) => {
        void onDrop(paths);
      }),
    [],
  );
}
