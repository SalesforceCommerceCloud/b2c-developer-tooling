// Adventure: Set up CI/CD pipeline.
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/ci-cd.md` using the slot-based <Wizard>/<QStep>/<QChoice>
// components. The TypeScript export below remains as a metadata stub so the
// QuickstartIndex card still appears on `/quickstart/`. The anchor checker
// skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const ciCdAdventure: Adventure = {
  id: 'ci-cd',
  title: 'Set up CI/CD pipeline',
  tagline: 'Automate cartridge deployment from GitHub Actions or another CI runner.',
  icon: 'mdi:source-branch',
  tags: ['ci-cd', 'automation', 'client-credentials', 'safety-mode', 'deploy', 'github'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
