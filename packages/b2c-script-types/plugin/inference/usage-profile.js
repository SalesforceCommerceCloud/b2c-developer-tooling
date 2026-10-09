"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageProfileOf = usageProfileOf;
const type_helpers_1 = require("./type-helpers");
function emptyProfile() {
    return {
        memberNames: new Set(),
        optionalMemberNames: new Set(),
        guardTypes: [],
        contextualTypes: [],
        assignedValues: [],
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
/**
 * The member a presence test on `reference` checks for: `'m' in x`,
 * `x.hasOwnProperty('m')`, or `Object[.prototype].hasOwnProperty.call(x, 'm')`.
 */
function presenceTestedMember(ctx, reference) {
    const { ts } = ctx;
    const parent = reference.parent;
    if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.InKeyword) {
        return parent.right === reference ? literalText(ctx, parent.left) : undefined;
    }
    const isOwnReceiver = ts.isPropertyAccessExpression(parent) && parent.expression === reference && parent.name.text === 'hasOwnProperty';
    const call = isOwnReceiver ? parent.parent : parent;
    if (!ts.isCallExpression(call))
        return undefined;
    if (isOwnReceiver)
        return call.expression === parent ? literalText(ctx, call.arguments[0]) : undefined;
    const callee = call.expression;
    const isHasOwnCall = call.arguments[0] === reference &&
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
/** True when `signature` takes `count` arguments (synthetic signatures without a declaration always do). */
function acceptsArgumentCount(ctx, signature, count) {
    const { ts, checker } = ctx;
    const declaration = signature.getDeclaration();
    if (!declaration)
        return true;
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
function usedAsType(ctx, reference) {
    const { ts, checker } = ctx;
    const call = reference.parent;
    const isCall = ts.isCallExpression(call) || ts.isNewExpression(call);
    const args = (isCall && call.arguments) || [];
    const index = args.indexOf(reference);
    if (!isCall || index < 0)
        return checker.getContextualType(reference);
    const callee = checker.getTypeAtLocation(call.expression);
    const signatures = ts.isNewExpression(call) ? callee.getConstructSignatures() : callee.getCallSignatures();
    const overloads = signatures.filter((signature) => acceptsArgumentCount(ctx, signature, args.length));
    if (overloads.length <= 1)
        return checker.getContextualType(reference);
    const [first, ...rest] = overloads.map((signature) => declaredArgumentType(ctx, signature, index, call));
    return first && rest.every((type) => type === first) ? first : undefined;
}
function isReferenceTo(ctx, target, node) {
    return (ctx.ts.isIdentifier(node) &&
        node !== target.declarationName &&
        node.text === target.declarationName.text &&
        ctx.checker.getSymbolAtLocation(node) === target.symbol);
}
/** True when `condition` tests the value for a member (`'m' in x`, `x.hasOwnProperty('m')`, ...). */
function testsPresence(ctx, target, condition) {
    const visit = (node) => (isReferenceTo(ctx, target, node) && presenceTestedMember(ctx, node) !== undefined) ||
        ctx.ts.forEachChild(node, visit) === true;
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
    if (ts.isIfStatement(node)) {
        if (!testsPresence(ctx, target, node.expression))
            return [];
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
function recordMember(profile, name, optional) {
    profile.memberNames.add(name);
    if (optional)
        profile.optionalMemberNames.add(name);
}
/**
 * Records what one reference to the profiled value says about it.
 * `inVariantBranch` marks a reference inside a branch only some variants of
 * the value reach (see {@link variantBranches}). A reference the checker
 * narrowed (inside `if (typeof x === 'string')`) is used as what that one
 * branch holds, which says nothing about every value.
 */
function recordReference(ctx, target, reference, inVariantBranch, profile) {
    const { ts, checker } = ctx;
    const parent = reference.parent;
    const tested = presenceTestedMember(ctx, reference);
    if (tested !== undefined) {
        recordMember(profile, tested, true);
        return;
    }
    if (ts.isPropertyAccessExpression(parent) && parent.expression === reference) {
        if (!isTriggerAccess(ctx, parent))
            recordMember(profile, parent.name.text, inVariantBranch);
        return;
    }
    if (ts.isElementAccessExpression(parent) && parent.expression === reference) {
        const member = literalText(ctx, parent.argumentExpression);
        if (member !== undefined)
            recordMember(profile, member, inVariantBranch);
        return;
    }
    if (ts.isTypeOfExpression(parent)) {
        const primitive = primitiveOfTypeofCheck(ctx, parent);
        if (primitive)
            profile.guardTypes.push(primitive);
        return;
    }
    if (ts.isBinaryExpression(parent)) {
        const operator = parent.operatorToken.kind;
        if (operator === ts.SyntaxKind.InstanceOfKeyword && parent.left === reference) {
            const instance = instanceTypeOf(ctx, parent.right);
            if (instance)
                profile.guardTypes.push(instance);
            return;
        }
        if (operator === ts.SyntaxKind.EqualsToken && parent.left === reference) {
            profile.assignedValues.push(parent.right);
            return;
        }
    }
    if (checker.getTypeAtLocation(reference) !== target.declaredType)
        return;
    const used = usedAsType(ctx, reference);
    if (used)
        profile.contextualTypes.push(used);
}
function collectProfile(ctx, symbol, declarationName, scope) {
    const declaredType = ctx.checker.getTypeOfSymbolAtLocation(symbol, declarationName);
    const target = { symbol, declarationName, declaredType };
    const profile = emptyProfile();
    const visit = (node, inVariantBranch) => {
        if (isReferenceTo(ctx, target, node))
            recordReference(ctx, target, node, inVariantBranch, profile);
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
 * The usage profile of a parameter (scoped to its function body, nested
 * closures included) or a variable (scoped to its enclosing function, or the
 * whole file for a top-level variable). Destructured declarations have no
 * single value to profile and get an empty profile. Memoized per request.
 */
function usageProfileOf(ctx, declaration) {
    const { ts, checker } = ctx;
    if (!ts.isIdentifier(declaration.name))
        return EMPTY_PROFILE;
    const symbol = checker.getSymbolAtLocation(declaration.name);
    const scope = ts.isParameter(declaration)
        ? declaration.parent.body
        : (enclosingFunctionBody(ctx, declaration) ?? declaration.getSourceFile());
    if (!symbol || !scope)
        return EMPTY_PROFILE;
    const cached = ctx.profiles.get(symbol);
    if (cached)
        return cached;
    const profile = collectProfile(ctx, symbol, declaration.name, scope);
    ctx.profiles.set(symbol, profile);
    return profile;
}
