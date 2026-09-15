import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExecutionFooter } from '../../../../src/app/rename/execution-footer/ExecutionFooter';
afterEach(cleanup);
describe('ExecutionFooter', () => {
  it('通知と実行ボタンを表示してクリックを伝える', () => {
    const execute = vi.fn(async () => {});
    const view = render(
      <ExecutionFooter
        feedback={{ text: '完了', tone: 'success' }}
        canExecute
        onExecute={execute}
      />,
    );
    expect(screen.getByText('完了')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'リネーム実行' }));
    expect(execute).toHaveBeenCalledTimes(1);
    view.rerender(
      <ExecutionFooter
        feedback={{ text: '失敗', tone: 'error' }}
        canExecute={false}
        onExecute={execute}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(execute).toHaveBeenCalledTimes(1);
    expect(screen.getByText('失敗')).toBeDefined();
  });
  it.each([0, 4])('進捗表示で件数を示しゼロ除算を避ける: %s', (total) => {
    render(
      <ExecutionFooter
        feedback={{ text: 'hidden' }}
        progress={{ completed: 0, total, name: '' }}
        canExecute={false}
        onExecute={vi.fn()}
      />,
    );
    expect(screen.getByRole('progressbar').getAttribute('max')).toBe(String(total || 1));
    expect(screen.getByRole('button').textContent).toBe('実行中…');
    expect(screen.queryByText('hidden')).toBeNull();
  });
});
