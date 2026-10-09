/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// What a parameter's or variable's own scope says about it, gathered in one
// walk: the members it is accessed by (duck typing), the classes it is
// tested against (`instanceof`, `typeof`), the types the code passes it as
// (a typed call argument or assignment target), and the values assigned to
// it. Every rule in ./policy reads this same profile, so a hover, a member
// hover and a completion all see the same evidence.

import type tsserver from 'typescript/lib/tsserverlibrary';

import type {InferenceContext} from './context';
import {isOpenForUsageInference} from './type-helpers';

export interface UsageProfile {
  /**
   * Member names accessed directly on the value: `x.member`,
   * `x['member']`, and the presence tests in {@link optionalMemberNames}.
   * Only one hop counts — a chained `x.custom.fromStoreId` contributes
   * `custom`, since the deeper name describes `custom`'s shape, not `x`'s.
   */
  readonly memberNames: ReadonlySet<string>;
  /**
   * Members the code tests for before relying on them (`'ID' in x`,
   * `x.hasOwnProperty('ID')`, `Object.hasOwnProperty.call(x, 'ID')`), and
   * members used only in a branch such a test picks: a hint at what the
   * value is, but not a member every value passed in must have.
   */
  readonly optionalMemberNames: ReadonlySet<string>;
  /** Types the value is tested against: `x instanceof dw.order.ProductLineItem`, `typeof x === 'string'`. */
  readonly guardTypes: readonly tsserver.Type[];
  /** Types the value is used as: the parameter type of a typed call it is passed to, or the type of what it is assigned to. */
  readonly contextualTypes: readonly tsserver.Type[];
  /** Right-hand sides of `x = value` assignments to the value after its declaration. */
  readonly assignedValues: readonly tsserver.Expression[];
}

interface ProfileBuilder {
  readonly memberNames: Set<string>;
  readonly optionalMemberNames: Set<string>;
  readonly guardTypes: tsserver.Type[];
  readonly contextualTypes: tsserver.Type[];
  readonly assignedValues: tsserver.Expression[];
}

function emptyProfile(): ProfileBuilder {
  return {
    memberNames: new Set(),
    optionalMemberNames: new Set(),
    guardTypes: [],
    contextualTypes: [],
    assignedValues: [],
  };
}

const EMPTY_PROFILE: UsageProfile = emptyProfile();

/**
 * The instance type an `instanceof` right-hand side tests for
 * (`dw.order.ProductLineItem`, a local class binding, ...): its construct
 * signature's return type, or — for a JS constructor function, which has
 * none — the declared type of the right-hand side's symbol. A test against a
 * root type (`x instanceof Object`) says nothing and yields undefined.
 */
function instanceTypeOf(ctx: InferenceContext, constructor: tsserver.Expression): tsserver.Type | undefined {
  const {checker, ts} = ctx;
  const constructorType = checker.getTypeAtLocation(constructor);
  const [signature] = constructorType.getConstructSignatures();
  const symbol = constructorType.getSymbol() ?? checker.getSymbolAtLocation(constructor);
  const instance = signature
    ? checker.getReturnTypeOfSignature(signature)
    : symbol && checker.getDeclaredTypeOfSymbol(symbol);
  return instance && !isOpenForUsageInference(ts, instance) ? instance : undefined;
}

/** The primitive a `typeof x === 'string'` comparison names, if `typeOf` sits in one. */
function primitiveOfTypeofCheck(ctx: InferenceContext, typeOf: tsserver.TypeOfExpression): tsserver.Type | undefined {
  const {ts, checker} = ctx;
  const comparison = typeOf.parent;
  if (!ts.isBinaryExpression(comparison)) return undefined;
  const other = comparison.left === typeOf ? comparison.right : comparison.left;
  if (!ts.isStringLiteralLike(other)) return undefined;
  if (other.text === 'string') return checker.getStringType();
  if (other.text === 'number') return checker.getNumberType();
  if (other.text === 'boolean') return checker.getBooleanType();
  return undefined;
}

/** The string a presence test names, if `node` is a string literal. */
function literalText(ctx: InferenceContext, node: tsserver.Node | undefined): string | undefined {
  return node && ctx.ts.isStringLiteralLike(node) ? node.text : undefined;
}

