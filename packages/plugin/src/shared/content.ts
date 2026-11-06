import type { Journey } from '@questarc/engine';

import gentleMorning from '../../../../content/journeys/gentle-morning.json';

/** Built-in journeys shipped with the plugin (docs/architecture.md, where data lives). */
export const builtInJourneys: readonly Journey[] = [gentleMorning as Journey];
