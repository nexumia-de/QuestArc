import { QuestArcState } from "../types/state";
import { PluginService } from "./PluginService";

export class HeaderService {
  private static isRegistered = false;
  private static lastXp = -1;

  static updateHeader(state: QuestArcState) {
    const onClick = () => PluginService.api.showIndexHtmlAsView();

    // 1. Register Button (Once Only)
    if (!this.isRegistered) {
      PluginService.api.registerHeaderButton({
        label: `XP: ${state.profile.xp}/${state.profile.xpToNextLevel}`,
        icon: "crop_free", // Placeholder
        onClick,
      });
      this.isRegistered = true;
    }

    // 2. Dynamic Updates (Always run, no boss check)
    this.replacePlaceholderWithIcon(state, "crop_free");
  }

  private static replacePlaceholderWithIcon(
    state: QuestArcState,
    placeholder: string,
  ) {
    // Generate the specific SVG for the current state
    const dataUri = this.generateXpIcon(
      state.profile.level,
      state.profile.xp,
      state.profile.xpToNextLevel,
    );
    const ICON_ID = "quest-arc-xp-icon";
    const TEXT_ID = "quest-arc-header-text";
    const currentXp = state.profile.xp;
    const tooltipText = `XP: ${state.profile.xp}/${state.profile.xpToNextLevel}`;

    // 1. Check if the icon is already injected
    const existingImg = document.getElementById(ICON_ID) as HTMLImageElement;
    if (existingImg) {
      existingImg.src = dataUri;

      // Update Label Text (Visual)
      const textSpan = document.getElementById(TEXT_ID);
      if (textSpan) {
        textSpan.textContent = tooltipText;
      }

      // Update Tooltip (Title attribute on button)
      const button = existingImg.closest("button");
      if (button) {
        button.title = tooltipText;
      }

      // Pulse animation only if XP has increased (and it's not the first load)
      if (this.lastXp !== -1 && currentXp > this.lastXp) {
        existingImg.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.2)" },
            { transform: "scale(1)" },
          ],
          {
            duration: 300,
            easing: "ease-out",
          },
        );
      }
      this.lastXp = currentXp;
      return;
    }

    // 2. If not found, observe the DOM to find the placeholder
    const observer = new MutationObserver((_mutations, obs) => {
      // Look for all mat-icon elements
      const iconElements = document.querySelectorAll("mat-icon");

      for (const el of Array.from(iconElements)) {
        // If we find our specific placeholder text (or if we already injected and missed it)
        if (el.textContent?.trim() === placeholder) {
          // Clear the icon text content
          el.textContent = "";

          // Inject our custom Image
          const img = document.createElement("img");
          img.id = ICON_ID;
          img.src = dataUri;
          img.style.width = "24px";
          img.style.height = "24px";
          img.style.display = "block";
          img.style.pointerEvents = "none";

          el.appendChild(img);

          // Find and update the label text & Tooltip
          const button = el.closest("button");
          if (button) {
            button.title = tooltipText; // Set initial tooltip

            // Find label span to tag it for updates
            const spans = button.querySelectorAll("span");
            let found = false;
            for (const span of Array.from(spans)) {
              if (span.textContent?.includes("XP:")) {
                span.id = TEXT_ID;
                span.textContent = tooltipText;
                found = true;
                break;
              }
            }
            if (!found) {
              const label = button.querySelector(".mdc-button__label");
              if (label) {
                label.id = TEXT_ID;
                label.textContent = tooltipText;
              }
            }
          }

          // Initialize lastXp to prevent animation on first load
          HeaderService.lastXp = currentXp;

          // Stop observing; job done
          obs.disconnect();
          return;
        }
      }
    });

    // Watch the body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Safety: Disconnect after 10 seconds
    setTimeout(() => observer.disconnect(), 10000);
  }

  private static generateXpIcon(
    level: number,
    xp: number,
    xpToNext: number,
  ): string {
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
