"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.thisMembersStoring = thisMembersStoring;
exports.isMemberDefinedOnThis = isMemberDefinedOnThis;
exports.isStoredMemberRead = isStoredMemberRead;
const ast_helpers_1 = require("./ast-helpers");
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
    const spellsParam = (0, ast_helpers_1.spellingFilter)(body, [paramSymbol.name]);
    const visit = (node) => {
        if (!spellsParam(node))
            return;
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
/** True when `callee` is `Object.defineProperty`. */
function isObjectDefineProperty(ts, callee) {
    return (ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === 'Object' &&
        callee.name.text === 'defineProperty');
}
/** `Object.defineProperty(this, 'name', …)`: the name of the member the call defines on `this`. */
function memberDefinedOnThisBy(ts, node) {
    if (!ts.isCallExpression(node) || !isObjectDefineProperty(ts, node.expression))
        return undefined;
    const [target, key] = node.arguments;
    if (target?.kind !== ts.SyntaxKind.ThisKeyword || !key || !ts.isStringLiteralLike(key))
        return undefined;
    return key.text;
}
/** The body that builds an instance: a constructor function's own, or a class's constructor. */
function constructorBody(ts, declaration) {
    const constructor = ts.isVariableDeclaration(declaration) ? declaration.initializer : declaration;
    if (constructor && (ts.isFunctionDeclaration(constructor) || ts.isFunctionExpression(constructor))) {
        return constructor.body;
    }
    return ts.isClassLike(declaration) ? declaration.members.find(ts.isConstructorDeclaration)?.body : undefined;
}
// Keyed by declaration node: a syntax tree never changes, and tsserver reuses
// it across Programs for as long as its file is unchanged.
const membersDefinedByDeclaration = new WeakMap();
/** The members the constructor `declaration` declares defines on its own `this` (not a nested function's). */
function membersDefinedIn(ts, declaration) {
    const cached = membersDefinedByDeclaration.get(declaration);
    if (cached)
        return cached;
    const members = new Set();
    const visit = (node) => {
        const member = memberDefinedOnThisBy(ts, node);
        if (member !== undefined)
            members.add(member);
        if (!hasOwnThis(ts, node))
            ts.forEachChild(node, visit);
    };
    const body = constructorBody(ts, declaration);
    if (body)
        ts.forEachChild(body, visit);
    membersDefinedByDeclaration.set(declaration, members);
    return members;
}
/**
 * True when `type`'s constructor defines `name` with
 * `Object.defineProperty(this, 'name', …)` (SFRA's request model defines most
 * of its members this way). The checker binds such calls on exports and
 * prototypes but not on `this`, so the instance type lacks these members.
 */
function isMemberDefinedOnThis(ts, type, name) {
    const declarations = type.getSymbol()?.declarations ?? [];
    return declarations.some((declaration) => membersDefinedIn(ts, declaration).has(name));
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
