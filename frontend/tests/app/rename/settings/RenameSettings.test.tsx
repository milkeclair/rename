import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RenameSettings } from '../../../../src/app/rename/settings/RenameSettings';
import { input } from '../../../support/data';
afterEach(cleanup);
describe('RenameSettings', () => {
  it('設定を表示し、変更した項目だけ更新して通知する', () => {
    const onChange = vi.fn();
    const onChooseOutput = vi.fn(async () => {});
    const settings = input().settings;
    render(
      <RenameSettings
        settings={settings}
        disabled={false}
        onChange={onChange}
        onChooseOutput={onChooseOutput}
      />,
    );
    expect(screen.getByLabelText('出力先フォルダ').getAttribute('value')).toBe('C:/out');
    expect(screen.getByLabelText('出力先フォルダ').hasAttribute('readonly')).toBe(false);
    fireEvent.change(screen.getByLabelText('連番形式'), { target: { value: '{番号}' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, pattern: '{番号}' });
    fireEvent.change(screen.getByLabelText('開始番号'), { target: { value: '8' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, start: '8' });
    for (const outputDir of ['D:\\写真 フォルダ', '']) {
      fireEvent.change(screen.getByLabelText('出力先フォルダ'), { target: { value: outputDir } });
      expect(onChange).toHaveBeenLastCalledWith({ ...settings, outputDir });
    }

    fireEvent.click(screen.getByRole('button', { name: '選択' }));
    expect(onChooseOutput).toHaveBeenCalledTimes(1);
  });
  it('実行中は入力と選択を無効にする', () => {
    const choose = vi.fn(async () => {});
    render(
      <RenameSettings
        settings={input().settings}
        disabled
        onChange={vi.fn()}
        onChooseOutput={choose}
      />,
    );
    ['連番形式', '開始番号', '出力先フォルダ'].forEach((name) =>
      expect(screen.getByLabelText(name).hasAttribute('disabled')).toBe(true),
    );
    fireEvent.click(screen.getByRole('button'));
    expect(choose).not.toHaveBeenCalled();
  });
});
