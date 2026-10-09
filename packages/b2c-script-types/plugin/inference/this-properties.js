"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.thisMembersStoring = thisMembersStoring;
exports.isStoredMemberRead = isStoredMemberRead;
/** `this.x = value`: a plain assignment to a member of `this`. */
function isThisMemberStore(ts, node) {
    return (ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) &&
        node.left.expression.kind === ts.SyntaxKind.ThisKeyword);
}
/** True when `node` gives its body a `this` of its own (a function, method or class; arrow functions share it). */
function hasOwnThis(ts, node) {
    return (ts.isFunctionLike(node) && !ts.isArrowFunction(node)) || ts.isClassLike(node);
}
/**
 * The members of `this` the function declaring `param` stores it in
 * (`this.refinementValue = refinementValue`). Stores inside nested functions
 * are skipped: their `this` is another value.
 */
function thisMembersStoring(ctx, param) {
    const { ts, checker } = ctx;
    const members = new Set();
    const body = param.parent.body;
    const paramSymbol = ts.isIdentifier(param.name) ? checker.getSymbolAtLocation(param.name) : undefined;
    if (!body || !paramSymbol)
        return members;
    const visit = (node) => {
        const stores = isThisMemberStore(ts, node) && checker.getSymbolAtLocation(node.right) === paramSymbol;
        const member = stores ? checker.getSymbolAtLocation(node.left.name) : undefined;
        if (member)
            members.add(member);
        if (!hasOwnThis(ts, node))
            ts.forEachChild(node, visit);
    };
    ts.forEachChild(body, visit);
    return members;
}
/** True when `node` reads one of `members` off `this` (`this.refinementValue`, not `this.refinementValue = x`). */
function isStoredMemberRead(ctx, members, node) {
    const { ts, checker } = ctx;
    if (members.size === 0 || !ts.isPropertyAccessExpression(node))
        return false;
    const store = node.parent;
    const written = isThisMemberStore(ts, store) && store.left === node;
    if (node.expression.kind !== ts.SyntaxKind.ThisKeyword || written)
        return false;
    const member = checker.getSymbolAtLocation(node.name);
    return member !== undefined && members.has(member);
}
