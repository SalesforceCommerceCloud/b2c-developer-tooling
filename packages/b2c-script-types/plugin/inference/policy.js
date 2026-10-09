"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCandidates = normalizeCandidates;
exports.limitUnion = limitUnion;
exports.matchAmbientTypesByUsage = matchAmbientTypesByUsage;
exports.decideType = decideType;
const ambient_index_1 = require("./ambient-index");
const constants_1 = require("./constants");
const naming_1 = require("./naming");
const type_helpers_1 = require("./type-helpers");
const NO_MEMBERS = new Set();
/** The members every value the profile describes must have: those used without a presence test first. */
function requiredMembers(profile) {
    if (profile.optionalMemberNames.size === 0)
        return profile.memberNames;
    return new Set([...profile.memberNames].filter((name) => !profile.optionalMemberNames.has(name)));
}
/** Step 1: split unions, widen literals, drop uninformative types, dedupe by display. */
function normalizeCandidates(ctx, types) {
    return (0, type_helpers_1.dedupeTypes)(ctx, types.flatMap((type) => (0, type_helpers_1.informativeParts)(ctx, type)));
}
/** The class or interface behind `type` (`Product` for `Product<X>`), if it is one. */
function classOf(ctx, type) {
    const { ts } = ctx;
    if (!(type.flags & ts.TypeFlags.Object))
        return undefined;
    const objectType = type;
    const target = objectType.objectFlags & ts.ObjectFlags.Reference ? type.target : objectType;
    return target.objectFlags & ts.ObjectFlags.ClassOrInterface ? target : undefined;
}
/** Every superclass and implemented interface of `type`, nearest first (excluding `type` itself). */
function ancestorsOf(ctx, type) {
    const ancestors = [];
    const start = classOf(ctx, type);
    for (let queue = start ? [start] : []; queue.length > 0;) {
        const current = queue.shift();
        for (const base of ctx.checker.getBaseTypes(current)) {
            const baseClass = classOf(ctx, base);
            if (baseClass && baseClass !== start && !ancestors.includes(baseClass)) {
                ancestors.push(baseClass);
                queue.push(baseClass);
            }
        }
    }
    return ancestors;
}
function isAncestorOf(ctx, ancestor, type) {
    const ancestorClass = classOf(ctx, ancestor);
    return ancestorClass !== undefined && ancestorsOf(ctx, type).includes(ancestorClass);
}
/** The class behind `type` and its ancestors, root classes (`PersistentObject`, ...) aside. */
function lineageOf(ctx, type) {
    const own = classOf(ctx, type);
    return [...(own ? [own] : []), ...ancestorsOf(ctx, type)].filter((lineageClass) => !constants_1.UNINFORMATIVE_ANCESTORS.has(lineageClass.symbol?.name ?? ''));
}
/**
 * What the value is passed or assigned as, each use as the informative
 * alternatives it accepts (`Product | null` accepts a `Product`; an `any`,
 * `Object` or `any[]` use accepts anything and is left out).
 */
function constrainingUses(ctx, profile) {
    return profile.contextualTypes.map((use) => (0, type_helpers_1.informativeParts)(ctx, use)).filter((parts) => parts.length > 0);
}
/**
 * True when `type` can stand wherever the body uses the value: assignable to
 * (an alternative of) each use, or at least from the same class family (an
 * `Order` passed to a helper documented as taking a `Basket` that really
 * takes any `LineItemCtnr`, a common over-narrow JSDoc). A different kind of
 * value never fits: a `string` argument at one buggy call site of
 * `getBonusUnitPrice(apiProduct)`, whose body passes it on as a `Product`.
 * TypeScript builds without the public `isTypeAssignableTo` skip the check.
 */
