import { createSignal, onMount, onCleanup } from 'solid-js';
import { QuestArcState } from '../types/state';
import { MESSAGE_TYPES } from '../types/messages';
import { STATE_POLL_INTERVAL_MS } from '../lib/constants';
import { MessageService } from '../services/MessageService';
import { logger } from '../lib/logger';

export function useStateSync() {
    const [state, setState] = createSignal<QuestArcState | null>(null);

    const hasStateChanged = (oldState: QuestArcState, newState: QuestArcState): boolean => {
        if (!oldState || !newState) return true;

        if (oldState.profile.level !== newState.profile.level) return true;
        if (oldState.profile.xp !== newState.profile.xp) return true;
        if (oldState.profile.hp !== newState.profile.hp) return true;
        if (oldState.profile.pet.stage !== newState.profile.pet.stage) return true;

        if (oldState.activeStory.id !== newState.activeStory.id) return true;
        if (oldState.activeStory.currentStepId !== newState.activeStory.currentStepId) return true;

        // Note: streakProgress check removed as it is no longer in the schema

        const oldBoss = oldState.activeBoss;
        const newBoss = newState.activeBoss;

        if ((oldBoss === null) !== (newBoss === null)) return true;

        if (oldBoss && newBoss) {
            if (oldBoss.hp !== newBoss.hp) return true;
            if (oldBoss.isDead !== newBoss.isDead) return true;
        }

        if (oldState.stories.length !== newState.stories.length) return true;

        return false;
    };

    onMount(async () => {
        try {
            const initialState = await MessageService.send(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
            setState(initialState);
        } catch (e) {
            logger.error('Failed initial sync', e);
        }

        const intervalId = setInterval(async () => {
            try {
                const newState = await MessageService.send(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;
                const currentState = state();

                // If we have no state, or if state has meaningfully changed, update it.
                if (!currentState || hasStateChanged(currentState, newState)) {
                    setState(newState);
                }
            } catch (error) {
                logger.error('Failed to sync state:', error);
            }
        }, STATE_POLL_INTERVAL_MS);

        onCleanup(() => clearInterval(intervalId));
    });

    return { state, setState };
}
