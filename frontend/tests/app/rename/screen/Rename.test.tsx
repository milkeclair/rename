import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Rename } from '../../../../src/app/rename/screen/Rename';
import { useRename } from '../../../../src/app/rename/screen/useRename';
import { FileList } from '../../../../src/app/rename/file-list';
import { RenameSettings } from '../../../../src/app/rename/settings';
import { ExecutionFooter } from '../../../../src/app/rename/execution-footer';
import { state, resultItem } from '../../../support/data';
vi.mock('../../../../src/app/rename/screen/useRename', () => ({ useRename: vi.fn() }));
vi.mock('../../../../src/app/rename/file-list', () => ({
  FileList: vi.fn((_props: ComponentProps<typeof FileList>) => null),
}));
vi.mock('../../../../src/app/rename/settings', () => ({
  RenameSettings: vi.fn((_props: ComponentProps<typeof RenameSettings>) => null),
}));
vi.mock('../../../../src/app/rename/execution-footer', () => ({
  ExecutionFooter: vi.fn((_props: ComponentProps<typeof ExecutionFooter>) => null),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe('Rename', () => {
  it.each(['editing', 'running', 'result'])('%sに応じた子コンポーネントの状態を渡す', (mode) => {
    const value = state();
    if (mode === 'running')
      value.execution = { status: 'running', progress: { completed: 0, total: 1, name: '' } };
    if (mode === 'result')
      value.execution = { status: 'result', result: { items: [resultItem()], issue: '' } };
    const api = {
      state: value,
      canExecute: mode === 'editing',
      execute: vi.fn(async () => {}),
      chooseOutput: vi.fn(async () => {}),
      clear: vi.fn(),
      setSettings: vi.fn(),
      setSort: vi.fn(),
      reorder: vi.fn(),
      remove: vi.fn(),
    };
    vi.mocked(useRename).mockReturnValue(api);
    render(<Rename />);
    expect(vi.mocked(FileList).mock.calls[0]?.[0]).toMatchObject({
      entries: value.input.entries,
      locked: mode !== 'editing',
      canClear: mode !== 'running',
      onRemove: api.remove,
      onReorder: api.reorder,
    });
    expect(vi.mocked(RenameSettings).mock.calls[0]?.[0]).toMatchObject({
      settings: value.input.settings,
      disabled: mode !== 'editing',
      onChange: api.setSettings,
    });
    expect(vi.mocked(ExecutionFooter).mock.calls[0]?.[0]).toMatchObject({
      canExecute: mode === 'editing',
      onExecute: api.execute,
    });
  });
});

describe('Rename: clear availability', () => {
  it.each([0, 1])('空一覧でもクリアでき、読込中は無効にする: imports=%s', (imports) => {
    const value = state();
    value.input.entries = [];
    value.input.settings = { ...value.input.settings, start: '24', outputDir: 'D:/out' };
    value.imports = imports;
    vi.mocked(useRename).mockReturnValue({
      state: value,
      canExecute: false,
      execute: vi.fn(async () => {}),
      chooseOutput: vi.fn(async () => {}),
      clear: vi.fn(),
      setSettings: vi.fn(),
      setSort: vi.fn(),
      reorder: vi.fn(),
      remove: vi.fn(),
    });

    render(<Rename />);

    expect(vi.mocked(FileList).mock.calls[0]?.[0].canClear).toBe(imports === 0);
  });
});
