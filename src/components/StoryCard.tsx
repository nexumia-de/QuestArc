import { Component } from 'solid-js';

interface StoryCardProps {
    title: string;
    stepsCount: number;
    totalXp: number;
    isActive: boolean;
    onEdit: (e: MouseEvent) => void;
}

const StoryCard: Component<StoryCardProps> = (props) => {
    return (
        <div class="story-card">
            <div class="story-info">
                <h3>{props.title}</h3>
                <div class="story-meta">
                    <span>👣 {props.stepsCount} Steps</span>
                    <span>✨ {props.totalXp} XP</span>
                </div>
            </div>
            {props.isActive && <div class="active-badge">Active</div>}
            <button class="edit-btn" onClick={props.onEdit} title="Edit Story">
                ✏️
            </button>
        </div>
    );
};

export default StoryCard;
