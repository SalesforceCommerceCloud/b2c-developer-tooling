// Adventure: Managed Runtime deployments (b2c mrt).
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/mrt-deploy.md` using the slot-based <Wizard>/<QStep>/<QChoice>
// components. The TypeScript export below remains as a metadata stub so the
// QuickstartIndex card still appears on `/quickstart/`. The anchor checker
// skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const mrtDeployAdventure: Adventure = {
  id: 'mrt-deploy',
  title: 'Managed Runtime deployments',
  tagline:
    'Configure projects, environments, and bundle deploys for PWA Kit and Storefront Next on Managed Runtime.',
  icon: 'mdi:rocket-launch-outline',
  tags: ['mrt', 'managed-runtime', 'pwa', 'deploy', 'storefront-next'],
  priority: 'specialized',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
