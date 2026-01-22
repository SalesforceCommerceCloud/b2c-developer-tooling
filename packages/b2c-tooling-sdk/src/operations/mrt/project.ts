/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Project operations for Managed Runtime.
 *
 * Handles CRUD operations for MRT projects.
 *
 * @module operations/mrt/project
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * MRT project type for create/read operations.
 */
export type MrtProject = components['schemas']['APIProjectV2Create'];

/**
 * MRT project type for update operations.
 */
export type MrtProjectUpdate = components['schemas']['APIProjectV2Update'];

/**
 * Patched project for partial updates.
 */
export type PatchedMrtProject = components['schemas']['PatchedAPIProjectV2Update'];

/**
 * SSR region enum.
 */
export type SsrRegion = components['schemas']['SsrRegionEnum'];

/**
 * Options for listing MRT projects.
 */
export interface ListProjectsOptions {
  /**
   * Filter by organization slug.
   */
  organization?: string;

  /**
   * Maximum number of results to return.
   */
  limit?: number;

  /**
   * Offset for pagination.
   */
  offset?: number;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of listing projects.
 */
export interface ListProjectsResult {
  /**
   * Total count of projects.
   */
  count: number;

  /**
   * URL for next page of results.
   */
  next: string | null;

  /**
   * URL for previous page of results.
   */
  previous: string | null;

  /**
   * Array of projects.
   */
  projects: MrtProject[];
}

/**
 * Lists projects accessible to the authenticated user.
 *
 * @param options - List options including organization filter and pagination
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of projects
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listProjects } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * // List all projects
 * const result = await listProjects({}, auth);
 *
 * // List projects for a specific organization
 * const orgProjects = await listProjects({ organization: 'my-org' }, auth);
 * ```
 */
export async function listProjects(options: ListProjectsOptions, auth: AuthStrategy): Promise<ListProjectsResult> {
  const logger = getLogger();
  const {organization, limit, offset, origin} = options;

  logger.debug({organization, limit, offset}, '[MRT] Listing projects');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/', {
    params: {
      query: {
        organization,
        limit,
        offset,
      },
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to list projects: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Projects listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    projects: data.results ?? [],
  };
}

/**
 * Options for creating an MRT project.
 */
export interface CreateProjectOptions {
  /**
   * User-friendly name for the project.
   */
  name: string;

  /**
   * Project slug/identifier (auto-generated if not provided).
   */
  slug?: string;

  /**
   * Organization slug to create the project in.
   */
  organization: string;

  /**
   * Project URL.
   */
  url?: string;

  /**
   * Default AWS region for new targets.
   */
  ssrRegion?: SsrRegion;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Creates a new MRT project.
 *
 * @param options - Project creation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The created project
 * @throws Error if creation fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { createProject } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const project = await createProject({
 *   name: 'My Storefront',
 *   organization: 'my-org',
 *   ssrRegion: 'us-east-1'
 * }, auth);
 *
 * console.log(`Created project: ${project.slug}`);
 * ```
 */
export async function createProject(options: CreateProjectOptions, auth: AuthStrategy): Promise<MrtProject> {
  const logger = getLogger();
  const {name, slug, organization, url, ssrRegion, origin} = options;

  logger.debug({name, organization}, '[MRT] Creating project');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: MrtProject = {
    name,
    organization,
  };

  if (slug) {
    body.slug = slug;
  }

  if (url) {
    body.url = url;
  }

  if (ssrRegion) {
    body.ssr_region = ssrRegion;
  }

  const {data, error} = await client.POST('/api/projects/', {
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to create project: ${errorMessage}`);
  }

  logger.debug({slug: data.slug}, '[MRT] Project created');

  return data;
}

/**
 * Options for getting an MRT project.
 */
export interface GetProjectOptions {
  /**
   * Project slug to retrieve.
   */
  projectSlug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Gets a project by slug.
 *
 * @param options - Get options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The project
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getProject } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const project = await getProject({ projectSlug: 'my-storefront' }, auth);
 * console.log(`Project: ${project.name}`);
 * ```
 */
export async function getProject(options: GetProjectOptions, auth: AuthStrategy): Promise<MrtProjectUpdate> {
  const logger = getLogger();
  const {projectSlug, origin} = options;

  logger.debug({projectSlug}, '[MRT] Getting project');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/', {
    params: {
      path: {project_slug: projectSlug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get project: ${errorMessage}`);
  }

  logger.debug({slug: data.slug}, '[MRT] Project retrieved');

  return data;
}

/**
 * Options for updating an MRT project.
 */
export interface UpdateProjectOptions {
  /**
   * Project slug to update.
   */
  projectSlug: string;

  /**
   * New name for the project.
   */
  name?: string;

  /**
   * New URL for the project.
   */
  url?: string;

  /**
   * New default AWS region for new targets.
   */
  ssrRegion?: SsrRegion;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Updates an MRT project.
 *
 * @param options - Update options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The updated project
 * @throws Error if update fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { updateProject } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const updated = await updateProject({
 *   projectSlug: 'my-storefront',
 *   name: 'My Updated Storefront'
 * }, auth);
 * ```
 */
export async function updateProject(options: UpdateProjectOptions, auth: AuthStrategy): Promise<MrtProjectUpdate> {
  const logger = getLogger();
  const {projectSlug, name, url, ssrRegion, origin} = options;

  logger.debug({projectSlug}, '[MRT] Updating project');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: PatchedMrtProject = {};

  if (name !== undefined) {
    body.name = name;
  }

  if (url !== undefined) {
    body.url = url;
  }

  if (ssrRegion !== undefined) {
    body.ssr_region = ssrRegion;
  }

  const {data, error} = await client.PATCH('/api/projects/{project_slug}/', {
    params: {
      path: {project_slug: projectSlug},
    },
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to update project: ${errorMessage}`);
  }

  logger.debug({slug: data.slug}, '[MRT] Project updated');

  return data;
}

/**
 * Options for deleting an MRT project.
 */
export interface DeleteProjectOptions {
  /**
   * Project slug to delete.
   */
  projectSlug: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Deletes an MRT project.
 *
 * @param options - Delete options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if deletion fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { deleteProject } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * await deleteProject({ projectSlug: 'my-old-project' }, auth);
 * console.log('Project deleted');
 * ```
 */
export async function deleteProject(options: DeleteProjectOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, origin} = options;

  logger.debug({projectSlug}, '[MRT] Deleting project');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/projects/{project_slug}/', {
    params: {
      path: {project_slug: projectSlug},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to delete project: ${errorMessage}`);
  }

  logger.debug({projectSlug}, '[MRT] Project deleted');
}
