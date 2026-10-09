/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Helpers for working with the checker's Type objects: recognizing `any` and
// other types that carry no information, rendering a type the way a reader
// expects to see it, de-duplicating candidates by that rendering, reaching a
// type's real members (stripping nullability), pulling the element type out
// of a collection, and turning candidate types into completion entries.
// These are the "leaf" operations the recursive engine in ./core and the
// decision rules in ./policy build on.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {INFERRED_COMPLETION_SOURCE} from './constants';
import type {InferenceContext} from './context';

/** True when `type` is (or includes) `any` — the signal that the checker gave up and usage inference should try to help. */
export function isAnyType(ts: typeof tsserver, type: tsserver.Type): boolean {
  return (type.flags & ts.TypeFlags.Any) !== 0;
}

/**
 * True when the checker's type is too uninformative to prefer over usage
 * inference: `any`, the `object` non-primitive, an empty `{}` type literal, or
 * the global `Object` interface. Used as the hover/completion gate.
 *
 * Deliberately excludes named classes (even wrong ones like a mis-documented
 * `Request`) — those are strong enough that overriding them would fight both
 * TypeScript and IntelliJ's JSDoc-first model.
 *
 * `Object` is what checkJs resolves the ubiquitous SFRA `@param {Object}`
 * placeholder to (capital-O, distinct from the lowercase `object`
 * non-primitive and from `{*}`/`{}`/`{obj}`, which widen to `any` or an empty
 * type). It carries no Script API information, so a value typed as bare
 * `Object` is effectively undocumented — exactly the case usage inference
 * exists for. No dw.* class is named plain `Object`, so keying on the name
 * can't shadow a real Script API type.
 */
export function isOpenForUsageInference(ts: typeof tsserver, type: tsserver.Type): boolean {
  if (isAnyType(ts, type)) return true;
  if (type.flags & ts.TypeFlags.NonPrimitive) return true;
  const symbol = type.getSymbol();
  if (symbol?.getName() === '__type' && type.getProperties().length === 0) return true;
  return symbol?.getName() === 'Object' && (type.flags & ts.TypeFlags.Object) !== 0;
}

// Type flags that never make a useful hover or completion candidate on their
// own: `null`/`undefined` (the empty branch of `x ? y : null`), `void`,
// `never`, `unknown`, and an unbound type parameter (`T` from a generic
// declaration nobody instantiated).
function uninformativeFlags(ts: typeof tsserver): number {
  return (
    ts.TypeFlags.Any |
    ts.TypeFlags.Unknown |
    ts.TypeFlags.Never |
    ts.TypeFlags.Void |
    ts.TypeFlags.Undefined |
    ts.TypeFlags.Null |
    ts.TypeFlags.TypeParameter
  );
}

/** An object type with no members and no signatures: the `{}` of `options || {}`. */
function isEmptyObjectType(ts: typeof tsserver, checker: tsserver.TypeChecker, type: tsserver.Type): boolean {
  return (
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    checker.getPropertiesOfType(type).length === 0 &&
    type.getCallSignatures().length === 0 &&
    type.getConstructSignatures().length === 0 &&
    checker.getIndexInfosOfType(type).length === 0
  );
}

/**
 * True when `type` tells a reader something: not one of the
 * {@link uninformativeFlags} kinds, not open for inference (see
 * {@link isOpenForUsageInference}), not an empty object, and — for an array —
 * an array of something informative (`any[]`, `T[]` and `undefined[]` are as
 * empty as `any`).
 */
function isInformativeType(ts: typeof tsserver, checker: tsserver.TypeChecker, type: tsserver.Type): boolean {
  if (type.flags & uninformativeFlags(ts)) return false;
  if (isOpenForUsageInference(ts, type) || isEmptyObjectType(ts, checker, type)) return false;
  if (!checker.isArrayType(type)) return true;
  const [element] = checker.getTypeArguments(type as tsserver.TypeReference);
  return element !== undefined && isInformativeType(ts, checker, element);
}

