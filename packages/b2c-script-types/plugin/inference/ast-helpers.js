"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeAtPosition = getNodeAtPosition;
exports.findEnclosingPropertyAccess = findEnclosingPropertyAccess;
exports.hasExplicitParameterType = hasExplicitParameterType;
exports.hasExplicitReturnType = hasExplicitReturnType;
exports.hasExplicitVariableType = hasExplicitVariableType;
exports.collectReturnExpressions = collectReturnExpressions;
/**
 * Finds the most specific node whose span contains `pos`. Standard technique
 * built only on public Node/forEachChild APIs — deliberately avoids TS's
 * internal (unversioned) getTokenAtPosition helper.
 *
 * The walk stops scanning a sibling list as soon as it passes `pos`
 * (forEachChild aborts when the callback returns truthy, and siblings are
 * ordered and non-overlapping). Without that, every call in a file whose
 * top-level (or any enclosing) node has thousands of children — a generated
 * data file with an 8,000-element array literal, say — pays for the full
 * child list on every one of the up-to-50 reference hits collectCallSites()
 * resolves in that file.
 */
function getNodeAtPosition(sourceFile, ts, pos) {
    let result;
    const visit = (node) => {
        if (pos < node.getStart(sourceFile))
            return true; // walked past pos — later siblings can't contain it
        if (pos >= node.getEnd())
            return undefined; // before pos — keep scanning this sibling list
        result = node;
        ts.forEachChild(node, visit);
        return true; // containing child handled — siblings don't overlap
    };
    visit(sourceFile);
    return result;
}
/** Walks up from `node` to the nearest enclosing PropertyAccessExpression, or `undefined` if there isn't one. */
function findEnclosingPropertyAccess(node, ts) {
    let current = node;
    while (current) {
        if (ts.isPropertyAccessExpression(current))
            return current;
        current = current.parent;
    }
    return undefined;
}
/**
 * SFRA helpers are often "documented" with a placeholder type that carries no
 * Script API information — `@param {Object}`, `{obj}`, `{*}`, or `{}`. Those
 * are ubiquitous in real cartridges (and IntelliJ mainly helps when authors
 * write a real `dw.*` JSDoc), so treating them as deliberate annotations would
 * permanently silence usage inference on the exact helpers that need it most.
 *
 * Deliberate `{any}` / `: any` is *not* weak: that is an author saying "do not
 * pretend you know this type", and we still respect it.
 */
function isWeakTypeNode(typeNode, ts) {
    let node = typeNode;
    while (ts.isParenthesizedTypeNode(node))
        node = node.type;
    // JSDoc `{*}` — "any value", not a real shape.
    if (node.kind === ts.SyntaxKind.JSDocAllType)
        return true;
    // Empty object literal type `{}`.
    if (ts.isTypeLiteralNode(node) && node.members.length === 0)
        return true;
    // Lowercase `object` keyword (TS/JSDoc) — non-primitive bag, not a dw.* class.
    if (node.kind === ts.SyntaxKind.ObjectKeyword)
        return true;
    const refName = (() => {
        if (ts.isTypeReferenceNode(node))
            return node.typeName.getText();
        if (ts.isExpressionWithTypeArguments(node) && ts.isIdentifier(node.expression)) {
            return node.expression.text;
        }
        return undefined;
    })();
    if (!refName)
        return false;
    const lower = refName.toLowerCase();
    // `Object` / `object` / the SFRA-conventional misspelling `obj`.
    return lower === 'object' || lower === 'obj';
}
/** True when `typeNode` is a real annotation we must not second-guess (including deliberate `any`). */
function isStrongTypeNode(typeNode, ts) {
    return typeNode !== undefined && !isWeakTypeNode(typeNode, ts);
}
/**
 * True when the developer already gave this parameter an explicit, meaningful
 * type — TS syntax or JSDoc — even if that type is literally `any`. In that
 * case the checker's type reflects a deliberate choice, not an inference
 * failure, so usage inference must never second-guess it. Placeholder SFRA
 * annotations (`Object` / `obj` / `*` / `{}`) do **not** count; see
 * {@link isWeakTypeNode}.
 */
function hasExplicitParameterType(param, ts) {
    return isStrongTypeNode(param.type, ts) || isStrongTypeNode(ts.getJSDocType(param), ts);
}
/** Same idea as {@link hasExplicitParameterType}, but for a function's return type. */
function hasExplicitReturnType(fn, ts) {
    return isStrongTypeNode(fn.type, ts) || isStrongTypeNode(ts.getJSDocReturnType(fn), ts);
}
/** Same idea as {@link hasExplicitParameterType}, but for a variable declaration (`var x = ...`). */
function hasExplicitVariableType(decl, ts) {
    return isStrongTypeNode(decl.type, ts) || isStrongTypeNode(ts.getJSDocType(decl), ts);
}
/**
 * Recursively walks a function body collecting `return` expressions, without
 * descending into nested function-like boundaries (their returns belong to
 * them, not to `fn`).
 */
function collectReturnExpressions(fn, ts) {
    if (ts.isArrowFunction(fn) && fn.body && !ts.isBlock(fn.body)) {
        return [fn.body];
    }
    const body = fn.body;
    const out = [];
    if (!body)
        return out;
    const visit = (n) => {
        if (ts.isFunctionLike(n) && n !== fn)
            return;
        if (ts.isReturnStatement(n) && n.expression) {
            out.push(n.expression);
            return;
        }
        ts.forEachChild(n, visit);
    };
    visit(body);
    return out;
}
