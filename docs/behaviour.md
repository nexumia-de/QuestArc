---
type: Concept
title: Behaviour
description: Host-neutral description of every screen, flow and text of QuestArc, and where each lands in Super Productivity and in Pensum, so both hosts behave the same.
tags: [behaviour, ui, screens, flows, texts]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Behaviour

What the user sees and can do, the same in both hosts. Widgets differ
(Super Productivity's look in the plugin, libadwaita in Pensum); screens,
flows, texts and order do not. Rules behind it: [design rules](psychology.md),
[game rules](game-rules.md), [data model](data-model.md). The look of
the journey is in [journey design](journey-design.md).

## Principles for every screen

- Works at 360 × 720 and on the desktop; no horizontal scrolling; touch
  targets at least 44 × 44 px.
- The main action of a screen is at the bottom (thumb reach); title,
  back and menu at the top.
- States are shown with text and shape, never by colour alone.
- No text field is focused when a screen opens.
- Calm mode shows the same screens without XP, level, guardians or
  game words.
- Texts are autonomy-supportive ("you could"), never controlling or
  blaming, and never promise a number of days.

## Screens

### 1. Welcome (first start)

- Two sentences: what QuestArc does ("QuestArc turns a habit into a
  journey of small steps.") and how ("You keep using your normal tasks;
  QuestArc shows where you are on the way.").
- Choice: **Calm** (selected) or **With game** (XP, levels, guardians).
  "You can change this any time."
- Link: "How QuestArc motivates you" (screen 11).
- Main action: **Choose a journey**.

### 2. Choose a journey

- List of journeys: title, description, number of stations, "Written
  by …" when the journey names an author, the first step as a plan
  sentence ("After lunch, I will put on my walking shoes (at the
  door).").
- Tapping one opens its preview: description, "Written by …" when
  present, all stations as plan sentences.
- Main action in the preview: **Start this journey**.
- Only one journey runs at a time; if one is active, starting another
  pauses it after a confirmation that says so (it can be resumed).

### 3. Start a journey

- **Your reason** (optional): the journey's `why` prompt and a text
  field, not focused. "Only you see this."
- **When to start**: Today (default), Next Monday, The 1st of next month,
  Pick a date.
- **Plan check** (optional, collapsed): wish, best outcome, main
  obstacle, "If …, then I will …".
- Main action: **Start**. Then the flow "Set up the task" (flow B) for
  the first stage.

### 4. Journey (home)

- Top: journey title; in RPG mode the level; menu (Pause or Resume,
  End journey, Shelf, Settings). **End journey** happens at once and
  offers **Undo** (it writes one record, withdrawn by Undo).
- Middle: the path ([journey design](journey-design.md)), scrolled to the
  current station; finished stations below, coming ones above.
- Bottom card, the current station:
  - the plan sentence;
  - progress of the condition in words and a bar ("4 of 5 days in the
    last week");
  - "Current run 6 · best 9 · 23 in total"; a gap is shown as a gap, not
    as a loss;
  - in RPG mode the guardian with its HP;
  - the main action, depending on the state:

| Station state                   | Main action                                         |
| ------------------------------- | --------------------------------------------------- |
| unbound (no recurring task yet) | **Set up the task** (flow B)                        |
| unsupported repeat              | **Change how often** (explains the supported kinds) |
| current, condition not met      | none: the habit is done in the task list            |
| met                             | **Continue** (flow C)                               |

- A banner on top of the card when needed: paused (with **Resume**, or a
  note that the repeat is paused in Super Productivity), a hard week
  (flow D, with the user's reason), weekly look back due (**Answer**), the
  station's learning nugget once on arrival (**Got it**), habit can
  graduate (later, #22). Dismissing a banner and skipping the weekly
  question are remembered on the device only; they are not choices.
- The card also shows the user's own reason, if they gave one.
- Tapping any station opens its details (screen 5).

### 5. Station details

- Arrival story (if any), the plan sentence, schedule, condition, the
  guardian (RPG), the learning nugget as a card titled **Try this**.
- Finished stations show the day they were finished, their best run and
  XP (RPG).

### 6. Weekly look back

- Shown once per week when the user opens QuestArc and the current stage
  is at least 7 days old; never as a notification.
- The last 7 due days as marks: done, gap, not due, paused (shape and
  label, not only colour); current and best run.
- One question, the habit filled in: "**Walking after lunch** is
  something I do automatically" with 1 (not at all) to 7 (completely).
- Actions: the seven answers, **Skip**.

### 7. Shelf

- Finished journeys: title, start and end day.
- Maintained habits: habits of finished journeys that keep repeating,
  with their current run.
- Graduated habits: plan sentence, graduation day, "Bring it back".

### 8. Settings

- Mode: Calm / With game.
- "How QuestArc motivates you".
- **Remove QuestArc's data**: withdraws all of QuestArc's records, never
  tasks; it cannot be undone, so it asks first, in place.
- Data: "QuestArc stores only your choices (journeys, accepted stages,
  answers) with your Super Productivity data. Removing the plugin deletes
  them on all your devices."

### 9. How QuestArc motivates you

Plain words, one paragraph each: small steps that grow; one plan "after
X, I will Y"; one missed day is fine, two in a row start a new run but
never end the journey; welcome back after a gap; the weekly question;
graduation when a habit runs by itself. What QuestArc does not do:
random rewards, rankings, punishment, collecting data. "Success is your
habit, not how often you open QuestArc."

## Flows

### A. Completing a task

The user ticks off the stage's task in the task list as usual. Within a
second QuestArc shows a short message (snack or toast):

| Event                        | Calm                                         | With game                                                                                    |
| ---------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| completion                   | "Drink a glass of water: done. 4 of 5 days." | "+10 XP · 4 of 5 days."                                                                      |
| first completion after a gap | "Welcome back. Your run goes on."            | "Welcome back! +20 XP, the guardian staggers." (without a guardian: "Welcome back! +20 XP.") |
| several at once (sync)       | "3 days done. 4 of 5 days."                  | "3 days done · 4 of 5 days."                                                                 |
| condition met                | "Station reached: you can continue."         | same, plus "Level 3." when it changes                                                        |
| guardian defeated            | —                                            | "The Heavy Blanket is gone."                                                                 |

The events of one change are joined into one message, so messages after
a sync with many changes are summed up in one. The progress ("4 of 5
days") is the current condition: days, times or minutes.

All texts of screens and messages are in `content/i18n/en.json` (keys
`ui.*` and `event.*`; a message key ends in `.calm` or `.rpg` when the
modes differ), next to the journeys' texts, so Pensum can use the same
words.

### B. Set up the task

Per [recurring-task setup](decisions/recurring-task-setup.md):

1. "Your plan: After lunch, I will walk for 5 minutes. Suggested: daily."
2. **Create the task**: QuestArc creates the task and opens it. "Open
   the task, choose Schedule Task, then Repeat, and set it to: Every day.
   QuestArc picks it up by itself." The station waits until the task
   repeats.
3. Or **Use an existing task**: a picker of recurring tasks with a
   supported schedule.
4. If the schedule is not supported: "Journeys work with daily, every
   few days or chosen weekdays."

In Pensum, step 2 creates the repeat itself.

### C. Continue to the next stage

1. The station's acceptance story and the next stage's plan sentence.
2. **Continue** writes the checkpoint and accepts the next stage, then
   flow B for its task.
3. "You could end or change your earlier task 'walk for 5 minutes' so
   you don't keep both." with **Open the earlier task**; QuestArc never
   ends it itself.
4. Last stage: the ending story, the journey moves to the shelf, the
   habit stays as a maintained habit.

### D. Hard days

- After one missed due day: nothing special; the gap shows on the path.
- After the second missed due day in a row: banner "A hard week? On hard
  days, doing the earlier step (walk for 5 minutes) counts too." with
  **Good to know**. Doing the smaller step and ticking off the task
  counts as a completion.
- The next completion is welcomed back (flow A).

### E. Pause and resume

Menu → **Pause journey**: banner "Paused since 12 Nov. Paused days don't
count." with **Resume**. Pausing the repeat in Super Productivity has the
same effect.

### F. Graduation

- When the habit qualifies ([game rules](game-rules.md) §7): banner "This
  habit seems to run by itself. You could let it graduate." with
  **Graduate** and **Not now**.
- Graduate: "Keep it repeating quietly" (default) or "End the repeat"
  (opens the task in Super Productivity). The habit moves to the shelf.
- Check-ins 2 and 6 weeks later ask the weekly question once; a low
  answer offers **Bring it back**.

### G. Problems

| Situation                                                  | What the user sees                                                                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the bound repeat was deleted                               | Station unbound: "The task for this station is gone." **Set up the task**                                                                                 |
| Super Productivity older than the plugin needs             | "QuestArc needs Super Productivity 19.3 or newer."                                                                                                        |
| journey definition changed while walking                   | Nothing, unless the current stage was removed: "This journey was updated; you continue at …"                                                              |
| no journey yet                                             | Empty state with **Choose a journey**                                                                                                                     |
| plugin.js not running yet (app start, update, switched on) | "QuestArc is starting. This page updates by itself in a moment." The view retries every second                                                            |
| plugin.js still not answering after 20 s                   | "QuestArc is not running. Check that it is switched on in Settings → Plugins, then reload Super Productivity."                                            |
| plugin.js answers with an error                            | "QuestArc could not read your data. It tries again every few seconds. If this message stays, reload Super Productivity." and "Details: …" with the reason |
| a page whose journey or station is gone                    | "This page is out of date: the journey or station changed. Go back to continue."                                                                          |

These messages stand between the header and the screen and go away with
the first answer, also when the data did not change in between.

## Where it lands in each host

| Part               | Super Productivity plugin                                                                                                                             | Pensum                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Entry and level    | header button with the path icon; the level is in the view's header (Super Productivity cannot change a header button's label after it is registered) | header bar of the main window                |
| Journey (home)     | plugin view (`showIndexHtmlAsView`)                                                                                                                   | sidebar page; details pushed with swipe back |
| Station details    | page inside the view                                                                                                                                  | pushed page                                  |
| Bound task actions | task context menu "Use for current station"                                                                                                           | row menu "Use for current station"           |
| Messages           | snack (`showSnack`)                                                                                                                                   | toast                                        |
| Settings           | plugin settings view                                                                                                                                  | preferences                                  |
| Main actions       | bottom of the view                                                                                                                                    | bottom bar (thumb reach)                     |
