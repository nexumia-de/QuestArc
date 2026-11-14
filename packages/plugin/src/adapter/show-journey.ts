/**
 * The action **Show** of a message (docs/behaviour.md, flow A): it opens
 * QuestArc's page at the build. The home of the page is the user's
 * moments (#96), so the action marks a one-shot flag the view reads
 * with its next state and opens the journey on top of the home.
 */
export interface ShowJourney {
  /** Opens the page and asks for the journey. */
  show(): void;
  /** True once after `show`; the view's answer takes it. */
  take(): boolean;
}

export const createShowJourney = (open: () => void): ShowJourney => {
  let pending = false;
  return {
    show: () => {
      pending = true;
      open();
    },
    take: () => {
      const was = pending;
      pending = false;
      return was;
    },
  };
};
