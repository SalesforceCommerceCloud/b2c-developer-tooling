// Adventure: Configure SCAPI access (b2c scapi, b2c ecdn).
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/scapi-access.md` using the slot-based <Wizard>/<QStep>/
// <QChoice> components. The TypeScript export below remains as a metadata
// stub so the QuickstartIndex card still appears on `/quickstart/`. The
// anchor checker skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const scapiAccessAdventure: Adventure = {
  id: 'scapi-access',
  title: 'Configure SCAPI access',
  tagline: 'Set up OAuth client + tenant for eCDN, Custom APIs, schemas, and replications.',
  icon: 'mdi:api',
  tags: ['scapi', 'oauth', 'ecdn', 'custom-apis', 'tenant-id'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
