// Authoring helpers for adventure files. Use `defineAdventure` to declare
// the structure as plain data; use `step`, `choice`, `doc`, `md`, `check`,
// `link` to keep individual definitions concise. The renderer (Vue
// components) consumes the resulting Adventure objects directly.
//
// Why this exists: see PLAN_guides.md "Architecture decisions" — keeping the
// adventure as one structured TS object makes the data the single source of
// truth for the index card, presets, anchor validation, and the wizard
// renderer. No `.vue` parsing required.

import type {Adventure, AdventureState, Choice, DocAnchor, Flags, Step, SynthesizedConfig} from './_types.js';

// ---------------------------------------------------------------------------
// defineAdventure — accepts an array-style steps definition (more readable
// than the legacy Record shape) and normalises into Adventure shape used by
// the renderer + checker.
// ---------------------------------------------------------------------------

export interface AdventureInput {
  id: string;
  title: string;
  tagline: string;
  intro?: string;
  icon?: string;
  tags?: string[];
  priority?: Adventure['priority'];
  // Structure as an ordered array; ids preserved.
  steps: Step[];
  synthesize: (state: AdventureState, flags: Flags) => SynthesizedConfig;
}

export function defineAdventure(input: AdventureInput): Adventure {
  const stepOrder = input.steps.map((s) => s.id);
  const stepRecord: Record<string, Step> = Object.fromEntries(input.steps.map((s) => [s.id, s]));
  return {
    id: input.id,
    title: input.title,
    tagline: input.tagline,
    intro: input.intro,
    icon: input.icon,
    tags: input.tags,
    priority: input.priority,
    stepOrder,
    steps: stepRecord,
    synthesize: input.synthesize,
  };
}

// ---------------------------------------------------------------------------
// step / choice — concise, typed factories. Each accepts the rest of the
// shape so authors don't repeat `id` twice.
// ---------------------------------------------------------------------------

export interface StepInput {
  title: string;
  subtitle?: string;
  doc: DocAnchor;
  multiSelect?: boolean;
  minPicks?: number;
  maxPicks?: number;
  showIf?: (state: AdventureState, flags: Flags) => boolean;
  // Either a static array (most common) or a function-of-state (for steps
  // whose choice list depends on prior picks). The renderer accepts a
  // function via `Step.choices`, so we wrap the array form.
  choices: Choice[] | ((state: AdventureState, flags: Flags) => Choice[]);
}

export function step(id: string, input: StepInput): Step {
  const choices = typeof input.choices === 'function' ? input.choices : () => input.choices as Choice[];
  return {
    id,
    title: input.title,
    subtitle: input.subtitle,
    multiSelect: input.multiSelect,
    minPicks: input.minPicks,
    maxPicks: input.maxPicks,
    showIf: input.showIf,
    docAnchor: input.doc,
    choices,
  };
}

export type ChoiceInput = Omit<Choice, 'id'>;

export function choice(id: string, input: ChoiceInput): Choice {
  return {id, ...input};
}

// ---------------------------------------------------------------------------
// doc — produces a DocAnchor with sensible defaults. `link` (in _helpers.ts)
// is the older spelling; this is its rename for readability in adventure
// files. Both produce the same shape.
// ---------------------------------------------------------------------------

export function doc(path: string, hash?: string, label?: string): DocAnchor {
  return {path, hash, label: label ?? deriveLabel(path, hash)};
}

function deriveLabel(path: string, hash?: string): string {
  const last = path.split('/').filter(Boolean).pop() ?? path;
  const titled = last
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return hash ? `${titled} · ${hash}` : titled;
}

// ---------------------------------------------------------------------------
// md — tagged template literal for multi-line markdown content. Pure string
// concatenation today; the tag exists for IDE highlighting and so we can
// later enforce or transform markdown bodies at build time without churning
// every adventure file.
// ---------------------------------------------------------------------------

export function md(strings: TemplateStringsArray, ...values: unknown[]): string {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += String(values[i]) + strings[i + 1];
  }
  return dedent(out).trim();
}

// Strip the leading whitespace that template literals carry over from
// indented source code. Finds the smallest non-zero indent across non-empty
// lines and removes it from every line.
function dedent(s: string): string {
  const lines = s.split('\n');
  let min = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    const m = line.match(/^[ \t]*/);
    const indent = m ? m[0].length : 0;
    if (indent < min) min = indent;
  }
  if (min === Infinity || min === 0) return s;
  return lines.map((l) => l.slice(min)).join('\n');
}
