/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AccountManagerOrganization} from '@salesforce/b2c-tooling-sdk';

interface OrgResolver {
  getOrg(orgId: string): Promise<AccountManagerOrganization>;
  getOrgByName(name: string): Promise<AccountManagerOrganization>;
}

/**
 * Resolves an organization identifier (ID or friendly name) to an org ID.
 * Tries by ID first, then falls back to name lookup.
 */
export async function resolveOrgId(client: OrgResolver, orgIdOrName: string): Promise<string> {
  try {
    const org = await client.getOrg(orgIdOrName);
    return org.id!;
  } catch {
    const org = await client.getOrgByName(orgIdOrName);
    return org.id!;
  }
}
