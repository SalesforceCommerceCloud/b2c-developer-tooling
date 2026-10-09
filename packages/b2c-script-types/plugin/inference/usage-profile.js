"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageProfileOf = usageProfileOf;
const ast_helpers_1 = require("./ast-helpers");
const constants_1 = require("./constants");
const signatures_1 = require("./signatures");
const this_properties_1 = require("./this-properties");
const type_helpers_1 = require("./type-helpers");
const value_flow_1 = require("./value-flow");
function emptyProfile() {
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
const EMPTY_PROFILE = emptyProfile();
/**
 * The instance type an `instanceof` right-hand side tests for
 * (`dw.order.ProductLineItem`, a local class binding, ...): its construct
 * signature's return type, or — for a JS constructor function, which has
 * none — the declared type of the right-hand side's symbol. A test against a
 * root type (`x instanceof Object`) says nothing and yields undefined.
 */
function instanceTypeOf(ctx, constructor) {
    const { checker, ts } = ctx;
    const constructorType = checker.getTypeAtLocation(constructor);
    const [signature] = constructorType.getConstructSignatures();
    const symbol = constructorType.getSymbol() ?? checker.getSymbolAtLocation(constructor);
    const instance = signature
        ? checker.getReturnTypeOfSignature(signature)
        : symbol && checker.getDeclaredTypeOfSymbol(symbol);
    return instance && !(0, type_helpers_1.isOpenForUsageInference)(ts, instance) ? instance : undefined;
}
/** The primitive a `typeof x === 'string'` comparison names, if `typeOf` sits in one. */
function primitiveOfTypeofCheck(ctx, typeOf) {
    const { ts, checker } = ctx;
    const comparison = typeOf.parent;
    if (!ts.isBinaryExpression(comparison))
        return undefined;
    const other = comparison.left === typeOf ? comparison.right : comparison.left;
    if (!ts.isStringLiteralLike(other))
        return undefined;
    if (other.text === 'string')
        return checker.getStringType();
    if (other.text === 'number')
        return checker.getNumberType();
    if (other.text === 'boolean')
        return checker.getBooleanType();
    return undefined;
}
/** The string a presence test names, if `node` is a string literal. */
function literalText(ctx, node) {
    return node && ctx.ts.isStringLiteralLike(node) ? node.text : undefined;
}
/** `'m' in x`: the member an `in` test on `reference` names. */
function inOperatorMember(ctx, reference) {
    const { ts } = ctx;
    const test = reference.parent;
    const isInTest = ts.isBinaryExpression(test) && test.operatorToken.kind === ts.SyntaxKind.InKeyword && test.right === reference;
    return isInTest ? literalText(ctx, test.left) : undefined;
}
/** `x.hasOwnProperty('m')`: the member an own-property method call on `reference` names. */
function ownPropertyMethodMember(ctx, reference) {
    const { ts } = ctx;
    const access = reference.parent;
    const isHasOwn = ts.isPropertyAccessExpression(access) && access.expression === reference && access.name.text === 'hasOwnProperty';
    const call = access.parent;
    return isHasOwn && ts.isCallExpression(call) && call.expression === access
        ? literalText(ctx, call.arguments[0])
        : undefined;
}
/** `Object[.prototype].hasOwnProperty.call(x, 'm')`: the member a borrowed own-property call on `reference` names. */
function ownPropertyCallMember(ctx, reference) {
    const { ts } = ctx;
    const call = reference.parent;
    if (!ts.isCallExpression(call) || call.arguments[0] !== reference)
        return undefined;
    const callee = call.expression;
    const isHasOwnCall = ts.isPropertyAccessExpression(callee) &&
        callee.name.text === 'call' &&
        ts.isPropertyAccessExpression(callee.expression) &&
        callee.expression.name.text === 'hasOwnProperty';
    return isHasOwnCall ? literalText(ctx, call.arguments[1]) : undefined;
}
/**
 * The member a presence test on `reference` checks for: `'m' in x`,
 * `x.hasOwnProperty('m')`, or `Object[.prototype].hasOwnProperty.call(x, 'm')`.
 */
function presenceTestedMember(ctx, reference) {
    return (inOperatorMember(ctx, reference) ?? ownPropertyMethodMember(ctx, reference) ?? ownPropertyCallMember(ctx, reference));
}
/**
 * True when `access` is the member access the current request's own cursor
 * sits in (see {@link InferenceContext.triggerPosition}): a member name being
 * typed (`shipment.pro|`) is not evidence yet, and a dangling `shipment.`
 * followed by more code parses as an access to whatever identifier comes
 * next, which no real class has.
 */
function isTriggerAccess(ctx, access) {
    const trigger = ctx.triggerPosition;
    return trigger !== undefined && access.expression.getEnd() <= trigger && trigger <= access.name.getEnd();
}
/** The type `signature` declares for argument `index` of `call`, unless a rest parameter collects it. */
function declaredArgumentType(ctx, signature, index, call) {
    const parameter = signature.getParameters()[index];
    const declaration = parameter?.valueDeclaration;
    if (!parameter || (declaration && ctx.ts.isParameter(declaration) && declaration.dotDotDotToken))
        return undefined;
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
function argumentType(ctx, call, reference, index) {
    const { ts, checker } = ctx;
    const argumentCount = call.arguments?.length ?? 0;
    const callee = checker.getTypeAtLocation(call.expression);
    const signatures = ts.isNewExpression(call) ? callee.getConstructSignatures() : callee.getCallSignatures();
    const overloads = signatures.filter((signature) => (0, signatures_1.acceptsArgumentCount)(ctx, signature, argumentCount));
    if (overloads.length <= 1)
        return checker.getContextualType(reference);
    const [first, ...rest] = overloads.map((signature) => declaredArgumentType(ctx, signature, index, call));
    return first && rest.every((type) => type === first) ? first : undefined;
}
/** The type `reference` is used as: what its context expects, or the argument type of the call it is passed to. */
function usedAsType(ctx, reference) {
    const { ts, checker } = ctx;
    const call = reference.parent;
    const isCall = ts.isCallExpression(call) || ts.isNewExpression(call);
    const index = isCall ? (call.arguments?.indexOf(reference) ?? -1) : -1;
    return isCall && index >= 0 ? argumentType(ctx, call, reference, index) : checker.getContextualType(reference);
}
function isReferenceTo(ctx, target, node) {
    const isName = ctx.ts.isIdentifier(node) &&
        node !== target.declarationName &&
        node.text === target.declarationName.text &&
        ctx.checker.getSymbolAtLocation(node) === target.symbol;
    return isName || (0, this_properties_1.isStoredMemberRead)(ctx, target.storedIn, node);
}
/** True when `condition` tests the value for a member (`'m' in x`, `x.hasOwnProperty('m')`, ...). */
function testsPresence(ctx, target, condition) {
    const visit = (node) => target.mayReference(node) &&
        ((isReferenceTo(ctx, target, node) && presenceTestedMember(ctx, node) !== undefined) ||
            ctx.ts.forEachChild(node, visit) === true);
    return visit(condition);
}
/** True when `statement` always leaves its block: a `return`/`throw`, or a block ending in one. */
function alwaysExits(ctx, statement) {
    const { ts } = ctx;
    const last = ts.isBlock(statement) ? statement.statements[statement.statements.length - 1] : statement;
    return last !== undefined && (ts.isReturnStatement(last) || ts.isThrowStatement(last));
}
/** The statements after an early-exit presence test (`if ('m' in x) { return …; }`): its implicit `else`. */
function statementsAfterPresenceExit(ctx, target, statements) {
    const { ts } = ctx;
    const guard = statements.findIndex((statement) => ts.isIfStatement(statement) &&
        !statement.elseStatement &&
        alwaysExits(ctx, statement.thenStatement) &&
        testsPresence(ctx, target, statement.expression));
    return guard < 0 ? [] : statements.slice(guard + 1);
}
/** What a branching `node` tests and the branches it picks between, for `if`, `?:` and `&&`. */
function branchingOf(ts, node) {
    if (ts.isIfStatement(node)) {
        const branches = node.elseStatement ? [node.thenStatement, node.elseStatement] : [node.thenStatement];
        return { condition: node.expression, branches };
    }
    if (ts.isConditionalExpression(node))
        return { condition: node.condition, branches: [node.whenTrue, node.whenFalse] };
    const isAnd = ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken;
    return isAnd ? { condition: node.left, branches: [node.right] } : undefined;
}
/**
 * The branches of `node` that only run for some variants of the value: both
 * branches of an `if`/`?:` that tests it for a member first (an early
 * `return` making the rest of the block the `else`), and the right side of
 * `'m' in x && …`. The test tells the code which kind of value it holds, so
 * a member either branch uses belongs to that kind alone
 * (`if ('searchPhraseSuggestions' in s) … else s.hasNext()`).
 */
function variantBranches(ctx, target, node) {
    const { ts } = ctx;
    if (ts.isBlock(node) || ts.isSourceFile(node))
        return statementsAfterPresenceExit(ctx, target, node.statements);
    const branching = branchingOf(ts, node);
    return branching && testsPresence(ctx, target, branching.condition) ? branching.branches : [];
}
/** Records one member the value is accessed by; `optional` when only some variants of the value need it. */
function recordMember(profile, name, optional) {
    profile.memberNames.add(name);
    if (optional)
        profile.optionalMemberNames.add(name);
}
function pushDefined(list, value) {
    if (value !== undefined)
        list.push(value);
}
/** The binary expression `reference` is the left operand of, when its operator is `operator`. */
function leftOperandOf(ctx, reference, operator) {
    const parent = reference.parent;
    const matches = ctx.ts.isBinaryExpression(parent) && parent.left === reference;
    return matches && parent.operatorToken.kind === operator ? parent : undefined;
}
/** The member name a `x.m` / `x['m']` access reads, except the one the cursor is still typing. */
function accessedMemberName(ctx, access) {
    if (!ctx.ts.isPropertyAccessExpression(access))
        return literalText(ctx, access.argumentExpression);
    return isTriggerAccess(ctx, access) ? undefined : access.name.text;
}
// Each recorder recognizes one role a reference can play and records it,
// returning true when the reference played that role.
/** `'m' in x`, `x.hasOwnProperty('m')`, ...: a member only some variants of the value have. */
function recordPresenceTest({ ctx, reference }, profile) {
    const member = presenceTestedMember(ctx, reference);
    if (member !== undefined)
        recordMember(profile, member, true);
    return member !== undefined;
}
// Array methods whose arguments become elements of the receiver.
const ELEMENT_ADDING_METHODS = new Set(['push', 'unshift']);
/** The value `access = value` assigns, if `access` is the target of a plain assignment. */
function valueAssignedTo(ctx, access) {
    const { ts } = ctx;
    const assignment = access.parent;
    const isAssignment = ts.isBinaryExpression(assignment) &&
        assignment.left === access &&
        assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    return isAssignment ? assignment.right : undefined;
}
/** The values `x.push(a, b)` / `x.unshift(a)` add as elements, when `access` is such a call's callee. */
function addedElements(ctx, access, member) {
    const { ts } = ctx;
    const call = access.parent;
    if (member === undefined || !ELEMENT_ADDING_METHODS.has(member))
        return undefined;
    if (!ts.isCallExpression(call) || call.expression !== access)
        return undefined;
    return call.arguments.filter((argument) => !ts.isSpreadElement(argument));
}
/** What an access writes into the value: elements (`x.push(v)`, `x[i] = v`) or a member (`x.m = v`). */
function recordWrite(ctx, access, member, profile) {
    const added = addedElements(ctx, access, member);
    const value = added ? undefined : valueAssignedTo(ctx, access);
    if (added)
        profile.pushedValues.push(...added);
    else if (value && member !== undefined) {
        profile.memberValues.set(member, [...(profile.memberValues.get(member) ?? []), value]);
    }
    else if (value && ctx.ts.isElementAccessExpression(access))
        profile.pushedValues.push(value);
}
/** `x.m` / `x['m']`: a member the value is accessed by, and anything the access writes into it. */
function recordMemberAccess({ ctx, reference, inVariantBranch }, profile) {
    const { ts } = ctx;
    const access = reference.parent;
    const isAccess = ts.isPropertyAccessExpression(access) || ts.isElementAccessExpression(access);
    if (!isAccess || access.expression !== reference)
        return false;
    const member = accessedMemberName(ctx, access);
    if (member !== undefined)
        recordMember(profile, member, inVariantBranch);
    recordWrite(ctx, access, member, profile);
    return true;
}
/** `typeof x === 'string'`: a primitive the value is tested against. */
function recordTypeofTest({ ctx, reference }, profile) {
    const typeOf = reference.parent;
    if (!ctx.ts.isTypeOfExpression(typeOf))
        return false;
    pushDefined(profile.guardTypes, primitiveOfTypeofCheck(ctx, typeOf));
    return true;
}
/** `x instanceof C`: a class the value is tested against. */
function recordInstanceofTest({ ctx, reference }, profile) {
    const test = leftOperandOf(ctx, reference, ctx.ts.SyntaxKind.InstanceOfKeyword);
    if (test)
        pushDefined(profile.guardTypes, instanceTypeOf(ctx, test.right));
    return test !== undefined;
}
/** `x = value`: a value the variable is reassigned. */
function recordAssignment({ ctx, reference }, profile) {
    const assignment = leftOperandOf(ctx, reference, ctx.ts.SyntaxKind.EqualsToken);
    if (assignment)
        profile.assignedValues.push(assignment.right);
    return assignment !== undefined;
}
/**
 * `helper(x)`, `new Model(x)`, `Base.call(this, x)` with an undocumented
 * project function: the value is used however that function uses its
 * parameter. Never the only role a reference plays — the contextual use is
 * recorded too.
 */
function recordForwarding({ ctx, reference, inVariantBranch }, profile) {
    const parameter = (0, value_flow_1.receivingParameter)(ctx, reference);
    if (parameter && !(0, ast_helpers_1.hasExplicitParameterType)(parameter, ctx.ts)) {
        profile.forwardedTo.push({ parameter, optional: inVariantBranch });
    }
    return false;
}
/**
 * Any other use: the type the code uses the value as. A reference the
 * checker narrowed (inside `if (typeof x === 'string')`) is used as what that
 * one branch holds, which says nothing about every value.
 */
function recordContextualUse({ ctx, target, reference }, profile) {
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
function recordReference(use, profile) {
    REFERENCE_RECORDERS.some((record) => record(use, profile));
}
function collectProfile(ctx, target, scope) {
    const profile = emptyProfile();
    const visit = (node, inVariantBranch) => {
        if (!target.mayReference(node))
            return;
        if (isReferenceTo(ctx, target, node))
            recordReference({ ctx, target, reference: node, inVariantBranch }, profile);
        const branches = inVariantBranch ? [] : variantBranches(ctx, target, node);
        ctx.ts.forEachChild(node, (child) => visit(child, inVariantBranch || branches.includes(child)));
    };
    visit(scope, false);
    return profile;
}
/** Walks up from `node` to the body of the nearest enclosing function, if any. */
function enclosingFunctionBody(ctx, node) {
    for (let current = node.parent; current; current = current.parent) {
        if (ctx.ts.isFunctionLike(current))
            return current.body;
    }
    return undefined;
}
/**
 * Where a value's uses can be: a parameter's function body (nested closures
 * included), a variable's enclosing function or file, or — once a parameter
 * is stored on `this` — the whole file its prototype methods read it in.
 */
function profileScope(ctx, declaration, storedIn) {
    if (storedIn.size > 0)
        return declaration.getSourceFile();
    return ctx.ts.isParameter(declaration)
        ? declaration.parent.body
        : (enclosingFunctionBody(ctx, declaration) ?? declaration.getSourceFile());
}
/**
 * What the value's own scope says about it, gathered over its
 * {@link profileScope}; a parameter stored on `this` is also read through
 * that member (see ./this-properties). Destructured declarations have no
 * single value to profile and get an empty profile. Memoized per request.
 */
function ownProfileOf(ctx, declaration) {
    const { ts, checker } = ctx;
    const declarationName = declaration.name;
    if (!ts.isIdentifier(declarationName))
        return EMPTY_PROFILE;
    const symbol = checker.getSymbolAtLocation(declarationName);
    const cached = symbol && ctx.profiles.get(symbol);
    if (!symbol || cached)
        return cached ?? EMPTY_PROFILE;
    const storedIn = ts.isParameter(declaration) ? (0, this_properties_1.thisMembersStoring)(ctx, declaration) : new Set();
    const scope = profileScope(ctx, declaration, storedIn);
    if (!scope)
        return EMPTY_PROFILE;
    const declaredType = checker.getTypeOfSymbolAtLocation(symbol, declarationName);
    const mayReference = (0, ast_helpers_1.spellingFilter)(scope, [declarationName.text, ...[...storedIn].map((member) => member.name)]);
    const profile = collectProfile(ctx, { symbol, declarationName, declaredType, storedIn, mayReference }, scope);
    ctx.profiles.set(symbol, profile);
    return profile;
}
/**
 * The own profiles of the parameters `profile`'s value is passed on to,
 * breadth first, up to {@link MAX_USAGE_FORWARDING_HOPS} functions away; a
 * profile reached through a variant branch anywhere along the way is
 * optional.
 */
function forwardedProfiles(ctx, declaration, profile) {
    const reached = [];
    const seen = new Set([declaration]);
    let frontier = profile.forwardedTo;
    for (let hop = 0; hop < constants_1.MAX_USAGE_FORWARDING_HOPS && frontier.length > 0; hop++) {
        const unseen = frontier.filter(({ parameter }) => !seen.has(parameter) && seen.add(parameter));
        const profiles = unseen.map(({ parameter, optional }) => ({ profile: ownProfileOf(ctx, parameter), optional }));
        reached.push(...profiles);
        frontier = profiles.flatMap(({ profile: next, optional }) => next.forwardedTo.map((use) => ({ parameter: use.parameter, optional: optional || use.optional })));
    }
    return reached;
}
/**
 * The usage profile of a parameter or a variable: what its own scope says
 * about it (see {@link ownProfileOf}), plus the members and contextual types
 * of the parameters it is passed on to unchanged — a wrapper's `x` must
 * support whatever the `new Model(x)` it forwards to does with it.
 */
function usageProfileOf(ctx, declaration) {
    const own = ownProfileOf(ctx, declaration);
    if (own.forwardedTo.length === 0)
        return own;
    const members = { memberNames: new Set(own.memberNames), optionalMemberNames: new Set(own.optionalMemberNames) };
    const contextualTypes = [...own.contextualTypes];
    for (const { profile, optional } of forwardedProfiles(ctx, declaration, own)) {
        for (const name of profile.memberNames) {
            recordMember(members, name, optional || profile.optionalMemberNames.has(name));
        }
        contextualTypes.push(...profile.contextualTypes);
    }
    return { ...own, ...members, contextualTypes };
}
