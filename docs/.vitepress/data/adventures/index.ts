// Setup Adventure registry. Adding an adventure = one new file in this
// directory + one entry in `adventures` below + one Markdown page under
// `docs/setup/<id>.md`.

import {accountManagerAdventure} from './account-manager.js';
import {agentMcpAdventure} from './agent-mcp.js';
import {cartridgePathAdventure} from './cartridge-path.js';
import {ciCdAdventure} from './ci-cd.js';
import {debugAdventure} from './debug.js';
import {deployCodeAdventure} from './deploy-code.js';
import {jobsAdventure} from './jobs.js';
import {logsAdventure} from './logs.js';
import {migrateSfccCiAdventure} from './migrate-sfcc-ci.js';
import {mrtDeployAdventure} from './mrt-deploy.js';
import {multiInstanceAdventure} from './multi-instance.js';
import {pageDesignerAdventure} from './page-designer.js';
import {sandboxAdventure} from './sandbox.js';
import {scapiAccessAdventure} from './scapi-access.js';
import {scriptApiDocsAdventure} from './script-api-docs.js';
import {slasClientsAdventure} from './slas-clients.js';
import {vscodeExtensionAdventure} from './vscode-extension.js';
import type {Adventure, AdventureRegistry, Flags, QuickStart} from './_types.js';

// Feature flags consulted by step `showIf` and choice `featureFlag`. Flip a
// flag to swap a path site-wide without changing component code.
export const flags: Flags = {
  // When true, adventures prefer SCAPI over OCAPI for permissions/scopes.
  // Today: false — the SCAPI variants are authored side-by-side but hidden.
  'scapi-migration': false,
};

export const adventures: Adventure[] = [
  // Core
  deployCodeAdventure,
  agentMcpAdventure,
  sandboxAdventure,
  vscodeExtensionAdventure,
  // Common
  jobsAdventure,
  pageDesignerAdventure,
  ciCdAdventure,
  scapiAccessAdventure,
  logsAdventure,
  debugAdventure,
  accountManagerAdventure,
  cartridgePathAdventure,
  multiInstanceAdventure,
  // Specialized
  mrtDeployAdventure,
  slasClientsAdventure,
  migrateSfccCiAdventure,
  // Niche
  scriptApiDocsAdventure,
];

export const quickStarts: QuickStart[] = [
  {
    id: 'claude-code-skills-mcp',
    label: 'Claude Code · skills + MCP',
    description: 'Install all three skill packs and the MCP server in Claude Code.',
    badges: [{text: 'Quick', tone: 'quick'}],
    adventureId: 'agent-mcp',
    preselect: {ide: 'claude-code', skills: ['b2c-cli', 'b2c', 'storefront-next'], includeMcp: true, toolsets: 'all'},
  },
  {
    id: 'deploy-ods-basic',
    label: 'Deploy code to ODS · WebDAV access key',
    description: 'Upload + activate cartridges with a BM access key + OAuth.',
    badges: [{text: 'Quick', tone: 'quick'}],
    adventureId: 'deploy-code',
    preselect: {instanceType: 'ods', webdavAuth: 'basic', needsOcapi: true, configSource: 'dw-json'},
  },
];

export const registry: AdventureRegistry = {flags, adventures, quickStarts};

export function getAdventure(id: string): Adventure | undefined {
  return adventures.find((a) => a.id === id);
}
