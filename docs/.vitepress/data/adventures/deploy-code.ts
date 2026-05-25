// Adventure: Deploy cartridge code (b2c code deploy / watch / activate).
//
// Authored as a Vue page at docs/.vitepress/adventures/deploy-code.vue. This
// stub exposes metadata for the QuickstartIndex card and quick-starts that
// reference the adventure id.

import type {Adventure} from './_types.js';

export const deployCodeAdventure: Adventure = {
  id: 'deploy-code',
  title: 'Deploy cartridge code',
  tagline: 'Upload, watch, and activate cartridges on a B2C Commerce instance.',
  icon: 'mdi:cloud-upload-outline',
  tags: ['code', 'webdav', 'ocapi', 'deploy', 'sfra', 'cartridges'],
  priority: 'core',
  stepOrder: [],
  steps: {},
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
