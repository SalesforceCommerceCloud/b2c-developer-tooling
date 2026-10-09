/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// What a project helper hands the callback it is passed. SFRA's
// `collections.reduce(collection, function (total, item) {...})` calls its
// callback as `callback(value, item, index, collection)`, so the callback's
// second parameter is whatever `item` is: an element of the collection one
// call passes. Reading the helper's own calls of its callback parameter,
// rather than assuming an element-first shape from the helper's name, types
// the callbacks of any helper a project defines
// (`eachShipment(basket, function (shipment) {...})`), whichever parameter
// receives what. ./core resolves the arguments found here with the helper's
// parameters bound to the call (see ./bindings).

import type tsserver from 'typescript/lib/tsserverlibrary';

import {invocationOf} from './ast-helpers';
import type {InferenceContext} from './context';

/** A call a helper hands its callback on to, as argument `argIndex`. */
export interface ForwardedCallback {
  readonly call: tsserver.CallExpression;
  readonly argIndex: number;
}

/** How a helper's body uses the callback parameter it is passed. */
export interface CallbackUses {
  /** What the helper passes as the callback's parameter, one argument per call of the callback. */
  readonly passed: readonly tsserver.Expression[];
  /** Calls the helper hands the callback on to (`collections.map(items, fn)` in a wrapper). */
  readonly forwarded: readonly ForwardedCallback[];
}

/** A helper that never calls or hands on its callback. */
export const NO_CALLBACK_USES: CallbackUses = {passed: [], forwarded: []};

/**
 * True when `call`'s result is assigned back to the variable `argument`
 * names: an accumulator (`value = callback(value, item)`), which holds an
 * initial value, an element or the callback's own result, by call. Like the
 * accumulator of a native `reduce`, it stays unknown.
 */
function isFedBack(ctx: InferenceContext, call: tsserver.CallExpression, argument: tsserver.Expression): boolean {
  const {ts, checker} = ctx;
  const assignment = call.parent;
  const assigns =
    ts.isBinaryExpression(assignment) &&
    assignment.right === call &&
    assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isIdentifier(assignment.left);
  return (
    assigns &&
    ts.isIdentifier(argument) &&
    checker.getSymbolAtLocation(assignment.left) === checker.getSymbolAtLocation(argument)
  );
}

/**
 * How `helper` uses its parameter `callbackIndex`: the argument each call of
 * it (`callback(item)`, `callback.call(scope, item)`) passes as parameter
 * `paramIndex`, and the calls it is handed on to. Arguments after a spread
 * are not known by position and are left out, and so is an accumulator (see
 * {@link isFedBack}).
 */
export function callbackUses(
  ctx: InferenceContext,
  helper: tsserver.SignatureDeclaration,
  callbackIndex: number,
  paramIndex: number,
): CallbackUses {
  const {ts, checker} = ctx;
  const parameter = helper.parameters[callbackIndex];
  const body = (helper as tsserver.FunctionLikeDeclaration).body;
  if (!body || !parameter || parameter.dotDotDotToken || !ts.isIdentifier(parameter.name)) return NO_CALLBACK_USES;
  const {text} = parameter.name;
  const symbol = checker.getSymbolAtLocation(parameter.name);
  const namesCallback = (node: tsserver.Node): boolean =>
    ts.isIdentifier(node) && node.text === text && checker.getSymbolAtLocation(node) === symbol;
  const passed: tsserver.Expression[] = [];
  const forwarded: ForwardedCallback[] = [];
  const record = (call: tsserver.CallExpression): void => {
    const invocation = invocationOf(call, ts);
    if (invocation && namesCallback(invocation.callee)) {
      const argument = argumentAt(ts, invocation.args, paramIndex);
      if (argument && !isFedBack(ctx, call, argument)) passed.push(argument);
      return;
    }
    const argIndex = call.arguments.findIndex(namesCallback);
    if (argIndex >= 0) forwarded.push({call, argIndex});
  };
  const visit = (node: tsserver.Node): void => {
    if (ts.isCallExpression(node)) record(node);
    ts.forEachChild(node, visit);
  };
  visit(body);
  return {passed, forwarded};
}

/** The argument at `index`, unless a spread at or before it leaves its position unknown. */
function argumentAt(
  ts: typeof tsserver,
  args: readonly tsserver.Expression[],
  index: number,
): tsserver.Expression | undefined {
  const known = args.slice(0, index + 1);
  return known.length > index && !known.some((arg) => ts.isSpreadElement(arg)) ? known[index] : undefined;
}
