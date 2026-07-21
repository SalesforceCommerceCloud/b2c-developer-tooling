/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Last-resort fallback for when the rest of the engine (call-site and
// return-expression driven, see ./core) can't find anything: a parameter that
// is never passed a documented value anywhere in the project — e.g. a
// helper only ever called from a Controller via `require(...)`, which the
// reference search can't see through — still gets used *somewhere* in its own
// function body. Scanning which members it's accessed by (`shipment.custom`,
// `shipment.productLineItems`) and matching that shape against every ambient
// class the program knows about (the vendored dw.* Script API, chiefly) can
// recover a plausible type purely from usage, with no call site at all.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {
  CONVENTIONAL_IDENTIFIER_ALIASES,
  MAX_USAGE_MATCH_CANDIDATES,
  MIN_USAGE_SIGNATURE_MEMBERS,
  WEAK_USAGE_MEMBERS,
} from './constants';
import type {InferenceContext} from './context';
import {isOpenForUsageInference} from './type-helpers';

/**
 * Resolves a parameter/variable identifier to the ambient class simple name(s)
 * it conventionally denotes: exact case-insensitive match (`customer` →
 * `Customer`) plus the curated SFRA aliases (`lineItem` / `pli` →
 * `ProductLineItem`). Returns lowercased names for comparison against
 * candidate.class names.
 */
function conventionalAmbientNames(identifierName: string): ReadonlySet<string> {
  const lower = identifierName.toLowerCase();
  const names = new Set<string>([lower]);
  const alias = CONVENTIONAL_IDENTIFIER_ALIASES.get(lower);
  if (alias) names.add(alias.toLowerCase());
  return names;
}

interface AmbientClassCandidate {
  readonly type: tsserver.Type;
  readonly memberNames: ReadonlySet<string>;
  /** The class/interface's own declared name, e.g. `"Profile"` — see the identifier-name tiebreak in {@link matchAmbientTypesByUsage}. */
  readonly name: string;
}

// Keyed by LanguageService, NOT by Program: tsserver hands the plugin a
// brand-new Program object on every edit to a file the project contains —
// including every keystroke in the very file someone is actively typing in.
// The ambient class shape (every dw.* class's member set) never changes for
// the life of a project, so a Program-keyed cache would rebuild this index
// (iterate every source file, call getPropertiesOfType on every dw.* class)
// on nearly every completion request while a cartridge file is being edited.
// On a large real project that rebuild is slow enough to blow past a
// completion request's cancellation budget, so completions would silently
// come back empty far more often than hover (a discrete, non-keystroke-driven
// request) — while the *next* Program, once the edit settles, would pay the
// same cost again. `languageService` is stable for as long as the tsserver
// project itself is open, and — just as importantly for tests — distinct
// per fixture, since each test builds its own LanguageService.
const classIndexCache = new WeakMap<tsserver.LanguageService, AmbientClassCandidate[]>();

/**
 * Indexes one top-level class/interface declaration into an ambient-class
 * candidate, or `undefined` when it's nameless / has no members.
 * Extracted from {@link buildAmbientClassIndex} so the walk stays flat.
 *
 * Generic classes (chiefly `dw.catalog.Product<T>`) are included: skipping
 * them left the most common storefront parameter (`product`) matching only
 * non-generic subclasses like `Variant` / `VariationGroup`, which is worse
 * than showing the unsubstituted generic. Hover display rewrites `Product<T>`
 * → `Product<any>` in {@link computeTypeDisplayString} so the editor never
 * surfaces a bare type-parameter name with no instantiation context.
 */
function candidateFromDeclaration(
  checker: tsserver.TypeChecker,
  ts: typeof tsserver,
  stmt: tsserver.Statement,
): AmbientClassCandidate | undefined {
  const isClassOrInterface = ts.isClassDeclaration(stmt) || ts.isInterfaceDeclaration(stmt);
  if (!isClassOrInterface || !stmt.name) return undefined;
  const symbol = checker.getSymbolAtLocation(stmt.name);
  if (!symbol) return undefined;
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  const memberNames = new Set<string>();
  for (const prop of checker.getPropertiesOfType(type)) {
    memberNames.add(prop.getName());
  }
  if (memberNames.size === 0) return undefined;
  return {type, memberNames, name: stmt.name.text};
}

/**
 * Indexes every top-level class/interface declared in a `.d.ts` file visible
 * to the program (the vendored dw.* Script API, plus whatever else a
 * project's ambient types pull in) by its full member-name set, so
 * {@link matchAmbientTypesByUsage} can look candidates up by shape.
 */
