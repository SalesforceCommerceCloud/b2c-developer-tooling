/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineScriptRule} from '../rule.js';
import {controllerName, endpointForStatement, isIndexedFile, projectIndexOf} from '../script/project.js';
import {isCsrfValidator, sfraRouteCall} from '../script/routes.js';
import {isWebhookShaped, webhookShape} from '../script/webhook.js';

export default defineScriptRule({
  id: 'webhook-without-verification',
  severity: 'high',
  confidence: 'medium',
  category: 'authz',
  cwe: ['CWE-306', 'CWE-345'],
  description:
    'SFRA POST routes shaped like server-to-server callbacks (they read the raw request body and never use the shopper session) with no visible check of the caller: no signature or Authorization header, no comparison with a shared secret, no verification middleware, and no CSRF check.',
  remediation:
    "Verify every callback before acting on it: check the provider's signature (HMAC of the raw body with a secret kept in a site preference or service credential), or compare a shared token in a header with a constant-time check. Reject the request before reading or changing orders. Allowlisting the caller's IP address is not enough on its own. If the browser calls the route, add a CSRF check instead.",
  create(context) {
    const index = projectIndexOf(context);
    return {
      CallExpression(node) {
        const route = sfraRouteCall(node, context.sourceCode);
        if (!route || !['post', 'use', 'replace'].includes(route.method)) return;
        const ids = route.chain.map((m) => m.id);
        if (ids.includes('server.middleware.get')) return;
        if (ids.some(isCsrfValidator) || route.chain.some((m) => m.validatesCsrf)) return;
        const shape = webhookShape(node.arguments.slice(1), context.sourceCode);
        if (!isWebhookShaped(shape) || shape.verifiesCaller) return;

        const line = node.loc?.start.line ?? 0;
        if (index) {
          const endpoint = endpointForStatement(index, context.filename, line);
          // Only the definition that is served (a later cartridge may replace it).
          if (
            endpoint &&
            !(endpoint.line === line && isIndexedFile(context.filename, endpoint.cartridge, endpoint.relPath))
          )
            return;
        }
        const id = `${controllerName(context.filename)}-${route.name}`;
        context.report({
          node,
          message: `Route "${id}" reads the raw request body without the shopper session (a server-to-server callback or a JSON endpoint) and doesn't verify the caller or check a CSRF token.`,
        });
      },
    };
  },
});
