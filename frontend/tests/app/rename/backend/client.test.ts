import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renameBackend,
  subscribeToFiles,
  subscribeToProgress,
  parseProgress,
} from '../../../../src/app/rename/backend/client';
import { ChooseOutput, Execute, Inspect, Preview } from '../../../../wailsjs/go/app/App';
import { EventsOn, OnFileDrop, OnFileDropOff } from '../../../../wailsjs/runtime/runtime';
vi.mock('../../../../wailsjs/go/app/App', () => ({
  ChooseOutput: vi.fn(),
  Execute: vi.fn(),
  Inspect: vi.fn(),
  Preview: vi.fn(),
}));
vi.mock('../../../../wailsjs/runtime/runtime', () => ({
  EventsOn: vi.fn(),
  OnFileDrop: vi.fn(),
  OnFileDropOff: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
describe('renameBackend', () => {
  it('各操作を対応するWails関数へ接続する', () => {
    expect(renameBackend).toEqual({
      chooseOutput: ChooseOutput,
      execute: Execute,
      inspect: Inspect,
      preview: Preview,
    });
  });
});
describe('subscribeToFiles', () => {
  it('座標を除いてパスを通知し、解除処理を返す', () => {
    const callback = vi.fn();
    const cleanup = subscribeToFiles(callback);
    vi.mocked(OnFileDrop).mock.calls[0]?.[0](10, 20, ['a', 'b']);
    expect(callback).toHaveBeenCalledExactlyOnceWith(['a', 'b']);
    expect(OnFileDrop).toHaveBeenCalledWith(expect.any(Function), true);
    cleanup();
    expect(OnFileDropOff).toHaveBeenCalledTimes(1);
  });
});
describe('subscribeToProgress', () => {
  it('正しい進捗だけを通知し解除関数を返す', () => {
    const cleanup = vi.fn();
    vi.mocked(EventsOn).mockReturnValue(cleanup);
    const callback = vi.fn();
    expect(subscribeToProgress(callback)).toBe(cleanup);
    expect(EventsOn).toHaveBeenCalledWith('rename:progress', expect.any(Function));
    const receive = vi.mocked(EventsOn).mock.calls[0]?.[1];
    if (!receive) throw new Error('進捗購読がありません');
    [
      null,
      1,
      'bad',
      {},
      { completed: '1', total: 2, name: 'a' },
      { completed: 1, name: 'a' },
      { completed: 1, total: 2, name: 3 },
    ].forEach((value) => receive(value));
    expect(callback).not.toHaveBeenCalled();
    receive({ completed: 1, total: 2, name: 'a', extra: true });
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
