import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreview } from '../../../../../src/app/rename/file-list/preview/usePreview';
import { previewInput } from '../../../../../src/app/rename/file-list/preview/previewInput';
import { state, deferred } from '../../../../support/data';
import type { Plan } from '../../../../../src/app/rename/model/types';
vi.mock('../../../../../src/app/rename/file-list/preview/previewInput', () => ({
  previewInput: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
describe('usePreview', () => {
  it('計画と要求時の世代を通知し、同じ入力の再描画で再要求しない', async () => {
    const plan = { items: [], issue: 'reply' };
    vi.mocked(previewInput).mockResolvedValue(plan);
    const dispatch = vi.fn();
    const value = { ...state(), revision: 3 };
    const hook = renderHook(() => usePreview(value, dispatch));
    await act(async () => {});
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'preview', plan, revision: 3 });
    hook.rerender();
    expect(previewInput).toHaveBeenCalledTimes(1);
  });
  it('新入力へ切替後とunmount後の応答を捨てる', async () => {
    const old = deferred<Plan>();
    const current = deferred<Plan>();
    vi.mocked(previewInput).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const dispatch = vi.fn();
    const hook = renderHook((value) => usePreview(value, dispatch), { initialProps: state() });
    hook.rerender({ ...state(), revision: 1 });
    await act(async () => old.resolve({ items: [], issue: 'old' }));
    expect(dispatch).not.toHaveBeenCalled();
    hook.unmount();
    await act(async () => current.resolve({ items: [], issue: 'current' }));
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('空一覧・読込中・実行中・結果表示中には要求しない', () => {
    const dispatch = vi.fn();
    const empty = state();
    empty.input.entries = [];
    const running = state();
    running.execution = { status: 'running', progress: { completed: 0, total: 1, name: '' } };
    const finished = state();
    finished.execution = { status: 'result', result: { items: [], issue: '' } };
    [empty, { ...state(), imports: 1 }, running, finished].forEach((value) =>
      renderHook(() => usePreview(value, dispatch)).unmount(),
    );
    expect(previewInput).not.toHaveBeenCalled();
  });
});
