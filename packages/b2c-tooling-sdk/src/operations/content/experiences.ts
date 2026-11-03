/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Page Designer operations through the SCAPI Admin Experiences API
 * (`experience/experiences/v1`): live page and component type metadata and
 * page push.
 *
 * Every entry point here needs SCAPI system auth (client credentials or JWT),
 * a short code, a tenant ID, and the `sfcc.experiences` or
 * `sfcc.experiences.rw` scope. Callers that only want to *enhance* an
 * existing experience (VS Code tree, validation hints) should use
 * {@link getExperiencesAvailability} or catch {@link ExperiencesUnavailableError}
 * so that a missing scope degrades the feature instead of failing.
 *
 * @module operations/content/experiences
 */
import type {B2CInstance} from '../../instance/index.js';
import {
  createScapiExperiencesClient,
  type ExperienceComponentType,
  type ExperiencePage,
  type ExperiencePageRequest,
  type ExperiencePageType,
  type ScapiExperiencesClient,
} from '../../clients/scapi-experiences.js';
import {toOrganizationId} from '../../clients/custom-apis.js';
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {getApiErrorMessage} from '../../clients/error-utils.js';
import {isInvalidScopeError} from '../../clients/scapi-backend-utils.js';
import {getLogger} from '../../logging/logger.js';

/** @internal */
export const READ_HEADERS = {[SCOPE_MODE_HEADER]: 'read'};
/** @internal */
export const WRITE_HEADERS = {[SCOPE_MODE_HEADER]: 'write'};

/** Page size used when walking type listings (spec maximum). */
const TYPE_PAGE_SIZE = 200;

/** Why the Experiences API cannot be used for an instance. */
export type ExperiencesUnavailableReason =
  /** No short code or tenant ID configured. */
  | 'not-configured'
  /** Auth flow is browser/user based (SCAPI Admin APIs need client credentials or JWT). */
  | 'unsupported-auth'
  /** The API client was not granted `sfcc.experiences` / `sfcc.experiences.rw` (or the role lacks access). */
  | 'missing-scope'
  /** The API responded but not successfully for another reason (e.g. unknown site, network). */
  | 'error';

/**
 * Thrown when the Experiences API cannot be used. `reason` lets callers
 * distinguish configuration gaps (degrade quietly) from real request errors.
 */
export class ExperiencesUnavailableError extends Error {
  constructor(
    message: string,
    public readonly reason: ExperiencesUnavailableReason,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ExperiencesUnavailableError';
  }
}

/** Raised when the Experiences API rejects a request (400/404/409), with the API detail. */
export class ExperiencesRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ExperiencesRequestError';
  }
}

/** Raised for a page push the API rejected (400/404/409), with the API detail. */
export class PagePushError extends ExperiencesRequestError {
  constructor(message: string, status: number, body?: unknown) {
    super(message, status, body);
    this.name = 'PagePushError';
  }
}

const SCOPE_HINT =
  'The Experiences API needs an Account Manager API client with the "sfcc.experiences.rw" (or read-only "sfcc.experiences") scope, client credentials or JWT auth, and a configured short code and tenant ID.';

/** @internal */
export interface ExperiencesContext {
  client: ScapiExperiencesClient;
  organizationId: string;
}

/** Cache clients per instance so repeated calls reuse token state. */
const contextCache = new WeakMap<B2CInstance, ExperiencesContext>();

/** @internal Shared Experiences API client and organization ID for an instance. */
export function experiencesContext(instance: B2CInstance): ExperiencesContext {
  const cached = contextCache.get(instance);
  if (cached) return cached;

  const {shortCode, tenantId} = instance.config;
  if (!shortCode || !tenantId) {
    throw new ExperiencesUnavailableError(
      `Experiences API requires a short code and tenant ID. ${SCOPE_HINT}`,
      'not-configured',
    );
  }
  const scapi = instance.scapiClientConfig;
  if (!scapi) {
    throw new ExperiencesUnavailableError(
      `Experiences API requires client credentials or JWT authentication (browser sign-in is not supported by SCAPI Admin APIs). ${SCOPE_HINT}`,
      'unsupported-auth',
    );
  }
  const ctx: ExperiencesContext = {
    client: createScapiExperiencesClient({shortCode: scapi.shortCode, tenantId: scapi.tenantId}, scapi.auth),
    organizationId: toOrganizationId(scapi.tenantId),
  };
  contextCache.set(instance, ctx);
  return ctx;
}

