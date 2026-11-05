---
type: Concept
title: Psychology of habit building
description: What research says helps people build habits, what backfires, and the design rules that follow for a habit app with an optional game layer.
tags: [psychology, habits, gamification, design]
generated:
  by: claude-code/2.1.318
  at: 2026-11-05
sources:
  - id: lally2010
    title: 'Lally, van Jaarsveld, Potts, Wardle (2010): How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology 40(6), 998–1009'
    url: https://doi.org/10.1002/ejsp.674
  - id: gollwitzer2006
    title: 'Gollwitzer, Sheeran (2006): Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology 38, 69–119'
    url: https://doi.org/10.1016/S0065-2601(06)38002-1
  - id: fogg2019
    title: 'Fogg (2019): Tiny Habits: The Small Changes That Change Everything. Houghton Mifflin Harcourt'
  - id: ryan2000
    title: 'Ryan, Deci (2000): Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. American Psychologist 55(1), 68–78'
    url: https://doi.org/10.1037/0003-066X.55.1.68
  - id: deci1999
    title: 'Deci, Koestner, Ryan (1999): A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. Psychological Bulletin 125(6), 627–668'
    url: https://doi.org/10.1037/0033-2909.125.6.627
  - id: hamari2014
    title: 'Hamari, Koivisto, Sarsa (2014): Does gamification work? A literature review of empirical studies on gamification. HICSS 2014'
    url: https://doi.org/10.1109/HICSS.2014.377
  - id: marlatt1985
    title: 'Marlatt, Gordon (1985): Relapse Prevention. Guilford Press (abstinence violation effect)'
  - id: amabile2011
    title: 'Amabile, Kramer (2011): The Progress Principle. Harvard Business Review Press'
  - id: dai2014
    title: 'Dai, Milkman, Riis (2014): The fresh start effect: Temporal landmarks motivate aspirational behavior. Management Science 60(10), 2563–2582'
    url: https://doi.org/10.1287/mnsc.2014.1901
---

# Psychology of habit building

QuestArc exists to help people build habits that last, in Super
Productivity and in Pensum. The game layer serves that goal and must
never work against it. This page collects the research the design rests on. The sources were cited from the
literature, not re-read for this page; check a claim against its source
before relying on exact numbers.

## What helps

### Start tiny, grow step by step

Habits form through repetition in a stable context, not through
willpower. In a real-world study, the time until a behaviour became
automatic had a median of 66 days, with a range from 18 to 254 days
across people[^lally2010]. Very small starting behaviours that grow
over time are easier to repeat than ambitious ones[^fogg2019].

**Rule:** a story is a habit plan that starts with a step too small to
fail ("put the running shoes by the door") and unlocks the next, larger
step only after the current one has become easy.

### Anchor each step to a moment

Plans of the form "after X, I do Y" (implementation intentions) clearly
improve goal attainment compared with plain goals; a meta-analysis
found a medium-to-large effect[^gollwitzer2006].

**Rule:** every step names its anchor ("after morning coffee"), not
only the action.

### Make real progress visible

Seeing progress on meaningful work is one of the strongest everyday
motivators[^amabile2011].

**Rule:** XP, levels and boss bars show real progress on the user's own
steps. They never grow for opening the app or for activity without
meaning.

### Let people choose

Motivation lasts when people feel autonomous, competent and related to
others (self-determination theory)[^ryan2000].

**Rule:** the calm mode is the default and the game layer is opt-in.
The user chooses stories, pace and difficulty, and can switch modes at
any time.

### Use fresh starts

People are more willing to start or restart goals at temporal landmarks
such as a new week, month or birthday[^dai2014].

**Rule:** after a break, offer a restart at the next landmark ("start
fresh on Monday?") instead of showing what was lost.

## What backfires

### Punishment and broken streaks

After a slip, people often drop the goal altogether ("now it does not
matter anyway", the abstinence violation effect)[^marlatt1985]. Missing
a single day did not materially affect habit formation in the study
above[^lally2010], so harsh consequences buy nothing.

**Rules:**

- No permanent failure: a story or boss can always be resumed.
- "Never miss twice" instead of all-or-nothing streaks; a missed day
  does not reset progress.
- Losing HP is mild, optional, and recoverable by doing the next step.

### Rewards that replace the real reason

Expected tangible rewards for an activity people already find
interesting can reduce their own interest in it[^deci1999]. Studies of
gamification report mostly positive but mixed and context-dependent
results, and novelty effects that fade[^hamari2014].

**Rules:**

- Points support the user's own reason; each story starts by asking
  why the user wants this habit and shows that reason again at
  milestones.
- No loot boxes, random rewards or daily login bonuses.
- The design must still work once the novelty of the game layer is
  gone, which is why the calm mode has to stand on its own.

### Comparing with others

Leaderboards motivate those near the top and discourage the rest.

**Rule:** social features are cooperative (a small party fights one
boss together), never ranked.

### Apps that never let go

A habit that has become automatic no longer needs tracking.

**Rule:** a habit can graduate. Once a step has been done reliably for
long enough, the app suggests retiring it from daily tracking, and it
moves to a trophy shelf. The app should become less necessary over
time, not more.

## Design rules at a glance

1. Stories are habit plans: tiny first step, grow when easy.
2. Every step has an anchor moment.
3. Progress shown is real progress.
4. Calm mode by default, game layer opt-in.
5. No permanent failure; never miss twice; mild, optional HP loss.
6. Restart offers at fresh-start landmarks.
7. The user's own reason stays visible; no random or login rewards.
8. Cooperation, never rankings.
9. Habits graduate.
