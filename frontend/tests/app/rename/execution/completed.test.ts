import { describe, it, expect } from 'vitest';
import { completed } from '../../../../src/app/rename/execution/completed';
describe('completed', () => {
  it.each([
    ['done', true],
    ['unchanged', true],
    ['pending', false],
    ['failed', false],
    ['partial', false],
    ['', false],
    ['unknown', false],
  ])('%s', (status, expected) => {
    expect(completed(String(status))).toBe(expected);
  });
});
