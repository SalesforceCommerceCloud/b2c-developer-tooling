/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export type PersonaId = 'storefront' | 'api-integration' | 'devops-release' | 'ai-augmented';

export interface StepDefinition {
  id: string;
  title: string;
  summary: string;
  /** Path relative to the extension root. The onboarding panel resolves this via asWebviewUri. */
  markdown: string;
  /**
   * Commands the step can trigger from the UI. Surfaced as buttons in the panel header.
   */
  actions?: StepAction[];
}

export interface StepAction {
  label: string;
  command: string;
  args?: unknown[];
  /** Marks this as the primary call-to-action (rendered as a filled button). */
  primary?: boolean;
}

export interface PersonaDefinition {
  id: PersonaId;
  label: string;
  tagline: string;
  description: string;
  stepIds: string[];
}

/**
 * Catalog of every step that can appear in any persona flow.
 * The markdown files are the existing walkthrough content — we render them inside the panel
 * instead of the built-in VS Code walkthrough surface.
 */
export const STEP_CATALOG: Record<string, StepDefinition> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to B2C Commerce Development',
    summary: 'What the extension does and what you will learn.',
    markdown: 'media/walkthrough/welcome.md',
  },
  'configure-dw-json': {
    id: 'configure-dw-json',
    title: 'Connect to Your B2C Instance',
    summary: 'Pick secure storage (Keychain / pass) or a dw.json file.',
    markdown: 'media/walkthrough/dw-json-setup.md',
    actions: [
      {label: 'Choose credential storage', command: 'b2c-dx.walkthrough.chooseCredentialStorage', primary: true},
      {label: 'Create dw.json', command: 'b2c-dx.walkthrough.createDwJson'},
      {label: 'Open dw.json', command: 'workbench.action.quickOpen', args: ['dw.json']},
    ],
  },
  'setup-oauth': {
    id: 'setup-oauth',
    title: 'Set Up OAuth Credentials',
    summary: 'Unlock sandbox management and the API Browser.',
    markdown: 'media/walkthrough/oauth-setup.md',
    actions: [{label: 'Open dw.json', command: 'workbench.action.quickOpen', args: ['dw.json']}],
  },
  'explore-webdav': {
    id: 'explore-webdav',
    title: 'Browse Your Instance with WebDAV',
    summary: 'View and edit remote files directly from VS Code.',
    markdown: 'media/walkthrough/webdav-browser.md',
    actions: [{label: 'Open WebDAV Browser', command: 'b2c-dx.listWebDav', primary: true}],
  },
  'setup-cartridges': {
    id: 'setup-cartridges',
    title: 'Set Up Cartridge Development',
    summary: 'Detect or create cartridges in your workspace.',
    markdown: 'media/walkthrough/cartridge-structure.md',
    actions: [
      {label: 'Create New Cartridge', command: 'b2c-dx.scaffold.generate', primary: true},
      {label: 'Refresh Cartridge List', command: 'b2c-dx.codeSync.refreshCartridges'},
    ],
  },
  'deploy-code': {
    id: 'deploy-code',
    title: 'Deploy Your First Cartridge',
    summary: 'Upload cartridge code to your sandbox.',
    markdown: 'media/walkthrough/deploy-cartridge.md',
    actions: [{label: 'Deploy All Cartridges', command: 'b2c-dx.codeSync.deploy', primary: true}],
  },
  'manage-sandboxes': {
    id: 'manage-sandboxes',
    title: 'Work with Development Sandboxes',
    summary: 'Create, start, stop, and extend sandboxes.',
    markdown: 'media/walkthrough/sandbox-explorer.md',
    actions: [{label: 'Open Sandbox Explorer', command: 'workbench.view.extension.b2c-dx-sandboxes', primary: true}],
  },
  'enable-code-sync': {
    id: 'enable-code-sync',
    title: 'Automate Deployment with Code Sync',
    summary: 'Auto-upload cartridge changes as you save.',
    markdown: 'media/walkthrough/code-sync.md',
    actions: [
      {label: 'Start Code Sync', command: 'b2c-dx.codeSync.start', primary: true},
      {label: 'Stop Code Sync', command: 'b2c-dx.codeSync.stop'},
    ],
  },
  'next-steps': {
    id: 'next-steps',
    title: "You're Ready! Explore More Features",
    summary: 'Where to go next.',
    markdown: 'media/walkthrough/next-steps.md',
  },
  'install-cli': {
    id: 'install-cli',
    title: 'Install the B2C CLI',
    summary: 'Optional, but unlocks deploys, log tailing, and sandbox commands from the terminal.',
    markdown: 'media/walkthrough/install-cli.md',
    actions: [{label: 'Verify CLI', command: 'b2c-dx.cli.verify', primary: true}],
  },
  'ai-skills': {
    id: 'ai-skills',
    title: 'Set Up Agent Skills & MCP',
    summary:
      'Pair the extension with Claude Code, Cursor, or Copilot using the documented MCP server and Agent Skills.',
    markdown: 'media/walkthrough/ai-skills.md',
  },
};

export const PERSONAS: Record<PersonaId, PersonaDefinition> = {
  storefront: {
    id: 'storefront',
    label: 'Storefront developer',
    tagline: 'Build SFRA / PWA Kit templates, controllers, and ISML.',
    description:
      'Cartridge authoring, fast iteration with Code Sync, and WebDAV. If you used UX Studio or Prophet before, this is your closest map.',
    stepIds: [
      'welcome',
      'install-cli',
      'configure-dw-json',
      'setup-cartridges',
      'deploy-code',
      'enable-code-sync',
      'explore-webdav',
      'next-steps',
    ],
  },
  'api-integration': {
    id: 'api-integration',
    label: 'API / integration developer',
    tagline: 'Work with SCAPI, OCAPI, jobs, and hooks.',
    description: 'OAuth setup and the API Browser are first-class; Code Sync is optional.',
    stepIds: [
      'welcome',
      'install-cli',
      'configure-dw-json',
      'setup-oauth',
      'explore-webdav',
      'setup-cartridges',
      'deploy-code',
      'next-steps',
    ],
  },
  'devops-release': {
    id: 'devops-release',
    label: 'DevOps / release engineer',
    tagline: 'Manage sandbox lifecycle, code versions, and CAPs.',
    description: 'OAuth + Sandbox Explorer front and center. Less time on cartridge authoring.',
    stepIds: [
      'welcome',
      'install-cli',
      'configure-dw-json',
      'setup-oauth',
      'manage-sandboxes',
      'deploy-code',
      'next-steps',
    ],
  },
  'ai-augmented': {
    id: 'ai-augmented',
    label: 'AI-augmented developer',
    tagline: 'Pair Cursor / Claude Code / Copilot with this extension.',
    description:
      'Same setup as a storefront developer, plus the documented MCP server and Agent Skills so your AI tools share context with the extension.',
    stepIds: [
      'welcome',
      'install-cli',
      'configure-dw-json',
      'ai-skills',
      'setup-cartridges',
      'deploy-code',
      'enable-code-sync',
      'next-steps',
    ],
  },
};

export function getPersona(id: string | null | undefined): PersonaDefinition | null {
  if (!id) return null;
  return (PERSONAS as Record<string, PersonaDefinition>)[id] ?? null;
}

export function listPersonas(): PersonaDefinition[] {
  return Object.values(PERSONAS);
}

export function resolveSteps(personaId: PersonaId): StepDefinition[] {
  return PERSONAS[personaId].stepIds.map((id) => {
    const def = STEP_CATALOG[id];
    if (!def) throw new Error(`Unknown step id in persona ${personaId}: ${id}`);
    return def;
  });
}
