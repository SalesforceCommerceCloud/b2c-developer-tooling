/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineScriptRule} from '../rule.js';
import {concatenationParts, isRequestDerived, staticString} from '../script/helpers.js';

export default defineScriptRule({
  id: 'dynamic-code',
  severity: 'high',
  confidence: 'high',
  category: 'injection',
  cwe: ['CWE-95'],
  description:
    'Code built or loaded from strings at runtime: eval, new Function, or require/importScript with a computed path (a fixed directory prefix is allowed unless the rest comes from the request).',
  remediation:
    'Use static require paths and ordinary functions. To choose between modules at runtime, map known keys to static requires.',
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'Identifier') return;
        if (callee.name === 'eval') {
          context.report({node, message: 'eval() runs code built at runtime.'});
        } else if (callee.name === 'Function') {
          context.report({node, message: 'Function() compiles code from strings.'});
        } else if ((callee.name === 'require' || callee.name === 'importScript') && node.arguments.length > 0) {
          const arg = node.arguments[0];
          if (staticString(arg) !== undefined) return;
          // A fixed directory prefix ('*/cartridge/experience/' + type) is a common, safe pattern
          // unless the variable part comes from the request.
          const parts = concatenationParts(arg);
          const hasPrefix = parts.length > 1 && Boolean(staticString(parts[0]));
          if (!hasPrefix || parts.some((p) => isRequestDerived(p, context.sourceCode))) {
            context.report({node, message: `${callee.name}() with a computed path can load unexpected code.`});
          }
        }
      },
      NewExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'Function') {
          context.report({node, message: 'new Function() compiles code from strings.'});
        }
      },
    };
  },
});
