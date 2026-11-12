import { ladders, markers, palette, pictures } from 'virtual:questarc-art';

import { isRequest, type ArtPack, type State } from '../shared/protocol';
import type { Brain } from './brain';
import type { SidePanel } from './side-panel';

/** The ladders' pictures plugin.js carries for the view (#100). */
export const artPack: ArtPack = { pictures, ladders, palette, markers };

/** Answers the view's requests (shared/protocol.ts) from the brain. */
export const handleMessage = async (
  brain: Brain,
  message: unknown,
  panel?: SidePanel,
): Promise<State | ArtPack> => {
  if (!isRequest(message)) throw new Error('QuestArc: unknown request');
  if (message.type === 'questarc:art') return artPack;
  if (message.type === 'questarc:side-panel') panel?.set(message.on);
  const state =
    message.type === 'questarc:write' ? await brain.write(message.records) : await brain.state();
  return panel ? { ...state, sidePanel: panel.on } : state;
};
