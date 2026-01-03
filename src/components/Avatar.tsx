import { Component, createMemo, Show } from 'solid-js';
import { AvatarConfig } from '../types/state';

interface AvatarProps {
    level?: number;
    stage?: number; // 0=None, 1=Egg, 2=Baby, 3=Adult
    config?: AvatarConfig;
}

const Avatar: Component<AvatarProps> = (props) => {
    const stage = createMemo(() => props.stage || 0);

    // Default values if config is missing (transitional or fallback)
    const skin = createMemo(() => props.config?.skinColor || '#ffe4c4');
    const bg = createMemo(() => props.config?.bgColor || '#e0e7ff');
    const eyes = createMemo(() => props.config?.eyes || 'neutral');
    const mouth = createMemo(() => props.config?.mouth || 'neutral');

    return (
        <div class="avatar-svg-container" style={{ width: '100%', height: '100%' }}>
            <svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                class="avatar-svg"
                aria-label="Character Avatar"
            >
                <defs>
                    <linearGradient id="eggGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#fef3c7;stop-opacity:1" /> {/* amber-100 */}
                        <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" /> {/* amber-600 */}
                    </linearGradient>

                    <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ 'stop-color': bg(), 'stop-opacity': 1 }} />
                        <stop offset="100%" style={{ 'stop-color': 'rgba(0,0,0,0.1)', 'stop-opacity': 1 }} />
                    </radialGradient>
                </defs>

                {/* 1. Background Circle */}
                <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" stroke="var(--avatar-border, #4f46e5)" stroke-width="4" />

                {/* 2. Base Head (Simple Geometric Shape) */}
                <path
                    d="M30 60 Q30 90 50 90 T70 60 Q70 40 50 40 T30 60Z"
                    fill={skin()}
                />

                {/* 3. Facial Features */}
                <g id="face" transform="translate(0, 5)">
                    {/* Eyes */}
                    <Show when={eyes() === 'neutral'}>
                        <circle cx="43" cy="55" r="3" fill="#1e293b" />
                        <circle cx="57" cy="55" r="3" fill="#1e293b" />
                    </Show>
                    <Show when={eyes() === 'happy'}>
                        <path d="M40 55 Q43 52 46 55" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />
                        <path d="M54 55 Q57 52 60 55" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />
                    </Show>
                    <Show when={eyes() === 'tired'}>
                        <line x1="40" y1="56" x2="46" y2="56" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />
                        <line x1="54" y1="56" x2="60" y2="56" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />
                        <path d="M40 59 Q43 61 46 59" stroke="#94a3b8" stroke-width="1" fill="none" />
                        <path d="M54 59 Q57 61 60 59" stroke="#94a3b8" stroke-width="1" fill="none" />
                    </Show>
                    <Show when={eyes() === 'focus'}>
                        <circle cx="43" cy="55" r="2" fill="#1e293b" />
                        <circle cx="57" cy="55" r="2" fill="#1e293b" />
                        <path d="M38 52 L48 54" stroke="#1e293b" stroke-width="1" />
                        <path d="M52 54 L62 52" stroke="#1e293b" stroke-width="1" />
                    </Show>
                    <Show when={eyes() === 'angry'}>
                        <circle cx="43" cy="55" r="2" fill="#1e293b" />
                        <circle cx="57" cy="55" r="2" fill="#1e293b" />
                        <path d="M38 50 L48 54" stroke="#1e293b" stroke-width="2" />
                        <path d="M52 54 L62 50" stroke="#1e293b" stroke-width="2" />
                    </Show>

                    {/* Mouth */}
                    <Show when={mouth() === 'neutral'}>
                        <path d="M45 65 Q50 68 55 65" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />
                    </Show>
                    <Show when={mouth() === 'smile'}>
                        <path d="M43 63 Q50 72 57 63" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />
                    </Show>
                    <Show when={mouth() === 'frown'}>
                        <path d="M45 68 Q50 63 55 68" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />
                    </Show>
                    <Show when={mouth() === 'surprised'}>
                        <circle cx="50" cy="66" r="3" stroke="#1e293b" stroke-width="2" fill="none" />
                    </Show>
                </g>

                {/* 4. Egg Overlay (If Stage 1) */}
                <Show when={stage() === 1}>
                    <path
                        transform="translate(60, 60) scale(0.4)"
                        d="M50 5 C25 5 5 35 5 65 C5 84.33 25.15 100 50 100 C74.85 100 95 84.33 95 65 C95 35 75 5 50 5Z"
                        fill="url(#eggGradient)"
                        stroke="#92400e"
                        stroke-width="3"
                    />
                </Show>
            </svg>
        </div>
    );
};

export default Avatar;
