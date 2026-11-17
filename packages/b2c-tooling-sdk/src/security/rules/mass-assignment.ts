/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode, AstVariable} from '../rule.js';
import {defineScriptRule} from '../rule.js';
import {findVariable, isRequestDerived, memberChain, propertyName} from '../script/helpers.js';

/** Targets that persist: custom attributes, or common persistent objects. */
function isPersistentTarget(node: AstNode): boolean {
  const chain = memberChain(node);
  if (!chain) return false;
  if (chain.includes('custom')) return true;
  return /^(profile|customer|order|basket|address|lineItem|productLineItem|paymentInstrument|customObject)$/i.test(
    chain.at(-1) ?? '',
  );
}

export default defineScriptRule({
  id: 'mass-assignment',
  severity: 'high',
  confidence: 'medium',
  category: 'authz',
  cwe: ['CWE-915'],
  description:
    'Request input copied into persistent objects with keys the client chooses: loops over req.form or httpParameterMap keys assigning obj.custom[key], computed keys from the request, or Object.assign(profile.custom, req.form).',
  remediation:
    'Copy only the fields you expect, by name (profile.custom.newsletter = form.newsletter.checked), or check each key against an allowlist before assigning.',
  create(context) {
    const {sourceCode} = context;
    const keyVariables = new Set<AstVariable>();

    const addKey = (id: AstNode | undefined) => {
      if (id?.type !== 'Identifier') return;
      const v = findVariable(sourceCode.getScope(id), id.name as string);
      if (v) keyVariables.add(v);
    };
    const declaredId = (left: AstNode): AstNode | undefined => {
      if (left.type === 'VariableDeclaration') return (left.declarations as Array<{id: AstNode}>)[0]?.id;
      return left;
    };
    /** Object.keys(src) / Object.entries(src) over request input. */
    const isRequestKeys = (node: AstNode | undefined): boolean => {
      if (node?.type !== 'CallExpression') return false;
      const chain = memberChain(node.callee as AstNode)?.join('.');
      return (
        (chain === 'Object.keys' || chain === 'Object.entries') &&
        isRequestDerived((node.arguments as AstNode[])[0], sourceCode)
      );
    };

    const isRequestKey = (property: AstNode): boolean => {
      if (property.type === 'Identifier') {
        const v = findVariable(sourceCode.getScope(property), property.name as string);
        if (v && keyVariables.has(v)) return true;
      }
      return isRequestDerived(property, sourceCode);
    };

    return {
      ForInStatement(node) {
        if (isRequestDerived(node.right, sourceCode)) addKey(declaredId(node.left));
      },
      ForOfStatement(node) {
        if (!isRequestKeys(node.right)) return;
        let id = declaredId(node.left);
        if (id?.type === 'ArrayPattern') id = (id.elements as AstNode[])[0];
        addKey(id);
      },
      CallExpression(node) {
        const name = propertyName(node.callee);
        if (name === 'forEach' && node.callee.type === 'MemberExpression' && isRequestKeys(node.callee.object)) {
          const fn = node.arguments[0];
          if (fn && (fn.type === 'FunctionExpression' || fn.type === 'ArrowFunctionExpression')) {
            let id = fn.params[0];
            if (id?.type === 'ArrayPattern') id = id.elements[0];
            addKey(id);
          }
        }
        if (memberChain(node.callee)?.join('.') === 'Object.assign') {
          const [target, ...sources] = node.arguments as AstNode[];
          if (target && isPersistentTarget(target) && sources.some((s) => isRequestDerived(s, sourceCode))) {
            context.report({node, message: 'Object.assign() copies every request field into a persistent object.'});
          }
        }
      },
      'AssignmentExpression:exit'(node) {
        const left = node.left;
        if (left.type !== 'MemberExpression' || !left.computed || !isPersistentTarget(left.object)) return;
        if (isRequestKey(left.property)) {
          context.report({
            node,
            message: 'Assignment uses a property name taken from the request; the client can set any attribute.',
          });
        }
      },
    };
  },
});
