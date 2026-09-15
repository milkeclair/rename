import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
vi.mock('react-dom/client', () => ({ createRoot: vi.fn() }));
vi.mock('../../src/app/App', () => ({ default: () => null }));
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  document.body.innerHTML = '';
});
describe('main', () => {
  it('rootがなければ起動エラーにする', async () => {
    await expect(import('../../src/app/main')).rejects.toThrow('アプリの表示先がありません');
    expect(createRoot).not.toHaveBeenCalled();
  });
  it('指定rootにアプリを描画する', async () => {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.append(container);
    const render = vi.fn();
    vi.mocked(createRoot).mockReturnValue({ render, unmount: vi.fn() });
    await import('../../src/app/main');
    expect(createRoot).toHaveBeenCalledExactlyOnceWith(container);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
