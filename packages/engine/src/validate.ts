import type { Journey } from './types/journey';

/**
 * Structural check of a journey before the engine uses it
 * (docs/story-format.md). CI checks built-in journeys against the full
 * JSON Schema; this keeps a broken imported journey from breaking the game.
 */

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KEY = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;
const WEEKDAYS = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, min: number, max: number): boolean =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const isKey = (v: unknown): boolean => typeof v === 'string' && KEY.test(v);

const isText = (v: unknown, max: number): boolean =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const LANG = /^[a-z]{2,3}(-[A-Z]{2})?$/;
const textsOk = (v: unknown): boolean =>
  isObject(v) &&
  Object.entries(v).every(
    ([lang, texts]) =>
      LANG.test(lang) &&
      isObject(texts) &&
      Object.entries(texts).every(([key, text]) => KEY.test(key) && isText(text, 400)),
  );

const stageErrors = (stage: unknown, at: string): string[] => {
  if (!isObject(stage)) return [`${at}: not an object`];
  const errors: string[] = [];
  if (typeof stage.id !== 'string' || !ID.test(stage.id)) errors.push(`${at}.id: invalid`);
  const plan = stage.plan;
  if (!isObject(plan) || !isKey(plan.anchor) || !isKey(plan.action))
    errors.push(`${at}.plan: invalid`);
  const s = stage.schedule;
  const scheduleOk =
    isObject(s) &&
    (s.type === 'daily' ||
      (s.type === 'everyNDays' && isInt(s.n, 2, 7)) ||
      (s.type === 'weekdays' &&
        Array.isArray(s.days) &&
        s.days.length > 0 &&
        s.days.every((d) => typeof d === 'string' && WEEKDAYS.has(d))));
  if (!scheduleOk) errors.push(`${at}.schedule: invalid`);
  const c = stage.condition;
  const conditionOk =
    isObject(c) &&
    ((c.type === 'days' &&
      isInt(c.n, 1, 30) &&
      isInt(c.of, 1, 30) &&
      (c.n as number) <= (c.of as number)) ||
      (c.type === 'count' && isInt(c.n, 1, 100)) ||
      (c.type === 'time_spent' && isInt(c.minutes, 1, 6000)));
  if (!conditionOk) errors.push(`${at}.condition: invalid`);
  return errors;
};

export const journeyErrors = (value: unknown): string[] => {
  if (!isObject(value)) return ['journey: not an object'];
  const errors: string[] = [];
  if (value.format !== 3) errors.push('format: must be 3');
  if (typeof value.id !== 'string' || !ID.test(value.id)) errors.push('id: invalid');
  if (!isInt(value.version, 1, Number.MAX_SAFE_INTEGER)) errors.push('version: invalid');
  if (!isKey(value.title) || !isKey(value.description)) errors.push('title/description: invalid');
  if (value.author !== undefined && !isText(value.author, 60)) errors.push('author: invalid');
  if (value.texts !== undefined && !textsOk(value.texts)) errors.push('texts: invalid');
  if (value.build !== undefined) {
    const b = value.build;
    const name = (v: unknown): boolean => typeof v === 'string' && ID.test(v);
    const ok =
      isObject(b) &&
      name(b.ladder) &&
      (b.marker === undefined || name(b.marker)) &&
      (b.names === undefined ||
        (Array.isArray(b.names) &&
          b.names.length >= 1 &&
          b.names.length <= 13 &&
          b.names.every(isKey)));
    if (!ok) errors.push('build: invalid');
  }
  const stages = value.stages;
  if (!Array.isArray(stages) || stages.length < 2 || stages.length > 12) {
    errors.push('stages: 2 to 12 required');
  } else {
    stages.forEach((stage, i) => errors.push(...stageErrors(stage, `stages[${i}]`)));
    const ids = stages.map((s) => (isObject(s) ? s.id : undefined));
    if (new Set(ids).size !== ids.length) errors.push('stages: ids not unique');
  }
  return errors;
};

export const isJourney = (value: unknown): value is Journey => journeyErrors(value).length === 0;
