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

/** Claude Code adds this tools/list `_meta` text to tool search matching only; the model never sees it. */
export const SEARCH_HINT_META_KEY = 'anthropic/searchHint';

/** Client loading and search hints advertised in a tool's `_meta`. */
export function toToolMeta({
  alwaysLoad,
  searchHint,
}: {
  alwaysLoad?: boolean;
  searchHint?: string;
}): Record<string, unknown> | undefined {
  const meta = {
    ...(alwaysLoad && {[ALWAYS_LOAD_META_KEY]: true}),
    ...(searchHint && {[SEARCH_HINT_META_KEY]: searchHint}),
  };
  return Object.keys(meta).length > 0 ? meta : undefined;
}
