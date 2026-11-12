import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from '../../src/app/App';
import { renameBackend, subscribeToFiles } from '../../src/app/rename/backend/client';
import { entry } from '../support/data';
vi.mock('../../src/app/rename/backend/client', () => ({
  renameBackend: {
    inspect: vi.fn(),
    inspectChildren: vi.fn(),
    chooseParent: vi.fn(),
    preview: vi.fn(),
    execute: vi.fn(),
    chooseOutput: vi.fn(),
  },
  subscribeToFiles: vi.fn(() => vi.fn()),
  subscribeToProgress: vi.fn(() => vi.fn()),
}));
beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('入力から実行と次番号まで', () => {
  it.each(['選択', '直接入力'])(
    '%sした出力先・指定順・実行結果を保持して次番号へ進む',
    async (method) => {
      vi.mocked(renameBackend.chooseOutput).mockResolvedValue('D:/out');
      vi.mocked(renameBackend.inspect).mockResolvedValue([
        entry('b.txt', 'C:/in', 1),
        entry('a.txt', 'C:/in', 2),
      ]);
      vi.mocked(renameBackend.preview).mockImplementation(async (request) => ({
        items: request.paths.map((source, index) => ({
          source,
          destination: `${request.outputDir}/${String(request.start + index).padStart(4, '0')}.txt`,
          name: `${String(request.start + index).padStart(4, '0')}.txt`,
          issue: '',
        })),
        issue: '',
      }));
      vi.mocked(renameBackend.execute).mockImplementation(async (request) => ({
        items: request.paths.map((source, index) => ({
          source,
          destination: `${request.outputDir}/${index + 1}.txt`,
          currentPath: `${request.outputDir}/${index + 1}.txt`,
          status: 'done',
          issue: '',
        })),
        issue: '',
      }));
      render(<App />);
      if (method === '選択') {
        fireEvent.click(screen.getByRole('button', { name: '選択' }));
      } else {
        fireEvent.change(screen.getByLabelText('出力先フォルダ'), { target: { value: 'D:/out' } });
      }

      await waitFor(() =>
        expect(screen.getByLabelText('出力先フォルダ').getAttribute('value')).toBe('D:/out'),
      );
      const drop = vi.mocked(subscribeToFiles).mock.calls[0]?.[0];
      if (!drop) throw new Error('D&D購読がありません');
      await act(async () => drop(['C:/in']));
      await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));
      expect(screen.getAllByRole('row')[1].textContent).toContain('a.txt');
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'created' } });
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'リネーム実行' }).hasAttribute('disabled')).toBe(
          false,
        ),
      );
      fireEvent.click(screen.getByRole('button', { name: 'リネーム実行' }));
      await screen.findByText('2件のリネームが完了しました');
      expect(renameBackend.execute).toHaveBeenCalledWith({
        paths: ['C:/in/b.txt', 'C:/in/a.txt'],
        pattern: '{番号:0000}',
        start: 1,
        outputDir: 'D:/out',
      });
      expect(screen.getByLabelText('開始番号').getAttribute('value')).toBe('3');
      expect(screen.getByText('0001.txt')).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: 'クリア' }));
      expect(screen.getAllByRole('row')).toHaveLength(1);
      expect(screen.getByLabelText('出力先フォルダ').getAttribute('value')).toBe('');
      expect(screen.getByLabelText('開始番号').getAttribute('value')).toBe('1');
    },
  );
});

