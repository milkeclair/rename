import type { Entry, Settings, Sort } from './types';

export type RenameInput = { entries: Entry[]; sort: Sort; settings: Settings };

const collator = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' });

export function initialInput(): RenameInput {
  return {
    entries: [],
    sort: { field: 'name', descending: false },
    settings: { pattern: '{番号:0000}', start: '1', outputDir: '' },
  };
}

export function addEntries(input: RenameInput, added: Entry[]): RenameInput {
  const entries = sorted(mergeEntries(input.entries, added), input.sort);
  const settings =
    input.settings.outputDir === '' && added[0]
      ? { ...input.settings, outputDir: added[0].directory }
      : input.settings;

  return { ...input, entries, settings };
}

export function addDirectoryEntries(input: RenameInput, added: Entry[]): RenameInput {
  if (added.length === 0) {
    return input;
  }

  return sortInput(
    { ...input, entries: mergeEntries(input.entries, added) },
    { field: 'directory', descending: false },
  );
}

export function sortInput(input: RenameInput, sort: Sort): RenameInput {
  return { ...input, sort, entries: sorted(input.entries, sort) };
}

export function reorderInput(input: RenameInput, source: string, target: string): RenameInput {
  const from = input.entries.findIndex((entry) => entry.path === source);
  const to = input.entries.findIndex((entry) => entry.path === target);

  if (from < 0 || to < 0 || from === to) {
    return input;
  }

  const entries = [...input.entries];
  const [entry] = entries.splice(from, 1);
  entries.splice(to, 0, entry);

  return { ...input, entries, sort: { ...input.sort, field: 'manual' } };
}

export function sorted(entries: Entry[], sort: Sort): Entry[] {
  if (sort.field === 'manual') {
    return entries;
  }

  return [...entries].sort((left, right) => {
    const directoryOrder =
      sort.field === 'directory' && left.directory !== right.directory
        ? collator.compare(left.directory, right.directory) ||
          (left.directory < right.directory ? -1 : 1)
        : 0;
    const comparison =
      directoryOrder ||
      (sort.field === 'created'
        ? left.createdAt - right.createdAt
        : collator.compare(left.name, right.name));
    const order = comparison === 0 ? collator.compare(left.path, right.path) : comparison;

    return sort.descending ? -order : order;
  });
}

export function mergeEntries(current: Entry[], added: Entry[]): Entry[] {
  const entries = new Map(current.map((entry) => [entry.path.toLowerCase(), entry]));

  for (const entry of added) {
    const key = entry.path.toLowerCase();

    if (!entries.has(key)) {
      entries.set(key, entry);
    }
  }

  return [...entries.values()];
}
