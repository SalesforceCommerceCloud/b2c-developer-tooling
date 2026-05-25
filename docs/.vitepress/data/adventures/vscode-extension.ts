// Adventure: Install the VS Code extension.
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/vscode-extension.md` using the slot-based
// <Wizard>/<QStep>/<QChoice> components. The TypeScript export below remains
// as a metadata stub so the QuickstartIndex card still appears on
// `/quickstart/`. The anchor checker skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const vscodeExtensionAdventure: Adventure = {
  id: 'vscode-extension',
  title: 'Install the VS Code extension',
  tagline: 'Set up the B2C DX VS Code extension and its features.',
  icon: 'mdi:microsoft-visual-studio-code',
  tags: ['vscode', 'sandbox', 'content', 'debug', 'webdav'],
  priority: 'core',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
