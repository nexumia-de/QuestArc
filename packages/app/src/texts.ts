/**
 * The texts only the standalone app has; the journeys' screens bring
 * their own (content/i18n). English only in the spike.
 */
const texts = {
  'tab.today': 'Today',
  'tab.journey': 'Journey',
  'tab.data': 'Data',
  'today.empty': 'Nothing is due today.',
  'today.none': 'Your habits come from a journey: each stage adds one small habit here.',
  'today.open-journey': 'Open the Journey',
  'today.earlier': 'from {day}',
  'today.done': 'Done',
  'today.open': 'Not done yet',
  'data.title': 'Data',
  'data.text':
    'Your habits and your journey are kept on this device, in the format of Super Productivity’s backups. A backup file can be imported there, and one from there here.',
  'data.export': 'Export a Backup',
  'data.import': 'Import a Backup',
  'data.import.text': 'Importing replaces everything in this app.',
  'data.imported': 'Backup imported.',
  'data.undo': 'Undo',
  'data.restored': 'Your data from before the import is back.',
  'data.problem.not-json': 'This file is not a backup: it could not be read.',
  'data.problem.not-a-backup': 'This file is not a backup of Super Productivity or of this app.',
  'data.problem.other-version':
    'This backup has another data version. Open it in a current Super Productivity and export it again.',
  'data.day-start': 'A day starts at',
  'data.day-start.text':
    'What you tick off before this time counts for the day before, for people who are up after midnight.',
  'error.start': 'The app could not open its data on this device.',
} as const;

export const at = (key: keyof typeof texts, params: Record<string, string> = {}): string =>
  texts[key].replace(/\{([a-z]+)\}/g, (match, name: string) => params[name] ?? match);
