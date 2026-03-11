import { Component, createSignal, For, Show } from "solid-js";
import { AppView } from "../hooks/useNavigation";
import {
  QuestArcState,
  CustomTagConfig,
  FrequencyAliasConfig,
  StreakBehaviorConfig,
} from "../types/state";
import { CronHelper } from "../lib/cron";

interface SettingsViewProps {
  settings?: QuestArcState["settings"]; // Optional because state loads async
  onNavigate: (view: AppView) => void;
  onReset: () => void;
  onUpdateSettings: (settings: QuestArcState["settings"]) => void;
}

// Built-in aliases from CronHelper (read-only in UI)
const builtinAliases = CronHelper.BUILTIN_ALIASES;

const SettingsView: Component<SettingsViewProps> = (props) => {
  const [isResetConfirming, setIsResetConfirming] = createSignal(false);

  // Custom Tag State
  const [newTag, setNewTag] = createSignal("");
  const [newTagDamage, setNewTagDamage] = createSignal(10);

  // Custom Frequency Alias State
  const [newAlias, setNewAlias] = createSignal("");
  const [newAliasCron, setNewAliasCron] = createSignal("");

  const handleReset = () => {
    if (!isResetConfirming()) {
      setIsResetConfirming(true);
      setTimeout(() => setIsResetConfirming(false), 3000);
      return;
    }
    props.onReset();
    setIsResetConfirming(false);
  };

  const handleAddTag = () => {
    let tagInput = newTag().trim();
    if (!tagInput) return;

    // Auto-prepend # if missing
    const tag = tagInput.startsWith("#") ? tagInput : `#${tagInput}`;

    const currentTags = props.settings?.customTags || [];
    if (currentTags.some((t) => t.tag.toLowerCase() === tag.toLowerCase()))
      return;

    const newConfig: CustomTagConfig = {
      id: `tag_${Date.now()}`,
      tag,
      damage: newTagDamage(),
    };

    props.onUpdateSettings({
      ...props.settings!, // Assume settings exist if we are here (persistence ensures it)
      customTags: [...currentTags, newConfig],
    });
    setNewTag("");
    setNewTagDamage(10);
  };

  const handleDeleteTag = (id: string) => {
    const currentTags = props.settings?.customTags || [];
    props.onUpdateSettings({
      ...props.settings!,
      customTags: currentTags.filter((t) => t.id !== id),
    });
  };

  const handleUpdateTagDamage = (id: string, damage: number) => {
    const currentTags = props.settings?.customTags || [];
    props.onUpdateSettings({
      ...props.settings!,
      customTags: currentTags.map((t) => (t.id === id ? { ...t, damage } : t)),
    });
  };

  // Frequency Alias Handlers
  const handleAddAlias = () => {
    const alias = newAlias().trim().toLowerCase();
    const cron = newAliasCron().trim();
    if (!alias || !cron) return;

    const currentAliases = props.settings?.customFrequencyAliases || [];
    if (currentAliases.some((a) => a.alias.toLowerCase() === alias)) return;

    const newConfig: FrequencyAliasConfig = {
      id: `alias_${Date.now()}`,
      alias,
      cron,
    };

    props.onUpdateSettings({
      ...props.settings!,
      customFrequencyAliases: [...currentAliases, newConfig],
    });
    setNewAlias("");
    setNewAliasCron("");
  };

  const handleDeleteAlias = (id: string) => {
    const currentAliases = props.settings?.customFrequencyAliases || [];
    props.onUpdateSettings({
      ...props.settings!,
      customFrequencyAliases: currentAliases.filter((a) => a.id !== id),
    });
  };

  const handleUpdateAlias = (
    id: string,
    field: "alias" | "cron",
    value: string,
  ) => {
    const currentAliases = props.settings?.customFrequencyAliases || [];
    props.onUpdateSettings({
      ...props.settings!,
      customFrequencyAliases: currentAliases.map((a) =>
        a.id === id ? { ...a, [field]: value } : a,
      ),
    });
  };

  // Streak Behavior Handler
  const handleUpdateStreakBehavior = (
    updates: Partial<StreakBehaviorConfig>,
  ) => {
    const current = props.settings?.streakBehavior || {};
    props.onUpdateSettings({
      ...props.settings!,
      streakBehavior: { ...current, ...updates },
    });
  };

  // Habit Completion Mode Handler
  const handleSetCompletionMode = (mode: "soft" | "strict") => {
    props.onUpdateSettings({
      ...props.settings!,
      habitCompletionMode: mode,
    });
  };

  // Completion Granularity Handler
  const handleSetCompletionGranularity = (granularity: "daily" | "cycle") => {
    props.onUpdateSettings({
      ...props.settings!,
      completionMinGranularity: granularity,
    });
  };

  // Default values for streak behavior
  const streakDefaults: Required<StreakBehaviorConfig> = {
    gracePeriodsPerCycle: 1,
    decayPercent: 25,
    useTiers: true,
    tierFloors: { bronze: 0, silver: 7, gold: 30, diamond: 60 },
    defaultGraceCron: "",
  };
  const getStreakValue = <K extends keyof StreakBehaviorConfig>(
    key: K,
  ): Required<StreakBehaviorConfig>[K] => {
    const val = props.settings?.streakBehavior?.[key];
    return val !== undefined
      ? (val as Required<StreakBehaviorConfig>[K])
      : streakDefaults[key];
  };

  return (
    <section class="settings-view">
      <div class="settings-header">
        <h2>Settings</h2>
      </div>

      {/* Custom Damage Tags */}
      <div class="settings-section">
        <div class="section-header">
          <h3>Custom Damage Tags</h3>
          <p>Tasks with these tags deal specific damage to bosses.</p>
        </div>
        <div class="settings-card">
          <div class="tags-list">
            <For each={props.settings?.customTags || []}>
              {(tagConfig) => (
                <div class="tag-row">
                  <div class="tag-name">
                    <span class="hash-prefix">#</span>
                    <span class={tagConfig.isSystem ? "system-tag" : ""}>
                      {tagConfig.tag.replace(/^#/, "")}
                    </span>
                  </div>
                  <div class="tag-damage-input">
                    <label>Dmg:</label>
                    <input
                      type="number"
                      value={tagConfig.damage}
                      min="1"
                      onInput={(e) =>
                        handleUpdateTagDamage(
                          tagConfig.id,
                          parseInt(e.currentTarget.value) || 0,
                        )
                      }
                    />
                  </div>
                  <Show when={!tagConfig.isSystem}>
                    <button
                      class="delete-btn"
                      onClick={() => handleDeleteTag(tagConfig.id)}
                    >
                      🗑️
                    </button>
                  </Show>
                  <Show when={tagConfig.isSystem}>
                    <div class="lock-icon" title="System Tag (Cannot Delete)">
                      🔒
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>

          <div class="add-tag-form">
            <span class="input-prefix">#</span>
            <input
              type="text"
              placeholder="tag"
              value={newTag()}
              onInput={(e) => setNewTag(e.currentTarget.value)}
            />
            <input
              type="number"
              placeholder="Dmg"
              value={newTagDamage()}
              min="1"
              onInput={(e) =>
                setNewTagDamage(parseInt(e.currentTarget.value) || 0)
              }
            />
            <button onClick={handleAddTag} disabled={!newTag().trim()}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Frequency Aliases */}
      <div class="settings-section">
        <div class="section-header">
          <h3>Frequency Aliases</h3>
          <p>
            Use words like "daily" or "weekly" in [freq:...] tags. Custom
            aliases take priority.
          </p>
        </div>
        <div class="settings-card">
          {/* Built-in Aliases (Read-only) */}
          <div class="alias-section">
            <h4 class="alias-section-title">Built-in</h4>
            <div class="alias-list">
              <For each={builtinAliases}>
                {(alias) => (
                  <div class="alias-row builtin">
                    <div class="alias-name">{alias.alias}</div>
                    <div class="alias-cron">{alias.cron}</div>
                    <div class="alias-desc">{alias.description}</div>
                    <div class="lock-icon" title="Built-in (read-only)">
                      🔒
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Custom Aliases (Editable) */}
          <div class="alias-section">
            <h4 class="alias-section-title">Custom</h4>
            <div class="alias-list">
              <For each={props.settings?.customFrequencyAliases || []}>
                {(aliasConfig) => (
                  <div class="alias-row">
                    <input
                      type="text"
                      class="alias-name-input"
                      value={aliasConfig.alias}
                      onInput={(e) =>
                        handleUpdateAlias(
                          aliasConfig.id,
                          "alias",
                          e.currentTarget.value,
                        )
                      }
                    />
                    <input
                      type="text"
                      class="alias-cron-input"
                      value={aliasConfig.cron}
                      onInput={(e) =>
                        handleUpdateAlias(
                          aliasConfig.id,
                          "cron",
                          e.currentTarget.value,
                        )
                      }
                      placeholder="0 0 * * *"
                    />
                    <button
                      class="delete-btn"
                      onClick={() => handleDeleteAlias(aliasConfig.id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </For>
            </div>

            <div class="add-alias-form">
              <input
                type="text"
                placeholder="alias"
                value={newAlias()}
                onInput={(e) => setNewAlias(e.currentTarget.value)}
              />
              <input
                type="text"
                placeholder="0 0 * * *"
                value={newAliasCron()}
                onInput={(e) => setNewAliasCron(e.currentTarget.value)}
              />
              <button
                onClick={handleAddAlias}
                disabled={!newAlias().trim() || !newAliasCron().trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Behavior */}
      <div class="settings-section">
        <div class="section-header">
          <h3>🛡️ Streak Behavior</h3>
          <p>
            Configure how streaks handle missed cycles. More forgiving = more
            motivation!
          </p>
        </div>
        <div class="settings-card">
          <div class="streak-settings">
            <div class="streak-row">
              <label>Grace Periods per Cycle</label>
              <input
                type="number"
                min="0"
                max="10"
                value={getStreakValue("gracePeriodsPerCycle")}
                onInput={(e) =>
                  handleUpdateStreakBehavior({
                    gracePeriodsPerCycle: parseInt(e.currentTarget.value) || 0,
                  })
                }
              />
              <span class="streak-hint">Free misses before decay</span>
            </div>

            <div class="streak-row">
              <label>Decay Percent</label>
              <input
                type="number"
                min="0"
                max="100"
                value={getStreakValue("decayPercent")}
                onInput={(e) =>
                  handleUpdateStreakBehavior({
                    decayPercent: parseInt(e.currentTarget.value) || 0,
                  })
                }
              />
              <span class="streak-hint">% lost per miss (0 = hard reset)</span>
            </div>

            <div class="streak-row">
              <label>Bonus Grace Schedule</label>
              <input
                type="text"
                placeholder="0 0 1 * *"
                value={getStreakValue("defaultGraceCron") || ""}
                onInput={(e) =>
                  handleUpdateStreakBehavior({
                    defaultGraceCron: e.currentTarget.value,
                  })
                }
              />
              <span class="streak-hint">
                Cron to earn extra grace (e.g. '0 0 1 * *')
              </span>
            </div>

            <div class="streak-row checkbox-row">
              <input
                type="checkbox"
                id="useTiers"
                checked={getStreakValue("useTiers")}
                onChange={(e) =>
                  handleUpdateStreakBehavior({
                    useTiers: e.currentTarget.checked,
                  })
                }
              />
              <label for="useTiers">Enable Tier Floors</label>
              <span class="streak-hint">
                Protect milestones (never drop below tier)
              </span>
            </div>

            <Show when={getStreakValue("useTiers")}>
              <div class="tier-grid">
                <div class="tier-item">
                  <span class="tier-badge bronze">🥉</span>
                  <span>Bronze Floor</span>
                  <input
                    type="number"
                    min="0"
                    value={
                      (getStreakValue("tierFloors") as { bronze: number })
                        .bronze
                    }
                    onInput={(e) =>
                      handleUpdateStreakBehavior({
                        tierFloors: {
                          ...(getStreakValue("tierFloors") as object),
                          bronze: parseInt(e.currentTarget.value) || 0,
                        } as StreakBehaviorConfig["tierFloors"],
                      })
                    }
                  />
                </div>
                <div class="tier-item">
                  <span class="tier-badge silver">🥈</span>
                  <span>Silver Floor</span>
                  <input
                    type="number"
                    min="0"
                    value={
                      (getStreakValue("tierFloors") as { silver: number })
                        .silver
                    }
                    onInput={(e) =>
                      handleUpdateStreakBehavior({
                        tierFloors: {
                          ...(getStreakValue("tierFloors") as object),
                          silver: parseInt(e.currentTarget.value) || 0,
                        } as StreakBehaviorConfig["tierFloors"],
                      })
                    }
                  />
                </div>
                <div class="tier-item">
                  <span class="tier-badge gold">🥇</span>
                  <span>Gold Floor</span>
                  <input
                    type="number"
                    min="0"
                    value={
                      (getStreakValue("tierFloors") as { gold: number }).gold
                    }
                    onInput={(e) =>
                      handleUpdateStreakBehavior({
                        tierFloors: {
                          ...(getStreakValue("tierFloors") as object),
                          gold: parseInt(e.currentTarget.value) || 0,
                        } as StreakBehaviorConfig["tierFloors"],
                      })
                    }
                  />
                </div>
                <div class="tier-item">
                  <span class="tier-badge diamond">💎</span>
                  <span>Diamond Floor</span>
                  <input
                    type="number"
                    min="0"
                    value={
                      (getStreakValue("tierFloors") as { diamond: number })
                        .diamond
                    }
                    onInput={(e) =>
                      handleUpdateStreakBehavior({
                        tierFloors: {
                          ...(getStreakValue("tierFloors") as object),
                          diamond: parseInt(e.currentTarget.value) || 0,
                        } as StreakBehaviorConfig["tierFloors"],
                      })
                    }
                  />
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Habit Completion Behavior */}
      <div class="settings-section">
        <div class="section-header">
          <h3>🗓️ Habit Completion Behavior</h3>
          <p>
            Control what happens when a habit is completed more than once in a
            cycle.
          </p>
        </div>
        <div class="settings-card">
          <div class="streak-settings">
            <div class="streak-row">
              <label>Completion Mode</label>
              <div class="mode-toggle">
                <button
                  class={`mode-btn ${(props.settings?.habitCompletionMode ?? "soft") === "soft" ? "active" : ""}`}
                  onClick={() => handleSetCompletionMode("soft")}
                  title="Extra completions are silently allowed – no reward, no error (Habitica-style)"
                >
                  🌿 Soft
                </button>
                <button
                  class={`mode-btn ${props.settings?.habitCompletionMode === "strict" ? "active" : ""}`}
                  onClick={() => handleSetCompletionMode("strict")}
                  title="Extra completions are blocked with an error dialog"
                >
                  🔒 Strict
                </button>
              </div>
              <span class="streak-hint">
                {(props.settings?.habitCompletionMode ?? "soft") === "soft"
                  ? "Extra completions pass silently (no XP / damage)"
                  : "Extra completions show a block dialog"}
              </span>
            </div>

            <div class="streak-row">
              <label>Min Reset Granularity</label>
              <select
                class="granularity-select"
                value={props.settings?.completionMinGranularity ?? "daily"}
                onChange={(e) =>
                  handleSetCompletionGranularity(
                    e.currentTarget.value as "daily" | "cycle",
                  )
                }
              >
                <option value="daily">Daily (1 reward per calendar day)</option>
                <option value="cycle">Cycle (1 reward per freq cycle)</option>
              </select>
              <span class="streak-hint">
                {(props.settings?.completionMinGranularity ?? "daily") ===
                "daily"
                  ? "Sub-daily habits (hourly, etc.) still earn at most once per day"
                  : "Sub-daily habits earn for every completed freq cycle"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div class="settings-section">
        <div class="section-header">
          <h3>Reset Game Progress</h3>
          <p>
            Clear all XP, levels, and history. This action cannot be undone.
          </p>
        </div>
        <div class="settings-card">
          <button
            class={`reset-btn ${isResetConfirming() ? "confirming" : ""}`}
            onClick={handleReset}
            style={
              isResetConfirming()
                ? {
                    "border-color": "var(--hp-color)",
                    color: "var(--hp-color)",
                  }
                : {}
            }
          >
            {isResetConfirming() ? "⚠️ Confirm Reset" : "Reset Everything"}
          </button>
        </div>
      </div>

      <style>{`
              .tags-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-bottom: 1rem;
              }
              .tag-row {
                display: flex;
                align-items: center;
                gap: 1rem;
                background: rgba(255, 255, 255, 0.05);
                padding: 0.5rem;
                border-radius: 6px;
              }
              .tag-name {
                flex: 1;
                font-family: monospace;
                font-weight: bold;
                display: flex;
                align-items: center;
              }
              .hash-prefix {
                opacity: 0.3;
                margin-right: 2px;
              }
              .input-prefix {
                font-family: monospace;
                font-weight: bold;
                opacity: 0.5;
                padding: 8px 0 8px 8px;
                display: flex;
                align-items: center;
              }
              .system-tag {
                color: var(--accent-color);
              }
              .tag-damage-input {
                display: flex;
                align-items: center;
                gap: 0.5rem;
              }
              .tag-damage-input input {
                width: 60px;
                padding: 4px;
                border-radius: 4px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.2);
                color: white;
              }
              .delete-btn {
                background: none;
                border: none;
                cursor: pointer;
                opacity: 0.7;
              }
              .delete-btn:hover {
                opacity: 1;
              }
              .lock-icon {
                font-size: 0.9em;
                opacity: 0.5;
                padding: 0 5px;
              }
              .add-tag-form {
                display: flex;
                gap: 0.5rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255,255,255,0.1);
              }
              .add-tag-form input {
                 padding: 8px;
                 border-radius: 6px;
                 border: 1px solid rgba(255,255,255,0.2);
                 background: rgba(0,0,0,0.2);
                 color: white;
              }
              .add-tag-form button {
                 padding: 8px 16px;
                 border-radius: 6px;
                 background: var(--primary-color);
                 color: white;
                 border: none;
                 cursor: pointer;
              }
              .add-tag-form button:disabled {
                 opacity: 0.5;
                 cursor: not-allowed;
              }
              
              /* Frequency Alias Styles */
              .alias-section {
                margin-top: 1rem;
              }
              .alias-section-title {
                font-size: 0.9rem;
                opacity: 0.7;
                margin-bottom: 0.5rem;
              }
              .alias-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                max-height: 200px;
                overflow-y: auto;
              }
              .alias-row {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(255, 255, 255, 0.05);
                padding: 0.5rem;
                border-radius: 6px;
              }
              .alias-row.builtin {
                opacity: 0.8;
              }
              .alias-name {
                font-family: monospace;
                font-weight: bold;
                min-width: 80px;
              }
              .alias-cron {
                font-family: monospace;
                color: var(--accent-color);
                min-width: 100px;
              }
              .alias-desc {
                flex: 1;
                font-size: 0.85rem;
                opacity: 0.6;
              }
              .alias-name-input,
              .alias-cron-input {
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.2);
                color: white;
                font-family: monospace;
              }
              .alias-name-input {
                width: 100px;
              }
              .alias-cron-input {
                flex: 1;
              }
              .add-alias-form {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.5rem;
              }
              .add-alias-form input {
                padding: 8px;
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.2);
                color: white;
              }
              .add-alias-form button {
                padding: 8px 16px;
                border-radius: 6px;
                background: var(--primary-color);
                color: white;
                border: none;
                cursor: pointer;
              }
              .add-alias-form button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
              
              /* Streak Behavior Styles */
              .streak-settings {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-top: 1rem;
              }
              .streak-row {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex-wrap: wrap;
              }
              .streak-row label {
                min-width: 180px;
                font-weight: 500;
              }
              .streak-row input[type="number"] {
                width: 80px;
                padding: 6px 8px;
                border-radius: 4px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.2);
                color: white;
                text-align: center;
              }
              .streak-row.checkbox-row {
                gap: 0.5rem;
              }
              .streak-row.checkbox-row input[type="checkbox"] {
                width: 18px;
                height: 18px;
                accent-color: var(--accent-color);
              }
              .streak-row.checkbox-row label {
                min-width: auto;
              }
              .streak-hint {
                font-size: 0.85rem;
                opacity: 0.6;
                font-style: italic;
              }
              .tier-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
                margin-top: 0.5rem;
                padding: 0.75rem;
                background: rgba(255,255,255,0.03);
                border-radius: 8px;
              }
              .tier-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
              }
              .tier-item input {
                width: 60px;
                padding: 4px 6px;
                border-radius: 4px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.2);
                color: white;
                text-align: center;
              }
              .tier-badge {
                font-size: 1.2rem;
              }
              .tier-badge.bronze { filter: sepia(1) saturate(2) hue-rotate(5deg); }
              .tier-badge.silver { filter: brightness(1.2) saturate(0); }
              .tier-badge.gold { filter: sepia(1) saturate(3) hue-rotate(15deg) brightness(1.1); }
              .tier-badge.diamond { filter: hue-rotate(180deg) saturate(1.5); }

              /* Habit Completion Mode Styles */
              .mode-toggle {
                display: flex;
                gap: 0.25rem;
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 6px;
                overflow: hidden;
              }
              .mode-btn {
                padding: 5px 14px;
                background: rgba(255,255,255,0.05);
                border: none;
                color: rgba(255,255,255,0.6);
                cursor: pointer;
                font-size: 0.9rem;
                transition: background 0.15s, color 0.15s;
              }
              .mode-btn:hover {
                background: rgba(255,255,255,0.1);
                color: white;
              }
              .mode-btn.active {
                background: var(--accent-color, #7c6ff7);
                color: white;
                font-weight: 600;
              }
              .granularity-select {
                padding: 6px 10px;
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.2);
                background: rgba(0,0,0,0.25);
                color: white;
                font-size: 0.9rem;
                cursor: pointer;
              }
            `}</style>
    </section>
  );
};

export default SettingsView;
