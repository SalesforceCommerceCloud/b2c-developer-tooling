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
import {SafetyGuard, type SafetyConfig} from '../safety/index.js';
import {getLogger} from '../logging/logger.js';
import {findScapiOperation, resolveScapiReference, type ApiDocument, type ScapiSchemaDocument} from './catalog.js';
import {scapiAuthError, scapiAuthResponse, unsupportedScapiAuth} from './authentication.js';

export interface ScapiRequestOptions {
  shortCode: string;
  tenantId: string;
  siteId?: string;
  auth: AuthStrategy | (() => AuthStrategy);
  safety: SafetyConfig;
  documents: ScapiSchemaDocument[];
  middlewareRegistry?: MiddlewareRegistry;
}

/** Build one execution's SCAPI request helper. Auth, policy, and responses stay in the host. */
export function createScapiRequest(
  options: ScapiRequestOptions,
): (input: unknown, signal: AbortSignal) => Promise<unknown> {
  if (!/^[a-z0-9-]+$/i.test(options.shortCode)) throw new Error('Invalid SCAPI shortCode.');
  const origin = `https://${options.shortCode}.api.commercecloud.salesforce.com`;
  const organizationId = toOrganizationId(options.tenantId);
  const guard = new SafetyGuard(options.safety);
  let totalBytes = 0;
  return async (input, signal) => {
    signal.throwIfAborted();
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Request must be an object.');
    const args = input as Record<string, unknown>;
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
    const matched = findScapiOperation(options.documents, method, path);
    if (matched.parameters.organizationId && matched.parameters.organizationId !== organizationId)
      throw new Error('SCAPI target differs from resolved organizationId.');
    const {schema} = matched.document;
    const {operation} = matched;
    const security = operation.security ?? schema.security ?? [];
    const admin = security.find(
      (requirement: ApiDocument) => Array.isArray(requirement.AmOAuth2) && Object.keys(requirement).length === 1,
    );
    if (!admin) throw unsupportedScapiAuth(matched.document, operation);
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
    const scopes = admin.AmOAuth2 as string[];
    // SCAPI standard contracts list ro/rw domain alternatives together; reuse SDK scope negotiation.
    const alternatives = scopes.length === 2 && scopes.some((scope) => scopes.includes(`${scope}.rw`));
    const candidates = alternatives
      ? [...scopes].sort((a, b) => Number(a.endsWith('.rw')) - Number(b.endsWith('.rw'))).map((scope) => [scope])
      : [scopes];
    const authContext = {
      operationId: operation.operationId,
      api: matched.document.entry.id,
      candidates,
      tenantScope: buildTenantScope(options.tenantId),
    };
    // Use per-execution policy instead of the CLI's startup-bound safety provider.
    guard.assert({type: 'http', method, url: origin + path});
    let baseAuth: AuthStrategy;
    try {
      baseAuth = withScopes(typeof options.auth === 'function' ? options.auth() : options.auth, [
        authContext.tenantScope,
      ]);
    } catch (error) {
      throw scapiAuthError(error, authContext);
    }
    const auth: AuthStrategy = {
      fetch: baseAuth.fetch.bind(baseAuth),
      getAuthorizationHeader: async () => {
        try {
          if (baseAuth.getAccessTokenForCascade) return `Bearer ${await baseAuth.getAccessTokenForCascade(candidates)}`;
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
    const client = createClient<ApiDocument>({
      baseUrl: origin,
      fetch: async (request: Request) => {
        signal.throwIfAborted();
        const response = await fetch(request, {signal, redirect: 'error'});
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
          await reader?.cancel();
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
    client.use(createSafetyMiddleware(guard), createAuthMiddleware(auth));
    const result = await client.request(method as HttpMethod, path, {
      params: {query: queryValues},
      querySerializer: (values) =>
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
          .join('&'),
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
    return {status: result.response.status, ok: result.response.ok, data, ...(diagnostic ? {diagnostic} : {})};
  };
}
