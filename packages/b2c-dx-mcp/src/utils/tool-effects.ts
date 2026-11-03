/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {ToolAnnotations} from '@modelcontextprotocol/server';

import type {ToolEffects} from './types.js';

/** Protocol hints describe effects; they neither authorize calls nor enforce access. */
export function toToolAnnotations({effect, idempotent, openWorld}: ToolEffects): ToolAnnotations {
  return {
    readOnlyHint: effect === 'read',
    destructiveHint: effect === 'destructive',
    idempotentHint: idempotent,
    openWorldHint: openWorld,
  };
}

/** Claude Code reads this tools/list `_meta` key to load a tool upfront when it defers MCP tools. */
export const ALWAYS_LOAD_META_KEY = 'anthropic/alwaysLoad';

/** Client loading hints advertised in a tool's `_meta`. */
export function toToolMeta({alwaysLoad}: {alwaysLoad?: boolean}): Record<string, unknown> | undefined {
  return alwaysLoad ? {[ALWAYS_LOAD_META_KEY]: true} : undefined;
}
