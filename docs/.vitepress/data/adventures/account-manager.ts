// Adventure: Manage Account Manager, BM roles & users (b2c am + b2c bm).
//
// PROTOTYPE: this adventure is now authored as a Vue page at
// `docs/quickstart/account-manager.md` using the slot-based <Wizard>/<QStep>/<QChoice>
// components. The TypeScript export below remains as a metadata stub so the
// QuickstartIndex card still appears on `/quickstart/`. The anchor checker
// skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const accountManagerAdventure: Adventure = {
  id: 'account-manager',
  title: 'Manage Account Manager, BM roles & users',
  tagline:
    'Configure access to Account Manager (org users, API clients) and Business Manager admin (roles, permissions, access keys).',
  icon: 'mdi:account-cog-outline',
  tags: ['account-manager', 'api-clients', 'roles', 'users', 'admin', 'bm'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
