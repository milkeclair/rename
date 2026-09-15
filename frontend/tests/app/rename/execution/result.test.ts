import { describe, it, expect } from 'vitest';
import { inputAfterExecution } from '../../../../src/app/rename/execution/result';
import { input, resultItem } from '../../../support/data';
const request = { paths: ['a'], pattern: '{番号}', start: 20, outputDir: 'out' };
describe('inputAfterExecution', () => {
  it.each(['done', 'unchanged'])('%sは要求の番号から次番号を決める', (status) => {
    const value = input();
    expect(inputAfterExecution(value, request, { items: [resultItem(status)], issue: '' })).toEqual(
      { ...value, settings: { ...value.settings, start: '21' } },
    );
    expect(value.settings.start).toBe('1');
  });
  it.each(['failed', 'partial', 'pending'])('%sは元の入力を返す', (status) => {
    const value = input();
    expect(inputAfterExecution(value, request, { items: [resultItem(status)], issue: '' })).toBe(
      value,
    );
  });
  it.each([
    { items: [], issue: '' },
    { items: [resultItem(), resultItem()], issue: '' },
    { items: [resultItem()], issue: 'cleanup' },
  ])('欠落・余剰・全体エラーでは更新しない', (result) => {
    const value = input();
    expect(inputAfterExecution(value, request, result)).toBe(value);
  });
});
