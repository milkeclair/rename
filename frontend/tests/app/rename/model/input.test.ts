import { describe, it, expect } from 'vitest';
import {
  initialInput,
  addEntries,
  sortInput,
  reorderInput,
  sorted,
  mergeEntries,
} from '../../../../src/app/rename/model/input';
import { entry, input } from '../../../support/data';
describe('initialInput', () => {
  it('4桁・開始1・名前昇順の独立した初期値を返す', () => {
    const value = initialInput();
    expect(value).toEqual({
      entries: [],
      sort: { field: 'name', descending: false },
      settings: { pattern: '{番号:0000}', start: '1', outputDir: '' },
    });
    value.settings.start = '8';
    expect(initialInput().settings.start).toBe('1');
  });
});
describe('addEntries', () => {
  it('同名別パスを保持し同一パスの大文字小文字違いを除外する', () => {
    const first = entry('a.txt');
    const original = initialInput();
    const added = addEntries(original, [first, entry('A.TXT'), entry('a.txt', 'D:/in')]);
    expect(added.entries).toEqual([first, entry('a.txt', 'D:/in')]);
    expect(added.settings.outputDir).toBe('C:/in');
    expect(original.entries).toEqual([]);
  });
  it('ソート前の先頭のフォルダを初期出力先にする', () => {
    const value = addEntries(initialInput(), [entry('10', 'D:/in'), entry('2')]);
    expect(value.entries.map((file) => file.name)).toEqual(['2', '10']);
    expect(value.settings.outputDir).toBe('D:/in');
  });
  it('既存出力先と手動順を保つ', () => {
    const value = { ...input(), sort: { field: 'manual' as const, descending: false } };
    expect(addEntries(value, [entry('0')]).entries.map((file) => file.name)).toEqual([
      'a.txt',
      '0',
    ]);
    expect(addEntries(value, []).settings).toBe(value.settings);
    expect(addEntries(initialInput(), []).settings.outputDir).toBe('');
  });
});
describe('sortInput', () => {
  it.each([false, true])('自然順と日時順を並べ替え、元配列を保持する: %s', (descending) => {
    const entries = [entry('10', 'C:/in', 1), entry('2', 'C:/in', 2)];
    const value = { ...input(), entries };
    expect(
      sortInput(value, { field: 'name', descending }).entries.map((file) => file.name),
    ).toEqual(descending ? ['10', '2'] : ['2', '10']);
    expect(
      sortInput(value, { field: 'created', descending }).entries.map((file) => file.name),
    ).toEqual(descending ? ['2', '10'] : ['10', '2']);
    expect(entries[0].name).toBe('10');
  });
  it('同日時ならパス順、手動なら現在順を維持する', () => {
    const value = { ...input(), entries: [entry('a', 'D:/in'), entry('a')] };
    expect(sortInput(value, { field: 'created', descending: false }).entries[0].directory).toBe(
      'C:/in',
    );
    expect(sortInput(value, { field: 'manual', descending: true }).entries).toBe(value.entries);
  });
});
describe('reorderInput', () => {
  it('前後に移動して手動順にする', () => {
    const value = { ...input(), entries: [entry('a'), entry('b'), entry('c')] };
    const moved = reorderInput(value, 'C:/in/a', 'C:/in/c');
    expect(moved.entries.map((file) => file.name)).toEqual(['b', 'c', 'a']);
    expect(moved.sort.field).toBe('manual');
    expect(reorderInput(moved, 'C:/in/a', 'C:/in/b').entries).toEqual(value.entries);
    expect(value.entries[0].name).toBe('a');
  });
  it.each([
    ['missing', 'C:/in/a.txt'],
    ['C:/in/a.txt', 'missing'],
    ['C:/in/a.txt', 'C:/in/a.txt'],
  ])('移動できない指定は同じ入力を返す', (from, to) => {
    const value = input();
    expect(reorderInput(value, from, to)).toBe(value);
  });
});

describe('sorted', () => {
  it('同名の場合はパスで比較し、元配列を変更しない', () => {
    const entries = [entry('a', 'D:/in'), entry('a', 'C:/in')];
    expect(sorted(entries, { field: 'name', descending: false })).toEqual([entries[1], entries[0]]);
    expect(entries[0].directory).toBe('D:/in');
  });
  it('手動順は配列をそのまま返す', () => {
    const entries = [entry()];
    expect(sorted(entries, { field: 'manual', descending: false })).toBe(entries);
  });
});
describe('mergeEntries', () => {
  it('既存の属性を維持し同一パスの追加を除外する', () => {
    const current = [entry('a')];
    expect(mergeEntries(current, [entry('A', 'C:/in', 8), entry('a', 'D:/in')])).toEqual([
      current[0],
      entry('a', 'D:/in'),
    ]);
    expect(current).toEqual([entry('a')]);
  });
});
