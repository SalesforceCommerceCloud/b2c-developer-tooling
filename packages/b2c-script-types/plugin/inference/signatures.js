"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCalleeDeclaration = resolveCalleeDeclaration;
exports.isElementFirstCallbackCall = isElementFirstCallbackCall;
exports.acceptsArgumentCount = acceptsArgumentCount;
exports.callbackParameterTypes = callbackParameterTypes;
const constants_1 = require("./constants");
const type_helpers_1 = require("./type-helpers");
/**
 * Resolves the function-like declaration a call expression's callee refers
 * to, via its symbol or — as a fallback for shapes the symbol lookup misses
 * — the checker's resolved signature.
 */
function resolveCalleeDeclaration(ctx, call) {
    const { checker, ts } = ctx;
    const sym = checker.getSymbolAtLocation(call.expression);
    const decl = sym?.valueDeclaration ?? sym?.declarations?.[0];
    if (decl && ts.isFunctionLike(decl))
        return decl;
    const sigDecl = checker.getResolvedSignature(call)?.declaration;
    return sigDecl && ts.isFunctionLike(sigDecl) ? sigDecl : undefined;
}
/** True when `call` invokes one of the {@link ELEMENT_FIRST_CALLBACK_CALLEES} (`collections.forEach(coll, fn)`). */
function isElementFirstCallbackCall(ctx, call) {
    const { ts } = ctx;
    const callee = ts.isPropertyAccessExpression(call.expression) ? call.expression.name : call.expression;
    return ts.isIdentifier(callee) && constants_1.ELEMENT_FIRST_CALLBACK_CALLEES.has(callee.text);
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
/** The type `signature` gives parameter `paramIndex` of the callback it takes as argument `argIndex`. */
function callbackParameterType(ctx, signature, call, argIndex, paramIndex) {
    const { checker } = ctx;
    const parameter = signature.getParameters()[argIndex];
    const callbackType = parameter && checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(parameter, call));
    const callbackParameter = callbackType?.getCallSignatures()[0]?.getParameters()[paramIndex];
    return callbackParameter && checker.getTypeOfSymbolAtLocation(callbackParameter, call);
}
/**
 * The types `methodTypes`' declared signatures give parameter `paramIndex`
 * of the callback `call` passes as argument `argIndex`: `value: T` of
 * `filter(predicate: (value: T, ...) => unknown)` on a `ProductLineItem[]`.
 * Overloads taking that many arguments must agree, so the accumulator of
 * `reduce(callback, initialValue)` (`T` or `U`, by overload) stays unknown.
 */
function callbackParameterTypes(ctx, methodTypes, call, argIndex, paramIndex) {
    return methodTypes.flatMap((methodType) => {
        const overloads = methodType
            .getCallSignatures()
            .filter((signature) => acceptsArgumentCount(ctx, signature, call.arguments.length));
        const [first, ...rest] = overloads.map((signature) => callbackParameterType(ctx, signature, call, argIndex, paramIndex));
        const key = first && (0, type_helpers_1.typeDisplayString)(ctx, first);
        return first && rest.every((type) => type && (0, type_helpers_1.typeDisplayString)(ctx, type) === key) ? [first] : [];
    });
}
