import { Component, createSignal, For } from 'solid-js';
import { AvatarConfig } from '../types/state';

interface AvatarEditorProps {
    initialConfig: AvatarConfig;
    onSave: (config: AvatarConfig) => void;
    onCancel: () => void;
    onChange?: (config: AvatarConfig) => void;
}

const AvatarEditor: Component<AvatarEditorProps> = (props) => {
    // Local state for the editor
    const [config, setConfig] = createSignal<AvatarConfig>({ ...props.initialConfig });

    const updateConfig = (key: keyof AvatarConfig, value: any) => {
        const newConfig = { ...config(), [key]: value };
        setConfig(newConfig);
        if (props.onChange) {
            props.onChange(newConfig);
        }
    };

    const colors = ['#ffe4c4', '#fca5a5', '#d1d5db', '#a3e635', '#60a5fa'];
    const bgColors = ['#e0e7ff', '#fee2e2', '#fef3c7', '#dcfce7', '#f3e8ff'];
    const eyes = ['neutral', 'happy', 'tired', 'focus', 'angry'];
    const mouths = ['neutral', 'smile', 'frown', 'surprised'];

    return (
        <div class="avatar-editor">
            <h3>Customize Hero</h3>

            <div class="editor-section">
                <label>Skin Tone</label>
                <div class="color-picker">
                    <For each={colors}>
                        {(color) => (
                            <button
                                class={`color-swatch ${config().skinColor === color ? 'selected' : ''}`}
                                style={{ 'background-color': color }}
                                onClick={() => updateConfig('skinColor', color)}
                            />
                        )}
                    </For>
                </div>
            </div>

            <div class="editor-section">
                <label>Backdrop</label>
                <div class="color-picker">
                    <For each={bgColors}>
                        {(color) => (
                            <button
                                class={`color-swatch ${config().bgColor === color ? 'selected' : ''}`}
                                style={{ 'background-color': color }}
                                onClick={() => updateConfig('bgColor', color)}
                            />
                        )}
                    </For>
                </div>
            </div>

            <div class="editor-section">
                <label>Eyes</label>
                <div class="option-grid">
                    <For each={eyes}>
                        {(eye) => (
                            <button
                                class={`option-btn ${config().eyes === eye ? 'selected' : ''}`}
                                onClick={() => updateConfig('eyes', eye)}
                            >
                                {eye}
                            </button>
                        )}
                    </For>
                </div>
            </div>

            <div class="editor-section">
                <label>Mouth</label>
                <div class="option-grid">
                    <For each={mouths}>
                        {(mouth) => (
                            <button
                                class={`option-btn ${config().mouth === mouth ? 'selected' : ''}`}
                                onClick={() => updateConfig('mouth', mouth)}
                            >
                                {mouth}
                            </button>
                        )}
                    </For>
                </div>
            </div>

            <div class="editor-actions">
                <button class="secondary-btn" onClick={props.onCancel}>Cancel</button>
                <button class="primary-btn" onClick={() => props.onSave(config())}>Save Look</button>
            </div>
        </div>
    );
};

export default AvatarEditor;
