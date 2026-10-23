import type { RenameInput } from '../model/input';
import type { Request } from '../model/types';

export function requestFor(input: RenameInput): Request {
  return {
    paths: input.entries.map((entry) => entry.path),
    pattern: input.settings.pattern,
    start: Number(input.settings.start),
    outputDir: input.settings.outputDir,
  };
}
