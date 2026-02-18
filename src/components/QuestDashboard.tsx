import { createSignal, onMount, For, Show } from 'solid-js';
import { ProjectScannerService, QuestEnvironment } from '../services/scanner.service';
import { QuestManagerService } from '../services/manager.service';
import { useQuestArc } from '../hooks/useQuestArc';

export const QuestDashboard = () => {
    const [env, setEnv] = createSignal<QuestEnvironment | null>(null);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [importMode, setImportMode] = createSignal(false);
    let importRef: HTMLTextAreaElement | undefined;

    // Use the hook for Brain communication
    const { startQuest, pauseQuest, resumeQuest, skipStep } = useQuestArc();

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
        const handleUpdate = (e: CustomEvent) => {
            refresh();
        };
        window.addEventListener('questarc-state-update' as any, handleUpdate as any);
        return () => window.removeEventListener('questarc-state-update' as any, handleUpdate as any);
    });

    const handleStart = async (targetId: string, _isSystem: boolean) => {
        if (env()?.active) return;
        setLoading(true);

        await startQuest(targetId, async () => {
            // On success (brain updated), refresh our local project scan
            await refresh();
        });
        setLoading(false);
    };

    const handlePause = async () => {
        const e = env();
        if (!e?.active) return;
        setLoading(true);

        await pauseQuest(async () => {
            await refresh();
        });
        setLoading(false);
    };

    const handleResume = async (pausedId: string) => {
        if (env()?.active) return;
        setLoading(true);

        await resumeQuest(pausedId, async () => {
            await refresh();
        });
        setLoading(false);
    };

    const handleSkip = async () => {
        if (!confirm('Skip this step? All incomplete tasks will be force-completed.')) return;
        setLoading(true);
        await skipStep(async () => {
            await refresh();
        });
        setLoading(false);
    };

    const handleExport = async (projectId: string) => {
        try {
            setLoading(true);
            const json = await QuestManagerService.exportTemplate(projectId);
            await navigator.clipboard.writeText(json);
            // Optional: plugin success notification?
            setError('Template JSON copied to clipboard! 📋'); // reusing error for status temporarily or use snackbar if available
            setTimeout(() => setError(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to export');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importRef?.value) return;
        try {
            setLoading(true);
            await QuestManagerService.importTemplate(importRef.value);
            setImportMode(false);
            await refresh();
            setError('Import successful! 🎉');
            setTimeout(() => setError(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to import');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class="quest-dashboard">
            <div class="header-row" style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '1rem' }}>
                <h3 style={{ margin: 0 }}>Quest Control Center</h3>
                <div>
                    <button
                        onClick={() => setImportMode(!importMode())}
                        disabled={loading()}
                        class="secondary-btn"
                        style={{ 'margin-right': '0.5rem' }}
                        title="Import Project JSON"
                    >
                        📥 Import
                    </button>
                    <button
                        onClick={refresh}
                        disabled={loading()}
                        class="secondary-btn"
                        title="Refresh"
                    >
                        🔄
                    </button>
                </div>
            </div>

            <Show when={importMode()}>
                <div class="import-box" style={{ 'margin-bottom': '1rem', 'padding': '1rem', 'background': 'var(--bg-card)', 'border': '1px solid var(--border)', 'border-radius': '4px' }}>
                    <h4 style={{ 'margin-top': 0 }}>Import Project JSON</h4>
                    <textarea
                        ref={importRef}
                        placeholder="Paste project JSON here..."
                        style={{ 'width': '100%', 'height': '100px', 'margin-bottom': '0.5rem', 'background': 'var(--bg-input)', 'color': 'var(--text)', 'border': '1px solid var(--border)' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleImport} disabled={loading()} class="primary-btn">Import</button>
                        <button onClick={() => setImportMode(false)} class="secondary-btn">Cancel</button>
                    </div>
                </div>
            </Show>

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
                                <h3>
                                    {env()?.active?.icon && <span style={{ 'margin-right': '0.5rem' }}>{env()?.active?.icon}</span>}
                                    {env()?.active?.originalTitle}
                                </h3>
                                <div class="active-badge">IN PROGRESS</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={handleSkip}
                                    disabled={loading()}
                                    class="secondary-btn"
                                    title="Skip to next step"
                                >
                                    ⏭️ Skip
                                </button>
                                <button
                                    onClick={handlePause}
                                    disabled={loading()}
                                    class="primary-btn"
                                >
                                    Pause
                                </button>
                            </div>
                        </div>
                    </Show>
                </section>

                {/* Templates (From File System) */}
                <section class="dashboard-section" style={{ 'margin-bottom': '1.5rem' }}>
                    <h4 style={{ color: 'var(--primary)', 'margin-bottom': '0.5rem' }}>AVAILABLE TEMPLATES</h4>

                    <div class="story-grid">
                        <For each={env()?.templates}>
                            {(t) => (
                                <div class="story-card">
                                    <span style={{ 'font-weight': 500 }}>
                                        {t.icon && <span style={{ 'margin-right': '0.5rem' }}>{t.icon}</span>}
                                        {t.originalTitle}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleExport(t.id)}
                                            class="secondary-btn"
                                            title="Copy Project JSON"
                                        >
                                            📋
                                        </button>
                                        <button
                                            onClick={() => handleStart(t.id, false)}
                                            disabled={!!env()?.active || loading()}
                                            class="primary-btn"
                                        >
                                            Start
                                        </button>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>

                    <Show when={!env()?.templates?.length}>
                        <div class="empty-state" style={{ padding: '1rem' }}>
                            No templates found. Create a project starting with 📜.
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
