/**
 * Command-line wrapper for GNOME's JavaScript runtime (gjs), used by
 * Pensum and by the gjs test of the vectors. Reads one request as JSON
 * from stdin and prints the answer as JSON:
 *   { "evaluate": Snapshot }                 → GameView
 *   { "diff": { "before": GameView, "after": GameView } } → GameEvent[]
 *   { "evaluateHost": HostInput }           → GameView (from raw SP objects)
 *   { "action": { "name": "startJourney", "args": [ … ] } } → record changes
 *   { "guardWrite": { "view": GameView, "changes": { … } } } → { changes, refused }
 *   { "batch": [request, …] }                → [answer, …]
 * Run with `gjs -m engine-cli.mjs < request.json`.
 */
import GioUnix from 'gi://GioUnix';

import { actions } from './actions';
import { diff } from './diff';
import { evaluate } from './evaluate';
import { guardWrite } from './guard';
import { snapshotFromHost, type HostInput } from './host-data';
import type { Snapshot } from './types/snapshot';
import type { GameView } from './types/view';

declare const print: (text: string) => void;

type Action = { name: keyof typeof actions; args: unknown[] };
type Request =
  | { evaluate: Snapshot }
  | { evaluateHost: HostInput }
  | { diff: { before: GameView; after: GameView } }
  | { action: Action }
  | { guardWrite: { view: GameView; changes: Record<string, unknown> } }
  | { batch: Request[] };

const act = ({ name, args }: Action): unknown => {
  const fn = Object.hasOwn(actions, name) ? (actions[name] as (...a: unknown[]) => unknown) : null;
  return fn ? fn(...args) : { error: `unknown action ${String(name)}` };
};

const answer = (request: Request): unknown => {
  if ('evaluate' in request) return evaluate(request.evaluate);
  if ('evaluateHost' in request) return evaluate(snapshotFromHost(request.evaluateHost));
  if ('diff' in request) return diff(request.diff.before, request.diff.after);
  if ('action' in request) return act(request.action);
  if ('guardWrite' in request)
    return guardWrite(request.guardWrite.view, request.guardWrite.changes);
  if ('batch' in request) return request.batch.map(answer);
  return { error: 'unknown request' };
};

/** Reads all of stdin as a stream; works with pipes and sockets alike. */
const readStdin = (): string => {
  const stream = new GioUnix.InputStream({ fd: 0, close_fd: false });
  const chunks: Uint8Array[] = [];
  for (;;) {
    const bytes = stream.read_bytes(65536, null);
    if (bytes.get_size() === 0) break;
    chunks.push(bytes.toArray());
  }
  const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(all);
};

print(JSON.stringify(answer(JSON.parse(readStdin()) as Request)));
