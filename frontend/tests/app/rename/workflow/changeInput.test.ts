import { describe, it, expect } from 'vitest';
import { changeInput } from '../../../../src/app/rename/workflow/changeInput';
import { input, entry } from '../../../support/data';
describe('changeInput', () => {
  it('設定全体と出力先だけの更新を区別する', () => {
    const value = input();
    const settings = { pattern: '{番号}', start: '4', outputDir: 'D:/out' };
    expect(changeInput(value, { type: 'settings', settings }).settings).toEqual(settings);
    expect(changeInput(value, { type: 'output', outputDir: 'D:/out' }).settings).toEqual({
      ...value.settings,
      outputDir: 'D:/out',
    });
    expect(value.settings.outputDir).toBe('C:/out');
  });
  it('指定ファイルだけ除外する', () => {
    const value = { ...input(), entries: [entry(), entry('b')] };
    expect(changeInput(value, { type: 'remove', path: entry().path }).entries).toEqual([
      entry('b'),
    ]);
    expect(changeInput(value, { type: 'remove', path: 'missing' }).entries).toEqual(value.entries);
  });
  it('ソートと移動を適用する', () => {
    const value = { ...input(), entries: [entry('a'), entry('b')] };
    expect(
      changeInput(value, { type: 'sort', sort: { field: 'name', descending: true } }).entries,
    ).toEqual([entry('b'), entry('a')]);
    expect(
      changeInput(value, { type: 'reorder', source: 'C:/in/a', target: 'C:/in/b' }).sort.field,
    ).toBe('manual');
  });
});
