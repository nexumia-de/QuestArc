import type { HostApi } from './host';

/**
 * Choice records, one plugin-data key each (docs/data-model.md §2). Values
 * are JSON; an empty string is a withdrawn record. A value that is not
 * JSON is passed on as text, so the engine reports it as a problem.
 */

export type Records = Readonly<Record<string, unknown>>;

const parse = (raw: string | null): unknown => {
  if (!raw) return '';
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

export const loadRecords = async (api: HostApi): Promise<Records> => {
  const keys = await api.listSyncedDataKeys();
  const values = await Promise.all(keys.map((key) => api.loadSyncedData(key)));
  return Object.fromEntries(keys.map((key, i) => [key, parse(values[i] ?? null)]));
};

/** Writes each record; `''` withdraws it (there is no single-key delete). */
export const writeRecords = async (api: HostApi, records: Records): Promise<void> => {
  for (const [key, value] of Object.entries(records)) {
    await api.persistDataSynced(value === '' ? '' : JSON.stringify(value), key);
  }
};
