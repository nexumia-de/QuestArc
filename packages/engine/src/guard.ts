import { RUN_KINDS } from './choices';
import type { RecordChanges } from './actions';
import type { GameView } from './types/view';

/**
 * The last check before a host writes choice records (docs/data-model.md
 * §2, data format): a change that touches a read-only run, or a kind this
 * engine does not write, is refused as a whole, so an older host neither
 * adds to a run of a newer engine nor withdraws a record it does not
 * understand, and never writes half an action.
 */

/** Kinds this engine writes; `journey` is an imported journey. */
const WRITTEN_KINDS: ReadonlySet<string> = new Set([
  'settings',
  'journey',
  ...[...RUN_KINDS].filter((kind) => kind !== 'graduation'),
]);

export interface GuardedChanges {
  /** The changes to write: all of them, or none when one key is refused. */
  readonly changes: RecordChanges;
  /** Keys that made the change refused. */
  readonly refused: readonly string[];
}

export const guardWrite = (view: GameView, changes: RecordChanges): GuardedChanges => {
  const readOnly = new Set(view.readOnly.map((run) => run.runId));
  const refused = Object.keys(changes).filter((key) => {
    const [kind = '', id] = key.split(':');
    if (!WRITTEN_KINDS.has(kind)) return true;

    return RUN_KINDS.has(kind) && id !== undefined && readOnly.has(id);
  });
  return { changes: refused.length > 0 ? {} : changes, refused };
};
