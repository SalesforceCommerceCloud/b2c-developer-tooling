/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode} from '../rule.js';
import {defineScriptRule} from '../rule.js';
import {calleeName, propertyName, staticString} from '../script/helpers.js';
import {SECRET_NAME, looksLikeSecret} from '../secrets.js';

const AUTH_HEADER = /^(authorization|proxy-authorization|x-api-key|api-key|apikey|x-auth-token)$/i;
const AUTH_SCHEME = /^\s*(basic|bearer|token)\s*/i;

/** The literal text of a header value, ignoring a leading auth scheme and any non-literal parts. */
function literalHeaderValue(node: AstNode | undefined): string {
  if (!node) return '';
  const s = staticString(node);
  if (s !== undefined) return s;
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return literalHeaderValue(node.left as AstNode) + literalHeaderValue(node.right as AstNode);
  }
  return '';
}

function keyName(node: AstNode | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === 'Identifier') return node.name as string;
  return staticString(node);
}

export default defineScriptRule({
  id: 'hardcoded-credentials',
  severity: 'high',
  confidence: 'medium',
  category: 'secrets',
  cwe: ['CWE-798'],
  description:
    'Credentials written into code: passwords and API keys in variables or objects, HTTPClient.open() user/password arguments, and literal Authorization headers.',
  remediation:
    'Store credentials in service credentials (Administration > Operations > Services) and read them through LocalServiceRegistry, or in a password-type site preference. Rotate any credential that was committed.',
  create(context) {
    const reportValue = (node: AstNode, name: string) =>
      context.report({node, message: `"${name}" is assigned a literal value that looks like a credential.`});

    return {
      VariableDeclarator(node) {
        const name = keyName(node.id);
        const value = staticString(node.init);
        if (name && value !== undefined && SECRET_NAME.test(name) && looksLikeSecret(value))
          reportValue(node.init, name);
      },
      Property(node) {
        if (node.parent?.type !== 'ObjectExpression') return;
        const name = node.computed ? staticString(node.key) : keyName(node.key);
        const value = staticString(node.value);
        if (name && value !== undefined && SECRET_NAME.test(name) && looksLikeSecret(value))
          reportValue(node.value, name);
      },
      AssignmentExpression(node) {
        const name = node.left.type === 'MemberExpression' ? propertyName(node.left) : keyName(node.left);
        const value = staticString(node.right);
        if (name && value !== undefined && SECRET_NAME.test(name) && looksLikeSecret(value))
          reportValue(node.right, name);
      },
      CallExpression(node) {
        const name = calleeName(node);
        if (node.callee.type !== 'MemberExpression') return;
        if (name === 'open' && (node.arguments.length === 4 || node.arguments.length === 5)) {
          const password = staticString(node.arguments.at(-1));
          if (password) {
            context.report({node: node.arguments.at(-1), message: 'HTTPClient.open() is given a literal password.'});
          }
        } else if (name === 'setRequestHeader' && node.arguments.length >= 2) {
          const header = staticString(node.arguments[0]);
          if (
            header &&
            AUTH_HEADER.test(header) &&
            looksLikeSecret(literalHeaderValue(node.arguments[1]).replace(AUTH_SCHEME, ''))
          ) {
            context.report({node: node.arguments[1], message: `The ${header} header is set to a literal credential.`});
          }
        }
      },
    };
  },
});
