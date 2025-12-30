# Development Setup 🛠️

This project is a **Super Productivity Plugin** using SolidJS.

## ⚠️ Build Process
**Use `npm run build` for production builds.**
The build process automatically inlines JS/CSS into the HTML file via the `@super-productivity/vite-plugin`. This is required for the plugin to work on mobile and desktop as Super Productivity loads plugin HTML as data URLs.

## Prerequisites
* Node.js 18+
* Super Productivity 8.0+

## Quick Start

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Dev Mode (UI Only):**
    ```bash
    npm run dev
    ```
    *Note: In this mode, the UI is isolated. It cannot talk to the real Super Productivity API. You must use the Mock Bridge in `src/app/mock-bridge.ts`.*

3.  **Integration Testing (The Real Deal):**
    1.  Run `npm run package` (this builds and creates a zip file).
    2.  Open Super Productivity.
    3.  Settings -> Plugins -> Load Plugin.
    4.  Select the `.zip` file generated in the project root.

## File Structure


```

src/
├── app/                 # SolidJS UI (The Face)
│   ├── components/      # Reusable UI bits
│   └── App.tsx          # Main View
├── assets/              # Static images/JSONs
├── lib/                 # Shared logic (math, helpers)
├── types/               # Shared TypeScript interfaces
│   ├── messages.ts      # Communication Protocol
│   └── state.ts         # Data Models
├── plugin.ts            # Background Script (The Brain)
└── index.tsx            # IFrame Entry Point

```

## Testing
```bash
npm run test        # Run unit tests
npm run typecheck   # TypeScript type checking
```

## Debugging
* **Background Script:** Logs appear in the main Super Productivity console (Ctrl+Shift+I).
* **UI IFrame:** Right-click the plugin view -> Inspect Frame.

## Build & Package
```bash
npm run build       # Build the plugin (output to dist/)
npm run package     # Build and create .zip for distribution
```