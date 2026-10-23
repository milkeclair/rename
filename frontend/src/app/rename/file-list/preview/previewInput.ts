import { renameBackend } from '../../backend/client';
import { requestFor } from '../../execution/request';
import type { RenameInput } from '../../model/input';
import type { Plan } from '../../model/types';

export async function previewInput(input: RenameInput): Promise<Plan> {
  if (input.entries.length === 0) {
    return { items: [], issue: '' };
  }

  const request = requestFor(input);
  const hasStart = input.settings.start.trim() !== '';

  if (!hasStart || !Number.isSafeInteger(request.start)) {
    return { items: [], issue: '開始番号を整数で入力してください' };
  }

  try {
    return await renameBackend.preview(request);
  } catch (error) {
    return { items: [], issue: error instanceof Error ? error.message : String(error) };
  }
}
