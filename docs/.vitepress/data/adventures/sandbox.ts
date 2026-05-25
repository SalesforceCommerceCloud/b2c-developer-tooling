// Adventure: Manage sandboxes (b2c sandbox).
//
// Authored as a Vue page at docs/.vitepress/adventures/sandbox.vue. This
// stub exposes metadata for the QuickstartIndex card.

import type {Adventure} from './_types.js';

export const sandboxAdventure: Adventure = {
  id: 'sandbox',
  title: 'Manage sandboxes',
  tagline: 'Create, start/stop, and delete on-demand sandboxes from the CLI.',
  icon: 'mdi:flask-empty-outline',
  tags: ['sandbox', 'ods', 'oauth', 'realm'],
  priority: 'core',
  stepOrder: [],
  steps: {},
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