function buildAmbientClassIndex(ctx: InferenceContext): AmbientClassCandidate[] {
  const cached = classIndexCache.get(ctx.languageService);
  if (cached) return cached;
  const {ts, checker} = ctx;
  const candidates: AmbientClassCandidate[] = [];
  for (const sourceFile of ctx.program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) continue;
    for (const stmt of sourceFile.statements) {
      const candidate = candidateFromDeclaration(checker, ts, stmt);
      if (candidate) candidates.push(candidate);
    }
  }
  classIndexCache.set(ctx.languageService, candidates);
  return candidates;
}

/**
 * How many ambient classes declare `memberName`. Built once per
 * matchAmbientTypesByUsage call so distinctiveness scoring stays O(matches ×
 * signature) rather than re-scanning the whole index per member per match.
 */
function buildMemberFrequency(candidates: readonly AmbientClassCandidate[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const candidate of candidates) {
    for (const name of candidate.memberNames) {
      freq.set(name, (freq.get(name) ?? 0) + 1);
    }
  }
  return freq;
}

/**
 * Higher = the usage signature's members are rarer across the ambient index
 * (and not just ubiquitous `.custom` / `.UUID` noise). Weak members still
 * contribute, but at a steep discount so a distinctive co-member dominates.
 */
function distinctivenessScore(memberNames: ReadonlySet<string>, frequency: ReadonlyMap<string, number>): number {
  let score = 0;
  for (const name of memberNames) {
    const weight = WEAK_USAGE_MEMBERS.has(name) ? 0.15 : 1;
    score += weight / Math.max(frequency.get(name) ?? 1, 1);
  }
  return score;
}

/**
 * Collects the names of every member accessed directly on whatever `symbol`
 * identifies, anywhere in `scope` (including inside nested closures — a
 * `Transaction.wrap(function () {...})` callback still reads/writes an outer
 * parameter or variable it closes over). Only direct `x.member` accesses
 * count; a chained `x.custom.fromStoreId` only contributes `custom` — the
 * deeper hop describes `custom`'s shape, not `x`'s. That one-hop rule is also
 * what makes the SFRA `product.custom.foo` / `'foo' in product.custom` idiom
 * usable as ExtensibleObject-family evidence without guessing attribute names.
 *
 * Also counts a `'member' in x` existence check as evidence of `member` —
 * a very common real-world SFCC idiom for guarding an optional custom
 * attribute or a conditionally-present property (`'appliedPromotions' in
 * this`, `'Subsoort' in apiProduct.custom`) before reading it, sometimes
 * with no direct property-access read anywhere nearby to otherwise carry the
 * signal.
 *
 * Skips the one property access the current request's own cursor sits
 * inside of (see {@link InferenceContext.triggerPosition}) — a dangling
 * `shipment.` mid-edit, immediately followed by more code, parses as a
 * (nonsensical but syntactically valid) access to whatever identifier comes
 * next, and that phantom member name must not count as real usage evidence
 * for resolving the very completion being asked for.
 */
