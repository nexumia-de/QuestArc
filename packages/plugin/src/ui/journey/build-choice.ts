import {
  LADDERS,
  markerFits,
  resolveBuild,
  type BuildChoice,
  type Journey,
} from '@questarc/engine';

import { inLine, t } from '../../shared/texts';
import { art } from '../art-store';
import { picture } from '../art';
import { h } from '../dom';
import { rowViewBox } from '../ladder';
import { markerTitle } from './build';

/**
 * What you build (docs/behaviour.md screen 3a): the thing, what hangs and
 * the colour, each option with a picture and its name in words. Only
 * ladders, markers and hues that both the engine's list and the pictures
 * know are offered. `choice` holds what the user picked themselves; the
 * rest follows the journey (engine `resolveBuild`).
 */

/** The ladders a user can pick: in the engine's list and drawn. */
export const ladderNames = (): string[] =>
  Object.keys(LADDERS.ladders).filter((name) => art().ladders[name] !== undefined);

/** A new choice with `field` set; a picked marker that no longer fits is dropped. */
export const withChoice = (
  journey: Journey,
  choice: BuildChoice,
  field: keyof BuildChoice,
  value: string,
): BuildChoice => {
  const next: BuildChoice = { ...choice, [field]: value };
  if (next.marker === undefined) return next;
  if (markerFits(next.marker, resolveBuild(journey, next).ladder)) return next;
  return Object.fromEntries(Object.entries(next).filter(([key]) => key !== 'marker'));
};

const small = (source: string | undefined, hue = art().palette['meadow'], viewBox?: string) => {
  const svg = picture(source ?? '', hue);
  if (viewBox) svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  svg.classList.add('qa-choice-art');
  return svg;
};

const option = (
  group: string,
  value: string,
  checked: boolean,
  art: Node,
  label: string,
  note: string | undefined,
  onPick: (value: string) => void,
  disabled = false,
) =>
  h(
    'label',
    { class: `qa-option qa-choice${disabled ? ' qa-option-disabled' : ''}` },
    h('input', {
      type: 'radio',
      name: group,
      value,
      checked,
      disabled,
      onchange: () => onPick(value),
    }),
    art,
    h(
      'span',
      { class: 'qa-option-text' },
      h('span', { class: 'qa-option-title' }, label),
      note ? h('span', { class: 'qa-muted qa-small' }, note) : null,
    ),
  );

/** The three choices as fieldsets; `onChange` gets the new choice. */
export const buildChooser = (
  journey: Journey,
  choice: BuildChoice,
  onChange: (choice: BuildChoice) => void,
): Node => {
  const shown = resolveBuild(journey, choice);
  const suggested = resolveBuild(journey, undefined).ladder;
  const hue = art().palette[shown.hue];
  const pick = (field: keyof BuildChoice) => (value: string) =>
    onChange(withChoice(journey, choice, field, value));
  return h(
    'div',
    { class: 'qa-stack' },
    h(
      'fieldset',
      { class: 'qa-fieldset' },
      h('legend', { class: 'qa-section-title' }, t('ui.build.thing')),
      ...ladderNames().map((name) => {
        const ladder = art().ladders[name];
        return option(
          'qa-ladder',
          name,
          name === shown.ladder,
          small(
            art().pictures[ladder?.versions[0]?.art ?? ''],
            hue,
            ladder ? rowViewBox(ladder) : undefined,
          ),
          ladder?.title ?? name,
          name === suggested ? t('ui.build.suggested') : undefined,
          pick('ladder'),
        );
      }),
    ),
    h(
      'fieldset',
      { class: 'qa-fieldset' },
      h('legend', { class: 'qa-section-title' }, t('ui.build.hangs')),
      ...Object.keys(LADDERS.markers)
        .filter((kind) => art().markers[kind] !== undefined)
        .map((kind) => {
          const fits = markerFits(kind, shown.ladder);
          return option(
            'qa-marker',
            kind,
            kind === shown.marker,
            // the plain form: the "on" form is earned, never shown ahead
            small(art().pictures[`marker-${kind}-bead`], hue),
            markerTitle(kind),
            fits ? undefined : t('ui.build.land-only'),
            pick('marker'),
            !fits,
          );
        }),
    ),
    h(
      'fieldset',
      { class: 'qa-fieldset' },
      h('legend', { class: 'qa-section-title' }, t('ui.build.colour')),
      h(
        'div',
        { class: 'qa-swatches' },
        ...LADDERS.hues
          .filter((name) => art().palette[name] !== undefined)
          .map((name) => {
            const swatch = h('span', { class: 'qa-swatch', 'aria-hidden': 'true' });
            const each = art().palette[name];
            if (each) {
              swatch.style.setProperty('--qa-hue-light', each.light);
              swatch.style.setProperty('--qa-hue-dark', each.dark);
            }
            return option(
              'qa-hue',
              name,
              name === shown.hue,
              swatch,
              each?.title ?? name,
              undefined,
              pick('hue'),
            );
          }),
      ),
    ),
  );
};

/** The build in one line: "A home · pennants · meadow green". */
export const buildSummary = (journey: Journey, choice: BuildChoice): string => {
  const shown = resolveBuild(journey, choice);
  const title = art().ladders[shown.ladder]?.title ?? shown.ladder;
  return [
    title,
    inLine(markerTitle(shown.marker)),
    inLine(art().palette[shown.hue]?.title ?? shown.hue),
  ].join(' · ');
};

/** The first version, which stands from the start, as a small picture. */
export const firstVersion = (journey: Journey, choice: BuildChoice): Node => {
  const shown = resolveBuild(journey, choice);
  const ladder = art().ladders[shown.ladder];
  return small(
    art().pictures[ladder?.versions[0]?.art ?? ''],
    art().palette[shown.hue],
    ladder ? rowViewBox(ladder) : undefined,
  );
};
