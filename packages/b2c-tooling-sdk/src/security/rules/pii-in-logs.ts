/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode} from '../rule.js';
import {defineScriptRule} from '../rule.js';
import {assignedValues, findVariable, memberChain, propertyName, requiredModuleOf} from '../script/helpers.js';
import {walk} from '../script/routes.js';

const LOG_METHODS = new Set(['debug', 'info', 'warn', 'error', 'fatal']);
/** Properties that hold personal or payment data. */
const PII_PROPERTY =
  /^(email|phone|phoneHome|phoneMobile|phoneBusiness|firstName|lastName|fullName|address1|address2|postalCode|birthday|password|creditCardNumber|cardNumber|securityCode|cvv|cvn|ssn|taxId|login)$/i;
/** Objects that are mostly personal data when logged whole. */
const PII_OBJECT =
  /(customer|profile|address|paymentInstrument|creditCard|billingAddress|shippingAddress|order|basket)$/i;

export default defineScriptRule({
  id: 'pii-in-logs',
  severity: 'medium',
  confidence: 'low',
  category: 'pii',
  cwe: ['CWE-532'],
  description:
    'Personal or payment data written to logs with dw.system.Logger: properties such as email, phone, names, addresses, and card numbers, or whole customer, profile, address, or order objects (for example through JSON.stringify).',
  remediation:
    'Log identifiers (customer number, order number) instead of personal data, or mask values before logging. Log files are readable by anyone with Business Manager log access and are kept for days.',
  create(context) {
    const {sourceCode} = context;

    /** Whether `node` refers to dw.system.Logger or a logger it returned. */
    const isLogger = (node: AstNode, depth = 0): boolean => {
      if (depth > 3) return false;
      if (node.type === 'Identifier') {
        const spec = requiredModuleOf(node, sourceCode);
        if (spec === 'dw/system/Logger') return true;
        if (spec === undefined && node.name === 'Logger') return true;
        const v = findVariable(sourceCode.getScope(node), node.name as string);
        return v ? assignedValues(v).some((value) => isLogger(value, depth + 1)) : false;
      }
      if (node.type === 'CallExpression') {
        const callee = node.callee as AstNode;
        return (
          propertyName(callee) === 'getLogger' &&
          callee.type === 'MemberExpression' &&
          isLogger(callee.object as AstNode, depth + 1)
        );
      }
      return memberChain(node)?.join('.') === 'dw.system.Logger';
    };

    const describePii = (arg: AstNode): string | undefined => {
      let found: string | undefined;
      walk(arg, (n) => {
        if (found) return;
        if (n.type === 'MemberExpression') {
          const name = propertyName(n);
          if (name && PII_PROPERTY.test(name)) found = name;
        }
        if (n.type === 'CallExpression' && memberChain(n.callee)?.join('.') === 'JSON.stringify') {
          const target = (n.arguments as AstNode[])[0];
          const last = target && (target.type === 'Identifier' ? (target.name as string) : memberChain(target)?.at(-1));
          if (last && PII_OBJECT.test(last)) found = `${last} (whole object)`;
        }
      });
      return found;
    };

    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression' || !LOG_METHODS.has(propertyName(node.callee) ?? '')) return;
        if (!isLogger(node.callee.object)) return;
        for (const arg of node.arguments as AstNode[]) {
          const pii = describePii(arg);
          if (pii) {
            context.report({node, message: `Log message includes ${pii}, which is likely personal data.`});
            return;
          }
        }
      },
    };
  },
});
