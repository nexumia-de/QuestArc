import { QuestArcState } from '../types/state';
import { PluginService } from './PluginService';

export class HeaderService {
    static updateHeader(state: QuestArcState) {
        // Note: Header buttons can't be dynamically updated after registration
        // This is called once during init. For dynamic updates, users should open the plugin UI

        const onClick = () => PluginService.api.showIndexHtmlAsView();

        if (state.activeBoss && !state.activeBoss.isDead) {
            PluginService.api.registerHeaderButton({
                label: `👹 ${state.activeBoss.hp}/${state.activeBoss.maxHp} HP`,
                icon: 'skull',
                onClick,
            });
        } else {
            // WORKAROUND: The API strictly falls back to Material Text for icons, breaking Data URIs.
            // We register with a unique placeholder ('crop_free') and then use a MutationObserver
            // to physically replace the DOM element's content with our custom SVG image.
            const PLACEHOLDER_ICON = 'crop_free';

            PluginService.api.registerHeaderButton({
                label: `XP: ${state.profile.xp}/${state.profile.xpToNextLevel}`,
                icon: PLACEHOLDER_ICON,
                onClick,
            });

            // Initiate the DOM Replacement
            this.replacePlaceholderWithIcon(state, PLACEHOLDER_ICON);
        }
    }

    private static replacePlaceholderWithIcon(state: QuestArcState, placeholder: string) {
        // Generate the specific SVG for the current state
        const dataUri = this.generateXpIcon(state.profile.level, state.profile.xp, state.profile.xpToNextLevel);

        // Observer to locate the placeholder in the DOM once rendered by Angular
        const observer = new MutationObserver((mutations, obs) => {
            // Look for all mat-icon elements
            const iconElements = document.querySelectorAll('mat-icon');

            for (const el of Array.from(iconElements)) {
                // If we find our specific placeholder text
                if (el.textContent?.trim() === placeholder) {
                    // 1. Clear the text content (removing the 'crop_free' ligature)
                    el.textContent = '';

                    // 2. Inject our custom Image
                    const img = document.createElement('img');
                    img.src = dataUri;

                    // Enforce strict 24x24 styling to match Material spec
                    img.style.width = '24px';
                    img.style.height = '24px';
                    img.style.display = 'block';
                    img.style.pointerEvents = 'none'; // Ensure clicks pass through to button

                    el.appendChild(img);

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
