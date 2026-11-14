/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Recognizers for storefront controller idioms, shared by the project index
 * and the route-aware security rules:
 *
 * - SFRA: server.get/post/use/replace/append/prepend('Name', ...chain) and
 *   server.extend(module.superModule | require('...')).
 * - SiteGenesis: exports.Name = guard.ensure([...filters], action),
 *   guard.httpsGet/httpsPost/all/expose(action).
 */
import type {AstNode, ScriptSourceCode} from '../rule.js';
import {findVariable, memberChain, propertyName, requiredModuleOf, requireSpecifier, staticString} from './helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = AstNode & Record<string, any>;

/** SFRA server methods that register or change a route. */
export type SfraRouteMethod = 'append' | 'get' | 'post' | 'prepend' | 'replace' | 'use';

const SFRA_ROUTE_METHODS = new Set<SfraRouteMethod>(['append', 'get', 'post', 'prepend', 'replace', 'use']);

/** One entry in a middleware chain, identified as precisely as the code allows. */
export interface MiddlewareRef {
  /**
   * Stable identifier: `<module>.<export>` for required middleware, using the
   * module's file name (`csrf.validateAjaxRequest`, `userLoggedIn.validateLoggedIn`,
   * `server.middleware.https`), the identifier for other references, or
   * `function` for inline functions.
   */
  id: string;
  line: number;
  /** For required middleware: the module specifier it was required from (`*\/cartridge/scripts/middleware/csrf`). */
  module?: string;
  /** For inline functions: the function calls CSRFProtection.validateRequest() itself. */
  validatesCsrf?: boolean;
  /** For inline functions: the function handles a form submission (req.form, handleAction). */
  readsForm?: boolean;
}

/** An SFRA route statement. */
export interface SfraRouteCall {
  method: SfraRouteMethod;
  name: string;
  chain: MiddlewareRef[];
  node: AstNode;
}

/** Middleware IDs that validate a CSRF token. */
export function isCsrfValidator(id: string): boolean {
  return /^csrf(Protection)?\.validate(Ajax)?Request$/.test(id);
}

/** Middleware IDs that require a logged-in customer. */
export function isLoginValidator(id: string): boolean {
  return /^userLoggedIn\.validateLoggedIn(Ajax)?$/.test(id);
}

/** Whether `node` is the SFRA server object (`require('server')`, or an unresolved identifier named `server`). */
export function isSfraServer(node: AstNode, sourceCode: ScriptSourceCode): boolean {
  if (node.type !== 'Identifier') return false;
  const spec = requiredModuleOf(node, sourceCode);
  return spec === 'server' || spec === 'server/server' || (spec === undefined && node.name === 'server');
}

/** Recognizes `server.<method>('Name', ...chain)`. */
export function sfraRouteCall(node: AstNode, sourceCode: ScriptSourceCode): SfraRouteCall | undefined {
  const n = node as Node;
  if (n.type !== 'CallExpression' || n.callee.type !== 'MemberExpression') return undefined;
  const method = propertyName(n.callee) as SfraRouteMethod | undefined;
  if (!method || !SFRA_ROUTE_METHODS.has(method) || !isSfraServer(n.callee.object, sourceCode)) return undefined;
  const name = staticString(n.arguments[0]);
  if (name === undefined) return undefined;
  const chain = (n.arguments as AstNode[]).slice(1).map((arg) => describeMiddleware(arg, sourceCode));
  // server.get/post insert the method check as the first middleware.
  if (method === 'get' || method === 'post')
    chain.unshift({id: `server.middleware.${method}`, line: n.loc?.start.line ?? 0});
  return {method, name, chain, node};
}

/**
 * Recognizes `server.extend(...)`. Returns `superModule` for
 * `server.extend(module.superModule)`, the module specifier for
 * `server.extend(require('...'))`, or `unknown`.
 */
export function sfraExtendTarget(node: AstNode, sourceCode: ScriptSourceCode): string | undefined {
  const n = node as Node;
  if (n.type !== 'CallExpression' || n.callee.type !== 'MemberExpression') return undefined;
  if (propertyName(n.callee) !== 'extend' || !isSfraServer(n.callee.object, sourceCode)) return undefined;
  const arg = n.arguments[0] as Node | undefined;
  if (!arg) return 'unknown';
  if (memberChain(arg)?.join('.') === 'module.superModule') return 'superModule';
  const spec = requireSpecifier(arg) ?? (arg.type === 'Identifier' ? requiredModuleOf(arg, sourceCode) : undefined);
  if (spec) return spec;
  if (arg.type === 'Identifier') {
    const variable = findVariable(sourceCode.getScope(arg), arg.name);
    const init = variable?.defs[0]?.node && ((variable.defs[0].node as Node).init as Node | undefined);
    if (init && memberChain(init)?.join('.') === 'module.superModule') return 'superModule';
  }
  return 'unknown';
}

/** Identifies one middleware argument. */
export function describeMiddleware(node: AstNode, sourceCode: ScriptSourceCode): MiddlewareRef {
  const n = node as Node;
  const line = n.loc?.start.line ?? 0;
  if (n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
    return {id: 'function', line, validatesCsrf: callsCsrfValidation(n, sourceCode), readsForm: readsFormInput(n)};
  }
  const chain = memberChain(n);
  if (chain && chain.length > 0) {
    const root = rootIdentifier(n);
    const spec = root ? requiredModuleOf(root, sourceCode) : undefined;
    if (spec) {
      const base =
        spec === 'server'
          ? 'server'
          : spec
              .replace(/\.(js|ds)$/, '')
              .split('/')
              .at(-1)!;
      return {id: [base, ...chain.slice(1)].join('.'), line, ...(spec === 'server' ? {} : {module: spec})};
    }
    return {id: chain.join('.'), line};
  }
  return {id: 'function', line};
}

