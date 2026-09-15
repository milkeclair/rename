import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from '../../src/app/App';
import { renameBackend, subscribeToFiles } from '../../src/app/rename/backend/client';
import { entry } from '../support/data';
vi.mock('../../src/app/rename/backend/client', () => ({
  renameBackend: { inspect: vi.fn(), preview: vi.fn(), execute: vi.fn(), chooseOutput: vi.fn() },
  subscribeToFiles: vi.fn(() => vi.fn()),
  subscribeToProgress: vi.fn(() => vi.fn()),
}));
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
