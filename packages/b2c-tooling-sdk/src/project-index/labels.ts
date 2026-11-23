/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {isCsrfValidator, isLoginValidator} from '../security/script/routes.js';

const KNOWN: Record<string, string> = {
  'server.middleware.get': 'GET only',
  'server.middleware.post': 'POST only',
  'server.middleware.https': 'HTTPS required',
  'server.middleware.include': 'Remote include only',
  'csrf.validateRequest': 'CSRF check',
  'csrf.validateAjaxRequest': 'CSRF check (AJAX)',
  'csrf.generateToken': 'CSRF token',
  'userLoggedIn.validateLoggedIn': 'Login required',
  'userLoggedIn.validateLoggedInAjax': 'Login required (AJAX)',
  'consentTracking.consent': 'Consent tracking',
  'pageMetaData.computedPageMetaData': 'Page meta data',
};

/** A readable name for a middleware ID (`csrf.validateAjaxRequest` gives `CSRF check (AJAX)`). */
export function middlewareLabel(id: string): string {
  if (KNOWN[id]) return KNOWN[id];
  if (id === 'function') return 'Handler';
  const cache = /^cache\.apply(\w+?)Cache$/.exec(id);
  if (cache) return `Cache: ${cache[1].replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}`;
  return id;
}

/**
 * The security role of a middleware ID, or undefined for middleware with no
 * security meaning. Used to describe what a `server.replace()` dropped.
 */
export function securityRole(id: string): string | undefined {
  if (isCsrfValidator(id)) return 'CSRF check';
  if (isLoginValidator(id)) return 'login check';
  if (id === 'server.middleware.https') return 'HTTPS requirement';
  if (id === 'server.middleware.post') return 'POST-only restriction';
  if (id === 'server.middleware.get') return 'GET-only restriction';
  return undefined;
}

/**
 * Security middleware IDs present in `before` but missing from `after`. A CSRF
 * check counts as kept if `after` has any CSRF validator or an in-handler check.
 */
export function droppedSecurityMiddleware(
  before: ReadonlyArray<{id: string; via?: string}>,
  after: ReadonlyArray<{id: string; validatesCsrf?: boolean}>,
): string[] {
  const kept = new Set(after.map((m) => m.id));
  const keptCsrf = after.some((m) => isCsrfValidator(m.id) || m.validatesCsrf);
  return [...new Set(before.filter((m) => m.via !== 'append').map((m) => m.id))].filter(
    (id) => securityRole(id) !== undefined && !kept.has(id) && !(isCsrfValidator(id) && keptCsrf),
  );
}
