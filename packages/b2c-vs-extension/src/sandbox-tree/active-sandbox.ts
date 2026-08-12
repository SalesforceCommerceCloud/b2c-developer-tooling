/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {isFriendlySandboxId} from '@salesforce/b2c-tooling-sdk';

/**
 * Derive an ODS friendly sandbox ID (realm-instance) from a B2C hostname.
 * e.g. "zzzz-001.dx.commercecloud.salesforce.com" → "zzzz-001"
 * Returns undefined when the hostname does not look like an ODS sandbox.
 */
export function friendlyIdFromHostname(hostname: string | undefined): string | undefined {
  if (!hostname || typeof hostname !== 'string') return undefined;
  const trimmed = hostname.trim();
  if (!trimmed) return undefined;
  const firstSegment = trimmed.split('.')[0] ?? '';
  if (!firstSegment || !isFriendlySandboxId(firstSegment)) return undefined;
  return firstSegment.toLowerCase();
}
