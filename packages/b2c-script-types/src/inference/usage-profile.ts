/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// What a parameter's or variable's own scope says about it, gathered in one
// walk: the members it is accessed by (duck typing), the classes it is
// tested against (`instanceof`, `typeof`), the types the code passes it as
// (a typed call argument or assignment target), and the values assigned to
// it, pushed into it and written to its members. Every rule in ./policy
// reads this same profile, so a hover, a member hover and a completion all
// see the same evidence.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {hasExplicitParameterType, spellingFilter} from './ast-helpers';
import type {SpellingFilter} from './ast-helpers';
import {MAX_USAGE_FORWARDING_HOPS} from './constants';
import type {InferenceContext} from './context';
import {acceptsArgumentCount} from './signatures';
import {isStoredMemberRead, thisMembersStoring} from './this-properties';
import {isOpenForUsageInference} from './type-helpers';
import {receivingParameter} from './value-flow';

/**
 * An undocumented parameter of a project function the value is passed to
 * unchanged; `optional` when only some variants of the value are (see
 * {@link variantBranches}).
 */
export interface ForwardedUse {
  readonly parameter: tsserver.ParameterDeclaration;
  readonly optional: boolean;
}

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
  /** Values the code adds to it as elements: `x.push(v)`, `x.unshift(v)`, `x[i] = v`. */
  readonly pushedValues: readonly tsserver.Expression[];
  /** Values the code writes to its members, by member name: `x.m = v`, `x['m'] = v`. */
  readonly memberValues: ReadonlyMap<string, readonly tsserver.Expression[]>;
  /** Parameters the value is passed on to (`helper(x)`, `new Model(x)`), whose usage is usage of it too. */
  readonly forwardedTo: readonly ForwardedUse[];
}

interface ProfileBuilder {
  readonly memberNames: Set<string>;
  readonly optionalMemberNames: Set<string>;
  readonly guardTypes: tsserver.Type[];
  readonly contextualTypes: tsserver.Type[];
  readonly assignedValues: tsserver.Expression[];
  readonly pushedValues: tsserver.Expression[];
  readonly memberValues: Map<string, tsserver.Expression[]>;
  readonly forwardedTo: ForwardedUse[];
}

