/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// The blank line above keeps the license header detached from the type-only
// import below it: tsc elides a type-only import together with any comment
// attached to it, so without the separation the emitted plugin/ JS would ship
// without its license header.
import type tsserver from 'typescript/lib/tsserverlibrary';

// Bounds how far we chase an undocumented call chain (helper calls helper calls
// helper...) before giving up. Keeps worst-case cost predictable regardless of
// how deep a cartridge's helper stack goes.
const MAX_INFERENCE_DEPTH = 3;

// Bounds how many indirection hops (require() binding -> destructuring ->
// renamed re-export, etc.) collectCallSites() will follow from a reference
// before giving up on finding an actual call site.
const MAX_REFERENCE_HOPS = 2;

// Hard cap on how many reference-search hits collectCallSites() will process
// across a single top-level inference request (not just one call site) —
// bounds worst-case cost for a helper referenced from dozens of places,
// complementing MAX_INFERENCE_DEPTH's cap on recursion depth. Generous enough
// to cover realistic cartridge helper usage without being effectively
// unlimited. Note what this does and doesn't bound: it caps how many results
// get processed and how far the search fans out, but a single
// getReferencesAtPosition call still scans the whole program regardless — on
// a large project the dominant cost is that first search, and the real bound
// on it is TS's own cooperative cancellation (rethrown, never swallowed, by
// the plugin's `guarded` wrapper).
const MAX_REFERENCES_PER_REQUEST = 200;

// Caps how much of that shared request-wide budget a *single* collectCallSites
// call can spend, so one widely-referenced sub-helper (e.g. reached from the
// first of several sibling return statements or call-site arguments) can't
// exhaust the whole budget and starve the others processed later in the same
// request.
const MAX_REFERENCES_PER_CALL = 50;

// Bounds how many `.method()` hops resolveExpressionTypes() will chase within
// a single static method-chain expression (e.g. `a.b().c().d()`). This is
// separate from MAX_INFERENCE_DEPTH, which only bounds crossing into another
// undocumented helper's own return-type inference — an in-expression chain
// never crosses a function boundary, so without its own cap it would be
// bounded only by how long an expression a cartridge author (or a generated
// file) happens to write, not by a predictable cost.
const MAX_CHAIN_HOPS = 10;

// Bounds how many cartridge levels the superModule member walk descends
// (top overlay -> mid overlay -> ... -> base). Real cartridge paths rarely
// stack more than three or four overlays of the same module.
const MAX_SUPERMODULE_HOPS = 8;

// Hard cap on how many getReferencesAtPosition SEARCHES one top-level request
// may issue. This is a different axis from MAX_REFERENCES_PER_REQUEST, which
// only bounds how many search *results* get processed: every search is a full
// project scan even when it returns almost nothing, so a helper whose call
// sites feed it results of many DISTINCT sub-helpers (each searched once,
// each contributing only 2-3 results) drains the result budget at ~2-3 per
// search — measured at 76 scans ≈ 115ms for a single hover on an SFRA-sized
// program (~1,900 cartridge files) before this cap existed. Legitimate
// scenarios in the perf baseline suite need at most 6 searches; 12 doubles
// that headroom while keeping the worst case at ~12 scans per request.
const MAX_SEARCHES_PER_REQUEST = 12;

export const INFERRED_COMPLETION_SOURCE = '@salesforce/b2c-script-types/inferred-usage';

interface MemoEntry {
  /**
   * The `depth` this was computed at — i.e. how much of the recursion budget
   * had already been spent getting here. A result computed at an equal-or-
   * shallower depth (equal-or-more remaining budget) is always safe to reuse
   * for a request now at an equal-or-deeper depth, since more budget can only
   * surface the same types or more, never fewer.
   */
  readonly atDepth: number;
  readonly types: tsserver.Type[];
}

export interface InferenceContext {
  readonly ts: typeof tsserver;
  readonly program: tsserver.Program;
  readonly checker: tsserver.TypeChecker;
  readonly languageService: tsserver.LanguageService;
  /**
   * Recursion guard for the current inference request only (cleared as the
   * call stack unwinds) — NOT a cross-request memoization cache. It exists
   * solely to break cycles like `function a(){return b()} function b(){return a()}`.
   */
  readonly visiting: Set<tsserver.Node>;
  /**
   * Request-scoped memoization so sibling branches (e.g. several return
   * statements or call-site arguments that all resolve through the same
   * undocumented sub-helper) don't redo the same reference search and
   * recursive inference repeatedly within one hover/completion request.
   */
  readonly memo: Map<tsserver.Node, MemoEntry>;
  /**
   * Mutable, shared across the whole request — decremented by
   * collectCallSites() every time it processes a reference.
   */
  referenceBudget: number;
  /**
   * Mutable, shared across the whole request — decremented by
   * collectCallSites() every time it issues a getReferencesAtPosition call
   * (a full project scan each). See MAX_SEARCHES_PER_REQUEST for why this
   * needs its own budget alongside the result-count one.
   */
  searchBudget: number;
  /**
   * Request-scoped memo of collectCallSites() results, keyed by the searched
   * name node. Two different parameters of the same function (or two return
   * paths reaching the same parameter set) otherwise each re-run the exact
   * same reference searches within one request. Reuse is sound because the
   * budgets only ever decrease during a request: a memoized result was
   * computed with at least as much budget as any later call would have had,
   * so it can only be equally or more complete.
   */
  readonly callSiteMemo: Map<tsserver.Identifier, tsserver.CallExpression[]>;
  /**
   * Request-scoped memo of checker.typeToString() results, used by
   * dedupeTypes(). Candidate types propagate up through every recursion
   * level (parameter -> return -> forwarding helper -> ...), and each level
   * dedupes its combined result — without the memo the same Type objects get
   * re-stringified once per level (measured: 192 stringifications for 48
   * unique candidate types, 13ms of a 34ms request, when 50 call sites pass
   * large distinct object literals through a two-hop forwarding chain).
   * Stringifying a type is pure for a given checker, and the context never
   * outlives its checker, so memoizing per request is sound.
   */
  readonly typeDisplayStrings: Map<tsserver.Type, string>;
  /**
   * Mutable, shared across the whole request — incremented every time a
   * cycle guard fires (a `visiting` hit). A result computed while this moved
   * is potentially incomplete *for this call stack only* (the cycle member it
   * skipped could resolve fine from a different entry point later in the same
   * request), so such results must not be memoized — see inferReturnType.
   */
  cycleHits: number;
  /**
   * Maps a cartridge file to the same-subpath file in the next cartridge
   * down the cartridge path — the module `module.superModule` refers to at
   * runtime. Supplied by the plugin host (which owns the cartridge order);
   * without it, `module.superModule` expressions stay uninferred.
   */
  readonly resolveSuperModulePath?: (containingFile: string) => string | undefined;
}

