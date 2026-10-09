"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_BINDINGS = void 0;
exports.withBindings = withBindings;
exports.argumentBindings = argumentBindings;
exports.boundArgument = boundArgument;
exports.boundCallback = boundCallback;
exports.hasAnyTypeArgument = hasAnyTypeArgument;
exports.narrows = narrows;
const member_values_1 = require("./member-values");
const signatures_1 = require("./signatures");
const type_helpers_1 = require("./type-helpers");
/** No parameter bound: what every inference outside a call-specific retry runs with. */
exports.NO_BINDINGS = new Map();
/** Runs `compute` with `bindings` in force, restoring the previous ones afterwards. */
function withBindings(ctx, bindings, compute) {
    const previous = ctx.bindings;
    ctx.bindings = bindings;
    try {
        return compute();
    }
    finally {
        ctx.bindings = previous;
    }
}
/**
 * `fn`'s plain parameters bound to the arguments `args` of one call, on top of
 * the bindings already in force (a helper nested in a bound function still
 * sees its parameters). Arguments after a spread, rest parameters and
 * destructured parameters are left unbound; `undefined` when nothing binds.
 */
function argumentBindings(ctx, fn, args, depth) {
    const { ts } = ctx;
    const outer = ctx.bindings;
    const bindings = new Map(outer);
    for (const [index, parameter] of fn.parameters.entries()) {
        const argument = args[index];
        if (!argument || ts.isSpreadElement(argument) || parameter.dotDotDotToken)
            break;
        if (ts.isIdentifier(parameter.name))
            bindings.set(parameter, { argument, depth, outer });
    }
    return bindings.size > outer.size ? bindings : undefined;
}
/** The binding the parameter `expr` names has in the bindings in force. */
function boundArgument(ctx, expr) {
    const { ts } = ctx;
    if (ctx.bindings.size === 0 || !ts.isIdentifier(expr))
        return undefined;
    const declaration = (0, member_values_1.valueDeclarationOf)(ctx, expr);
    return declaration && ts.isParameter(declaration) ? ctx.bindings.get(declaration) : undefined;
}
/**
 * The function the bound parameter `expr` holds: the function its argument
 * is or names, followed through parameters each enclosing call passes on as
 * is (`function mapAll(items, fn) { return collections.map(items, fn); }`).
 * Each step moves to the bindings in force where that call was written,
 * which hold fewer parameters, so the walk ends.
 */
function boundFunction(ctx, expr) {
    let binding = boundArgument(ctx, expr);
    while (binding) {
        const fn = (0, signatures_1.functionOf)(ctx, binding.argument);
        if (fn)
            return fn;
        const { argument, outer } = binding;
        binding = withBindings(ctx, outer, () => boundArgument(ctx, argument));
    }
    return undefined;
}
/**
 * `call` read as a call of the function a bound parameter holds, with the
 * arguments that function receives: `callback(item)`, or `callback.call(scope,
 * item)` without its `this` argument. A `callback.apply(scope, args)` call
 * binds none of them.
 */
function boundCallback(ctx, call) {
    const { ts } = ctx;
    const callee = call.expression;
    const borrowed = ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;
    if (borrowed !== undefined && borrowed !== 'call' && borrowed !== 'apply')
        return undefined;
    const fn = boundFunction(ctx, ts.isPropertyAccessExpression(callee) ? callee.expression : callee);
    if (!fn)
        return undefined;
    if (borrowed === 'apply')
        return { fn, args: [] };
    return { fn, args: borrowed === 'call' ? call.arguments.slice(1) : call.arguments };
}
/** True when `type` instantiates a generic with `any` (`Collection<any>` of a bare `{dw.util.Collection}`). */
function hasAnyTypeArgument(ctx, type) {
    const { ts, checker } = ctx;
    if (!(type.flags & ts.TypeFlags.Object))
        return false;
    if (!(type.objectFlags & ts.ObjectFlags.Reference))
        return false;
    return checker.getTypeArguments(type).some((argument) => (0, type_helpers_1.isAnyType)(ts, argument));
}
/**
 * True when `types`, recovered for one call, may stand in for the `general`
 * types the checker gives the same expression without it: when those say
 * nothing, or when every recovered type is assignable to one of them
 * (`Collection<Shipment>` for a parameter declared `{dw.util.Collection}`).
 * Anything else is left alone, and TypeScript builds without the public
 * `isTypeAssignableTo` never narrow a type that says something.
 */
function narrows(ctx, general, types) {
    const { checker } = ctx;
    if (types.length === 0)
        return false;
    if (general.length === 0)
        return true;
    if (typeof checker.isTypeAssignableTo !== 'function')
        return false;
    return types.every((type) => general.some((part) => checker.isTypeAssignableTo(type, part)));
}
