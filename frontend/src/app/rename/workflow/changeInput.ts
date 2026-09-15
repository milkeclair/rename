import { reorderInput, sortInput } from '../model/input';
import type { RenameInput } from '../model/input';
import type { InputChange } from './types';

export function changeInput(input: RenameInput, change: InputChange): RenameInput {
  switch (change.type) {
    case 'settings':
      return { ...input, settings: change.settings };
    case 'output':
      return { ...input, settings: { ...input.settings, outputDir: change.outputDir } };
    case 'sort':
      return sortInput(input, change.sort);
    case 'reorder':
      return reorderInput(input, change.source, change.target);
    case 'remove':
      return { ...input, entries: input.entries.filter((entry) => entry.path !== change.path) };
  }
}