/**
 * Splits `type` into the parts worth showing: union members are considered
 * one by one (so `Product | null` keeps `Product`), literals are widened to
 * their primitive (`"a" | "b"` reads as `string`), and every
 * non-informative part is dropped.
 */
export function informativeParts(ctx: InferenceContext, type: tsserver.Type): tsserver.Type[] {
  const {ts, checker} = ctx;
  const parts = type.isUnion() ? type.types : [type];
  return parts
    .map((part) => checker.getBaseTypeOfLiteralType(part))
    .filter((part) => isInformativeType(ts, checker, part));
}

/**
 * True when a generic instantiation's type arguments add nothing a reader
 * needs: each one is still an unbound type parameter (the declared type of
 * `Product<T>`, as ambient matching produces it), `any`, or exactly the
 * parameter's declared default (`Product<ICustomAttributes.Product>`).
 */
function hasOnlyDefaultTypeArguments(ts: typeof tsserver, checker: tsserver.TypeChecker, type: tsserver.Type): boolean {
  if (!(type.flags & ts.TypeFlags.Object)) return true;
  if (!((type as tsserver.ObjectType).objectFlags & ts.ObjectFlags.Reference)) return true;
  const reference = type as tsserver.TypeReference;
  const parameters = reference.target.typeParameters ?? [];
  return checker.getTypeArguments(reference).every((argument, index) => {
    if (argument.flags & (ts.TypeFlags.TypeParameter | ts.TypeFlags.Any)) return true;
    const parameter = parameters[index];
    return parameter !== undefined && checker.getDefaultFromTypeParameter(parameter) === argument;
  });
}

/**
 * The name a reader knows a class or interface by. Usually its own name; a
 * declaration nested in a namespace keeps the namespace (the vendored
 * `ICustomAttributes.Shipment`, the type of `shipment.custom`, must not read
 * as the unrelated `Shipment` class). The `global.` wrapper of
 * `declare global` and a quoted ambient-module prefix
 * (`"server/server".Response`) are implementation details and are dropped.
 */
function classDisplayName(checker: tsserver.TypeChecker, symbol: tsserver.Symbol): string {
  return checker
    .getFullyQualifiedName(symbol)
    .replace(/^global\./, '')
    .replace(/^"[^"]*"\./, '');
}

/**
 * Renders a candidate type for hover text and dedupe keys. A class or
 * interface instantiated only with default type arguments reads as the bare
 * class name (`Product`, `LineItemCtnr`); everything else — real generic
 * arguments (`Collection<Variant>`), primitives, object literals, lib types —
 * is rendered by the checker as TypeScript itself would.
 */
function computeTypeDisplayString(ts: typeof tsserver, checker: tsserver.TypeChecker, type: tsserver.Type): string {
  const symbol = type.getSymbol();
  const isClassOrInterface =
    symbol !== undefined && (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) !== 0;
  if (isClassOrInterface && hasOnlyDefaultTypeArguments(ts, checker, type)) return classDisplayName(checker, symbol);
  return checker.typeToString(type);
}

/** computeTypeDisplayString() memoized per request — see InferenceContext.typeDisplayStrings. */
export function typeDisplayString(ctx: InferenceContext, type: tsserver.Type): string {
  const cached = ctx.typeDisplayStrings.get(type);
  if (cached !== undefined) return cached;
  const display = computeTypeDisplayString(ctx.ts, ctx.checker, type);
  ctx.typeDisplayStrings.set(type, display);
  return display;
}

/**
 * Deduplicates candidate types by their display string. Two distinct types
 * that render identically (`Product<A>` and `Product<B>` both read as
 * `Product`) collapse into one — acceptable because every consumer of the
 * result is display-oriented (hover text, completion-member names).
 */
