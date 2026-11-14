import { addTexts, language } from '@questarc/ui/shared/texts';

/**
 * The texts of content/i18n that name the host the screens were written
 * for: Super Productivity's task list and the place its data lives. In
 * the app a task is ticked off on Today and the data stays on the device,
 * so these keys are replaced after `useLanguage` (main.ts). Placeholders
 * stay as in the originals (test/host-texts.test.ts). The other texts
 * that name Super Productivity (pausing or ending a repeat there,
 * "Schedule Task", ui.error.not-running, ui.error.failed) describe
 * features the app does not have yet and are left as they are.
 */
export const hostTexts: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  en: {
    'ui.card.hint': 'Tick off the task on Today as usual.',
    'ui.anchor.today.open': 'Today: still open. Tick off the task on Today as usual.',
    'ui.card.smaller':
      'You started smaller on {date}. The larger step waits for you. Tick off the task on Today as usual.',
    'ui.settings.data.text':
      'QuestArc keeps your habits and your choices (journeys, accepted stages, answers) on this device only. Export a backup under Data to keep a copy.',
  },
  de: {
    'ui.card.hint': 'Die Aufgabe hakst du wie gewohnt unter Heute ab.',
    'ui.anchor.today.open': 'Heute: noch offen. Die Aufgabe hakst du wie gewohnt unter Heute ab.',
    'ui.card.smaller':
      'Du hast am {date} kleiner angefangen. Der größere Schritt wartet auf dich. Die Aufgabe hakst du wie gewohnt unter Heute ab.',
    'ui.settings.data.text':
      'QuestArc speichert deine Gewohnheiten und deine Entscheidungen (Reisen, angenommene Schritte, Antworten) nur auf diesem Gerät. Exportiere unter Daten ein Backup, um eine Kopie zu behalten.',
  },
};

/** Replaces the host-naming texts in the language the app speaks. */
export const applyHostTexts = (): void => addTexts(hostTexts[language()] ?? hostTexts.en ?? {});