/**
 * The member a presence test on `reference` checks for: `'m' in x`,
 * `x.hasOwnProperty('m')`, or `Object[.prototype].hasOwnProperty.call(x, 'm')`.
 */
function presenceTestedMember(ctx: InferenceContext, reference: tsserver.Identifier): string | undefined {
  const {ts} = ctx;
  const parent = reference.parent;
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.InKeyword) {
    return parent.right === reference ? literalText(ctx, parent.left) : undefined;
  }
  const isOwnReceiver =
    ts.isPropertyAccessExpression(parent) && parent.expression === reference && parent.name.text === 'hasOwnProperty';
  const call = isOwnReceiver ? parent.parent : parent;
  if (!ts.isCallExpression(call)) return undefined;
  if (isOwnReceiver) return call.expression === parent ? literalText(ctx, call.arguments[0]) : undefined;
  const callee = call.expression;
  const isHasOwnCall =
    call.arguments[0] === reference &&
    ts.isPropertyAccessExpression(callee) &&
    callee.name.text === 'call' &&
    ts.isPropertyAccessExpression(callee.expression) &&
    callee.expression.name.text === 'hasOwnProperty';
  return isHasOwnCall ? literalText(ctx, call.arguments[1]) : undefined;
}

/**
 * True when `access` is the member access the current request's own cursor
 * sits in (see {@link InferenceContext.triggerPosition}): a member name being
 * typed (`shipment.pro|`) is not evidence yet, and a dangling `shipment.`
 * followed by more code parses as an access to whatever identifier comes
 * next, which no real class has.
 */
function isTriggerAccess(ctx: InferenceContext, access: tsserver.PropertyAccessExpression): boolean {
  const trigger = ctx.triggerPosition;
  return trigger !== undefined && access.expression.getEnd() <= trigger && trigger <= access.name.getEnd();
}

/** The type `signature` declares for argument `index` of `call`, unless a rest parameter collects it. */
function declaredArgumentType(
  ctx: InferenceContext,
  signature: tsserver.Signature,
  index: number,
  call: tsserver.Node,
): tsserver.Type | undefined {
  const parameter = signature.getParameters()[index];
  const declaration = parameter?.valueDeclaration;
  if (!parameter || (declaration && ctx.ts.isParameter(declaration) && declaration.dotDotDotToken)) return undefined;
  return ctx.checker.getTypeOfSymbolAtLocation(parameter, call);
}

/** True when `signature` takes `count` arguments (synthetic signatures without a declaration always do). */
function acceptsArgumentCount(ctx: InferenceContext, signature: tsserver.Signature, count: number): boolean {
  const {ts, checker} = ctx;
  const declaration = signature.getDeclaration() as tsserver.SignatureDeclaration | undefined;
  if (!declaration) return true;
  const parameters = declaration.parameters;
  const required = parameters.filter((parameter) => !checker.isOptionalParameter(parameter)).length;
  return count >= required && (count <= parameters.length || ts.hasRestParameter(declaration));
}

/**
 * The type `reference` is used as. An argument to an overloaded function
 * counts only when every overload taking that many arguments agrees on it
 * (`parseInt(s)` / `parseInt(s, radix)`): for an argument of no known type
 * the checker settles on the first such overload, which says nothing about
 * the one the code means (`variationModel.getAllValues(attribute)` would
 * make `attribute` an `ObjectAttributeDefinition`).
 */
function usedAsType(ctx: InferenceContext, reference: tsserver.Identifier): tsserver.Type | undefined {
  const {ts, checker} = ctx;
  const call = reference.parent;
  const isCall = ts.isCallExpression(call) || ts.isNewExpression(call);
  const args: readonly tsserver.Expression[] = (isCall && call.arguments) || [];
  const index = args.indexOf(reference);
  if (!isCall || index < 0) return checker.getContextualType(reference);
  const callee = checker.getTypeAtLocation(call.expression);
  const signatures = ts.isNewExpression(call) ? callee.getConstructSignatures() : callee.getCallSignatures();
  const overloads = signatures.filter((signature) => acceptsArgumentCount(ctx, signature, args.length));
  if (overloads.length <= 1) return checker.getContextualType(reference);
  const [first, ...rest] = overloads.map((signature) => declaredArgumentType(ctx, signature, index, call));
  return first && rest.every((type) => type === first) ? first : undefined;
}

