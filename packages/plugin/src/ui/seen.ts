/**
 * Small per-device memory of what the user has dismissed (a banner for
 * the day, a nugget once seen, a skipped weekly question). It is not a
 * choice and not synced; if the browser blocks storage, banners simply
 * show again.
 */
const PREFIX = 'questarc:';

export const wasSeen = (key: string): boolean => {
  try {
    return localStorage.getItem(PREFIX + key) === '1';
  } catch {
    return false;
  }
};

export const markSeen = (key: string): void => {
  try {
    localStorage.setItem(PREFIX + key, '1');
  } catch {
    // Storage blocked: the banner shows again next time.
  }
};
