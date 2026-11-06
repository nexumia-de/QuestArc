import type { DayContext } from '@questarc/engine';

import type { HostApi } from './host';

/** Local calendar day as YYYY-MM-DD, for versions without getDayContext(). */
export const localDay = (date: Date): string =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, '0'))
    .join('-');

/**
 * The user's logical day (game rules §2). getDayContext() came after Super
 * Productivity 19.3.1; older versions get the local date and no day-start
 * offset (docs/data-model.md §1).
 */
export const readDay = async (
  api: HostApi,
  now: () => Date = () => new Date(),
): Promise<DayContext> => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const context = api.getDayContext ? await api.getDayContext().catch(() => null) : null;
  return {
    todayStr: context?.todayStr ?? localDay(now()),
    startOfNextDayDiffMs: context?.startOfNextDayDiffMs ?? 0,
    timeZone,
  };
};
