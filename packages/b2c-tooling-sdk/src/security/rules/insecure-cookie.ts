/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode, AstVariable} from '../rule.js';
import {defineScriptRule} from '../rule.js';
import {findVariable, memberChain, propertyName, requiredModuleOf} from '../script/helpers.js';

interface TrackedCookie {
  node: AstNode;
  secure: boolean;
  httpOnly: boolean;
  expired: boolean;
}

function isTrue(node: AstNode | undefined): boolean {
  return node?.type === 'Literal' && node.value === true;
}

export default defineScriptRule({
  id: 'insecure-cookie',
  severity: 'low',
  confidence: 'medium',
  category: 'session',
  cwe: ['CWE-614', 'CWE-1004'],
  description: 'dw.web.Cookie objects created without both the Secure and HttpOnly flags.',
  remediation:
    'Call cookie.setSecure(true) and cookie.setHttpOnly(true) before response.addHttpCookie(cookie). Leave HttpOnly off only for cookies that client-side script must read.',
  create(context) {
    const {sourceCode} = context;
    const byVariable = new Map<AstVariable, TrackedCookie>();
    const unassigned: TrackedCookie[] = [];

    const isCookieConstructor = (callee: AstNode): boolean => {
      if (callee.type === 'Identifier') {
        const spec = requiredModuleOf(callee, sourceCode);
        return spec === 'dw/web/Cookie' || (spec === undefined && callee.name === 'Cookie');
      }
      const chain = memberChain(callee);
      return chain?.join('.') === 'dw.web.Cookie';
    };

    const variableOf = (node: AstNode | undefined): AstVariable | undefined =>
      node?.type === 'Identifier' ? findVariable(sourceCode.getScope(node), node.name as string) : undefined;

    return {
      NewExpression(node) {
        if (!isCookieConstructor(node.callee)) return;
        const cookie: TrackedCookie = {node, secure: false, httpOnly: false, expired: false};
        const parent = node.parent;
        const target =
          parent?.type === 'VariableDeclarator'
            ? parent.id
            : parent?.type === 'AssignmentExpression'
              ? parent.left
              : undefined;
        const variable = variableOf(target as AstNode | undefined);
        if (variable) byVariable.set(variable, cookie);
        else unassigned.push(cookie);
      },
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') return;
        const cookie = byVariable.get(variableOf(node.callee.object) as AstVariable);
        if (!cookie) return;
        const method = propertyName(node.callee);
        if (method === 'setSecure' && isTrue(node.arguments[0])) cookie.secure = true;
        if (method === 'setHttpOnly' && isTrue(node.arguments[0])) cookie.httpOnly = true;
        if (method === 'setMaxAge' && node.arguments[0]?.type === 'Literal' && node.arguments[0].value === 0) {
          cookie.expired = true;
        }
      },
      AssignmentExpression(node) {
        if (node.left.type !== 'MemberExpression') return;
        const cookie = byVariable.get(variableOf(node.left.object) as AstVariable);
        if (!cookie) return;
        const prop = propertyName(node.left);
        if (prop === 'secure' && isTrue(node.right)) cookie.secure = true;
        if (prop === 'httpOnly' && isTrue(node.right)) cookie.httpOnly = true;
      },
      'Program:exit'() {
        for (const cookie of [...byVariable.values(), ...unassigned]) {
          if (cookie.expired) continue;
          const missing = [cookie.secure ? undefined : 'Secure', cookie.httpOnly ? undefined : 'HttpOnly'].filter(
            Boolean,
          );
          if (missing.length > 0) {
            context.report({
              node: cookie.node,
              message: `Cookie is created without the ${missing.join(' and ')} flag${missing.length > 1 ? 's' : ''}.`,
            });
          }
        }
      },
    };
  },
});
