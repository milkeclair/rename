import { DragDropManager } from '@dnd-kit/dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { Sortable } from '@dnd-kit/dom/sortable';
import type { DragEndEvent } from '@dnd-kit/react';
import { FileList } from '../../../../src/app/rename/file-list/FileList';
import { FileRow } from '../../../../src/app/rename/file-list/row/FileRow';
import { FileToolbar } from '../../../../src/app/rename/file-list/toolbar/FileToolbar';
import { entry, item, resultItem } from '../../../support/data';
vi.mock('@dnd-kit/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dnd-kit/react')>()),
  DragDropProvider: vi.fn(({ children }: ComponentProps<typeof DragDropProvider>) => (
    <>{children}</>
  )),
}));
vi.mock('../../../../src/app/rename/file-list/row/FileRow', () => ({
  FileRow: vi.fn((_props: ComponentProps<typeof FileRow>) => null),
}));
vi.mock('../../../../src/app/rename/file-list/toolbar/FileToolbar', () => ({
  FileToolbar: vi.fn((_props: ComponentProps<typeof FileToolbar>) => null),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function props() {
  return {
    entries: [entry()],
    plan: { items: [item()], issue: '' },
    result: { items: [resultItem()], issue: '' },
    sort: { field: 'name' as const, descending: false },
    locked: false,
    canClear: true,
    onSort: vi.fn(),
    onReorder: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
  };
}
describe('FileList', () => {
  it('行へ対応する計画と結果、ツールバーへ操作を渡す', () => {
    const value = props();
    render(<FileList {...value} />);
    expect(vi.mocked(FileRow).mock.calls[0]?.[0]).toEqual({
      entry: value.entries[0],
      index: 0,
      plan: value.plan.items[0],
      result: value.result.items[0],
      disabled: false,
      onRemove: value.onRemove,
    });
    expect(vi.mocked(FileToolbar).mock.calls[0]?.[0]).toMatchObject({
      count: 1,
      canClear: true,
      onClear: value.onClear,
      onSort: value.onSort,
    });
  });
  it.each([
    [false, false, 1, true],
    [true, false, 1, false],
    [false, true, 1, false],
    [false, false, 0, false],
    [false, false, 8, false],
  ])('完了位置を使い、ロック・取消・未移動なら並べ替えない', (locked, canceled, index, allowed) => {
    const first = entry();
    const second = { ...entry(), path: 'C:/in/b.txt', name: 'b.txt' };
    const value = { ...props(), entries: [first, second], locked };
    const manager = new DragDropManager({ plugins: [], sensors: [] });
    const sortable = new Sortable({ id: first.path, index: 0, plugins: [] }, undefined);
    vi.spyOn(sortable, 'initialIndex', 'get').mockReturnValue(0);
    sortable.index = index;

    const event: DragEndEvent = {
      canceled,
      operation: { ...manager.dragOperation.snapshot(), source: sortable.draggable },
      suspend: () => ({ resume: vi.fn(), abort: vi.fn() }),
    };

    render(<FileList {...value} />);
    vi.mocked(DragDropProvider).mock.calls[0]?.[0].onDragEnd?.(event, manager);

    expect(value.onReorder).toHaveBeenCalledTimes(allowed ? 1 : 0);
    if (allowed) {
      expect(value.onReorder).toHaveBeenCalledWith(first.path, second.path);
    }

    sortable.destroy();
    manager.destroy();
  });
  it('空一覧は行を作らない', () => {
    render(<FileList {...props()} entries={[]} />);
    expect(FileRow).not.toHaveBeenCalled();
  });
});
