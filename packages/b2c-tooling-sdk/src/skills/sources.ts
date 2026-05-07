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
  'cap-dev': {
    id: 'cap-dev',
    displayName: 'Commerce Apps development skills',
    type: 'repo-contents',
    repo: 'SalesforceCommerceCloud/commerce-apps',
    ref: 'main',
    skillsPath: '.claude/skills',
  },
};

export function getSkillSource(skillSet: SkillSet): SkillSourceConfig {
  const source = SKILL_SOURCES[skillSet];
  if (!source) {
    throw new Error(`Unknown skill set: ${skillSet}`);
  }
  return source;
}

export const ALL_SKILL_SETS: SkillSet[] = Object.keys(SKILL_SOURCES) as SkillSet[];