/**
 * Builds a fresh inference context for one top-level hover/completion
 * request, or `undefined` if the language service has no program yet.
 */
export function createInferenceContext(
  ts: typeof tsserver,
  languageService: tsserver.LanguageService,
  resolveSuperModulePath?: (containingFile: string) => string | undefined,
): InferenceContext | undefined {
  const program = languageService.getProgram();
  if (!program) return undefined;
  return {
    ts,
    program,
    checker: program.getTypeChecker(),
    languageService,
    visiting: new Set(),
    memo: new Map(),
    referenceBudget: MAX_REFERENCES_PER_REQUEST,
    searchBudget: MAX_SEARCHES_PER_REQUEST,
    callSiteMemo: new Map(),
    typeDisplayStrings: new Map(),
    cycleHits: 0,
    resolveSuperModulePath,
  };
}

/** True when `type` is (or includes) `any` — the signal that the checker gave up and usage inference should try to help. */
export function isAnyType(ts: typeof tsserver, type: tsserver.Type): boolean {
  return (type.flags & ts.TypeFlags.Any) !== 0;
}

/**
 * Finds the most specific node whose span contains `pos`. Standard technique
 * built only on public Node/forEachChild APIs — deliberately avoids TS's
 * internal (unversioned) getTokenAtPosition helper.
 *
 * The walk stops scanning a sibling list as soon as it passes `pos`
 * (forEachChild aborts when the callback returns truthy, and siblings are
 * ordered and non-overlapping). Without that, every call in a file whose
 * top-level (or any enclosing) node has thousands of children — a generated
 * data file with an 8,000-element array literal, say — pays for the full
 * child list on every one of the up-to-50 reference hits collectCallSites()
 * resolves in that file.
 */
export function getNodeAtPosition(
  sourceFile: tsserver.SourceFile,
  ts: typeof tsserver,
  pos: number,
): tsserver.Node | undefined {
  let result: tsserver.Node | undefined;
  const visit = (node: tsserver.Node): boolean | undefined => {
    if (pos < node.getStart(sourceFile)) return true; // walked past pos — later siblings can't contain it
    if (pos >= node.getEnd()) return undefined; // before pos — keep scanning this sibling list
    result = node;
    ts.forEachChild(node, visit);
    return true; // containing child handled — siblings don't overlap
  };
  visit(sourceFile);
  return result;
}

/** Walks up from `node` to the nearest enclosing PropertyAccessExpression, or `undefined` if there isn't one. */
export function findEnclosingPropertyAccess(
  node: tsserver.Node,
  ts: typeof tsserver,
): tsserver.PropertyAccessExpression | undefined {
  let current: tsserver.Node | undefined = node;
  while (current) {
    if (ts.isPropertyAccessExpression(current)) return current;
    current = current.parent;
  }
  return undefined;
}

/**
 * Identifies the name to run findReferences on for a function-like
 * declaration that itself has no `name` (the common CommonJS shapes:
 * `const foo = function(){}`, `{foo: function(){}}`, `{foo(){}}`,
 * `exports.foo = function(){}`, `module.exports = function(){}`).
 */
function getReferenceNameNode(fn: tsserver.SignatureDeclaration, ts: typeof tsserver): tsserver.Identifier | undefined {
  if (ts.isFunctionDeclaration(fn) && fn.name) return fn.name;
  if (ts.isMethodDeclaration(fn) && ts.isIdentifier(fn.name)) return fn.name;
  const parent = fn.parent;
  if (!parent) return undefined;
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name;
  if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) return parent.name;
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const left = parent.left;
    // `module.exports = function(){}` / `exports.foo = function(){}` — the
    // `.name` identifier (`exports` or `foo`) is what findReferences can
    // actually track; for the bare `module.exports` case this resolves to
    // the whole module's value, so callers reach it via collectCallSites()'s
    // require() indirection rather than a direct property-access call.
    if (ts.isPropertyAccessExpression(left) && ts.isIdentifier(left.name)) return left.name;
    if (ts.isIdentifier(left)) return left;
  }
  return undefined;
}

/**
 * Given a reference identifier (`helper` in either `helper(x)` or
 * `exports.helper(x)`/`obj.helper(x)`), finds the enclosing CallExpression if
 * the identifier sits in callee position — one parent up for a direct call,
 * two parents up when the identifier is the `.name` of a property access.
 */
function findCallInCalleePosition(node: tsserver.Node, ts: typeof tsserver): tsserver.CallExpression | undefined {
  const parent = node.parent;
  if (!parent) return undefined;
  if (ts.isCallExpression(parent) && parent.expression === node) return parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    const grandparent = parent.parent;
    if (grandparent && ts.isCallExpression(grandparent) && grandparent.expression === parent) return grandparent;
  }
  return undefined;
}

/**
 * A `require('specifier')` call, identified structurally (only public
 * AST-node-kind checks — `ts.isRequireCall` exists at runtime but isn't part
 * of TypeScript's public API surface, so isn't safe to depend on here).
 */
function isRequireCallExpression(node: tsserver.Node, ts: typeof tsserver): node is tsserver.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'require' &&
    node.arguments.length > 0 &&
    ts.isStringLiteralLike(node.arguments[0])
  );
}

/**
 * When a reference to our function's name doesn't sit directly in callee
 * position, it may still be one hop away from a real call site through a
 * binding indirection: the module specifier of a `require(...)` call whose
 * result is assigned to a variable (`var helper = require('./helper')`), or
 * a destructuring binding element (`const {helper} = require(...)` or
 * `const {helper: local} = someObject`).
 *
 * @returns Either the further name to search references for, or — for an
 * immediately-invoked require (`require('./helper')(x)`) — the call site itself.
 */
