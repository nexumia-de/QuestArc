import { QuestArcState } from './state';

export const MESSAGE_TYPES = {
  // UI -> Brain (Brain cannot push to UI, only respond)
  REQUEST_SYNC: 'REQUEST_SYNC',
  DEV_RESET: 'DEV_RESET',
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

export type PluginMessage = RequestSyncMessage | DevResetMessage;
