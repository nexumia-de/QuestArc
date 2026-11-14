import { ANCHOR_LIMIT, confirmAnchor, nameAnchor, removeAnchor } from '@questarc/engine';

import { newRunId } from '../../shared/run-id';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { momentFields, momentOf, suggestedWords, type MomentDraft } from '../journey/moment';
import type { Context, Screen } from '../screen';

/**
 * Screen 0a, a moment (docs/behaviour.md, #96): its words or its time and
 * the name the user may give it. With `journeyId` it is the moment of
 * journeys from before anchors: saving confirms it once for all of them
 * (`confirmAnchor`). A moment where nothing stands can be removed.
 */
export const momentScreen = (ctx: Context, anchorId: string, journeyId?: string): Screen => {
  const { view, journeys } = ctx.state;
  const anchor = view.anchors.find((a) =>
    journeyId ? a.id === undefined && a.suggest === journeyId : a.id === anchorId,
  );
  if (!anchor) {
    // Confirmed or removed in the meantime: the home shows it.
    queueMicrotask(() => ctx.reset({ name: 'home' }));
    return { title: t('ui.app.name'), body: h('p', {}) };
  }
  const { kind, words, time } = journeyId ? suggestedWords(anchor, journeys) : anchor;
  const draft = (ctx.draft.moment ??= { kind, words, time }) as MomentDraft;
  const name = h('input', {
    id: 'qa-moment-name',
    class: 'qa-input',
    type: 'text',
    maxlength: ANCHOR_LIMIT,
    autocomplete: 'off',
    'aria-describedby': 'qa-moment-name-hint',
    oninput: () => {
      ctx.draft.name = name.value;
    },
  }) as HTMLInputElement;
  name.value = (ctx.draft.name as string | undefined) ?? anchor.name ?? '';

  const save = async () => {
    const id = journeyId ? newRunId() : anchorId;
    const named = nameAnchor({ anchorId: id, anchor: momentOf(draft), name: name.value });
    if (Object.keys(named).length === 0) {
      draft.missing = true;
      ctx.redraw();
      return;
    }
    await ctx.write(
      journeyId
        ? { ...confirmAnchor(view, { journeyId, anchorId: id, anchor: momentOf(draft) }), ...named }
        : named,
    );
    ctx.back();
  };
  const removal = journeyId ? {} : removeAnchor(view, anchorId);

  return {
    title: t('ui.moment.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      h(
        'fieldset',
        { class: 'qa-fieldset' },
        h('legend', { class: 'qa-section-title' }, t('ui.moment.when')),
        ...momentFields(draft, ctx.redraw),
      ),
      h(
        'div',
        { class: 'qa-field' },
        h('label', { for: 'qa-moment-name', class: 'qa-section-title' }, t('ui.moment.name')),
        name,
        h('p', { id: 'qa-moment-name-hint', class: 'qa-muted qa-small' }, t('ui.moment.name.hint')),
      ),
      h('p', { class: 'qa-muted' }, t('ui.moment.tasks')),
      Object.keys(removal).length > 0
        ? h(
            'div',
            { class: 'qa-stack' },
            h('p', { class: 'qa-muted' }, t('ui.moment.remove.text')),
            h(
              'button',
              {
                class: 'qa-btn qa-btn-secondary',
                type: 'button',
                onclick: () => void ctx.write(removal),
              },
              t('ui.moment.remove'),
            ),
          )
        : null,
    ),
    actions: [
      h(
        'button',
        { class: 'qa-btn qa-btn-primary', type: 'button', onclick: () => void save() },
        t('ui.check.save'),
      ),
    ],
  };
};