function resolveIndirectReferenceTarget(
  node: tsserver.Node,
  ts: typeof tsserver,
): {kind: 'call'; call: tsserver.CallExpression} | {kind: 'name'; name: tsserver.Identifier} | undefined {
  const parent = node.parent;
  if (!parent) return undefined;

  if (ts.isCallExpression(parent) && parent.arguments[0] === node && isRequireCallExpression(parent, ts)) {
    const requireCall = parent;
    const outer = requireCall.parent;
    if (outer && ts.isCallExpression(outer) && outer.expression === requireCall) {
      return {kind: 'call', call: outer}; // require('./helper')(x)
    }
    if (outer && ts.isVariableDeclaration(outer) && outer.initializer === requireCall && ts.isIdentifier(outer.name)) {
      return {kind: 'name', name: outer.name}; // var helper = require('./helper')
    }
    return undefined;
  }

  if (ts.isBindingElement(parent) && ts.isIdentifier(parent.name)) {
    // Covers both `{helper}` (shorthand — name and propertyName are the same
    // node) and `{helper: local}` (renamed — redirect to the local binding).
    return {kind: 'name', name: parent.name};
  }

  // `module.exports = {getSalePrice: getSalePrice}` — SFRA's canonical export
  // shape, an alias map from property name to a separately-declared function.
  // A reference search on the *function* name dead-ends at the alias-map
  // initializer; the actual consumers (`productHelpers.getSalePrice(x)` in
  // another file) are references of the property *name*, so redirect the
  // search there. Not scoped to module.exports specifically: any
  // `{run: helper}` alias whose property is later called is a genuine call
  // site of the aliased function.
  if (ts.isPropertyAssignment(parent) && parent.initializer === node && ts.isIdentifier(parent.name)) {
    return {kind: 'name', name: parent.name};
  }

  return undefined;
}

/**
 * Finds actual call sites for `nameNode`, following up to
 * MAX_REFERENCE_HOPS binding indirections (require() bindings, destructuring)
 * when a reference doesn't sit directly in callee position. Stops early once
 * ctx.referenceBudget (result count) or ctx.searchBudget (project scans) runs
 * out, returning whatever call sites were already found rather than
 * continuing to fan out — an under-inferred (but still heuristic,
 * clearly-labeled) result beats hanging on a widely-referenced helper.
 * Results are memoized per name node for the duration of the request.
 */
function collectCallSites(ctx: InferenceContext, nameNode: tsserver.Identifier): tsserver.CallExpression[] {
  const {ts, languageService, program} = ctx;
  const memoized = ctx.callSiteMemo.get(nameNode);
  if (memoized) return memoized;
  const calls: tsserver.CallExpression[] = [];
  const seenNameKeys = new Set<string>();
  let frontier: tsserver.Identifier[] = [nameNode];
  let localBudget = Math.min(MAX_REFERENCES_PER_CALL, ctx.referenceBudget);

  for (let hop = 0; hop <= MAX_REFERENCE_HOPS && frontier.length > 0 && localBudget > 0; hop++) {
    const nextFrontier: tsserver.Identifier[] = [];
    for (const name of frontier) {
      if (localBudget <= 0 || ctx.searchBudget <= 0) break;
      const sourceFile = name.getSourceFile();
      const key = `${sourceFile.fileName}:${name.getStart(sourceFile)}`;
      if (seenNameKeys.has(key)) continue;
      seenNameKeys.add(key);

      ctx.searchBudget--;
      const refs = languageService.getReferencesAtPosition(sourceFile.fileName, name.getStart(sourceFile)) ?? [];
      for (const ref of refs) {
        if (localBudget <= 0) break;
        localBudget--;
        ctx.referenceBudget--;
        const refFile = program.getSourceFile(ref.fileName);
        if (!refFile) continue;
        const node = getNodeAtPosition(refFile, ts, ref.textSpan.start);
        if (!node) continue;
        // Definition sites (the declaration itself) never sit in callee
        // position, so this also naturally excludes them.
        const call = findCallInCalleePosition(node, ts);
        if (call) {
          calls.push(call);
          continue;
        }
        const indirect = resolveIndirectReferenceTarget(node, ts);
        if (indirect?.kind === 'call') calls.push(indirect.call);
        else if (indirect?.kind === 'name') nextFrontier.push(indirect.name);
      }
    }
    frontier = nextFrontier;
  }

  ctx.callSiteMemo.set(nameNode, calls);
  return calls;
}

/**
 * True when the developer already gave this parameter an explicit type — TS
 * syntax or JSDoc — even if that type is literally `any`. In that case the
 * checker's `any` reflects a deliberate choice, not an inference failure, so
 * usage inference must never second-guess it. Only genuinely implicit `any`
 * (no annotation at all) is fair game.
 */
function hasExplicitParameterType(param: tsserver.ParameterDeclaration, ts: typeof tsserver): boolean {
  return param.type !== undefined || ts.getJSDocType(param) !== undefined;
}

/** Same idea as {@link hasExplicitParameterType}, but for a function's return type. */
function hasExplicitReturnType(fn: tsserver.SignatureDeclaration, ts: typeof tsserver): boolean {
  return fn.type !== undefined || ts.getJSDocReturnType(fn) !== undefined;
}

/** Same idea as {@link hasExplicitParameterType}, but for a variable declaration (`var x = ...`). */
function hasExplicitVariableType(decl: tsserver.VariableDeclaration, ts: typeof tsserver): boolean {
  return decl.type !== undefined || ts.getJSDocType(decl) !== undefined;
}

/**
 * The SFCC `module.superModule` expression — the runtime handle to the
 * same-path module in the next cartridge down the cartridge path, which SFRA
 * plugin cartridges use to extend base modules. Identified structurally, like
 * the require() detection above.
 */
function isSuperModuleAccess(expr: tsserver.PropertyAccessExpression, ts: typeof tsserver): boolean {
  return ts.isIdentifier(expr.expression) && expr.expression.text === 'module' && expr.name.text === 'superModule';
}

/**
 * Locates the source file `module.superModule` refers to for `fromFileName`
 * — the same-subpath module in the next cartridge down the path, per the
 * host-supplied ctx.resolveSuperModulePath. Only works when that file is
 * part of the current program (true under the recommended jsconfig setup
 * that includes all cartridge files, but not in a bare inferred project
 * where nothing require()s the base file).
 */
