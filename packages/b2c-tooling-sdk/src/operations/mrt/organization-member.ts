/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Organization member operations for Managed Runtime.
 *
 * Distinct from project members: organization members hold a role at the
 * organization level and may be granted permission to view all projects
 * and manage custom domain certificates.
 *
 * @module operations/mrt/organization-member
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

export type MrtOrgMember = components['schemas']['APIOrganizationMember'];
export type MrtOrgMemberCreate = components['schemas']['APIOrganizationMemberCreate'];
export type MrtOrgMemberUpdate = components['schemas']['PatchedAPIOrganizationMemberUpdate'];

/**
 * Organization role values.
 * 0 = Owner, 1 = Member
 */
export type OrgRoleValue = 0 | 1;

export const ORG_ROLES: Record<OrgRoleValue, string> = {
  0: 'Owner',
  1: 'Member',
};

/**
 * Cert permission status. 1 = Disabled, 2 = Enabled (per Status1d2Enum).
 */
export type OrgCertPermission = 1 | 2;

function describeError(error: unknown, action: string): Error {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as {message: unknown}).message)
      : JSON.stringify(error);
  return new Error(`Failed to ${action}: ${message}`);
}

export interface ListOrgMembersOptions {
  organizationSlug: string;
  limit?: number;
  offset?: number;
  ordering?: string;
  search?: string;
  origin?: string;
}

export interface ListOrgMembersResult {
  count: number;
  next: string | null;
  previous: string | null;
  members: MrtOrgMember[];
}

export async function listOrgMembers(
  options: ListOrgMembersOptions,
  auth: AuthStrategy,
): Promise<ListOrgMembersResult> {
  const logger = getLogger();
  const {organizationSlug, limit, offset, ordering, search, origin} = options;

  logger.debug({organizationSlug}, '[MRT] Listing organization members');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/organizations/{organization_slug}/members/', {
    params: {
      path: {organization_slug: organizationSlug},
      query: {limit, offset, ordering, search},
    },
  });

  if (error) throw describeError(error, 'list organization members');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    members: data.results ?? [],
  };
}

export interface AddOrgMemberOptions {
  organizationSlug: string;
  email: string;
  role: OrgRoleValue;
  canViewAllProjects?: boolean;
  customDomainCertPermission?: OrgCertPermission;
  origin?: string;
}

export async function addOrgMember(options: AddOrgMemberOptions, auth: AuthStrategy): Promise<MrtOrgMember> {
  const logger = getLogger();
  const {organizationSlug, email, role, canViewAllProjects, customDomainCertPermission, origin} = options;

  logger.debug({organizationSlug, email, role}, '[MRT] Adding organization member');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: MrtOrgMemberCreate = {user: email, role};
  if (canViewAllProjects !== undefined) body.can_view_all_projects = canViewAllProjects;
  if (customDomainCertPermission !== undefined) body.custom_domain_cert_permission = customDomainCertPermission;

  const {error} = await client.POST('/api/organizations/{organization_slug}/members/', {
    params: {path: {organization_slug: organizationSlug}},
    body,
  });

  if (error) throw describeError(error, 'add organization member');

  // Re-fetch to get the full member shape (POST response omits email/first_name/last_name).
  return getOrgMember({organizationSlug, email, origin}, auth);
}

export interface GetOrgMemberOptions {
  organizationSlug: string;
  email: string;
  origin?: string;
}

export async function getOrgMember(options: GetOrgMemberOptions, auth: AuthStrategy): Promise<MrtOrgMember> {
  const {organizationSlug, email, origin} = options;
  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/organizations/{organization_slug}/members/{email}/', {
    params: {path: {organization_slug: organizationSlug, email}},
  });

  if (error) throw describeError(error, 'get organization member');

  return data;
}

export interface UpdateOrgMemberOptions {
  organizationSlug: string;
  email: string;
  canViewAllProjects?: boolean;
  customDomainCertPermission?: OrgCertPermission;
  origin?: string;
}

export async function updateOrgMember(options: UpdateOrgMemberOptions, auth: AuthStrategy): Promise<MrtOrgMember> {
  const {organizationSlug, email, canViewAllProjects, customDomainCertPermission, origin} = options;
  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: MrtOrgMemberUpdate = {};
  if (canViewAllProjects !== undefined) body.can_view_all_projects = canViewAllProjects;
  if (customDomainCertPermission !== undefined) body.custom_domain_cert_permission = customDomainCertPermission;

  const {error} = await client.PATCH('/api/organizations/{organization_slug}/members/{email}/', {
    params: {path: {organization_slug: organizationSlug, email}},
    body,
  });

  if (error) throw describeError(error, 'update organization member');

  // Re-fetch to get the full member shape (PATCH response omits email/first_name/last_name).
  return getOrgMember({organizationSlug, email, origin}, auth);
}

export interface RemoveOrgMemberOptions {
  organizationSlug: string;
  email: string;
  origin?: string;
}

export async function removeOrgMember(options: RemoveOrgMemberOptions, auth: AuthStrategy): Promise<void> {
  const {organizationSlug, email, origin} = options;
  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/organizations/{organization_slug}/members/{email}/', {
    params: {path: {organization_slug: organizationSlug, email}},
  });

  if (error) throw describeError(error, 'remove organization member');
}
