import { ladders, markers, palette, pictures } from 'virtual:questarc-art';

import { isRequest, type ArtPack, type State } from '../shared/protocol';
import type { Brain } from './brain';
import type { SettingsEntry } from './settings-entry';
import type { SidePanel } from './side-panel';

/** The ladders' pictures plugin.js carries for the view (#100). */
export const artPack: ArtPack = { pictures, ladders, palette, markers };

/** Answers the view's requests (shared/protocol.ts) from the brain. */
export const handleMessage = async (
  brain: Brain,
  message: unknown,
  panel?: SidePanel,
  settings?: SettingsEntry,
): Promise<State | ArtPack> => {
  if (!isRequest(message)) throw new Error('QuestArc: unknown request');
  if (message.type === 'questarc:art') return artPack;
  if (message.type === 'questarc:side-panel') panel?.set(message.on);
  const state =
    message.type === 'questarc:write' ? await brain.write(message.records) : await brain.state();
  const answer = panel ? { ...state, sidePanel: panel.on } : state;
  // The settings button of the plugin list (#67): once, with a get.
  return message.type === 'questarc:get' && settings?.take()
    ? { ...answer, openSettings: true }
    : answer;
};
