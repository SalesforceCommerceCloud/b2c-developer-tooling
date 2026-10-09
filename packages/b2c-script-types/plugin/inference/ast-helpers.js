"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeAtPosition = getNodeAtPosition;
exports.propertyAccessNamedBy = propertyAccessNamedBy;
exports.memberCompletionAccess = memberCompletionAccess;
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
/** The property access whose member name `node` is (`productLineItems` in `shipment.productLineItems`), if any. */
function propertyAccessNamedBy(node, ts) {
    const { parent } = node;
    return parent && ts.isPropertyAccessExpression(parent) && parent.name === node ? parent : undefined;
}
/**
 * The property access a member completion at `position` is completing: the
 * cursor sits right after its dot (`shipment.|`) or inside its member name
 * (`shipment.pro|`). Anywhere else — inside the receiver, or inside an
 * argument list further along the chain (`basket.getShipment(|).ID`) — the
 * enclosing access's members are not what is being typed, so this returns
 * `undefined`.
 */
function memberCompletionAccess(sourceFile, ts, position) {
    const node = getNodeAtPosition(sourceFile, ts, Math.max(position - 1, 0));
    if (!node)
        return undefined;
    // The node is the access itself only when position - 1 falls on a token it
    // owns directly (its dot), never inside the receiver or the name.
    if (ts.isPropertyAccessExpression(node))
        return position >= node.name.pos ? node : undefined;
    return propertyAccessNamedBy(node, ts);
}
/**
 * SFRA helpers are often "documented" with a placeholder type that carries no
 * Script API information — `@param {Object}`, `{obj}`, `{*}`, or `{}`, also
 * when nullable or optional (`{Object|null}`, `{?Object}`, `{Object=}`). Those
 * are ubiquitous in real cartridges (and IntelliJ mainly helps when authors
 * write a real `dw.*` JSDoc), so treating them as deliberate annotations would
 * permanently silence usage inference on the exact helpers that need it most.
 *
 * Deliberate `{any}` / `: any` is *not* weak: that is an author saying "do not
 * pretend you know this type", and we still respect it.
 */
function isWeakTypeNode(typeNode, ts) {
    const node = unwrapTypeNode(typeNode, ts);
    // `{Object|null}`, `{Object|undefined}`: a placeholder that may be missing is still a placeholder.
    if (ts.isUnionTypeNode(node)) {
        const present = node.types.filter((member) => !isNullishTypeNode(member, ts));
        return present.length > 0 && present.every((member) => isWeakTypeNode(member, ts));
    }
    // JSDoc `{*}` — "any value", not a real shape.
    if (node.kind === ts.SyntaxKind.JSDocAllType)
        return true;
    // Empty object literal type `{}`.
    if (ts.isTypeLiteralNode(node) && node.members.length === 0)
        return true;
    // Lowercase `object` keyword (TS/JSDoc) — non-primitive bag, not a dw.* class.
    if (node.kind === ts.SyntaxKind.ObjectKeyword)
        return true;
    const lower = typeReferenceName(node, ts)?.toLowerCase();
    // `Object` / `object` / the SFRA-conventional misspelling `obj`.
    return lower === 'object' || lower === 'obj';
}
/** The type `(T)`, `?T`, `!T` and `T=` wrap: parentheses and JSDoc nullability or optionality change no shape. */
function unwrapTypeNode(typeNode, ts) {
    let node = typeNode;
    while (ts.isParenthesizedTypeNode(node) ||
        ts.isJSDocNullableType(node) ||
        ts.isJSDocNonNullableType(node) ||
        ts.isJSDocOptionalType(node)) {
        node = node.type;
    }
    return node;
}
/** `null` or `undefined` as a type. */
function isNullishTypeNode(node, ts) {
    if (node.kind === ts.SyntaxKind.UndefinedKeyword)
        return true;
    return ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword;
}
/** The name a type reference names: `Object` in `{Object}` or `extends Object`. */
function typeReferenceName(node, ts) {
    if (ts.isTypeReferenceNode(node))
        return node.typeName.getText();
    return ts.isExpressionWithTypeArguments(node) && ts.isIdentifier(node.expression) ? node.expression.text : undefined;
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
