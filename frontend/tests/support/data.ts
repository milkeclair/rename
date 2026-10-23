import type { Entry, Item, ResultItem } from '../../src/app/rename/model/types';
import type { RenameState } from '../../src/app/rename/workflow/types';
import { vi } from 'vitest';

export const entry = (name = 'a.txt', directory = 'C:/in', createdAt = 1): Entry => ({
  path: `${directory}/${name}`,
  name,
  directory,
  createdAt,
});
export const item = (issue = ''): Item => ({
  source: 'C:/in/a.txt',
  destination: 'C:/out/0001.txt',
  name: '0001.txt',
  issue,
});
export const resultItem = (status = 'done'): ResultItem => ({
  ...item(),
  currentPath: 'C:/out/0001.txt',
  status,
});
export const input = () => ({
  entries: [entry()],
  sort: { field: 'name' as const, descending: false },
  settings: { pattern: '{番号:0000}', start: '1', outputDir: 'C:/out' },
});
export const state = (): RenameState => ({
  input: input(),
  preview: { items: [item()], issue: '' },
  execution: { status: 'editing' },
  imports: 0,
  revision: 0,
  message: '',
});
export const interaction = () => ({
  revision: { current: 0 },
  locked: { current: false },
  lifetime: { current: new AbortController() },
  invalidate: vi.fn(() => 1),
});
export function deferred<T>() {
  const callbacks: { resolve?: (value: T) => void; reject?: (reason: unknown) => void } = {};
  const promise = new Promise<T>((resolve, reject) => {
    callbacks.resolve = resolve;
    callbacks.reject = reject;
  });
  return {
    promise,
    resolve: (value: T) => callbacks.resolve?.(value),
    reject: (reason: unknown) => callbacks.reject?.(reason),
  };
}
