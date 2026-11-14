import type { Dataset } from './dataset';
import type { Persistence } from './store';

/**
 * The dataset in the browser's IndexedDB: one database, one object
 * store, the whole dataset under one key. A habit dataset is small (one
 * task per habit and day), so writing it whole after each change is
 * enough for the spike.
 */

const NAME = 'questarc';
const STORE = 'dataset';
const KEY = 'current';

const done = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('QuestArc: IndexedDB failed'));
  });

export const indexedDbPersistence = (factory: IDBFactory = indexedDB): Persistence => {
  const open = factory.open(NAME, 1);
  open.onupgradeneeded = () => open.result.createObjectStore(STORE);
  const db = done(open);
  const store = async (mode: IDBTransactionMode) =>
    (await db).transaction(STORE, mode).objectStore(STORE);
  return {
    load: async () => done<Dataset | undefined>((await store('readonly')).get(KEY)),
    save: async (data) => {
      await done((await store('readwrite')).put(data, KEY));
    },
  };
};
