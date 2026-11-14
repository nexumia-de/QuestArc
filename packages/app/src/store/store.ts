import type { Dataset } from './dataset';

/**
 * Holds the dataset in memory and writes every change through to where
 * it is kept (IndexedDB in the browser, memory in tests).
 */

export interface Persistence {
  load(): Promise<Dataset | undefined>;
  save(data: Dataset): Promise<void>;
}

export interface Store {
  readonly data: Dataset;
  /** Applies a change; resolves, when it is kept, with whether anything changed. */
  update(change: (data: Dataset) => Dataset): Promise<boolean>;
}

export const memory = (initial?: Dataset): Persistence & { saved: Dataset | undefined } => {
  const kept: Persistence & { saved: Dataset | undefined } = {
    saved: initial,
    load: async () => kept.saved,
    save: async (data) => {
      kept.saved = data;
    },
  };
  return kept;
};

export const openStore = async (kept: Persistence, fresh: () => Dataset): Promise<Store> => {
  let data = (await kept.load()) ?? fresh();
  let writing: Promise<void> = Promise.resolve();
  return {
    get data() {
      return data;
    },
    update(change) {
      const next = change(data);
      if (next === data) return Promise.resolve(false);
      data = next;
      // Writes run one after another, so the newest dataset is kept last.
      writing = writing.then(() => kept.save(next));
      return writing.then(() => true);
    },
  };
};
