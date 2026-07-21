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

import {MAX_USAGE_MATCH_CANDIDATES, MIN_USAGE_SIGNATURE_MEMBERS} from './constants';
import type {InferenceContext} from './context';

interface AmbientClassCandidate {
  readonly type: tsserver.Type;
  readonly memberNames: ReadonlySet<string>;
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
 * Indexes every top-level class/interface declared in a `.d.ts` file visible
 * to the program (the vendored dw.* Script API, plus whatever else a
 * project's ambient types pull in) by its full member-name set, so
 * {@link matchAmbientTypesByUsage} can look candidates up by shape.
 *
 * Generic classes (e.g. `Product<T>`) are skipped: their declared type here
 * is the unsubstituted generic (`Product<T>`, not `Product<any>`), which
 * would render misleadingly in hover text with no real instantiation context
 * to substitute from.
 */
function buildAmbientClassIndex(ctx: InferenceContext): AmbientClassCandidate[] {
  const cached = classIndexCache.get(ctx.languageService);
  if (cached) return cached;
  const {ts, checker} = ctx;
  const candidates: AmbientClassCandidate[] = [];
  for (const sourceFile of ctx.program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) continue;
    for (const stmt of sourceFile.statements) {
      const isClassOrInterface = ts.isClassDeclaration(stmt) || ts.isInterfaceDeclaration(stmt);
      if (!isClassOrInterface || !stmt.name || (stmt.typeParameters?.length ?? 0) > 0) continue;
      const symbol = checker.getSymbolAtLocation(stmt.name);
      if (!symbol) continue;
      const type = checker.getDeclaredTypeOfSymbol(symbol);
      const memberNames = new Set<string>();
      for (const prop of checker.getPropertiesOfType(type)) {
        memberNames.add(prop.getName());
      }
      if (memberNames.size === 0) continue;
      candidates.push({type, memberNames});
    }
  }
  classIndexCache.set(ctx.languageService, candidates);
  return candidates;
}

/**
 * Collects the names of every member accessed directly on whatever `symbol`
 * identifies, anywhere in `scope` (including inside nested closures — a
 * `Transaction.wrap(function () {...})` callback still reads/writes an outer
 * parameter or variable it closes over). Only direct `x.member` accesses
 * count; a chained `x.custom.fromStoreId` only contributes `custom` — the
 * deeper hop describes `custom`'s shape, not `x`'s.
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
 * all of them, most-specific first. "Most specific" means fewest total
 * members — the tightest-fitting shape, not just any superset. Returns `[]`
 * when the signature is too weak to be worth guessing from (see
 * MIN_USAGE_SIGNATURE_MEMBERS) or when it still ties across too many
 * unrelated candidates to be a useful hint (MAX_USAGE_MATCH_CANDIDATES).
 *
 * Exception: a signature below MIN_USAGE_SIGNATURE_MEMBERS is still trusted
 * when it's globally unambiguous — exactly one ambient class in the whole
 * program declares all of these members at all (not just tied for
 * "tightest"). A member name that's this rare is as strong a signal as a
 * multi-member signature; a signature that's both weak AND ambiguous is what
 * MIN_USAGE_SIGNATURE_MEMBERS exists to filter out.
 */
export function matchAmbientTypesByUsage(ctx: InferenceContext, memberNames: ReadonlySet<string>): tsserver.Type[] {
  if (memberNames.size === 0) return [];
  const candidates = buildAmbientClassIndex(ctx);
  const matches = candidates.filter((candidate) => {
    for (const name of memberNames) {
      if (!candidate.memberNames.has(name)) return false;
    }
    return true;
  });
  if (matches.length === 0) return [];
  if (memberNames.size < MIN_USAGE_SIGNATURE_MEMBERS && matches.length > 1) return [];
  const minSize = Math.min(...matches.map((m) => m.memberNames.size));
  const tightest = matches.filter((m) => m.memberNames.size === minSize);
  if (tightest.length > MAX_USAGE_MATCH_CANDIDATES) return [];
  return tightest.map((m) => m.type);
}
