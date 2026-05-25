// Adventure: Run jobs (b2c job).
//
// PROTOTYPE: this adventure is now authored as a Vue page at
// `docs/quickstart/jobs.md` using the slot-based <Wizard>/<QStep>/<QChoice>
// components. The TypeScript export below remains as a metadata stub so the
// QuickstartIndex card still appears on `/quickstart/`. The anchor checker
// skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const jobsAdventure: Adventure = {
  id: 'jobs',
  title: 'Run jobs',
  tagline: 'Trigger and watch B2C Commerce jobs from the CLI.',
  icon: 'mdi:cog-play-outline',
  tags: ['jobs', 'ocapi', 'oauth', 'automation'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