/** The value a profile describes: its symbol, the name it is declared by, and its own (unnarrowed) type. */
interface ProfileTarget {
  readonly symbol: tsserver.Symbol;
  readonly declarationName: tsserver.Identifier;
  readonly declaredType: tsserver.Type;
}

function isReferenceTo(ctx: InferenceContext, target: ProfileTarget, node: tsserver.Node): node is tsserver.Identifier {
  return (
    ctx.ts.isIdentifier(node) &&
    node !== target.declarationName &&
    node.text === target.declarationName.text &&
    ctx.checker.getSymbolAtLocation(node) === target.symbol
  );
}

/** True when `condition` tests the value for a member (`'m' in x`, `x.hasOwnProperty('m')`, ...). */
function testsPresence(ctx: InferenceContext, target: ProfileTarget, condition: tsserver.Node): boolean {
  const visit = (node: tsserver.Node): boolean =>
    (isReferenceTo(ctx, target, node) && presenceTestedMember(ctx, node) !== undefined) ||
    ctx.ts.forEachChild(node, visit) === true;
  return visit(condition);
}

/** True when `statement` always leaves its block: a `return`/`throw`, or a block ending in one. */
function alwaysExits(ctx: InferenceContext, statement: tsserver.Statement): boolean {
  const {ts} = ctx;
  const last = ts.isBlock(statement) ? statement.statements[statement.statements.length - 1] : statement;
  return last !== undefined && (ts.isReturnStatement(last) || ts.isThrowStatement(last));
}

/** The statements after an early-exit presence test (`if ('m' in x) { return …; }`): its implicit `else`. */
function statementsAfterPresenceExit(
  ctx: InferenceContext,
  target: ProfileTarget,
  statements: readonly tsserver.Statement[],
): tsserver.Node[] {
  const {ts} = ctx;
  const guard = statements.findIndex(
    (statement) =>
      ts.isIfStatement(statement) &&
      !statement.elseStatement &&
      alwaysExits(ctx, statement.thenStatement) &&
      testsPresence(ctx, target, statement.expression),
  );
  return guard < 0 ? [] : statements.slice(guard + 1);
}

/**
 * The branches of `node` that only run for some variants of the value: both
 * branches of an `if`/`?:` that tests it for a member first (an early
 * `return` making the rest of the block the `else`), and the right side of
 * `'m' in x && …`. The test tells the code which kind of value it holds, so
 * a member either branch uses belongs to that kind alone
 * (`if ('searchPhraseSuggestions' in s) … else s.hasNext()`).
 */
function variantBranches(ctx: InferenceContext, target: ProfileTarget, node: tsserver.Node): readonly tsserver.Node[] {
  const {ts} = ctx;
  if (ts.isIfStatement(node)) {
    if (!testsPresence(ctx, target, node.expression)) return [];
    return node.elseStatement ? [node.thenStatement, node.elseStatement] : [node.thenStatement];
  }
  if (ts.isConditionalExpression(node)) {
    return testsPresence(ctx, target, node.condition) ? [node.whenTrue, node.whenFalse] : [];
  }
  if (ts.isBinaryExpression(node)) {
    const isGuardedAnd = node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken;
    return isGuardedAnd && testsPresence(ctx, target, node.left) ? [node.right] : [];
  }
  return ts.isBlock(node) || ts.isSourceFile(node) ? statementsAfterPresenceExit(ctx, target, node.statements) : [];
}

/** Records one member the value is accessed by; `optional` when only some variants of the value need it. */
function recordMember(profile: ProfileBuilder, name: string, optional: boolean): void {
  profile.memberNames.add(name);
  if (optional) profile.optionalMemberNames.add(name);
}

/**
 * Records what one reference to the profiled value says about it.
 * `inVariantBranch` marks a reference inside a branch only some variants of
 * the value reach (see {@link variantBranches}). A reference the checker
 * narrowed (inside `if (typeof x === 'string')`) is used as what that one
 * branch holds, which says nothing about every value.
 */
