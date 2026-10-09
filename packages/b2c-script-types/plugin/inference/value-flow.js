"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferenceNameNode = getReferenceNameNode;
exports.enclosingFunction = enclosingFunction;
exports.receivingParameter = receivingParameter;
exports.valueTarget = valueTarget;
const signatures_1 = require("./signatures");
/** The name a function declaration, method or class declares itself by. */
function ownName(fn, ts) {
    const declaresName = ts.isFunctionDeclaration(fn) || ts.isMethodDeclaration(fn) || ts.isClassDeclaration(fn);
    return declaresName && fn.name && ts.isIdentifier(fn.name) ? fn.name : undefined;
}
/** The name `left = value` binds: `x`, `obj.x`, `exports.x`, or `exports` for `module.exports`. */
function assignedName(ts, left) {
    if (ts.isPropertyAccessExpression(left))
        return ts.isIdentifier(left.name) ? left.name : undefined;
    return ts.isIdentifier(left) ? left : undefined;
}
/** The variable or property `value` initializes: `var helper = …`, `{helper: …}`, `{helper}`, `const {helper} = …`. */
function declaredName(ts, value) {
    const parent = value.parent;
    if (ts.isShorthandPropertyAssignment(parent))
        return parent.name;
    const initializes = ts.isBindingElement(parent) ||
        ((ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) && parent.initializer === value);
    return initializes && ts.isIdentifier(parent.name) ? parent.name : undefined;
}
/**
 * The name `value` is bound to: the variable or property it initializes
 * (see {@link declaredName}), or the target it is assigned to
 * (`exports.helper = …`). For `module.exports = …` that is the `exports`
 * name, whose references are the `require()` calls of the module.
 */
function bindingNameOf(ts, value) {
    const parent = value.parent;
    const isAssignment = ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && parent.right === value;
    return isAssignment ? assignedName(ts, parent.left) : declaredName(ts, value);
}
/**
 * Identifies the name to run findReferences on for a function-like
 * declaration: its own name, or for one that has none, the name it is bound
 * to (the common CommonJS shapes: `const foo = function(){}`,
 * `{foo: function(){}}`, `{foo(){}}`, `exports.foo = function(){}`,
 * `module.exports = function(){}`). A class constructor is searched through
 * its class, since that is what `new Model(x)` names.
 */
function getReferenceNameNode(fn, ts) {
    const callable = ts.isConstructorDeclaration(fn) ? fn.parent : fn;
    return ownName(callable, ts) ?? (ts.isExpression(callable) ? bindingNameOf(ts, callable) : undefined);
}
/** The function enclosing `node`, if any. */
function enclosingFunction(node, ts) {
    for (let current = node.parent; current; current = current.parent) {
        if (ts.isFunctionLike(current))
            return current;
    }
    return undefined;
}
/**
 * The arguments `fn.apply(thisArg, list)` passes: the elements of an array
 * literal, or — for the forwarding idiom `fn.apply(this, arguments)` — the
 * enclosing function's own parameters, which inference then resolves from
 * that function's call sites in turn.
 */
function applyArguments(call, ts) {
    const list = call.arguments[1];
    if (!list)
        return [];
    if (ts.isArrayLiteralExpression(list)) {
        return list.elements.filter((element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element));
    }
    if (!ts.isIdentifier(list) || list.text !== 'arguments')
        return [];
    const forwarding = enclosingFunction(call, ts);
    return forwarding ? forwarding.parameters.map((parameter) => parameter.name).filter(ts.isIdentifier) : [];
}
/** What a reference stands for as a value: the reference itself, or for a member name (`obj.helper`), the whole access. */
function accessOf(node, ts) {
    const { parent } = node;
    return ts.isPropertyAccessExpression(parent) && parent.name === node ? parent : node;
}
/** `callee(x)` / `new Callee(x)`: the call `callee` is invoked by directly. */
function directCall(callee, ts) {
    const call = callee.parent;
    const isCall = (ts.isCallExpression(call) || ts.isNewExpression(call)) && call.expression === callee;
    return isCall ? { node: call, args: call.arguments ?? [] } : undefined;
}
/** `callee.call(thisArg, x)` / `callee.apply(thisArg, [x])`: the call `callee` is invoked through. */
function borrowedCall(callee, ts) {
    const access = callee.parent;
    if (!ts.isPropertyAccessExpression(access) || access.expression !== callee)
        return undefined;
    const call = access.parent;
    if (!ts.isCallExpression(call) || call.expression !== access)
        return undefined;
    if (access.name.text === 'call')
        return { node: call, args: call.arguments.slice(1) };
    return access.name.text === 'apply' ? { node: call, args: applyArguments(call, ts) } : undefined;
}
/**
 * A `require('specifier')` call, identified structurally (only public
 * AST-node-kind checks — `ts.isRequireCall` exists at runtime but isn't part
 * of TypeScript's public API surface, so isn't safe to depend on here).
 */
