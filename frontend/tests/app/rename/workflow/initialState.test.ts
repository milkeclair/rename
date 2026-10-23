import { describe, it, expect } from 'vitest';
import { initialState } from '../../../../src/app/rename/workflow/initialState';
describe('initialState', () => {
  it('編集可能な空状態を毎回新規生成する', () => {
    const value = initialState();
    expect(value).toEqual({
      input: {
        entries: [],
        sort: { field: 'name', descending: false },
        settings: { start: '1', pattern: '{番号:0000}', outputDir: '' },
      },
      preview: { items: [], issue: '' },
      execution: { status: 'editing' },
      imports: 0,
      message: '',
      revision: 0,
    });
    value.input.settings.start = '9';
    expect(initialState().input.settings.start).toBe('1');
  });
});
