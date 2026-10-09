/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// The recursive heart of usage inference. Given an untyped value the checker
// gave up on (`any`), these functions gather evidence of what it really is: a
// parameter from its call-site arguments, a function from its return
// expressions, a variable from the values assigned to it, a method chain by
// resolving its receiver first, and superModule overlays by descending the
// cartridge path. They call each other (parameter -> return -> forwarding
// helper -> ...), so they live together in one module. What to *show* for the
// evidence is decided in ./policy, at every parameter, return and variable,
// so every path into the same value reaches the same answer.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {ELEMENT_FIRST_CALLBACK_CALLEES, MAX_CHAIN_HOPS} from './constants';
import {withCycleGuard, withInferenceGuards} from './context';
import type {InferenceContext} from './context';
import {
  collectReturnExpressions,
  hasExplicitParameterType,
  hasExplicitReturnType,
  hasExplicitVariableType,
} from './ast-helpers';
import {collectCallSites, getReferenceNameNode} from './call-sites';
import {frameworkParameterTypes} from './framework-contracts';
import {decideType, limitUnion, normalizeCandidates} from './policy';
import {
  collectExportAssignments,
  findSuperModuleFile,
  isConcreteExportAssignment,
  superModuleLevels,
  traceSuperModuleAccess,
} from './super-module';
import {collectionElementType, dedupeTypes, getMemberOfType, informativeParts, isAnyType} from './type-helpers';
import {usageProfileOf} from './usage-profile';

function identifierText(ctx: InferenceContext, name: tsserver.BindingName): string | undefined {
  return ctx.ts.isIdentifier(name) ? name.text : undefined;
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
  const sigDecl = checker.getResolvedSignature(call)?.declaration;
  return sigDecl && ts.isFunctionLike(sigDecl) ? sigDecl : undefined;
}

/**
 * Everything a local variable can hold: its initializer plus every later
 * `x = value` assignment (`var result = null; if (a) result = x; else result
 * = y;`), decided as one candidate set. Covers the idiomatic SFCC style of
 * splitting a chain across intermediate variables (`var priceModel =
 * product.getPriceModel(); return priceModel.getPrice();`), which would
 * otherwise dead-end at the variable even though the inline expression
 * resolves fine. An explicit annotation means the variable's `any` is
 * deliberate (same rule as parameters and returns). Following a variable
 * never crosses a function boundary, so it is charged to `chainHops`, not to
 * the recursion depth.
 */
function resolveVariableTypes(
  ctx: InferenceContext,
  decl: tsserver.VariableDeclaration,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  if (hasExplicitVariableType(decl, ctx.ts)) return [];
  return withCycleGuard(ctx, decl, [], () => {
    const profile = usageProfileOf(ctx, decl);
    const values = decl.initializer ? [decl.initializer, ...profile.assignedValues] : profile.assignedValues;
    const evidence = values.flatMap((value) => resolveExpressionTypes(ctx, value, depth, chainHops));
    return decideType(ctx, evidence, profile, identifierText(ctx, decl.name), false);
  });
}

/**
 * The types one `module.exports = X` assignment of a superModule level
 * contributes. The checker's type for `module.exports` is used when it is
 * concrete — it merges the assigned object with later
 * `module.exports.name = fn` augmentations. A pass-through overlay
 * (`module.exports = base`, base itself a superModule) is resolved by
 * recursing into the right-hand side instead, another cartridge down; the
 * checker sometimes merges such a level into an opaque `typeof base` that
 * still carries none of the deeper cartridges' members, so a pass-through
 * right-hand side is recursed into even when the left side looked concrete.
 */
function superModuleExportTypes(
  ctx: InferenceContext,
  assignment: tsserver.BinaryExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const concrete = isConcreteExportAssignment(ctx, assignment);
  const types = concrete ? [checker.getTypeAtLocation(assignment.left)] : [];
  if (!concrete || traceSuperModuleAccess(ts, checker, assignment.right)) {
    types.push(...resolveExpressionTypes(ctx, assignment.right, depth, chainHops + 1));
  }
  return types;
}

/**
 * Resolves what `module.superModule` evaluates to: the export type(s) of the
 * same-subpath module in the next cartridge down the path. Members a
 * pass-through level *adds* can't be merged into these types; they are
 * resolved by name in {@link resolveSuperModuleMemberTypes}.
 */
