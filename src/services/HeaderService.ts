import { QuestArcState } from '../types/state';
import { PluginService } from './PluginService';

export class HeaderService {
    private static isRegistered = false;
    private static lastXp = -1;

    static updateHeader(state: QuestArcState) {
        const onClick = () => PluginService.api.showIndexHtmlAsView();

        // 1. Register Button (Once Only)
        if (!this.isRegistered) {
            if (state.activeBoss && !state.activeBoss.isDead) {
                PluginService.api.registerHeaderButton({
                    label: `👹 ${state.activeBoss.hp}/${state.activeBoss.maxHp} HP`,
                    icon: 'skull',
                    onClick,
                });
            } else {
                // Register with placeholder
                PluginService.api.registerHeaderButton({
                    // id property removed to fix lint error
                    label: 'QuestArc XP',   // Static label since API doesn't support updates
                    icon: 'crop_free',
                    onClick,
                });
            }
            this.isRegistered = true;
        }

        // 2. Dynamic Updates (Always run for XP icon)
        if (!state.activeBoss || state.activeBoss.isDead) {
            this.replacePlaceholderWithIcon(state, 'crop_free');
        }
    }

    private static replacePlaceholderWithIcon(state: QuestArcState, placeholder: string) {
        // Generate the specific SVG for the current state
        const dataUri = this.generateXpIcon(state.profile.level, state.profile.xp, state.profile.xpToNextLevel);
        const ICON_ID = 'quest-arc-xp-icon';
        const currentXp = state.profile.xp;

        // 1. Check if the icon is already injected
        const existingImg = document.getElementById(ICON_ID) as HTMLImageElement;
        if (existingImg) {
            existingImg.src = dataUri;

            // Pulse animation only if XP has increased (and it's not the first load)
            if (this.lastXp !== -1 && currentXp > this.lastXp) {
                existingImg.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.2)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 300,
                    easing: 'ease-out'
                });
            }
            this.lastXp = currentXp;
            return;
        }

        // 2. If not found, observe the DOM to find the placeholder
        const observer = new MutationObserver((_mutations, obs) => {
            // Look for all mat-icon elements
            const iconElements = document.querySelectorAll('mat-icon');

            for (const el of Array.from(iconElements)) {
                // If we find our specific placeholder text
                if (el.textContent?.trim() === placeholder) {
                    // Clear the text content (removing the 'crop_free' ligature)
                    el.textContent = '';

                    // Inject our custom Image
                    const img = document.createElement('img');
                    img.id = ICON_ID; // Mark it so we can find it later
                    img.src = dataUri;

                    // Enforce strict 24x24 styling to match Material spec
                    img.style.width = '24px';
                    img.style.height = '24px';
                    img.style.display = 'block';
                    img.style.pointerEvents = 'none'; // Ensure clicks pass through to button

                    el.appendChild(img);

                    // Initialize lastXp to prevent animation on first load
                    HeaderService.lastXp = currentXp;

                    // Stop observing; job done
                    obs.disconnect();
                    return;
                }
            }
        });

        // Watch the body for changes (since we don't know exactly where the header listens)
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Safety: Disconnect after 10 seconds if not found to prevent memory leaks
        setTimeout(() => observer.disconnect(), 10000);
    }

    private static generateXpIcon(level: number, xp: number, xpToNext: number): string {
        const radius = 10;
        const centerX = 12;
        const centerY = 12;
        const circumference = 2 * Math.PI * radius;
        const progress = Math.min(Math.max(xp / Math.max(xpToNext, 1), 0), 1);
        const dashOffset = circumference * (1 - progress);

        // Standard 24x24 SVG
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3" />
            <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#fbbf24" stroke-width="2"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
                    transform="rotate(-90 ${centerX} ${centerY})" stroke-linecap="round" />
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
                  fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="10">
                ${level}
            </text>
        </svg>`.trim();

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
}