/** Map a thrown token error or an HTTP failure to {@link ExperiencesUnavailableError}. */
/** @internal */
export function experiencesUnavailable(
  error: unknown,
  response: Response | undefined,
  what: string,
): ExperiencesUnavailableError {
  if (isInvalidScopeError(error)) {
    return new ExperiencesUnavailableError(
      `${what}: the API client is not granted the Experiences scope. ${SCOPE_HINT}`,
      'missing-scope',
      undefined,
      {
        cause: error,
      },
    );
  }
  if (response && (response.status === 401 || response.status === 403)) {
    return new ExperiencesUnavailableError(
      `${what}: access denied (${response.status}). ${SCOPE_HINT}`,
      'missing-scope',
      response.status,
      {cause: error},
    );
  }
  const detail = response
    ? getApiErrorMessage(error, response)
    : error instanceof Error
      ? error.message
      : String(error);
  return new ExperiencesUnavailableError(`${what}: ${detail}`, 'error', response?.status, {cause: error});
}

/**
 * @internal Map a non-2xx response: 401/403 to {@link ExperiencesUnavailableError}
 * (missing scope), anything else to {@link ExperiencesRequestError}.
 */
export function experiencesRequestFailure(error: unknown, response: Response, what: string): Error {
  if (response.status === 401 || response.status === 403) return experiencesUnavailable(error, response, what);
  return new ExperiencesRequestError(`${what}: ${getApiErrorMessage(error, response)}`, response.status, error);
}

/** Options for listing page/component types. */
export interface ListExperienceTypesOptions {
  /** Site ID whose cartridge path defines the available types. */
  siteId: string;
}

async function walkTypes<T>(
  instance: B2CInstance,
  kind: 'page-types' | 'component-types',
  siteId: string,
): Promise<T[]> {
  const {client, organizationId} = experiencesContext(instance);
  const path =
    kind === 'page-types'
      ? ('/organizations/{organizationId}/page-types' as const)
      : ('/organizations/{organizationId}/component-types' as const);
  const what = `Failed to list ${kind.replace('-', ' ')} for site ${siteId}`;

  const all: T[] = [];
  let offset = 0;
  for (;;) {
    let result;
    try {
      result = await client.GET(path, {
        params: {path: {organizationId}, query: {siteId, limit: TYPE_PAGE_SIZE, offset}},
        headers: READ_HEADERS,
      });
    } catch (error) {
      throw experiencesUnavailable(error, undefined, what);
    }
    const {data, error, response} = result;
    if (!data) {
      throw experiencesUnavailable(error, response, what);
    }
    const hits = (data.hits ?? []) as T[];
    all.push(...hits);
    offset += hits.length;
    if (hits.length === 0 || offset >= (data.total ?? 0)) break;
  }
  return all;
}

/**
 * Lists the Page Designer page types available to a site on the instance
 * (from the site's cartridge path), with region and attribute definitions.
 *
 * @throws ExperiencesUnavailableError when the API cannot be used or the request fails
 */
export async function listPageTypes(
  instance: B2CInstance,
  options: ListExperienceTypesOptions,
): Promise<ExperiencePageType[]> {
  return walkTypes<ExperiencePageType>(instance, 'page-types', options.siteId);
}

/**
 * Lists the Page Designer component types available to a site on the
 * instance, with region and attribute definitions.
 *
 * Component type IDs are returned without the `component.` prefix used in
 * library XML (for example `Content.hero`, stored as `component.Content.hero`).
 *
 * @throws ExperiencesUnavailableError when the API cannot be used or the request fails
 */
export async function listComponentTypes(
  instance: B2CInstance,
  options: ListExperienceTypesOptions,
): Promise<ExperienceComponentType[]> {
  return walkTypes<ExperienceComponentType>(instance, 'component-types', options.siteId);
}

/** Page and component types for a site. */
export interface ExperienceTypes {
  siteId: string;
  pageTypes: ExperiencePageType[];
  componentTypes: ExperienceComponentType[];
}

