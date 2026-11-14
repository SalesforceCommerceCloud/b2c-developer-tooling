/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Shared AST helpers for Script API security rules. They only use ESTree node
 * shapes and the scope members in ScriptSourceCode, so rules built on them run
 * the same in the SDK runner, ESLint, and oxlint.
 */
import type {AstNode, AstScope, AstVariable, ScriptSourceCode} from '../rule.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = AstNode & Record<string, any>;

/** Returns the string value of a string literal or an expression-free template literal. */
export function staticString(node: AstNode | null | undefined): string | undefined {
  const n = node as Node | null | undefined;
  if (!n) return undefined;
  if (n.type === 'Literal' && typeof n.value === 'string') return n.value;
  if (n.type === 'TemplateLiteral' && n.expressions.length === 0) return n.quasis[0]?.value?.cooked ?? undefined;
  return undefined;
}

/** For `require('x')`, returns `'x'`. */
export function requireSpecifier(node: AstNode | null | undefined): string | undefined {
  const n = node as Node | null | undefined;
  if (n?.type !== 'CallExpression' || n.callee.type !== 'Identifier' || n.callee.name !== 'require') return undefined;
  return staticString(n.arguments[0]);
}

/** The property name of a non-computed member expression, or of a computed one with a string key. */
export function propertyName(node: AstNode | null | undefined): string | undefined {
  const n = node as Node | null | undefined;
  if (n?.type !== 'MemberExpression') return undefined;
  if (!n.computed && n.property.type === 'Identifier') return n.property.name;
  return staticString(n.property);
}

/**
 * Flattens a member chain into names: `a.b.c` gives `['a', 'b', 'c']`. Call
 * expressions in the chain are stepped through (`a.b().c` gives `['a', 'b', 'c']`).
 * Returns undefined when the chain doesn't start at an identifier.
 */
export function memberChain(node: AstNode | null | undefined): string[] | undefined {
  const names: string[] = [];
  let current = node as Node | null | undefined;
  while (current) {
    if (current.type === 'Identifier') {
      names.unshift(current.name);
      return names;
    }
    if (current.type === 'ThisExpression') {
      names.unshift('this');
      return names;
    }
    if (current.type === 'MemberExpression') {
      const name = propertyName(current);
      if (name === undefined) return undefined;
      names.unshift(name);
      current = current.object;
      continue;
    }
    if (current.type === 'CallExpression') {
      current = current.callee;
      continue;
    }
    if (current.type === 'ChainExpression') {
      current = current.expression;
      continue;
    }
    return undefined;
  }
  return undefined;
}

/** The callee's method name for `x.y(...)`, or the function name for `y(...)`. */
export function calleeName(call: AstNode): string | undefined {
  const callee = (call as Node).callee as Node;
  if (callee.type === 'Identifier') return callee.name;
  return propertyName(callee);
}

/** Finds the variable `name` visible from `scope`. */
export function findVariable(scope: AstScope | null, name: string): AstVariable | undefined {
  for (let s = scope; s; s = s.upper) {
    const v = s.set.get(name);
    if (v) return v;
  }
  return undefined;
}

/** Expressions assigned to a variable: declarator initializers and assignment right-hand sides. */
export function assignedValues(variable: AstVariable): AstNode[] {
  const values: AstNode[] = [];
  for (const def of variable.defs) {
    const init = (def.node as Node).init as AstNode | undefined;
    if (def.type === 'Variable' && init) values.push(init);
  }
  for (const ref of variable.references) {
    if (ref.writeExpr && ref.isWrite()) values.push(ref.writeExpr);
  }
  return values;
}

/**
 * The module specifier an identifier was bound to with `require`, for
 * `var Cookie = require('dw/web/Cookie')`. Also handles destructuring of the
 * form `var {Cookie} = ...` loosely by returning undefined.
 */
export function requiredModuleOf(identifier: AstNode, sourceCode: ScriptSourceCode): string | undefined {
  const name = (identifier as Node).name as string | undefined;
  if (!name) return undefined;
  const variable = findVariable(sourceCode.getScope(identifier), name);
  if (!variable) return undefined;
  for (const value of assignedValues(variable)) {
    const spec = requireSpecifier(value);
    if (spec) return spec;
  }
  return undefined;
}

/**
 * Request objects whose properties carry user input, by root name. SFRA passes
 * `req` to route handlers; legacy code uses the `request` global.
 */
const REQUEST_SOURCES: Record<string, ReadonlySet<string>> = {
  req: new Set(['querystring', 'form', 'httpParameterMap', 'httpHeaders', 'httpParameters', 'body', 'referer']),
  request: new Set([
    'httpParameterMap',
    'httpParameters',
    'httpHeaders',
    'httpQueryString',
    'httpReferer',
    'httpPath',
    'httpURL',
  ]),
};

/** Methods that pass their receiver's taint through to the result. */
const PASS_THROUGH_METHODS = new Set([
  'get',
  'getStringValue',
  'getValue',
  'toString',
  'trim',
  'toLowerCase',
  'toUpperCase',
  'substring',
  'substr',
  'slice',
  'replace',
  'split',
  'concat',
]);

/** Global functions that pass their first argument's taint through. */
const PASS_THROUGH_FUNCTIONS = new Set(['decodeURIComponent', 'decodeURI', 'unescape', 'String']);