function findSuperModuleFile(ctx: InferenceContext, fromFileName: string): tsserver.SourceFile | undefined {
  const {program} = ctx;
  if (!ctx.resolveSuperModulePath) return undefined;
  const superPath = ctx.resolveSuperModulePath(fromFileName);
  if (!superPath) return undefined;
  // The resolver returns host-normalized (possibly case-folded) paths;
  // program keys may differ in case on case-insensitive filesystems.
  const direct = program.getSourceFile(superPath);
  if (direct) return direct;
  const target = superPath.toLowerCase();
  return program.getSourceFiles().find((sf) => sf.fileName.toLowerCase() === target);
}

/**
 * A module's top-level export assignments, gathered structurally:
 * `full` — every `module.exports = X` right-hand side;
 * `members` — every `module.exports.<name> = X` / `exports.<name> = X`
 * augmentation, the shape SFRA plugin overlays use to add helpers on top of
 * a re-exported base (`module.exports = base; module.exports.extra = extra;`).
 */
function collectExportAssignments(
  sf: tsserver.SourceFile,
  ts: typeof tsserver,
): {full: tsserver.BinaryExpression[]; members: Array<{name: string; expr: tsserver.Expression}>} {
  const full: tsserver.BinaryExpression[] = [];
  const members: Array<{name: string; expr: tsserver.Expression}> = [];
  for (const stmt of sf.statements) {
    if (!ts.isExpressionStatement(stmt) || !ts.isBinaryExpression(stmt.expression)) continue;
    const bin = stmt.expression;
    if (bin.operatorToken.kind !== ts.SyntaxKind.EqualsToken) continue;
    const left = bin.left;
    if (!ts.isPropertyAccessExpression(left)) continue;
    const base = left.expression;
    if (ts.isIdentifier(base) && base.text === 'module' && left.name.text === 'exports') {
      full.push(bin);
    } else if (ts.isIdentifier(base) && base.text === 'exports') {
      members.push({name: left.name.text, expr: bin.right});
    } else if (
      ts.isPropertyAccessExpression(base) &&
      ts.isIdentifier(base.expression) &&
      base.expression.text === 'module' &&
      base.name.text === 'exports'
    ) {
      members.push({name: left.name.text, expr: bin.right});
    }
  }
  return {full, members};
}

/**
 * True when a `module.exports = X` assignment gives the checker a genuinely
 * usable exports type: not `any`, and actually exposing members. A
 * pass-through overlay (`module.exports = base` where base came from
 * `module.superModule`) fails this — depending on program shape the checker
 * reports its exports as `any` or as an opaque, member-less `typeof base` —
 * and must be resolved by recursing down the cartridge chain instead.
 */
function isConcreteExportAssignment(ctx: InferenceContext, bin: tsserver.BinaryExpression): boolean {
  const {ts, checker} = ctx;
  const exportsType = checker.getTypeAtLocation(bin.left);
  if (isAnyType(ts, exportsType)) return false;
  return checker.getPropertiesOfType(checker.getApparentType(exportsType)).length > 0;
}

/**
 * Resolves what `module.superModule` evaluates to: the export type(s) of the
 * same-subpath module in the next cartridge down the path. The checker's
 * type for the `module.exports` symbol is used when it's concrete — it
 * merges the assigned object with any later `module.exports.name = fn`
 * augmentations. For a pass-through overlay (`module.exports = base` where
 * base is itself `module.superModule`), the right-hand side is resolved via
 * resolveExpressionTypes instead, which recurses naturally another cartridge
 * down; members such a pass-through level *adds* can't be merged into these
 * candidate types — they're handled separately by
 * {@link resolveSuperModuleMemberTypes} and
 * {@link collectSuperModuleAugmentedMembers}.
 */
function resolveSuperModuleTypes(
  ctx: InferenceContext,
  expr: tsserver.PropertyAccessExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const superFile = findSuperModuleFile(ctx, expr.getSourceFile().fileName);
  if (!superFile) return [];
  // Guard against overlay cycles (two cartridges whose modules somehow point
  // at each other through a misconfigured cartridge path).
  if (ctx.visiting.has(superFile)) {
    ctx.cycleHits++;
    return [];
  }
  ctx.visiting.add(superFile);
  try {
    const types: tsserver.Type[] = [];
    for (const bin of collectExportAssignments(superFile, ts).full) {
      const concrete = isConcreteExportAssignment(ctx, bin);
      if (concrete) {
        types.push(widenType(checker, checker.getTypeAtLocation(bin.left)));
      }
      // A pass-through assignment (`module.exports = base` where base is
      // this level's own module.superModule) needs the RHS recursed even
      // when the left-hand type looked concrete: the checker sometimes
      // merges this level's augmentations into an opaque `typeof base` type
      // that still carries none of the deeper cartridges' members.
      if (!concrete || traceSuperModuleAccess(ts, checker, bin.right)) {
        types.push(...resolveExpressionTypes(ctx, bin.right, depth, chainHops + 1));
      }
    }
    return dedupeTypes(ctx, types);
  } finally {
    ctx.visiting.delete(superFile);
  }
}

/**
 * Follows `expr` back to a `module.superModule` access if there is one: the
 * expression itself, or — the universal SFRA idiom — a reference to a local
 * `var base = module.superModule;` binding. Exported so the plugin's
 * hover/completion gates can recognize superModule-derived expressions: the
 * checker's own type for them is never meaningful (sometimes `any`,
 * sometimes an opaque circular `typeof base`), so "is the type any?" alone
 * would skip inference exactly where it's needed.
 */
export function traceSuperModuleAccess(
  ts: typeof tsserver,
  checker: tsserver.TypeChecker,
  expr: tsserver.Expression,
): tsserver.PropertyAccessExpression | undefined {
  if (ts.isPropertyAccessExpression(expr) && isSuperModuleAccess(expr, ts)) return expr;
  if (ts.isIdentifier(expr)) {
    const decl = checker.getSymbolAtLocation(expr)?.valueDeclaration;
    if (
      decl &&
      ts.isVariableDeclaration(decl) &&
      decl.initializer &&
      ts.isPropertyAccessExpression(decl.initializer) &&
      isSuperModuleAccess(decl.initializer, ts)
    ) {
      return decl.initializer;
    }
  }
  return undefined;
}

