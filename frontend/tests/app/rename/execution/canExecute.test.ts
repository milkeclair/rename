import { describe, it, expect } from 'vitest';
import { canExecute } from '../../../../src/app/rename/execution/canExecute';
import { state, item } from '../../../support/data';
import type { RenameState } from '../../../../src/app/rename/workflow/types';
describe('canExecute', () => {
  it('入力と有効な計画が揃えば実行できる', () => expect(canExecute(state())).toBe(true));
  const cases: Partial<RenameState>[] = [
    { preview: null },
    { imports: 1 },
    { input: { ...state().input, entries: [] } },
    { preview: { items: [], issue: '' } },
    { preview: { items: [item(), item()], issue: '' } },
    { preview: { items: [item()], issue: 'error' } },
    { preview: { items: [item('error')], issue: '' } },
    { execution: { status: 'running', progress: { completed: 0, total: 1, name: '' } } },
    { execution: { status: 'result', result: { items: [], issue: '' } } },
  ];
  it.each(cases)('実行条件が欠けた場合は拒否する: %j', (change) =>
    expect(canExecute({ ...state(), ...change })).toBe(false),
  );
});
