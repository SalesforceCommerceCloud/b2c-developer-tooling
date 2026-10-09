/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Where a function value travels once it has a name. A reference search on a
// function's name finds every place the function *value* sits: most are calls,
// but SFCC code also hands functions and constructor "classes" around —
// `module.exports = Model` (consumers reach it through `require()`), a
// factory that picks a model (`return require('…/boolean')`, then
// `var Model = getModel(definition); new Model(...)`), and a model passed on
// as an argument (`createRefinement(search, definition, Model)`), or to a
// callee outside the project that calls it (`server.get('Show',
// cache.applyDefaultCache)`). valueTarget() says where one such position
// leads: to a call that invokes the value, to a call handing it to such a
// callee, or to the next name that holds it. ./call-sites runs the reference
// searches and follows those names, a bounded number of hops.

import type tsserver from 'typescript/lib/tsserverlibrary';

import type {InferenceContext} from './context';
import {resolveCalleeDeclaration} from './signatures';

/**
 * One invocation of a function and the arguments its parameters receive, by
 * parameter index. Besides an ordinary call (`helper(x)`) this covers a
 * constructor invocation (`new Helper(x)`, SFRA's "class" models; a bare
 * `new Helper` passes nothing), `helper.call(thisArg, x)` and
 * `helper.apply(thisArg, [x])` — the shapes SFRA model inheritance uses
 * (`BaseAttributeValue.call(this, productSearch, ...)`).
 */
export interface CallSite {
  readonly node: tsserver.CallExpression | tsserver.NewExpression;
  readonly args: readonly tsserver.Expression[];
}

/** How a searched name holds the function: as the function itself, or as a factory whose calls return it. */
export type ValueRole = 'factory' | 'value';

/**
 * A call handing the function as an argument to a callee that is not a
 * project function receiving it in a parameter: a Script API or SFRA
 * declaration (`server.get('Show', cache.applyDefaultCache)`,
 * `lineItems.forEach(addLineItem)`). The callee calls it, with what its
 * declaration says the callback at `argIndex` receives.
 */
export interface Handoff {
  readonly call: tsserver.CallExpression;
  readonly argIndex: number;
}

/** Where a function is called: its call sites, and the calls handing it to a declared callee that calls it. */
export interface CallSites {
  readonly calls: CallSite[];
  readonly handoffs: Handoff[];
}

/** Where a reference leads: a call site, a handoff, or a further name whose references lead on. */
export type ReferenceTarget =
  | {readonly kind: 'call'; readonly call: CallSite}
  | {readonly kind: 'handoff'; readonly handoff: Handoff}
  | {readonly kind: 'name'; readonly name: tsserver.Identifier; readonly role: ValueRole};

/** A function-like declaration, or the class a constructor is invoked through. */
type Callable = tsserver.SignatureDeclaration | tsserver.ClassLikeDeclaration;

/** The name a function declaration, method or class declares itself by. */
function ownName(fn: Callable, ts: typeof tsserver): tsserver.Identifier | undefined {
  const declaresName = ts.isFunctionDeclaration(fn) || ts.isMethodDeclaration(fn) || ts.isClassDeclaration(fn);
  return declaresName && fn.name && ts.isIdentifier(fn.name) ? fn.name : undefined;
}

/** The name `left = value` binds: `x`, `obj.x`, `exports.x`, or `exports` for `module.exports`. */
function assignedName(ts: typeof tsserver, left: tsserver.Expression): tsserver.Identifier | undefined {
  if (ts.isPropertyAccessExpression(left)) return ts.isIdentifier(left.name) ? left.name : undefined;
  return ts.isIdentifier(left) ? left : undefined;
}

/** The variable or property `value` initializes: `var helper = …`, `{helper: …}`, `{helper}`, `const {helper} = …`. */
function declaredName(ts: typeof tsserver, value: tsserver.Node): tsserver.Identifier | undefined {
  const parent = value.parent;
  if (ts.isShorthandPropertyAssignment(parent)) return parent.name;
  const initializes =
    ts.isBindingElement(parent) ||
    ((ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) && parent.initializer === value);
  return initializes && ts.isIdentifier(parent.name) ? parent.name : undefined;
}

/**
 * The name `value` is bound to: the variable or property it initializes
 * (see {@link declaredName}), or the target it is assigned to
 * (`exports.helper = …`). For `module.exports = …` that is the `exports`
 * name, whose references are the `require()` calls of the module.
 */
function bindingNameOf(ts: typeof tsserver, value: tsserver.Node): tsserver.Identifier | undefined {
  const parent = value.parent;
  const isAssignment =
    ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && parent.right === value;
  return isAssignment ? assignedName(ts, parent.left) : declaredName(ts, value);
}

