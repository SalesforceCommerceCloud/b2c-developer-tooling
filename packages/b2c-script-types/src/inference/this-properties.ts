/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Constructor functions keep their arguments on `this`
// (`this.refinementValue = refinementValue`) and use them in prototype
// methods (`this.refinementValue.hitCount`), rarely through the parameter
// itself. IntelliJ reads those uses as uses of the parameter, and so does
// ./usage-profile: the checker binds every `this.refinementValue` of the
// constructor's prototype methods to the member the constructor declares, so
// a read of that member anywhere in the file is a use of the value stored in
// it. Constructors also define members with `Object.defineProperty(this, …)`,
// which the checker leaves off the instance type; ./type-helpers counts them
// as members all the same.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {spellingFilter} from './ast-helpers';
import type {InferenceContext} from './context';

/** `this.x = value`: a plain assignment to a member of `this`. */
function isThisMemberStore(
  ts: typeof tsserver,
  node: tsserver.Node,
): node is tsserver.BinaryExpression & {readonly left: tsserver.PropertyAccessExpression} {
  return (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isPropertyAccessExpression(node.left) &&
    node.left.expression.kind === ts.SyntaxKind.ThisKeyword
  );
}

/** True when `node` gives its body a `this` of its own (a function, method or class; arrow functions share it). */
function hasOwnThis(ts: typeof tsserver, node: tsserver.Node): boolean {
  return (ts.isFunctionLike(node) && !ts.isArrowFunction(node)) || ts.isClassLike(node);
}

/**
 * The members of `this` the function declaring `param` stores it in
 * (`this.refinementValue = refinementValue`). Stores inside nested functions
 * are skipped: their `this` is another value.
 */
export function thisMembersStoring(
  ctx: InferenceContext,
  param: tsserver.ParameterDeclaration,
): ReadonlySet<tsserver.Symbol> {
  const {ts, checker} = ctx;
  const members = new Set<tsserver.Symbol>();
  const body = (param.parent as tsserver.FunctionLikeDeclaration).body;
  const paramSymbol = ts.isIdentifier(param.name) ? checker.getSymbolAtLocation(param.name) : undefined;
  if (!body || !paramSymbol) return members;
  const spellsParam = spellingFilter(body, [paramSymbol.name]);
  const visit = (node: tsserver.Node): void => {
    if (!spellsParam(node)) return;
    const stores = isThisMemberStore(ts, node) && checker.getSymbolAtLocation(node.right) === paramSymbol;
    const member = stores ? checker.getSymbolAtLocation(node.left.name) : undefined;
    if (member) members.add(member);
    if (!hasOwnThis(ts, node)) ts.forEachChild(node, visit);
  };
  ts.forEachChild(body, visit);
  return members;
}

/** True when `callee` is `Object.defineProperty`. */
function isObjectDefineProperty(ts: typeof tsserver, callee: tsserver.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === 'Object' &&
    callee.name.text === 'defineProperty'
  );
}

/** `Object.defineProperty(this, 'name', …)`: the name of the member the call defines on `this`. */
function memberDefinedOnThisBy(ts: typeof tsserver, node: tsserver.Node): string | undefined {
  if (!ts.isCallExpression(node) || !isObjectDefineProperty(ts, node.expression)) return undefined;
  const [target, key] = node.arguments;
  if (target?.kind !== ts.SyntaxKind.ThisKeyword || !key || !ts.isStringLiteralLike(key)) return undefined;
  return key.text;
}

/** The body that builds an instance: a constructor function's own, or a class's constructor. */
function constructorBody(ts: typeof tsserver, declaration: tsserver.Declaration): tsserver.Node | undefined {
  const constructor = ts.isVariableDeclaration(declaration) ? declaration.initializer : declaration;
  if (constructor && (ts.isFunctionDeclaration(constructor) || ts.isFunctionExpression(constructor))) {
    return constructor.body;
  }
  return ts.isClassLike(declaration) ? declaration.members.find(ts.isConstructorDeclaration)?.body : undefined;
}

// Keyed by declaration node: a syntax tree never changes, and tsserver reuses
// it across Programs for as long as its file is unchanged.
const membersDefinedByDeclaration = new WeakMap<tsserver.Declaration, ReadonlySet<string>>();

/** The members the constructor `declaration` declares defines on its own `this` (not a nested function's). */
function membersDefinedIn(ts: typeof tsserver, declaration: tsserver.Declaration): ReadonlySet<string> {
  const cached = membersDefinedByDeclaration.get(declaration);
  if (cached) return cached;
  const members = new Set<string>();
  const visit = (node: tsserver.Node): void => {
    const member = memberDefinedOnThisBy(ts, node);
    if (member !== undefined) members.add(member);
    if (!hasOwnThis(ts, node)) ts.forEachChild(node, visit);
  };
  const body = constructorBody(ts, declaration);
  if (body) ts.forEachChild(body, visit);
  membersDefinedByDeclaration.set(declaration, members);
  return members;
}

/**
 * True when `type`'s constructor defines `name` with
 * `Object.defineProperty(this, 'name', …)` (SFRA's request model defines most
 * of its members this way). The checker binds such calls on exports and
 * prototypes but not on `this`, so the instance type lacks these members.
 */
export function isMemberDefinedOnThis(ts: typeof tsserver, type: tsserver.Type, name: string): boolean {
  const declarations = type.getSymbol()?.declarations ?? [];
  return declarations.some((declaration) => membersDefinedIn(ts, declaration).has(name));
}

/** True when `node` reads one of `members` off `this` (`this.refinementValue`, not `this.refinementValue = x`). */
export function isStoredMemberRead(
  ctx: InferenceContext,
  members: ReadonlySet<tsserver.Symbol>,
  node: tsserver.Node,
): node is tsserver.PropertyAccessExpression {
  const {ts, checker} = ctx;
  if (members.size === 0 || !ts.isPropertyAccessExpression(node)) return false;
  const store = node.parent;
  const written = isThisMemberStore(ts, store) && store.left === node;
  if (node.expression.kind !== ts.SyntaxKind.ThisKeyword || written) return false;
  const member = checker.getSymbolAtLocation(node.name);
  return member !== undefined && members.has(member);
}
