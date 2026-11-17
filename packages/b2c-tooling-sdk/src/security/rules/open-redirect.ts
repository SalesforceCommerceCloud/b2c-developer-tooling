/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode, AstVariable} from '../rule.js';
import {defineScriptRule} from '../rule.js';
import {
  assignedValues,
  collectCheckedVariables,
  concatenationParts,
  findVariable,
  isRequestDerived,
  propertyName,
  staticString,
} from '../script/helpers.js';

/**
 * Whether a URL prefix pins the destination origin: an absolute URL with a
 * host followed by a path, query, or fragment; a path starting with a single
 * slash; or anything after a `?` or `#`.
 */
function pinsOrigin(prefix: string): boolean {
  return /^[a-z][a-z\d+.-]*:\/\/[^/?#\\]+[/?#]/i.test(prefix) || /^\/[^/\\]/.test(prefix) || /[?#]/.test(prefix);
}

export default defineScriptRule({
  id: 'open-redirect',
  severity: 'medium',
  confidence: 'medium',
  category: 'redirect',
  cwe: ['CWE-601'],
  description:
    'Redirects (res.redirect, response.redirect) whose destination host can be chosen through request parameters, headers, or form fields.',
  remediation:
    'Redirect to URLs you build with dw.web.URLUtils, or check the target against an allowlist of paths or hosts before redirecting. Appending request values after a fixed path or "?" is fine.',
  create(context) {
    const {sourceCode} = context;
    let checked: Set<AstVariable> | undefined;
    const isTrusted = (v: AstVariable) => (checked ??= collectCheckedVariables(sourceCode)).has(v);

    /** Whether request input can decide the scheme and host of `node`. */
    const controlsOrigin = (node: AstNode, depth = 0): boolean => {
      if (depth > 4) return false;
      if (node.type === 'Identifier') {
        const variable = findVariable(sourceCode.getScope(node), node.name as string);
        if (!variable || isTrusted(variable)) return false;
        const values = assignedValues(variable).filter((v) => v !== node);
        if (values.length === 0) return false;
        return values.some((v) => controlsOrigin(v, depth + 1));
      }
      let prefix = '';
      for (const part of concatenationParts(node)) {
        if (part.type !== 'Identifier' || part === node) {
          if (isRequestDerived(part, sourceCode, {isTrusted})) return true;
        } else if (controlsOrigin(part, depth + 1)) {
          return true;
        }
        const literal = staticString(part);
        if (literal === undefined) return false; // A value computed by code fixes the origin.
        prefix += literal;
        if (pinsOrigin(prefix)) return false;
      }
      return false;
    };

    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression' || propertyName(node.callee) !== 'redirect') return;
        const target = node.arguments[0];
        if (target && controlsOrigin(target)) {
          context.report({
            node: target,
            message: 'Redirect destination can be chosen through the request; this allows redirects to other sites.',
          });
        }
      },
    };
  },
});
