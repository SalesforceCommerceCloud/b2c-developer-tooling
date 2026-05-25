// Adventure: Debug server-side scripts (b2c debug, b2c debug cli).
//
// PROTOTYPE: this adventure is authored as a Vue page at
// `docs/quickstart/debug.md` using the slot-based <Wizard>/<QStep>/<QChoice>
// components. The TypeScript export below remains as a metadata stub so the
// QuickstartIndex card still appears on `/quickstart/`. The anchor checker
// skips this stub because it has no steps.

import type {Adventure} from './_types.js';

export const debugAdventure: Adventure = {
  id: 'debug',
  title: 'Debug server-side scripts',
  tagline: 'Set breakpoints and step through cartridges, jobs, and APIs from your IDE or a REPL.',
  icon: 'mdi:bug-outline',
  tags: ['debug', 'vscode', 'dap', 'repl'],
  priority: 'common',
  stepOrder: [],
  steps: {},
  // Never invoked: the wizard runs from the page-defined synthesizer.
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
