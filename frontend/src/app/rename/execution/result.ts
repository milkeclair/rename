import type { RenameInput } from '../model/input';
import { completed } from './completed';
import type { Request, Result } from '../model/types';

export function inputAfterExecution(
  input: RenameInput,
  request: Request,
  result: Result,
): RenameInput {
  const allCompleted = result.items.every((item) => completed(item.status));
  const allReported = result.items.length === request.paths.length;
  const succeeded = result.issue === '' && allReported && allCompleted;

  if (succeeded) {
    const start = String(request.start + request.paths.length);

    return { ...input, settings: { ...input.settings, start } };
  }

  return input;
}
