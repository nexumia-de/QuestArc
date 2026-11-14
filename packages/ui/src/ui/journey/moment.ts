import {
  ANCHOR_LIMIT,
  anchorWords,
  nameAnchor,
  type AnchorView,
  type AnchorWords,
  type Journey,
} from '@questarc/engine';

import { anchorLabel, capitalise, planAnchor } from '../../shared/plan';
import { newRunId } from '../../shared/run-id';
import { stageAction, t } from '../../shared/texts';
import { h } from '../dom';
import type { Context } from '../screen';

/**
 * A moment in the user's day (design rule 2, docs/behaviour.md screens 0
 * and 3): the fields to name one, a routine in their own words or a
 * fixed time, and the choice of a moment when a journey starts. No field
 * is focused on opening; `draft` holds what the user typed, so a redraw
 * keeps it.
 */

export interface MomentDraft {
  kind?: 'routine' | 'time';
  words?: string;
  time?: string;
  /** Start was pressed without words or a time. */
  missing?: boolean;
}

/** The draft as an anchor: a leading "after" the user typed is not doubled. */
export const momentOf = (draft: MomentDraft): AnchorWords => ({
  kind: draft.kind ?? 'routine',
  words: anchorWords(
    (draft.words ?? '').replace(new RegExp(`^${t('ui.moment.lead')}\\s+`, 'i'), ''),
  ),
  ...(draft.time ? { time: draft.time } : {}),
});

/** What the journey suggests: its kind of moment, never the user's words. */
export const suggestedMoment = (journey: Journey | undefined): MomentDraft => {
  const hint = journey?.anchor;
  const example = hint?.example ?? journey?.stages[0]?.plan.anchor;
  return {
    kind: hint?.time ? 'time' : 'routine',
    words: example ? t(example) : '',
    time: hint?.time ?? '',
  };
};

/** The anchor's place in words: its name, else "After getting up" or "At 21:00". */
export const anchorTitle = (anchor: AnchorView, journeys: readonly Journey[]): string => {
  if (anchor.name) return anchor.name;
  const own = planAnchor(
    anchor.id === undefined && anchor.kind === 'routine'
      ? suggestedWords(anchor, journeys)
      : anchor,
  );
  return own ? anchorLabel(own) : t('ui.moment.title');
};

/** A moment from before anchors: the words its journey's plan sentence suggests. */
export const suggestedWords = (anchor: AnchorView, journeys: readonly Journey[]): AnchorWords => {
  const key = journeys.find((j) => j.id === anchor.suggest)?.stages[0]?.plan.anchor;
  return anchor.kind === 'time'
    ? { kind: 'time', ...(anchor.time ? { time: anchor.time } : {}) }
    : { kind: 'routine', ...(key ? { words: t(key) } : {}) };
};

const radio = (name: string, checked: boolean, label: string, onchange: () => void) =>
  h(
    'label',
    { class: 'qa-option' },
    h('input', { type: 'radio', name, checked, onchange }),
    h('span', { class: 'qa-option-title' }, label),
  );

/** The two kinds of moment with their field: "After …" in words, or a time. */
export const momentFields = (draft: MomentDraft, redraw: () => void, example?: string): Node[] => {
  const kind = draft.kind ?? 'routine';
  const pick = (next: 'routine' | 'time') => () => {
    draft.kind = next;
    redraw();
  };
  const words = h('input', {
    id: 'qa-moment-words',
    class: 'qa-input',
    type: 'text',
    maxlength: ANCHOR_LIMIT,
    autocomplete: 'off',
    'aria-label': t('ui.moment.routine'),
    'aria-describedby': 'qa-moment-hint',
    oninput: () => {
      draft.words = words.value;
    },
  }) as HTMLInputElement;
  words.value = draft.words ?? '';
  const time = h('input', {
    id: 'qa-moment-time',
    class: 'qa-input',
    type: 'time',
    'aria-label': t('ui.moment.time'),
    oninput: () => {
      draft.time = time.value;
    },
  }) as HTMLInputElement;
  time.value = draft.time ?? '';
  return [
    radio('qa-moment-kind', kind === 'routine', t('ui.moment.routine'), pick('routine')),
    kind === 'routine'
      ? h(
          'div',
          { class: 'qa-field' },
          words,
          h(
            'p',
            { id: 'qa-moment-hint', class: 'qa-muted qa-small' },
            example ? t('ui.moment.routine.hint', { example }) : t('ui.moment.private'),
          ),
        )
      : null,
    radio('qa-moment-kind', kind === 'time', t('ui.moment.time'), pick('time')),
    kind === 'time' ? h('div', { class: 'qa-field' }, time) : null,
    draft.missing ? h('p', { class: 'qa-callout', role: 'alert' }, t('ui.moment.missing')) : null,
  ].filter((node): node is HTMLElement => node !== null);
};

