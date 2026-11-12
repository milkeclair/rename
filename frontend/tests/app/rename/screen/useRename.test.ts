import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRename } from '../../../../src/app/rename/screen/useRename';
import { useInteraction } from '../../../../src/app/rename/workflow/useInteraction';
import { useDirectoryImport } from '../../../../src/app/rename/file-list/useDirectoryImport';
import { useFileImport } from '../../../../src/app/rename/file-list/useFileImport';
import { useExecution } from '../../../../src/app/rename/execution/useExecution';
import { useOutputDirectory } from '../../../../src/app/rename/settings/useOutputDirectory';
import { interaction, entry } from '../../../support/data';
vi.mock('../../../../src/app/rename/workflow/useInteraction', () => ({ useInteraction: vi.fn() }));
vi.mock('../../../../src/app/rename/file-list/useDirectoryImport', () => ({
  useDirectoryImport: vi.fn(),
}));
vi.mock('../../../../src/app/rename/file-list/useFileImport', () => ({ useFileImport: vi.fn() }));
vi.mock('../../../../src/app/rename/file-list/preview/usePreview', () => ({ usePreview: vi.fn() }));
vi.mock('../../../../src/app/rename/execution/useExecution', () => ({ useExecution: vi.fn() }));
vi.mock('../../../../src/app/rename/settings/useOutputDirectory', () => ({
  useOutputDirectory: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
describe('useRename', () => {
  it('設定・並替・除外を編集状態へ反映する', () => {
    vi.mocked(useInteraction).mockReturnValue(interaction());
    const hook = renderHook(useRename);
    const dispatch = vi.mocked(useFileImport).mock.calls[0]?.[0];
    if (!dispatch) throw new Error('入力hookが接続されていません');
    act(() => {
      dispatch({ type: 'import-started', revision: 1 });
      dispatch({ type: 'imported', entries: [entry('a'), entry('b')], revision: 2 });
    });
    act(() =>
      hook.result.current.setSettings({ start: '8', pattern: '{番号}', outputDir: 'D:/out' }),
    );
    expect(hook.result.current.state.input.settings.start).toBe('8');
    act(() => hook.result.current.setSort({ field: 'name', descending: true }));
    expect(hook.result.current.state.input.entries[0].name).toBe('b');
    act(() => hook.result.current.reorder('C:/in/a', 'C:/in/b'));
    expect(hook.result.current.state.input.entries[0].name).toBe('a');
    act(() => hook.result.current.remove('C:/in/a'));
    expect(hook.result.current.state.input.entries.map((file) => file.name)).toEqual(['b']);
    act(() => hook.result.current.clear());
    expect(hook.result.current.state.input.entries).toEqual([]);
    expect(hook.result.current.state.input.settings).toEqual({
      start: '1',
      pattern: '{番号}',
      outputDir: '',
    });
  });
  it('保持する設定をクリアと次回のファイル追加に適用する', () => {
    vi.mocked(useInteraction).mockReturnValue(interaction());
    const hook = renderHook(useRename);
    const dispatch = vi.mocked(useFileImport).mock.calls[0]?.[0];
    if (!dispatch) throw new Error('入力hookがありません');
    act(() =>
      hook.result.current.setSettings({ start: '24', pattern: '{番号}', outputDir: 'D:/out' }),
    );
    act(() => hook.result.current.reset.update({ start: false, outputDir: false }));
    act(() => hook.result.current.clear());
    act(() => {
      dispatch({ type: 'import-started', revision: 2 });
      dispatch({ type: 'imported', entries: [entry('next')], revision: 3 });
    });
    expect(hook.result.current.state.input.settings).toEqual({
      start: '24',
      pattern: '{番号}',
      outputDir: 'D:/out',
    });
  });
  it('ロックと読込中は編集やクリアを拒否する', () => {
    const control = interaction();
    vi.mocked(useInteraction).mockReturnValue(control);
    const hook = renderHook(useRename);
    control.locked.current = true;
    const before = hook.result.current.state;
    act(() => {
      hook.result.current.remove('a');
      hook.result.current.clear();
    });
    expect(hook.result.current.state).toBe(before);
    control.locked.current = false;
    const dispatch = vi.mocked(useFileImport).mock.calls[0]?.[0];
    if (!dispatch) throw new Error('入力hookがありません');
    act(() => dispatch({ type: 'import-started', revision: 1 }));
    const importing = hook.result.current.state;
    act(() => hook.result.current.clear());
    expect(hook.result.current.state).toBe(importing);
  });
  it('実行と出力先選択は専用hookの操作を返す', () => {
    vi.mocked(useInteraction).mockReturnValue(interaction());
    const execute = vi.fn(async () => {});
    const choose = vi.fn(async () => {});
    vi.mocked(useExecution).mockReturnValue(execute);
    vi.mocked(useOutputDirectory).mockReturnValue(choose);
    const chooseParent = vi.fn(async () => {});
    vi.mocked(useDirectoryImport).mockReturnValue(chooseParent);
    const hook = renderHook(useRename);
    expect(hook.result.current.execute).toBe(execute);
    expect(hook.result.current.chooseOutput).toBe(choose);
    expect(hook.result.current.chooseParent).toBe(chooseParent);
  });
});
