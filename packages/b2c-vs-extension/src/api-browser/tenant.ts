/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {normalizeTenantId} from '@salesforce/b2c-tooling-sdk/clients';

export interface ApiBrowserTenantValues {
  hostname?: unknown;
  tenantId?: unknown;
}

/**
 * Resolves the API Browser tenant, preferring explicit configuration and only
 * deriving it from the instance hostname when `tenant-id` is absent.
 */
export function resolveApiBrowserTenantId(values: ApiBrowserTenantValues): string {
  const configured = typeof values.tenantId === 'string' ? values.tenantId.trim() : '';
  if (configured) return normalizeTenantId(configured);

  const hostname = typeof values.hostname === 'string' ? values.hostname.trim() : '';
  return hostname ? normalizeTenantId(hostname) : '';
}
