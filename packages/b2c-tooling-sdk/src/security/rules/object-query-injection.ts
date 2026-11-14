/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode} from '../rule.js';
import {defineScriptRule} from '../rule.js';
import {assignedValues, calleeName, findVariable, isDynamicString} from '../script/helpers.js';

/** Script API methods that take a query string, and the query argument's index. */
const QUERY_ARGUMENT: Record<string, number> = {
  queryCustomObject: 1,
  queryCustomObjects: 1,
  querySystemObject: 1,
  querySystemObjects: 1,
  processOrders: 1,
  processProfiles: 1,
  queryOrder: 0,
  queryOrders: 0,
  searchOrder: 0,
  searchOrders: 0,
  queryProfile: 0,
  queryProfiles: 0,
  searchProfile: 0,
  searchProfiles: 0,
};

export default defineScriptRule({
  id: 'object-query-injection',
  severity: 'high',
  confidence: 'medium',
  category: 'injection',
  cwe: ['CWE-943'],
  description:
    'Object query strings (CustomObjectMgr, SystemObjectMgr, OrderMgr, CustomerMgr) built by concatenating values instead of using {0} placeholders.',
  remediation:
    'Pass values as query arguments: queryCustomObjects(type, "custom.email = {0}", null, email). Never concatenate input into the query string.',
  create(context) {
    const isBuilt = (arg: AstNode | undefined, depth = 0): boolean => {
      if (!arg || depth > 3) return false;
      if (isDynamicString(arg)) return true;
      if (arg.type === 'Identifier') {
        const variable = findVariable(context.sourceCode.getScope(arg), arg.name as string);
        return variable ? assignedValues(variable).some((v) => isBuilt(v, depth + 1)) : false;
      }
      return false;
    };

    return {
      CallExpression(node) {
        const name = calleeName(node);
        if (!name || node.callee.type !== 'MemberExpression' || !(name in QUERY_ARGUMENT)) return;
        const arg = node.arguments[QUERY_ARGUMENT[name]];
        if (isBuilt(arg)) {
          context.report({
            node: arg,
            message: `The query string passed to ${name}() is built by concatenation; pass values as {0}-style query arguments instead.`,
          });
        }
      },
    };
  },
});
