import { createSignal, onMount, onCleanup } from 'solid-js';
import { QuestArcState } from '../types/state';
import { MESSAGE_TYPES } from '../types/messages';
import { MessageService } from '../services/MessageService';
import { logger } from '../lib/logger';

export function useStateSync() {
    const [state, setState] = createSignal<QuestArcState | null>(null);

    const refetch = async () => {
        try {
            const newState = await MessageService.send(MESSAGE_TYPES.REQUEST_SYNC) as QuestArcState;

            // Always update state on explicit refetch/broadcast
            // The BroadcastChannel only fires on actual changes, so we trust it.
            if (newState) {
                setState(newState);
            }
        } catch (error) {
            logger.error('Failed to sync state:', error);
        }
    };

    onMount(async () => {
        // Initial fetch
        await refetch();

        // Listen for updates from the Brain
        const updateChannel = new BroadcastChannel('quest-arc-updates');
        updateChannel.onmessage = () => {
            logger.debug('Received update signal via BroadcastChannel');
            refetch();
        };

        onCleanup(() => {
            updateChannel.close();
        });
    });

    return { state, setState, refetch };
}
