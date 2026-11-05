# Directory Update Log

## 2026-11-05

- **Initialization**: QuestArc 3.0 starts from scratch (decision D8 in [architecture](architecture.md)). All 2.x code and documents were removed; they stay in git history up to commit `8ec9137`. Kept and rewritten: [architecture](architecture.md) (from the consolidation plan, with prototypes, rules, engine, data, risks and decisions D1–D9), [roadmap](roadmap.md) (the journey; milestones Foundation to More journeys, no dates), [psychology](psychology.md). New: [Super Productivity facts](super-productivity-facts.md), verified against upstream master `c5eb3f6` (2026-11-05); plugins still cannot create repeat configs, `getDayContext()` and the `dataChanged`/`dayChange` hooks are new since the facts used earlier (`25cce3b`).
