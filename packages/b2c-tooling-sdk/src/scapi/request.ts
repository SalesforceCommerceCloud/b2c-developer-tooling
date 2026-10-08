/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import createClient, {createQuerySerializer} from 'openapi-fetch';
import type {HttpMethod} from 'openapi-typescript-helpers';
import type {AuthStrategy} from '../auth/types.js';
import {buildTenantScope, toOrganizationId} from '../clients/custom-apis.js';
import {withScopes} from '../clients/scapi-backend-utils.js';
import {createAuthMiddleware, createSafetyMiddleware} from '../clients/middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from '../clients/middleware-registry.js';
import {SafetyGuard, extractJobIdFromPath, type SafetyConfig} from '../safety/index.js';
import {getLogger} from '../logging/logger.js';
import {findScapiOperation, resolveScapiReference, type ApiDocument, type ScapiSchemaDocument} from './catalog.js';
import {createLiveScapiDocument} from './live.js';
import {isFullScapiExpand} from './schema-source.js';
import type {ScapiShopperAuth} from './shopper.js';
import {
  scapiAuthError,
  scapiAuthResponse,
  scapiShopperAuthError,
  selectScapiAuth,
  shopperTokenScopes,
  unsupportedScapiAuth,
  unsupportedScapiTransfer,
  isScapiTextMediaType,
} from './authentication.js';

/** Exact, resolved request awaiting approval. Credentials are never included. */
export interface ScapiConfirmation {
  operationId: string;
  method: string;
  url: string;
  query: Record<string, unknown>;
  body?: unknown;
  reason: string;
}

export interface ScapiRequestOptions {
  shortCode: string;
  tenantId: string;
  siteId?: string;
  /** Account Manager auth for operations declaring AmOAuth2. */
  auth: AuthStrategy | (() => AuthStrategy);
  /** Guest shopper auth for operations declaring ShopperToken. Omit to reject Shopper operations. */
  shopperAuth?: ScapiShopperAuth;
  safety: SafetyConfig;
  documents: ScapiSchemaDocument[];
  middlewareRegistry?: MiddlewareRegistry;
  /** Resolve only after user approval; reject on decline/cancellation. Omit to block confirmations. */
  confirm?: (request: ScapiConfirmation, signal: AbortSignal) => Promise<void>;
  /** Called immediately before network dispatch, for tracking potentially applied writes. */
  onDispatch?: () => void;
  /** Called with each contract fetched from the Schemas API; `full` reports tenant custom properties and operation prose (expand=all). */
  onSchema?: (document: ScapiSchemaDocument, full: boolean) => void;
}

