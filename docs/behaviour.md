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
- **The plan sentence** is one whole sentence per form in
  `content/i18n` (`ui.plan.sentence`, `-place`, `-pair`, `-place-pair`),
  filled with the stage's anchor, action and place and, for a stage of a
  run, what the user pairs it with (design rule 7): "After lunch, I will
  walk for 15 minutes (in the park), with my podcast." A language orders
  the parts as it needs; no sentence is glued together from pieces. The
  pairing is the user's text as stored, one line without a final full
  stop, and is not translated.
- There is one look and no mode: no XP, no levels, no guardians and no
  game words (#110). Every journey shows what it builds.
- Texts are autonomy-supportive ("you could"), never controlling or
  blaming, and never promise a number of days.

## Screens

### 1. Welcome (first start)

- Two sentences: what QuestArc does ("QuestArc turns a habit into a
  journey of small steps.") and how ("You keep using your normal tasks;
  QuestArc shows what grows from them."). Shown while QuestArc has no
  record at all; nothing is written here.
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
- **Plan check (optional)** (#59, design rule 6), collapsed, so
  skipping it takes no tap: opened, it says "Four short questions you
  could answer for yourself, or leave empty. You can change them later
  from the menu. Only you see this." and has four short text fields, none
  focused, none required, at most 160 characters each: "Your wish: what
  would you like from this habit?", "Best outcome: what would be the
  best thing about it?", "Main obstacle: what in you could get in the
  way?", "Your plan: if that happens, then I will …". The screen
  scrolls, so the fields stay reachable above the on-screen keyboard.
  The answers given are written with **Start** as one
  `plan-check:<runId>` record (`checkPlan`); without an answer nothing
  is written. Nothing is shown, counted or built for answering.
- **What you build** (#100): the journey's suggested
  build in words and as its first version, which stands from the start
  ("You build a home · pennants · meadow green"), and **Change**, which
  opens screen 3a. Nothing is shown of the versions to come.
- Main action: **Start**. Then the flow "Set up the task" (flow B) for
  the first stage. A changed build is written with the start, as one
  `build:<runId>` record ([data model](data-model.md)); an unchanged one
  writes nothing, so the journey's own build applies.

### 3a. What you build

The same choices on screen 3, where **Change** opens them in place, and
as their own page from **What you build** in the journey's menu
(screen 4).

- **What grows**: one option per ladder (Home, Crossing, …), each with
  its first version as a small picture and its name in words; the
  journey's suggestion says "Suggested by the journey".
- **What hangs**: lanterns, pennants, flowers, each with its plain
  element as a small picture (the "on" form is earned, never shown ahead)
  and its name. Flowers need ground: with a ladder on water the option is
  disabled and says "Only on land"; a marker that no longer fits after
  changing the ladder falls back to the ladder's own.
- **Colour**: the eight hues of the palette, each a swatch with its name
  (the name carries it, not the colour).
- On screen 3 the choice is written with **Start**; from the menu each
  change is written at once (`chooseBuild`). Only what the user picked
  is stored; the rest follows the journey. Changing later loses nothing:
  the version and the marker are derived from the stages, so the same
  progress is drawn as the other thing. **Use the journey's suggestion**
  withdraws the record.

### 3b. Plan check

**Plan check** in the journey's menu (screen 4) opens the same four
fields as their own page, filled with what is stored, to answer later,
change or empty. Main action: **Save**, which rewrites the record
(`checkPlan`) and leads back; with every field empty it withdraws the
record. QuestArc never asks for the plan check by itself.

Where the answers come back: only the plan for the obstacle, as one
line "Your plan for the obstacle: If I reach for the phone, then I will
put it down", in the hard-week hint (flow D) and in the details of
every reached station (screen 5). The other answers are shown on this
page only. They are never written into a task and never sent anywhere.

### 4. Journey (home)

- Top: journey title; menu (Pause or Resume, End journey, **What you
  build** (screen 3a), **Plan check** (screen 3b), **Stations**, Shelf,
  Settings). **End journey**
  happens at once and offers **Undo** (it writes one record, withdrawn
  by Undo).
- **The build** (#100, #110, [journey
  design](journey-design.md#the-journey-screen-with-the-build)). The
  upper part is the build in its setting and the run's hue: the ladder's
  current version, the marker with its first `ceil(markerProgress × E)`
  elements, all hanging elements "on" while ready. Below it the row of
  versions (the standing ones as small pictures with their number, the
  next one as a plain step without a picture, nothing further), then one
  line of state in words ("A plank bridge stands · a stone bridge is on
  its way", "… is ready", or only "A hut stands" before the stage's first
  counting completion; the journey's own version names only while the run's ladder is the journey's own, else the ladder's titles, #115), then the card. The picture's text for
  screen readers says the same and the marker in words: "A plank bridge,
  version 3 of 5; marker: 2 of 2 posts and 3 of 6 lanterns; not ready
  yet". At 720 px and wider the build is on the left and the card on the
  right. There is no drawn path any more: the stations are a list
  (**Stations** in the menu), each opening its details (screen 5).
- **The moment of the tick:** while the screen is open, a completion
  that adds marker elements makes them appear with a short calm
  animation (grow and fade in, about half a second), a new version
  likewise; none with `prefers-reduced-motion`. A redraw without a change
  animates nothing; opening the screen animates nothing.
- Bottom card, the current station:
  - the plan sentence, with the user's pairing if there is one;
  - progress of the condition in words and a bar ("4 of 5 days in the
    last week");
  - "Current run 6 · best 9 · 23 in total"; a gap is shown as a gap, not
    as a loss;
  - the main action, depending on the state:

| Station state                   | Main action                                         |
| ------------------------------- | --------------------------------------------------- |
| unbound (no recurring task yet) | **Set up the task** (flow B)                        |
| unsupported repeat              | **Change how often** (explains the supported kinds) |
| current, condition not met      | none: the habit is done in the task list            |
| met                             | **Continue** (flow C)                               |
| met, the user stays a while     | **Continue** as a quiet action (flow C)             |

- A banner on top of the card when needed: paused (with **Resume**, or a
  note that the repeat is paused in Super Productivity), a hard week
  (flow D, with the user's reason and their plan for the obstacle), weekly look back due (**Answer**), the
  station's learning nugget once on arrival (**Got it**), habit can
  graduate (later, #22). Dismissing a banner and skipping the weekly
  question are remembered on the device only; they are not choices.
- The card also shows the user's own reason, if they gave one. While
  the user stays at a met station it says "You are staying here a
  while. You can continue whenever you like."
- In the row of versions a version that stands for a skipped stage
  carries the words "already yours" under its number (flow B); in the
  **Stations** list such a station says "Already yours".
- **Read-only journey:** when the active journey is read-only
  ([data model](data-model.md) §2: written by a newer QuestArc, or its
  journey or journey version is not here), the screen shows its title
  (or "This journey" when the journey is not here) and one calm
  sentence instead of the build: "This journey was continued with a newer
  QuestArc. Update QuestArc here to go on with it; nothing is lost." or
  "This journey is not available here. Update QuestArc here to go on
  with it; nothing is lost." No progress, no main action, no Pause or
  End journey; the menu keeps Shelf and Settings. Nothing is written for
  it.

### 5. Station details

- Arrival story (if any), the plan sentence, schedule, condition, the
  learning nugget as a card titled **Try this**.
- Finished stations show the day they were finished, and their best run.
- A skipped station (flow B) shows its story, plan and nugget like any
  reached station and "Already yours: passed on 3 Nov without a task.",
  neutral, neither done nor a gap. While the engine says the skip can be
  taken back (`undoable`), **Do This Station After All** withdraws it
  and the station is offered again.
- The current station also has the field **Pair it with** (flow B,
  step 6), filled with what is stored: changing it rewrites the record,
  emptying it removes the pairing. Finished stations keep theirs in the
  plan sentence.
- A reached station shows the user's plan for the obstacle from the
  plan check, if there is one: "Your plan for the obstacle: …"
  (screen 3b).

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

- **Show the build in the side panel** (off by default, on
  this device only). On, Super Productivity gets QuestArc's side-panel
  button (next to the play button; in the bottom bar on a phone), which
  opens QuestArc's page beside the task list, so the build is in view
  while ticking off. Off takes effect at Super Productivity's next start,
  because a plugin cannot remove that button ([Super Productivity
  facts](super-productivity-facts.md) §7); the text says so.
- "How QuestArc motivates you".
- **Remove QuestArc's data**: withdraws all of QuestArc's records, never
  tasks; it cannot be undone, so it asks first, in place.
- Data: "QuestArc stores only your choices (journeys, accepted stages,
  answers) with your Super Productivity data. Removing the plugin deletes
  them on all your devices."

The settings button of QuestArc in Super Productivity's plugin list
(Settings, Plugins; 19.3.0 and later, `registerConfigHandler`) opens the
view straight on this screen, with the previous screen under it so back
leads there. Where the host has no such button nothing changes: the
settings stay in the view's menu.

### 9. How QuestArc motivates you

Plain words, one paragraph each: small steps that grow (reaching a
station is not the same as the step feeling easy, so staying is always
possible and the weekly answer suggests when to go on; a step the user
already does can be passed and counts nothing); one plan "after
X, I will Y"; one missed day is fine, two in a row start a new run but
never end the journey; welcome back after a gap; the weekly question;
graduation when a habit runs by itself; every journey builds something
that grows with real progress. What QuestArc does not do:
random rewards, rankings, punishment, collecting data. "Success is your
habit, not how often you open QuestArc."

## Flows

### A. Completing a task

The user ticks off the stage's task in the task list as usual. Within a
second QuestArc shows a short message (snack or toast):

| Event                        | Message                                      |
| ---------------------------- | -------------------------------------------- |
| completion                   | "Drink a glass of water: done. 4 of 5 days." |
| first completion after a gap | "Welcome back. Your run goes on."            |
| several at once (sync)       | "3 days done. 4 of 5 days."                  |
| condition met                | "Station reached: you can continue."         |

Messages say the real progress in words; they never say what was added
to the build and never give points (#110).

The message carries
the action **Show**, which opens QuestArc's page at the build (Super
Productivity keeps a message with an action visible longer). Marker
elements and new versions get no words of their own (Amir & Ariely
2008, [research](research.md)): the picture shows them.

The events of one change are joined into one message, so messages after
a sync with many changes are summed up in one. The progress ("4 of 5
days") is the current condition: days, times or minutes.

All texts of screens and messages are in `content/i18n/en.json` (keys
`ui.*` and `event.*`), next to the journeys' texts, so Pensum can use the same
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

5. **I Already Do This** (#81), below the choices, with "Is this already
   part of your day? You could pass this station. It shows as already
   yours and counts nothing." The stage is passed without a task
   (`skipStage`) and the same screen offers the next stage. Not offered
   for the last stage of a journey, and not once the station has a
   repeating task.
6. **Pair it with** (#58, design rule 7), one optional text field below
   the choices, not focused: "Optional: something you enjoy and could
   save for this step, like "my podcast". Only you see this." While the
   user types, the plan sentence above shows the result ("…, with my
   podcast."). Leaving the field writes it (`pairStage`); an empty
   field withdraws it. At most 60 characters. Nothing is shown, counted
   or built for filling it in, and nothing asks for it again. It is
   never written into the task's title or notes and never sent anywhere.

### C. Continue to the next stage

1. The station's acceptance story and the next stage's plan sentence,
   with the pairing of the current stage: **Continue** takes it along to
   the next stage (`continueJourney`), where flow B shows it in the
   field to keep, change or remove.
2. Two equal choices (#81): **Continue** and **Stay Here a While**, with
   "Both are fine. Staying costs nothing: everything keeps counting, and
   you can continue whenever you like." The engine's suggestion
   (`offer.suggest`, [game rules](game-rules.md) §4) adds one kind
   sentence and makes that choice the filled button; the other stays an
   outlined button of the same size:
   - `stay` with a weekly answer of 3 or lower: "This step still takes
     some thought. You could give it another week."
   - `stay` without an answer yet: "This step is still new. You could
     give it another week."
   - `continue`: "This step seems to come by itself now. You could go
     on."
   - `none`: no sentence, both buttons outlined.
3. **Stay Here a While** writes the `stay` record and leads back to the
   journey; for 7 days **Continue** there is a quiet (outlined) action
   and the station is not announced again. **Continue** writes the
   checkpoint and accepts the next stage, then flow B for its task.
4. "You could end or change your earlier task 'walk for 5 minutes' so
   you don't keep both." with **Open the earlier task**; QuestArc never
   ends it itself.
5. Last stage: the ending story, the journey moves to the shelf, the
   habit stays as a maintained habit.

### D. Hard days

- After one missed due day: nothing special; the gap shows in the card's last days.
- After the second missed due day in a row: banner "A hard week? On hard
  days, doing the earlier step (walk for 5 minutes) counts too." with
  **Good to know**. Doing the smaller step and ticking off the task
  counts as a completion. The banner adds the user's reason, if they
  gave one, and their plan for the obstacle from the plan check, if
  they wrote one ("Your plan for the obstacle: …", screen 3b).
- The next completion is welcomed back (flow A).

### E. Pause and resume

Menu → **Pause journey**: banner "Paused since 12 Nov. Paused days don't
count." with **Resume**. Pausing the repeat in Super Productivity has the
same effect.

### F. Graduation

- When the habit qualifies ([game rules](game-rules.md) §6): banner "This
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

| Part               | Super Productivity plugin                                                         | Pensum                                       |
| ------------------ | --------------------------------------------------------------------------------- | -------------------------------------------- |
| Entry              | header button with the route icon                                                 | header bar of the main window                |
| Journey (home)     | plugin view (`showIndexHtmlAsView`)                                               | sidebar page; details pushed with swipe back |
| Station details    | page inside the view                                                              | pushed page                                  |
| Bound task actions | task context menu "Use for current station"                                       | row menu "Use for current station"           |
| Messages           | snack (`showSnack`) with the action **Show** (opens the view)                     | toast                                        |
| Build at a glance  | optional side panel (setting, off by default): the same view beside the task list | strip at the top of Today (later)            |
| Settings           | settings screen of the view; the plugin list's settings button opens it (#67)     | preferences                                  |
| Main actions       | bottom of the view                                                                | bottom bar (thumb reach)                     |