/**
 * Whether an expression carries request input: a property of `req.querystring`,
 * `req.form`, `request.httpParameterMap`, and similar, possibly through string
 * operations and local variables (followed a few assignments deep).
 */
export interface RequestTaintOptions {
  /** Variables to treat as clean even if assigned request input (for example, values that were validated). */
  isTrusted?: (variable: AstVariable) => boolean;
}

export function isRequestDerived(
  node: AstNode | null | undefined,
  sourceCode: ScriptSourceCode,
  options: RequestTaintOptions = {},
  depth = 0,
): boolean {
  const n = node as Node | null | undefined;
  if (!n || depth > 5) return false;
  const recurse = (child: AstNode | null | undefined) => isRequestDerived(child, sourceCode, options, depth + 1);

  switch (n.type) {
    case 'MemberExpression': {
      const chain = memberChain(n);
      if (chain && chain.length >= 2 && REQUEST_SOURCES[chain[0]]?.has(chain[1])) return true;
      return recurse(n.object);
    }
    case 'CallExpression': {
      const callee = n.callee as Node;
      if (callee.type === 'MemberExpression') {
        if (PASS_THROUGH_METHODS.has(propertyName(callee) ?? '')) {
          return recurse(callee.object) || n.arguments.some((a: AstNode) => recurse(a));
        }
        return false;
      }
      if (callee.type === 'Identifier' && PASS_THROUGH_FUNCTIONS.has(callee.name)) {
        return recurse(n.arguments[0]);
      }
      return false;
    }
    case 'BinaryExpression':
      return n.operator === '+' && (recurse(n.left) || recurse(n.right));
    case 'TemplateLiteral':
      return n.expressions.some((e: AstNode) => recurse(e));
    case 'LogicalExpression':
      return recurse(n.left) || recurse(n.right);
    case 'ConditionalExpression':
      return recurse(n.consequent) || recurse(n.alternate);
    case 'ChainExpression':
    case 'TSNonNullExpression':
      return recurse(n.expression);
    case 'Identifier': {
      const variable = findVariable(sourceCode.getScope(n), n.name);
      if (!variable || options.isTrusted?.(variable)) return false;
      return assignedValues(variable).some((v) => v !== n && recurse(v));
    }
    default:
      return false;
  }
}

/** Whether an expression builds a string from non-constant parts (concatenation, template, `.concat`). */
export function isDynamicString(node: AstNode | null | undefined): boolean {
  const n = node as Node | null | undefined;
  if (!n) return false;
  if (n.type === 'TemplateLiteral') return n.expressions.length > 0;
  if (n.type === 'BinaryExpression' && n.operator === '+') {
    return (
      !(staticString(n.left) !== undefined && staticString(n.right) !== undefined) &&
      (isStringish(n.left) || isStringish(n.right))
    );
  }
  if (n.type === 'CallExpression' && propertyName(n.callee) === 'concat') return true;
  return false;
}

function isStringish(node: AstNode): boolean {
  const n = node as Node;
  return (
    staticString(n) !== undefined ||
    n.type === 'TemplateLiteral' ||
    (n.type === 'BinaryExpression' && n.operator === '+')
  );
}

/** Operands of a string concatenation or template literal, in order. Other expressions return themselves. */
export function concatenationParts(node: AstNode): AstNode[] {
  const n = node as Node;
  if (n.type === 'BinaryExpression' && n.operator === '+')
    return [...concatenationParts(n.left), ...concatenationParts(n.right)];
  if (n.type === 'TemplateLiteral') {
    const parts: AstNode[] = [];
    n.quasis.forEach((q: Node, i: number) => {
      if (q.value?.cooked) parts.push({type: 'Literal', value: q.value.cooked, range: q.range, loc: q.loc} as AstNode);
      if (i < n.expressions.length) parts.push(n.expressions[i]);
    });
    return parts;
  }
  return [n];
}

/**
 * Variables that are checked by a call inside a condition, such as
 * `if (!allowed.test(url))` or `url.startsWith('/') ? ... : ...`. Rules use
 * this as a light-weight sign that a value was validated.
 */
export function collectCheckedVariables(sourceCode: ScriptSourceCode): Set<AstVariable> {
  const checked = new Set<AstVariable>();
  const visitTest = (test: Node | null | undefined, inCall: boolean): void => {
    if (!test || typeof test !== 'object') return;
    if (test.type === 'Identifier' && inCall) {
      const v = findVariable(sourceCode.getScope(test), test.name);
      if (v) checked.add(v);
      return;
    }
    const nowInCall = inCall || test.type === 'CallExpression';
    for (const [key, value] of Object.entries(test)) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      if (Array.isArray(value)) value.forEach((c) => visitTest(c as Node, nowInCall));
      else if (value && typeof value === 'object' && typeof (value as Node).type === 'string')
        visitTest(value as Node, nowInCall);
    }
  };
  const walk = (node: Node | null | undefined): void => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'IfStatement' || node.type === 'ConditionalExpression' || node.type === 'WhileStatement')
      visitTest(node.test, false);
    for (const [key, value] of Object.entries(node)) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      if (Array.isArray(value)) value.forEach((c) => walk(c as Node));
      else if (value && typeof value === 'object' && typeof (value as Node).type === 'string') walk(value as Node);
    }
  };
  walk(sourceCode.ast as Node);
  return checked;
}
