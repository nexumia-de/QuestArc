import type { Journey } from '@questarc/engine';

import journeys from 'virtual:questarc-journeys';

/**
 * Built-in journeys shipped with the plugin: every file in
 * content/journeys/ (docs/architecture.md, where data lives), in file-name
 * order. CI checks each one with the journey checker.
 */
export const builtInJourneys: readonly Journey[] = journeys;
