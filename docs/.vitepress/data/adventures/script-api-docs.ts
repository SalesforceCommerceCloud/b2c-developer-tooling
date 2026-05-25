// Adventure: Download API Docs (b2c docs).
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/script-api-docs.md` using the slot-based <Wizard>/<QStep>/<QChoice>
// components. The TypeScript export below remains as a metadata stub so the
// QuickstartIndex card still appears on `/quickstart/`. The anchor checker
// skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const scriptApiDocsAdventure: Adventure = {
  id: 'script-api-docs',
  title: 'Download API Docs',
  tagline: 'Search and read instance-specific Script API documentation offline.',
  icon: 'mdi:book-open-page-variant-outline',
  tags: ['docs', 'offline'],
  priority: 'niche',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
