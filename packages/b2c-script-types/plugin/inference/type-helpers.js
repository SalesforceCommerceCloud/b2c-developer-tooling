"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAnyType = isAnyType;
exports.widenType = widenType;
exports.typeDisplayString = typeDisplayString;
exports.dedupeTypes = dedupeTypes;
exports.getNonNullableApparentType = getNonNullableApparentType;
exports.getMemberOfType = getMemberOfType;
exports.collectionElementType = collectionElementType;
exports.describeTypes = describeTypes;
exports.typesToCompletionEntries = typesToCompletionEntries;
const constants_1 = require("./constants");
/** True when `type` is (or includes) `any` — the signal that the checker gave up and usage inference should try to help. */
function isAnyType(ts, type) {
    return (type.flags & ts.TypeFlags.Any) !== 0;
}
/**
 * Widens a literal type (e.g. the string literal type of `"hello"`) to its
 * general primitive type, so hover text shows `string` rather than a union
 * of every literal argument ever passed to a helper.
 */
function widenType(checker, type) {
    return checker.getBaseTypeOfLiteralType(type);
}
/** checker.typeToString memoized per request — see InferenceContext.typeDisplayStrings. */
function typeDisplayString(ctx, type) {
    const cached = ctx.typeDisplayStrings.get(type);
    if (cached !== undefined)
        return cached;
    const str = ctx.checker.typeToString(type);
    ctx.typeDisplayStrings.set(type, str);
    return str;
}
/**
 * Deduplicates candidate types by their display string. Two distinct types
 * that happen to render identically (e.g. same-named classes from different
 * modules) collapse into one — acceptable here because every consumer of the
 * result is display-oriented (hover text, completion-member names).
 */
function dedupeTypes(ctx, types) {
    const seen = new Set();
    const out = [];
    for (const t of types) {
        const key = typeDisplayString(ctx, t);
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(t);
    }
    return out;
}
/**
 * Strips any nullable part from `type` and computes its apparent type — the
 * shared first step for every place in this file (and `typesToCompletionEntries`)
 * that walks a candidate type's members. `getPropertyOfType`/`getPropertiesOfType`
 * on a union only return members common to *every* constituent, and
 * `null`/`undefined` contribute none, so an un-stripped nullable candidate —
 * the common shape of an SFCC getter that can return nothing, e.g.
 * `ProductMgr.getProduct(): Product | null` — would otherwise never resolve
 * any member. `getApparentType` also picks up a primitive candidate's
 * wrapper-object members (.length, .toUpperCase(), etc.), which live there
 * rather than on the primitive type's own declared members.
 */
function getNonNullableApparentType(checker, type) {
    return checker.getApparentType(checker.getNonNullableType(type));
}
/** Looks up a member by name on `type`'s non-nullable apparent type — see {@link getNonNullableApparentType}. */
function getMemberOfType(checker, type, name) {
    return checker.getPropertyOfType(getNonNullableApparentType(checker, type), name);
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
        const sym = checker.getPropertyOfType(getNonNullableApparentType(checker, t), memberName);
        if (!sym)
            return undefined;
        const memberType = checker.getTypeOfSymbolAtLocation(sym, location);
        for (const sig of memberType.getCallSignatures()) {
            return checker.getReturnTypeOfSignature(sig);
        }
        return undefined;
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
 * Renders candidate types as human-readable hover text, e.g.
 * `"Product | Category"`. Dedupes by display string in the same pass that
 * renders it — the callers hand in already-deduped candidates, so routing
 * through dedupeTypes() here would just stringify everything a second time.
 */
function describeTypes(checker, types) {
    const seen = new Set();
    for (const t of types) {
        seen.add(checker.typeToString(t));
    }
    return [...seen].join(' | ');
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
            entries.push({
                name,
                // Method vs property determines the completion icon the editor shows.
                kind: sym.flags & ts.SymbolFlags.Method
                    ? ts.ScriptElementKind.memberFunctionElement
                    : ts.ScriptElementKind.memberVariableElement,
                kindModifiers: '',
                // '11' mirrors TS's own internal SortText.LocationPriority — the rank
                // ordinary resolved members get — so inferred members sort alongside
                // real ones rather than above or below them.
                sortText: '11',
                source: constants_1.INFERRED_COMPLETION_SOURCE,
            });
        }
    }
    return entries;
}
