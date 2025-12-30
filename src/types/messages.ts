import { QuestArcState } from './state';

export const MESSAGE_TYPES = {
  // Brain -> UI
  STATE_SYNC: 'STATE_SYNC',
  BOSS_HIT: 'BOSS_HIT',
  LEVEL_UP: 'LEVEL_UP',
  
  // UI -> Brain
  REQUEST_SYNC: 'REQUEST_SYNC',
  DEV_RESET: 'DEV_RESET',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

export interface BaseMessage {
  type: MessageType;
}

export interface StateSyncMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.STATE_SYNC;
  payload: QuestArcState;
}

export interface BossHitMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.BOSS_HIT;
  payload: { damage: number };
}

export interface LevelUpMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.LEVEL_UP;
  payload: { newLevel: number };
}

export interface RequestSyncMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.REQUEST_SYNC;
  payload: null;
}

export interface DevResetMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.DEV_RESET;
  payload: null;
}

export type PluginMessage = 
  | StateSyncMessage 
  | BossHitMessage 
  | LevelUpMessage 
  | RequestSyncMessage 
  | DevResetMessage;
