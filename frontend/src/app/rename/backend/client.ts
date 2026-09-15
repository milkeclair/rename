import { ChooseOutput, Execute, Inspect, Preview } from '../../../../wailsjs/go/app/App';
import { EventsOn, OnFileDrop, OnFileDropOff } from '../../../../wailsjs/runtime/runtime';
import type { Entry, Plan, Progress, Request, Result } from '../model/types';

export const renameBackend: {
  inspect: (paths: string[]) => Promise<Entry[]>;
  preview: (request: Request) => Promise<Plan>;
  execute: (request: Request) => Promise<Result>;
  chooseOutput: () => Promise<string>;
} = {
  inspect: Inspect,
  preview: Preview,
  execute: Execute,
  chooseOutput: ChooseOutput,
};

export function subscribeToFiles(onDrop: (paths: string[]) => void): () => void {
  OnFileDrop((_x, _y, paths) => onDrop(paths), true);
  return OnFileDropOff;
}

export function subscribeToProgress(onProgress: (progress: Progress) => void): () => void {
  return EventsOn('rename:progress', (value: unknown) => {
    const progress = parseProgress(value);

    if (progress) {
      onProgress(progress);
    }
  });
}

export function parseProgress(value: unknown): Progress | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const completed = 'completed' in value ? value.completed : undefined;
  const total = 'total' in value ? value.total : undefined;
  const name = 'name' in value ? value.name : undefined;

  if (typeof completed === 'number' && typeof total === 'number' && typeof name === 'string') {
    return { completed, total, name };
  } else {
    return null;
  }
}
