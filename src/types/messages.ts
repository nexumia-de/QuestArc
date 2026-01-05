import { QuestArcState, HeroStory } from './state';

export enum MESSAGE_TYPES {
  REQUEST_SYNC = 'REQUEST_SYNC',
  DEV_RESET = 'DEV_RESET',
  SAVE_STORY = 'SAVE_STORY',
  START_QUEST = 'START_QUEST',
  ADD_STEP_TASKS = 'ADD_STEP_TASKS',
  ACKNOWLEDGE_COMPLETION = 'ACKNOWLEDGE_COMPLETION',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  DELETE_STORY = 'DELETE_STORY',
  CANCEL_QUEST = 'CANCEL_QUEST',
}

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

export interface AcknowledgeCompletionMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.ACKNOWLEDGE_COMPLETION;
  payload?: null;
}

export interface UpdateProfileMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.UPDATE_PROFILE;
  payload: { profile: Partial<QuestArcState['profile']> };
}

export interface DeleteStoryMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.DELETE_STORY;
  payload: { storyId: string };
}

export interface CancelQuestMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.CANCEL_QUEST;
  payload?: null;
}

export type PluginMessage = RequestSyncMessage | DevResetMessage | SaveStoryMessage | StartQuestMessage | AddStepTasksMessage | AcknowledgeCompletionMessage | UpdateProfileMessage | DeleteStoryMessage | CancelQuestMessage;
