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

/**
 * Lists certificates for an organization.
 *
 * @param options - List options for filtering and pagination
 * @param options.organizationSlug - The organization slug to list certificates for
 * @param options.limit - Maximum number of results to return (optional)
 * @param options.offset - Number of results to skip (optional)
 * @param options.ordering - Field to order results by (optional)
 * @param options.search - Search query to filter results (optional)
 * @param options.customOnly - When true, return only customer-managed certificates (optional)
 * @param options.origin - Custom API origin (optional, defaults to DEFAULT_MRT_ORIGIN)
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns A paginated list result containing certificate count, pagination links, and certificate data
 * @throws Error if the API request fails
 *
 * @example
 * ```typescript
 * import {ApiKeyStrategy} from '@salesforce/b2c-tooling-sdk/auth';
 * import {listCertificates} from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listCertificates({
 *   organizationSlug: 'my-org',
 *   limit: 10,
 *   customOnly: true,
 * }, auth);
 *
 * console.log(`Found ${result.count} certificates`);
 * ```
 */
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

/**
 * Retrieves a certificate by ID.
 *
 * @param options - Options including organizationSlug and certId
 * @param auth - Authentication strategy
 * @returns The certificate details
 * @throws Error if the request fails
 */
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

/**
 * Creates a certificate for a domain in an organization.
 *
 * @param options - Create options with organization slug and domain name
 * @param auth - Authentication strategy
 * @returns A promise that resolves to the created certificate
 * @throws Error if the request fails (e.g., invalid domain, duplicate certificate)
 *
 * @example
 * ```typescript
 * import {ApiKeyStrategy} from '@salesforce/b2c-tooling-sdk/auth';
 * import {createCertificate} from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const cert = await createCertificate({
 *   organizationSlug: 'my-org',
 *   domainName: 'shop.example.com',
 * }, auth);
 * ```
 */
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

/**
 * Deletes a certificate from an organization.
 *
 * @param options - Delete options including organization slug and certificate ID
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws {Error} If the request fails or certificate cannot be deleted
 */
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
 *
 * @param options - Configuration options
 * @param options.organizationSlug - The organization slug
 * @param options.certId - The certificate ID
 * @param options.origin - Optional MRT API origin URL
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The restarted certificate object
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * import {ApiKeyStrategy} from '@salesforce/b2c-tooling-sdk/auth';
 * import {restartCertificateValidation} from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const cert = await restartCertificateValidation({
 *   organizationSlug: 'my-org',
 *   certId: 12345,
 * }, auth);
 * ```
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
