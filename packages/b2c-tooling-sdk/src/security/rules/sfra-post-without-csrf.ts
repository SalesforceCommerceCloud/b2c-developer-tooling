/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineScriptRule} from '../rule.js';
import {controllerName, endpointForStatement, isIndexedFile, projectIndexOf} from '../script/project.js';
import {isCsrfValidator, sfraRouteCall} from '../script/routes.js';

export default defineScriptRule({
  id: 'sfra-post-without-csrf',
  severity: 'high',
  confidence: 'medium',
  category: 'csrf',
  cwe: ['CWE-352'],
  description:
    'SFRA routes that accept POST (server.post, or server.use/server.replace routes that read form input) without csrfProtection.validateRequest or validateAjaxRequest, or a CSRFProtection.validateRequest() check in the handler.',
  remediation:
    'Add csrfProtection.validateAjaxRequest (AJAX) or csrfProtection.validateRequest (form posts) from */cartridge/scripts/middleware/csrf to the route, and render the token with csrfProtection.generateToken on the page that submits it.',
  create(context) {
    const index = projectIndexOf(context);
    return {
      CallExpression(node) {
        const route = sfraRouteCall(node, context.sourceCode);
        if (!route || !['post', 'use', 'replace'].includes(route.method)) return;
        const ids = route.chain.map((m) => m.id);
        const acceptsPost = ids.includes('server.middleware.post');
        const anyMethod = !acceptsPost && !ids.includes('server.middleware.get');
        if (!acceptsPost && !(anyMethod && route.chain.some((m) => m.readsForm))) return;
        if (ids.some(isCsrfValidator) || route.chain.some((m) => m.validatesCsrf)) return;

        const line = node.loc?.start.line ?? 0;
        if (index) {
          const endpoint = endpointForStatement(index, context.filename, line);
          // Protected elsewhere (for example, an overlay prepends the CSRF check), or no longer the served definition.
          if (endpoint && endpoint.csrf !== 'none') return;
          if (
            endpoint &&
            !(endpoint.line === line && isIndexedFile(context.filename, endpoint.cartridge, endpoint.relPath))
          )
            return;
        }
        const id = `${controllerName(context.filename)}-${route.name}`;
        const how = acceptsPost ? 'accepts POST' : `accepts any method (server.${route.method}) and reads form input`;
        context.report({node, message: `Route "${id}" ${how} without a CSRF token check.`});
      },
    };
  },
});
