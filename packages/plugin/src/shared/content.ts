import type { Journey } from '@questarc/engine';

import journeys from 'virtual:questarc-journeys';

import { addJourneyTexts } from './texts';

/**
 * Built-in journeys shipped with the plugin: every file in
 * content/journeys/ (docs/architecture.md, where data lives), in file-name
 * order. CI checks each one with the journey checker. Their texts join
 * the shared texts here, for plugin.js.
 */
export const builtInJourneys: readonly Journey[] = journeys;
addJourneyTexts(builtInJourneys);
