import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOutputDirectory } from '../../../../src/app/rename/settings/useOutputDirectory';
import { renameBackend } from '../../../../src/app/rename/backend/client';
import { interaction, deferred } from '../../../support/data';
vi.mock('../../../../src/app/rename/backend/client', () => ({
  renameBackend: { chooseOutput: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());
describe('useOutputDirectory', () => {
  it('選択した出力先と更新世代を通知する', async () => {
    vi.mocked(renameBackend.chooseOutput).mockResolvedValue('D:/out');
    const dispatch = vi.fn();
    const control = interaction();
    const hook = renderHook(() => useOutputDirectory(dispatch, control));
    await act(() => hook.result.current());
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'input',
      change: { type: 'output', outputDir: 'D:/out' },
      revision: 1,
    });
  });
  it.each(['cancel', 'locked', 'aborted'])('%s時は選択結果を反映しない', async (mode) => {
    const reply = deferred<string>();
    vi.mocked(renameBackend.chooseOutput).mockReturnValue(reply.promise);
    const dispatch = vi.fn();
    const control = interaction();
    const hook = renderHook(() => useOutputDirectory(dispatch, control));
    const pending = hook.result.current();
    if (mode === 'locked') control.locked.current = true;
    if (mode === 'aborted') control.lifetime.current.abort();
    await act(async () => {
      reply.resolve(mode === 'cancel' ? '' : 'out');
      await pending;
    });
    expect(dispatch).not.toHaveBeenCalled();
    expect(control.invalidate).not.toHaveBeenCalled();
  });
  it.each([new Error('failed'), 'failed'])('例外を通知する', async (error) => {
    vi.mocked(renameBackend.chooseOutput).mockRejectedValue(error);
    const dispatch = vi.fn();
    const hook = renderHook(() => useOutputDirectory(dispatch, interaction()));
    await act(() => hook.result.current());
    expect(dispatch).toHaveBeenCalledWith({ type: 'message', message: 'failed' });
  });
});
