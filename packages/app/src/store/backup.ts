import { CROSS_MODEL_VERSION, freshDataset } from './dataset';
import type { Dataset } from './dataset';

/**
 * The dataset as a backup file Super Productivity imports and exports
 * (`CompleteBackup`), and reading one: its own exports and the bare
 * dataset its automatic backups hold.
 */

export interface CompleteBackup {
  readonly timestamp: number;
  readonly lastUpdate: number;
  readonly crossModelVersion: number;
  readonly data: Dataset;
}

export type BackupProblem = 'not-json' | 'not-a-backup' | 'other-version';

export class BackupError extends Error {
  constructor(readonly problem: BackupProblem) {
    super(`QuestArc: backup ${problem}`);
  }
}

export const toBackup = (data: Dataset, now: number): CompleteBackup => ({
  timestamp: now,
  lastUpdate: now,
  crossModelVersion: CROSS_MODEL_VERSION,
  data,
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEntities = (value: unknown): boolean =>
  isObject(value) && Array.isArray(value.ids) && isObject(value.entities);

/**
 * Reads a backup. A file of another data model version is refused: Super
 * Productivity migrates older ones, and newer ones may hold what this app
 * would break. Slices the app needs and the file lacks start empty; all
 * others are kept as read.
 */
export const parseBackup = (text: string): Dataset => {
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch {
    throw new BackupError('not-json');
  }
  if (!isObject(file)) throw new BackupError('not-a-backup');
  const wrapped = 'crossModelVersion' in file && isObject(file.data);
  if (wrapped && file.crossModelVersion !== CROSS_MODEL_VERSION) {
    throw new BackupError('other-version');
  }
  const data = wrapped ? (file.data as Record<string, unknown>) : file;
  if (!isEntities(data.task) || !isEntities(data.project)) throw new BackupError('not-a-backup');
  return {
    ...data,
    task: data.task,
    project: data.project,
    taskRepeatCfg: isEntities(data.taskRepeatCfg)
      ? data.taskRepeatCfg
      : freshDataset().taskRepeatCfg,
    pluginUserData: Array.isArray(data.pluginUserData) ? data.pluginUserData : [],
  } as Dataset;
};
