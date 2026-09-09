/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Optional detail for an observed condition; never a prerequisite or approval. */
export interface SkillReference {
  uri: string;
  section: string;
}

/** Targets must resolve through resources even when skills_read is not selected. */
export const MCP_SKILL_REFERENCES = {
  configSources: {uri: 'skill://mcp/b2c-config/SKILL.md', section: 'where-configuration-comes-from'},
  debuggerPrerequisites: {uri: 'skill://mcp/debugger/SKILL.md', section: 'prerequisites'},
  debuggerRecovery: {uri: 'skill://mcp/debugger/SKILL.md', section: 'recovery'},
  scapiAuthentication: {uri: 'skill://mcp/scapi/SKILL.md', section: 'authentication'},
} satisfies Record<string, SkillReference>;
