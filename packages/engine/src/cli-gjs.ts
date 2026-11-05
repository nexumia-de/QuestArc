/**
 * Command-line wrapper for GNOME's JavaScript runtime (gjs), used by
 * Pensum and by the gjs test of the vectors. Reads one request as JSON
 * from stdin and prints the answer as JSON:
 *   { "evaluate": Snapshot }                 → GameView
 *   { "diff": { "before": GameView, "after": GameView } } → GameEvent[]
 *   { "batch": [request, …] }                → [answer, …]
 * Run with `gjs -m engine-cli.mjs < request.json`.
 */
import GioUnix from 'gi://GioUnix';

import { diff } from './diff';
import { evaluate } from './evaluate';
import type { Snapshot } from './types/snapshot';
import type { GameView } from './types/view';

declare const print: (text: string) => void;

type Request =
  { evaluate: Snapshot } | { diff: { before: GameView; after: GameView } } | { batch: Request[] };

const answer = (request: Request): unknown => {
  if ('evaluate' in request) return evaluate(request.evaluate);
  if ('diff' in request) return diff(request.diff.before, request.diff.after);
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
