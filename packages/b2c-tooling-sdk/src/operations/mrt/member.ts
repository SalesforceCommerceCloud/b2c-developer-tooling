/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Member operations for Managed Runtime.
 *
 * Handles listing, adding, updating, and removing project members.
 *
 * @module operations/mrt/member
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Member type from API.
 */
export type MrtMember = components['schemas']['APIProjectMember'];

/**
 * Patched member for updates.
 */
export type PatchedMrtMember = components['schemas']['PatchedAPIProjectMember'];

/**
 * Member role values.
 * 0 = Admin, 1 = Developer, 2 = Marketer, 3 = Read Only
 */
export type MemberRoleValue = 0 | 1 | 2 | 3;

/**
 * Member role names.
 */
export const MEMBER_ROLES: Record<MemberRoleValue, string> = {
  0: 'Admin',
  1: 'Developer',
  2: 'Marketer',
  3: 'Read Only',
};

/**
 * Options for listing members.
 */
export interface ListMembersOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Maximum number of results to return.
   */
  limit?: number;

  /**
   * Offset for pagination.
   */
  offset?: number;

  /**
   * Filter by role value.
   */
  role?: MemberRoleValue;

  /**
   * Search term for filtering.
   */
  search?: string;

  /**
   * Field to order results by.
   */
  ordering?: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of listing members.
 */
export interface ListMembersResult {
  /**
   * Total count of members.
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
   * Array of members.
   */
  members: MrtMember[];
}

/**
 * Lists members for an MRT project.
 *
 * @param options - List options including project slug
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of members
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listMembers } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listMembers({
 *   projectSlug: 'my-storefront'
 * }, auth);
 *
 * for (const member of result.members) {
 *   console.log(`${member.user}: ${member.role?.name}`);
 * }
 * ```
 */
export async function listMembers(options: ListMembersOptions, auth: AuthStrategy): Promise<ListMembersResult> {
  const logger = getLogger();
  const {projectSlug, limit, offset, role, search, ordering, origin} = options;

  logger.debug({projectSlug}, '[MRT] Listing members');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/members/', {
    params: {
      path: {project_slug: projectSlug, role: ''},
      query: {
        limit,
        offset,
        role,
        search,
        ordering,
      },
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to list members: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Members listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    members: data.results ?? [],
  };
}

/**
 * Options for adding a member.
 */
export interface AddMemberOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Email address of the user to add.
   */
  email: string;

  /**
   * Role value for the member.
   * 0 = Admin, 1 = Developer, 2 = Marketer, 3 = Read Only
   */
  role: MemberRoleValue;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Adds a member to an MRT project.
 *
 * @param options - Add member options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The created member
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { addMember } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const member = await addMember({
 *   projectSlug: 'my-storefront',
 *   email: 'user@example.com',
 *   role: 1  // Developer
 * }, auth);
 * ```
 */
export async function addMember(options: AddMemberOptions, auth: AuthStrategy): Promise<MrtMember> {
  const logger = getLogger();
  const {projectSlug, email, role, origin} = options;

  logger.debug({projectSlug, email, role}, '[MRT] Adding member');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.POST('/api/projects/{project_slug}/members/', {
    params: {
      path: {project_slug: projectSlug},
    },
    body: {
      user: email,
      role: {
        value: role,
        name: MEMBER_ROLES[role],
      },
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to add member: ${errorMessage}`);
  }

  logger.debug({email}, '[MRT] Member added');

  return data;
}

/**
 * Options for getting a member.
 */
export interface GetMemberOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Email address of the member.
   */
  email: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Gets a member from an MRT project.
 *
 * @param options - Get member options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The member
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { getMember } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const member = await getMember({
 *   projectSlug: 'my-storefront',
 *   email: 'user@example.com'
 * }, auth);
 *
 * console.log(`Role: ${member.role?.name}`);
 * ```
 */
export async function getMember(options: GetMemberOptions, auth: AuthStrategy): Promise<MrtMember> {
  const logger = getLogger();
  const {projectSlug, email, origin} = options;

  logger.debug({projectSlug, email}, '[MRT] Getting member');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/members/{email}/', {
    params: {
      path: {project_slug: projectSlug, email},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get member: ${errorMessage}`);
  }

  logger.debug({email}, '[MRT] Member retrieved');

  return data;
}

/**
 * Options for updating a member.
 */
export interface UpdateMemberOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Email address of the member to update.
   */
  email: string;

  /**
   * New role value for the member.
   * 0 = Admin, 1 = Developer, 2 = Marketer, 3 = Read Only
   */
  role: MemberRoleValue;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Updates a member's role in an MRT project.
 *
 * @param options - Update member options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The updated member
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { updateMember } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const member = await updateMember({
 *   projectSlug: 'my-storefront',
 *   email: 'user@example.com',
 *   role: 0  // Promote to Admin
 * }, auth);
 * ```
 */
export async function updateMember(options: UpdateMemberOptions, auth: AuthStrategy): Promise<MrtMember> {
  const logger = getLogger();
  const {projectSlug, email, role, origin} = options;

  logger.debug({projectSlug, email, role}, '[MRT] Updating member');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.PATCH('/api/projects/{project_slug}/members/{email}/', {
    params: {
      path: {project_slug: projectSlug, email},
    },
    body: {
      role: {
        value: role,
        name: MEMBER_ROLES[role],
      },
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to update member: ${errorMessage}`);
  }

  logger.debug({email}, '[MRT] Member updated');

  return data;
}

/**
 * Options for removing a member.
 */
export interface RemoveMemberOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Email address of the member to remove.
   */
  email: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Removes a member from an MRT project.
 *
 * @param options - Remove member options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { removeMember } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * await removeMember({
 *   projectSlug: 'my-storefront',
 *   email: 'user@example.com'
 * }, auth);
 *
 * console.log('Member removed');
 * ```
 */
export async function removeMember(options: RemoveMemberOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, email, origin} = options;

  logger.debug({projectSlug, email}, '[MRT] Removing member');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/projects/{project_slug}/members/{email}/', {
    params: {
      path: {project_slug: projectSlug, email},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to remove member: ${errorMessage}`);
  }

  logger.debug({email}, '[MRT] Member removed');
}
