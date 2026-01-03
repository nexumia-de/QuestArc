import { QuestArcState, HeroStory } from './state';

export const MESSAGE_TYPES = {
  // UI -> Brain (Brain cannot push to UI, only respond)
  REQUEST_SYNC: 'REQUEST_SYNC',
  DEV_RESET: 'DEV_RESET',
  // UI -> Brain: Save a new story
  SAVE_STORY: 'SAVE_STORY',
  // UI -> Brain: Start a quest (set active story)
  START_QUEST: 'START_QUEST',
  // UI -> Brain: Add tasks for the current step to the host app
  ADD_STEP_TASKS: 'ADD_STEP_TASKS',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

export interface BaseMessage {
  type: MessageType;
}

export interface RequestSyncMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.REQUEST_SYNC;
  payload?: null;
}

export interface DevResetMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.DEV_RESET;
  payload?: null;
}

export interface SaveStoryMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.SAVE_STORY;
  payload: HeroStory;
}

export interface StartQuestMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.START_QUEST;
  payload: { storyId: string };
}

export interface AddStepTasksMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.ADD_STEP_TASKS;
  payload?: null;
}

export type PluginMessage = RequestSyncMessage | DevResetMessage | SaveStoryMessage | StartQuestMessage | AddStepTasksMessage;
