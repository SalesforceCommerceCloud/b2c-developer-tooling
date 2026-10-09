/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Generic Script API functions whose result is one of their arguments:
// `Transaction.wrap<T>(callback: () => T): T` returns what its callback
// returns. A JavaScript callback returning an undocumented value instantiates
// `T` to `any`, so the checker's result says nothing; the declaration still
// says where `T` comes from, and ./core resolves that argument instead.

import type tsserver from 'typescript/lib/tsserverlibrary';

import type {InferenceContext} from './context';
import {functionOf} from './signatures';

/** Where a generic call's result comes from: an argument itself, or what a function argument returns. */
export type GenericResultSource =
  | {readonly kind: 'value'; readonly argument: tsserver.Expression}
  | {readonly kind: 'return'; readonly fn: tsserver.SignatureDeclaration};

/** True when `node` is a bare reference to the type parameter `name` (`T`). */
function isTypeParameterReference(ts: typeof tsserver, node: tsserver.TypeNode | undefined, name: string): boolean {
  return (
    node !== undefined &&
    ts.isTypeReferenceNode(node) &&
    ts.isIdentifier(node.typeName) &&
    node.typeName.text === name &&
    node.typeArguments === undefined
  );
}

/** The type parameter a generic declaration returns as is (`T` of `wrap<T>(...): T`). */
function returnedTypeParameter(ts: typeof tsserver, declaration: tsserver.SignatureDeclaration): string | undefined {
  const result = declaration.type;
  const name = result && ts.isTypeReferenceNode(result) && ts.isIdentifier(result.typeName) && result.typeName.text;
  return name && declaration.typeParameters?.some((parameter) => parameter.name.text === name) ? name : undefined;
}

/**
 * Where `call`'s result comes from when its callee's declaration returns a
 * type parameter it takes as an argument (`identity<T>(value: T): T`) or as
 * a callback's result (`wrap<T>(callback: () => T): T`).
 */
export function genericResultSource(
  ctx: InferenceContext,
  call: tsserver.CallExpression,
): GenericResultSource | undefined {
  const {ts, checker} = ctx;
  const declaration = checker.getResolvedSignature(call)?.declaration;
  if (!declaration || ts.isJSDocSignature(declaration)) return undefined;
  const typeParameter = returnedTypeParameter(ts, declaration);
  if (!typeParameter) return undefined;
  for (const [index, parameter] of declaration.parameters.entries()) {
    const argument = call.arguments[index];
    const type = parameter.type;
    if (!argument || !type) continue;
    if (isTypeParameterReference(ts, type, typeParameter)) return {kind: 'value', argument};
    const fn = ts.isFunctionTypeNode(type) && isTypeParameterReference(ts, type.type, typeParameter);
    const callback = fn ? functionOf(ctx, argument) : undefined;
    if (callback) return {kind: 'return', fn: callback};
  }
  return undefined;
}
