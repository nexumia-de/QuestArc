import { Component, Show, createSignal } from 'solid-js';
import { QuestArcState, AvatarConfig } from '../types/state';
import { MESSAGE_TYPES } from '../types/messages';
import { MessageService } from '../services/MessageService';
import Avatar from './Avatar';
import AvatarEditor from './AvatarEditor';
import './CharacterView.css';

interface CharacterViewProps {
    profile: QuestArcState['profile'];
}

const CharacterView: Component<CharacterViewProps> = (props) => {
    const [isEditing, setIsEditing] = createSignal(false);
    const [previewConfig, setPreviewConfig] = createSignal<AvatarConfig | null>(null);

    const handleSaveAvatar = async (config: AvatarConfig) => {
        try {
            // Send updated config to backend
            await MessageService.send(MESSAGE_TYPES.UPDATE_PROFILE, {
                profile: { avatar: config }
            });

            // Optimistic update handled by sync, but we close editor now
            setPreviewConfig(null);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save avatar:', error);
            // Optional: Show user feedback
        }
    };

    const handleCancel = () => {
        setPreviewConfig(null);
        setIsEditing(false);
    };

    return (
        <section class="character-view">
            <div class="hero-card">
                <div class="hero-avatar-section">
                    <div
                        class="hero-avatar-container"
                        onClick={() => !isEditing() && setIsEditing(true)}
                        title={!isEditing() ? "Click to Edit Appearance" : ""}
                    >
                        <div class="hero-avatar-large avatar-wrapper">
                            <Avatar
                                level={props.profile.level}
                                stage={props.profile.pet?.stage}
                                config={previewConfig() || props.profile.avatar}
                            />
                        </div>

                        <div class="hero-level-badge">{props.profile.level}</div>
                    </div>

                    <div class="hero-identity">
                        <h2>Hero</h2> {/* Name not yet in profile, hardcoded for now or add to state */}
                        <span class="hero-class">Adventurer</span>
                    </div>
                </div>

                <Show when={isEditing()}>
                    <AvatarEditor
                        initialConfig={props.profile.avatar}
                        onSave={handleSaveAvatar}
                        onCancel={handleCancel}
                        onChange={setPreviewConfig}
                    />
                </Show>

                <Show when={!isEditing()}>
                    <div class="hero-stats-grid">
                        <div class="stat-box">
                            <span class="stat-label">HP</span>
                            <span class="stat-value hp-val">{props.profile.hp} <span class="stat-max">/ {props.profile.maxHp}</span></span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">XP</span>
                            <span class="stat-value xp-val">{props.profile.xp} <span class="stat-max">/ {props.profile.xpToNextLevel}</span></span>
                        </div>
                    </div>
                </Show>
            </div>

            <Show when={!isEditing() && props.profile.pet}>
                {(pet) => (
                    <div class="pet-details-card">
                        <div class="pet-header">
                            <h3>Companion</h3>
                            <span class="pet-stage-badge">Stage {pet().stage}</span>
                        </div>

                        <div class="pet-showcase">
                            <div class="pet-emoji-large">
                                {pet().stage === 1 ? '🥚' : pet().stage === 2 ? '💧' : '🐉'}
                            </div>
                            <div class="pet-info">
                                <h4>{pet().name}</h4>
                                <p class="pet-lore">
                                    {pet().stage === 1
                                        ? "A mysterious egg. Keep it warm with your achievements."
                                        : pet().stage === 2
                                            ? "A curious hatchling looking for adventure."
                                            : "A mighty dragon, loyal to the end."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Show>
        </section>
    );
};

export default CharacterView;
