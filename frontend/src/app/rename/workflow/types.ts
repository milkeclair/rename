import type { RenameInput } from '../model/input';
import type { Entry, Plan, Progress, Request, Result, Settings, Sort } from '../model/types';

export type Execution =
  | { status: 'editing' }
  | { status: 'running'; progress: Progress }
  | { status: 'result'; result: Result };

export type RenameState = {
  input: RenameInput;
  preview: Plan | null;
  execution: Execution;
  imports: number;
  message: string;
  revision: number;
};

export type InputChange =
  | { type: 'settings'; settings: Settings }
  | { type: 'output'; outputDir: string }
  | { type: 'sort'; sort: Sort }
  | { type: 'reorder'; source: string; target: string }
  | { type: 'remove'; path: string };

export type Action =
  | { type: 'input'; change: InputChange; revision: number }
  | { type: 'import-started'; revision: number }
  | { type: 'imported'; entries: Entry[]; revision: number }
  | { type: 'import-failed'; message: string; revision: number }
  | { type: 'preview'; plan: Plan; revision: number }
  | { type: 'started'; request: Request }
  | { type: 'progress'; progress: Progress }
  | { type: 'finished'; request: Request; result: Result }
  | { type: 'execution-failed'; message: string; revision: number }
  | { type: 'message'; message: string }
  | { type: 'clear'; revision: number };
