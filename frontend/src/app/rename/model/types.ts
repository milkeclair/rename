import type * as renamer from '../../../../bindings/github.com/milkeclair/rename/backend/internal/renamer/models';

export type Entry = renamer.Entry;
export type Plan = Omit<renamer.Plan, 'items'> & { items: Item[] };
export type Result = Omit<renamer.Result, 'items'> & { items: ResultItem[] };
export type Request = Omit<renamer.Request, 'paths'> & { paths: string[] };
export type Item = renamer.Item;
export type ResultItem = Omit<renamer.ResultItem, 'status'> & { status: string };
export type Progress = { completed: number; total: number; name: string };
export type Sort = { field: 'name' | 'created' | 'directory' | 'manual'; descending: boolean };
export type Settings = { pattern: string; start: string; outputDir: string };