function resolveSuperModuleTypes(
  ctx: InferenceContext,
  expr: tsserver.PropertyAccessExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const superFile = findSuperModuleFile(ctx, expr.getSourceFile().fileName);
  if (!superFile) return [];
  // The guard catches overlay cycles from a misconfigured cartridge path.
  return withCycleGuard(ctx, superFile, [], () =>
    dedupeTypes(
      ctx,
      collectExportAssignments(superFile, ctx.ts).full.flatMap((assignment) =>
        superModuleExportTypes(ctx, assignment, depth, chainHops),
      ),
    ),
  );
}

/**
 * Resolves `memberName` from the first superModule level (walking down the
 * cartridge path) that adds it as an export augmentation
 * (`module.exports.name = fn`) — the complement to
 * {@link resolveSuperModuleTypes} for members no export type carries.
 */
function resolveSuperModuleMemberTypes(
  ctx: InferenceContext,
  superAccess: tsserver.PropertyAccessExpression,
  memberName: string,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  for (const {members} of superModuleLevels(ctx, superAccess)) {
    const matches = members.filter((member) => member.name === memberName);
    if (matches.length === 0) continue;
    const types = matches.flatMap((member) => resolveExpressionTypes(ctx, member.expr, depth, chainHops + 1));
    return dedupeTypes(
      ctx,
      types.filter((type) => !isAnyType(ctx.ts, type)),
    );
  }
  return [];
}

/**
 * Infers the type of a callback's first parameter from sibling arguments of
 * the call the callback is passed to: `collections.forEach` / `map` /
 * `filter` / `every` / `some` / `find` / `first` (see
 * {@link ELEMENT_FIRST_CALLBACK_CALLEES}). A function expression in argument
 * position has no name to run a reference search on, but the collection
 * travelling alongside it names the element type. Unknown callees and
 * `reduce` (accumulator first) are left alone — applying the heuristic to an
 * arbitrary helper would guess wrong more often than it helps.
 */
function inferCallbackParameterTypes(
  ctx: InferenceContext,
  fn: tsserver.SignatureDeclaration,
  paramIndex: number,
  depth: number,
): tsserver.Type[] {
  const {ts} = ctx;
  const call = fn.parent;
  if (paramIndex !== 0 || !call || !ts.isCallExpression(call) || !call.arguments.includes(fn as tsserver.Expression)) {
    return [];
  }
  const callee = ts.isPropertyAccessExpression(call.expression) ? call.expression.name : call.expression;
  if (!ts.isIdentifier(callee) || !ELEMENT_FIRST_CALLBACK_CALLEES.has(callee.text)) return [];
  return call.arguments
    .filter((arg) => arg !== fn)
    .flatMap((arg) => resolveExpressionTypes(ctx, arg, depth).map((type) => collectionElementType(ctx, type, arg)))
    .filter((element): element is tsserver.Type => element !== undefined);
}

/**
 * Resolves the candidate type(s) of `expr`: the checker's own type when it is
 * informative, otherwise a type recovered through whatever `expr` is built
 * from (an undocumented callee's returns, a receiver's real members, a
 * variable's values, a parameter's call sites).
 *
 * @param chainHops - how many `.method()`/`.prop` hops within the *same*
 * static expression have already been chased (e.g. the `2` in
 * `a.b().c().d()` when resolving `d`'s receiver `a.b().c()`). This is
 * distinct from `depth`, which only advances when crossing into another
 * undocumented helper's own inference — chain-hopping never crosses a
 * function boundary, so it needs its own bound (`MAX_CHAIN_HOPS`) to keep the
 * cost of a very long inline chain predictable.
 * @returns An array (rather than a single unioned Type) because the public
 * TypeChecker API has no way to synthesize a union Type.
 */
function resolveExpressionTypes(
  ctx: InferenceContext,
  expr: tsserver.Expression,
  depth: number,
  chainHops = 0,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  // module.superModule (or a `var base = module.superModule` alias) first:
  // TS knows nothing about SFCC overlay semantics, and its type for these
  // expressions is never meaningful — sometimes `any`, sometimes an opaque
  // circular `typeof base` that would pass for informative.
  const superAccess = traceSuperModuleAccess(ts, checker, expr);
  if (superAccess) return resolveSuperModuleTypes(ctx, superAccess, depth, chainHops);
  const direct = informativeParts(ctx, checker.getTypeAtLocation(expr));
  if (direct.length > 0) return direct;
  if (chainHops >= MAX_CHAIN_HOPS) return [];
  if (ts.isCallExpression(expr)) return resolveCallResultTypes(ctx, expr, depth, chainHops);
  if (ts.isPropertyAccessExpression(expr)) return resolvePropertyTypes(ctx, expr, depth, chainHops);
  if (ts.isIdentifier(expr)) return resolveIdentifierTypes(ctx, expr, depth, chainHops);
  if (ts.isParenthesizedExpression(expr)) return resolveExpressionTypes(ctx, expr.expression, depth, chainHops);
  // `it.hasNext() ? it.next() : null` (the body of SFRA's collections.first)
  // and `a || b` / `a ?? b` can each evaluate to either side.
  if (ts.isConditionalExpression(expr))
    return resolveAlternatives(ctx, [expr.whenTrue, expr.whenFalse], depth, chainHops);
  if (ts.isBinaryExpression(expr)) return resolveLogicalTypes(ctx, expr, depth, chainHops);
  return [];
}

