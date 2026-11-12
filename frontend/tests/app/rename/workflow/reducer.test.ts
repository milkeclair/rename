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
      action: { type: 'clear', reset: { start: true, outputDir: true }, revision: 2 },
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
  it.each([
    { start: true, outputDir: true },
    { start: true, outputDir: false },
    { start: false, outputDir: true },
    { start: false, outputDir: false },
  ])('番号と出力先を個別にリセットする: %j', (reset) => {
    const value = state();
    value.input.settings = { start: '24', pattern: 'photo-{番号:0000}', outputDir: 'D:/out' };
    value.execution = { status: 'result', result: { items: [resultItem()], issue: '' } };
    const next = reducer(value, { type: 'clear', reset, revision: 4 });
    expect(next.input.entries).toEqual([]);
    expect(next.input.settings).toEqual({
      start: reset.start ? '1' : '24',
      outputDir: reset.outputDir ? '' : 'D:/out',
      pattern: 'photo-{番号:0000}',
    });
    expect(next.execution).toEqual({ status: 'editing' });
    expect(next.message).toBe('');
  });

  it('一覧と出力先を空にし番号を1へ戻すが形式と並び順は保持する', () => {
    const value = state();
    value.input.settings = { start: '24', pattern: 'photo-{番号:0000}', outputDir: 'D:/out' };
    value.input.sort = { field: 'created', descending: true };

    const next = reducer(value, {
      type: 'clear',
      reset: { start: true, outputDir: true },
      revision: 4,
    });

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

describe('親フォルダからの取込', () => {
  it('設定を保持してフォルダ順に取り込み、空と取消で一覧を維持する', () => {
    const original = state();
    original.input.settings = { pattern: '{番号}', start: '24', outputDir: 'D:/out' };
    const loading = reducer(original, { type: 'import-started', revision: 1 });
    const imported = reducer(loading, {
      type: 'directories-imported',
      entries: [
        entry('1.jpg', 'C:/parent/2'),
        entry('2.jpg', 'C:/parent/1'),
        entry('1.jpg', 'C:/parent/1'),
      ],
      revision: 2,
    });
    expect(imported.imports).toBe(0);
    expect(imported.input.settings).toBe(original.input.settings);
    expect(imported.input.entries.map((item) => item.path)).toEqual([
      'C:/in/a.txt',
      'C:/parent/1/1.jpg',
      'C:/parent/1/2.jpg',
      'C:/parent/2/1.jpg',
    ]);
    expect(imported.input.sort.field).toBe('directory');
    const empty = reducer(reducer(imported, { type: 'import-started', revision: 3 }), {
      type: 'directories-imported',
      entries: [],
      revision: 4,
    });
    expect(empty.input).toBe(imported.input);
    expect(empty.message).toBe('子フォルダの直下に追加できるファイルがありません。');
    const cancelled = reducer(reducer(imported, { type: 'import-started', revision: 5 }), {
      type: 'import-cancelled',
      revision: 6,
    });
    expect(cancelled.imports).toBe(0);
    expect(cancelled.input).toBe(imported.input);
    expect(cancelled.message).toBe('');
  });
});