function rootIdentifier(node: Node): Node | undefined {
  let current: Node | undefined = node;
  while (current && current.type === 'MemberExpression') current = current.object;
  return current?.type === 'Identifier' ? current : undefined;
}

/** Whether a function body calls `CSRFProtection.validateRequest()` (dw/web/CSRFProtection). */
export function callsCsrfValidation(fn: AstNode, sourceCode: ScriptSourceCode): boolean {
  let found = false;
  walk(fn, (node) => {
    if (found || node.type !== 'CallExpression' || propertyName(node.callee) !== 'validateRequest') return;
    const object = node.callee.object as Node;
    const chain = memberChain(object);
    if (chain?.join('.') === 'dw.web.CSRFProtection') found = true;
    else if (requireSpecifier(object) === 'dw/web/CSRFProtection') found = true;
    else if (object.type === 'Identifier' && requiredModuleOf(object, sourceCode) === 'dw/web/CSRFProtection')
      found = true;
  });
  return found;
}

/**
 * Whether a function body handles a form submission: reads SFRA `req.form`, or
 * calls a SiteGenesis form's `handleAction()`. Rendering a form or reading
 * query parameters doesn't count.
 */
export function readsFormInput(fn: AstNode): boolean {
  let found = false;
  walk(fn, (node) => {
    if (found || node.type !== 'MemberExpression') return;
    const chain = memberChain(node);
    if (!chain) return;
    if ((chain[0] === 'req' && chain[1] === 'form') || chain.at(-1) === 'handleAction') found = true;
  });
  return found;
}

/** A SiteGenesis controller export. */
export interface SgControllerExport {
  name: string;
  /** Guard filters (`get`, `post`, `https`, `loggedIn`, `csrf`, `include`); empty for guard.all/expose. */
  filters: string[];
  /** The action function node, when it is defined in the same file. */
  action?: AstNode;
  node: AstNode;
}

const GUARD_SHORTCUTS: Record<string, string[]> = {
  all: [],
  expose: [],
  httpsGet: ['https', 'get'],
  httpsPost: ['https', 'post'],
};

/** Recognizes `exports.Name = guard.ensure([...], action)` and the guard shortcuts. */
export function sgControllerExport(node: AstNode, sourceCode: ScriptSourceCode): SgControllerExport | undefined {
  const n = node as Node;
  if (n.type !== 'AssignmentExpression' || n.left.type !== 'MemberExpression') return undefined;
  const target = memberChain(n.left);
  if (
    !target ||
    !(
      (target.length === 2 && target[0] === 'exports') ||
      (target.length === 3 && target[0] === 'module' && target[1] === 'exports')
    )
  ) {
    return undefined;
  }
  const call = n.right as Node;
  if (call.type !== 'CallExpression' || call.callee.type !== 'MemberExpression') return undefined;
  const guardRef = call.callee.object as Node;
  const isGuard =
    (guardRef.type === 'Identifier' &&
      (/(^|\/)guard$/.test(requiredModuleOf(guardRef, sourceCode) ?? '') || guardRef.name === 'guard')) ||
    /(^|\/)guard$/.test(requireSpecifier(guardRef) ?? '');
  if (!isGuard) return undefined;
  const method = propertyName(call.callee);
  let filters: string[] | undefined;
  let actionArg: Node | undefined;
  if (method === 'ensure') {
    const list = call.arguments[0] as Node | undefined;
    if (list?.type !== 'ArrayExpression') return undefined;
    filters = list.elements
      .map((e: Node) => staticString(e))
      .filter((s: string | undefined): s is string => s !== undefined);
    actionArg = call.arguments[1];
  } else if (method && method in GUARD_SHORTCUTS) {
    filters = GUARD_SHORTCUTS[method];
    actionArg = call.arguments[0];
  } else {
    return undefined;
  }
  return {name: target.at(-1)!, filters: filters ?? [], action: resolveFunction(actionArg, sourceCode), node};
}

/** The function an argument refers to: inline, or a function or variable declared in the file. */
export function resolveFunction(node: AstNode | undefined, sourceCode: ScriptSourceCode): AstNode | undefined {
  const n = node as Node | undefined;
  if (!n) return undefined;
  if (n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression' || n.type === 'FunctionDeclaration')
    return n;
  if (n.type !== 'Identifier') return undefined;
  const variable = findVariable(sourceCode.getScope(n), n.name);
  for (const def of variable?.defs ?? []) {
    if (def.type === 'FunctionName') return def.node;
    const init = (def.node as Node).init as Node | undefined;
    if (
      def.type === 'Variable' &&
      init &&
      (init.type === 'FunctionExpression' || init.type === 'ArrowFunctionExpression')
    )
      return init;
  }
  return undefined;
}

/** Depth-first walk over a subtree (skipping `parent` links). */
export function walk(root: AstNode, visit: (node: Node) => void): void {
  const stack: Node[] = [root as Node];
  while (stack.length > 0) {
    const node = stack.pop()!;
    visit(node);
    for (const [key, value] of Object.entries(node)) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      if (Array.isArray(value)) {
        for (const child of value)
          if (child && typeof child === 'object' && typeof child.type === 'string') stack.push(child);
      } else if (value && typeof value === 'object' && typeof (value as Node).type === 'string') {
        stack.push(value as Node);
      }
    }
  }
}