function collectMemberUsageInScope(ctx: InferenceContext, symbol: tsserver.Symbol, scope: tsserver.Node): Set<string> {
  const {ts, checker, triggerPosition} = ctx;
  const members = new Set<string>();
  const visit = (node: tsserver.Node) => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      checker.getSymbolAtLocation(node.expression) === symbol &&
      !(
        triggerPosition !== undefined &&
        node.expression.getEnd() <= triggerPosition &&
        triggerPosition <= node.name.getStart()
      )
    ) {
      members.add(node.name.text);
    } else if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      checker.getSymbolAtLocation(node.expression) === symbol &&
      node.argumentExpression &&
      ts.isStringLiteralLike(node.argumentExpression)
    ) {
      // `lineItem['productID']` / `profile['email']` — same evidence as a dot
      // read; common when the member name is computed from a form key.
      members.add(node.argumentExpression.text);
    } else if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.InKeyword &&
      ts.isStringLiteralLike(node.left) &&
      ts.isIdentifier(node.right) &&
      checker.getSymbolAtLocation(node.right) === symbol
    ) {
      members.add(node.left.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(scope);
  return members;
}

/** Walks up from `node` to the body of the nearest enclosing function-like declaration, if any. */
function findEnclosingFunctionBody(node: tsserver.Node, ts: typeof tsserver): tsserver.Node | undefined {
  let current: tsserver.Node | undefined = node.parent;
  while (current) {
    if (ts.isFunctionLike(current)) return (current as tsserver.FunctionLikeDeclaration).body;
    current = current.parent;
  }
  return undefined;
}

/** Collects `param`'s own member-usage signature — see {@link collectMemberUsageInScope}. */
export function collectParameterMemberUsage(ctx: InferenceContext, param: tsserver.ParameterDeclaration): Set<string> {
  const {ts, checker} = ctx;
  const fn = param.parent;
  if (!ts.isFunctionLike(fn) || !ts.isIdentifier(param.name)) return new Set();
  const body = (fn as tsserver.FunctionLikeDeclaration).body;
  if (!body) return new Set();
  const symbol = checker.getSymbolAtLocation(param.name);
  if (!symbol) return new Set();
  return collectMemberUsageInScope(ctx, symbol, body);
}

/**
 * Resolves the *instance* type tested by an `instanceof` right-hand side
 * (`dw.order.ProductLineItem`, a local class binding, …). Prefer a construct
 * signature's return type; otherwise the declared type of the RHS symbol.
 */
function instanceTypeFromInstanceOfRhs(ctx: InferenceContext, rhs: tsserver.Expression): tsserver.Type | undefined {
  const {checker, ts} = ctx;
  const rhsType = checker.getTypeAtLocation(rhs);
  for (const sig of rhsType.getConstructSignatures()) {
    const instance = checker.getReturnTypeOfSignature(sig);
    if (!isOpenForUsageInference(ts, instance)) return instance;
  }
  const symbol = rhsType.getSymbol() ?? checker.getSymbolAtLocation(rhs);
  if (!symbol) return undefined;
  const declared = checker.getDeclaredTypeOfSymbol(symbol);
  if (isOpenForUsageInference(ts, declared)) return undefined;
  return declared;
}

/**
 * Collects concrete types asserted via `param instanceof SomeType` in the
 * parameter's enclosing function body. Real payment/cart helpers (Adyen,
 * Avalara, stickyio calculate.js) branch on `lineItem instanceof
 * dw.order.ProductLineItem` — JetBrains' JS evaluator narrows from that;
 * without collecting it here, a polymorphic `lineItem` parameter stays
 * ambient-ambiguous even when the body names the class explicitly.
 */
export function collectParameterInstanceOfTypes(
  ctx: InferenceContext,
  param: tsserver.ParameterDeclaration,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const fn = param.parent;
  if (!ts.isFunctionLike(fn) || !ts.isIdentifier(param.name)) return [];
  const body = (fn as tsserver.FunctionLikeDeclaration).body;
  if (!body) return [];
  const symbol = checker.getSymbolAtLocation(param.name);
  if (!symbol) return [];
  const types: tsserver.Type[] = [];
  const visit = (node: tsserver.Node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
      ts.isIdentifier(node.left) &&
      checker.getSymbolAtLocation(node.left) === symbol
    ) {
      const instance = instanceTypeFromInstanceOfRhs(ctx, node.right);
      if (instance) types.push(instance);
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  return types;
}

/**
 * Collects a local variable's own member-usage signature within its
 * enclosing function (or the whole file, for a top-level variable) — the
 * counterpart to {@link collectParameterMemberUsage} for the common
 * manual-indexing loop shape TS can't type at all on its own:
 * `for (var i = 0; i < items.length; i++) { var item = items[i]; ...item.foo }`.
 * `items[i]` is `any` (items itself is undocumented), so nothing about
 * `item`'s initializer helps — but `item`'s own usage further down does.
 */
export function collectVariableMemberUsage(ctx: InferenceContext, decl: tsserver.VariableDeclaration): Set<string> {
  const {ts, checker} = ctx;
  if (!ts.isIdentifier(decl.name)) return new Set();
  const symbol = checker.getSymbolAtLocation(decl.name);
  if (!symbol) return new Set();
  const scope = findEnclosingFunctionBody(decl, ts) ?? decl.getSourceFile();
  return collectMemberUsageInScope(ctx, symbol, scope);
}

/**
 * Matches a member-name usage signature against every ambient class the
 * program knows about, returning the type(s) of whichever candidate(s) expose
 * all of them, most-specific first.
 *
 * Ranking (after an optional identifier-name short-circuit):
 * 1. Highest distinctiveness score — rarer used members win over ubiquitous
 *    ones like `.custom` / `.UUID` (see {@link WEAK_USAGE_MEMBERS}).
 * 2. Fewest total members among that top score tier — the tightest-fitting
 *    shape, not just any rare-member superset.
 *
 * Returns `[]` when the signature is too weak to be worth guessing from (see
 * MIN_USAGE_SIGNATURE_MEMBERS) or when it still ties across too many
 * unrelated candidates to be a useful hint (MAX_USAGE_MATCH_CANDIDATES).
 *
 * Exception: a signature below MIN_USAGE_SIGNATURE_MEMBERS is still trusted
 * when it's globally unambiguous — exactly one ambient class in the whole
 * program declares all of these members at all (not just tied for
 * "tightest"). A member name that's this rare is as strong a signal as a
 * multi-member signature; a signature that's both weak AND ambiguous is what
 * MIN_USAGE_SIGNATURE_MEMBERS exists to filter out.
 *
 * @param identifierName - the parameter/variable's own name, when it's a
 * plain identifier (`profile`, `shipment`). Real-world bug: a common field
 * subset (`email`/`firstName`/`lastName`/`custom`) is shared by both the
 * large `dw.customer.Profile` and the much smaller `dw.customer.
 * ProductListRegistrant` — "fewest total members" alone picks the small,
 * unrelated class every time purely because it has less surface area, never
 * the large, contextually correct one. A variable conventionally named after
 * the SFCC class it holds is a stronger, more specific signal than raw
 * member count, so a name match short-circuits straight to that candidate
 * (ambient class names are unique, so at most one can ever match this way)
 * before size/distinctiveness ranking even runs — but only after the
 * weak-only silence guard below. A parameter literally named `shipment`
 * whose only evidence is `.custom` must still stay silent: the name alone
 * must not override weak-only evidence. A single *strong* member plus a
 * matching name (`customer` + `.profile`) is trusted, since one-hop usage
 * collection often yields just the first property of a longer chain.
 */
export function matchAmbientTypesByUsage(
  ctx: InferenceContext,
  memberNames: ReadonlySet<string>,
  identifierName?: string,
): tsserver.Type[] {
  if (memberNames.size === 0) return [];
  const candidates = buildAmbientClassIndex(ctx);
  const matches = candidates.filter((candidate) => {
    for (const name of memberNames) {
      if (!candidate.memberNames.has(name)) return false;
    }
    return true;
  });
  if (matches.length === 0) return [];
  // A signature made only of ubiquitous members (`.custom` / `.UUID` / …) is
  // never discriminative enough when more than one ambient class matches —
  // distinctiveness scoring alone can't break the tie usefully because every
  // match saw the same weak evidence. Silence rather than guessing the
  // smallest ExtensibleObject. This guard MUST run before the identifier-name
  // short-circuit: a parameter literally named `shipment` whose only evidence
  // is `.custom` must stay silent — the name alone must not override
  // "too weak" evidence (see usage-match tests).
  const strongCount = [...memberNames].filter((n) => !WEAK_USAGE_MEMBERS.has(n)).length;
  if (strongCount === 0 && matches.length > 1) return [];

  // A conventionally named parameter (`customer`, `profile`, `shipment`, or
  // an SFRA alias like `lineItem` / `pli` → ProductLineItem) that uniquely
  // matches one of the ambient candidates short-circuits here — even when
  // the usage signature is a single strong member. Real SFRA shape:
  // `function getPasswordResetToken(customer) { customer.profile.credentials… }`
  // only contributes `.profile` (one-hop member collection), which is shared
  // by `dw.customer.Customer` and `dw.svc.ServiceConfig`, but the parameter
  // name makes the intended class unambiguous. Weak-only signatures never
  // reach this point (guard above).
  if (identifierName) {
    const conventional = conventionalAmbientNames(identifierName);
    const byName = matches.filter((m) => conventional.has(m.name.toLowerCase()));
    if (byName.length === 1) return [byName[0].type];
    // The identifier named a real Script API class (or an SFRA alias of one),
    // but that class isn't among the usage matches. A thin signature's
    // "globally unique member" hit is then almost certainly a *different*
    // class that happens to share one property — e.g. `lineItem.preorderable`
    // uniquely matching `ProductInventoryRecord` while the author clearly
    // meant a line item. Silence rather than override the naming hint.
    if (byName.length === 0 && memberNames.size < MIN_USAGE_SIGNATURE_MEMBERS) {
      const lower = identifierName.toLowerCase();
      const namedIntentionally =
        CONVENTIONAL_IDENTIFIER_ALIASES.has(lower) ||
        candidates.some((c) => c.name.toLowerCase() === lower);
      if (namedIntentionally) return [];
    }
  }

  // Below-minimum signatures that are still ambiguous (no unique name match)
  // stay silent — e.g. an unnamed/`obj` parameter that only touches `.profile`.
  if (memberNames.size < MIN_USAGE_SIGNATURE_MEMBERS && matches.length > 1) return [];

  const frequency = buildMemberFrequency(candidates);
  const scored = matches.map((m) => ({
    candidate: m,
    score: distinctivenessScore(memberNames, frequency),
  }));
  const bestScore = Math.max(...scored.map((s) => s.score));
  // Floating-point slack: weights are small rationals; equality is fine in
  // practice but a tiny epsilon keeps ranking stable if a future weight isn't.
  const topTier = scored.filter((s) => bestScore - s.score < 1e-9).map((s) => s.candidate);
  const minSize = Math.min(...topTier.map((m) => m.memberNames.size));
  const tightest = topTier.filter((m) => m.memberNames.size === minSize);
  if (tightest.length > MAX_USAGE_MATCH_CANDIDATES) return [];
  return tightest.map((m) => m.type);
}