export function dedupeTypes(ctx: InferenceContext, types: readonly tsserver.Type[]): tsserver.Type[] {
  const seen = new Set<string>();
  return types.filter((type) => {
    const key = typeDisplayString(ctx, type);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Strips any nullable part from `type` and computes its apparent type before
 * a member lookup. `getPropertyOfType` on a union only returns members common
 * to *every* constituent, so an un-stripped `Product | null` (the shape of
 * `ProductMgr.getProduct()`) would never resolve any member; the apparent
 * type also exposes a primitive's wrapper-object members (`.length`).
 */
function getNonNullableApparentType(checker: tsserver.TypeChecker, type: tsserver.Type): tsserver.Type {
  return checker.getApparentType(checker.getNonNullableType(type));
}

/** Looks up a member by name on `type`'s non-nullable apparent type — see {@link getNonNullableApparentType}. */
export function getMemberOfType(
  checker: tsserver.TypeChecker,
  type: tsserver.Type,
  name: string,
): tsserver.Symbol | undefined {
  return checker.getPropertyOfType(getNonNullableApparentType(checker, type), name);
}

/** True when `type` exposes every member name in `memberNames` (vacuously true for none). */
export function hasAllMembers(
  checker: tsserver.TypeChecker,
  type: tsserver.Type,
  memberNames: ReadonlySet<string>,
): boolean {
  for (const name of memberNames) {
    if (!getMemberOfType(checker, type, name)) return false;
  }
  return true;
}

/**
 * Extracts the element type from a collection-like `type`: something with an
 * `iterator()` method whose result has a typed `next()` (dw.util.Collection
 * and friends), or something that is itself such an iterator. Returns
 * `undefined` when `type` doesn't look like a collection or its element type
 * is unknown — never `any`.
 *
 * @param location - any node in the file where the type is being used;
 * required by getTypeOfSymbolAtLocation to resolve member types.
 */
export function collectionElementType(
  ctx: InferenceContext,
  type: tsserver.Type,
  location: tsserver.Node,
): tsserver.Type | undefined {
  const {ts, checker} = ctx;
  const firstCallReturn = (t: tsserver.Type, memberName: string): tsserver.Type | undefined => {
    const sym = getMemberOfType(checker, t, memberName);
    if (!sym) return undefined;
    const [signature] = checker.getTypeOfSymbolAtLocation(sym, location).getCallSignatures();
    return signature && checker.getReturnTypeOfSignature(signature);
  };
  const iteratorType = firstCallReturn(type, 'iterator') ?? type;
  const element = firstCallReturn(iteratorType, 'next');
  if (!element || isAnyType(ts, element)) return undefined;
  if (element.flags & (ts.TypeFlags.Void | ts.TypeFlags.Unknown | ts.TypeFlags.Never)) return undefined;
  return element;
}

/** Renders candidate types as hover text, e.g. `"Product | Category"`. */
export function describeTypes(ctx: InferenceContext, types: readonly tsserver.Type[]): string {
  return [...new Set(types.map((type) => typeDisplayString(ctx, type)))].join(' | ');
}

/**
 * One synthesized member completion. `sortText` '11' mirrors TS's own
 * SortText.LocationPriority — the rank ordinary resolved members get — so
 * inferred members sort alongside real ones rather than above or below them.
 */
export function inferredCompletionEntry(
  ts: typeof tsserver,
  name: string,
  isMethod: boolean,
): tsserver.CompletionEntry {
  return {
    name,
    kind: isMethod ? ts.ScriptElementKind.memberFunctionElement : ts.ScriptElementKind.memberVariableElement,
    kindModifiers: '',
    sortText: '11',
    source: INFERRED_COMPLETION_SOURCE,
  };
}

/** Synthesizes completion entries for candidate types' members, deduplicated by property name. */
export function typesToCompletionEntries(
  ts: typeof tsserver,
  checker: tsserver.TypeChecker,
  types: readonly tsserver.Type[],
): tsserver.CompletionEntry[] {
  const seen = new Set<string>();
  const entries: tsserver.CompletionEntry[] = [];
  for (const type of types) {
    for (const sym of checker.getPropertiesOfType(getNonNullableApparentType(checker, type))) {
      const name = sym.getName();
      if (seen.has(name)) continue;
      seen.add(name);
      entries.push(inferredCompletionEntry(ts, name, (sym.flags & ts.SymbolFlags.Method) !== 0));
    }
  }
  return entries;
}