function resolveAlternatives(
  ctx: InferenceContext,
  alternatives: readonly tsserver.Expression[],
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  return dedupeTypes(
    ctx,
    alternatives.flatMap((alternative) => resolveExpressionTypes(ctx, alternative, depth, chainHops + 1)),
  );
}

/** `a || b` and `a ?? b` evaluate to either side; `a && b` to `b` when it's worth showing at all. */
function resolveLogicalTypes(
  ctx: InferenceContext,
  expr: tsserver.BinaryExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {SyntaxKind} = ctx.ts;
  switch (expr.operatorToken.kind) {
    case SyntaxKind.BarBarToken:
    case SyntaxKind.QuestionQuestionToken:
      return resolveAlternatives(ctx, [expr.left, expr.right], depth, chainHops);
    case SyntaxKind.AmpersandAmpersandToken:
      return resolveExpressionTypes(ctx, expr.right, depth, chainHops + 1);
    default:
      return [];
  }
}

/**
 * The declared types of `access`'s member on each candidate type of its
 * receiver (`x.getPriceModel` when `x` is undocumented but inferable). When
 * no receiver type carries the member and the receiver is (an alias of)
 * `module.superModule`, the member may be an export augmentation added by a
 * pass-through overlay level, which no export type can carry.
 */
function memberTypesOfReceiver(
  ctx: InferenceContext,
  access: tsserver.PropertyAccessExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const memberName = access.name.text;
  const types = resolveExpressionTypes(ctx, access.expression, depth, chainHops + 1).flatMap((receiverType) => {
    const member = getMemberOfType(checker, receiverType, memberName);
    return member ? [checker.getTypeOfSymbolAtLocation(member, access.name)] : [];
  });
  if (types.length > 0) return types;
  const superAccess = traceSuperModuleAccess(ts, checker, access.expression);
  return superAccess ? resolveSuperModuleMemberTypes(ctx, superAccess, memberName, depth, chainHops) : [];
}

/**
 * The return types of `methodType`'s call signatures. A signature returning
 * `any` (an undocumented function reached through a superModule export type)
 * is inferred from its own declaration instead.
 */
function signatureReturnTypes(ctx: InferenceContext, methodType: tsserver.Type, depth: number): tsserver.Type[] {
  const {ts, checker} = ctx;
  return methodType.getCallSignatures().flatMap((signature) => {
    const returnType = checker.getReturnTypeOfSignature(signature);
    if (!isAnyType(ts, returnType)) return [returnType];
    const declaration = signature.declaration;
    return declaration && ts.isFunctionLike(declaration) ? inferReturnType(ctx, declaration, depth + 1) : [];
  });
}

/**
 * Resolves an `any` call expression: first by inferring the callee's own
 * return type, then — for a method call on an undocumented receiver
 * (`x.getPriceModel().getPrice()`) — from the method's real signature(s) on
 * the receiver's inferred type(s).
 */
function resolveCallResultTypes(
  ctx: InferenceContext,
  expr: tsserver.CallExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const calleeFn = resolveCalleeDeclaration(ctx, expr);
  const inferred = calleeFn ? inferReturnType(ctx, calleeFn, depth + 1) : [];
  if (inferred.length > 0 || !ctx.ts.isPropertyAccessExpression(expr.expression)) return inferred;
  return dedupeTypes(
    ctx,
    memberTypesOfReceiver(ctx, expr.expression, depth, chainHops).flatMap((methodType) =>
      signatureReturnTypes(ctx, methodType, depth),
    ),
  );
}

/** Resolves an `any` property access (`x.ID`) on an undocumented receiver from the receiver's inferred type(s). */
function resolvePropertyTypes(
  ctx: InferenceContext,
  expr: tsserver.PropertyAccessExpression,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  return dedupeTypes(
    ctx,
    memberTypesOfReceiver(ctx, expr, depth, chainHops).filter((type) => !isAnyType(ctx.ts, type)),
  );
}

