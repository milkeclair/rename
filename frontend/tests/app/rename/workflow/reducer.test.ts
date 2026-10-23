import { describe, it, expect } from 'vitest';
import { reducer } from '../../../../src/app/rename/workflow/reducer';
import { state, entry, resultItem } from '../../../support/data';
import type { Action } from '../../../../src/app/rename/workflow/types';
const request = { paths: ['a'], pattern: '{番号}', start: 1, outputDir: 'out' };
describe('reducer', () => {
  const cases: { action: Action; expected: object }[] = [
    {
      action: { type: 'input', change: { type: 'output', outputDir: 'D:/out' }, revision: 2 },
      expected: { input: { settings: { outputDir: 'D:/out' } }, preview: null, revision: 2 },
    },
    {
      action: { type: 'import-started', revision: 2 },
      expected: { imports: 1, preview: null, message: '', revision: 2 },
    },
    {
      action: { type: 'imported', entries: [entry('b')], revision: 2 },
      expected: { imports: 0, preview: null, revision: 2, message: '' },
    },
    {
      action: { type: 'import-failed', message: 'failure', revision: 2 },
      expected: { imports: 0, message: 'failure', revision: 2 },
    },
    {
      action: { type: 'preview', plan: { items: [], issue: 'bad' }, revision: 0 },
      expected: { preview: { items: [], issue: 'bad' } },
    },
    {
      action: { type: 'started', request },
      expected: {
        execution: { status: 'running', progress: { completed: 0, total: 1, name: '' } },
      },
    },
    {
      action: { type: 'finished', request, result: { items: [resultItem()], issue: '' } },
      expected: { input: { settings: { start: '2' } }, execution: { status: 'result' } },
    },
    {
      action: { type: 'execution-failed', message: 'failure', revision: 2 },
      expected: {
        execution: { status: 'editing' },
        preview: null,
        message: 'failure',
        revision: 2,
      },
    },
    { action: { type: 'message', message: 'hello' }, expected: { message: 'hello' } },
    {
      action: { type: 'clear', revision: 2 },
      expected: {
        input: { entries: [] },
        preview: { items: [], issue: '' },
        execution: { status: 'editing' },
        message: '',
        revision: 2,
      },
    },
  ];
  it.each(cases)('$action.typeの変更を適用し元状態を保持する', ({ action, expected }) => {
    const value = {
      ...state(),
      imports: action.type === 'imported' || action.type === 'import-failed' ? 1 : 0,
    };
    const before = structuredClone(value);
    expect(reducer(value, action)).toMatchObject(expected);
    expect(value).toEqual(before);
  });
  it('実行中は入力とプレビューを拒否し進捗だけを更新する', () => {
    const value = reducer(state(), { type: 'started', request });
    expect(
      reducer(value, { type: 'input', change: { type: 'remove', path: 'a' }, revision: 1 }),
    ).toBe(value);
    expect(reducer(value, { type: 'preview', plan: { items: [], issue: '' }, revision: 0 })).toBe(
      value,
    );
    const progress = { completed: 1, total: 1, name: 'a' };
    expect(reducer(value, { type: 'progress', progress }).execution).toEqual({
      status: 'running',
      progress,
    });
    const editing = state();
    expect(reducer(editing, { type: 'progress', progress })).toBe(editing);
  });
  it('古いプレビューを拒否する', () => {
    const value = { ...state(), revision: 3 };
    expect(reducer(value, { type: 'preview', plan: { items: [], issue: '' }, revision: 2 })).toBe(
      value,
    );
  });
  it('空の読込結果を通知し、既存の入力を保つ', () => {
    const value = { ...state(), imports: 1 };
    const next = reducer(value, { type: 'imported', entries: [], revision: 2 });
    expect(next.imports).toBe(0);
    expect(next.input.entries).toEqual(value.input.entries);
    expect(next.message).toContain('追加できるファイルがありません');
  });
});

describe('reducer: clear', () => {
  it('一覧と出力先を空にし番号を1へ戻すが形式と並び順は保持する', () => {
    const value = state();
    value.input.settings = { start: '24', pattern: 'photo-{番号:0000}', outputDir: 'D:/out' };
    value.input.sort = { field: 'created', descending: true };

    const next = reducer(value, { type: 'clear', revision: 4 });

    expect(next.input).toEqual({
      entries: [],
      settings: { start: '1', pattern: 'photo-{番号:0000}', outputDir: '' },
      sort: { field: 'created', descending: true },
    });
    expect(next.execution).toEqual({ status: 'editing' });
    expect(next.preview).toEqual({ items: [], issue: '' });
    expect(value.input.settings.start).toBe('24');
  });
});