function fitsEveryUse(ctx, type, uses) {
    const { checker } = ctx;
    if (uses.length === 0 || typeof checker.isTypeAssignableTo !== 'function')
        return true;
    const lineage = lineageOf(ctx, type);
    const fits = (use) => checker.isTypeAssignableTo(type, use) || lineageOf(ctx, use).some((useClass) => lineage.includes(useClass));
    return uses.every((alternatives) => alternatives.some(fits));
}
/** Drops every candidate whose superclass (or implemented interface) is also a candidate. */
function mostGeneral(ctx, types) {
    const candidateClasses = new Set(types.map((type) => classOf(ctx, type)));
    return types.filter((type) => !ancestorsOf(ctx, type).some((ancestor) => candidateClasses.has(ancestor)));
}
/** The nearest superclass all `types` share that still has `memberNames`, ignoring root classes. */
function closestCommonAncestor(ctx, types, memberNames) {
    const [first, ...rest] = types;
    const restAncestors = rest.map((type) => ancestorsOf(ctx, type));
    return ancestorsOf(ctx, first).find((ancestor) => !constants_1.UNINFORMATIVE_ANCESTORS.has(ancestor.symbol?.name ?? '') &&
        restAncestors.every((ancestors) => ancestors.includes(ancestor)) &&
        (0, type_helpers_1.hasAllMembers)(ctx.checker, ancestor, memberNames));
}
/**
 * The generic class `type` instantiates, when its declared type reads as the
 * bare class name. Arrays don't: the declared `Array<T>` renders as `T[]`.
 */
function genericClassOf(ctx, type) {
    const generic = classOf(ctx, type);
    return generic?.typeParameters?.length && !ctx.checker.isArrayType(type) ? generic : undefined;
}
/**
 * Reads two or more instantiations of the same generic class as the class
 * itself: its declared type, whose unbound type parameters render as nothing
 * (`Collection<ProductLineItem>` and `Collection<Shipment>` -> `Collection`).
 * A lone instantiation keeps its informative type argument.
 */
function mergeInstantiations(ctx, types) {
    const instantiations = new Map();
    for (const type of types) {
        const generic = genericClassOf(ctx, type);
        if (generic)
            instantiations.set(generic, (instantiations.get(generic) ?? 0) + 1);
    }
    const merged = types.map((type) => {
        const generic = genericClassOf(ctx, type);
        return generic && (instantiations.get(generic) ?? 0) > 1 ? generic : type;
    });
    return (0, type_helpers_1.dedupeTypes)(ctx, merged);
}
/**
 * Step 3: an IntelliJ-style union of at most MAX_UNION_TYPES; wider evidence
 * merged by generic class, else the closest shared superclass, else silence.
 */
function limitUnion(ctx, types, memberNames = NO_MEMBERS) {
    const general = mostGeneral(ctx, types);
    if (general.length <= constants_1.MAX_UNION_TYPES)
        return general;
    const merged = mostGeneral(ctx, mergeInstantiations(ctx, general));
    if (merged.length <= constants_1.MAX_UNION_TYPES)
        return merged;
    const ancestor = closestCommonAncestor(ctx, merged, memberNames);
    return ancestor ? [ancestor] : [];
}
/**
 * The single most specific type the value is used as: one every other such
 * type is a superclass of (`basket` passed both where a `Basket` and where a
 * `LineItemCtnr` is expected is a `Basket`). Conflicting uses decide nothing.
 */
function mostSpecificUse(ctx, profile, required) {
    const uses = normalizeCandidates(ctx, profile.contextualTypes).filter((type) => (0, type_helpers_1.hasAllMembers)(ctx.checker, type, required));
    const mostSpecific = uses.filter((type) => uses.every((other) => other === type || isAncestorOf(ctx, other, type)));
    return mostSpecific.length === 1 ? mostSpecific : [];
}
/** Resolves matched index entries to types, merging declarations of the same symbol. */
function resolveMatches(ctx, classes) {
    const bySymbol = new Map();
    for (const ambientClass of classes) {
        const type = (0, ambient_index_1.ambientClassType)(ctx, ambientClass);
        const symbol = type?.getSymbol();
        if (type && symbol && !bySymbol.has(symbol))
            bySymbol.set(symbol, { name: ambientClass.name, type });
    }
    return [...bySymbol.values()];
}
/** True when a JavaScript built-in (`String`, `Array`, ...) has every member in `memberNames`. */
function fitsBuiltin(ctx, memberNames) {
    return (0, ambient_index_1.builtinValueTypes)(ctx).some((builtin) => (0, type_helpers_1.hasAllMembers)(ctx.checker, builtin, memberNames));
}
/**
 * Step 4b: matches a usage signature against every ambient class (see
 * ./ambient-index) except those describing one global object (`Module`).
 * Silent when no class has every member; when only ubiquitous members
 * (`.custom`, `.UUID`) were used and several classes fit; when a single
 * member fits several classes the identifier name can't choose between; and
 * when a JavaScript built-in fits as well and the name doesn't pick a class. A name that denotes a class the usage does *not* fit
 * never falls back to a vaguer reading of the same name
 * (`bonusDiscountLineItem.getQuantity()` is not a ProductLineItem hint), and
 * silences a single-member signature outright: `lineItem.preorderable`
 * uniquely matching ProductInventoryRecord is a coincidence, not a hint.
 *
 * @param identifierName - the parameter's or variable's own name, used only
 * to pick among classes the usage already fits (see ./naming).
 */