/**
 * Identifies the name to run findReferences on for a function-like
 * declaration: its own name, or for one that has none, the name it is bound
 * to (the common CommonJS shapes: `const foo = function(){}`,
 * `{foo: function(){}}`, `{foo(){}}`, `exports.foo = function(){}`,
 * `module.exports = function(){}`). A class constructor is searched through
 * its class, since that is what `new Model(x)` names.
 */
export function getReferenceNameNode(
  fn: tsserver.SignatureDeclaration,
  ts: typeof tsserver,
): tsserver.Identifier | undefined {
  const callable: Callable = ts.isConstructorDeclaration(fn) ? fn.parent : fn;
  return ownName(callable, ts) ?? (ts.isExpression(callable) ? bindingNameOf(ts, callable) : undefined);
}

/** The function enclosing `node`, if any. */
export function enclosingFunction(node: tsserver.Node, ts: typeof tsserver): tsserver.SignatureDeclaration | undefined {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionLike(current)) return current;
  }
  return undefined;
}

/**
 * The arguments `fn.apply(thisArg, list)` passes: the elements of an array
 * literal, or — for the forwarding idiom `fn.apply(this, arguments)` — the
 * enclosing function's own parameters, which inference then resolves from
 * that function's call sites in turn.
 */
function applyArguments(call: tsserver.CallExpression, ts: typeof tsserver): tsserver.Expression[] {
  const list = call.arguments[1];
  if (!list) return [];
  if (ts.isArrayLiteralExpression(list)) {
    return list.elements.filter((element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element));
  }
  if (!ts.isIdentifier(list) || list.text !== 'arguments') return [];
  const forwarding = enclosingFunction(call, ts);
  return forwarding ? forwarding.parameters.map((parameter) => parameter.name).filter(ts.isIdentifier) : [];
}

/** What a reference stands for as a value: the reference itself, or for a member name (`obj.helper`), the whole access. */
function accessOf(node: tsserver.Node, ts: typeof tsserver): tsserver.Node {
  const {parent} = node;
  return ts.isPropertyAccessExpression(parent) && parent.name === node ? parent : node;
}

/** `callee(x)` / `new Callee(x)`: the call `callee` is invoked by directly. */
function directCall(callee: tsserver.Node, ts: typeof tsserver): CallSite | undefined {
  const call = callee.parent;
  const isCall = (ts.isCallExpression(call) || ts.isNewExpression(call)) && call.expression === callee;
  return isCall ? {node: call, args: call.arguments ?? []} : undefined;
}

/** `callee.call(thisArg, x)` / `callee.apply(thisArg, [x])`: the call `callee` is invoked through. */
function borrowedCall(callee: tsserver.Node, ts: typeof tsserver): CallSite | undefined {
  const access = callee.parent;
  if (!ts.isPropertyAccessExpression(access) || access.expression !== callee) return undefined;
  const call = access.parent;
  if (!ts.isCallExpression(call) || call.expression !== access) return undefined;
  if (access.name.text === 'call') return {node: call, args: call.arguments.slice(1)};
  return access.name.text === 'apply' ? {node: call, args: applyArguments(call, ts)} : undefined;
}

/**
 * A `require('specifier')` call, identified structurally (only public
 * AST-node-kind checks — `ts.isRequireCall` exists at runtime but isn't part
 * of TypeScript's public API surface, so isn't safe to depend on here).
 */
function isRequireCallExpression(node: tsserver.Node, ts: typeof tsserver): node is tsserver.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'require' &&
    node.arguments.length > 0 &&
    ts.isStringLiteralLike(node.arguments[0])
  );
}

/** The `require('…')` call whose module specifier `node` is. */
function requireCallOf(node: tsserver.Node, ts: typeof tsserver): tsserver.CallExpression | undefined {
  const call = node.parent;
  return isRequireCallExpression(call, ts) && call.arguments[0] === node ? call : undefined;
}

/** True when `parent` can evaluate to `child` unchanged: `(x)`, `c ? x : y`, `a || x`, `a ?? x`, `a && x`. */
function passesThrough(ts: typeof tsserver, parent: tsserver.Node, child: tsserver.Node): boolean {
  if (ts.isParenthesizedExpression(parent)) return true;
  if (ts.isConditionalExpression(parent)) return parent.condition !== child;
  if (!ts.isBinaryExpression(parent)) return false;
  const operator = parent.operatorToken.kind;
  const {SyntaxKind} = ts;
  if (operator === SyntaxKind.AmpersandAmpersandToken) return parent.right === child;
  return operator === SyntaxKind.BarBarToken || operator === SyntaxKind.QuestionQuestionToken;
}

/** The outermost expression that still evaluates to `node` (`getModel(a) || Fallback` for `Fallback`). */
function outermostValue(ts: typeof tsserver, node: tsserver.Node): tsserver.Node {
  let value = node;
  while (value.parent && passesThrough(ts, value.parent, value)) value = value.parent;
  return value;
}

