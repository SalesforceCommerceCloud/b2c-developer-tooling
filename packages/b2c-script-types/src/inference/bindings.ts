/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Call-specific bindings. What a generic helper returns can depend on what one
// call passes it: SFRA's `collections.find(collection, match)` returns an
// element of `collection`, a Shipment for `basket.shipments` and a
// ProductLineItem for `basket.productLineItems`. Across all of its callers
// the helper's return says nothing, so ./core infers it once more for the call
// being resolved, with the helper's parameters bound to that call's
// arguments. A callback argument is bound too: `collections.map(collection,
// callback)` pushes what `callback(item)` returns, which is what the function
// this call passes returns for that item. Neither IntelliJ nor the checker
// substitutes arguments into an undocumented JavaScript function this way.

import type tsserver from 'typescript/lib/tsserverlibrary';

import type {InferenceContext} from './context';
import {valueDeclarationOf} from './member-values';
import {functionOf} from './signatures';
import {isAnyType} from './type-helpers';

/** One parameter bound to the argument a single call passes it. */
export interface ArgumentBinding {
  readonly argument: tsserver.Expression;
  /** The depth of the call, which the argument is resolved at. */
  readonly depth: number;
  /** The bindings in force where the call is written, which the argument is resolved under. */
  readonly outer: Bindings;
  /** The argument's types, resolved on first use. */
  resolved?: tsserver.Type[];
}

export type Bindings = ReadonlyMap<tsserver.ParameterDeclaration, ArgumentBinding>;

/** No parameter bound: what every inference outside a call-specific retry runs with. */
export const NO_BINDINGS: Bindings = new Map();

/** Runs `compute` with `bindings` in force, restoring the previous ones afterwards. */
export function withBindings<T>(ctx: InferenceContext, bindings: Bindings, compute: () => T): T {
  const previous = ctx.bindings;
  ctx.bindings = bindings;
  try {
    return compute();
  } finally {
    ctx.bindings = previous;
  }
}

/** A function a bound parameter holds, called with `args` (`callback(item)`, `callback.call(scope, item)`). */
export interface BoundCallback {
  readonly fn: tsserver.SignatureDeclaration;
  readonly args: readonly tsserver.Expression[];
}

/**
 * `fn`'s plain parameters bound to the arguments `args` of one call, on top of
 * the bindings already in force (a helper nested in a bound function still
 * sees its parameters). Arguments after a spread, rest parameters and
 * destructured parameters are left unbound; `undefined` when nothing binds.
 */
export function argumentBindings(
  ctx: InferenceContext,
  fn: tsserver.SignatureDeclaration,
  args: readonly tsserver.Expression[],
  depth: number,
): Bindings | undefined {
  const {ts} = ctx;
  const outer = ctx.bindings;
  const bindings = new Map(outer);
  for (const [index, parameter] of fn.parameters.entries()) {
    const argument = args[index];
    if (!argument || ts.isSpreadElement(argument) || parameter.dotDotDotToken) break;
    if (ts.isIdentifier(parameter.name)) bindings.set(parameter, {argument, depth, outer});
  }
  return bindings.size > outer.size ? bindings : undefined;
}

/** The binding the parameter `expr` names has in the bindings in force. */
export function boundArgument(ctx: InferenceContext, expr: tsserver.Expression): ArgumentBinding | undefined {
  const {ts} = ctx;
  if (ctx.bindings.size === 0 || !ts.isIdentifier(expr)) return undefined;
  const declaration = valueDeclarationOf(ctx, expr);
  return declaration && ts.isParameter(declaration) ? ctx.bindings.get(declaration) : undefined;
}

/**
 * The function the bound parameter `expr` holds: the function its argument
 * is or names, followed through parameters each enclosing call passes on as
 * is (`function mapAll(items, fn) { return collections.map(items, fn); }`).
 * Each step moves to the bindings in force where that call was written,
 * which hold fewer parameters, so the walk ends.
 */
function boundFunction(ctx: InferenceContext, expr: tsserver.Expression): tsserver.SignatureDeclaration | undefined {
  let binding = boundArgument(ctx, expr);
  while (binding) {
    const fn = functionOf(ctx, binding.argument);
    if (fn) return fn;
    const {argument, outer} = binding;
    binding = withBindings(ctx, outer, () => boundArgument(ctx, argument));
  }
  return undefined;
}

/**
 * `call` read as a call of the function a bound parameter holds, with the
 * arguments that function receives: `callback(item)`, or `callback.call(scope,
 * item)` without its `this` argument. A `callback.apply(scope, args)` call
 * binds none of them.
 */
export function boundCallback(ctx: InferenceContext, call: tsserver.CallExpression): BoundCallback | undefined {
  const {ts} = ctx;
  const callee = call.expression;
  const borrowed = ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;
  if (borrowed !== undefined && borrowed !== 'call' && borrowed !== 'apply') return undefined;
  const fn = boundFunction(ctx, ts.isPropertyAccessExpression(callee) ? callee.expression : callee);
  if (!fn) return undefined;
  if (borrowed === 'apply') return {fn, args: []};
  return {fn, args: borrowed === 'call' ? call.arguments.slice(1) : call.arguments};
}

/** True when `type` instantiates a generic with `any` (`Collection<any>` of a bare `{dw.util.Collection}`). */
export function hasAnyTypeArgument(ctx: InferenceContext, type: tsserver.Type): boolean {
  const {ts, checker} = ctx;
  if (!(type.flags & ts.TypeFlags.Object)) return false;
  if (!((type as tsserver.ObjectType).objectFlags & ts.ObjectFlags.Reference)) return false;
  return checker.getTypeArguments(type as tsserver.TypeReference).some((argument) => isAnyType(ts, argument));
}

/**
 * True when `types`, recovered for one call, may stand in for the `general`
 * types the checker gives the same expression without it: when those say
 * nothing, or when every recovered type is assignable to one of them
 * (`Collection<Shipment>` for a parameter declared `{dw.util.Collection}`).
 * Anything else is left alone, and TypeScript builds without the public
 * `isTypeAssignableTo` never narrow a type that says something.
 */
export function narrows(
  ctx: InferenceContext,
  general: readonly tsserver.Type[],
  types: readonly tsserver.Type[],
): boolean {
  const {checker} = ctx;
  if (types.length === 0) return false;
  if (general.length === 0) return true;
  if (typeof checker.isTypeAssignableTo !== 'function') return false;
  return types.every((type) => general.some((part) => checker.isTypeAssignableTo(type, part)));
}
