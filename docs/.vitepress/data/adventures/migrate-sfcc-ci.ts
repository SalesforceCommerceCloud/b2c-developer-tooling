// Adventure: Migrate from sfcc-ci.
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/migrate-sfcc-ci.md` using the slot-based
// <Wizard>/<QStep>/<QChoice> components. The TypeScript export below remains
// as a metadata stub so the QuickstartIndex card still appears on
// `/quickstart/`. The anchor checker skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const migrateSfccCiAdventure: Adventure = {
  id: 'migrate-sfcc-ci',
  title: 'Migrate from sfcc-ci',
  tagline: 'Move from the legacy sfcc-ci tool to the B2C CLI without breaking your CI/CD pipelines.',
  icon: 'mdi:swap-horizontal-bold',
  tags: ['migration', 'sfcc-ci', 'automation'],
  priority: 'specialized',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
