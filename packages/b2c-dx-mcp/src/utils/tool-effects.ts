/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {ToolAnnotations} from '@modelcontextprotocol/sdk/types.js';
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
