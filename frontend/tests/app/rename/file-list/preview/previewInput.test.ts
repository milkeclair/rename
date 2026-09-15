import { describe, it, expect, vi, beforeEach } from 'vitest';
import { previewInput } from '../../../../../src/app/rename/file-list/preview/previewInput';
import { renameBackend } from '../../../../../src/app/rename/backend/client';
import { input, item } from '../../../../support/data';
vi.mock('../../../../../src/app/rename/backend/client', () => ({
  renameBackend: { preview: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());
describe('previewInput', () => {
  it('空一覧では通信しない', async () => {
    expect(await previewInput({ ...input(), entries: [] })).toEqual({ items: [], issue: '' });
    expect(renameBackend.preview).not.toHaveBeenCalled();
  });
  it.each(['', ' ', '1.5', 'NaN', '9007199254740992'])(
    '無効な開始番号を拒否する: %s',
    async (start) => {
      expect(
        (await previewInput({ ...input(), settings: { ...input().settings, start } })).issue,
      ).toBe('開始番号を整数で入力してください');
      expect(renameBackend.preview).not.toHaveBeenCalled();
    },
  );
  it('要求値を渡し返却計画を保持する', async () => {
    const plan = { items: [item()], issue: '' };
    vi.mocked(renameBackend.preview).mockResolvedValue(plan);
    expect(await previewInput(input())).toBe(plan);
    expect(renameBackend.preview).toHaveBeenCalledExactlyOnceWith({
      paths: ['C:/in/a.txt'],
      start: 1,
      pattern: '{番号:0000}',
      outputDir: 'C:/out',
    });
  });
  it.each([new Error('failure'), 'failure'])('例外を計画のissueへ変換する', async (error) => {
    vi.mocked(renameBackend.preview).mockRejectedValue(error);
    expect(await previewInput(input())).toEqual({ items: [], issue: 'failure' });
  });
});