/**
 * The project function `call` passes its arguments to, and the argument its
 * first parameter receives: `fn(a)`, `new Fn(a)`, and `Fn.call(this, a)`, the
 * SFRA inheritance idiom. Only a function whose body is in the project (not
 * one a declaration file describes) does anything worth following.
 */
function argumentReceiver(
  ctx: InferenceContext,
  call: tsserver.CallExpression | tsserver.NewExpression,
): {readonly fn: tsserver.FunctionLikeDeclaration; readonly firstArgument: number} | undefined {
  const {ts, checker} = ctx;
  const callee = call.expression;
  const borrowed = ts.isCallExpression(call) && ts.isPropertyAccessExpression(callee) && callee.name.text === 'call';
  const fn = borrowed
    ? checker.getTypeAtLocation(callee.expression).getCallSignatures()[0]?.getDeclaration()
    : resolveCalleeDeclaration(ctx, call);
  const hasBody = fn !== undefined && (fn as tsserver.FunctionLikeDeclaration).body !== undefined;
  return hasBody ? {fn: fn as tsserver.FunctionLikeDeclaration, firstArgument: borrowed ? 1 : 0} : undefined;
}

/**
 * The parameter of a project function that receives `value` as an argument:
 * `Model` of `createRefinement(search, definition, Model)`, or
 * `refinementValue` of `new BooleanAttributeValue(search, definition,
 * refinementValue)`.
 */
export function receivingParameter(
  ctx: InferenceContext,
  value: tsserver.Node,
): tsserver.ParameterDeclaration | undefined {
  const {ts} = ctx;
  const call = value.parent;
  if (!ts.isCallExpression(call) && !ts.isNewExpression(call)) return undefined;
  const index = call.arguments?.indexOf(value as tsserver.Expression) ?? -1;
  const receiver = index >= 0 ? argumentReceiver(ctx, call) : undefined;
  const parameter = receiver?.fn.parameters[index - receiver.firstArgument];
  return parameter && !parameter.dotDotDotToken && ts.isIdentifier(parameter.name) ? parameter : undefined;
}

/** The function `value` is the result of: `return value;`, or an arrow function's expression body. */
function returningFunction(ts: typeof tsserver, value: tsserver.Node): tsserver.SignatureDeclaration | undefined {
  const parent = value.parent;
  if (ts.isArrowFunction(parent)) return parent.body === value ? parent : undefined;
  return ts.isReturnStatement(parent) ? enclosingFunction(parent, ts) : undefined;
}

/** The next name holding `value` in `role`: a binding, an assignment target, or the parameter it is passed to. */
function heldBy(ctx: InferenceContext, value: tsserver.Node, role: ValueRole): ReferenceTarget | undefined {
  const name =
    bindingNameOf(ctx.ts, value) ?? (receivingParameter(ctx, value)?.name as tsserver.Identifier | undefined);
  return name && {kind: 'name', name, role};
}

/** A function returning `value` is a factory of it: its calls evaluate to `value`. */
function returnedBy(ctx: InferenceContext, value: tsserver.Node): ReferenceTarget | undefined {
  const factory = returningFunction(ctx.ts, value);
  const name = factory && getReferenceNameNode(factory, ctx.ts);
  return name && {kind: 'name', name, role: 'factory'};
}

/** The call `value` is an argument of, as a {@link Handoff}: what {@link receivingParameter} leaves over. */
function handedOff(ctx: InferenceContext, value: tsserver.Node): ReferenceTarget | undefined {
  const call = value.parent;
  if (!ctx.ts.isCallExpression(call)) return undefined;
  const argIndex = call.arguments.indexOf(value as tsserver.Expression);
  return argIndex >= 0 ? {kind: 'handoff', handoff: {call, argIndex}} : undefined;
}

/**
 * Where one reference to the function leads. In the `value` role the
 * reference is the function itself: a call invoking it
 * (`helper(x)`, `new Helper(x)`, `Helper.call(this, x)`,
 * `require('./helper')(x)`) is a call site; a binding, an assignment, an
 * argument a project function receives or a `return` leads on to the next
 * name holding it; any other argument is a handoff. In the
 * `factory` role the reference names a function returning it, so a call of
 * that reference evaluates to the function and is followed as a value in
 * turn.
 */
export function valueTarget(
  ctx: InferenceContext,
  reference: tsserver.Node,
  role: ValueRole,
): ReferenceTarget | undefined {
  const {ts} = ctx;
  const value = outermostValue(ts, requireCallOf(reference, ts) ?? accessOf(reference, ts));
  if (role === 'factory') {
    const call = value.parent;
    const invoked = ts.isCallExpression(call) && call.expression === value;
    return invoked ? valueTarget(ctx, call, 'value') : heldBy(ctx, value, 'factory');
  }
  const call = directCall(value, ts) ?? borrowedCall(value, ts);
  if (call) return {kind: 'call', call};
  return heldBy(ctx, value, 'value') ?? returnedBy(ctx, value) ?? handedOff(ctx, value);
}