function isRequireCallExpression(node, ts) {
    return (ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        node.arguments.length > 0 &&
        ts.isStringLiteralLike(node.arguments[0]));
}
/** The `require('…')` call whose module specifier `node` is. */
function requireCallOf(node, ts) {
    const call = node.parent;
    return isRequireCallExpression(call, ts) && call.arguments[0] === node ? call : undefined;
}
/** True when `parent` can evaluate to `child` unchanged: `(x)`, `c ? x : y`, `a || x`, `a ?? x`, `a && x`. */
function passesThrough(ts, parent, child) {
    if (ts.isParenthesizedExpression(parent))
        return true;
    if (ts.isConditionalExpression(parent))
        return parent.condition !== child;
    if (!ts.isBinaryExpression(parent))
        return false;
    const operator = parent.operatorToken.kind;
    const { SyntaxKind } = ts;
    if (operator === SyntaxKind.AmpersandAmpersandToken)
        return parent.right === child;
    return operator === SyntaxKind.BarBarToken || operator === SyntaxKind.QuestionQuestionToken;
}
/** The outermost expression that still evaluates to `node` (`getModel(a) || Fallback` for `Fallback`). */
function outermostValue(ts, node) {
    let value = node;
    while (value.parent && passesThrough(ts, value.parent, value))
        value = value.parent;
    return value;
}
/**
 * The project function `call` passes its arguments to, and the argument its
 * first parameter receives: `fn(a)`, `new Fn(a)`, and `Fn.call(this, a)`, the
 * SFRA inheritance idiom. Only a function whose body is in the project (not
 * one a declaration file describes) does anything worth following.
 */
function argumentReceiver(ctx, call) {
    const { ts, checker } = ctx;
    const callee = call.expression;
    const borrowed = ts.isCallExpression(call) && ts.isPropertyAccessExpression(callee) && callee.name.text === 'call';
    const fn = borrowed
        ? checker.getTypeAtLocation(callee.expression).getCallSignatures()[0]?.getDeclaration()
        : (0, signatures_1.resolveCalleeDeclaration)(ctx, call);
    const hasBody = fn !== undefined && fn.body !== undefined;
    return hasBody ? { fn: fn, firstArgument: borrowed ? 1 : 0 } : undefined;
}
/**
 * The parameter of a project function that receives `value` as an argument:
 * `Model` of `createRefinement(search, definition, Model)`, or
 * `refinementValue` of `new BooleanAttributeValue(search, definition,
 * refinementValue)`.
 */
function receivingParameter(ctx, value) {
    const { ts } = ctx;
    const call = value.parent;
    if (!ts.isCallExpression(call) && !ts.isNewExpression(call))
        return undefined;
    const index = call.arguments?.indexOf(value) ?? -1;
    const receiver = index >= 0 ? argumentReceiver(ctx, call) : undefined;
    const parameter = receiver?.fn.parameters[index - receiver.firstArgument];
    return parameter && !parameter.dotDotDotToken && ts.isIdentifier(parameter.name) ? parameter : undefined;
}
/** The function `value` is the result of: `return value;`, or an arrow function's expression body. */
function returningFunction(ts, value) {
    const parent = value.parent;
    if (ts.isArrowFunction(parent))
        return parent.body === value ? parent : undefined;
    return ts.isReturnStatement(parent) ? enclosingFunction(parent, ts) : undefined;
}
/** The next name holding `value` in `role`: a binding, an assignment target, or the parameter it is passed to. */
function heldBy(ctx, value, role) {
    const name = bindingNameOf(ctx.ts, value) ?? receivingParameter(ctx, value)?.name;
    return name && { kind: 'name', name, role };
}
/** A function returning `value` is a factory of it: its calls evaluate to `value`. */
function returnedBy(ctx, value) {
    const factory = returningFunction(ctx.ts, value);
    const name = factory && getReferenceNameNode(factory, ctx.ts);
    return name && { kind: 'name', name, role: 'factory' };
}
/**
 * Where one reference to the function leads. In the `value` role the
 * reference is the function itself: a call invoking it
 * (`helper(x)`, `new Helper(x)`, `Helper.call(this, x)`,
 * `require('./helper')(x)`) is a call site; a binding, an assignment, an
 * argument or a `return` leads on to the next name holding it. In the
 * `factory` role the reference names a function returning it, so a call of
 * that reference evaluates to the function and is followed as a value in
 * turn.
 */
function valueTarget(ctx, reference, role) {
    const { ts } = ctx;
    const value = outermostValue(ts, requireCallOf(reference, ts) ?? accessOf(reference, ts));
    if (role === 'factory') {
        const call = value.parent;
        const invoked = ts.isCallExpression(call) && call.expression === value;
        return invoked ? valueTarget(ctx, call, 'value') : heldBy(ctx, value, 'factory');
    }
    const call = directCall(value, ts) ?? borrowedCall(value, ts);
    return call ? { kind: 'call', call } : (heldBy(ctx, value, 'value') ?? returnedBy(ctx, value));
}
