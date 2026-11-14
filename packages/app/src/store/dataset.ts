import type { HostRepeatCfg, HostTask } from '@questarc/engine';

/**
 * The app's data: Super Productivity's dataset (`AppDataComplete`,
 * `crossModelVersion` 4.5) with only the slices the app needs, so a file
 * of it is a backup Super Productivity imports
 * (docs/decisions/standalone-app-spike.md, the smallest backup). Slices
 * and fields the app does not know are kept as read.
 */

export const CROSS_MODEL_VERSION = 4.5;
export const INBOX_ID = 'INBOX_PROJECT';
export const TODAY_ID = 'TODAY';
/** QuestArc's plugin id: its choice records are `questarc:<key>` entries. */
export const PLUGIN_ID = 'questarc';

export interface Entities<T> {
  readonly ids: readonly string[];
  readonly entities: Readonly<Record<string, T>>;
}

/** A task as Super Productivity stores it: the required fields and those the app writes. */
export interface StoredTask extends HostTask {
  readonly title: string;
  readonly projectId: string;
  readonly subTaskIds: readonly string[];
  readonly timeSpent: number;
  readonly timeEstimate: number;
  readonly tagIds: readonly string[];
  readonly created: number;
  readonly attachments: readonly unknown[];
}

export interface StoredRepeatCfg extends HostRepeatCfg {
  readonly title: string | null;
  readonly projectId: string | null;
  readonly tagIds?: readonly string[];
  readonly defaultEstimate?: number;
  readonly skipOverdue?: boolean;
  readonly lastTaskCreationDay?: string;
}

export interface StoredProject {
  readonly id: string;
  readonly taskIds: readonly string[];
  readonly [field: string]: unknown;
}

/** The live tasks and the task list's state, which Super Productivity's import requires. */
export interface TaskSlice extends Entities<StoredTask> {
  readonly currentTaskId: string | null;
  readonly selectedTaskId: string | null;
  readonly lastCurrentTaskId: string | null;
  readonly isDataLoaded: boolean;
}

export interface Dataset {
  readonly task: TaskSlice;
  readonly project: Entities<StoredProject>;
  /** Tags; the app only keeps the Today tag's list (store/instances.ts). */
  readonly tag?: Entities<StoredProject>;
  readonly taskRepeatCfg: Entities<StoredRepeatCfg>;
  readonly pluginUserData: readonly { readonly id: string; readonly data: string }[];
  readonly globalConfig?: {
    readonly misc?: { readonly startOfNextDay?: number; readonly startOfNextDayTime?: string };
  };
  readonly archiveYoung?: { readonly task?: Entities<StoredTask> };
  readonly archiveOld?: { readonly task?: Entities<StoredTask> };
  readonly [slice: string]: unknown;
}

/*
 * The Inbox project and the Today tag as Super Productivity creates them
 * (INBOX_PROJECT with DEFAULT_PROJECT, TODAY_TAG with DEFAULT_TAG, both
 * with WORK_CONTEXT_DEFAULT_COMMON). Values transcribed as data from
 * Super Productivity 19.3.1, commit 590178d7,
 * src/app/features/project/project.const.ts,
 * src/app/features/tag/tag.const.ts and
 * src/app/features/work-context/work-context.const.ts (MIT, © Johannes
 * Millan).
 */
const WORK_CONTEXT = {
  advancedCfg: {
    worklogExportSettings: {
      cols: ['DATE', 'START', 'END', 'TIME_CLOCK', 'TITLES_INCLUDING_SUB'],
      roundWorkTimeTo: null,
      roundStartTimeTo: null,
      roundEndTimeTo: null,
      separateTasksBy: ' | ',
      groupBy: 'DATE',
    },
  },
  theme: {
    isAutoContrast: true,
    isDisableBackgroundTint: false,
    primary: 'rgb(144, 187, 165)',
    huePrimary: '500',
    accent: '#ff4081',
    hueAccent: '500',
    warn: '#e11826',
    hueWarn: '500',
    backgroundImageDark: '',
    backgroundImageLight: null,
    backgroundOverlayOpacity: 20,
    backgroundImageBlur: 0,
  },
  taskIds: [],
};

/** Every task needs a project or a tag, so the app's habits live in the Inbox. */
const INBOX: StoredProject = {
  isHiddenFromMenu: false,
  isArchived: false,
  isDone: false,
  doneOn: null,
  isEnableBacklog: false,
  backlogTaskIds: [],
  noteIds: [],
  ...WORK_CONTEXT,
  icon: 'inbox',
  id: INBOX_ID,
  title: 'Inbox',
};

/** The virtual Today tag: its list orders the tasks due today. */
const TODAY: StoredProject = {
  color: null,
  created: 0,
  ...WORK_CONTEXT,
  theme: {
    ...WORK_CONTEXT.theme,
    isDisableBackgroundTint: true,
    primary: '#6495ED',
    huePrimary: '400',
  },
  icon: 'wb_sunny',
  id: TODAY_ID,
  title: 'Today',
};

/**
 * What the app starts with: no tasks, the Inbox, the Today tag, no
 * habits, no records. Super Productivity fills every other slice with
 * its default at import.
 */
export const freshDataset = (): Dataset => ({
  task: {
    ids: [],
    entities: {},
    currentTaskId: null,
    selectedTaskId: null,
    lastCurrentTaskId: null,
    isDataLoaded: false,
  },
  project: { ids: [INBOX_ID], entities: { [INBOX_ID]: INBOX } },
  tag: { ids: [TODAY_ID], entities: { [TODAY_ID]: TODAY } },
  taskRepeatCfg: { ids: [], entities: {} },
  pluginUserData: [],
});

export const archivedTasks = (data: Dataset): StoredTask[] => [
  ...Object.values(data.archiveYoung?.task?.entities ?? {}),
  ...Object.values(data.archiveOld?.task?.entities ?? {}),
];
