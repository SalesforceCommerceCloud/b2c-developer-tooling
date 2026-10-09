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
// is, exactly as IntelliJ reads it. A named function handed to a declared
// API (`server.get('Show', cache.applyDefaultCache)`) is not contextually
// typed either, and is read the same way.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {ELEMENT_FIRST_CALLBACK_CALLEES} from './constants';
import type {InferenceContext} from './context';
import {typeDisplayString} from './type-helpers';
import type {Handoff} from './value-flow';

/**
 * Resolves the function-like declaration a call expression's callee refers
 * to, via its symbol or — as a fallback for shapes the symbol lookup misses
 * (`var Model = require('./model'); new Model(x)`) — the signature the call
 * resolves to. Only a callee with several signatures needs the checker to
 * pick one, which checks every argument the call passes (callback bodies
 * included); a callee with one signature can only mean that one.
 */
export function resolveCalleeDeclaration(
  ctx: InferenceContext,
  call: tsserver.CallExpression | tsserver.NewExpression,
): tsserver.SignatureDeclaration | undefined {
  const {checker, ts} = ctx;
  const sym = checker.getSymbolAtLocation(call.expression);
  const decl = sym?.valueDeclaration ?? sym?.declarations?.[0];
  if (decl && ts.isFunctionLike(decl)) return decl;
  const signatures = calleeSignatures(ctx, call);
  const sigDecl = (signatures.length > 1 ? checker.getResolvedSignature(call) : signatures[0])?.declaration;
  return sigDecl && ts.isFunctionLike(sigDecl) ? sigDecl : undefined;
}

/**
 * The signatures `call` chooses from: a `new` call's construct signatures,
 * or the call signatures of a callee without any (a JS constructor
 * function, which `new` calls like any other function).
 */
function calleeSignatures(
  ctx: InferenceContext,
  call: tsserver.CallExpression | tsserver.NewExpression,
): readonly tsserver.Signature[] {
  const callee = ctx.checker.getTypeAtLocation(call.expression);
  const construct = ctx.ts.isNewExpression(call) ? callee.getConstructSignatures() : [];
  return construct.length > 0 ? construct : callee.getCallSignatures();
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

/**
 * The type `signature` gives the argument at `argIndex`: its parameter's
 * type, or for an argument a rest parameter collects (`...middleware:
 * Middleware[]`), the element type of that parameter's array.
 */
function argumentTypeAt(
  ctx: InferenceContext,
  signature: tsserver.Signature,
  argIndex: number,
  location: tsserver.Node,
): tsserver.Type | undefined {
  const {ts, checker} = ctx;
  const parameters = signature.getParameters();
  const last = parameters[parameters.length - 1];
  const rest =
    last?.valueDeclaration && ts.isParameter(last.valueDeclaration) && ts.isRestParameter(last.valueDeclaration);
  if (argIndex < parameters.length - (rest ? 1 : 0)) {
    return checker.getTypeOfSymbolAtLocation(parameters[argIndex], location);
  }
  return rest
    ? checker.getIndexTypeOfType(checker.getTypeOfSymbolAtLocation(last, location), ts.IndexKind.Number)
    : undefined;
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
  const callbackType = argumentTypeAt(ctx, signature, argIndex, call);
  const callbackParameter =
    callbackType && checker.getNonNullableType(callbackType).getCallSignatures()[0]?.getParameters()[paramIndex];
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

/**
 * What the callee of `handoff` declares it passes parameter `paramIndex` of
 * the function it is handed: `Request` for `req` of the middleware step in
 * `server.get('Show', cache.applyDefaultCache)`.
 */
export function handedOffParameterTypes(ctx: InferenceContext, handoff: Handoff, paramIndex: number): tsserver.Type[] {
  const callee = ctx.checker.getTypeAtLocation(handoff.call.expression);
  return callbackParameterTypes(ctx, [callee], handoff.call, handoff.argIndex, paramIndex);
}
