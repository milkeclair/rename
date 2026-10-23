import { completed } from '../execution/completed';
import type { Entry, Plan, Result } from '../model/types';

import type { Feedback } from './feedback';

type Display = {
  input: { entries: Entry[] };
  preview: Plan | null;
  execution: { status: string; result?: Result };
  message: string;
};

export function executionFeedback(state: Display): Feedback {
  const { input, preview, execution, message } = state;

  if (execution.status === 'result' && execution.result) {
    const result = execution.result;
    const count = result.items.filter((item) => completed(item.status)).length;

    return result.issue
      ? { text: result.issue, tone: 'error' }
      : { text: `${count}件のリネームが完了しました`, tone: 'success' };
  }

  if (message) {
    return { text: message, tone: 'error' };
  } else if (input.entries.length === 0 || execution.status === 'running') {
    return { text: '' };
  } else if (!preview) {
    return { text: '変更後の名前を確認中…' };
  } else {
    const invalid = preview.items.some((item) => item.issue);
    return {
      text: preview.issue || (invalid ? '一覧のエラーを確認してください' : ''),
      tone: invalid ? 'error' : undefined,
    };
  }
}
