import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FileRow, ResultDetails } from '../../../../../src/app/rename/file-list/row/FileRow';
import { entry, item, resultItem } from '../../../../support/data';
vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: vi.fn(() => ({
    ref: vi.fn(),
    handleRef: vi.fn(),
    isDragging: false,
  })),
}));
afterEach(cleanup);
describe('FileRow', () => {
  it('元名・番号・予定名を表示し除外パスを通知する', () => {
    const remove = vi.fn();
    render(
      <table>
        <tbody>
          <FileRow entry={entry()} index={2} plan={item()} disabled={false} onRemove={remove} />
        </tbody>
      </table>,
    );
    expect(screen.getByText('03')).toBeDefined();
    expect(screen.getByText('a.txt')).toBeDefined();
    expect(screen.getByText('0001.txt')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'a.txtを一覧から除外' }));
    expect(remove).toHaveBeenCalledExactlyOnceWith('C:/in/a.txt');
  });
  it('未計画ならダッシュを表示しロック中は操作できない', () => {
    const remove = vi.fn();
    render(
      <table>
        <tbody>
          <FileRow entry={entry()} index={0} disabled onRemove={remove} />
        </tbody>
      </table>,
    );
    expect(screen.getByText('—')).toBeDefined();
    screen
      .getAllByRole('button')
      .forEach((button) => expect(button.hasAttribute('disabled')).toBe(true));
    fireEvent.click(screen.getByRole('button', { name: 'a.txtを一覧から除外' }));
    expect(remove).not.toHaveBeenCalled();
  });
  it.each([
    ['done', '完了'],
    ['unchanged', '変更なし'],
    ['pending', '未処理'],
    ['failed', '失敗'],
    ['partial', '元ファイルが残っています'],
    ['unknown', 'unknown'],
  ])('結果%sを表示する', (status, label) => {
    render(
      <table>
        <tbody>
          <FileRow
            entry={entry()}
            index={0}
            plan={item('plan error')}
            result={{ ...resultItem(status), issue: 'result error' }}
            disabled
            onRemove={vi.fn()}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText(label)).toBeDefined();
    expect(screen.getByText('result error')).toBeDefined();
    expect(screen.queryByText('plan error')).toBeNull();
    expect(screen.queryByText(/^現在：/) !== null).toBe(!['done', 'unchanged'].includes(status));
    expect(screen.queryByText(/^出力先：/) !== null).toBe(status === 'partial');
  });
});

describe('ResultDetails', () => {
  it.each(['done', 'unchanged', 'pending', 'failed', 'partial', 'unknown'])(
    '結果%sの現在地と出力先を表示する',
    (status) => {
      render(<ResultDetails result={resultItem(status)} />);
      expect(screen.queryByText(/^現在：/) !== null).toBe(!['done', 'unchanged'].includes(status));
      expect(screen.queryByText(/^出力先：/) !== null).toBe(status === 'partial');
    },
  );
});
