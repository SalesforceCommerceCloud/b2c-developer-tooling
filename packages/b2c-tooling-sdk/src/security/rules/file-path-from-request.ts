/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode, AstVariable} from '../rule.js';
import {defineScriptRule} from '../rule.js';
import {
  findVariable,
  isRequestDerived,
  memberChain,
  propertyName,
  requiredModuleOf,
  requireSpecifier,
} from '../script/helpers.js';

const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression']);

export default defineScriptRule({
  id: 'file-path-from-request',
  severity: 'high',
  confidence: 'medium',
  category: 'injection',
  cwe: ['CWE-73', 'CWE-22', 'CWE-434'],
  description:
    'dw.io.File paths built from request input, including the field name, content type, or original file name passed to the HttpParameterMap.processMultipart() callback.',
  remediation:
    'Choose file names on the server: return a directory from the processMultipart() callback so the platform generates a unique name, or build the name from a value you generate (such as a UUID) and an extension from an allowlist.',
  create(context) {
    const {sourceCode} = context;
    const fileConstructions: AstNode[] = [];
    const callbacks = new Set<AstNode>();

    const isFileConstructor = (callee: AstNode): boolean => {
      if (callee.type === 'Identifier') {
        const spec = requiredModuleOf(callee, sourceCode);
        return spec === 'dw/io/File' || (spec === undefined && callee.name === 'File');
      }
      if (requireSpecifier(callee) === 'dw/io/File') return true;
      return memberChain(callee)?.join('.') === 'dw.io.File';
    };

    /** The function a processMultipart() argument refers to: inline, or a named function or variable. */
    const resolveFunction = (node: AstNode | undefined): AstNode | undefined => {
      if (!node) return undefined;
      if (FUNCTION_TYPES.has(node.type)) return node;
      if (node.type !== 'Identifier') return undefined;
      const variable = findVariable(sourceCode.getScope(node), node.name as string);
      for (const def of variable?.defs ?? []) {
        if (def.type === 'FunctionName') return def.node;
        const init = (def.node as {init?: AstNode}).init;
        if (def.type === 'Variable' && init && FUNCTION_TYPES.has(init.type)) return init;
      }
      return undefined;
    };

    return {
      NewExpression(node) {
        if (isFileConstructor(node.callee)) fileConstructions.push(node);
      },
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression' && propertyName(node.callee) === 'processMultipart') {
          const fn = resolveFunction(node.arguments[0]);
          if (fn) callbacks.add(fn);
        }
      },
      'Program:exit'() {
        // The callback's (fieldName, contentType, originalFileName) come from the client.
        const isSource = (variable: AstVariable) =>
          variable.defs.some((d) => d.type === 'Parameter' && callbacks.has(d.node));
        for (const node of fileConstructions) {
          const tainted = (node.arguments as AstNode[]).find((arg) => isRequestDerived(arg, sourceCode, {isSource}));
          if (!tainted) continue;
          const inCallback = sourceCode.getAncestors(node).some((a) => callbacks.has(a));
          context.report({
            node: tainted,
            message: inCallback
              ? 'Upload file path comes from the request; the client can choose the file name and overwrite existing files in that directory.'
              : 'File path comes from the request; the client can choose which file is read, written, or deleted.',
          });
        }
      },
    };
  },
});
