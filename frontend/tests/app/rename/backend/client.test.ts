import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renameBackend,
  subscribeToFiles,
  subscribeToProgress,
  parseProgress,
} from '../../../../src/app/rename/backend/client';
import {
  ChooseOutput,
  Execute,
  Inspect,
  Preview,
} from '../../../../bindings/github.com/milkeclair/rename/backend/app/app';
import { Events } from '@wailsio/runtime';
import { Status } from '../../../../bindings/github.com/milkeclair/rename/backend/internal/renamer/models';
import { entry, item, resultItem } from '../../../support/data';
vi.mock('../../../../bindings/github.com/milkeclair/rename/backend/app/app', () => ({
  ChooseOutput: vi.fn(),
  Execute: vi.fn(),
  Inspect: vi.fn(),
  Preview: vi.fn(),
}));
vi.mock('@wailsio/runtime', () => ({ Events: { On: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
describe('renameBackend', () => {
  it('各操作の引数と結果をWailsへ接続する', async () => {
    const request = { paths: ['a'], pattern: '{番号}', start: 1, outputDir: 'D:/out' };
    const entries = [entry()];
    const plan = { items: [item()], issue: '' };
    const result = { items: [{ ...resultItem(), status: Status.StatusDone }], issue: '' };
    vi.mocked(Inspect).mockResolvedValue(entries);
    vi.mocked(Preview).mockResolvedValue(plan);
    vi.mocked(Execute).mockResolvedValue(result);
    vi.mocked(ChooseOutput).mockResolvedValue('D:/out');
    expect(await renameBackend.inspect(['a'])).toEqual(entries);
    expect(Inspect).toHaveBeenCalledExactlyOnceWith(['a']);
    expect(await renameBackend.preview(request)).toEqual(plan);
    expect(Preview).toHaveBeenCalledExactlyOnceWith(request);
    expect(await renameBackend.execute(request)).toEqual(result);
    expect(Execute).toHaveBeenCalledExactlyOnceWith(request);
    expect(await renameBackend.chooseOutput()).toBe('D:/out');
  });
  it('Goのnil配列を空配列に正規化する', async () => {
    const request = { paths: [], pattern: '{番号}', start: 1, outputDir: 'D:/out' };
    vi.mocked(Inspect).mockResolvedValue(null);
    vi.mocked(Preview).mockResolvedValue({ items: null, issue: 'invalid' });
    vi.mocked(Execute).mockResolvedValue({ items: null, issue: 'failed' });
    expect(await renameBackend.inspect([])).toEqual([]);
    expect(await renameBackend.preview(request)).toEqual({ items: [], issue: 'invalid' });
    expect(await renameBackend.execute(request)).toEqual({ items: [], issue: 'failed' });
  });
  it('Goの実行エラーを呼出側へ伝える', async () => {
    const error = new Error('failed');
    vi.mocked(Execute).mockRejectedValue(error);
    await expect(
      renameBackend.execute({ paths: ['a'], pattern: '{番号}', start: 1, outputDir: 'D:/out' }),
    ).rejects.toBe(error);
  });
});
describe('subscribeToFiles', () => {
  it('ファイルパスを通知し購読ごとの解除関数を返す', () => {
    const cleanup = vi.fn();
    vi.mocked(Events.On).mockReturnValue(cleanup);
    const callback = vi.fn();
    expect(subscribeToFiles(callback)).toBe(cleanup);
    expect(Events.On).toHaveBeenCalledWith('rename:files-dropped', expect.any(Function));
    const receive = vi.mocked(Events.On).mock.calls[0]?.[1];
    if (!receive) throw new Error('ファイル購読がありません');
    receive({ name: 'rename:files-dropped', data: ['a', 'b'] });
    expect(callback).toHaveBeenCalledExactlyOnceWith(['a', 'b']);
  });
  it.each([{ data: null }, { data: 1 }, { data: 'a' }, { data: {} }, { data: ['a', 1] }])(
    '不正なパス通知を拒否する: %j',
    ({ data }) => {
      const callback = vi.fn();
      subscribeToFiles(callback);
      const receive = vi.mocked(Events.On).mock.calls[0]?.[1];
      if (!receive) throw new Error('ファイル購読がありません');
      receive({ name: 'rename:files-dropped', data });
      expect(callback).not.toHaveBeenCalled();
    },
  );
});
describe('subscribeToProgress', () => {
  it('正しい進捗だけを通知し解除関数を返す', () => {
    const cleanup = vi.fn();
    vi.mocked(Events.On).mockReturnValue(cleanup);
    const callback = vi.fn();
    expect(subscribeToProgress(callback)).toBe(cleanup);
    expect(Events.On).toHaveBeenCalledWith('rename:progress', expect.any(Function));
    const receive = vi.mocked(Events.On).mock.calls[0]?.[1];
    if (!receive) throw new Error('進捗購読がありません');
    [
      null,
      1,
      'bad',
      {},
      { completed: '1', total: 2, name: 'a' },
      { completed: 1, name: 'a' },
      { completed: 1, total: 2, name: 3 },
    ].forEach((value) => receive({ name: 'rename:progress', data: value }));
    expect(callback).not.toHaveBeenCalled();
    receive({ name: 'rename:progress', data: { completed: 1, total: 2, name: 'a', extra: true } });
    expect(callback).toHaveBeenCalledExactlyOnceWith({ completed: 1, total: 2, name: 'a' });
  });
});

describe('parseProgress', () => {
  it.each([
    null,
    undefined,
    4,
    'text',
    {},
    { completed: 1 },
    { completed: 1, total: '2', name: 'a' },
    { completed: 1, total: 2, name: null },
  ])('不正な通知を拒否する: %j', (value) => {
    expect(parseProgress(value)).toBeNull();
  });
  it('通知から必要な値だけを取り出す', () => {
    expect(parseProgress({ completed: 0, total: 2, name: '', extra: true })).toEqual({
      completed: 0,
      total: 2,
      name: '',
    });
  });
});
