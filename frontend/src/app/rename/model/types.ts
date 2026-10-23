import type { renamer } from '../../../../wailsjs/go/models';

export type Entry = renamer.Entry;
export type Plan = Pick<renamer.Plan, 'items' | 'issue'>;
export type Result = Pick<renamer.Result, 'items' | 'issue'>;
export type Request = renamer.Request;
export type Item = renamer.Item;
export type ResultItem = renamer.ResultItem;
export type Progress = { completed: number; total: number; name: string };
export type Sort = { field: 'name' | 'created' | 'manual'; descending: boolean };
export type Settings = { pattern: string; start: string; outputDir: string };
