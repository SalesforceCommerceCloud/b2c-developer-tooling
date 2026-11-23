/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineScriptRule, type ScriptRuleListener} from '../rule.js';
import {controllerName, isIndexedFile, projectIndexOf} from '../script/project.js';
import {securityRole} from '../../project-index/labels.js';
import {sfraRouteCall} from '../script/routes.js';

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
        if (!step?.dropped || step.dropped.length === 0) return;
        const dropped = step.dropped.map((mid) => `${securityRole(mid)} (${mid})`);
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
