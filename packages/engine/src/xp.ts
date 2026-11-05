/**
 * XP and level (docs/game-rules.md §5): 10 XP per counting completion,
 * 10 more for each welcome back; level = floor(sqrt(totalXp / 50)) + 1.
 */

export const XP_PER_COMPLETION = 10;
export const XP_WELCOME_BACK = 10;

export const stageXp = (completions: number, welcomeBacks: number): number =>
  completions * XP_PER_COMPLETION + welcomeBacks * XP_WELCOME_BACK;

export const levelFor = (totalXp: number): number => Math.floor(Math.sqrt(totalXp / 50)) + 1;
