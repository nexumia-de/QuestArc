// Iframe view. The skeleton only proves the pipeline: plugin API →
// snapshot → engine → view. The real screens follow docs/behaviour.md.
import { evaluate } from '@questarc/engine';

import { loadSnapshot } from './snapshot';

const status = document.getElementById('status');

const show = (text: string): void => {
  if (status) status.textContent = text;
};

loadSnapshot()
  .then((snapshot) => {
    const view = evaluate(snapshot);
    show(
      view.active
        ? `Engine check for ${view.todayStr}: journey ${view.active.journeyId}, level ${view.level}.`
        : `Engine check for ${view.todayStr}: no journey started yet.`,
    );
  })
  .catch((error: unknown) => {
    show(`Could not read your tasks: ${String(error)}`);
  });
