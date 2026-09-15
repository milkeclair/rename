import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileImport } from '../../../../src/app/rename/file-list/useFileImport';
import { renameBackend, subscribeToFiles } from '../../../../src/app/rename/backend/client';
import { interaction, entry, deferred } from '../../../support/data';
import type { Entry } from '../../../../src/app/rename/model/types';
vi.mock('../../../../src/app/rename/backend/client', () => ({
  renameBackend: { inspect: vi.fn() },
  subscribeToFiles: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
function subscribe() {
  const callback = vi.mocked(subscribeToFiles).mock.calls[0]?.[0];
  if (!callback) throw new Error('D&D購読がありません');
  return callback;
}
describe('useFileImport', () => {
  it('入力パスを検査し開始と結果を通知する', async () => {
    const entries = [entry()];
    vi.mocked(renameBackend.inspect).mockResolvedValue(entries);
    const dispatch = vi.fn();
    const control = interaction();
    control.invalidate.mockReturnValueOnce(1).mockReturnValueOnce(2);
    renderHook(() => useFileImport(dispatch, control));
    await act(async () => subscribe()(['C:/in']));
    expect(renameBackend.inspect).toHaveBeenCalledExactlyOnceWith(['C:/in']);
    expect(dispatch.mock.calls).toEqual([
      [{ type: 'import-started', revision: 1 }],
      [{ type: 'imported', entries, revision: 2 }],
    ]);
  });
  it('ロック中は追加せず、unmount時に購読解除する', async () => {
    const cleanup = vi.fn();
    vi.mocked(subscribeToFiles).mockReturnValue(cleanup);
    const control = interaction();
    control.locked.current = true;
    const hook = renderHook(() => useFileImport(vi.fn(), control));
    await act(async () => subscribe()(['a']));
    expect(renameBackend.inspect).not.toHaveBeenCalled();
    hook.rerender();
    expect(subscribeToFiles).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
  it('寿命が終わった後の成功結果を通知しない', async () => {
    const reply = deferred<Entry[]>();
    vi.mocked(renameBackend.inspect).mockReturnValue(reply.promise);
    const control = interaction();
    const dispatch = vi.fn();
    renderHook(() => useFileImport(dispatch, control));
    await act(async () => subscribe()(['a']));
    control.lifetime.current.abort();
    await act(async () => reply.resolve([entry()]));
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
  it.each([new Error('failed'), 'failed'])('読込例外を通知する', async (error) => {
    vi.mocked(renameBackend.inspect).mockRejectedValue(error);
    const dispatch = vi.fn();
    renderHook(() => useFileImport(dispatch, interaction()));
    await act(async () => subscribe()(['a']));
    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'import-failed',
      message: 'failed',
      revision: 1,
    });
  });
});
