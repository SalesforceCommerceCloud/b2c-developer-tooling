// Adventure: Manage SLAS clients (b2c slas).
//
// PROTOTYPE: this adventure is now authored as a Vue page at
// `docs/quickstart/slas-clients.md` using the slot-based <Wizard>/<QStep>/<QChoice>
// components. The TypeScript export below remains as a metadata stub so the
// QuickstartIndex card still appears on `/quickstart/`. The anchor checker
// skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const slasClientsAdventure: Adventure = {
  id: 'slas-clients',
  title: 'Manage SLAS clients',
  tagline: 'Create and configure Shopper Login & Access Service (SLAS) clients for headless storefronts.',
  icon: 'mdi:account-key-outline',
  tags: ['slas', 'headless', 'shopper', 'oauth'],
  priority: 'specialized',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
