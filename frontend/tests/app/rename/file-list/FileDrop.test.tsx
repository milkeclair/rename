import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Window, objectNames, setTransport } from '@wailsio/runtime';
import { FileList } from '../../../../src/app/rename/file-list/FileList';

const originalPoint = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
const originalWails = Object.getOwnPropertyDescriptor(window, '_wails');

afterEach(() => {
  setTransport(null);
  if (originalPoint) Object.defineProperty(document, 'elementFromPoint', originalPoint);
  else Reflect.deleteProperty(document, 'elementFromPoint');
  if (originalWails) Object.defineProperty(window, '_wails', originalWails);
  else Reflect.deleteProperty(window, '_wails');
});

function drop(locked: boolean) {
  const call = vi.fn(async () => null);
  setTransport({ call });
  Object.defineProperty(window, '_wails', {
    configurable: true,
    value: { flags: { enableFileDrop: true } },
  });
  const props = {
    entries: [],
    plan: { items: [], issue: '' },
    sort: { field: 'name', descending: false },
    locked,
    canClear: !locked,
    canImport: !locked,
    onChooseParent: async () => {},
    onSort: vi.fn(),
    onReorder: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
  } satisfies ComponentProps<typeof FileList>;
  const view = render(<FileList {...props} />);
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: () => view.container.querySelector('th'),
  });
  Window.HandlePlatformFileDrop(['C:/in/a.jpg'], 20, 20);
  return call;
}

describe('Wails runtimeからのファイルドロップ', () => {
  it('編集時は一覧の子要素へのドロップをGoへ通知する', () => {
    const call = drop(false);
    expect(call).toHaveBeenCalledExactlyOnceWith(
      objectNames.Window,
      expect.any(Number),
      '',
      expect.objectContaining({ filenames: ['C:/in/a.jpg'], x: 20, y: 20 }),
    );
  });
  it('ファイルのドラッグ中に受付可能なカーソルとハイライトを示す', () => {
    drop(false);
    const target = document.querySelector('th');
    if (!target) throw new Error('ドロップ対象の一覧がありません');
    const transfer = { types: ['Files'], dropEffect: 'none' };
    fireEvent.dragEnter(target, { clientX: 20, clientY: 20, dataTransfer: transfer });
    expect(transfer.dropEffect).toBe('copy');
    expect(target.closest('section')?.classList.contains('file-drop-target-active')).toBe(true);
    fireEvent.dragLeave(target, { relatedTarget: document.body, dataTransfer: transfer });
    expect(target.closest('section')?.classList.contains('file-drop-target-active')).toBe(false);
  });
  it('実行・結果表示中は一覧へのドロップを通知しない', () => {
    expect(drop(true)).not.toHaveBeenCalled();
  });
});
