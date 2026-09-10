// Types for the Setup Adventure wizard. Author one adventure per file under
// this directory and register it in `index.ts`.

export type ApiSurface = 'ocapi' | 'scapi' | 'both';

export type BadgeTone = 'beta' | 'quick' | 'complex' | 'info';

export interface Badge {
  text: string;
  tone?: BadgeTone;
}

// Flat record of accumulated picks. Keys are arbitrary strings owned by each
// adventure (e.g., 'authMethod', 'instanceType', 'ide'). Multi-select steps
// produce string[] values for the keys their choices contribute to.
export type AdventureState = Record<string, boolean | number | string | string[] | undefined>;

export type Flags = Record<string, boolean>;

export interface DocAnchor {
  // Either an internal docs path without `.md` (e.g., '/guide/authentication')
  // or a fully-qualified external URL (e.g., 'https://docs.claude.com/...').
  // External URLs are passed through verbatim and skipped by the build-time
  // anchor checker.
  path: string;
  // Heading slug (without `#`), e.g., 'webdav-access'. Optional means link to top.
  // Ignored for external URLs (put any fragment directly in `path`).
  hash?: string;
  // Human-readable label shown in the "Learn more" link
  label: string;
}

export interface ChecklistItem {
  text: string;
  // Same shape as DocAnchor; resolved to an internal link with VitePress base path
  href: DocAnchor;
}

export interface SynthesizedConfig {
  // dw.json snippet with <PLACEHOLDER> tokens. Will be rendered as a code block.
  dwJson: string;
  // Optional `.env` tab content (also placeholder-friendly).
  env?: string;
  // Numbered checklist of steps that link back into existing prose docs.
  checklist: ChecklistItem[];
  // Free-form contextual warnings. Rendered as a styled callout.
  warnings?: string[];
  // The single command that proves setup works (e.g., 'b2c code list').
  verifyCommand: string;
}

export interface Choice {
  id: string;
  title: string;
  // Vendor or category subtitle (e.g., 'Anthropic', 'Quick')
  subtitle?: string;
  // Plain-text description (legacy; escaped on render). Prefer `body` for
  // new authoring so links and inline code render.
  description?: string;
  // Markdown body — rendered to HTML at display time. Supports inline
  // links (with VitePress base-path resolution), bold, italic, lists, and
  // inline/fenced code. Use the `md` template tag for multi-line authoring.
  body?: string;
  // Iconify name (reuse the project's group-icons set when possible)
  icon?: string;
  badges?: Badge[];
  // Picks contribute these key/values into AdventureState
  contributes?: AdventureState;
  // Step id to advance to. `null` = terminal (show output). Omit = next step in `Adventure.stepOrder`.
  next?: null | string;
  // If set, this choice is hidden unless `flags[featureFlag]` is true.
  featureFlag?: string;
  // Tag the choice with the API surface it implies. `synthesize` reads this
  // alongside the `scapi-migration` flag to pick scopes/permissions.
  apiSurface?: ApiSurface;
}

export interface Step {
  id: string;
  title: string;
  subtitle?: string;
  // Conditionally show this step based on accumulated state.
  showIf?: (state: AdventureState, flags: Flags) => boolean;
  // Anchor in existing prose docs that explains this step in detail.
  docAnchor: DocAnchor;
  // Function-of-state so a step's choices can branch on prior picks.
  choices: (state: AdventureState, flags: Flags) => Choice[];
  // When true, the user can pick multiple choices and confirm. Choice
  // contributions for *array-valued* keys are merged across picks (deduped),
  // so downstream steps and synthesizers can branch on the full set.
  // Optional `minPicks` (default 1) and `maxPicks` (default unlimited) bound
  // the selection.
  multiSelect?: boolean;
  minPicks?: number;
  maxPicks?: number;
}

export type AdventurePriority = 'core' | 'common' | 'specialized' | 'niche';

export interface Adventure {
  id: string;
  title: string;
  tagline: string;
  // Optional short blurb shown above step 1.
  intro?: string;
  badges?: Badge[];
  // Iconify name shown next to title and on the index card.
  icon?: string;
  // Tags surface on the index card and feed the search/filter UI.
  tags?: string[];
  // Bucket on the index page (Core / Common / Specialized / Niche).
  priority?: AdventurePriority;
  // Linear default order; branching is handled per-choice via `next`.
  stepOrder: string[];
  steps: Record<string, Step>;
  synthesize: (state: AdventureState, flags: Flags) => SynthesizedConfig;
}

export interface QuickStart {
  id: string;
  label: string;
  description?: string;
  badges?: Badge[];
  adventureId: string;
  // Pre-applied state. Wizard advances all steps that fully match these picks.
  preselect: AdventureState;
}

export interface AdventureRegistry {
  flags: Flags;
  adventures: Adventure[];
  quickStarts: QuickStart[];
}
