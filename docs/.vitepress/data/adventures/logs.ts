// Adventure: Tail and search logs (b2c logs).
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/logs.md` using the slot-based <Wizard>/<QStep>/<QChoice>
// components. The TypeScript export below remains as a metadata stub so the
// QuickstartIndex card still appears on `/quickstart/`. The anchor checker
// skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const logsAdventure: Adventure = {
  id: 'logs',
  title: 'Tail and search logs',
  tagline: 'Stream and filter B2C Commerce instance logs from the terminal.',
  icon: 'mdi:text-search',
  tags: ['logs', 'webdav', 'debugging'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
