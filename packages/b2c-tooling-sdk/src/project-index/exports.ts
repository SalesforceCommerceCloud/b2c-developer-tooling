/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AstNode, ScriptRule, ScriptRuleContext, ScriptRuleListener} from '../security/rule.js';
import {memberChain, propertyName, staticString} from '../security/script/helpers.js';
import {resolveFunction} from '../security/script/routes.js';
import {runScriptRules} from '../security/script/runner.js';
import type {ReturnBehavior} from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = AstNode & Record<string, any>;

/** What a module exports under one name. */
export interface ExportedFunctionInfo {
  line?: number;
  returnsValue: ReturnBehavior;
  /** Whether `<export>.public = true` is set. */
  public: boolean;
}

/** Exported functions of a CommonJS script module, by export name. */
export type ModuleExports = Map<string, ExportedFunctionInfo>;

const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression']);

/** `exports.NAME` or `module.exports.NAME` → NAME. */
function exportName(node: Node): string | undefined {
  const chain = memberChain(node);
  if (!chain) return undefined;
  if (chain.length === 2 && chain[0] === 'exports') return chain[1];
  if (chain.length === 3 && chain[0] === 'module' && chain[1] === 'exports') return chain[2];
  return undefined;
}

/** Whether a function returns a value from its own body (nested functions are ignored). */
export function returnBehavior(fn: AstNode | undefined): ReturnBehavior {
  if (!fn) return 'unknown';
  const body = (fn as Node).body as Node;
  if (body && body.type !== 'BlockStatement') return 'yes'; // arrow function with an expression body
  let returns = false;
  const stack: Node[] = body ? [body] : [];
  while (stack.length > 0 && !returns) {
    const node = stack.pop()!;
    if (node.type === 'ReturnStatement') {
      const arg = node.argument as Node | null;
      const isUndefined =
        !arg ||
        (arg.type === 'Identifier' && arg.name === 'undefined') ||
        (arg.type === 'UnaryExpression' && arg.operator === 'void');
      if (!isUndefined) returns = true;
      continue;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const children = Array.isArray(value) ? value : [value];
      for (const child of children) {
        if (child && typeof child === 'object' && typeof child.type === 'string' && !FUNCTION_TYPES.has(child.type)) {
          stack.push(child);
        }
      }
    }
  }
  return returns ? 'yes' : 'no';
}

/**
 * Finds the functions a CommonJS module exports (`exports.x = ...`,
 * `module.exports.x = ...`, `module.exports = {x: ...}`), with their line,
 * whether they return a value, and whether they are marked `.public = true`.
 * Returns undefined when the file can't be parsed.
 */
export function analyzeModuleExports(text: string, filename: string): ModuleExports | undefined {
  const exported = new Map<string, AstNode | undefined>();
  const publicNames = new Set<string>();
  const publicFunctions = new Set<AstNode>();
  let sourceCode: ScriptRuleContext['sourceCode'] | undefined;

  const collector = {
    meta: {b2c: {id: 'project-index-exports'}},
    create(context: ScriptRuleContext): ScriptRuleListener {
      sourceCode = context.sourceCode;
      return {
        AssignmentExpression(node: Node) {
          if (node.operator !== '=') return;
          const left = node.left as Node;
          // module.exports = {a: fn, b: fn}
          if (memberChain(left)?.join('.') === 'module.exports' && node.right.type === 'ObjectExpression') {
            for (const prop of node.right.properties as Node[]) {
              if (prop.type !== 'Property') continue;
              const name = prop.key.type === 'Identifier' ? prop.key.name : staticString(prop.key);
              if (name) exported.set(name, resolveFunction(prop.value, context.sourceCode));
            }
            return;
          }
          if (left.type !== 'MemberExpression') return;
          // exports.a = fn
          const name = exportName(left);
          if (name) {
            exported.set(name, resolveFunction(node.right, context.sourceCode));
            return;
          }
          // exports.a.public = true, or fnName.public = true
          if (propertyName(left) === 'public' && node.right.type === 'Literal' && node.right.value === true) {
            const target = left.object as Node;
            const targetExport = exportName(target);
            if (targetExport) publicNames.add(targetExport);
            const fn = resolveFunction(target, context.sourceCode);
            if (fn) publicFunctions.add(fn);
          }
        },
      };
    },
  } as unknown as ScriptRule;

  const result = runScriptRules(text, filename, [collector]);
  if (result.parseError || !sourceCode) return undefined;

  const exports: ModuleExports = new Map();
  for (const [name, fn] of exported) {
    exports.set(name, {
      ...(fn?.loc ? {line: fn.loc.start.line} : {}),
      returnsValue: returnBehavior(fn),
      public: publicNames.has(name) || (fn !== undefined && publicFunctions.has(fn)),
    });
  }
  return exports;
}
