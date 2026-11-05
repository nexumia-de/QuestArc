/**
 * Command-line wrapper for GNOME's JavaScript runtime (gjs), used by
 * Pensum: reads a snapshot as JSON from stdin, writes the game view as
 * JSON to stdout. Run with `gjs -m engine-cli.mjs < snapshot.json`.
 */
import Gio from 'gi://Gio';

import { evaluate } from './evaluate';
import type { Snapshot } from './snapshot';

declare const print: (text: string) => void;

const [, bytes] = Gio.File.new_for_path('/dev/stdin').load_contents(null);
const snapshot = JSON.parse(new TextDecoder().decode(bytes)) as Snapshot;
print(JSON.stringify(evaluate(snapshot)));
