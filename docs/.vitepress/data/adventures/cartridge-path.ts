// Adventure: Manage site cartridge paths (b2c sites cartridges).
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/cartridge-path.md` using the slot-based
// <Wizard>/<QStep>/<QChoice> components. The TypeScript export below remains
// as a metadata stub so the QuickstartIndex card still appears on
// `/quickstart/`. The anchor checker skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const cartridgePathAdventure: Adventure = {
  id: 'cartridge-path',
  title: 'Manage site cartridge paths',
  tagline: "List, add, remove, or reorder cartridges in a site's cartridge path.",
  icon: 'mdi:layers-outline',
  tags: ['sites', 'cartridges', 'deploy'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