/**
 * Walks the superModule chain of the file containing `superAccess`, one
 * cartridge level at a time, and resolves `memberName` from the first level
 * that provides it as an export augmentation (`module.exports.name = fn`).
 * This is the complement to {@link resolveSuperModuleTypes}: members a
 * pass-through overlay level *adds* live only in these assignments, not in
 * any candidate type. A level whose `module.exports` type is concrete ends
 * the walk (matching runtime semantics — a concrete re-assignment replaces
 * everything below unless it deliberately carries the base along).
 */
function resolveSuperModuleMemberTypes(
  ctx: InferenceContext,
  superAccess: tsserver.PropertyAccessExpression,
  memberName: string,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const seen = new Set<tsserver.SourceFile>();
  let fromFileName = superAccess.getSourceFile().fileName;
  for (let hop = 0; hop < MAX_SUPERMODULE_HOPS; hop++) {
    const superFile = findSuperModuleFile(ctx, fromFileName);
    if (!superFile || seen.has(superFile)) return [];
    seen.add(superFile);
    const {full, members} = collectExportAssignments(superFile, ts);
    const matches = members.filter((m) => m.name === memberName);
    if (matches.length > 0) {
      const types: tsserver.Type[] = [];
      for (const m of matches) {
        types.push(...resolveExpressionTypes(ctx, m.expr, depth, chainHops + 1).filter((t) => !isAnyType(ts, t)));
      }
      return dedupeTypes(ctx, types);
    }
    // No augmentation at this level: continue downward only through a
    // pass-through (`module.exports = <any>`); a concrete export either
    // already carries the member (the type-based lookup found it) or
    // genuinely replaces the levels below.
    const passesThrough = full.some(
      (bin) => !isConcreteExportAssignment(ctx, bin) || traceSuperModuleAccess(ts, checker, bin.right) !== undefined,
    );
    if (!passesThrough) return [];
    fromFileName = superFile.fileName;
  }
  return [];
}

/**
 * Collects every member the superModule chain reachable from `expr`
 * contributes through export augmentations (`module.exports.name = fn`) at
 * pass-through levels — the members {@link resolveSuperModuleTypes}'s
 * candidate types cannot carry. Used to complete after `base.` in an
 * overlay; the first (highest) level defining a name wins, matching runtime
 * override order.
 */
export function collectSuperModuleAugmentedMembers(
  ctx: InferenceContext,
  expr: tsserver.Expression,
): Array<{name: string; isMethod: boolean}> {
  const {ts, checker} = ctx;
  const superAccess = traceSuperModuleAccess(ts, checker, expr);
  if (!superAccess) return [];
  const out: Array<{name: string; isMethod: boolean}> = [];
  const seenNames = new Set<string>();
  const seenFiles = new Set<tsserver.SourceFile>();
  let fromFileName = superAccess.getSourceFile().fileName;
  for (let hop = 0; hop < MAX_SUPERMODULE_HOPS; hop++) {
    const superFile = findSuperModuleFile(ctx, fromFileName);
    if (!superFile || seenFiles.has(superFile)) break;
    seenFiles.add(superFile);
    const {full, members} = collectExportAssignments(superFile, ts);
    for (const m of members) {
      if (seenNames.has(m.name)) continue;
      seenNames.add(m.name);
      const type = checker.getTypeAtLocation(m.expr);
      out.push({name: m.name, isMethod: type.getCallSignatures().length > 0});
    }
    const passesThrough = full.some(
      (bin) => !isConcreteExportAssignment(ctx, bin) || traceSuperModuleAccess(ts, checker, bin.right) !== undefined,
    );
    if (!passesThrough) break;
    fromFileName = superFile.fileName;
  }
  return out;
}

/**
 * Chases a local variable's initializer expression — the missing link for the
 * idiomatic SFCC style of splitting a chain across intermediate variables
 * (`var priceModel = product.getPriceModel(); return priceModel.getPrice();`),
 * which would otherwise dead-end at the variable reference even though the
 * exact same logic written inline resolves fine.
 *
 * Guarded three ways: an explicit type/JSDoc annotation on the variable means
 * its `any` is deliberate (same rule as parameters/returns); the `visiting`
 * set breaks initializer cycles (`var a = b; var b = a;`) and records the hit
 * in ctx.cycleHits; and the hop is charged to `chainHops` — following a
 * variable never crosses a function boundary, so it's an in-expression hop,
 * not a recursion-depth step.
 */
function resolveVariableInitializerTypes(
  ctx: InferenceContext,
  decl: tsserver.VariableDeclaration,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts} = ctx;
  if (!decl.initializer || hasExplicitVariableType(decl, ts)) return [];
  if (ctx.visiting.has(decl)) {
    ctx.cycleHits++;
    return [];
  }
  ctx.visiting.add(decl);
  try {
    return resolveExpressionTypes(ctx, decl.initializer, depth, chainHops);
  } finally {
    ctx.visiting.delete(decl);
  }
}

/**
 * Resolves the function-like declaration a call expression's callee refers
 * to, via its symbol or — as a fallback for shapes the symbol lookup misses
 * — the checker's resolved signature.
 */
function resolveCalleeDeclaration(
  ctx: InferenceContext,
  call: tsserver.CallExpression,
): tsserver.SignatureDeclaration | undefined {
  const {checker, ts} = ctx;
  const sym = checker.getSymbolAtLocation(call.expression);
  const decl = sym?.valueDeclaration ?? sym?.declarations?.[0];
  if (decl && ts.isFunctionLike(decl)) return decl;
  const sig = checker.getResolvedSignature(call);
  const sigDecl = sig?.declaration;
  if (sigDecl && ts.isFunctionLike(sigDecl)) return sigDecl;
  return undefined;
}

/**
 * Widens a literal type (e.g. the string literal type of `"hello"`) to its
 * general primitive type, so hover text shows `string` rather than a union
 * of every literal argument ever passed to a helper.
 */
function widenType(checker: tsserver.TypeChecker, type: tsserver.Type): tsserver.Type {
  return checker.getBaseTypeOfLiteralType(type);
}

