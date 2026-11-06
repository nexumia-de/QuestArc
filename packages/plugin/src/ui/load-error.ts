import { t } from '../shared/texts';

/**
 * What the view says when it cannot get the game state from plugin.js
 * (docs/behaviour.md, messages). Super Productivity answers "Plugin <id>
 * not found or not loaded" or "has no message handler registered" while
 * plugin.js is not running yet: after an install, an update, switching it
 * on, or while the app starts (plugin-runner.ts and plugin-api.ts at
 * c5eb3f6). The view retries by itself, so the texts say so.
 */

export type LoadProblem = 'starting' | 'not-running' | 'failed';

/** After this long without an answer from plugin.js, "starting" becomes "not running". */
export const NOT_RUNNING_AFTER_MS = 20_000;

const NOT_RUNNING = /not found or not loaded|no message handler registered|timed out/i;

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : typeof error === 'string' ? error : '';

export const loadProblem = (error: unknown, failingForMs: number): LoadProblem => {
  if (!NOT_RUNNING.test(messageOf(error))) return 'failed';
  return failingForMs >= NOT_RUNNING_AFTER_MS ? 'not-running' : 'starting';
};

export interface LoadErrorText {
  problem: LoadProblem;
  text: string;
  /** The technical reason, for a bug report; only when reading failed. */
  detail?: string;
}

export const loadErrorText = (error: unknown, failingForMs: number): LoadErrorText => {
  const problem = loadProblem(error, failingForMs);
  const reason = messageOf(error).slice(0, 200);
  return {
    problem,
    text: t(`ui.error.${problem}`),
    ...(problem === 'failed' && reason ? { detail: t('ui.error.details', { reason }) } : {}),
  };
};
