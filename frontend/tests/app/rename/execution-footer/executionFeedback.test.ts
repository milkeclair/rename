import { describe, it, expect } from 'vitest';
import { executionFeedback } from '../../../../src/app/rename/execution-footer/executionFeedback';
import { state, item, resultItem } from '../../../support/data';
describe('executionFeedback', () => {
  it('結果の全体エラーを優先し、完了と変更なしだけ数える', () => {
    const value = {
      ...state(),
      message: 'old',
      execution: {
        status: 'result',
        result: { items: [resultItem(), resultItem('unchanged'), resultItem('failed')], issue: '' },
      },
    };
    expect(executionFeedback(value)).toEqual({
      text: '2件のリネームが完了しました',
      tone: 'success',
    });
    expect(
      executionFeedback({
        ...value,
        execution: { status: 'result', result: { items: [], issue: 'failure' } },
      }),
    ).toEqual({ text: 'failure', tone: 'error' });
  });
  it('通知、空一覧、実行中、計画待ちを区別する', () => {
    expect(executionFeedback({ ...state(), message: 'message' })).toEqual({
      text: 'message',
      tone: 'error',
    });
    expect(executionFeedback({ ...state(), input: { entries: [] } })).toEqual({ text: '' });
    expect(executionFeedback({ ...state(), execution: { status: 'running' } })).toEqual({
      text: '',
    });
    expect(executionFeedback({ ...state(), preview: null })).toEqual({
      text: '変更後の名前を確認中…',
    });
  });
  it('計画全体と個別の問題を表示する', () => {
    expect(executionFeedback({ ...state(), preview: { items: [item('bad')], issue: '' } })).toEqual(
      { text: '一覧のエラーを確認してください', tone: 'error' },
    );
    expect(
      executionFeedback({ ...state(), preview: { items: [], issue: 'bad output' } }).text,
    ).toBe('bad output');
    expect(executionFeedback(state()).text).toBe('');
  });
});
