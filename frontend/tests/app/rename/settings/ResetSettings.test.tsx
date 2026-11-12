import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResetSettings } from '../../../../src/app/rename/settings/ResetSettings';

describe('ResetSettings', () => {
  it('モーダルを開き各項目を独立して変更して閉じる', () => {
    const onChange = vi.fn();
    render(
      <ResetSettings
        settings={{ start: true, outputDir: false }}
        onChange={onChange}
        message=""
        disabled={false}
      />,
    );
    const dialog = document.querySelector('dialog');
    if (!dialog) throw new Error('設定モーダルがありません');
    const show = vi.fn(() => dialog.setAttribute('open', ''));
    const close = vi.fn(() => dialog.removeAttribute('open'));
    dialog.showModal = show;
    dialog.close = close;
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    expect(show).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByLabelText('開始番号を1に戻す'));
    expect(onChange).toHaveBeenLastCalledWith({ start: false, outputDir: false });
    fireEvent.click(screen.getByLabelText('出力先フォルダを空にする'));
    expect(onChange).toHaveBeenLastCalledWith({ start: true, outputDir: true });
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(close).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(false);
  });

  it('実行中や読込中は設定を開けない', () => {
    render(
      <ResetSettings
        settings={{ start: true, outputDir: true }}
        onChange={vi.fn()}
        message=""
        disabled
      />,
    );
    expect(screen.getByRole('button', { name: '設定' }).hasAttribute('disabled')).toBe(true);
  });
});
