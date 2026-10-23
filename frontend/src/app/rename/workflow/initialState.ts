import { initialInput } from '../model/input';
import type { RenameState } from './types';

export function initialState(): RenameState {
  return {
    input: initialInput(),
    preview: { items: [], issue: '' },
    execution: { status: 'editing' },
    imports: 0,
    message: '',
    revision: 0,
  };
}
