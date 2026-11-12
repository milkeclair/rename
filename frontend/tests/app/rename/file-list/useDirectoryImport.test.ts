import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDirectoryImport } from '../../../../src/app/rename/file-list/useDirectoryImport';
import { renameBackend } from '../../../../src/app/rename/backend/client';
import { interaction, entry, deferred } from '../../../support/data';
import type { Entry } from '../../../../src/app/rename/model/types';

vi.mock('../../../../src/app/rename/backend/client', () => ({
  renameBackend: { chooseParent: vi.fn(), inspectChildren: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());

describe('useDirectoryImport', () => {
  it('親フォルダを選択して子フォルダのファイルを読み込む', async () => {
    vi.mocked(renameBackend.chooseParent).mockResolvedValue('C:/parent');
    const entries = [entry('1.jpg', 'C:/parent/1')];
    vi.mocked(renameBackend.inspectChildren).mockResolvedValue(entries);
    const dispatch = vi.fn();
    const control = interaction();
    control.invalidate.mockReturnValueOnce(1).mockReturnValueOnce(2);
    const hook = renderHook(() => useDirectoryImport(dispatch, control));
    await act(async () => hook.result.current());
    expect(renameBackend.inspectChildren).toHaveBeenCalledExactlyOnceWith('C:/parent');
    expect(dispatch.mock.calls).toEqual([
      [{ type: 'import-started', revision: 1 }],
      [{ type: 'directories-imported', entries, revision: 2 }],
    ]);
  });

  it('取消では走査せず読込状態を終了する', async () => {
    vi.mocked(renameBackend.chooseParent).mockResolvedValue('');
    const dispatch = vi.fn();
    const hook = renderHook(() => useDirectoryImport(dispatch, interaction()));
    await act(async () => hook.result.current());
    expect(renameBackend.inspectChildren).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'import-cancelled', revision: 1 });
  });

  it('選択中の再呼出しを抑止し、完了後は再選択できる', async () => {
    const selection = deferred<string>();
    vi.mocked(renameBackend.chooseParent).mockReturnValue(selection.promise);
    const hook = renderHook(() => useDirectoryImport(vi.fn(), interaction()));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = hook.result.current();
    });
    await act(async () => hook.result.current());
    expect(renameBackend.chooseParent).toHaveBeenCalledTimes(1);
    await act(async () => {
      selection.resolve('');
      await pending;
    });
    await act(async () => hook.result.current());
    expect(renameBackend.chooseParent).toHaveBeenCalledTimes(2);
  });

  it('ロック中は選択しない', async () => {
    const control = interaction();
    control.locked.current = true;
    const dispatch = vi.fn();
    const hook = renderHook(() => useDirectoryImport(dispatch, control));
    await act(async () => hook.result.current());
    expect(renameBackend.chooseParent).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(['choose', 'inspect'])('失敗を通知して再選択できる: %s', async (stage) => {
    vi.mocked(renameBackend.chooseParent).mockResolvedValue('C:/parent');
    if (stage === 'choose') vi.mocked(renameBackend.chooseParent).mockRejectedValueOnce('failed');
    else vi.mocked(renameBackend.inspectChildren).mockRejectedValueOnce(new Error('failed'));
    const dispatch = vi.fn();
    const hook = renderHook(() => useDirectoryImport(dispatch, interaction()));
    await act(async () => hook.result.current());
    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'import-failed',
      message: 'failed',
      revision: 1,
    });
    vi.mocked(renameBackend.chooseParent).mockResolvedValue('');
    await act(async () => hook.result.current());
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'import-cancelled', revision: 1 });
  });

  it('選択中に寿命が終わると走査しない', async () => {
    const selection = deferred<string>();
    vi.mocked(renameBackend.chooseParent).mockReturnValue(selection.promise);
    const control = interaction();
    const dispatch = vi.fn();
    const hook = renderHook(() => useDirectoryImport(dispatch, control));
    let pending: Promise<void> | undefined;
    act(() => {
      pending = hook.result.current();
    });
    control.lifetime.current.abort();
    await act(async () => {
      selection.resolve('C:/parent');
      await pending;
    });
    expect(renameBackend.inspectChildren).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('走査中に寿命が終わると結果を通知しない: failed=%s', async (failed) => {
    const response = deferred<Entry[]>();
    vi.mocked(renameBackend.chooseParent).mockResolvedValue('C:/parent');
    vi.mocked(renameBackend.inspectChildren).mockReturnValue(response.promise);
    const control = interaction();
    const dispatch = vi.fn();
    const hook = renderHook(() => useDirectoryImport(dispatch, control));
    let pending: Promise<void> | undefined;
    await act(async () => {
      pending = hook.result.current();
    });
    control.lifetime.current.abort();
    await act(async () => {
      if (failed) response.reject(new Error('failed'));
      else response.resolve([entry()]);
      await pending;
    });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
