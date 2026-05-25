// Adventure: Page Designer content (b2c content + VS Code Content Libraries tree).
//
// Authored as a Vue page at docs/.vitepress/adventures/page-designer.vue. This
// stub exposes metadata for the QuickstartIndex card.

import type {Adventure} from './_types.js';

export const pageDesignerAdventure: Adventure = {
  id: 'page-designer',
  title: 'Page Designer content',
  tagline: 'Use b2c content and the VS Code Content Libraries tree to inspect, export, and edit Page Designer pages.',
  icon: 'mdi:view-grid-outline',
  tags: ['content', 'page-designer', 'webdav', 'ocapi', 'vscode'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
