import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExecution } from '../../../../src/app/rename/execution/useExecution';
import { renameBackend, subscribeToProgress } from '../../../../src/app/rename/backend/client';
import { state, interaction, resultItem, deferred } from '../../../support/data';
import type { Result } from '../../../../src/app/rename/model/types';
vi.mock('../../../../src/app/rename/backend/client', () => ({
  renameBackend: { execute: vi.fn() },
  subscribeToProgress: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
describe('useExecution', () => {
  it('開始時にロックし、要求と成功結果を通知する', async () => {
    const result = { items: [resultItem()], issue: '' };
    vi.mocked(renameBackend.execute).mockResolvedValue(result);
    const dispatch = vi.fn();
    const control = interaction();
    const hook = renderHook(() => useExecution(state(), dispatch, control));
    await act(() => hook.result.current());
    const request = {
      paths: ['C:/in/a.txt'],
      pattern: '{番号:0000}',
      start: 1,
      outputDir: 'C:/out',
    };
    expect(renameBackend.execute).toHaveBeenCalledExactlyOnceWith(request);
    expect(dispatch.mock.calls).toEqual([
      [{ type: 'started', request }],
      [{ type: 'finished', request, result }],
    ]);
    expect(control.locked.current).toBe(true);
  });
  it('進捗を通知し購読を解除する', () => {
    const cleanup = vi.fn();
    vi.mocked(subscribeToProgress).mockReturnValue(cleanup);
    const dispatch = vi.fn();
    const hook = renderHook(() => useExecution(state(), dispatch, interaction()));
    const progress = { completed: 1, total: 2, name: 'a' };
    vi.mocked(subscribeToProgress).mock.calls[0]?.[0](progress);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'progress', progress });
    hook.unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
  it.each(['invalid', 'stale', 'locked'])('%sな要求を拒否する', async (mode) => {
    const value = state();
    const control = interaction();
    if (mode === 'invalid') value.preview = null;
    if (mode === 'stale') control.revision.current = 1;
    if (mode === 'locked') control.locked.current = true;
    const dispatch = vi.fn();
    const hook = renderHook(() => useExecution(value, dispatch, control));
    await act(() => hook.result.current());
    expect(renameBackend.execute).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('連打を拒否し終了後の応答を捨てる', async () => {
    const reply = deferred<Result>();
    vi.mocked(renameBackend.execute).mockReturnValue(reply.promise);
    const dispatch = vi.fn();
    const control = interaction();
    const hook = renderHook(() => useExecution(state(), dispatch, control));
    const first = hook.result.current();
    await hook.result.current();
    control.lifetime.current.abort();
    await act(async () => {
      reply.resolve({ items: [], issue: '' });
      await first;
    });
    expect(renameBackend.execute).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
  it.each([new Error('failed'), 'failed'])('失敗時にロック解除し再計画を促す', async (error) => {
    vi.mocked(renameBackend.execute).mockRejectedValue(error);
    const dispatch = vi.fn();
    const control = interaction();
    const hook = renderHook(() => useExecution(state(), dispatch, control));
    await act(() => hook.result.current());
    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'execution-failed',
      message: 'failed',
      revision: 1,
    });
    expect(control.locked.current).toBe(false);
  });
});
