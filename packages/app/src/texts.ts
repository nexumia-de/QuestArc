import { language } from '@questarc/plugin/src/shared/texts';

/**
 * The texts only the standalone app has; the journeys' screens bring
 * their own (content/i18n). German next to English (issue #39); the
 * language is the one the app chose at start (main.ts), English for
 * any other.
 */
const english = {
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

type Key = keyof typeof english;

const german: Readonly<Record<Key, string>> = {
  'tab.today': 'Heute',
  'tab.journey': 'Reise',
  'tab.data': 'Daten',
  'today.empty': 'Heute ist nichts fällig.',
  'today.none':
    'Deine Gewohnheiten kommen aus einer Reise: Jeder Schritt bringt eine kleine Gewohnheit hierher.',
  'today.open-journey': 'Reise öffnen',
  'today.earlier': 'vom {day}',
  'today.done': 'Erledigt',
  'today.open': 'Noch offen',
  'data.title': 'Daten',
  'data.text':
    'Deine Gewohnheiten und deine Reise liegen auf diesem Gerät, im Format der Backups von Super Productivity. Eine Backup-Datei lässt sich dort importieren, und eine von dort hier.',
  'data.export': 'Backup exportieren',
  'data.import': 'Backup importieren',
  'data.import.text': 'Ein Import ersetzt alles in dieser App.',
  'data.imported': 'Backup importiert.',
  'data.undo': 'Rückgängig',
  'data.restored': 'Deine Daten von vor dem Import sind wieder da.',
  'data.problem.not-json': 'Diese Datei ist kein Backup: Sie ließ sich nicht lesen.',
  'data.problem.not-a-backup':
    'Diese Datei ist kein Backup von Super Productivity oder von dieser App.',
  'data.problem.other-version':
    'Dieses Backup hat eine andere Datenversion. Du könntest es in einem aktuellen Super Productivity öffnen und neu exportieren.',
  'data.day-start': 'Ein Tag beginnt um',
  'data.day-start.text':
    'Was du vor dieser Zeit abhakst, zählt für den Tag davor: für alle, die nach Mitternacht noch wach sind.',
  'error.start': 'Die App konnte ihre Daten auf diesem Gerät nicht öffnen.',
};

const tables: Readonly<Record<string, Readonly<Record<Key, string>>>> = { en: english, de: german };

export const at = (key: Key, params: Record<string, string> = {}): string =>
  (tables[language()] ?? english)[key].replace(
    /\{([a-z]+)\}/g,
    (match, name: string) => params[name] ?? match,
  );
