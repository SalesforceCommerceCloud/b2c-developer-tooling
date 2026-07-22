/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {SkillSet, SkillSourceConfig} from './types.js';

function pluginsTag(version: string): string {
  const bare = version.replace(/^v/, '');
  return `b2c-agent-plugins@${bare}`;
}

/**
 * Registry mapping skill sets to their source configurations.
 *
 * Each skill set (b2c, b2c-cli, b2c-operator, storefront-next,
 * storefront-next-figma, cap-dev) maps to its respective GitHub repository and
 * download configuration for artifact retrieval.
 */
export const SKILL_SOURCES: Record<SkillSet, SkillSourceConfig> = {
  b2c: {
    id: 'b2c',
    displayName: 'B2C Commerce development patterns',
    type: 'release-artifact',
    repo: 'SalesforceCommerceCloud/b2c-developer-tooling',
    assetName: 'b2c-skills.zip',
    tagPattern: pluginsTag,
  },
  'b2c-cli': {
    id: 'b2c-cli',
    displayName: 'B2C CLI commands and operations',
    type: 'release-artifact',
    repo: 'SalesforceCommerceCloud/b2c-developer-tooling',
    assetName: 'b2c-cli-skills.zip',
    tagPattern: pluginsTag,
  },
  'storefront-next': {
    id: 'storefront-next',
    displayName: 'Storefront Next development skills',
    type: 'release-artifact',
    repo: 'SalesforceCommerceCloud/b2c-developer-tooling',
    assetName: 'storefront-next-skills.zip',
    tagPattern: pluginsTag,
  },
  'b2c-operator': {
    id: 'b2c-operator',
    displayName: 'B2C Operator/Admin bundle (curated operational skills)',
    type: 'release-artifact',
    repo: 'SalesforceCommerceCloud/b2c-developer-tooling',
    assetName: 'b2c-operator-skills.zip',
    tagPattern: pluginsTag,
  },
  'storefront-next-figma': {
    id: 'storefront-next-figma',
    displayName: 'Storefront Next Figma design-kit skills (requires the Figma MCP server)',
    type: 'release-artifact',
    repo: 'SalesforceCommerceCloud/b2c-developer-tooling',
    assetName: 'storefront-next-figma-skills.zip',
    tagPattern: pluginsTag,
  },
  'cap-dev': {
    id: 'cap-dev',
    displayName: 'Commerce Apps development skills',
    type: 'repo-contents',
    repo: 'SalesforceCommerceCloud/commerce-apps',
    ref: 'main',
    skillsPath: '.claude/skills',
  },
};

/**
 * Get the source configuration for a specific skill set.
 *
 * @param skillSet - The skill set identifier ('b2c', 'b2c-cli', 'storefront-next', 'storefront-next-figma', or 'cap-dev')
 * @returns The source configuration for the skill set
 * @throws Error if the skill set is not recognized
 */
export function getSkillSource(skillSet: SkillSet): SkillSourceConfig {
  const source = SKILL_SOURCES[skillSet];
  if (!source) {
    throw new Error(`Unknown skill set: ${skillSet}`);
  }
  return source;
}

/**
 * All available skill set identifiers.
 * Derived from the keys of SKILL_SOURCES.
 */
export const ALL_SKILL_SETS: SkillSet[] = Object.keys(SKILL_SOURCES) as SkillSet[];
