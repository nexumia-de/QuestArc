# Plan 101: Human Readable Dates 📅

## Goal
Allow users to easily "fix" their history by editing a human-readable date in the task notes, instead of dealing with raw timestamps.

## The Problem
Currently, `lastUpdated` is a raw timestamp (e.g., `1769976109750`). Users cannot easily edit this to "backdate" a task (e.g., "I actually did this yesterday").

## Proposed Solution
Add a `lastDoneDate` string field to the JSON structure.

### JSON Structure
```json
{
  "progress": {
    "current": 1,
    "lastUpdated": 1769976109750,
    "lastDoneDate": "2026-02-01T20:00:00.000Z" // NEW
  }
}
```

### Logic Changes (`game-logic.ts`)
1.  **Reading**:
    -   When checking `lastUpdated`, first look for `lastDoneDate`.
    -   If `lastDoneDate` exists, parse it.
    -   If valid, use it as `lastUpdated`. (This allows user edits to take effect).
2.  **Writing**:
    -   When updating task progress, WRITE `lastDoneDate` as an ISO string.

## UX Flow
1.  User forgets to tick task yesterday.
2.  Today, user opens task notes.
3.  User changes `"lastDoneDate": "2026-02-02..."` to `"2026-02-01..."`.
4.  User ticks task.
5.  System reads "Feb 1", calculates cycles passed, and correctly awards "Streak Kept" instead of "Streak Reset".
