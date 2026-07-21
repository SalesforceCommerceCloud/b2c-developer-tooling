/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// The recursive heart of usage inference. Given an untyped value the checker
// gave up on (`any`), these functions work out a plausible type from how it is
// used elsewhere: a parameter from its call-site arguments, a function from
// its return expressions, a method chain by resolving its receiver first, and
// superModule overlays by descending the cartridge path. They call each other
// (parameter -> return -> forwarding helper -> ...), so they live together in
// one module; everything they lean on that ISN'T recursive lives in the small
// leaf modules imported below, giving a clean one-way dependency direction.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {MAX_CHAIN_HOPS, MAX_INFERENCE_DEPTH, MAX_SUPERMODULE_HOPS} from './constants';
import type {InferenceContext} from './context';
import {
  collectReturnExpressions,
  hasExplicitParameterType,
  hasExplicitReturnType,
  hasExplicitVariableType,
} from './ast-helpers';
import {collectCallSites, getReferenceNameNode} from './call-sites';
import {
  collectExportAssignments,
  findSuperModuleFile,
  isConcreteExportAssignment,
  traceSuperModuleAccess,
} from './super-module';
import {collectionElementType, dedupeTypes, getMemberOfType, isAnyType, widenType} from './type-helpers';
import {collectParameterMemberUsage, collectVariableMemberUsage, matchAmbientTypesByUsage} from './usage-match';

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
 *
 * Falls back to matching the variable's own usage against ambient classes
 * (see {@link collectVariableMemberUsage}) when the initializer itself
 * resolves to nothing — the common shape for a manual-indexing loop variable
 * (`var item = items[i]`), where `items[i]` stays `any` no matter what since
 * `items` itself is undocumented.
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
    const resolved = resolveExpressionTypes(ctx, decl.initializer, depth, chainHops);
    if (resolved.length > 0) return resolved;
    return matchAmbientTypesByUsage(ctx, collectVariableMemberUsage(ctx, decl));
  } finally {
    ctx.visiting.delete(decl);
  }
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
  // The checker gave up (`any`). Dispatch on the kind of expression to a
  // focused resolver. Each returns [] when it can't do better than `any`, so
  // an unhandled kind (or an exhausted branch) falls through to [].
  if (ts.isCallExpression(expr)) return resolveCallResultTypes(ctx, expr, depth, chainHops);
  if (ts.isPropertyAccessExpression(expr)) return resolvePropertyTypes(ctx, expr, depth, chainHops);
  if (ts.isIdentifier(expr)) return resolveIdentifierTypes(ctx, expr, depth, chainHops);
  return [];
}

/**
 * Resolves an `any` call expression: first by inferring the callee's own
 * return type, then — for a chained call whose receiver is itself
 * undocumented (`x.getPriceModel().getPrice()`) — by resolving the receiver's
 * type and looking this method up on its real, documented signature(s).
 * Returns [] when neither path improves on `any`.
 */
function resolveCallResultTypes(
  ctx: InferenceContext,
  expr: tsserver.CallExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const calleeFn = resolveCalleeDeclaration(ctx, expr);
  if (calleeFn) {
    const inferred = inferReturnType(ctx, calleeFn, depth + 1);
    if (inferred.length > 0) return inferred;
  }
  // resolveCalleeDeclaration can't find a real declaration for a method whose
  // receiver base is undocumented (the checker never resolved the method), so
  // infer the receiver's type first, then look this method up by name on it.
  if (!ts.isPropertyAccessExpression(expr.expression)) return [];
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
      // undocumented function. `any` is never a useful candidate to surface;
      // recurse into the function's actual declaration instead, the same
      // fallback resolveCalleeDeclaration provides for direct calls.
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
  return returnTypes.length > 0 ? dedupeTypes(ctx, returnTypes) : [];
}

/**
 * Resolves an `any` property access (`x.ID`) whose base is itself
 * undocumented: infer the base's type first, then look this specific property
 * up on it — or, if the base is a superModule alias, as a pass-through overlay
 * augmentation. Returns [] when the property can't be resolved.
 */
function resolvePropertyTypes(
  ctx: InferenceContext,
  expr: tsserver.PropertyAccessExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const propName = expr.name.text;
  const propTypes: tsserver.Type[] = [];
  for (const baseType of resolveExpressionTypes(ctx, expr.expression, depth, chainHops + 1)) {
    const propSymbol = getMemberOfType(checker, baseType, propName);
    if (!propSymbol) continue;
    const propType = checker.getTypeOfSymbolAtLocation(propSymbol, expr);
    // An `any`-typed member (e.g. an untyped value in an exports map) is
    // never a useful candidate — surfacing "Inferred from usage: any" would
    // be worse than staying quiet.
    if (!isAnyType(ts, propType)) propTypes.push(widenType(checker, propType));
  }
  if (propTypes.length === 0) {
    // Mirror of the method-chain fallback: the property may be an export
    // augmentation added by a pass-through superModule overlay.
    const superAccess = traceSuperModuleAccess(ts, checker, expr.expression);
    if (superAccess) {
      propTypes.push(
        ...resolveSuperModuleMemberTypes(ctx, superAccess, propName, depth, chainHops).map((t) =>
          widenType(checker, t),
        ),
      );
    }
  }
  return propTypes.length > 0 ? dedupeTypes(ctx, propTypes) : [];
}

/**
 * Resolves an `any` identifier by chasing what it refers to: an undocumented
 * parameter (infer from its call sites) or a local variable holding an
 * intermediate result (chase its initializer, so a chain split across `var`
 * statements infers exactly like the inline expression would). Returns [] for
 * anything else.
 */
function resolveIdentifierTypes(
  ctx: InferenceContext,
  expr: tsserver.Identifier,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const decl = checker.getSymbolAtLocation(expr)?.valueDeclaration;
  if (decl && ts.isParameter(decl)) return inferParameterType(ctx, decl, depth + 1);
  if (decl && ts.isVariableDeclaration(decl)) return resolveVariableInitializerTypes(ctx, decl, depth, chainHops + 1);
  return [];
}

/**
 * Infers a parameter's candidate type(s) from the arguments it's actually
 * called with across the project, since plain un-annotated JS parameters
 * default to `any` with no back-inference from call sites. Falls back to
 * matching the parameter's own usage (which members it's accessed by) against
 * the program's ambient classes when no call site could be found or resolved
 * at all — see {@link matchAmbientTypesByUsage}.
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

    let result = dedupeTypes(ctx, types);
    // No call site could be found or resolved at all (a helper only ever
    // reached indirectly — a Controller route dispatching through a name the
    // reference search can't follow, or genuinely dead/unused code). Rather
    // than give up, try to match how the parameter's own body uses it against
    // the program's ambient classes.
    if (result.length === 0) {
      result = matchAmbientTypesByUsage(ctx, collectParameterMemberUsage(ctx, param));
    }
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
