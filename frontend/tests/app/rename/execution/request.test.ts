import { describe, it, expect } from 'vitest';
import { requestFor } from '../../../../src/app/rename/execution/request';
import { input, entry } from '../../../support/data';
describe('requestFor', () => {
  it('順序と設定を要求へ変換し入力を変更しない', () => {
    const value = {
      ...input(),
      entries: [entry('b'), entry('a')],
      settings: { pattern: 'p{番号}', start: '0024', outputDir: 'D:/out' },
    };
    const before = structuredClone(value);
    expect(requestFor(value)).toEqual({
      paths: ['C:/in/b', 'C:/in/a'],
      pattern: 'p{番号}',
      start: 24,
      outputDir: 'D:/out',
    });
    expect(value).toEqual(before);
  });
  it('空の一覧を空のpathsへ変換する', () =>
    expect(requestFor({ ...input(), entries: [] }).paths).toEqual([]));
});
