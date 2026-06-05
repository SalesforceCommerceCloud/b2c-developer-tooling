/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {fetch as undiciFetch} from 'undici';
import type {FetchInit} from './types.js';

// undiciFetch returns undici's Response type; cast to the global Response at the
// call site. The two are structurally compatible for our usage.
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Performs a fetch, transparently routing requests that carry an undici
 * `dispatcher` (mTLS / self-signed TLS Agent) through undici's own `fetch`.
 *
 * Why this exists: the `dispatcher` is an undici `Agent` constructed from the
 * `undici` npm package (see clients/tls-dispatcher.ts). `global.fetch` is backed
 * by whatever undici Node bundles internally, which drifts across Node
 * minor/patch releases and can be a different major than the npm package
 * (e.g. Node 22 bundles undici 6.x, Node 24 bundles 7.x, the npm dep is pinned to
 * 7.x). The undici `Dispatcher` request-handler interface changed across undici
 * 6/7/8: undici 7 still ships a compatibility shim that lets a foreign Agent
 * accept the bundled fetch's handler, but that shim was removed in undici 8
 * (handler validation now throws `invalid onRequestStart method`). So handing a
 * foreign Agent to `global.fetch` across that version boundary can fail and
 * silently drop the client certificate. Routing dispatcher-bearing requests
 * through undici's own `fetch` keeps the Agent and the fetch on a single
 * undici instance, eliminating this class of failure regardless of which undici
 * Node bundles.
 *
 * When no dispatcher is present we use `global.fetch` to preserve the built-in
 * behaviour (and existing test coverage) for the common case.
 *
 * @param url - Request URL
 * @param init - Fetch init; may include an undici `dispatcher`
 * @returns The fetch response
 */
export function dispatchFetch(url: string, init: FetchInit = {}): Promise<Response> {
  const fetchFn = (init.dispatcher ? undiciFetch : fetch) as FetchFn;
  return fetchFn(url, init as RequestInit);
}