function recordReference(
  ctx: InferenceContext,
  target: ProfileTarget,
  reference: tsserver.Identifier,
  inVariantBranch: boolean,
  profile: ProfileBuilder,
): void {
  const {ts, checker} = ctx;
  const parent = reference.parent;
  const tested = presenceTestedMember(ctx, reference);
  if (tested !== undefined) {
    recordMember(profile, tested, true);
    return;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.expression === reference) {
    if (!isTriggerAccess(ctx, parent)) recordMember(profile, parent.name.text, inVariantBranch);
    return;
  }
  if (ts.isElementAccessExpression(parent) && parent.expression === reference) {
    const member = literalText(ctx, parent.argumentExpression);
    if (member !== undefined) recordMember(profile, member, inVariantBranch);
    return;
  }
  if (ts.isTypeOfExpression(parent)) {
    const primitive = primitiveOfTypeofCheck(ctx, parent);
    if (primitive) profile.guardTypes.push(primitive);
    return;
  }
  if (ts.isBinaryExpression(parent)) {
    const operator = parent.operatorToken.kind;
    if (operator === ts.SyntaxKind.InstanceOfKeyword && parent.left === reference) {
      const instance = instanceTypeOf(ctx, parent.right);
      if (instance) profile.guardTypes.push(instance);
      return;
    }
    if (operator === ts.SyntaxKind.EqualsToken && parent.left === reference) {
      profile.assignedValues.push(parent.right);
      return;
    }
  }
  if (checker.getTypeAtLocation(reference) !== target.declaredType) return;
  const used = usedAsType(ctx, reference);
  if (used) profile.contextualTypes.push(used);
}

function collectProfile(
  ctx: InferenceContext,
  symbol: tsserver.Symbol,
  declarationName: tsserver.Identifier,
  scope: tsserver.Node,
): UsageProfile {
  const declaredType = ctx.checker.getTypeOfSymbolAtLocation(symbol, declarationName);
  const target: ProfileTarget = {symbol, declarationName, declaredType};
  const profile = emptyProfile();
  const visit = (node: tsserver.Node, inVariantBranch: boolean): void => {
    if (isReferenceTo(ctx, target, node)) recordReference(ctx, target, node, inVariantBranch, profile);
    const branches = inVariantBranch ? [] : variantBranches(ctx, target, node);
    ctx.ts.forEachChild(node, (child) => visit(child, inVariantBranch || branches.includes(child)));
  };
  visit(scope, false);
  return profile;
}

/** Walks up from `node` to the body of the nearest enclosing function, if any. */
function enclosingFunctionBody(ctx: InferenceContext, node: tsserver.Node): tsserver.Node | undefined {
  for (let current = node.parent; current; current = current.parent) {
    if (ctx.ts.isFunctionLike(current)) return (current as tsserver.FunctionLikeDeclaration).body;
  }
  return undefined;
}

/**
 * The usage profile of a parameter (scoped to its function body, nested
 * closures included) or a variable (scoped to its enclosing function, or the
 * whole file for a top-level variable). Destructured declarations have no
 * single value to profile and get an empty profile. Memoized per request.
 */
export function usageProfileOf(
  ctx: InferenceContext,
  declaration: tsserver.ParameterDeclaration | tsserver.VariableDeclaration,
): UsageProfile {
  const {ts, checker} = ctx;
  if (!ts.isIdentifier(declaration.name)) return EMPTY_PROFILE;
  const symbol = checker.getSymbolAtLocation(declaration.name);
  const scope = ts.isParameter(declaration)
    ? (declaration.parent as tsserver.FunctionLikeDeclaration).body
    : (enclosingFunctionBody(ctx, declaration) ?? declaration.getSourceFile());
  if (!symbol || !scope) return EMPTY_PROFILE;
  const cached = ctx.profiles.get(symbol);
  if (cached) return cached;
  const profile = collectProfile(ctx, symbol, declaration.name, scope);
  ctx.profiles.set(symbol, profile);
  return profile;
}
