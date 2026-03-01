# 054 - Consistency Refactor

## Goal

Address consistency issues 5-10 from the audit list.

## Issues & Fixes

### 5. Import Organization

**Standard**:

1. External deps (`solid-js`, etc.)
2. Types (`../types/...`)
3. Libs/Services (`../lib/...`, `../services/...`)
4. Components (`./...`)
5. CSS (`./...css`)

**Targets**:

- `App.tsx`
- `DashboardView.tsx`

### 6. Props Naming

**Standard**: Exported `[ComponentName]Props`.
**Targets**:

- Verify all major components follow this.
- (Search found most are good, but will double check `App.tsx` internal components if any).

### 7. Component Wrappers

**Standard**: Top-level Views should use `<section class="[view-name]">`.
**Targets**:

- [x] `StoryListView` (Already section)
- [x] `DashboardView` (Already section)
- [ ] `CharacterView` (div -> section)
- [ ] `InventoryView` (div -> section)
- [ ] `SettingsView` (div -> section)

### 8. State Management

**Standard**: Use `createMemo` for derived state that involves array operations or calculation.
**Targets**:

- `DashboardView.tsx`: `currentStep` derived function -> `createMemo`.

### 9. Boolean Naming

**Standard**: `is[Condition]` or `has[Condition]`. Avoid `show[Element]`.
**Targets**:

- `StoryListView.tsx` (Already fixed in 053).
- Check `DashboardView` for any `show...` flags.

### 10. Inline Styles

**Standard**: Use classes for static styles. Use CSS variables for dynamic themes where possible.
**Targets**:

- `DashboardView.tsx`: Refactor standard styles to CSS. Keep dynamic properties (width/color) as inline styles but verify if they can be cleaner.

## Plan

### Refactor Views

#### [MODIFY] [CharacterView.tsx](file:///home/deck/Projects/QuestArc/src/components/CharacterView.tsx)

- Change root `div` to `section`.
- Organize imports.

#### [MODIFY] [InventoryView.tsx](file:///home/deck/Projects/QuestArc/src/components/InventoryView.tsx)

- Change root `div` to `section`.
- Organize imports.

#### [MODIFY] [SettingsView.tsx](file:///home/deck/Projects/QuestArc/src/components/SettingsView.tsx)

- Change root `div` to `section`.
- Organize imports.

### Refactor Dashboard

#### [MODIFY] [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx)

- Organize imports.
- Convert `currentStep` to `createMemo`.

### Refactor App

#### [MODIFY] [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)

- Organize imports.

## Verification

- Build project.
- Visual check that changing `div` to `section` didn't break layout (it shouldn't, unless explicit `div` selectors exist in CSS).
