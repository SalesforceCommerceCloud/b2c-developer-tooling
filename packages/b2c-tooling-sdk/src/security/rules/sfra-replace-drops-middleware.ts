/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineScriptRule, type ScriptRuleListener} from '../rule.js';
import {controllerName, isIndexedFile, projectIndexOf} from '../script/project.js';
import {isCsrfValidator, isLoginValidator, sfraRouteCall} from '../script/routes.js';

/** Security-relevant middleware, and how to describe losing it. */
function securityRole(id: string): string | undefined {
  if (isCsrfValidator(id)) return `CSRF check (${id})`;
  if (isLoginValidator(id)) return `login check (${id})`;
  if (id === 'server.middleware.https') return 'HTTPS requirement (server.middleware.https)';
  if (id === 'server.middleware.post') return 'POST-only restriction (server.middleware.post)';
  if (id === 'server.middleware.get') return 'GET-only restriction (server.middleware.get)';
  return undefined;
}

export default defineScriptRule({
  id: 'sfra-replace-drops-middleware',
  severity: 'high',
  confidence: 'high',
  category: 'authz',
  cwe: ['CWE-862', 'CWE-352'],
  description:
    'server.replace() in an overlay cartridge that drops security middleware the replaced route had: CSRF and login checks, server.middleware.https, or the GET/POST method restriction (replace registers the route with server.use, so the method check is lost too). Needs the project index.',
  remediation:
    "Repeat the security middleware in the replace() call, for example server.replace('Name', server.middleware.post, server.middleware.https, csrfProtection.validateAjaxRequest, handler), or use server.append/prepend to change behavior without replacing the chain.",
  create(context): ScriptRuleListener {
    const index = projectIndexOf(context);
    if (!index) return {};
    return {
      CallExpression(node) {
        const route = sfraRouteCall(node, context.sourceCode);
        if (route?.method !== 'replace') return;
        const line = node.loc?.start.line ?? 0;
        const id = `${controllerName(context.filename)}-${route.name}`;
        const step = index.endpoints
          .flatMap((e) => e.steps ?? [])
          .find(
            (s) => s.method === 'replace' && s.line === line && isIndexedFile(context.filename, s.cartridge, s.relPath),
          );
        if (!step?.replaced) return;
        const kept = new Set(route.chain.map((m) => m.id));
        const keptCsrf = route.chain.some((m) => isCsrfValidator(m.id) || m.validatesCsrf);
        const dropped = [...new Set(step.replaced.filter((m) => m.via !== 'append').map((m) => m.id))]
          .filter((mid) => !kept.has(mid) && !(isCsrfValidator(mid) && keptCsrf))
          .map(securityRole)
          .filter((r): r is string => r !== undefined);
        if (dropped.length > 0) {
          context.report({
            node,
            message: `server.replace() of "${id}" drops the ${dropped.join(', ')} that the replaced route had.`,
          });
        }
      },
    };
  },
});
