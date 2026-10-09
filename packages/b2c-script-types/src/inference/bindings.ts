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
// arguments. Neither IntelliJ nor the checker substitutes arguments into an
// undocumented JavaScript function this way.

import type tsserver from 'typescript/lib/tsserverlibrary';

import type {InferenceContext} from './context';
import {valueDeclarationOf} from './member-values';
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

/**
 * `fn`'s plain parameters bound to the arguments `call` passes them, on top of
 * the bindings already in force (a helper nested in a bound function still
 * sees its parameters). Arguments after a spread, rest parameters and
 * destructured parameters are left unbound; `undefined` when nothing binds.
 */
export function argumentBindings(
  ctx: InferenceContext,
  fn: tsserver.SignatureDeclaration,
  call: tsserver.CallExpression,
  depth: number,
): Bindings | undefined {
  const {ts} = ctx;
  const outer = ctx.bindings;
  const bindings = new Map(outer);
  for (const [index, parameter] of fn.parameters.entries()) {
    const argument = call.arguments[index];
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

/** True when `type` instantiates a generic with `any` (`Collection<any>` of a bare `{dw.util.Collection}`). */
export function hasAnyTypeArgument(ctx: InferenceContext, type: tsserver.Type): boolean {
  const {ts, checker} = ctx;
  if (!(type.flags & ts.TypeFlags.Object)) return false;
  if (!((type as tsserver.ObjectType).objectFlags & ts.ObjectFlags.Reference)) return false;
  return checker.getTypeArguments(type as tsserver.TypeReference).some((argument) => isAnyType(ts, argument));
}

/**
 * True when `types`, recovered for one call, may stand in for the `general`
 * types the same expression has without it: when those say nothing, or when
 * every recovered type is assignable to one of them (`Collection<Shipment>`
 * for a parameter declared `{dw.util.Collection}`; `Shipment` out of a
 * helper returning `Shipment | ProductLineItem` across its callers).
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