/** checker.typeToString memoized per request — see InferenceContext.typeDisplayStrings. */
function typeDisplayString(ctx: InferenceContext, type: tsserver.Type): string {
  const cached = ctx.typeDisplayStrings.get(type);
  if (cached !== undefined) return cached;
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
function dedupeTypes(ctx: InferenceContext, types: tsserver.Type[]): tsserver.Type[] {
  const seen = new Set<string>();
  const out: tsserver.Type[] = [];
  for (const t of types) {
    const key = typeDisplayString(ctx, t);
    if (seen.has(key)) continue;
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
function getNonNullableApparentType(checker: tsserver.TypeChecker, type: tsserver.Type): tsserver.Type {
  return checker.getApparentType(checker.getNonNullableType(type));
}

/** Looks up a member by name on `type`'s non-nullable apparent type — see {@link getNonNullableApparentType}. */
function getMemberOfType(
  checker: tsserver.TypeChecker,
  type: tsserver.Type,
  name: string,
): tsserver.Symbol | undefined {
  return checker.getPropertyOfType(getNonNullableApparentType(checker, type), name);
}

/**
 * Resolves the candidate type(s) of `expr`. If the checker settles on `any`
 * and `expr` is itself a call to a function we can analyze, recurses into
 * that function's inferred return type(s) instead of accepting the `any`.
 *
 * @param chainHops - how many `.method()`/`.prop` hops within the *same*
 * static expression have already been chased (e.g. the `2` in
 * `a.b().c().d()` when resolving `d`'s receiver `a.b().c()`). This is
 * distinct from `depth`, which only advances when crossing into another
 * undocumented helper's own return-type inference — chain-hopping never
 * crosses a function boundary, so it needs its own bound
 * (`MAX_CHAIN_HOPS`) to keep worst-case cost predictable for a very long
 * inline method chain.
 * @returns An array (rather than a single unioned Type) because the public
 * TypeChecker API exposed via tsserverlibrary has no way to synthesize a
 * union Type — callers merge candidates for display/completions themselves.
 */
function resolveExpressionTypes(
  ctx: InferenceContext,
  expr: tsserver.Expression,
  depth: number,
  chainHops = 0,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  // module.superModule (or a `var base = module.superModule` alias) first,
  // BEFORE trusting the checker's direct type: TS knows nothing about SFCC
  // overlay semantics, and its type for these expressions is never
  // meaningful — sometimes `any`, sometimes an opaque circular `typeof
  // base` that would wrongly satisfy the not-any short-circuit below.
  const superAccessAtRoot = traceSuperModuleAccess(ts, checker, expr);
  if (superAccessAtRoot) {
    return resolveSuperModuleTypes(ctx, superAccessAtRoot, depth, chainHops);
  }
  const direct = checker.getTypeAtLocation(expr);
  if (!isAnyType(ts, direct)) return [widenType(checker, direct)];
  if (chainHops >= MAX_CHAIN_HOPS) return [];
  if (ts.isCallExpression(expr)) {
    const calleeFn = resolveCalleeDeclaration(ctx, expr);
    if (calleeFn) {
      const inferred = inferReturnType(ctx, calleeFn, depth + 1);
      if (inferred.length > 0) return inferred;
    }
    if (ts.isPropertyAccessExpression(expr.expression)) {
      // `expr` (e.g. `x.getPriceModel().getPrice()`) is `any` because the
      // receiver's own base is undocumented — resolveCalleeDeclaration can't
      // find a real declaration since the checker never got far enough to
      // resolve the method itself. Infer the receiver's type first (recursing
      // through as many chained calls/property accesses as it takes to reach
      // an untyped parameter or undocumented helper), then look up this
      // method by name on that resolved type's real, documented signature(s).
      const methodAccess = expr.expression;
      const methodName = methodAccess.name.text;
      const returnTypes: tsserver.Type[] = [];
      const pushSignatureReturns = (methodType: tsserver.Type) => {
        for (const sig of methodType.getCallSignatures()) {
          const returnType = checker.getReturnTypeOfSignature(sig);
          if (!isAnyType(ts, returnType)) {
            returnTypes.push(widenType(checker, returnType));
            continue;
          }
          // The member resolved but its own return type is `any` — the
          // superModule case, where the base module's export type carries an
          // undocumented function. `any` is never a useful candidate to
          // surface; recurse into the function's actual declaration instead,
          // the same fallback resolveCalleeDeclaration provides for direct
          // calls.
          const sigDecl = sig.declaration;
          if (sigDecl && ts.isFunctionLike(sigDecl)) {
            returnTypes.push(...inferReturnType(ctx, sigDecl, depth + 1));
          }
        }
      };
      for (const receiverType of resolveExpressionTypes(ctx, methodAccess.expression, depth, chainHops + 1)) {
        const methodSymbol = getMemberOfType(checker, receiverType, methodName);
        if (!methodSymbol) continue;
        pushSignatureReturns(checker.getTypeOfSymbolAtLocation(methodSymbol, methodAccess.name));
      }
      if (returnTypes.length === 0) {
        // No candidate type carried this method — but if the receiver is (an
        // alias of) module.superModule, the method may be an export
        // *augmentation* added by a pass-through overlay level, which no
        // candidate type can carry.
        const superAccess = traceSuperModuleAccess(ts, checker, methodAccess.expression);
        if (superAccess) {
          for (const memberType of resolveSuperModuleMemberTypes(ctx, superAccess, methodName, depth, chainHops)) {
            pushSignatureReturns(memberType);
          }
        }
      }
      if (returnTypes.length > 0) return dedupeTypes(ctx, returnTypes);
    }
  } else if (ts.isPropertyAccessExpression(expr)) {
    // `expr` (e.g. `x.ID`) is `any` because its base is itself undocumented
    // (an untyped parameter, say) — infer the base's type first, then look
    // up this specific property on it, rather than giving up on the whole
    // access just because the access itself resolved to `any`.
    const propName = expr.name.text;
    const propTypes: tsserver.Type[] = [];
    for (const baseType of resolveExpressionTypes(ctx, expr.expression, depth, chainHops + 1)) {
      const propSymbol = getMemberOfType(checker, baseType, propName);
      if (!propSymbol) continue;
      const propType = checker.getTypeOfSymbolAtLocation(propSymbol, expr);
      // An `any`-typed member (e.g. an untyped value in an exports map) is
      // never a useful candidate — surfacing "Inferred from usage: any"
      // would be worse than staying quiet.
      if (!isAnyType(ts, propType)) propTypes.push(widenType(checker, propType));
    }
    if (propTypes.length === 0) {
      // Mirror of the method-chain fallback above: the property may be an
      // export augmentation added by a pass-through superModule overlay.
      const superAccess = traceSuperModuleAccess(ts, checker, expr.expression);
      if (superAccess) {
        propTypes.push(
          ...resolveSuperModuleMemberTypes(ctx, superAccess, propName, depth, chainHops).map((t) =>
            widenType(checker, t),
          ),
        );
      }
    }
    if (propTypes.length > 0) return dedupeTypes(ctx, propTypes);
  } else if (ts.isIdentifier(expr)) {
    // `expr` is itself an undocumented parameter reference (e.g. a helper
    // that just returns/forwards one of its own params) — chase that
    // parameter's inferred type too, rather than stopping at `any`.
    const sym = checker.getSymbolAtLocation(expr);
    const decl = sym?.valueDeclaration;
    if (decl && ts.isParameter(decl)) {
      const inferred = inferParameterType(ctx, decl, depth + 1);
      if (inferred.length > 0) return inferred;
    } else if (decl && ts.isVariableDeclaration(decl)) {
      // ...or a local variable holding an intermediate result — chase its
      // initializer the same way, so splitting a chain across `var`
      // statements infers exactly like the inline expression would.
      const inferred = resolveVariableInitializerTypes(ctx, decl, depth, chainHops + 1);
      if (inferred.length > 0) return inferred;
    }
  }
  return [];
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
function collectionElementType(
  ctx: InferenceContext,
  type: tsserver.Type,
  location: tsserver.Node,
): tsserver.Type | undefined {
  const {ts, checker} = ctx;
  const firstCallReturn = (t: tsserver.Type, memberName: string): tsserver.Type | undefined => {
    const sym = checker.getPropertyOfType(getNonNullableApparentType(checker, t), memberName);
    if (!sym) return undefined;
    const memberType = checker.getTypeOfSymbolAtLocation(sym, location);
    for (const sig of memberType.getCallSignatures()) {
      return checker.getReturnTypeOfSignature(sig);
    }
    return undefined;
  };
  const iteratorType = firstCallReturn(type, 'iterator') ?? type;
  const element = firstCallReturn(iteratorType, 'next');
  if (!element || isAnyType(ts, element)) return undefined;
  if (element.flags & (ts.TypeFlags.Void | ts.TypeFlags.Unknown | ts.TypeFlags.Never)) return undefined;
  return element;
}

/**
 * Infers the type of a callback's first parameter from sibling arguments of
 * the call the callback is passed to: `collections.forEach(coll, function
 * (item) {...})` — a function expression in argument position has no name to
 * run a reference search on, but the collection travelling alongside it
 * names the element type. Only the first parameter is mapped (SFRA's
 * collections util passes the element first), and `reduce`-style callees are
 * skipped since their callbacks lead with an accumulator instead.
 */
function inferCallbackParameterTypes(
  ctx: InferenceContext,
  fn: tsserver.SignatureDeclaration,
  paramIndex: number,
  depth: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  if (paramIndex !== 0) return [];
  const call = fn.parent;
  if (!call || !ts.isCallExpression(call) || !call.arguments.some((arg) => arg === fn)) return [];
  const calleeName = ts.isPropertyAccessExpression(call.expression)
    ? call.expression.name.text
    : ts.isIdentifier(call.expression)
      ? call.expression.text
      : undefined;
  if (calleeName === 'reduce') return [];
  const types: tsserver.Type[] = [];
  for (const arg of call.arguments) {
    if (arg === fn) continue;
    for (const argType of resolveExpressionTypes(ctx, arg, depth)) {
      const element = collectionElementType(ctx, argType, arg);
      if (element) types.push(widenType(checker, element));
    }
  }
  return types;
}

/**
 * Infers a parameter's candidate type(s) from the arguments it's actually
 * called with across the project, since plain un-annotated JS parameters
 * default to `any` with no back-inference from call sites.
 *
 * @param depth - Recursion budget already consumed by the call chain that
 * led here; defaults to 0 for a top-level request.
 */
export function inferParameterType(
  ctx: InferenceContext,
  param: tsserver.ParameterDeclaration,
  depth = 0,
): tsserver.Type[] {
  const {ts} = ctx;
  // Check the memo before the depth cap: a result already computed at an
  // equal-or-shallower depth is valid regardless of how deep the *current*
  // call is — it would be wrong to discard a known-good cached answer just
  // because this particular path to it happens to run over budget.
  const cached = ctx.memo.get(param);
  if (cached && cached.atDepth <= depth) return cached.types;
  if (depth > MAX_INFERENCE_DEPTH) return [];
  if (hasExplicitParameterType(param, ts)) return [];
  // Cycle guard: a self-forwarding helper (e.g. `function id(x){return x}`
  // called as `id(id(y))`) could otherwise re-enter inference for this same
  // parameter before the first call has finished and memoized its result.
  if (ctx.visiting.has(param)) {
    ctx.cycleHits++;
    return [];
  }
  ctx.visiting.add(param);
  const cycleHitsBefore = ctx.cycleHits;
  try {
    const fn = param.parent;
    if (!ts.isFunctionLike(fn)) return [];
    const paramIndex = fn.parameters.indexOf(param);
    if (paramIndex < 0) return [];

    const types: tsserver.Type[] = [];
    const nameNode = getReferenceNameNode(fn, ts);
    if (nameNode) {
      for (const call of collectCallSites(ctx, nameNode)) {
        const arg = call.arguments[paramIndex];
        if (!arg) continue;
        types.push(...resolveExpressionTypes(ctx, arg, depth));
      }
    } else {
      // No name to search references for — an anonymous callback passed
      // directly in argument position. Its element type may still be
      // recoverable from the collection argument travelling alongside it.
      types.push(...inferCallbackParameterTypes(ctx, fn, paramIndex, depth));
    }

    const result = dedupeTypes(ctx, types);
    // Don't memoize a result whose computation hit a cycle guard: it was
    // truncated by what happened to be on the *current* call stack, and the
    // same node queried later in this request from outside the cycle could
    // legitimately resolve more. (Depth-cap truncation, by contrast, IS
    // safely memoized — the atDepth field encodes exactly how truncated it
    // can be, and reuse is restricted accordingly.)
    if (ctx.cycleHits === cycleHitsBefore) {
      ctx.memo.set(param, {atDepth: depth, types: result});
    }
    return result;
  } finally {
    ctx.visiting.delete(param);
  }
}

/**
 * Recursively walks a function body collecting `return` expressions, without
 * descending into nested function-like boundaries (their returns belong to
 * them, not to `fn`).
 */
function collectReturnExpressions(fn: tsserver.SignatureDeclaration, ts: typeof tsserver): tsserver.Expression[] {
  if (ts.isArrowFunction(fn) && fn.body && !ts.isBlock(fn.body)) {
    return [fn.body];
  }
  const body = (fn as tsserver.FunctionLikeDeclaration).body;
  const out: tsserver.Expression[] = [];
  if (!body) return out;
  const visit = (n: tsserver.Node) => {
    if (ts.isFunctionLike(n) && n !== fn) return;
    if (ts.isReturnStatement(n) && n.expression) {
      out.push(n.expression);
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(body);
  return out;
}

/**
 * Infers a function's candidate return type(s) from its own return
 * statements, chasing into undocumented callees when a return expression
 * itself resolves to `any`.
 *
 * @param depth - Recursion budget already consumed by the call chain that
 * led here; defaults to 0 for a top-level request.
 */
export function inferReturnType(ctx: InferenceContext, fn: tsserver.SignatureDeclaration, depth = 0): tsserver.Type[] {
  const {ts} = ctx;
  // See inferParameterType for why the memo is checked before the depth cap.
  const cached = ctx.memo.get(fn);
  if (cached && cached.atDepth <= depth) return cached.types;
  if (depth > MAX_INFERENCE_DEPTH) return [];
  if (hasExplicitReturnType(fn, ts)) return [];
  if (ctx.visiting.has(fn)) {
    ctx.cycleHits++;
    return [];
  }
  ctx.visiting.add(fn);
  const cycleHitsBefore = ctx.cycleHits;
  try {
    const types: tsserver.Type[] = [];
    for (const expr of collectReturnExpressions(fn, ts)) {
      types.push(...resolveExpressionTypes(ctx, expr, depth));
    }
    const result = dedupeTypes(ctx, types);
    // See inferParameterType for why cycle-truncated results skip the memo.
    if (ctx.cycleHits === cycleHitsBefore) {
      ctx.memo.set(fn, {atDepth: depth, types: result});
    }
    return result;
  } finally {
    ctx.visiting.delete(fn);
  }
}

/**
 * Entry point for both hover and completion wiring: given an identifier
 * node, figures out what it's worth inferring a better type for (a parameter
 * it's declared as, a variable holding an undocumented call's result, or the
 * function it names) and returns candidate type(s), if any.
 */
export function inferTypeForNode(ctx: InferenceContext, node: tsserver.Node): tsserver.Type[] {
  const {ts, checker} = ctx;
  if (!ts.isIdentifier(node)) return [];
  const sym = checker.getSymbolAtLocation(node);
  const decl = sym?.valueDeclaration;
  if (!decl) return [];
  if (ts.isParameter(decl)) return inferParameterType(ctx, decl);
  if (ts.isVariableDeclaration(decl)) {
    // Resolve the full initializer expression, not just a direct call's
    // callee: `var pm = product.getPriceModel()` (a method call on an
    // undocumented parameter) and `var pm = product.priceModel` (a property
    // access) both need the same chain-chasing that return-type inference
    // already does — resolveVariableInitializerTypes routes through it.
    return dedupeTypes(ctx, resolveVariableInitializerTypes(ctx, decl, 0, 0));
  }
  if (ts.isFunctionLike(decl)) return inferReturnType(ctx, decl);
  return [];
}

/**
 * Like {@link inferTypeForNode}, but for an arbitrary expression in receiver
 * position — the completion case `product.getPriceModel().|`, where the thing
 * before the dot is a call or chain rather than a plain identifier, so there's
 * no declaration to look up; the expression itself is what gets resolved.
 */
export function inferTypeForExpression(ctx: InferenceContext, expr: tsserver.Expression): tsserver.Type[] {
  const {ts} = ctx;
  if (ts.isIdentifier(expr)) return inferTypeForNode(ctx, expr);
  return dedupeTypes(ctx, resolveExpressionTypes(ctx, expr, 0));
}

/**
 * Renders candidate types as human-readable hover text, e.g.
 * `"Product | Category"`. Dedupes by display string in the same pass that
 * renders it — the callers hand in already-deduped candidates, so routing
 * through dedupeTypes() here would just stringify everything a second time.
 */
export function describeTypes(checker: tsserver.TypeChecker, types: tsserver.Type[]): string {
  const seen = new Set<string>();
  for (const t of types) {
    seen.add(checker.typeToString(t));
  }
  return [...seen].join(' | ');
}

/** Synthesizes completion entries for candidate types' members, deduplicated by property name. */
export function typesToCompletionEntries(
  ts: typeof tsserver,
  checker: tsserver.TypeChecker,
  types: tsserver.Type[],
): tsserver.CompletionEntry[] {
  const seen = new Set<string>();
  const entries: tsserver.CompletionEntry[] = [];
  for (const type of types) {
    for (const sym of checker.getPropertiesOfType(getNonNullableApparentType(checker, type))) {
      const name = sym.getName();
      if (seen.has(name)) continue;
      seen.add(name);
      entries.push({
        name,
        // Method vs property determines the completion icon the editor shows.
        kind:
          sym.flags & ts.SymbolFlags.Method
            ? ts.ScriptElementKind.memberFunctionElement
            : ts.ScriptElementKind.memberVariableElement,
        kindModifiers: '',
        // '11' mirrors TS's own internal SortText.LocationPriority — the rank
        // ordinary resolved members get — so inferred members sort alongside
        // real ones rather than above or below them.
        sortText: '11',
        source: INFERRED_COMPLETION_SOURCE,
      });
    }
  }
  return entries;
}