function emptyProfile(): ProfileBuilder {
  return {
    memberNames: new Set(),
    optionalMemberNames: new Set(),
    guardTypes: [],
    contextualTypes: [],
    assignedValues: [],
    pushedValues: [],
    memberValues: new Map(),
    forwardedTo: [],
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

/** `'m' in x`: the member an `in` test on `reference` names. */
function inOperatorMember(ctx: InferenceContext, reference: tsserver.Expression): string | undefined {
  const {ts} = ctx;
  const test = reference.parent;
  const isInTest =
    ts.isBinaryExpression(test) && test.operatorToken.kind === ts.SyntaxKind.InKeyword && test.right === reference;
  return isInTest ? literalText(ctx, test.left) : undefined;
}

/** `x.hasOwnProperty('m')`: the member an own-property method call on `reference` names. */
function ownPropertyMethodMember(ctx: InferenceContext, reference: tsserver.Expression): string | undefined {
  const {ts} = ctx;
  const access = reference.parent;
  const isHasOwn =
    ts.isPropertyAccessExpression(access) && access.expression === reference && access.name.text === 'hasOwnProperty';
  const call = access.parent;
  return isHasOwn && ts.isCallExpression(call) && call.expression === access
    ? literalText(ctx, call.arguments[0])
    : undefined;
}

/** `Object[.prototype].hasOwnProperty.call(x, 'm')`: the member a borrowed own-property call on `reference` names. */
function ownPropertyCallMember(ctx: InferenceContext, reference: tsserver.Expression): string | undefined {
  const {ts} = ctx;
  const call = reference.parent;
  if (!ts.isCallExpression(call) || call.arguments[0] !== reference) return undefined;
  const callee = call.expression;
  const isHasOwnCall =
    ts.isPropertyAccessExpression(callee) &&
    callee.name.text === 'call' &&
    ts.isPropertyAccessExpression(callee.expression) &&
    callee.expression.name.text === 'hasOwnProperty';
  return isHasOwnCall ? literalText(ctx, call.arguments[1]) : undefined;
}

/**
 * The member a presence test on `reference` checks for: `'m' in x`,
 * `x.hasOwnProperty('m')`, or `Object[.prototype].hasOwnProperty.call(x, 'm')`.
 */
function presenceTestedMember(ctx: InferenceContext, reference: tsserver.Expression): string | undefined {
  return (
    inOperatorMember(ctx, reference) ?? ownPropertyMethodMember(ctx, reference) ?? ownPropertyCallMember(ctx, reference)
  );
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

/**
 * The type argument `index` of `call` is passed as. For an overloaded callee
 * it counts only when every overload taking that many arguments agrees on it
 * (`parseInt(s)` / `parseInt(s, radix)`): for an argument of no known type
 * the checker settles on the first such overload, which says nothing about
 * the one the code means (`variationModel.getAllValues(attribute)` would
 * make `attribute` an `ObjectAttributeDefinition`).
 */
function argumentType(
  ctx: InferenceContext,
  call: tsserver.CallExpression | tsserver.NewExpression,
  reference: tsserver.Expression,
  index: number,
): tsserver.Type | undefined {
  const {ts, checker} = ctx;
  const argumentCount = call.arguments?.length ?? 0;
  const callee = checker.getTypeAtLocation(call.expression);
  const signatures = ts.isNewExpression(call) ? callee.getConstructSignatures() : callee.getCallSignatures();
  const overloads = signatures.filter((signature) => acceptsArgumentCount(ctx, signature, argumentCount));
  if (overloads.length <= 1) return checker.getContextualType(reference);
  const [first, ...rest] = overloads.map((signature) => declaredArgumentType(ctx, signature, index, call));
  return first && rest.every((type) => type === first) ? first : undefined;
}

/** The type `reference` is used as: what its context expects, or the argument type of the call it is passed to. */
function usedAsType(ctx: InferenceContext, reference: tsserver.Expression): tsserver.Type | undefined {
  const {ts, checker} = ctx;
  const call = reference.parent;
  const isCall = ts.isCallExpression(call) || ts.isNewExpression(call);
  const index = isCall ? (call.arguments?.indexOf(reference) ?? -1) : -1;
  return isCall && index >= 0 ? argumentType(ctx, call, reference, index) : checker.getContextualType(reference);
}

/**
 * The value a profile describes: its symbol, the name it is declared by, its
 * own (unnarrowed) type, and the members of `this` it is stored in (see
 * ./this-properties), whose reads are reads of the value. `mayReference`
 * tells the walks which subtrees spell one of those names at all; no other
 * one can hold a reference.
 */
interface ProfileTarget {
  readonly symbol: tsserver.Symbol;
  readonly declarationName: tsserver.Identifier;
  readonly declaredType: tsserver.Type;
  readonly storedIn: ReadonlySet<tsserver.Symbol>;
  readonly mayReference: SpellingFilter;
}

function isReferenceTo(ctx: InferenceContext, target: ProfileTarget, node: tsserver.Node): node is tsserver.Expression {
  const isName =
    ctx.ts.isIdentifier(node) &&
    node !== target.declarationName &&
    node.text === target.declarationName.text &&
    ctx.checker.getSymbolAtLocation(node) === target.symbol;
  return isName || isStoredMemberRead(ctx, target.storedIn, node);
}

/** True when `condition` tests the value for a member (`'m' in x`, `x.hasOwnProperty('m')`, ...). */
function testsPresence(ctx: InferenceContext, target: ProfileTarget, condition: tsserver.Node): boolean {
  const visit = (node: tsserver.Node): boolean =>
    target.mayReference(node) &&
    ((isReferenceTo(ctx, target, node) && presenceTestedMember(ctx, node) !== undefined) ||
      ctx.ts.forEachChild(node, visit) === true);
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

/** What a branching `node` tests and the branches it picks between, for `if`, `?:` and `&&`. */
function branchingOf(
  ts: typeof tsserver,
  node: tsserver.Node,
): {condition: tsserver.Node; branches: tsserver.Node[]} | undefined {
  if (ts.isIfStatement(node)) {
    const branches = node.elseStatement ? [node.thenStatement, node.elseStatement] : [node.thenStatement];
    return {condition: node.expression, branches};
  }
  if (ts.isConditionalExpression(node)) return {condition: node.condition, branches: [node.whenTrue, node.whenFalse]};
  const isAnd = ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken;
  return isAnd ? {condition: node.left, branches: [node.right]} : undefined;
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
  if (ts.isBlock(node) || ts.isSourceFile(node)) return statementsAfterPresenceExit(ctx, target, node.statements);
  const branching = branchingOf(ts, node);
  return branching && testsPresence(ctx, target, branching.condition) ? branching.branches : [];
}

/** Records one member the value is accessed by; `optional` when only some variants of the value need it. */
function recordMember(
  profile: Pick<ProfileBuilder, 'memberNames' | 'optionalMemberNames'>,
  name: string,
  optional: boolean,
): void {
  profile.memberNames.add(name);
  if (optional) profile.optionalMemberNames.add(name);
}

function pushDefined<T>(list: T[], value: T | undefined): void {
  if (value !== undefined) list.push(value);
}

/** One reference to the profiled value, and whether only some variants of the value reach it (see {@link variantBranches}). */
interface ReferenceUse {
  readonly ctx: InferenceContext;
  readonly target: ProfileTarget;
  readonly reference: tsserver.Expression;
  readonly inVariantBranch: boolean;
}

/** The binary expression `reference` is the left operand of, when its operator is `operator`. */
function leftOperandOf(
  ctx: InferenceContext,
  reference: tsserver.Expression,
  operator: tsserver.SyntaxKind,
): tsserver.BinaryExpression | undefined {
  const parent = reference.parent;
  const matches = ctx.ts.isBinaryExpression(parent) && parent.left === reference;
  return matches && parent.operatorToken.kind === operator ? parent : undefined;
}

/** The member name a `x.m` / `x['m']` access reads, except the one the cursor is still typing. */
function accessedMemberName(
  ctx: InferenceContext,
  access: tsserver.PropertyAccessExpression | tsserver.ElementAccessExpression,
): string | undefined {
  if (!ctx.ts.isPropertyAccessExpression(access)) return literalText(ctx, access.argumentExpression);
  return isTriggerAccess(ctx, access) ? undefined : access.name.text;
}

// Each recorder recognizes one role a reference can play and records it,
// returning true when the reference played that role.

/** `'m' in x`, `x.hasOwnProperty('m')`, ...: a member only some variants of the value have. */
function recordPresenceTest({ctx, reference}: ReferenceUse, profile: ProfileBuilder): boolean {
  const member = presenceTestedMember(ctx, reference);
  if (member !== undefined) recordMember(profile, member, true);
  return member !== undefined;
}

// Array methods whose arguments become elements of the receiver.
const ELEMENT_ADDING_METHODS: ReadonlySet<string> = new Set(['push', 'unshift']);

/** The value `access = value` assigns, if `access` is the target of a plain assignment. */
function valueAssignedTo(ctx: InferenceContext, access: tsserver.Expression): tsserver.Expression | undefined {
  const {ts} = ctx;
  const assignment = access.parent;
  const isAssignment =
    ts.isBinaryExpression(assignment) &&
    assignment.left === access &&
    assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken;
  return isAssignment ? assignment.right : undefined;
}

/** The values `x.push(a, b)` / `x.unshift(a)` add as elements, when `access` is such a call's callee. */
function addedElements(
  ctx: InferenceContext,
  access: tsserver.Expression,
  member: string | undefined,
): tsserver.Expression[] | undefined {
  const {ts} = ctx;
  const call = access.parent;
  if (member === undefined || !ELEMENT_ADDING_METHODS.has(member)) return undefined;
  if (!ts.isCallExpression(call) || call.expression !== access) return undefined;
  return call.arguments.filter((argument) => !ts.isSpreadElement(argument));
}

/** What an access writes into the value: elements (`x.push(v)`, `x[i] = v`) or a member (`x.m = v`). */
function recordWrite(
  ctx: InferenceContext,
  access: tsserver.PropertyAccessExpression | tsserver.ElementAccessExpression,
  member: string | undefined,
  profile: ProfileBuilder,
): void {
  const added = addedElements(ctx, access, member);
  const value = added ? undefined : valueAssignedTo(ctx, access);
  if (added) profile.pushedValues.push(...added);
  else if (value && member !== undefined) {
    profile.memberValues.set(member, [...(profile.memberValues.get(member) ?? []), value]);
  } else if (value && ctx.ts.isElementAccessExpression(access)) profile.pushedValues.push(value);
}

/** `x.m` / `x['m']`: a member the value is accessed by, and anything the access writes into it. */
function recordMemberAccess({ctx, reference, inVariantBranch}: ReferenceUse, profile: ProfileBuilder): boolean {
  const {ts} = ctx;
  const access = reference.parent;
  const isAccess = ts.isPropertyAccessExpression(access) || ts.isElementAccessExpression(access);
  if (!isAccess || access.expression !== reference) return false;
  const member = accessedMemberName(ctx, access);
  if (member !== undefined) recordMember(profile, member, inVariantBranch);
  recordWrite(ctx, access, member, profile);
  return true;
}

/** `typeof x === 'string'`: a primitive the value is tested against. */
function recordTypeofTest({ctx, reference}: ReferenceUse, profile: ProfileBuilder): boolean {
  const typeOf = reference.parent;
  if (!ctx.ts.isTypeOfExpression(typeOf)) return false;
  pushDefined(profile.guardTypes, primitiveOfTypeofCheck(ctx, typeOf));
  return true;
}

/** `x instanceof C`: a class the value is tested against. */
function recordInstanceofTest({ctx, reference}: ReferenceUse, profile: ProfileBuilder): boolean {
  const test = leftOperandOf(ctx, reference, ctx.ts.SyntaxKind.InstanceOfKeyword);
  if (test) pushDefined(profile.guardTypes, instanceTypeOf(ctx, test.right));
  return test !== undefined;
}

/** `x = value`: a value the variable is reassigned. */
function recordAssignment({ctx, reference}: ReferenceUse, profile: ProfileBuilder): boolean {
  const assignment = leftOperandOf(ctx, reference, ctx.ts.SyntaxKind.EqualsToken);
  if (assignment) profile.assignedValues.push(assignment.right);
  return assignment !== undefined;
}

/**
 * `helper(x)`, `new Model(x)`, `Base.call(this, x)` with an undocumented
 * project function: the value is used however that function uses its
 * parameter. Never the only role a reference plays — the contextual use is
 * recorded too.
 */
function recordForwarding({ctx, reference, inVariantBranch}: ReferenceUse, profile: ProfileBuilder): boolean {
  const parameter = receivingParameter(ctx, reference);
  if (parameter && !hasExplicitParameterType(parameter, ctx.ts)) {
    profile.forwardedTo.push({parameter, optional: inVariantBranch});
  }
  return false;
}

/**
 * Any other use: the type the code uses the value as. A reference the
 * checker narrowed (inside `if (typeof x === 'string')`) is used as what that
 * one branch holds, which says nothing about every value.
 */
function recordContextualUse({ctx, target, reference}: ReferenceUse, profile: ProfileBuilder): boolean {
  if (ctx.checker.getTypeAtLocation(reference) === target.declaredType) {
    pushDefined(profile.contextualTypes, usedAsType(ctx, reference));
  }
  return true;
}

const REFERENCE_RECORDERS = [
  recordPresenceTest,
  recordMemberAccess,
  recordTypeofTest,
  recordInstanceofTest,
  recordAssignment,
  recordForwarding,
  recordContextualUse,
];

/** Records what one reference to the profiled value says about it: the first role it plays wins. */
function recordReference(use: ReferenceUse, profile: ProfileBuilder): void {
  REFERENCE_RECORDERS.some((record) => record(use, profile));
}

function collectProfile(ctx: InferenceContext, target: ProfileTarget, scope: tsserver.Node): UsageProfile {
  const profile = emptyProfile();
  const visit = (node: tsserver.Node, inVariantBranch: boolean): void => {
    if (!target.mayReference(node)) return;
    if (isReferenceTo(ctx, target, node)) recordReference({ctx, target, reference: node, inVariantBranch}, profile);
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
 * Where a value's uses can be: a parameter's function body (nested closures
 * included), a variable's enclosing function or file, or — once a parameter
 * is stored on `this` — the whole file its prototype methods read it in.
 */
function profileScope(
  ctx: InferenceContext,
  declaration: tsserver.ParameterDeclaration | tsserver.VariableDeclaration,
  storedIn: ReadonlySet<tsserver.Symbol>,
): tsserver.Node | undefined {
  if (storedIn.size > 0) return declaration.getSourceFile();
  return ctx.ts.isParameter(declaration)
    ? (declaration.parent as tsserver.FunctionLikeDeclaration).body
    : (enclosingFunctionBody(ctx, declaration) ?? declaration.getSourceFile());
}

/**
 * What the value's own scope says about it, gathered over its
 * {@link profileScope}; a parameter stored on `this` is also read through
 * that member (see ./this-properties). Destructured declarations have no
 * single value to profile and get an empty profile. Memoized per request.
 */
function ownProfileOf(
  ctx: InferenceContext,
  declaration: tsserver.ParameterDeclaration | tsserver.VariableDeclaration,
): UsageProfile {
  const {ts, checker} = ctx;
  const declarationName = declaration.name;
  if (!ts.isIdentifier(declarationName)) return EMPTY_PROFILE;
  const symbol = checker.getSymbolAtLocation(declarationName);
  const cached = symbol && ctx.profiles.get(symbol);
  if (!symbol || cached) return cached ?? EMPTY_PROFILE;
  const storedIn = ts.isParameter(declaration) ? thisMembersStoring(ctx, declaration) : new Set<tsserver.Symbol>();
  const scope = profileScope(ctx, declaration, storedIn);
  if (!scope) return EMPTY_PROFILE;
  const declaredType = checker.getTypeOfSymbolAtLocation(symbol, declarationName);
  const mayReference = spellingFilter(scope, [declarationName.text, ...[...storedIn].map((member) => member.name)]);
  const profile = collectProfile(ctx, {symbol, declarationName, declaredType, storedIn, mayReference}, scope);
  ctx.profiles.set(symbol, profile);
  return profile;
}

/**
 * The own profiles of the parameters `profile`'s value is passed on to,
 * breadth first, up to {@link MAX_USAGE_FORWARDING_HOPS} functions away; a
 * profile reached through a variant branch anywhere along the way is
 * optional.
 */
function forwardedProfiles(
  ctx: InferenceContext,
  declaration: tsserver.Declaration,
  profile: UsageProfile,
): {profile: UsageProfile; optional: boolean}[] {
  const reached: {profile: UsageProfile; optional: boolean}[] = [];
  const seen = new Set<tsserver.Node>([declaration]);
  let frontier = profile.forwardedTo;
  for (let hop = 0; hop < MAX_USAGE_FORWARDING_HOPS && frontier.length > 0; hop++) {
    const unseen = frontier.filter(({parameter}) => !seen.has(parameter) && seen.add(parameter));
    const profiles = unseen.map(({parameter, optional}) => ({profile: ownProfileOf(ctx, parameter), optional}));
    reached.push(...profiles);
    frontier = profiles.flatMap(({profile: next, optional}) =>
      next.forwardedTo.map((use) => ({parameter: use.parameter, optional: optional || use.optional})),
    );
  }
  return reached;
}

/**
 * The usage profile of a parameter or a variable: what its own scope says
 * about it (see {@link ownProfileOf}), plus the members and contextual types
 * of the parameters it is passed on to unchanged — a wrapper's `x` must
 * support whatever the `new Model(x)` it forwards to does with it.
 */
export function usageProfileOf(
  ctx: InferenceContext,
  declaration: tsserver.ParameterDeclaration | tsserver.VariableDeclaration,
): UsageProfile {
  const own = ownProfileOf(ctx, declaration);
  if (own.forwardedTo.length === 0) return own;
  const members = {memberNames: new Set(own.memberNames), optionalMemberNames: new Set(own.optionalMemberNames)};
  const contextualTypes = [...own.contextualTypes];
  for (const {profile, optional} of forwardedProfiles(ctx, declaration, own)) {
    for (const name of profile.memberNames) {
      recordMember(members, name, optional || profile.optionalMemberNames.has(name));
    }
    contextualTypes.push(...profile.contextualTypes);
  }
  return {...own, ...members, contextualTypes};
}
