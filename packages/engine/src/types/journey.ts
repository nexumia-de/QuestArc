/** A journey in story format 3 (docs/story-format.md). */
export interface Journey {
  readonly format: 3;
  readonly id: string;
  readonly version: number;
  readonly title: string;
  readonly description: string;
  readonly why?: string;
  readonly stages: readonly Stage[];
  readonly ending?: { readonly story: string };
}

export interface Stage {
  readonly id: string;
  readonly plan: { readonly anchor: string; readonly action: string; readonly place?: string };
  readonly schedule: Schedule;
  readonly condition: Condition;
  readonly guardian?: { readonly name: string; readonly hp: number };
  readonly story?: { readonly arrival?: string; readonly accept?: string };
  readonly nugget?: string;
}

export type Schedule =
  | { readonly type: 'daily' }
  | { readonly type: 'everyNDays'; readonly n: number }
  | { readonly type: 'weekdays'; readonly days: readonly Weekday[] };

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Condition =
  | { readonly type: 'days'; readonly n: number; readonly of: number }
  | { readonly type: 'count'; readonly n: number }
  | { readonly type: 'time_spent'; readonly minutes: number };
