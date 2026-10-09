/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Decision rules: turning the raw evidence ./core gathers into the type(s) a
// hover or completion shows. The same rules run for every parameter, return
// value and variable at every depth, so a parameter hover, a member hover on
// it and a completion after it can never disagree. In order:
//
// 1. Normalize: split unions, widen literals, drop types that say nothing
//    (`null`, `any`, `T`, `{}`), dedupe by display.
// 2. Fit: a parameter keeps only candidates exposing every member its body
//    relies on — members it tests for first (`'ID' in x`) aside, members
//    no declared type has at all (an API newer than the vendored types,
//    an expando property), which can't tell candidates apart — and able
//    to stand wherever the body passes the value to a documented helper, or
//    a class its body tests for with `instanceof`/`typeof`. A duck-typed view
//    model, or a wrong argument at one buggy call site, can't masquerade as
//    the Script API class the body actually needs. A class missing members
//    only its subclasses have is a downcast: it narrows to the one subclass
//    that has them, or stays itself when several do.
// 3. Union like IntelliJ: up to MAX_UNION_TYPES, after dropping any candidate
//    whose superclass is also a candidate (`Variant | Product` is `Product`)
//    and any object literal standing in for a candidate class (a test
//    double's `{httpHeaders: ...}` next to the `Request` it mimics).
//    Wider evidence first reads instantiations of one generic class as the
//    class (`Collection<Shipment>`, `Collection<Category>` -> `Collection`),
//    then collapses to the closest shared superclass that still fits, or
//    stays silent.
// 4. No usable evidence: the most specific type the value is used as
//    (`ProductMgr.getProduct(pid)` makes `pid` a `string`), then matching the
//    usage against every ambient class, with the identifier name as a
//    tiebreak (see ./naming). A usage a JavaScript built-in satisfies too
//    (`msg.replace(...)`) stays silent.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {ambientClassType, builtinValueTypes, getAmbientClasses} from './ambient-index';
import type {AmbientClass} from './ambient-index';
import {
  GLOBAL_OBJECT_CLASSES,
  MAX_UNION_TYPES,
  MIN_USAGE_SIGNATURE_MEMBERS,
  UNINFORMATIVE_ANCESTORS,
  WEAK_USAGE_MEMBERS,
} from './constants';
import type {InferenceContext} from './context';
import {pickByName} from './naming';
import {dedupeTypes, getMemberOfType, hasAllMembers, informativeParts, typeDisplayString} from './type-helpers';
import type {UsageProfile} from './usage-profile';

const NO_MEMBERS: ReadonlySet<string> = new Set();

/** The members every value the profile describes must have: those used without a presence test first. */
function requiredMembers(profile: UsageProfile): ReadonlySet<string> {
  if (profile.optionalMemberNames.size === 0) return profile.memberNames;
  return new Set([...profile.memberNames].filter((name) => !profile.optionalMemberNames.has(name)));
}

/** Step 1: split unions, widen literals, drop uninformative types, dedupe by display. */
export function normalizeCandidates(ctx: InferenceContext, types: readonly tsserver.Type[]): tsserver.Type[] {
  return dedupeTypes(
    ctx,
    types.flatMap((type) => informativeParts(ctx, type)),
  );
}

/** The class or interface behind `type` (`Product` for `Product<X>`), if it is one. */
function classOf(ctx: InferenceContext, type: tsserver.Type): tsserver.InterfaceType | undefined {
  const {ts} = ctx;
  if (!(type.flags & ts.TypeFlags.Object)) return undefined;
  const objectType = type as tsserver.ObjectType;
  const target =
    objectType.objectFlags & ts.ObjectFlags.Reference ? (type as tsserver.TypeReference).target : objectType;
  return target.objectFlags & ts.ObjectFlags.ClassOrInterface ? (target as tsserver.InterfaceType) : undefined;
}

