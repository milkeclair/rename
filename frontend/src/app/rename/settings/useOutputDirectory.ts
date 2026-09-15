import type { Dispatch } from 'react';
import { renameBackend } from '../backend/client';
import type { Action } from '../workflow/types';
import type { Interaction } from '../workflow/useInteraction';

export function useOutputDirectory(dispatch: Dispatch<Action>, interaction: Interaction) {
  return async () => {
    const signal = interaction.lifetime.current?.signal;

    try {
      const outputDir = await renameBackend.chooseOutput();

      if (!signal?.aborted && outputDir && !interaction.locked.current) {
        dispatch({
          type: 'input',
          change: { type: 'output', outputDir },
          revision: interaction.invalidate(),
        });
      }
    } catch (error) {
      if (!signal?.aborted) {
        dispatch({
          type: 'message',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };
}
