import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResetSettings } from '../../../../src/app/rename/settings/useResetSettings';

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('useResetSettings', () => {
  it('初期値は両方リセットする', () => {
    const hook = renderHook(useResetSettings);
    expect(hook.result.current.settings).toEqual({ start: true, outputDir: true });
  });

  it('設定を変更して再マウントしても選択を保持する', () => {
    const hook = renderHook(useResetSettings);
    act(() => hook.result.current.update({ start: false, outputDir: true }));
    hook.unmount();
    const restored = renderHook(useResetSettings);
    expect(restored.result.current.settings).toEqual({ start: false, outputDir: true });
  });

  it.each(['broken', 'null', '[]', '{"start":false}', '{"start":"false","outputDir":true}'])(
    '無効な保存値を初期値へ戻す: %s',
    (saved) => {
      localStorage.setItem('rename.resetSettings', saved);
      expect(renderHook(useResetSettings).result.current.settings).toEqual({
        start: true,
        outputDir: true,
      });
    },
  );

  it('保存領域が利用できなくても操作を適用し保存失敗を表示する', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const hook = renderHook(useResetSettings);
    act(() => hook.result.current.update({ start: false, outputDir: false }));
    expect(hook.result.current.settings).toEqual({ start: false, outputDir: false });
    expect(hook.result.current.message).toContain('今回の起動中のみ');
    save.mockImplementation(() => {});
    act(() => hook.result.current.update({ start: true, outputDir: false }));
    expect(hook.result.current.message).toBe('');
  });
});