/**
 * Fetches both page and component types for a site.
 *
 * @throws ExperiencesUnavailableError when the API cannot be used or the request fails
 */
export async function fetchExperienceTypes(
  instance: B2CInstance,
  options: ListExperienceTypesOptions,
): Promise<ExperienceTypes> {
  const [pageTypes, componentTypes] = await Promise.all([
    listPageTypes(instance, options),
    listComponentTypes(instance, options),
  ]);
  return {siteId: options.siteId, pageTypes, componentTypes};
}

/** Result of {@link getExperiencesAvailability}. */
export type ExperiencesAvailability =
  | {available: true}
  | {available: false; reason: ExperiencesUnavailableReason; message: string};

/**
 * Probes whether the Experiences API is usable for this instance and site
 * without throwing. Intended for UIs that add optional live features
 * (e.g. a "Page Types" tree node) and must keep working without them.
 */
export async function getExperiencesAvailability(
  instance: B2CInstance,
  options: ListExperienceTypesOptions,
): Promise<ExperiencesAvailability> {
  try {
    const {client, organizationId} = experiencesContext(instance);
    let result;
    try {
      result = await client.GET('/organizations/{organizationId}/page-types', {
        params: {path: {organizationId}, query: {siteId: options.siteId, limit: 1}},
        headers: READ_HEADERS,
      });
    } catch (error) {
      throw experiencesUnavailable(error, undefined, 'Experiences API unavailable');
    }
    if (!result.data) {
      throw experiencesUnavailable(result.error, result.response, 'Experiences API unavailable');
    }
    return {available: true};
  } catch (error) {
    if (error instanceof ExperiencesUnavailableError) {
      return {available: false, reason: error.reason, message: error.message};
    }
    throw error;
  }
}

/** Options for {@link pushPage}. */
export interface PushPageOptions {
  /** Site the page belongs to. */
  siteId: string;
}

/** Result of {@link pushPage}. */
export interface PushPageResult {
  /** `created` (201) or `updated` (200). */
  status: 'created' | 'updated';
  /** The page as returned by the API (defaults applied to component data). */
  page: ExperiencePage;
}

/**
 * Creates or updates a Page Designer page (with its regions and components)
 * without a site-archive import.
 *
 * Behavior verified against the platform:
 *
 * - A new page is created offline. Set it online in Business Manager.
 * - An update keeps the page's online state. Changes to an online page are
 *   live right away (the Shopper Experience API returns them immediately);
 *   there is no separate draft version.
 * - Regions included in the request replace that region's component list;
 *   regions omitted are left as they are. Component `data` is merged.
 * - An existing page's type cannot be changed. Components removed from a
 *   region remain in the library as unassigned components.
 *
 * @throws ExperiencesUnavailableError when the API cannot be used (config, auth, scope)
 * @throws PagePushError when the API rejects the page (400/404/409)
 */
export async function pushPage(
  instance: B2CInstance,
  page: ExperiencePageRequest,
  options: PushPageOptions,
): Promise<PushPageResult> {
  const logger = getLogger();
  const {client, organizationId} = experiencesContext(instance);
  const what = `Failed to push page ${page.id}`;

  let result;
  try {
    result = await client.PUT('/organizations/{organizationId}/pages/{pageId}', {
      params: {path: {organizationId, pageId: page.id}, query: {siteId: options.siteId}},
      // The generated request type narrows `data` to an empty record; the
      // runtime body is the hand-written ExperiencePageRequest.
      body: page as never,
      headers: WRITE_HEADERS,
    });
  } catch (error) {
    throw experiencesUnavailable(error, undefined, what);
  }

  const {data, error, response} = result;
  if (!data) {
    if (response.status === 401 || response.status === 403) {
      throw experiencesUnavailable(error, response, what);
    }
    throw new PagePushError(`${what}: ${getApiErrorMessage(error, response)}`, response.status, error);
  }

  const status = response.status === 201 ? 'created' : 'updated';
  logger.debug({pageId: page.id, siteId: options.siteId, status}, `Pushed page ${page.id} (${status})`);
  return {status, page: data as ExperiencePage};
}
