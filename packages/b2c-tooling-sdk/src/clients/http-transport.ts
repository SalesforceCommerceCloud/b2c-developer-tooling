/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared HTTP transport for SDK clients.
 *
 * All TLS policy for SDK requests lives here:
 *
 * - OCAPI, SCAPI and Account Manager requests go through {@link createHttpClient}
 *   (openapi-fetch clients) or {@link getApiFetch} (direct requests such as OAuth
 *   token calls and middleware retries). Transport options come from the auth
 *   strategy the client is built with, which is created from a resolved config,
 *   so a setting applies only to clients made from that config.
 * - WebDAV uses {@link createWebDavDispatcher}, driven by the instance's
 *   `selfsigned`/client-certificate options. API transport options never affect
 *   WebDAV, and WebDAV options never affect API requests.
 *
 * @module clients/http-transport
 */
import createClient, {type Client, type ClientOptions} from 'openapi-fetch';
import {fetch as undiciFetch, type Dispatcher} from 'undici';
import {getLogger} from '../logging/logger.js';
import {createTlsDispatcher, type TlsOptions} from './tls-dispatcher.js';

/**
 * Transport options for API requests. Auth strategies carry these so every
 * client built from a strategy shares its config's transport.
 */
export interface HttpTransportOptions {
  /**
   * Skip TLS certificate verification for OCAPI, SCAPI and Account Manager
   * requests. Development aid for local servers; dw.json key `selfsigned-api`.
   * @internal
   */
  readonly selfSignedApi?: boolean;
}

/** A `fetch` function for SDK API requests. */
export type ApiFetch = (input: Request | string | URL, init?: RequestInit) => Promise<Response>;

/** Statuses whose responses must not have a body. */
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

/** Cache of the insecure dispatcher, which is stateless apart from its connection pool. */
let insecureDispatcher: Dispatcher | undefined;
let warnedInsecure = false;

/** Resolves the global `fetch` at call time so test interceptors (MSW) still apply. */
const defaultFetch: ApiFetch = (input, init) => fetch(input, init);

/**
 * Sends a request through undici's own `fetch` so the npm `undici` dispatcher
 * and fetch implementation match (see `auth/dispatch-fetch.ts`), and returns a
 * global `Response` so openapi-fetch's `instanceof Response` checks still pass.
 */
async function fetchWithDispatcher(
  input: Request | string | URL,
  init: RequestInit | undefined,
  dispatcher: Dispatcher,
): Promise<Response> {
  const request = new Request(input, init);
  const body = request.body ? await request.arrayBuffer() : undefined;
  const response = await undiciFetch(request.url, {
    method: request.method,
    headers: [...request.headers],
    body,
    redirect: request.redirect,
    signal: request.signal,
    dispatcher,
  });
  return new Response(NULL_BODY_STATUSES.has(response.status) ? null : (response.body as ReadableStream | null), {
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers],
  });
}

const insecureFetch: ApiFetch = (input, init) => {
  insecureDispatcher ??= createTlsDispatcher({rejectUnauthorized: false});
  return fetchWithDispatcher(input, init, insecureDispatcher!);
};

/**
 * Returns the `fetch` to use for OCAPI, SCAPI and Account Manager requests.
 *
 * Pass the auth strategy (or config) the request belongs to. Without options,
 * or when no option is set, this is the global `fetch` with full TLS checks.
 */
export function getApiFetch(options: HttpTransportOptions | undefined): ApiFetch {
  if (options?.selfSignedApi !== true) {
    return defaultFetch;
  }
  if (!warnedInsecure) {
    warnedInsecure = true;
    getLogger().warn('TLS certificate verification is disabled for API requests (selfsigned-api)');
  }
  return insecureFetch;
}

/**
 * Creates an openapi-fetch client that uses the API transport for `transport`
 * (normally the client's auth strategy).
 *
 * All SDK API clients must be created through this function (or
 * `buildScapiClient`) rather than openapi-fetch's `createClient`.
 * A caller-supplied `fetch` replaces the transport entirely; wrap
 * {@link getApiFetch} inside it to keep the transport options.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createHttpClient<P extends Record<string, any>>(
  options: ClientOptions,
  transport: HttpTransportOptions | undefined,
): Client<P> {
  return createClient<P>({fetch: getApiFetch(transport), ...options});
}

/**
 * Creates the undici dispatcher for WebDAV requests from the instance's TLS
 * options, or `undefined` for Node's default transport.
 */
export function createWebDavDispatcher(tlsOptions: TlsOptions | undefined): Dispatcher | undefined {
  return tlsOptions ? createTlsDispatcher(tlsOptions) : undefined;
}
