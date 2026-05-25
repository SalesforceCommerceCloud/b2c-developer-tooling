// Adventure: Set up an AI coding agent (MCP server + agent skills).
//
// Authored as a Vue page at docs/.vitepress/adventures/agent-mcp.vue. This
// stub exposes metadata for the QuickstartIndex card and quick-starts.

import type {Adventure} from './_types.js';

export const agentMcpAdventure: Adventure = {
  id: 'agent-mcp',
  title: 'Set up an AI coding agent',
  tagline: 'Install B2C agent skills and the MCP server in your IDE.',
  icon: 'mdi:robot-outline',
  tags: ['ai', 'mcp', 'skills', 'ci-cd', 'vscode'],
  priority: 'core',
  stepOrder: [],
  steps: {},
  synthesize: () => ({dwJson: '', checklist: [], verifyCommand: ''}),
};