function matchAmbientTypesByUsage(ctx, memberNames, identifierName) {
    if (memberNames.size === 0)
        return [];
    const classes = (0, ambient_index_1.getAmbientClasses)(ctx);
    const fitting = classes.filter((ambientClass) => !constants_1.GLOBAL_OBJECT_CLASSES.has(ambientClass.name) &&
        [...memberNames].every((name) => ambientClass.memberNames.has(name)));
    const onlyWeakMembers = [...memberNames].every((name) => constants_1.WEAK_USAGE_MEMBERS.has(name));
    if (fitting.length === 0 || (onlyWeakMembers && fitting.length > 1))
        return [];
    const matches = resolveMatches(ctx, fitting);
    const denoted = identifierName ? (0, naming_1.pickByName)(identifierName, classes) : undefined;
    const named = denoted
        ? matches.find((match) => match.name === denoted.name)
        : identifierName && (0, naming_1.pickByName)(identifierName, matches);
    if (named)
        return [named.type];
    const thinSignature = memberNames.size < constants_1.MIN_USAGE_SIGNATURE_MEMBERS;
    if ((thinSignature && (denoted || matches.length > 1)) || fitsBuiltin(ctx, memberNames))
        return [];
    return limitUnion(ctx, matches.map((match) => match.type), memberNames);
}
/**
 * The required members that can tell candidates apart: those some ambient
 * class, JavaScript built-in or candidate declares. A member nothing declares
 * (`searchHit.discountedPromotionIDs`, newer than the vendored Script API)
 * would otherwise drop every candidate, the right one included.
 */
function checkableMembers(ctx, required, candidates) {
    const { checker } = ctx;
    const declaredBy = (types, name) => types.some((type) => (0, type_helpers_1.getMemberOfType)(checker, type, name) !== undefined);
    const declared = (name) => declaredBy(candidates, name) ||
        (0, ambient_index_1.getAmbientClasses)(ctx).some((ambientClass) => ambientClass.memberNames.has(name)) ||
        declaredBy((0, ambient_index_1.builtinValueTypes)(ctx), name);
    return new Set([...required].filter(declared));
}
/**
 * Decides what a parameter or variable holds from the evidence ./core
 * gathered for it (call-site arguments, assigned values, framework
 * callbacks) plus its own usage profile.
 *
 * @param fitUsage - drop candidates lacking a member the profile shows in
 * use. On for parameters, whose call sites are independent samples that may
 * pass a look-alike; off for a variable's own assigned values.
 */
function decideType(ctx, evidence, profile, identifierName, fitUsage) {
    const guards = normalizeCandidates(ctx, profile.guardTypes);
    const guardKeys = new Set(guards.map((type) => (0, type_helpers_1.typeDisplayString)(ctx, type)));
    const candidates = normalizeCandidates(ctx, [...evidence, ...guards]);
    const required = requiredMembers(profile);
    const checkable = checkableMembers(ctx, required, candidates);
    const uses = constrainingUses(ctx, profile);
    const fits = (type) => guardKeys.has((0, type_helpers_1.typeDisplayString)(ctx, type)) ||
        ((0, type_helpers_1.hasAllMembers)(ctx.checker, type, checkable) && fitsEveryUse(ctx, type, uses));
    const fitting = fitUsage ? candidates.filter(fits) : candidates;
    if (fitting.length > 0)
        return limitUnion(ctx, fitting, checkable);
    const used = mostSpecificUse(ctx, profile, required);
    if (used.length > 0)
        return used;
    return matchAmbientTypesByUsage(ctx, profile.memberNames, identifierName);
}
