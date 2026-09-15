import { useEffect } from 'react';
import type { Dispatch } from 'react';
import { renameBackend, subscribeToProgress } from '../backend/client';
import type { Action, RenameState } from '../workflow/types';
import type { Interaction } from '../workflow/useInteraction';
import { canExecute } from './canExecute';
import { requestFor } from './request';

export function useExecution(
  state: RenameState,
  dispatch: Dispatch<Action>,
  interaction: Interaction,
) {
  useEffect(
    () => subscribeToProgress((progress) => dispatch({ type: 'progress', progress })),
    [dispatch],
  );

  return async () => {
    const current = state.revision === interaction.revision.current;

    if (!canExecute(state) || !current || interaction.locked.current) {
      return;
    }

    interaction.locked.current = true;
    const signal = interaction.lifetime.current?.signal;
    const request = requestFor(state.input);
    dispatch({ type: 'started', request });

    try {
      const result = await renameBackend.execute(request);

      if (!signal?.aborted) {
        dispatch({ type: 'finished', request, result });
      }
    } catch (error) {
      if (!signal?.aborted) {
        interaction.locked.current = false;
        dispatch({
          type: 'execution-failed',
          message: error instanceof Error ? error.message : String(error),
          revision: interaction.invalidate(),
        });
      }
    }
  };
}
