/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Reading calls and their declared signatures: the function a call invokes,
// which overloads it can mean, and the type a declared callback hands its
// parameters. An inferred receiver
// (`items` built by `items.push(lineItem)`) gets no contextual typing from the
// checker, so `items.filter(function (item) {...})` leaves `item` untyped;
// the method's own declaration on the inferred type still says what `item`
// is, exactly as IntelliJ reads it.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {ELEMENT_FIRST_CALLBACK_CALLEES} from './constants';
import type {InferenceContext} from './context';
import {typeDisplayString} from './type-helpers';

/**
 * Resolves the function-like declaration a call expression's callee refers
 * to, via its symbol or — as a fallback for shapes the symbol lookup misses
 * — the checker's resolved signature.
 */
export function resolveCalleeDeclaration(
  ctx: InferenceContext,
  call: tsserver.CallExpression | tsserver.NewExpression,
): tsserver.SignatureDeclaration | undefined {
  const {checker, ts} = ctx;
  const sym = checker.getSymbolAtLocation(call.expression);
  const decl = sym?.valueDeclaration ?? sym?.declarations?.[0];
  if (decl && ts.isFunctionLike(decl)) return decl;
  const sigDecl = checker.getResolvedSignature(call)?.declaration;
  return sigDecl && ts.isFunctionLike(sigDecl) ? sigDecl : undefined;
}

/** The function `value` is or names (`function () {...}`, `() => x`, a local function's identifier). */
export function functionOf(
  ctx: InferenceContext,
  value: tsserver.Expression,
): tsserver.SignatureDeclaration | undefined {
  const {ts, checker} = ctx;
  if (ts.isFunctionExpression(value) || ts.isArrowFunction(value)) return value;
  const declaration = ts.isIdentifier(value) ? checker.getSymbolAtLocation(value)?.valueDeclaration : undefined;
  return declaration && ts.isFunctionLike(declaration) ? declaration : undefined;
}

/** True when `call` invokes one of the {@link ELEMENT_FIRST_CALLBACK_CALLEES} (`collections.forEach(coll, fn)`). */
export function isElementFirstCallbackCall(ctx: InferenceContext, call: tsserver.CallExpression): boolean {
  const {ts} = ctx;
  const callee = ts.isPropertyAccessExpression(call.expression) ? call.expression.name : call.expression;
  return ts.isIdentifier(callee) && ELEMENT_FIRST_CALLBACK_CALLEES.has(callee.text);
}

/** True when `signature` takes `count` arguments (synthetic signatures without a declaration always do). */
export function acceptsArgumentCount(ctx: InferenceContext, signature: tsserver.Signature, count: number): boolean {
  const {ts, checker} = ctx;
  const declaration = signature.getDeclaration() as tsserver.SignatureDeclaration | undefined;
  if (!declaration) return true;
  const parameters = declaration.parameters;
  const required = parameters.filter((parameter) => !checker.isOptionalParameter(parameter)).length;
  return count >= required && (count <= parameters.length || ts.hasRestParameter(declaration));
}

/** The type `signature` gives parameter `paramIndex` of the callback it takes as argument `argIndex`. */
function callbackParameterType(
  ctx: InferenceContext,
  signature: tsserver.Signature,
  call: tsserver.CallExpression,
  argIndex: number,
  paramIndex: number,
): tsserver.Type | undefined {
  const {checker} = ctx;
  const parameter = signature.getParameters()[argIndex];
  const callbackType = parameter && checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(parameter, call));
  const callbackParameter = callbackType?.getCallSignatures()[0]?.getParameters()[paramIndex];
  return callbackParameter && checker.getTypeOfSymbolAtLocation(callbackParameter, call);
}

/**
 * The types `methodTypes`' declared signatures give parameter `paramIndex`
 * of the callback `call` passes as argument `argIndex`: `value: T` of
 * `filter(predicate: (value: T, ...) => unknown)` on a `ProductLineItem[]`.
 * Overloads taking that many arguments must agree, so the accumulator of
 * `reduce(callback, initialValue)` (`T` or `U`, by overload) stays unknown.
 */
export function callbackParameterTypes(
  ctx: InferenceContext,
  methodTypes: readonly tsserver.Type[],
  call: tsserver.CallExpression,
  argIndex: number,
  paramIndex: number,
): tsserver.Type[] {
  return methodTypes.flatMap((methodType) => {
    const overloads = methodType
      .getCallSignatures()
      .filter((signature) => acceptsArgumentCount(ctx, signature, call.arguments.length));
    const [first, ...rest] = overloads.map((signature) =>
      callbackParameterType(ctx, signature, call, argIndex, paramIndex),
    );
    const key = first && typeDisplayString(ctx, first);
    return first && rest.every((type) => type && typeDisplayString(ctx, type) === key) ? [first] : [];
  });
}
