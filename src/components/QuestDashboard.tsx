import { createSignal, onMount, For, Show } from 'solid-js';
import { ProjectScannerService, QuestEnvironment } from '../services/scanner.service';
import { QuestManagerService } from '../services/manager.service';
import { Persistence } from '../lib/persistence';

export const QuestDashboard = () => {
    const [env, setEnv] = createSignal<QuestEnvironment | null>(null);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    // Add Game State signal for Boss UI
    const [gameState, setGameState] = createSignal<any>(null); // Type as 'any' for speed, ideal: QuestArcState

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
        // Initial load of game state
        try {
            const state = Persistence.loadState();
            setGameState(state);
        } catch (e) { }

        const handleUpdate = (e: CustomEvent) => {
            refresh();
            // Also update game state for boss UI
            if (e.detail) {
                setGameState(e.detail);
            }
        };
        window.addEventListener('questarc-state-update' as any, handleUpdate as any);
        return () => window.removeEventListener('questarc-state-update' as any, handleUpdate as any);
    });

    const handleStart = async (targetId: string, _isSystem: boolean) => {
        if (env()?.active) return;
        setLoading(true);
        try {
            const newEnv = await QuestManagerService.startQuest(targetId);
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
                                <h3>
                                    {env()?.active?.icon && <span style={{ 'margin-right': '0.5rem' }}>{env()?.active?.icon}</span>}
                                    {env()?.active?.originalTitle}
                                </h3>
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

                    {/* BOSS BATTLE UI */}
                    <Show when={gameState()?.activeBoss && !gameState()?.activeBoss.isDead}>
                        <div class="boss-card" style={{
                            'margin-top': '1rem',
                            'background': `linear-gradient(135deg, #1a1a1a, ${gameState()?.activeBoss?.themeColor || '#4a0000'})`,
                            'padding': '1.5rem',
                            'border-radius': '8px',
                            'color': 'white',
                            'text-align': 'center',
                            'border': '2px solid #ff4444'
                        }}>
                            <h2 style={{ 'margin-top': 0 }}>⚔️ BOSS BATTLE ⚔️</h2>
                            {gameState()?.activeBoss?.image && (
                                gameState()?.activeBoss?.image.startsWith('http') ?
                                    <img src={gameState()?.activeBoss?.image} style={{ 'max-width': '100px', 'border-radius': '50%', 'margin-bottom': '1rem' }} /> :
                                    <div style={{ 'font-size': '4rem', 'margin-bottom': '0.5rem' }}>{gameState()?.activeBoss?.image}</div>
                            )}
                            <h3>{gameState()?.activeBoss?.name || 'Unknown Boss'}</h3>

                            <div class="health-bar-container" style={{ 'background': '#333', 'height': '20px', 'border-radius': '10px', 'margin': '1rem 0', 'overflow': 'hidden' }}>
                                <div class="health-bar-fill" style={{
                                    'background': '#ff4444',
                                    'height': '100%',
                                    'width': `${(gameState()?.activeBoss?.hp / gameState()?.activeBoss?.maxHp) * 100}%`,
                                    'transition': 'width 0.5s ease-out'
                                }}></div>
                            </div>
                            <div style={{ 'font-weight': 'bold', 'font-size': '1.2rem' }}>
                                HP: {gameState()?.activeBoss?.hp} / {gameState()?.activeBoss?.maxHp}
                            </div>
                            <p style={{ 'font-size': '0.9rem', 'opacity': 0.8 }}>
                                Complete tasks to deal damage!
                            </p>
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
                                    <button
                                        onClick={() => handleStart(t.id, false)}
                                        disabled={!!env()?.active || loading()}
                                        class="primary-btn"
                                    >
                                        Start
                                    </button>
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
