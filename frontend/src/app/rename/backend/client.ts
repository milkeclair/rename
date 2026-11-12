import {
  ChooseOutput,
  ChooseParent,
  Execute,
  Inspect,
  InspectChildren,
  Preview,
} from '../../../../bindings/github.com/milkeclair/rename/backend/app/app';
import { Events } from '@wailsio/runtime';
import type { Entry, Plan, Progress, Request, Result } from '../model/types';

export const renameBackend: {
  inspect: (paths: string[]) => Promise<Entry[]>;
  inspectChildren: (path: string) => Promise<Entry[]>;
  chooseParent: () => Promise<string>;
  preview: (request: Request) => Promise<Plan>;
  execute: (request: Request) => Promise<Result>;
  chooseOutput: () => Promise<string>;
} = {
  inspect: async (paths) => (await Inspect(paths)) ?? [],
  inspectChildren: async (path) => (await InspectChildren(path)) ?? [],
  chooseParent: ChooseParent,
  preview: async (request) => {
    const plan = await Preview(request);
    return { ...plan, items: plan.items ?? [] };
  },
  execute: async (request) => {
    const result = await Execute(request);
    return { ...result, items: result.items ?? [] };
  },
  chooseOutput: ChooseOutput,
};

export function subscribeToFiles(onDrop: (paths: string[]) => void): () => void {
  return Events.On('rename:files-dropped', (event) => {
    const paths: unknown = event.data;
    if (Array.isArray(paths) && paths.every((path: unknown) => typeof path === 'string')) {
      onDrop(paths);
    }
  });
}

export function subscribeToProgress(onProgress: (progress: Progress) => void): () => void {
  return Events.On('rename:progress', (event) => {
    const progress = parseProgress(event.data);

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
