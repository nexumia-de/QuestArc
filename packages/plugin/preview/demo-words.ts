// The demo user's own words (anchors, reasons, task titles) in the
// preview's language: `?lang=de` shows a German user, so the German
// screens are checked with German words in them (issue #39).
const GERMAN: Readonly<Record<string, string>> = {
  'I want my mornings to start calmly.': 'Ich möchte, dass meine Morgen ruhig beginnen.',
  'getting up': 'dem Aufstehen',
  lunch: 'dem Mittagessen',
  Evening: 'Abend',
  'Morning stretch': 'Dehnen am Morgen',
  'Pay the bills': 'Rechnungen bezahlen',
  'Morning routine': 'Morgenroutine',
  'Glass of water': 'Glas Wasser',
  'my morning playlist': 'meiner Morgen-Playlist',
  'A calm start into the day': 'Ein ruhiger Start in den Tag',
  'Reaching for the phone first': 'Dass ich zuerst zum Handy greife',
  'If I reach for the phone, then I will put it down and fill the glass':
    'Wenn ich zum Handy greife, dann lege ich es weg und fülle das Glas',
  'Read in my book': 'In meinem Buch lesen',
  'Walk after lunch': 'Spaziergang nach dem Mittagessen',
  'Plan the day': 'Den Tag planen',
};

/** The preview's language: `?lang=de`, else English. */
export const previewLanguage = (): string =>
  new URLSearchParams(location.search).get('lang') ?? 'en';

/** Words the demo user wrote, in the preview's language. */
export const own = (words: string): string =>
  (/^de\b/i.test(previewLanguage()) ? GERMAN[words] : undefined) ?? words;
