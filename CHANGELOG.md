# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.0.1](https://codeberg.org/Nexumia/QuestArc/compare/v1.0.0...v1.0.1) (2026-01-06)

### Features

- add story JSON import and export functionality ([3557b79](https://codeberg.org/Nexumia/QuestArc/commit/3557b7908063d274100bfc3cbc68955afa46b9cd))
- Implement dynamic circular XP progress icon in header via DOM injection workaround and update XP display. ([de76934](https://codeberg.org/Nexumia/QuestArc/commit/de769343be232f2b00a383ca7706f9b1261594cd))
- implement dynamic story loading from assets using glob and add a new getting-started story. ([9c744fa](https://codeberg.org/Nexumia/QuestArc/commit/9c744fa6d7332a83d45eb5cabf53a3480579a5b7))
- implement quest cancellation and enhance confirmation dialog with custom actions for active quests. ([596e9bf](https://codeberg.org/Nexumia/QuestArc/commit/596e9bf29406de02872c74c918cb1f5840b1b6b0))
- Implement story deletion and quest cancellation, and refactor game state constants. ([c46ea04](https://codeberg.org/Nexumia/QuestArc/commit/c46ea041add01dc925cd0d638af2eb8590fc250d))
- Implement view routing, refactor plugin utilities, and add new documentation and UI components. ([e86ad8d](https://codeberg.org/Nexumia/QuestArc/commit/e86ad8d2863f71995491ec1301332d421f319eae))
- introduce one-time header button registration and XP icon pulse animation on gain ([2fb21f1](https://codeberg.org/Nexumia/QuestArc/commit/2fb21f1d94d8867f08323d45acb178aa00029537))
- optimize header XP icon updates by reusing existing DOM element instead of re-injecting. ([6fedb74](https://codeberg.org/Nexumia/QuestArc/commit/6fedb74a0fa8728a97bfc5d962f384670e2fe085))
- simplify header to always display dynamic XP icon with updated text and tooltip, removing boss-related UI. ([83a8271](https://codeberg.org/Nexumia/QuestArc/commit/83a82719b6e5dddd5b7fa3fc4e1687d8e58d503d))

### Bug Fixes

- footer alignment in NavBar by adjusting CSS centering properties and adding box-sizing. ([a41faca](https://codeberg.org/Nexumia/QuestArc/commit/a41facadc96c277de952ba3a40aa32757d0cfda9))
- Prevent infinite XP gain by adding early return checks in task completion handlers and game logic, and improving debug logging. ([a5e946c](https://codeberg.org/Nexumia/QuestArc/commit/a5e946c5573dab5509cb196deeb51c3a67c84760))
