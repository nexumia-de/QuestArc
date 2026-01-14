import { createSignal, onMount, For, Show } from 'solid-js';
import { ProjectScannerService, QuestEnvironment } from '../services/scanner.service';
import { QuestManagerService } from '../services/manager.service';

export const QuestDashboard = () => {
    const [env, setEnv] = createSignal<QuestEnvironment | null>(null);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ProjectScannerService.scan();
            setEnv(data);
        } catch (err: any) {
            setError(err.message || 'Failed to scan projects');
        } finally {
            setLoading(false);
        }
    };

    onMount(() => {
        refresh();
        const handleUpdate = () => refresh();
        window.addEventListener('questarc-state-update' as any, handleUpdate as any);
        return () => window.removeEventListener('questarc-state-update' as any, handleUpdate as any);
    });

    const handleStart = async (templateId: string) => {
        if (env()?.active) return;
        setLoading(true);
        try {
            const newEnv = await QuestManagerService.startQuest(templateId);
            setEnv(newEnv);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePause = async () => {
        const e = env();
        if (!e?.active) return;
        setLoading(true);
        try {
            const newEnv = await QuestManagerService.pauseQuest(e.active.id);
            setEnv(newEnv);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResume = async (pausedId: string) => {
        if (env()?.active) return;
        setLoading(true);
        try {
            const newEnv = await QuestManagerService.resumeQuest(pausedId);
            setEnv(newEnv);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class="quest-dashboard">
            <div class="header-row" style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '1rem' }}>
                <h3 style={{ margin: 0 }}>Quest Control Center</h3>
                <button
                    onClick={refresh}
                    disabled={loading()}
                    class="secondary-btn"
                    title="Refresh"
                >
                    🔄
                </button>
            </div>

            <Show when={error()}>
                <div class="error-message" style={{ 'margin-bottom': '1rem' }}>
                    {error()}
                </div>
            </Show>

            <Show when={env()?.warnings && env()!.warnings.length > 0}>
                <div class="info-box" style={{ 'margin-bottom': '1rem', 'border-color': 'var(--xp-color)' }}>
                    <For each={env()?.warnings}>
                        {(w) => <div>⚠️ {w}</div>}
                    </For>
                </div>
            </Show>

            <Show when={!env()}>
                <div class="loading-state">Loading QuestArc...</div>
            </Show>

            <Show when={env()}>
                {/* Active Quest */}
                <section class="dashboard-section" style={{ 'margin-bottom': '1.5rem' }}>
                    <h4 style={{ color: 'var(--xp-color)', 'margin-bottom': '0.5rem' }}>ACTIVE QUEST</h4>
                    <Show when={env()?.active} fallback={
                        <div class="empty-state" style={{ padding: '1rem' }}>
                            No active quest. Start a journey below!
                        </div>
                    }>
                        <div class="story-card active">
                            <div class="story-info">
                                <h3>{env()?.active?.originalTitle}</h3>
                                <div class="active-badge">IN PROGRESS</div>
                            </div>
                            <button
                                onClick={handlePause}
                                disabled={loading()}
                                class="primary-btn"
                            >
                                Pause
                            </button>
                        </div>
                    </Show>
                </section>

                {/* Templates */}
                <section class="dashboard-section" style={{ 'margin-bottom': '1.5rem' }}>
                    <h4 style={{ color: 'var(--primary)', 'margin-bottom': '0.5rem' }}>AVAILABLE STORIES</h4>
                    <Show when={env()?.templates?.length !== 0} fallback={
                        <div class="empty-state" style={{ padding: '1rem' }}>
                            No templates found. Create a project starting with 📜.
                        </div>
                    }>
                        <div class="story-grid">
                            <For each={env()?.templates}>
                                {(t) => (
                                    <div class="story-card">
                                        <span style={{ 'font-weight': 500 }}>{t.originalTitle}</span>
                                        <button
                                            onClick={() => handleStart(t.id)}
                                            disabled={!!env()?.active || loading()}
                                            class="primary-btn"
                                        >
                                            Start
                                        </button>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </section>

                {/* Saved Games */}
                <Show when={env()?.paused && env()!.paused.length > 0}>
                    <section class="dashboard-section">
                        <h4 style={{ color: 'var(--text-muted)', 'margin-bottom': '0.5rem' }}>SAVED GAMES</h4>
                        <div class="story-grid">
                            <For each={env()?.paused}>
                                {(p) => (
                                    <div class="story-card" style={{ opacity: 0.8 }}>
                                        <span>{p.originalTitle}</span>
                                        <button
                                            onClick={() => handleResume(p.id)}
                                            disabled={!!env()?.active || loading()}
                                            class="secondary-btn"
                                        >
                                            Resume
                                        </button>
                                    </div>
                                )}
                            </For>
                        </div>
                    </section>
                </Show>
            </Show>
        </div>
    );
};
