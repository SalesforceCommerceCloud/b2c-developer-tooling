// Adventure: Configure multiple instances.
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/multi-instance.md` using the slot-based
// <Wizard>/<QStep>/<QChoice> components. The TypeScript export below
// remains as a metadata stub so the QuickstartIndex card still appears on
// `/quickstart/`. The anchor checker skips this stub because it has no
// steps.

import type {Adventure} from './_types.js';

export const multiInstanceAdventure: Adventure = {
  id: 'multi-instance',
  title: 'Configure multiple instances',
  tagline: 'Switch between dev, staging, and production with named profiles in dw.json.',
  icon: 'mdi:swap-horizontal-circle-outline',
  tags: ['configuration', 'dw-json', 'multi-instance'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
