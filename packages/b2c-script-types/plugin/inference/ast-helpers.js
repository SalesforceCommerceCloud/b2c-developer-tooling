"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeAtPosition = getNodeAtPosition;
exports.spellingFilter = spellingFilter;
exports.propertyAccessNamedBy = propertyAccessNamedBy;
exports.memberCompletionAccess = memberCompletionAccess;
exports.hasExplicitParameterType = hasExplicitParameterType;
exports.hasExplicitReturnType = hasExplicitReturnType;
exports.hasExplicitVariableType = hasExplicitVariableType;
exports.memberAssignmentOf = memberAssignmentOf;
exports.isExportsObject = isExportsObject;
exports.isModuleExports = isModuleExports;
exports.exportsObjectWrittenBy = exportsObjectWrittenBy;
exports.invocationOf = invocationOf;
exports.collectReturnExpressions = collectReturnExpressions;
/**
 * Finds the most specific node whose span contains `pos`. Standard technique
 * built only on public Node/forEachChild APIs — deliberately avoids TS's
 * internal (unversioned) getTokenAtPosition helper.
 *
 * The walk stops scanning a sibling list as soon as it passes `pos`
 * (forEachChild aborts when the callback returns truthy, and siblings are
 * ordered and non-overlapping), and skips the siblings before `pos` by their
 * end alone, so a node's start (which means scanning its leading comments)
 * is computed only for the one sibling that reaches `pos`. Without that, a
 * hover in a file whose top-level (or any enclosing) node has thousands of
 * children — a generated data file with an 8,000-element array literal, say
 * — pays for the full child list.
 */
function getNodeAtPosition(sourceFile, ts, pos) {
    let result;
    const visit = (node) => {
        if (pos >= node.getEnd())
            return undefined; // before pos — keep scanning this sibling list
        if (pos < node.getStart(sourceFile))
            return true; // walked past pos — later siblings can't contain it
        result = node;
        ts.forEachChild(node, visit);
        return true; // containing child handled — siblings don't overlap
    };
    visit(sourceFile);
    return result;
}
/**
 * A pre-test for walks of `scope` looking for identifiers named one of
 * `names`: true when a node's text spells one of them. An identifier's text
 * starts with its name, so a subtree the test is false for holds none of
 * them and the walk can skip it, reading only the few paths that lead to
 * one. An identifier written with a unicode escape sequence spells its
 * name in other characters, so a subtree holding an escape is always read.
 */
function spellingFilter(scope, names) {
    const { text } = scope.getSourceFile();
    const offsets = [];
    for (const spelling of new Set([...names, '\\u'])) {
        let at = text.indexOf(spelling, scope.pos);
        for (; at >= 0 && at < scope.end; at = text.indexOf(spelling, at + spelling.length))
            offsets.push(at);
    }
    offsets.sort((a, b) => a - b);
    return (node) => {
        const next = firstAtOrAfter(offsets, node.pos);
        return next < offsets.length && offsets[next] < node.end;
    };
}
/** The index of the first of the ascending `offsets` that is at or after `pos`. */
function firstAtOrAfter(offsets, pos) {
    let low = 0;
    let high = offsets.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (offsets[middle] < pos)
            low = middle + 1;
        else
            high = middle;
    }
    return low;
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
 * when nullable or optional (`{Object|null}`, `{?Object}`, `{Object=}`), and
 * arrays of those (`{Array}`, `{Object[]}`, `{Array.<*>}`), which say nothing
 * about their elements. Those are ubiquitous in real cartridges (and IntelliJ
 * mainly helps when authors write a real `dw.*` JSDoc), so treating them as
 * deliberate annotations would permanently silence usage inference on the
 * exact helpers that need it most.
 *
 * Deliberate `{any}` / `: any` is *not* weak: that is an author saying "do not
 * pretend you know this type", and we still respect it (`{any[]}` too).
 */
function isWeakTypeNode(typeNode, ts) {
    const node = unwrapTypeNode(typeNode, ts);
    // `{Object|null}`, `{Object|undefined}`: a placeholder that may be missing is still a placeholder.
    if (ts.isUnionTypeNode(node)) {
        const present = node.types.filter((member) => !isNullishTypeNode(member, ts));
        return present.length > 0 && present.every((member) => isWeakTypeNode(member, ts));
    }
    if (ts.isArrayTypeNode(node))
        return isWeakTypeNode(node.elementType, ts);
    if (isArrayReference(node, ts))
        return node.typeArguments?.every((element) => isWeakTypeNode(element, ts)) ?? true;
    return isPlaceholderTypeNode(node, ts);
}
/** One placeholder on its own: `{*}`, `{}`, `{object}`, `{Object}` or `{obj}`. */
function isPlaceholderTypeNode(node, ts) {
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
/** `Array`, `Array<T>` or JSDoc's `Array.<T>`. */
function isArrayReference(node, ts) {
    return ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text === 'Array';
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
/** The `x.name = value` assignment a statement is, if any. */
function memberAssignmentOf(stmt, ts) {
    const binary = ts.isExpressionStatement(stmt) ? stmt.expression : undefined;
    if (!binary || !ts.isBinaryExpression(binary) || binary.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
        return undefined;
    }
    return ts.isPropertyAccessExpression(binary.left) ? { binary, target: binary.left } : undefined;
}
/** `module.exports` or the `exports` shorthand: the object a module's members are added to. */
function isExportsObject(expr, ts) {
    return isModuleExports(expr, ts) || (ts.isIdentifier(expr) && expr.text === 'exports');
}
/** `module.exports`, identified structurally. */
function isModuleExports(expr, ts) {
    return (ts.isPropertyAccessExpression(expr) &&
        ts.isIdentifier(expr.expression) &&
        expr.expression.text === 'module' &&
        expr.name.text === 'exports');
}
/** The `exports` / `module.exports` object a top-level statement assigns to or adds a member to. */
function exportsObjectWrittenBy(stmt, ts) {
    const target = memberAssignmentOf(stmt, ts)?.target;
    if (!target)
        return undefined;
    if (isExportsObject(target.expression, ts))
        return target.expression;
    return isModuleExports(target, ts) ? target : undefined;
}
/**
 * `call` as an invocation of the function its callee names: `fn(a)`,
 * `fn.call(scope, a)` without its `this` argument, or `fn.apply(scope, args)`.
 * Any other method call (`list.push(a)`) invokes a member, not its receiver.
 */
function invocationOf(call, ts) {
    const callee = call.expression;
    if (!ts.isPropertyAccessExpression(callee))
        return { callee, args: call.arguments };
    if (callee.name.text === 'call')
        return { callee: callee.expression, args: call.arguments.slice(1) };
    return callee.name.text === 'apply' ? { callee: callee.expression, args: [] } : undefined;
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