/** Build one execution's SCAPI request helper. Auth, policy, and responses stay in the host. */
export function createScapiRequest(
  options: ScapiRequestOptions,
): (input: unknown, signal: AbortSignal) => Promise<unknown> {
  if (!/^[a-z0-9-]+$/i.test(options.shortCode)) throw new Error('Invalid SCAPI shortCode.');
  const origin = `https://${options.shortCode}.api.commercecloud.salesforce.com`;
  const organizationId = toOrganizationId(options.tenantId);
  const documents = [...options.documents];
  let totalBytes = 0;
  return async (input, signal) => {
    signal.throwIfAborted();
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Request must be an object.');
    // Detach the request from caller mutations while a confirmation is outstanding.
    const args = structuredClone(input) as Record<string, unknown>;
    if (Object.keys(args).some((key) => !['method', 'path', 'query', 'body'].includes(key)))
      throw new Error('Request accepts method, path, query, body only.');
    const method = typeof args.method === 'string' ? args.method.toUpperCase() : '';
    if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(method))
      throw new Error('Unsupported SCAPI method.');
    if (
      typeof args.path !== 'string' ||
      !args.path.startsWith('/') ||
      args.path.startsWith('//') ||
      /[?#\\]/.test(args.path)
    )
      throw new Error('Use a SCAPI path, without origin, query, or fragment.');
    const path = args.path.replaceAll('{organizationId}', encodeURIComponent(organizationId));
    const decoded = decodeURIComponent(path);
    if (decoded.includes('\\') || decoded.split('/').some((part) => part === '.' || part === '..') || /[{}]/.test(path))
      throw new Error('Invalid SCAPI path; substitute path parameters.');
    if (path.startsWith('/custom/')) {
      const [, , apiName, apiVersion] = path.split('/');
      const id = `custom/${apiName}/${apiVersion}`;
      if (!documents.some((document) => document.entry.id === id))
        throw new Error(
          `SCAPI_CUSTOM_SCHEMA_REQUIRED: Search it with scapi_search schemas:"live", or fetch ` +
            `/dx/scapi-schemas/v1/organizations/{organizationId}/schemas/${id} with scapi.request in this execution, ` +
            'before calling its endpoints. Inspect the contract and declared authentication.',
        );
    }
    const matched = findScapiOperation(documents, method, path);
    if (matched.parameters.organizationId && matched.parameters.organizationId !== organizationId)
      throw new Error('SCAPI target differs from resolved organizationId.');
    const {schema} = matched.document;
    const {operation} = matched;
    const selected = selectScapiAuth(matched.document, operation);
    if (!selected) throw unsupportedScapiAuth(matched.document, operation);
    const shopper = selected.type === 'shopper';
    if (shopper && !options.shopperAuth)
      throw new Error(
        `SCAPI_SHOPPER_AUTH_UNAVAILABLE: ${operation.operationId} (${matched.document.entry.id}) is a Shopper API and this host provides Admin authentication only.`,
      );
    const transferLimit = unsupportedScapiTransfer(matched.document, operation);
    if (transferLimit)
      throw new Error(
        `SCAPI_TRANSFER_UNSUPPORTED: ${operation.operationId}. ${transferLimit} Use a file-capable HTTP client.`,
      );
    const query = args.query === undefined ? {} : args.query;
    if (!query || typeof query !== 'object' || Array.isArray(query)) throw new Error('query must be an object.');
    const queryValues = {...query} as Record<string, unknown>;
    const parameters = [...(matched.pathItem.parameters ?? []), ...(operation.parameters ?? [])].map((param) =>
      resolveScapiReference(param, schema),
    );
    for (const parameter of parameters) {
      if (parameter.in === 'query' && parameter.name === 'siteId' && queryValues.siteId === undefined && options.siteId)
        queryValues.siteId = options.siteId;
      const value =
        parameter.in === 'path'
          ? matched.parameters[parameter.name]
          : parameter.in === 'query'
            ? queryValues[parameter.name]
            : undefined;
      if (parameter.required && value === undefined)
        throw new Error(
          `SCAPI_ARGUMENT_INVALID: ${operation.operationId} requires ${parameter.in} ${parameter.name}.` +
            (parameter.name === 'siteId'
              ? ' Set query.siteId or configure siteId for the selected project.'
              : ' Inspect the operation parameters with scapi_search.'),
        );
    }
    const body = operation.requestBody ? resolveScapiReference(operation.requestBody, schema) : undefined;
    if (body?.required && args.body === undefined) throw new Error('SCAPI_ARGUMENT_INVALID: request body is required.');
    if (args.body !== undefined) {
      if (!body?.content?.['application/json']) throw new Error('This operation does not accept a JSON body.');
      if (Buffer.byteLength(JSON.stringify(args.body)) > 1_048_576) throw new Error('SCAPI_REQUEST_TOO_LARGE');
    }
    const {scopes} = selected;
    // SCAPI standard contracts list ro/rw domain alternatives together; reuse SDK scope negotiation.
    const alternatives = !shopper && scopes.length === 2 && scopes.some((scope) => scopes.includes(`${scope}.rw`));
    const candidates = alternatives
      ? [...scopes].sort((a, b) => Number(a.endsWith('.rw')) - Number(b.endsWith('.rw'))).map((scope) => [scope])
      : [scopes];
    // A shopper token is issued for one site (SLAS channel).
    const shopperSiteId = typeof queryValues.siteId === 'string' ? queryValues.siteId : options.siteId;
    if (shopper && !shopperSiteId)
      throw new Error(
        `SCAPI_ARGUMENT_INVALID: ${operation.operationId} is a Shopper API; set query.siteId or configure siteId for the selected project.`,
      );
    const authContext: Parameters<typeof scapiAuthError>[1] = {
      operationId: operation.operationId,
      api: matched.document.entry.id,
      candidates,
      tenantScope: buildTenantScope(options.tenantId),
      ...(shopper ? {shopper: {siteId: shopperSiteId!}} : {}),
    };
    const querySerializer = (values: Record<string, unknown>) =>
      Object.entries(values)
        .map(([name, value]) => {
          const parameter = parameters.find((item) => item.in === 'query' && item.name === name);
          return createQuerySerializer({
            array: {style: parameter?.style ?? 'form', explode: parameter?.explode ?? true},
            object: {style: parameter?.style ?? 'form', explode: parameter?.explode ?? true},
            allowReserved: parameter?.allowReserved,
          })({[name]: value});
        })
        .filter(Boolean)
        .join('&');
    // Use per-execution policy instead of the CLI's startup-bound safety provider.
    const url = origin + path;
    const pathname = new URL(url).pathname;
    // Each request owns its guard: an approval must not exempt concurrent requests.
    const guard = new SafetyGuard(options.safety);
    const safetyOperation = {type: 'http' as const, method, url, path: pathname, jobId: extractJobIdFromPath(pathname)};
    const evaluation = guard.evaluate(safetyOperation);
    let approved = false;
    if (evaluation.action === 'confirm' && options.confirm) {
      await options.confirm(
        structuredClone({
          operationId: operation.operationId,
          method,
          url,
          query: queryValues,
          body: args.body,
          reason: evaluation.reason,
        }),
        signal,
      );
      signal.throwIfAborted();
      guard.temporarilyAllow(safetyOperation);
      approved = true;
    }
    guard.assert(safetyOperation);
    const queryString = querySerializer(queryValues);
    const approvedUrl = new URL(url + (queryString ? `?${queryString}` : '')).href;
    const approvedBody = args.body === undefined ? '' : JSON.stringify(args.body);
    const checkApprovedRequest = async (request: Request) => {
      if (
        approved &&
        (request.method !== method || request.url !== approvedUrl || (await request.clone().text()) !== approvedBody)
      )
        throw new Error('SCAPI_APPROVAL_MISMATCH: request changed after approval; no request sent.');
    };
    const adminAuth = (): AuthStrategy => {
      let baseAuth: AuthStrategy;
      try {
        baseAuth = withScopes(typeof options.auth === 'function' ? options.auth() : options.auth, [
          authContext.tenantScope,
        ]);
      } catch (error) {
        throw scapiAuthError(error, authContext);
      }
      return {
        fetch: baseAuth.fetch.bind(baseAuth),
        getAuthorizationHeader: async () => {
          try {
            if (baseAuth.getAccessTokenForCascade)
              return `Bearer ${await baseAuth.getAccessTokenForCascade(candidates)}`;
            const scoped = withScopes(baseAuth, scopes);
            if (!scoped.getAuthorizationHeader)
              throw new Error(
                'SCAPI_ADMIN_AUTH_UNSUPPORTED: The configured auth strategy cannot provide an authorization header. Use Account Manager OAuth credentials or a supported JWT strategy.',
              );
            return await scoped.getAuthorizationHeader();
          } catch (error) {
            throw scapiAuthError(error, authContext);
          }
        },
      };
    };
    const auth: AuthStrategy = shopper
      ? {
          fetch,
          getAuthorizationHeader: async () => {
            try {
              const token = await options.shopperAuth!.getAccessToken(shopperSiteId!, signal);
              authContext.shopper!.tokenScopes = shopperTokenScopes(token);
              return `Bearer ${token}`;
            } catch (error) {
              signal.throwIfAborted();
              throw scapiShopperAuthError(error, authContext);
            }
          },
        }
      : adminAuth();
    const client = createClient<ApiDocument>({
      baseUrl: origin,
      headers: {Accept: 'application/json, text/*'},
      fetch: async (request: Request) => {
        signal.throwIfAborted();
        await checkApprovedRequest(request);
        signal.throwIfAborted();
        options.onDispatch?.();
        const response = await fetch(request, {signal, redirect: 'error'});
        const mediaType = response.headers.get('content-type');
        if (response.ok && mediaType && !isScapiTextMediaType(mediaType)) {
          void response.body?.cancel().catch(() => {});
          throw new Error(
            'SCAPI_TRANSFER_UNSUPPORTED: API returned a non-text response. Use a file-capable HTTP client; check any write before retrying.',
          );
        }
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        const reader = response.body?.getReader();
        try {
          while (reader) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.length;
            totalBytes += chunk.value.length;
            if (bytes > 1_048_576 || totalBytes > 5_242_880)
              throw new Error('SCAPI_RESPONSE_TOO_LARGE: request a smaller page.');
            chunks.push(chunk.value);
          }
        } finally {
          // A tee'd response can wait for another consumer; cleanup must not delay a limit error.
          void reader?.cancel().catch(() => {});
        }
        getLogger().debug({method, path: matched.template, status: response.status, bytes}, 'SCAPI code request');
        return new Response(chunks.length ? Buffer.concat(chunks) : null, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      },
    });
    for (const middleware of (options.middlewareRegistry ?? globalMiddlewareRegistry).getMiddleware('scapi', {
      exclude: ['cli-safety-guard'],
    }))
      client.use(middleware);
    client.use(
      {
        onRequest: async ({request}) => {
          await checkApprovedRequest(request);
        },
      },
      createSafetyMiddleware(guard),
      createAuthMiddleware(auth),
    );
    const result = await client.request(method as HttpMethod, path, {
      params: {query: queryValues},
      querySerializer,
      body: args.body,
      signal,
      redirect: 'error',
      parseAs: 'text',
    });
    const text = result.data ?? result.error;
    let data: unknown = text ?? null;
    if (typeof text === 'string' && text) {
      try {
        data = JSON.parse(text);
      } catch {
        /* Keep non-JSON responses as text. */
      }
    }
    const diagnostic = scapiAuthResponse(result.response.status, authContext);
    if (shopper && result.response.status === 401) options.shopperAuth?.invalidate(shopperSiteId!);
    // Authenticated live schema responses extend this execution's catalog, replacing bundled contracts.
    if (
      result.response.ok &&
      method === 'GET' &&
      matched.document.entry.id === 'dx/scapi-schemas/v1' &&
      matched.parameters.apiFamily &&
      matched.parameters.apiName &&
      matched.parameters.apiVersion
    ) {
      const {apiFamily, apiName, apiVersion} = matched.parameters;
      let document: ScapiSchemaDocument | undefined;
      try {
        document = createLiveScapiDocument({apiFamily, apiName, apiVersion}, data);
      } catch (error) {
        // Custom endpoints are unreachable without their contract; standard reads remain plain data.
        if (apiFamily === 'custom') throw error;
      }
      if (document) {
        const previous = documents.findIndex((item) => item.entry.id === document.entry.id);
        if (previous < 0) documents.push(document);
        // Developer-supplied local contracts take precedence over the tenant's.
        else if (documents[previous].entry.origin !== 'local') documents[previous] = document;
        options.onSchema?.(document, isFullScapiExpand(String(queryValues.expand ?? '')));
      }
    }
    return {status: result.response.status, ok: result.response.ok, data, ...(diagnostic ? {diagnostic} : {})};
  };
}
