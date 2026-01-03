import { createSignal } from 'solid-js';
import { HeroStory } from '../types/state';

export type AppView = 'dashboard' | 'editor' | 'story-list' | 'settings' | 'character' | 'inventory';

export function useNavigation() {
    const [view, setView] = createSignal<AppView>('dashboard');
    const [editingStory, setEditingStory] = createSignal<HeroStory | null>(null);

    const goToDashboard = () => {
        setEditingStory(null);
        setView('dashboard');
    };

    const goToStoryList = () => {
        setView('story-list');
    };

    const goToEditor = (story?: HeroStory) => {
        setEditingStory(story || null);
        setView('editor');
    };

    const goToSettings = () => {
        setView('settings');
    };

    return {
        view,
        setView,
        editingStory,
        goToDashboard,
        goToStoryList,
        goToEditor,
        goToSettings
    };
}
