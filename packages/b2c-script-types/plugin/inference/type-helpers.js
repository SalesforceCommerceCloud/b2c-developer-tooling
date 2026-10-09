"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAnyType = isAnyType;
exports.isOpenForUsageInference = isOpenForUsageInference;
exports.informativeParts = informativeParts;
exports.typeDisplayString = typeDisplayString;
exports.dedupeTypes = dedupeTypes;
exports.dedupeKnownTypes = dedupeKnownTypes;
exports.getMemberOfType = getMemberOfType;
exports.hasAllMembers = hasAllMembers;
exports.elementTypeOf = elementTypeOf;
exports.arrayTypeOf = arrayTypeOf;
exports.describeTypes = describeTypes;
exports.inferredCompletionEntry = inferredCompletionEntry;
exports.typesToCompletionEntries = typesToCompletionEntries;
const constants_1 = require("./constants");
/** True when `type` is (or includes) `any` — the signal that the checker gave up and usage inference should try to help. */
function isAnyType(ts, type) {
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
function isOpenForUsageInference(ts, type) {
    if (isAnyType(ts, type))
        return true;
    if (type.flags & ts.TypeFlags.NonPrimitive)
        return true;
    const symbol = type.getSymbol();
    if (symbol?.getName() === '__type' && type.getProperties().length === 0)
        return true;
    return symbol?.getName() === 'Object' && (type.flags & ts.TypeFlags.Object) !== 0;
}
// Type flags that never make a useful hover or completion candidate on their
// own: `null`/`undefined` (the empty branch of `x ? y : null`), `void`,
// `never`, `unknown`, and an unbound type parameter (`T` from a generic
// declaration nobody instantiated).
function uninformativeFlags(ts) {
    return (ts.TypeFlags.Any |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.Never |
        ts.TypeFlags.Void |
        ts.TypeFlags.Undefined |
        ts.TypeFlags.Null |
        ts.TypeFlags.TypeParameter);
}
/** An object type with no members and no signatures: the `{}` of `options || {}`. */
function isEmptyObjectType(ts, checker, type) {
    return ((type.flags & ts.TypeFlags.Object) !== 0 &&
        checker.getPropertiesOfType(type).length === 0 &&
        type.getCallSignatures().length === 0 &&
        type.getConstructSignatures().length === 0 &&
        checker.getIndexInfosOfType(type).length === 0);
}
/**
 * True when `type` tells a reader something: not one of the
 * {@link uninformativeFlags} kinds, not open for inference (see
 * {@link isOpenForUsageInference}), not an empty object, and — for an array —
 * an array of something informative (`any[]`, `T[]` and `undefined[]` are as
 * empty as `any`).
 */
function isInformativeType(ts, checker, type) {
    if (type.flags & uninformativeFlags(ts))
        return false;
    if (isOpenForUsageInference(ts, type) || isEmptyObjectType(ts, checker, type))
        return false;
    if (!checker.isArrayType(type))
        return true;
    const [element] = checker.getTypeArguments(type);
    return element !== undefined && isInformativeType(ts, checker, element);
}
/**
 * Splits `type` into the parts worth showing: union members are considered
 * one by one (so `Product | null` keeps `Product`), literals are widened to
 * their primitive (`"a" | "b"` reads as `string`), and every
 * non-informative part is dropped.
 */
function informativeParts(ctx, type) {
    const { ts, checker } = ctx;
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
function hasOnlyDefaultTypeArguments(ts, checker, type) {
    if (!(type.flags & ts.TypeFlags.Object))
        return true;
    if (!(type.objectFlags & ts.ObjectFlags.Reference))
        return true;
    const reference = type;
    const parameters = reference.target.typeParameters ?? [];
    return checker.getTypeArguments(reference).every((argument, index) => {
        if (argument.flags & (ts.TypeFlags.TypeParameter | ts.TypeFlags.Any))
            return true;
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
function classDisplayName(checker, symbol) {
    return checker
        .getFullyQualifiedName(symbol)
        .replace(/^global\./, '')
        .replace(/^"[^"]*"\./, '');
}
/**
 * Renders a candidate type for hover text and dedupe keys. A class or
 * interface instantiated only with default type arguments reads as the bare
 * class name (`Product`, `LineItemCtnr`); one with real type arguments
 * renders them the same way (`Collection<Product>`, not the checker's
 * `Collection<Product<Product>>`), and an array reads as its element's
 * display (`Product[]`). Everything else — primitives, object literals, lib
 * types — is rendered by the checker as TypeScript itself would.
 */
function computeTypeDisplayString(ts, checker, type) {
    if (checker.isArrayType(type)) {
        const [element] = checker.getTypeArguments(type);
        const display = element ? computeTypeDisplayString(ts, checker, element) : 'any';
        return element?.isUnion() ? `(${display})[]` : `${display}[]`;
    }
    const symbol = type.getSymbol();
    const isClassOrInterface = symbol !== undefined && (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) !== 0;
    if (!isClassOrInterface)
        return checker.typeToString(type);
    if (hasOnlyDefaultTypeArguments(ts, checker, type))
        return classDisplayName(checker, symbol);
    const typeArguments = checker
        .getTypeArguments(type)
        .map((argument) => computeTypeDisplayString(ts, checker, argument));
    return `${classDisplayName(checker, symbol)}<${typeArguments.join(', ')}>`;
}
/** computeTypeDisplayString() memoized per request — see InferenceContext.typeDisplayStrings. */
function typeDisplayString(ctx, type) {
    const cached = ctx.typeDisplayStrings.get(type);
    if (cached !== undefined)
        return cached;
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
function dedupeTypes(ctx, types) {
    const seen = new Set();
    return types.filter((type) => {
        const key = typeDisplayString(ctx, type);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
/** The distinct types among `types` that say something: {@link dedupeTypes} without `any`. */
function dedupeKnownTypes(ctx, types) {
    return dedupeTypes(ctx, types.filter((type) => !isAnyType(ctx.ts, type)));
}
/**
 * Strips any nullable part from `type` and computes its apparent type before
 * a member lookup. `getPropertyOfType` on a union only returns members common
 * to *every* constituent, so an un-stripped `Product | null` (the shape of
 * `ProductMgr.getProduct()`) would never resolve any member; the apparent
 * type also exposes a primitive's wrapper-object members (`.length`).
 */
function getNonNullableApparentType(checker, type) {
    return checker.getApparentType(checker.getNonNullableType(type));
}
/** Looks up a member by name on `type`'s non-nullable apparent type — see {@link getNonNullableApparentType}. */
function getMemberOfType(checker, type, name) {
    return checker.getPropertyOfType(getNonNullableApparentType(checker, type), name);
}
/** True when `type` exposes every member name in `memberNames` (vacuously true for none). */
function hasAllMembers(checker, type, memberNames) {
    for (const name of memberNames) {
        if (!getMemberOfType(checker, type, name))
            return false;
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
function collectionElementType(ctx, type, location) {
    const { ts, checker } = ctx;
    const firstCallReturn = (t, memberName) => {
        const sym = getMemberOfType(checker, t, memberName);
        if (!sym)
            return undefined;
        const [signature] = checker.getTypeOfSymbolAtLocation(sym, location).getCallSignatures();
        return signature && checker.getReturnTypeOfSignature(signature);
    };
    const iteratorType = firstCallReturn(type, 'iterator') ?? type;
    const element = firstCallReturn(iteratorType, 'next');
    if (!element || isAnyType(ts, element))
        return undefined;
    if (element.flags & (ts.TypeFlags.Void | ts.TypeFlags.Unknown | ts.TypeFlags.Never))
        return undefined;
    return element;
}
/**
 * The element type of an array (`ProductLineItem[]`) or of a Script API
 * collection or iterator (see {@link collectionElementType}): what `x[i]`,
 * `x.pop()` or a `forEach` callback over `x` sees.
 */
function elementTypeOf(ctx, type, location) {
    const { checker } = ctx;
    if (checker.isArrayType(type))
        return checker.getTypeArguments(type)[0];
    return collectionElementType(ctx, type, location);
}
/**
 * `element[]`, built by the checker itself so an inferred array reads, and
 * resolves members (`filter`, `[0]`, `forEach`), exactly like a declared one.
 * The factory is internal to TypeScript, so it is feature-detected: a
 * TypeScript without it leaves inferred arrays silent rather than wrong.
 */
function arrayTypeOf(ctx, element) {
    const factory = ctx.checker;
    return typeof factory.createArrayType === 'function' ? factory.createArrayType(element) : undefined;
}
/** Renders candidate types as hover text, e.g. `"Product | Category"`. */
function describeTypes(ctx, types) {
    return [...new Set(types.map((type) => typeDisplayString(ctx, type)))].join(' | ');
}
/**
 * One synthesized member completion. `sortText` '11' mirrors TS's own
 * SortText.LocationPriority — the rank ordinary resolved members get — so
 * inferred members sort alongside real ones rather than above or below them.
 */
function inferredCompletionEntry(ts, name, isMethod) {
    return {
        name,
        kind: isMethod ? ts.ScriptElementKind.memberFunctionElement : ts.ScriptElementKind.memberVariableElement,
        kindModifiers: '',
        sortText: '11',
        source: constants_1.INFERRED_COMPLETION_SOURCE,
    };
}
/** Synthesizes completion entries for candidate types' members, deduplicated by property name. */
function typesToCompletionEntries(ts, checker, types) {
    const seen = new Set();
    const entries = [];
    for (const type of types) {
        for (const sym of checker.getPropertiesOfType(getNonNullableApparentType(checker, type))) {
            const name = sym.getName();
            if (seen.has(name))
                continue;
            seen.add(name);
            entries.push(inferredCompletionEntry(ts, name, (sym.flags & ts.SymbolFlags.Method) !== 0));
        }
    }
    return entries;
}