/**
 * "Your moment" when a journey starts: one of the user's moments, or a
 * new one. At a moment where a habit already stands the new step may be
 * tied to that step instead (a chain: the user's choice, never the
 * default, design rule 3).
 */
export const momentPart = (ctx: Context, journey: Journey, anchorId?: string): HTMLElement => {
  const { view } = ctx.state;
  const own = view.anchors.filter((a) => a.id !== undefined);
  const chosen = (ctx.draft.anchor as string | undefined) ?? anchorId ?? '';
  const at = own.find((a) => a.id === chosen);
  const draft = (ctx.draft.moment ??= suggestedMoment(journey)) as MomentDraft;
  const after = (ctx.draft.after as string | undefined) ?? '';
  const choose = (id: string) => () => {
    ctx.draft.anchor = id;
    ctx.draft.after = '';
    ctx.redraw();
  };
  // Steps that stand here and are done by themselves or still followed.
  const steps = (at?.steps ?? []).flatMap((step) => {
    const action = stageAction(step.journeyId, step.stageId);
    return action && (step.state === 'graduated' || step.state === 'maintained')
      ? [{ runId: step.runId, label: anchorLabel({ form: 'then', text: action }) }]
      : [];
  });
  const tie = (runId: string, label: string) =>
    radio('qa-moment-after', after === runId, label, () => {
      ctx.draft.after = runId;
      ctx.redraw();
    });
  return h(
    'fieldset',
    { class: 'qa-fieldset' },
    h('legend', { class: 'qa-section-title' }, t('ui.moment.title')),
    h(
      'p',
      { class: 'qa-muted' },
      t('ui.moment.hint', {
        moment: journey.anchor ? t(journey.anchor.moment) : t('ui.moment.any'),
      }),
    ),
    ...own.map((a) =>
      radio('qa-moment', a.id === chosen, anchorTitle(a, ctx.state.journeys), choose(a.id ?? '')),
    ),
    own.length > 0 ? radio('qa-moment', !at, t('ui.moment.new'), choose('')) : null,
    // What belongs to the chosen moment stands under it, set in.
    h(
      'div',
      { class: own.length > 0 ? 'qa-fieldset qa-sub' : 'qa-fieldset' },
      ...(at
        ? steps.length > 0
          ? [
              h('p', { class: 'qa-section-title' }, t('ui.moment.tie')),
              tie('', capitalise(t('ui.moment.tie.anchor'))),
              ...steps.map((step) => tie(step.runId, step.label)),
              h('p', { class: 'qa-muted qa-small' }, t('ui.moment.tie.hint')),
            ]
          : []
        : momentFields(draft, ctx.redraw, journey.anchor ? t(journey.anchor.example) : undefined)),
    ),
  ) as HTMLElement;
};

/**
 * The records of the chosen moment for a new run: the anchor to tie it
 * to and, for a new moment, its record. `undefined` while a new moment
 * has neither words nor a time; the fields then say so.
 */
export const chosenMoment = (
  ctx: Context,
  anchorId?: string,
):
  | { anchor: { anchorId: string; after?: string }; records: Record<string, unknown> }
  | undefined => {
  const chosen = (ctx.draft.anchor as string | undefined) ?? anchorId ?? '';
  const after = (ctx.draft.after as string | undefined) ?? '';
  if (ctx.state.view.anchors.some((a) => a.id === chosen && chosen !== ''))
    return { anchor: { anchorId: chosen, ...(after ? { after } : {}) }, records: {} };
  const draft = (ctx.draft.moment ?? {}) as MomentDraft;
  const id = newRunId();
  const records = nameAnchor({ anchorId: id, anchor: momentOf(draft) });
  if (Object.keys(records).length === 0) {
    draft.missing = true;
    ctx.redraw();
    return undefined;
  }
  return { anchor: { anchorId: id }, records };
};
