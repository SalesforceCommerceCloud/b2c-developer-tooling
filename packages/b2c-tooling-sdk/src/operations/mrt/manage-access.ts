/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Storefront manage-access operations for Managed Runtime.
 *
 * Reports which surface manages a project's storefront (Runtime Admin or
 * Business Manager), whether SCAPI and direct MRT API access are enabled,
 * and which B2C Commerce instances the project's environments connect to.
 *
 * @module operations/mrt/manage-access
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtB2CClient} from '../../clients/mrt-b2c.js';
import {getLogger} from '../../logging/logger.js';
import {toB2COrigin} from './b2c-config.js';
import {listEnvs} from './env.js';
import {getProject} from './project.js';

/**
 * Surface where a storefront's governance is managed.
 * - `mrt`: Runtime Admin
 * - `b2c`: Business Manager
 */
export type UiManagedAt = 'mrt' | 'b2c';

/**
 * An MRT environment and the B2C Commerce instance it connects to.
 */
export interface StorefrontEnvironment {
  /** Environment (target) slug. */
  slug: string;
  /** Environment display name. */
  name: string;
  /** Connected B2C instance ID, or null when not connected (or lookup failed). */
  instanceId: string | null;
  /** B2C site IDs configured for the environment. */
  sites: string[];
}

/**
 * Manage-access state for a storefront (MRT project).
 */
export interface StorefrontManageAccess {
  /** Project slug. */
  slug: string;
  /** Surface managing the storefront. A null backend value is treated as `mrt`. */
  uiManagedAt: UiManagedAt;
  /** Whether the SCAPI MRT Admin API is enabled; null when not reported. */
  scapiEnabled: boolean | null;
  /** Whether direct (legacy) MRT API access is enabled; null when not reported. */
  mrtApiEnabled: boolean | null;
  /** Project environments with their B2C connections. */
  environments: StorefrontEnvironment[];
  /** Distinct connected B2C instance IDs, in first-seen order. */
  instanceIds: string[];
}

/**
 * Options for getting storefront manage-access state.
 */
export interface GetStorefrontManageAccessOptions {
  /**
   * Project slug.
   */
  projectSlug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Gets manage-access state for a storefront, including the environments and
 * B2C instances it applies to.
 *
 * Environments with no B2C target info (404) are kept with a null `instanceId`.
 *
 * @param options - Operation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Manage-access state
 * @throws Error if the project, its environments, or an environment's B2C
 * target info cannot be retrieved (other than 404)
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getStorefrontManageAccess } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const access = await getStorefrontManageAccess({ projectSlug: 'my-storefront' }, auth);
 * console.log(`Managed at: ${access.uiManagedAt}`);
 * ```
 */
export async function getStorefrontManageAccess(
  options: GetStorefrontManageAccessOptions,
  auth: AuthStrategy,
): Promise<StorefrontManageAccess> {
  const logger = getLogger();
  const {projectSlug, origin} = options;

  const project = await getProject({projectSlug, origin}, auth);
  const {environments: envs} = await listEnvs({projectSlug, origin}, auth);

  const b2cClient = createMrtB2CClient({origin: toB2COrigin(origin)}, auth);

  const environments = await Promise.all(
    envs.map(async (env): Promise<StorefrontEnvironment> => {
      const slug = env.slug ?? '';
      const name = env.name ?? slug;
      const {data, error, response} = await b2cClient.GET('/projects/{project_slug}/b2c-target-info/{target_slug}/', {
        params: {path: {project_slug: projectSlug, target_slug: slug}},
      });

      if (response.status === 404) {
        logger.debug({projectSlug, targetSlug: slug}, '[MRT] No B2C target info for environment');
        return {slug, name, instanceId: null, sites: []};
      }

      if (error) {
        throw new Error(`Failed to get B2C target info for environment ${slug}: ${JSON.stringify(error)}`);
      }

      return {slug, name, instanceId: data.instance_id ?? null, sites: data.sites ?? []};
    }),
  );

  const instanceIds = [...new Set(environments.map((e) => e.instanceId).filter((id): id is string => id !== null))];

  return {
    slug: project.slug ?? projectSlug,
    uiManagedAt: project.ui_managed_at ?? 'mrt',
    scapiEnabled: project.is_scapi_enabled ?? null,
    mrtApiEnabled: project.is_mrt_api_enabled ?? null,
    environments,
    instanceIds,
  };
}
