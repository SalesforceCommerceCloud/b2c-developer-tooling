/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Access to the agent skills bundled with the CLI (`content/guidance`, built by
 * `scripts/generate-guidance.ts`) and the mapping from command topics to skills.
 *
 * Skills are the maintained source of workflow guidance; help output and
 * `b2c docs skill` point at them instead of duplicating that guidance.
 */
import {fileURLToPath} from 'node:url';
import {GuidanceCatalog} from '@salesforce/b2c-tooling-sdk/guidance';

/** Collection used when a skill name or topic is given without a collection. */
export const DEFAULT_SKILL_COLLECTION = 'b2c-cli';

/**
 * Topic (or command ID prefix) → skill ID, where the `b2c-<topic>` naming
 * convention does not apply. `null` marks topics that intentionally have no
 * skill. The longest matching prefix wins.
 */
export const SKILL_TOPIC_OVERRIDES: Readonly<Record<string, null | string>> = {
  auth: 'b2c-cli/b2c-config',
  bm: 'b2c-cli/b2c-bm-users-roles',
  commands: null,
  'job:export': 'b2c-cli/b2c-site-import-export',
  'job:import': 'b2c-cli/b2c-site-import-export',
  'job:import-set': 'b2c-cli/b2c-import-set-migrations',
  ods: 'b2c-cli/b2c-sandbox',
  preferences: null,
  scaffold: null,
  scapi: null,
  setup: 'b2c-cli/b2c-config',
  sfnext: null,
};

let catalog: GuidanceCatalog | null | undefined;

/** Bundled skill catalog, or `undefined` when the bundle is missing (e.g. an unbuilt checkout). */
export function loadSkillCatalog(): GuidanceCatalog | undefined {
  if (catalog === undefined) {
    try {
      catalog = new GuidanceCatalog(fileURLToPath(new URL('../../content/guidance/', import.meta.url)));
    } catch {
      catalog = null;
    }
  }
  return catalog ?? undefined;
}

/**
 * Resolves a command or topic ID (`code:deploy`, `scapi custom`) to a skill ID.
 * Checks overrides and the `b2c-<segments>` convention from the most specific
 * prefix to the least; returns `undefined` when no skill applies.
 */
export function skillForCommand(id: string, has: (skillId: string) => boolean): string | undefined {
  const segments = id
    .trim()
    .split(/[:\s]+/)
    .filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const prefix = segments.slice(0, i);
    const override = SKILL_TOPIC_OVERRIDES[prefix.join(':')];
    if (override !== undefined) return override ?? undefined;
    const conventional = `${DEFAULT_SKILL_COLLECTION}/b2c-${prefix.join('-')}`;
    if (has(conventional)) return conventional;
  }
  return undefined;
}

/** Shortest argument that `b2c docs skill` resolves to this skill ID. */
export function skillArgument(skillId: string): string {
  const [collection, name] = skillId.split('/');
  return collection === DEFAULT_SKILL_COLLECTION ? name : skillId;
}
