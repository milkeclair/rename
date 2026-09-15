import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInteraction } from '../../../../src/app/rename/workflow/useInteraction';
describe('useInteraction', () => {
  it('世代番号を進め、再描画間で参照とロックを維持する', () => {
    const hook = renderHook(useInteraction);
    const value = hook.result.current;
    expect(value.revision.current).toBe(0);
    expect(value.locked.current).toBe(false);
    act(() => {
      expect(value.invalidate()).toBe(1);
      expect(value.invalidate()).toBe(2);
      value.locked.current = true;
    });
    hook.rerender();
    expect(hook.result.current.revision).toBe(value.revision);
    expect(hook.result.current.locked.current).toBe(true);
    expect(hook.result.current.invalidate).toBe(value.invalidate);
  });
  it('unmount時にその画面のsignalを中止する', () => {
    const hook = renderHook(useInteraction);
    const controller = hook.result.current.lifetime.current;
    expect(controller?.signal.aborted).toBe(false);
    hook.unmount();
    expect(controller?.signal.aborted).toBe(true);
  });
});