/** Every superclass and implemented interface of `type`, nearest first (excluding `type` itself). */
function ancestorsOf(ctx: InferenceContext, type: tsserver.Type): tsserver.InterfaceType[] {
  const ancestors: tsserver.InterfaceType[] = [];
  const start = classOf(ctx, type);
  for (let queue = start ? [start] : []; queue.length > 0; ) {
    const current = queue.shift()!;
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

function isAncestorOf(ctx: InferenceContext, ancestor: tsserver.Type, type: tsserver.Type): boolean {
  const ancestorClass = classOf(ctx, ancestor);
  return ancestorClass !== undefined && ancestorsOf(ctx, type).includes(ancestorClass);
}

/** The class behind `type` and its ancestors, root classes (`PersistentObject`, ...) aside. */
function lineageOf(ctx: InferenceContext, type: tsserver.Type): tsserver.InterfaceType[] {
  const own = classOf(ctx, type);
  return [...(own ? [own] : []), ...ancestorsOf(ctx, type)].filter(
    (lineageClass) => !UNINFORMATIVE_ANCESTORS.has(lineageClass.symbol?.name ?? ''),
  );
}

/**
 * What the value is passed or assigned as, each use as the informative
 * alternatives it accepts (`Product | null` accepts a `Product`; an `any`,
 * `Object` or `any[]` use accepts anything and is left out).
 */
function constrainingUses(ctx: InferenceContext, profile: UsageProfile): tsserver.Type[][] {
  return profile.contextualTypes.map((use) => informativeParts(ctx, use)).filter((parts) => parts.length > 0);
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
function fitsEveryUse(ctx: InferenceContext, type: tsserver.Type, uses: readonly tsserver.Type[][]): boolean {
  const {checker} = ctx;
  if (uses.length === 0 || typeof checker.isTypeAssignableTo !== 'function') return true;
  const lineage = lineageOf(ctx, type);
  const fits = (use: tsserver.Type): boolean =>
    checker.isTypeAssignableTo(type, use) || lineageOf(ctx, use).some((useClass) => lineage.includes(useClass));
  return uses.every((alternatives) => alternatives.some(fits));
}

/**
 * True when `type` is an object literal's (`{ID: 'x'}`), as opposed to a
 * declared class's. Read from its symbol: the widened type of a literal (what
 * a variable holding it has) no longer carries the literal's object flag.
 */
function isObjectLiteralType(ctx: InferenceContext, type: tsserver.Type): boolean {
  return ((type.getSymbol()?.flags ?? 0) & ctx.ts.SymbolFlags.ObjectLiteral) !== 0;
}

/**
 * Drops every object literal a candidate class has all the properties of: a
 * stand-in for that class (a test double, `{httpHeaders: {get: ...}}` for a
 * `Request`, or a partial default), which offers nothing the class doesn't.
 */
function withoutStandIns(ctx: InferenceContext, types: readonly tsserver.Type[]): tsserver.Type[] {
  const {checker} = ctx;
  const classes = types.filter((type) => classOf(ctx, type) !== undefined);
  if (classes.length === 0) return [...types];
  const standsIn = (literal: tsserver.Type): boolean => {
    const names = new Set(checker.getPropertiesOfType(literal).map((property) => property.name));
    return classes.some((candidateClass) => hasAllMembers(checker, candidateClass, names));
  };
  return types.filter((type) => !isObjectLiteralType(ctx, type) || !standsIn(type));
}

/** Drops every candidate whose superclass (or implemented interface) is also a candidate. */
function mostGeneral(ctx: InferenceContext, types: readonly tsserver.Type[]): tsserver.Type[] {
  const candidateClasses = new Set(types.map((type) => classOf(ctx, type)));
  return types.filter((type) => !ancestorsOf(ctx, type).some((ancestor) => candidateClasses.has(ancestor)));
}

/** The nearest superclass all `types` share that still has `memberNames`, ignoring root classes. */
function closestCommonAncestor(
  ctx: InferenceContext,
  types: readonly tsserver.Type[],
  memberNames: ReadonlySet<string>,
): tsserver.Type | undefined {
  const [first, ...rest] = types;
  const restAncestors = rest.map((type) => ancestorsOf(ctx, type));
  return ancestorsOf(ctx, first).find(
    (ancestor) =>
      !UNINFORMATIVE_ANCESTORS.has(ancestor.symbol?.name ?? '') &&
      restAncestors.every((ancestors) => ancestors.includes(ancestor)) &&
      hasAllMembers(ctx.checker, ancestor, memberNames),
  );
}

/**
 * The generic class `type` instantiates, when its declared type reads as the
 * bare class name. Arrays don't: the declared `Array<T>` renders as `T[]`.
 */
function genericClassOf(ctx: InferenceContext, type: tsserver.Type): tsserver.InterfaceType | undefined {
  const generic = classOf(ctx, type);
  return generic?.typeParameters?.length && !ctx.checker.isArrayType(type) ? generic : undefined;
}

/**
 * Reads two or more instantiations of the same generic class as the class
 * itself: its declared type, whose unbound type parameters render as nothing
 * (`Collection<ProductLineItem>` and `Collection<Shipment>` -> `Collection`).
 * A lone instantiation keeps its informative type argument.
 */
function mergeInstantiations(ctx: InferenceContext, types: readonly tsserver.Type[]): tsserver.Type[] {
  const instantiations = new Map<tsserver.InterfaceType, number>();
  for (const type of types) {
    const generic = genericClassOf(ctx, type);
    if (generic) instantiations.set(generic, (instantiations.get(generic) ?? 0) + 1);
  }
  const merged = types.map((type) => {
    const generic = genericClassOf(ctx, type);
    return generic && (instantiations.get(generic) ?? 0) > 1 ? generic : type;
  });
  return dedupeTypes(ctx, merged);
}

/**
 * Step 3: an IntelliJ-style union of at most MAX_UNION_TYPES, stand-ins
 * aside; wider evidence merged by generic class, else the closest shared
 * superclass, else silence.
 */
export function limitUnion(
  ctx: InferenceContext,
  types: readonly tsserver.Type[],
  memberNames: ReadonlySet<string> = NO_MEMBERS,
): tsserver.Type[] {
  const general = mostGeneral(ctx, withoutStandIns(ctx, types));
  if (general.length <= MAX_UNION_TYPES) return general;
  const merged = mostGeneral(ctx, mergeInstantiations(ctx, general));
  if (merged.length <= MAX_UNION_TYPES) return merged;
  const ancestor = closestCommonAncestor(ctx, merged, memberNames);
  return ancestor ? [ancestor] : [];
}

/**
 * The single most specific type the value is used as: one every other such
 * type is a superclass of (`basket` passed both where a `Basket` and where a
 * `LineItemCtnr` is expected is a `Basket`). Conflicting uses decide nothing.
 */
function mostSpecificUse(ctx: InferenceContext, profile: UsageProfile, required: ReadonlySet<string>): tsserver.Type[] {
  const uses = normalizeCandidates(ctx, profile.contextualTypes).filter((type) =>
    hasAllMembers(ctx.checker, type, required),
  );
  const mostSpecific = uses.filter((type) => uses.every((other) => other === type || isAncestorOf(ctx, other, type)));
  return mostSpecific.length === 1 ? mostSpecific : [];
}

interface AmbientMatch {
  readonly name: string;
  readonly type: tsserver.Type;
}

/** Resolves matched index entries to types, merging declarations of the same symbol. */
function resolveMatches(ctx: InferenceContext, classes: readonly AmbientClass[]): AmbientMatch[] {
  const bySymbol = new Map<tsserver.Symbol, AmbientMatch>();
  for (const ambientClass of classes) {
    const type = ambientClassType(ctx, ambientClass);
    const symbol = type?.getSymbol();
    if (type && symbol && !bySymbol.has(symbol)) bySymbol.set(symbol, {name: ambientClass.name, type});
  }
  return [...bySymbol.values()];
}

/** True when a JavaScript built-in (`String`, `Array`, ...) has every member in `memberNames`. */
function fitsBuiltin(ctx: InferenceContext, memberNames: ReadonlySet<string>): boolean {
  return builtinValueTypes(ctx).some((builtin) => hasAllMembers(ctx.checker, builtin, memberNames));
}

/**
 * Step 4b: matches a usage signature against every ambient class (see
 * ./ambient-index) except those describing one global object (`Module`).
 * Silent when no class has every member; when only ubiquitous members
 * (`.custom`, `.UUID`) were used and several classes fit; when a single
 * member fits several classes the identifier name can't choose between; and
 * when a JavaScript built-in fits as well and the name doesn't pick a class.
 * A name that denotes a class the usage does *not* fit never falls back to a
 * vaguer reading of the same name (`bonusDiscountLineItem.getQuantity()` is
 * not a ProductLineItem hint), and silences a single-member signature
 * outright: `lineItem.preorderable` uniquely matching ProductInventoryRecord
 * is a coincidence, not a hint.
 *
 * @param identifierName - the parameter's or variable's own name, used only
 * to pick among classes the usage already fits (see ./naming).
 */
export function matchAmbientTypesByUsage(
  ctx: InferenceContext,
  memberNames: ReadonlySet<string>,
  identifierName?: string,
): tsserver.Type[] {
  if (memberNames.size === 0) return [];
  const classes = getAmbientClasses(ctx);
  const fitting = classes.filter(
    (ambientClass) =>
      !GLOBAL_OBJECT_CLASSES.has(ambientClass.name) &&
      [...memberNames].every((name) => ambientClass.memberNames.has(name)),
  );
  const onlyWeakMembers = [...memberNames].every((name) => WEAK_USAGE_MEMBERS.has(name));
  if (fitting.length === 0 || (onlyWeakMembers && fitting.length > 1)) return [];
  const matches = resolveMatches(ctx, fitting);
  const denoted = identifierName ? pickByName(identifierName, classes) : undefined;
  const named = denoted
    ? matches.find((match) => match.name === denoted.name)
    : identifierName && pickByName(identifierName, matches);
  if (named) return [named.type];
  const thinSignature = memberNames.size < MIN_USAGE_SIGNATURE_MEMBERS;
  if ((thinSignature && (denoted || matches.length > 1)) || fitsBuiltin(ctx, memberNames)) return [];
  return limitUnion(
    ctx,
    matches.map((match) => match.type),
    memberNames,
  );
}

/**
 * What a candidate lacking some members the body uses can still be: the one
 * subclass that has them all (a body relying on `paymentTransaction` is
 * handed `OrderPaymentInstrument`s, whatever the argument is documented as),
 * or — when several subclasses would do (`getMasterProduct()` on a `Variant`
 * or a `VariationGroup`, called once the body knows which) — the candidate
 * itself. Root classes (`PersistentObject`, ...) never stand in for a
 * subclass this way; nearly every class extends them.
 */
function downcastOf(ctx: InferenceContext, type: tsserver.Type, memberNames: ReadonlySet<string>): tsserver.Type[] {
  const own = classOf(ctx, type);
  if (!own || UNINFORMATIVE_ANCESTORS.has(own.symbol?.name ?? '')) return [];
  const fitting = getAmbientClasses(ctx).filter((ambientClass) =>
    [...memberNames].every((name) => ambientClass.memberNames.has(name)),
  );
  const subclasses = mostGeneral(
    ctx,
    resolveMatches(ctx, fitting)
      .map((match) => match.type)
      .filter((subclass) => isAncestorOf(ctx, type, subclass)),
  );
  return subclasses.length > 1 ? [type] : subclasses;
}

/**
 * The required members that can tell candidates apart: those some ambient
 * class, JavaScript built-in or candidate declares. A member nothing declares
 * (`searchHit.discountedPromotionIDs`, newer than the vendored Script API)
 * would otherwise drop every candidate, the right one included.
 */
function checkableMembers(
  ctx: InferenceContext,
  required: ReadonlySet<string>,
  candidates: readonly tsserver.Type[],
): ReadonlySet<string> {
  const {checker} = ctx;
  const declaredBy = (types: readonly tsserver.Type[], name: string): boolean =>
    types.some((type) => getMemberOfType(checker, type, name) !== undefined);
  const declared = (name: string): boolean =>
    declaredBy(candidates, name) ||
    getAmbientClasses(ctx).some((ambientClass) => ambientClass.memberNames.has(name)) ||
    declaredBy(builtinValueTypes(ctx), name);
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
export function decideType(
  ctx: InferenceContext,
  evidence: readonly tsserver.Type[],
  profile: UsageProfile,
  name: tsserver.BindingName,
  fitUsage: boolean,
): tsserver.Type[] {
  const guards = normalizeCandidates(ctx, profile.guardTypes);
  const guardKeys = new Set(guards.map((type) => typeDisplayString(ctx, type)));
  const candidates = normalizeCandidates(ctx, [...evidence, ...guards]);
  const required = requiredMembers(profile);
  const checkable = checkableMembers(ctx, required, candidates);
  const uses = constrainingUses(ctx, profile);
  const fit = (type: tsserver.Type): tsserver.Type[] => {
    if (guardKeys.has(typeDisplayString(ctx, type))) return [type];
    const fitted = hasAllMembers(ctx.checker, type, checkable) ? [type] : downcastOf(ctx, type, checkable);
    return fitted.filter((fittedType) => fitsEveryUse(ctx, fittedType, uses));
  };
  const fitting = fitUsage ? dedupeTypes(ctx, candidates.flatMap(fit)) : candidates;
  if (fitting.length > 0) return limitUnion(ctx, fitting, checkable);
  const used = mostSpecificUse(ctx, profile, required);
  if (used.length > 0) return used;
  return matchAmbientTypesByUsage(ctx, profile.memberNames, ctx.ts.isIdentifier(name) ? name.text : undefined);
}
