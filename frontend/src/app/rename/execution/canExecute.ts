import type { RenameState } from '../workflow/types';

export function canExecute(state: RenameState): boolean {
  const { input, preview, execution, imports } = state;

  if (execution.status !== 'editing' || !preview) {
    return false;
  }

  const inputReady = imports === 0 && input.entries.length > 0;
  const planComplete = preview.items.length === input.entries.length;
  const planValid = preview.issue === '' && preview.items.every((item) => item.issue === '');

  return inputReady && planComplete && planValid;
}
