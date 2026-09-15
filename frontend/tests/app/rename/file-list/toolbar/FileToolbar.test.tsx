import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FileToolbar } from '../../../../../src/app/rename/file-list/toolbar/FileToolbar';
afterEach(cleanup);
describe('FileToolbar', () => {
  it('項目変更・順序反転・クリアを通知する', () => {
    const sort = { field: 'name' as const, descending: false };
    const onSort = vi.fn();
    const onClear = vi.fn();
    render(
      <FileToolbar
        count={3}
        sort={sort}
        disabled={false}
        canClear
        onSort={onSort}
        onClear={onClear}
      />,
    );
    expect(screen.getByText('3')).toBeDefined();
    ['created', 'manual', 'name'].forEach((field) => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: field } });
      expect(onSort).toHaveBeenLastCalledWith({ field, descending: false });
    });
    fireEvent.click(screen.getByRole('button', { name: '↑ 昇順' }));
    expect(onSort).toHaveBeenLastCalledWith({ field: 'name', descending: true });
    fireEvent.click(screen.getByRole('button', { name: 'クリア' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
  it('手動順では反転できずクリア不可を反映する', () => {
    render(
      <FileToolbar
        count={0}
        sort={{ field: 'manual', descending: true }}
        disabled={false}
        canClear={false}
        onSort={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '↓ 降順' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'クリア' }).hasAttribute('disabled')).toBe(true);
  });
  it('ロック時はソートを無効にする', () => {
    render(
      <FileToolbar
        count={1}
        sort={{ field: 'name', descending: false }}
        disabled
        canClear={false}
        onSort={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox').hasAttribute('disabled')).toBe(true);
  });
});
