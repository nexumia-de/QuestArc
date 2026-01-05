# QuestArc UI Guidelines & Best Practices

**Goal:** Create a seamless, "native" feel that integrates perfectly with Super Productivity, while delivering a gamified experience that doesn't distract from actual work.

## 🎨 QuestArc Design System

The plugin runs in an isolated `iframe`, meaning we must manually replicate the host's look and feel. We use a set of CSS variables in `src/app/App.css` to define our theme.

### Color Palette (The "Source of Truth")

Always use these CSS variables instead of hardcoded hex values.

| Variable | Description | Light Mode | Dark Mode |
| :--- | :--- | :--- | :--- |
| `--primary` | Main action color (Buttons, Highlights) | `#6366f1` (Indigo) | `#6366f1` |
| `--bg` | App background | `#f8fafc` | `#0f172a` |
| `--card-bg` | Card/Container background | `#ffffff` | `#1e293b` |
| `--text` | Primary text color | `#1e293b` | `#f1f5f9` |
| `--text-muted` | Secondary/Help text | `#64748b` | `#94a3b8` |
| `--hp-color` | Health/Danger indicators | `#ef4444` (Red) | `#ef4444` |
| `--xp-color` | Experience/Progress indicators | `#fbbf24` (Amber) | `#fbbf24` |

### Spacing & Layout
*   **Container Width:** Max `600px` for the main content to mimic a mobile-first/panel view.
*   **Padding:** Default container padding is `1.5rem`.
*   **Border Radius:** Use `12px` for cards and `6px` for small elements (buttons, bars).

## 📱 Mobile & Iframe Constraints

Since QuestArc runs in an `iframe` within the Super Productivity "Face":

1.  **No Scroll Hijacking:** Avoid blocking main window scrolling. The plugin lives in a side panel or modal.
2.  **Touch Targets:** Buttons must be at least **44x44px** for mobile usability.
3.  **Responsive Text:** Use `rem` for font sizes. Base font is standard `sans-serif` (Inter/System UI).
4.  **Polling, Not Pushing:** Remember the UI updates via polling. Avoid animations that require perfect sync with the backend (Brain) as there may be a 2s delay.

## 🛑 The "7 Design Sins" (Adapted for Productivity)

### 1. Information Overload
**Don't** clutter the dashboard. A user is here to work, not manage a cockpit.
*   **Do:** Show simple progress bars (HP/XP) at glance.
*   **Do:** Hide detailed stats behind a click or hover.

### 2. Bad Typography
**Don't** use decorative game fonts for body text.
*   **Do:** Use standard sans-serif for readability.
*   **Do:** Use **Bold** or Color for hierarchy, not font size changes alone.

### 3. Meaningless Numbers
**Don't** show "XP: 450/1200" without visual context.
*   **Do:** Use a progress bar. Visual > Numerical.

### 4. Poor Contrast
**Don't** let text blend into the background.
*   **Do:** Strictly follow the Light/Dark mode variable mappings. Test every component in both modes.

### 5. Inconsistent "Hot Actions"
**Don't** change the color of the primary action button.
*   **Do:** If "Complete Quest" is `--primary` (Indigo), don't make "Attack Boss" `--hp-color` (Red) unless it's a destructive action.

### 6. Ignoring the Medium (Web/iframe)
**Don't** assume a cursor.
*   **Do:** Design for touch first. Hover states are a nice-to-have, not a requirement for functionality.

### 7. Unnecessary Friction
**Don't** verify every action with a modal.
*   **Do:** Make "Undo" available instead of asking "Are you sure?" for reversible actions.

## 🧩 Component Library

### Progress Bars
Use `.xp-bar-container` and `.hp-bar-container`. 
*   **Height:** `12px`
*   **Radius:** `6px`
*   **Structure:**
    ```html
    <div class="xp-bar-container">
      <div class="xp-bar-fill" style={{ width: `${pct}%` }}></div>
    </div>
    ```

### Cards (`.step-card`)
Use for grouping related information.
*   **Background:** `var(--card-bg)` (Adapts to light/dark)
*   **Shadow:** `0 1px 3px 0 rgb(0 0 0 / 0.1)`
*   **Border:** `1px solid var(--border)` (Crucial for dark mode separation)

### Buttons
*   **Primary:** `background-color: var(--primary); color: white;`
*   **Secondary:** `background-color: transparent; border: 1px solid var(--border);`

### Modals (`ConfirmDialog`)
Use the shared `ConfirmDialog` component for confirmations.
*   **Usage:** Destructive actions or major context switches (e.g., Restarting a Quest).
*   **Don't:** Build custom modals unless absolutely necessary.
*   **Pattern:**
    ```tsx
    <ConfirmDialog
      isOpen={isOpen()}
      title="Are you sure?"
      message="This action cannot be undone."
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
    ```

## 🌙 Dark Mode Implementation
The host application injects a `dark-theme` class (or similar) on the body tag of the iframe, OR we rely on media queries. QuestArc uses CSS variables to handle this automatically.

**Rule:** NEVER set a fixed white (`#fff`) or black (`#000`) background on a container. Always use `var(--bg)` or `var(--card-bg)`.

```css
:root {
  --bg: #f8fafc;
  --card-bg: #ffffff;
  --text: #1e293b;
  --border: #e2e8f0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --card-bg: #1e293b;
    --text: #f1f5f9;
    --border: #334155;
  }
}
```

## 🎥 Animations
Keep animations simple and CSS-based to avoid jank.

*   **Transitions:** Use `transition: all 0.2s ease-in-out;` on interactive elements.
*   **Progress Bars:** Animate `width` changes.
    ```css
    .xp-bar-fill {
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    ```
*   **Avoid:** Complex JS-driven animations that require frame-perfect sync with the Brain.
