"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberValueExpressions = memberValueExpressions;
exports.localMemberValues = localMemberValues;
exports.valueDeclarationOf = valueDeclarationOf;
const usage_profile_1 = require("./usage-profile");
/** The value of one member declaration: `key: value`, `{key}`, `key = value;` in a class, `this.key = value`. */
function declaredValue(ctx, declaration) {
    const { ts } = ctx;
    if (ts.isPropertyAssignment(declaration) || ts.isPropertyDeclaration(declaration))
        return declaration.initializer;
    if (ts.isShorthandPropertyAssignment(declaration))
        return declaration.name;
    const assignment = ts.isBinaryExpression(declaration) ? declaration : declaration.parent;
    const isAssignment = assignment !== undefined &&
        ts.isBinaryExpression(assignment) &&
        assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    return isAssignment ? assignment.right : undefined;
}
/**
 * The values a member symbol is declared with: an object literal's
 * `key: value` and `{key}` shorthand, a class field initializer, and the
 * right-hand sides of `this.key = value` / `obj.key = value` assignments a
 * JavaScript constructor or expando declares it by.
 */
function memberValueExpressions(ctx, member) {
    return (member.declarations ?? []).flatMap((declaration) => declaredValue(ctx, declaration) ?? []);
}
/**
 * The values the code writes to `memberName` on an untyped local receiver
 * (`productData.apiProduct = ProductMgr.getProduct(id)`), read back later
 * through the same parameter or variable (`return productData.apiProduct`).
 */
function localMemberValues(ctx, receiver, memberName) {
    const { ts } = ctx;
    const declaration = ts.isIdentifier(receiver) ? valueDeclarationOf(ctx, receiver) : undefined;
    const isLocal = declaration && (ts.isParameter(declaration) || ts.isVariableDeclaration(declaration));
    return isLocal ? ((0, usage_profile_1.usageProfileOf)(ctx, declaration).memberValues.get(memberName) ?? []) : [];
}
/**
 * The declaration of the value `identifier` reads. The name of a `{key}`
 * shorthand resolves to the object literal's property, not to the variable
 * whose value it copies, so that one asks the checker for the value symbol.
 */
function valueDeclarationOf(ctx, identifier) {
    const { ts, checker } = ctx;
    const shorthand = ts.isShorthandPropertyAssignment(identifier.parent) ? identifier.parent : undefined;
    const symbol = shorthand
        ? checker.getShorthandAssignmentValueSymbol(shorthand)
        : checker.getSymbolAtLocation(identifier);
    return symbol?.valueDeclaration;
}
