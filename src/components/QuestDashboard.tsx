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
        const handleUpdate = () => {
            // In a real app we'd receive the full state, but here our dashboard expects QuestEnvironment (scanner result)
            // So we should probably just re-scan.
            refresh();
        };
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
        <div class="quest-dashboard p-4 bg-gray-900 text-white rounded-lg">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">Quest Control Center</h2>
                <button
                    onClick={refresh}
                    disabled={loading()}
                    class="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                    🔄
                </button>
            </div>

            <Show when={error()}>
                <div class="bg-red-500/20 border border-red-500 p-2 mb-4 rounded text-sm text-red-200">
                    {error()}
                </div>
            </Show>

            {/* Warnings */}
            <Show when={env()?.warnings && env()!.warnings.length > 0}>
                <div class="bg-yellow-500/20 border border-yellow-500 p-2 mb-4 rounded text-sm text-yellow-200">
                    <For each={env()?.warnings}>
                        {(w) => <div>⚠️ {w}</div>}
                    </For>
                </div>
            </Show>

            <Show when={!env()}>
                <div>Loading QuestArc...</div>
            </Show>

            <Show when={env()}>
                {/* Active Quest Section */}
                <section class="mb-8">
                    <h3 class="text-lg font-semibold mb-2 text-yellow-400">Active Quest</h3>
                    <Show when={env()?.active} fallback={
                        <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center text-gray-400 italic">
                            No active quest. Start a journey below!
                        </div>
                    }>
                        <div class="bg-gray-800 p-4 rounded-lg border border-yellow-500/30 flex justify-between items-center shadow-lg">
                            <div>
                                <div class="text-xl font-bold">{env()?.active?.originalTitle}</div>
                                <div class="text-xs text-yellow-500 mt-1 uppercase tracking-wider">In Progress 🧭</div>
                            </div>
                            <button
                                onClick={handlePause}
                                disabled={loading()}
                                class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                Pause
                            </button>
                        </div>
                    </Show>
                </section>

                {/* Templates Section */}
                <section class="mb-8">
                    <h3 class="text-lg font-semibold mb-2 text-blue-400">Available Stories</h3>
                    <Show when={env()?.templates?.length !== 0} fallback={
                        <div class="text-sm text-gray-500">
                            No templates found. Create a project starting with 📜.
                        </div>
                    }>
                        <div class="space-y-2">
                            <For each={env()?.templates}>
                                {(t) => (
                                    <div class="bg-gray-800 p-3 rounded flex justify-between items-center hover:bg-gray-700 transition-colors">
                                        <span class="font-medium">{t.originalTitle}</span>
                                        <button
                                            onClick={() => handleStart(t.id)}
                                            disabled={!!env()?.active || loading()}
                                            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm text-center"
                                        >
                                            Start
                                        </button>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </section>

                {/* Paused Section */}
                <Show when={env()?.paused && env()!.paused.length > 0}>
                    <section>
                        <h3 class="text-lg font-semibold mb-2 text-gray-400">Saved Games</h3>
                        <div class="space-y-2">
                            <For each={env()?.paused}>
                                {(p) => (
                                    <div class="bg-gray-800/50 p-3 rounded flex justify-between items-center border border-gray-700 border-dashed">
                                        <span class="text-gray-300">{p.originalTitle}</span>
                                        <button
                                            onClick={() => handleResume(p.id)}
                                            disabled={!!env()?.active || loading()}
                                            class="bg-green-700 hover:bg-green-800 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
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
