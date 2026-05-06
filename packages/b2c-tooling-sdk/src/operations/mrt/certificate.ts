/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Custom domain certificate operations for Managed Runtime.
 *
 * Certificates are organization-scoped and can be associated with environments
 * via the `certificate_id` field on target create/update/clone operations.
 *
 * @module operations/mrt/certificate
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

export type MrtCertificate = components['schemas']['CertificateBase'];
export type MrtCertificateListCreate = components['schemas']['CertificateListCreate'];

function describeError(error: unknown, action: string): Error {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as {message: unknown}).message)
      : JSON.stringify(error);
  return new Error(`Failed to ${action}: ${message}`);
}

export interface ListCertificatesOptions {
  organizationSlug: string;
  limit?: number;
  offset?: number;
  ordering?: string;
  search?: string;
  /** When true, return only customer-managed certificates. */
  customOnly?: boolean;
  origin?: string;
}

export interface ListCertificatesResult {
  count: number;
  next: string | null;
  previous: string | null;
  certificates: MrtCertificateListCreate[];
}

export async function listCertificates(
  options: ListCertificatesOptions,
  auth: AuthStrategy,
): Promise<ListCertificatesResult> {
  const logger = getLogger();
  const {organizationSlug, limit, offset, ordering, search, customOnly, origin} = options;

  logger.debug({organizationSlug}, '[MRT] Listing certificates');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/organizations/{organization_slug}/certificates/', {
    params: {
      path: {organization_slug: organizationSlug},
      query: {limit, offset, ordering, search, custom_only: customOnly},
    },
  });

  if (error) throw describeError(error, 'list certificates');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    certificates: data.results ?? [],
  };
}

export interface GetCertificateOptions {
  organizationSlug: string;
  certId: number;
  origin?: string;
}

export async function getCertificate(options: GetCertificateOptions, auth: AuthStrategy): Promise<MrtCertificate> {
  const {organizationSlug, certId, origin} = options;
  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/organizations/{organization_slug}/certificates/{cert_id}/', {
    params: {path: {organization_slug: organizationSlug, cert_id: String(certId)}},
  });

  if (error) throw describeError(error, 'get certificate');

  return data;
}

export interface CreateCertificateOptions {
  organizationSlug: string;
  /**
   * The domain for the certificate (e.g. shop.example.com).
   */
  domainName: string;
  origin?: string;
}

export async function createCertificate(
  options: CreateCertificateOptions,
  auth: AuthStrategy,
): Promise<MrtCertificateListCreate> {
  const logger = getLogger();
  const {organizationSlug, domainName, origin} = options;

  logger.debug({organizationSlug, domainName}, '[MRT] Creating certificate');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.POST('/api/organizations/{organization_slug}/certificates/', {
    params: {path: {organization_slug: organizationSlug}},
    body: {domain_name: domainName},
  });

  if (error) throw describeError(error, 'create certificate');

  return data;
}

export interface DeleteCertificateOptions {
  organizationSlug: string;
  certId: number;
  origin?: string;
}

export async function deleteCertificate(options: DeleteCertificateOptions, auth: AuthStrategy): Promise<void> {
  const {organizationSlug, certId, origin} = options;
  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/organizations/{organization_slug}/certificates/{cert_id}/', {
    params: {path: {organization_slug: organizationSlug, cert_id: String(certId)}},
  });

  if (error) throw describeError(error, 'delete certificate');
}

export interface RestartCertificateValidationOptions {
  organizationSlug: string;
  certId: number;
  origin?: string;
}

/**
 * Restarts validation for a certificate. Only works for certificates that have
 * not yet been validated.
 */
export async function restartCertificateValidation(
  options: RestartCertificateValidationOptions,
  auth: AuthStrategy,
): Promise<MrtCertificate> {
  const {organizationSlug, certId, origin} = options;
  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.PATCH(
    '/api/organizations/{organization_slug}/certificates/{cert_id}/restart-validation/',
    {
      params: {path: {organization_slug: organizationSlug, cert_id: String(certId)}},
      body: {},
    },
  );

  if (error) throw describeError(error, 'restart certificate validation');

  return data;
}
