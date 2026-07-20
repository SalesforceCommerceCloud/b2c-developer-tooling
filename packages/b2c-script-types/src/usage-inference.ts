/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
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
// unlimited.
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
}

/**
 * Builds a fresh inference context for one top-level hover/completion
 * request, or `undefined` if the language service has no program yet.
 */
export function createInferenceContext(
  ts: typeof tsserver,
  languageService: tsserver.LanguageService,
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
 */
export function getNodeAtPosition(
  sourceFile: tsserver.SourceFile,
  ts: typeof tsserver,
  pos: number,
): tsserver.Node | undefined {
  let result: tsserver.Node | undefined;
  const visit = (node: tsserver.Node) => {
    if (pos >= node.getStart(sourceFile) && pos < node.getEnd()) {
      result = node;
      ts.forEachChild(node, visit);
    }
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

  return undefined;
}

/**
 * Finds actual call sites for `nameNode`, following up to
 * MAX_REFERENCE_HOPS binding indirections (require() bindings, destructuring)
 * when a reference doesn't sit directly in callee position. Stops early once
 * ctx.referenceBudget runs out, returning whatever call sites were already
 * found rather than continuing to fan out — an under-inferred (but still
 * heuristic, clearly-labeled) result beats hanging on a widely-referenced helper.
 */
function collectCallSites(ctx: InferenceContext, nameNode: tsserver.Identifier): tsserver.CallExpression[] {
  const {ts, languageService, program} = ctx;
  const calls: tsserver.CallExpression[] = [];
  const seenNameKeys = new Set<string>();
  let frontier: tsserver.Identifier[] = [nameNode];
  let localBudget = Math.min(MAX_REFERENCES_PER_CALL, ctx.referenceBudget);

  for (let hop = 0; hop <= MAX_REFERENCE_HOPS && frontier.length > 0 && localBudget > 0; hop++) {
    const nextFrontier: tsserver.Identifier[] = [];
    for (const name of frontier) {
      if (localBudget <= 0) break;
      const sourceFile = name.getSourceFile();
      const key = `${sourceFile.fileName}:${name.getStart(sourceFile)}`;
      if (seenNameKeys.has(key)) continue;
      seenNameKeys.add(key);

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

/** Deduplicates candidate types by their display string. */
function dedupeTypes(checker: tsserver.TypeChecker, types: tsserver.Type[]): tsserver.Type[] {
  const seen = new Set<string>();
  const out: tsserver.Type[] = [];
  for (const t of types) {
    const key = checker.typeToString(t);
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
      for (const receiverType of resolveExpressionTypes(ctx, methodAccess.expression, depth, chainHops + 1)) {
        const methodSymbol = getMemberOfType(checker, receiverType, methodName);
        if (!methodSymbol) continue;
        const methodType = checker.getTypeOfSymbolAtLocation(methodSymbol, methodAccess.name);
        for (const sig of methodType.getCallSignatures()) {
          returnTypes.push(widenType(checker, checker.getReturnTypeOfSignature(sig)));
        }
      }
      if (returnTypes.length > 0) return dedupeTypes(checker, returnTypes);
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
      if (propSymbol) propTypes.push(widenType(checker, checker.getTypeOfSymbolAtLocation(propSymbol, expr)));
    }
    if (propTypes.length > 0) return dedupeTypes(checker, propTypes);
  } else if (ts.isIdentifier(expr)) {
    // `expr` is itself an undocumented parameter reference (e.g. a helper
    // that just returns/forwards one of its own params) — chase that
    // parameter's inferred type too, rather than stopping at `any`.
    const sym = checker.getSymbolAtLocation(expr);
    const decl = sym?.valueDeclaration;
    if (decl && ts.isParameter(decl)) {
      const inferred = inferParameterType(ctx, decl, depth + 1);
      if (inferred.length > 0) return inferred;
    }
  }
  return [];
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
  const {ts, checker} = ctx;
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
  if (ctx.visiting.has(param)) return [];
  ctx.visiting.add(param);
  try {
    const fn = param.parent;
    if (!ts.isFunctionLike(fn)) return [];
    const nameNode = getReferenceNameNode(fn, ts);
    if (!nameNode) return [];
    const paramIndex = fn.parameters.indexOf(param);
    if (paramIndex < 0) return [];

    const types: tsserver.Type[] = [];
    for (const call of collectCallSites(ctx, nameNode)) {
      const arg = call.arguments[paramIndex];
      if (!arg) continue;
      types.push(...resolveExpressionTypes(ctx, arg, depth));
    }

    const result = dedupeTypes(checker, types);
    ctx.memo.set(param, {atDepth: depth, types: result});
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
  const {ts, checker} = ctx;
  // See inferParameterType for why the memo is checked before the depth cap.
  const cached = ctx.memo.get(fn);
  if (cached && cached.atDepth <= depth) return cached.types;
  if (depth > MAX_INFERENCE_DEPTH) return [];
  if (hasExplicitReturnType(fn, ts)) return [];
  if (ctx.visiting.has(fn)) return [];
  ctx.visiting.add(fn);
  try {
    const types: tsserver.Type[] = [];
    for (const expr of collectReturnExpressions(fn, ts)) {
      types.push(...resolveExpressionTypes(ctx, expr, depth));
    }
    const result = dedupeTypes(checker, types);
    ctx.memo.set(fn, {atDepth: depth, types: result});
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
  if (ts.isVariableDeclaration(decl) && decl.initializer && ts.isCallExpression(decl.initializer)) {
    const calleeFn = resolveCalleeDeclaration(ctx, decl.initializer);
    if (calleeFn) return inferReturnType(ctx, calleeFn);
  }
  if (ts.isFunctionLike(decl)) return inferReturnType(ctx, decl);
  return [];
}

/** Renders candidate types as human-readable hover text, e.g. `"Product | Category"`. */
export function describeTypes(checker: tsserver.TypeChecker, types: tsserver.Type[]): string {
  return dedupeTypes(checker, types)
    .map((t) => checker.typeToString(t))
    .join(' | ');
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
        kind: ts.ScriptElementKind.memberVariableElement,
        kindModifiers: '',
        sortText: '11',
        source: INFERRED_COMPLETION_SOURCE,
      });
    }
  }
  return entries;
}