describe('設定モーダルからクリアまで', () => {
  it.each([
    { start: true, outputDir: true },
    { start: true, outputDir: false },
    { start: false, outputDir: true },
    { start: false, outputDir: false },
  ])('選択した項目だけリセットし再起動後も設定を保持する: %j', (reset) => {
    const app = render(<App />);
    fireEvent.change(screen.getByLabelText('開始番号'), { target: { value: '24' } });
    fireEvent.change(screen.getByLabelText('出力先フォルダ'), { target: { value: 'D:/out' } });
    const dialog = document.querySelector('dialog');
    if (!dialog) throw new Error('設定モーダルがありません');
    dialog.showModal = () => dialog.setAttribute('open', '');
    dialog.close = () => dialog.removeAttribute('open');
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    if (!reset.start) fireEvent.click(screen.getByLabelText('開始番号を1に戻す'));
    if (!reset.outputDir) fireEvent.click(screen.getByLabelText('出力先フォルダを空にする'));
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    fireEvent.click(screen.getByRole('button', { name: 'クリア' }));
    expect(screen.getByLabelText('開始番号').getAttribute('value')).toBe(reset.start ? '1' : '24');
    expect(screen.getByLabelText('出力先フォルダ').getAttribute('value')).toBe(
      reset.outputDir ? '' : 'D:/out',
    );
    expect(screen.getAllByRole('row')).toHaveLength(1);
    app.unmount();
    render(<App />);
    const start = screen.getByLabelText<HTMLInputElement>('開始番号を1に戻す');
    const outputDir = screen.getByLabelText<HTMLInputElement>('出力先フォルダを空にする');
    expect(start.checked).toBe(reset.start);
    expect(outputDir.checked).toBe(reset.outputDir);
  });
});

describe('親フォルダから通し番号へのリネーム', () => {
  it('子フォルダ順で取り込み、指定した出力先へ1〜4の連番を適用する', async () => {
    vi.mocked(renameBackend.chooseParent).mockResolvedValue('C:/parent');
    vi.mocked(renameBackend.inspectChildren).mockResolvedValue([
      entry('2.jpg', 'C:/parent/2'),
      entry('1.jpg', 'C:/parent/2'),
      entry('2.jpg', 'C:/parent/1'),
      entry('1.jpg', 'C:/parent/1'),
    ]);
    vi.mocked(renameBackend.preview).mockImplementation(async (request) => ({
      items: request.paths.map((source, index) => ({
        source,
        destination: `${request.outputDir}/${request.start + index}.jpg`,
        name: `${request.start + index}.jpg`,
        issue: '',
      })),
      issue: '',
    }));
    vi.mocked(renameBackend.execute).mockImplementation(async (request) => ({
      items: request.paths.map((source, index) => ({
        source,
        destination: `${request.outputDir}/${request.start + index}.jpg`,
        currentPath: `${request.outputDir}/${request.start + index}.jpg`,
        status: 'done',
        issue: '',
      })),
      issue: '',
    }));
    render(<App />);
    fireEvent.change(screen.getByLabelText('連番形式'), { target: { value: '{番号}' } });
    fireEvent.change(screen.getByLabelText('出力先フォルダ'), { target: { value: 'D:/chosen' } });
    fireEvent.click(screen.getByRole('button', { name: '親フォルダから追加' }));
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(5));
    expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe('directory');
    expect(screen.getByLabelText<HTMLInputElement>('出力先フォルダ').value).toBe('D:/chosen');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'リネーム実行' }).hasAttribute('disabled')).toBe(
        false,
      ),
    );
    const paths = [
      'C:/parent/1/1.jpg',
      'C:/parent/1/2.jpg',
      'C:/parent/2/1.jpg',
      'C:/parent/2/2.jpg',
    ];
    expect(renameBackend.preview).toHaveBeenLastCalledWith({
      paths,
      pattern: '{番号}',
      start: 1,
      outputDir: 'D:/chosen',
    });
    fireEvent.click(screen.getByRole('button', { name: 'リネーム実行' }));
    await screen.findByText('4件のリネームが完了しました');
    expect(renameBackend.execute).toHaveBeenCalledExactlyOnceWith({
      paths,
      pattern: '{番号}',
      start: 1,
      outputDir: 'D:/chosen',
    });
    expect(screen.getByLabelText<HTMLInputElement>('開始番号').value).toBe('5');
  });
});