/** Resolves an `any` identifier through what it names: a parameter's call sites or a variable's values. */
function resolveIdentifierTypes(
  ctx: InferenceContext,
  expr: tsserver.Identifier,
  depth: number,
  chainHops: number,
): tsserver.Type[] {
  const {ts, checker} = ctx;
  const decl = checker.getSymbolAtLocation(expr)?.valueDeclaration;
  if (decl && ts.isParameter(decl)) return inferParameterType(ctx, decl, depth + 1);
  if (decl && ts.isVariableDeclaration(decl)) return resolveVariableTypes(ctx, decl, depth, chainHops + 1);
  return [];
}

/**
 * The argument types a parameter receives: at every call site of its
 * function across the project (`helper(x)`, `new Helper(x)`,
 * `Helper.call(this, x)`), or — for an anonymous callback with no name to
 * search for — from the collection it iterates.
 */
function parameterEvidence(
  ctx: InferenceContext,
  fn: tsserver.SignatureDeclaration,
  paramIndex: number,
  depth: number,
): tsserver.Type[] {
  const nameNode = getReferenceNameNode(fn, ctx.ts);
  if (!nameNode) return inferCallbackParameterTypes(ctx, fn, paramIndex, depth);
  return collectCallSites(ctx, nameNode).flatMap((site) => {
    const arg = site.args[paramIndex];
    return arg ? resolveExpressionTypes(ctx, arg, depth) : [];
  });
}

/**
 * Infers a parameter's type(s): from a platform contract when the function
 * is one the platform calls (see ./framework-contracts), otherwise from the
 * arguments it receives and its own usage (see ./policy for how the two are
 * weighed). Plain un-annotated JS parameters default to `any` with no
 * back-inference from call sites, which is the gap this fills.
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
  const fn = param.parent;
  if (hasExplicitParameterType(param, ts) || !ts.isFunctionLike(fn)) return [];
  return withInferenceGuards(ctx, param, depth, () => {
    const paramIndex = fn.parameters.indexOf(param);
    const contract = frameworkParameterTypes(ctx, fn, paramIndex);
    if (contract.length > 0) return contract;
    const evidence = parameterEvidence(ctx, fn, paramIndex, depth);
    return decideType(ctx, evidence, usageProfileOf(ctx, param), identifierText(ctx, param.name), true);
  });
}

/**
 * Infers a function's return type(s) from its own return statements,
 * chasing into undocumented callees when a return expression itself
 * resolves to `any`.
 *
 * @param depth - Recursion budget already consumed by the call chain that
 * led here; defaults to 0 for a top-level request.
 */
export function inferReturnType(ctx: InferenceContext, fn: tsserver.SignatureDeclaration, depth = 0): tsserver.Type[] {
  if (hasExplicitReturnType(fn, ctx.ts)) return [];
  return withInferenceGuards(ctx, fn, depth, () => {
    const types = collectReturnExpressions(fn, ctx.ts).flatMap((expr) => resolveExpressionTypes(ctx, expr, depth));
    return limitUnion(ctx, normalizeCandidates(ctx, types));
  });
}

/**
 * Entry point for hover and completions on an identifier: infers the type of
 * the parameter or variable it names, or the return type of the function it
 * names.
 */
export function inferTypeForNode(ctx: InferenceContext, node: tsserver.Node): tsserver.Type[] {
  const {ts, checker} = ctx;
  if (!ts.isIdentifier(node)) return [];
  const decl = checker.getSymbolAtLocation(node)?.valueDeclaration;
  if (!decl) return [];
  if (ts.isParameter(decl)) return inferParameterType(ctx, decl);
  if (ts.isVariableDeclaration(decl)) return resolveVariableTypes(ctx, decl, 0, 0);
  if (ts.isFunctionLike(decl)) return inferReturnType(ctx, decl);
  return [];
}

/**
 * Like {@link inferTypeForNode}, but for an arbitrary expression — the
 * completion case `product.getPriceModel().|` and member hovers, where the
 * thing to type is a call or chain rather than a declared name.
 */
export function inferTypeForExpression(ctx: InferenceContext, expr: tsserver.Expression): tsserver.Type[] {
  if (ctx.ts.isIdentifier(expr)) return inferTypeForNode(ctx, expr);
  return limitUnion(ctx, normalizeCandidates(ctx, resolveExpressionTypes(ctx, expr, 0)));
}
