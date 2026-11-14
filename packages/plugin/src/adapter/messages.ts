import { isRequest, type ContentPack, type State } from '../shared/protocol';
import { language } from '../shared/texts';
import type { Brain } from './brain';
import { contentPack } from './content-pack';
import type { SettingsEntry } from './settings-entry';
import type { ShowJourney } from './show-journey';
import type { SidePanel } from './side-panel';

/** Answers the view's requests (shared/protocol.ts) from the brain. */
export const handleMessage = async (
  brain: Brain,
  message: unknown,
  panel?: SidePanel,
  settings?: SettingsEntry,
  journey?: Pick<ShowJourney, 'take'>,
): Promise<State | ContentPack> => {
  if (!isRequest(message)) throw new Error('QuestArc: unknown request');
  if (message.type === 'questarc:content') return contentPack();
  if (message.type === 'questarc:side-panel') panel?.set(message.on);
  const state =
    message.type === 'questarc:write' ? await brain.write(message.records) : await brain.state();
  // The view compares the language with the one of its content (#39).
  const told = { ...state, language: language() };
  const answer = panel ? { ...told, sidePanel: panel.on } : told;
  // The settings button of the plugin list (#67): once, with a get.
  if (message.type !== 'questarc:get') return answer;
  // The message's action Show (flow A): once, with a get.
  const shown = journey?.take() ? { ...answer, openJourney: true } : answer;
  return settings?.take() ? { ...shown, openSettings: true } : shown;
};
