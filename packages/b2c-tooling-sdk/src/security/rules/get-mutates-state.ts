/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode} from '../rule.js';
import {defineScriptRule} from '../rule.js';
import {calleeName, isRequestDerived, memberChain, propertyName, requiredModuleOf} from '../script/helpers.js';
import {controllerName} from '../script/project.js';
import {callsCsrfValidation, isCsrfValidator, sfraRouteCall, sgControllerExport, walk} from '../script/routes.js';

/** Methods that persist or remove data when called with request input. */
const WRITE_METHOD = /^(set|create|remove|delete|add|update)[A-Z]?/;

export default defineScriptRule({
  id: 'get-mutates-state',
  severity: 'medium',
  confidence: 'medium',
  category: 'csrf',
  cwe: ['CWE-352', 'CWE-650'],
  description:
    'GET routes (SFRA server.get, SiteGenesis guard get filter) that write request input inside a transaction without checking a CSRF token. GET requests carry no CSRF token, so another site can trigger the change by linking to the URL.',
  remediation:
    'Make the route accept POST and check the CSRF token (csrfProtection.validateAjaxRequest, or the SiteGenesis csrf filter). Recalculating a basket in a GET is fine; storing values from the request is not.',
  create(context) {
    const {sourceCode} = context;

    const isTransaction = (node: AstNode): boolean => {
      if (node.type === 'Identifier')
        return requiredModuleOf(node, sourceCode) === 'dw/system/Transaction' || node.name === 'Transaction';
      return memberChain(node)?.join('.') === 'dw.system.Transaction';
    };

    /** Writes of request input inside Transaction.wrap callbacks or after Transaction.begin(). */
    const findWrite = (handler: AstNode): AstNode | undefined => {
      const scopes: AstNode[] = [];
      let begins = false;
      walk(handler, (n) => {
        if (n.type !== 'CallExpression' || n.callee.type !== 'MemberExpression' || !isTransaction(n.callee.object))
          return;
        const method = propertyName(n.callee);
        if (method === 'wrap' && n.arguments[0]) scopes.push(n.arguments[0]);
        if (method === 'begin') begins = true;
      });
      if (begins) scopes.push(handler);
      let found: AstNode | undefined;
      for (const scope of scopes) {
        walk(scope, (n) => {
          if (found) return;
          if (
            n.type === 'AssignmentExpression' &&
            n.left.type === 'MemberExpression' &&
            isRequestDerived(n.right, sourceCode)
          )
            found = n;
          if (
            n.type === 'CallExpression' &&
            WRITE_METHOD.test(calleeName(n) ?? '') &&
            (n.arguments as AstNode[]).some((a) => isRequestDerived(a, sourceCode))
          ) {
            found = n;
          }
        });
      }
      return found;
    };

    const check = (id: string, handlers: AstNode[]) => {
      for (const handler of handlers) {
        const write = findWrite(handler);
        if (write) {
          context.report({
            node: write,
            message: `GET route "${id}" stores request input in a transaction; GET requests are not CSRF-protected.`,
          });
          return;
        }
      }
    };

    return {
      CallExpression(node) {
        const route = sfraRouteCall(node, sourceCode);
        if (!route || route.method !== 'get') return;
        // A GET route that checks a CSRF token (sent as a query parameter) is protected.
        if (route.chain.some((m) => isCsrfValidator(m.id) || m.validatesCsrf)) return;
        const handlers = (node.arguments as AstNode[]).filter(
          (a) => a.type === 'FunctionExpression' || a.type === 'ArrowFunctionExpression',
        );
        check(`${controllerName(context.filename)}-${route.name}`, handlers);
      },
      AssignmentExpression(node) {
        const sg = sgControllerExport(node, sourceCode);
        if (
          !sg ||
          !sg.filters.includes('get') ||
          sg.filters.includes('post') ||
          sg.filters.includes('csrf') ||
          !sg.action
        )
          return;
        if (callsCsrfValidation(sg.action, sourceCode)) return;
        check(`${controllerName(context.filename)}-${sg.name}`, [sg.action]);
      },
    };
  },
});
