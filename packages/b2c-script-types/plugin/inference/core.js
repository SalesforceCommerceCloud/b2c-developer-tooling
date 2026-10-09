"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferParameterType = inferParameterType;
exports.inferReturnType = inferReturnType;
exports.inferTypeForNode = inferTypeForNode;
exports.inferTypeForExpression = inferTypeForExpression;
const constants_1 = require("./constants");
const context_1 = require("./context");
const ast_helpers_1 = require("./ast-helpers");
const bindings_1 = require("./bindings");
const callback_arguments_1 = require("./callback-arguments");
const call_sites_1 = require("./call-sites");
const value_flow_1 = require("./value-flow");
const framework_contracts_1 = require("./framework-contracts");
const generic_calls_1 = require("./generic-calls");
const hook_calls_1 = require("./hook-calls");
const member_values_1 = require("./member-values");
const policy_1 = require("./policy");
const signatures_1 = require("./signatures");
const super_module_1 = require("./super-module");
const type_helpers_1 = require("./type-helpers");
const usage_profile_1 = require("./usage-profile");
/**
 * Everything a local variable can hold: its initializer plus every later
 * `x = value` assignment (`var result = null; if (a) result = x; else result
 * = y;`), decided as one candidate set. Covers the idiomatic SFCC style of
 * splitting a chain across intermediate variables (`var priceModel =
 * product.getPriceModel(); return priceModel.getPrice();`), which would
 * otherwise dead-end at the variable even though the inline expression
 * resolves fine. An explicit annotation means the variable's `any` is
 * deliberate (same rule as parameters and returns). Following a variable
 * never crosses a function boundary, so it is charged to `chainHops`, not to
 * the recursion depth.
 */
function resolveVariableTypes(ctx, decl, depth, chainHops) {
    if ((0, ast_helpers_1.hasExplicitVariableType)(decl, ctx.ts))
        return [];
    return (0, context_1.withCycleGuard)(ctx, decl, [], () => {
        const profile = (0, usage_profile_1.usageProfileOf)(ctx, decl);
        const initial = decl.initializer
            ? resolveInitializerTypes(ctx, decl.initializer, profile.pushedValues, depth, chainHops)
            : [];
        const evidence = [...initial, ...resolveValues(ctx, profile.assignedValues, depth, chainHops)];
        return (0, policy_1.decideType)(ctx, evidence, profile, decl.name, false);
    });
}
/** A variable's initializer; an array literal later filled by `items.push(x)` is an array of what it holds. */
function resolveInitializerTypes(ctx, initializer, pushedValues, depth, chainHops) {
    if (pushedValues.length === 0 || !ctx.ts.isArrayLiteralExpression(initializer)) {
        return resolveExpressionTypes(ctx, initializer, depth, chainHops);
    }
    return resolveArrayTypes(ctx, [...initializer.elements, ...pushedValues], depth, chainHops);
}
/** Resolves values one hop further along the expression `depth` and `chainHops` describe. */
function nextHop(ctx, depth, chainHops) {
    return (value) => resolveExpressionTypes(ctx, value, depth, chainHops + 1);
}
/** The types of several values the same thing can hold, each one hop further along the expression. */
function resolveValues(ctx, values, depth, chainHops) {
    return values.flatMap((value) => resolveExpressionTypes(ctx, value, depth, chainHops + 1));
}
/**
 * Infers a callback parameter's type from the call the callback is passed
 * to. A method on a known receiver declares it (`value: T` of
 * `items.filter(function (item) {...})` once `items` is inferred as a
 * `ProductLineItem[]`). A project helper says it by what it passes the
 * callback (see {@link invokedCallbackTypes}). A helper that can't be read,
 * when it is an element-first one by name (`collections.forEach(coll, fn)`,
 * see {@link isElementFirstCallbackCall}), hands the first parameter an
 * element of the collection travelling alongside it. Other unknown helpers
 * are left alone: guessing their shape would be wrong more often than not.
 */
function inferCallbackParameterTypes(ctx, fn, paramIndex, depth) {
    const call = fn.parent;
    if (!call || !ctx.ts.isCallExpression(call))
        return [];
    const argIndex = call.arguments.indexOf(fn);
    const access = call.expression;
    const declared = ctx.ts.isPropertyAccessExpression(access)
        ? (0, signatures_1.callbackParameterTypes)(ctx, memberTypesOfReceiver(ctx, access.expression, access.name, depth, 0), call, argIndex, paramIndex)
        : [];
    if (declared.length > 0)
        return declared;
    const invoked = invokedCallbackTypes(ctx, call, argIndex, paramIndex, depth);
    if (invoked.length > 0 || paramIndex !== 0 || !(0, signatures_1.isElementFirstCallbackCall)(ctx, call))
        return invoked;
    return call.arguments.filter((arg) => arg !== fn).flatMap((arg) => resolveElementTypes(ctx, arg, depth, 0));
}
/**
 * What the project helper `call` invokes passes parameter `paramIndex` of
 * the callback it receives as argument `argIndex`, resolved with the
 * helper's parameters bound to this call's arguments: an element of the
 * collection this call passes, for `collections.reduce(lineItems, function
 * (total, lineItem) {...})` as for a project's own `eachShipment(basket,
 * fn)`. A helper handing the callback on to another one is followed into
 * that one, a level deeper.
 */
function invokedCallbackTypes(ctx, call, argIndex, paramIndex, depth) {
    const helper = depth < constants_1.MAX_INFERENCE_DEPTH ? (0, signatures_1.resolveCalleeDeclaration)(ctx, call) : undefined;
    const { passed, forwarded } = helper ? (0, callback_arguments_1.callbackUses)(ctx, helper, argIndex, paramIndex) : callback_arguments_1.NO_CALLBACK_USES;
    if (!helper || (passed.length === 0 && forwarded.length === 0))
        return [];
    const bindings = (0, bindings_1.argumentBindings)(ctx, helper, call.arguments, depth) ?? ctx.bindings;
    return (0, bindings_1.withBindings)(ctx, bindings, () => [
        ...passed.flatMap((value) => resolveExpressionTypes(ctx, value, depth + 1)),
        ...forwarded.flatMap((use) => invokedCallbackTypes(ctx, use.call, use.argIndex, paramIndex, depth + 1)),
    ]);
}
/**
 * Resolves the candidate type(s) of `expr`: the checker's own type when it is
 * informative, otherwise a type recovered through whatever `expr` is built
 * from (an undocumented callee's returns, a receiver's real members, a
 * variable's values, a parameter's call sites).
 *
 * @param chainHops - how many `.method()`/`.prop` hops within the *same*
 * static expression have already been chased (e.g. the `2` in
 * `a.b().c().d()` when resolving `d`'s receiver `a.b().c()`). This is
 * distinct from `depth`, which only advances when crossing into another
 * undocumented helper's own inference — chain-hopping never crosses a
 * function boundary, so it needs its own bound (`MAX_CHAIN_HOPS`) to keep the
 * cost of a very long inline chain predictable.
 * @returns An array (rather than a single unioned Type) because the public
 * TypeChecker API has no way to synthesize a union Type.
 */
function resolveExpressionTypes(ctx, expr, depth, chainHops = 0) {
    const { ts, checker } = ctx;
    // module.superModule (or a `var base = module.superModule` alias) first:
    // TS knows nothing about SFCC overlay semantics, and its type for these
    // expressions is never meaningful — sometimes `any`, sometimes an opaque
    // circular `typeof base` that would pass for informative.
    const superAccess = (0, super_module_1.traceSuperModuleAccess)(ts, checker, expr);
    if (superAccess)
        return (0, super_module_1.resolveSuperModuleTypes)(ctx, superAccess, nextHop(ctx, depth, chainHops));
    const direct = (0, type_helpers_1.informativeParts)(ctx, checker.getTypeAtLocation(expr));
    const bound = ctx.bindings.size > 0 ? resolveBoundTypes(ctx, expr, direct, depth, chainHops) : undefined;
    if (bound)
        return bound;
    if (direct.length > 0)
        return direct;
    return chainHops < constants_1.MAX_CHAIN_HOPS ? resolveFromParts(ctx, expr, depth, chainHops) : [];
}
/**
 * While a call's arguments are bound (see ./bindings): a bound parameter is
 * what its argument is, and an expression the checker types as an `any`
 * instantiation (`collection.iterator()` on a bare `{dw.util.Collection}`)
 * is recovered through its parts, which may reach a bound parameter. Either
 * stands in for the checker's type only where it narrows it. A bound
 * parameter whose argument says nothing keeps its general type, resolved
 * without the bindings (and so served from the memo).
 */
function resolveBoundTypes(ctx, expr, declared, depth, chainHops) {
    const binding = (0, bindings_1.boundArgument)(ctx, expr);
    if (binding) {
        const types = argumentTypes(ctx, binding);
        if ((0, bindings_1.narrows)(ctx, declared, types))
            return types;
        return (0, bindings_1.withBindings)(ctx, bindings_1.NO_BINDINGS, () => resolveExpressionTypes(ctx, expr, depth, chainHops));
    }
    if (chainHops >= constants_1.MAX_CHAIN_HOPS || !declared.some((type) => (0, bindings_1.hasAnyTypeArgument)(ctx, type)))
        return undefined;
    const narrowed = resolveFromParts(ctx, expr, depth, chainHops);
    return (0, bindings_1.narrows)(ctx, declared, narrowed) ? narrowed : undefined;
}
/** What a bound argument evaluates to where its call is written, resolved once per binding. */
function argumentTypes(ctx, binding) {
    binding.resolved ?? (binding.resolved = (0, bindings_1.withBindings)(ctx, binding.outer, () => (0, policy_1.limitUnion)(ctx, (0, policy_1.normalizeCandidates)(ctx, resolveExpressionTypes(ctx, binding.argument, binding.depth)))));
    return binding.resolved;
}
/** Recovers `expr`'s type(s) through what it is built from, once the checker's own type said nothing. */
function resolveFromParts(ctx, expr, depth, chainHops) {
    const { ts } = ctx;
    if (ts.isCallExpression(expr))
        return resolveCallResultTypes(ctx, expr, depth, chainHops);
    if (ts.isPropertyAccessExpression(expr))
        return resolvePropertyTypes(ctx, expr, depth, chainHops);
    if (ts.isIdentifier(expr))
        return resolveIdentifierTypes(ctx, expr, depth, chainHops);
    if (ts.isParenthesizedExpression(expr))
        return resolveExpressionTypes(ctx, expr.expression, depth, chainHops);
    if (ts.isElementAccessExpression(expr))
        return resolveElementAccessTypes(ctx, expr, depth, chainHops);
    if (ts.isArrayLiteralExpression(expr))
        return resolveArrayTypes(ctx, expr.elements, depth, chainHops);
    // `it.hasNext() ? it.next() : null` (the body of SFRA's collections.first)
    // and `a || b` / `a ?? b` can each evaluate to either side.
    if (ts.isConditionalExpression(expr)) {
        return resolveAlternatives(ctx, [expr.whenTrue, expr.whenFalse], depth, chainHops);
    }
    return ts.isBinaryExpression(expr) ? resolveLogicalTypes(ctx, expr, depth, chainHops) : [];
}
/** The element types of whatever arrays or collections `collection` holds. */
function resolveElementTypes(ctx, collection, depth, chainHops) {
    return resolveExpressionTypes(ctx, collection, depth, chainHops + 1).flatMap((type) => (0, type_helpers_1.elementTypeOf)(ctx, type, collection) ?? []);
}
/** `x[i]` is an element of `x` (a Script API collection has no index signature to say so); `x['m']` reads member `m`. */
function resolveElementAccessTypes(ctx, expr, depth, chainHops) {
    const index = expr.argumentExpression;
    if (ctx.ts.isStringLiteralLike(index)) {
        return (0, type_helpers_1.dedupeKnownTypes)(ctx, memberTypesOfReceiver(ctx, expr.expression, index, depth, chainHops));
    }
    return (0, type_helpers_1.dedupeTypes)(ctx, resolveElementTypes(ctx, expr.expression, depth, chainHops));
}
/** `[a, ...rest]`: an array of what its elements are, decided like any other choice of types (see ./policy). */
function resolveArrayTypes(ctx, elements, depth, chainHops) {
    const { ts } = ctx;
    const elementTypes = elements.flatMap((element) => ts.isSpreadElement(element)
        ? resolveElementTypes(ctx, element.expression, depth, chainHops)
        : resolveExpressionTypes(ctx, element, depth, chainHops + 1));
    const array = (0, type_helpers_1.arrayTypeOf)(ctx, (0, policy_1.limitUnion)(ctx, (0, policy_1.normalizeCandidates)(ctx, elementTypes)));
    return array ? [array] : [];
}
function resolveAlternatives(ctx, alternatives, depth, chainHops) {
    return (0, type_helpers_1.dedupeTypes)(ctx, alternatives.flatMap((alternative) => resolveExpressionTypes(ctx, alternative, depth, chainHops + 1)));
}
/** `a || b` and `a ?? b` evaluate to either side; `a && b` to `b` when it's worth showing at all. */
function resolveLogicalTypes(ctx, expr, depth, chainHops) {
    const { SyntaxKind } = ctx.ts;
    switch (expr.operatorToken.kind) {
        case SyntaxKind.BarBarToken:
        case SyntaxKind.QuestionQuestionToken:
            return resolveAlternatives(ctx, [expr.left, expr.right], depth, chainHops);
        case SyntaxKind.AmpersandAmpersandToken:
            return resolveExpressionTypes(ctx, expr.right, depth, chainHops + 1);
        default:
            return [];
    }
}
/**
 * The types of member `name` on each candidate type of `receiver`
 * (`x.getPriceModel` when `x` is undocumented but inferable). When no
 * receiver type carries the member and the receiver is (an alias of)
 * `module.superModule`, the member may be an export augmentation added by a
 * pass-through overlay level, which no export type can carry. A member the
 * checker binds on a receiver it types as nothing worth showing (`this` in a
 * prototype method) is the member it binds; on an untyped local receiver, it
 * is whatever the code writes to it (`productData.apiProduct = ...`).
 */
function memberTypesOfReceiver(ctx, receiver, name, depth, chainHops) {
    const { ts, checker } = ctx;
    const memberName = name.text;
    const types = resolveExpressionTypes(ctx, receiver, depth, chainHops + 1).flatMap((receiverType) => {
        const member = (0, type_helpers_1.getMemberOfType)(checker, receiverType, memberName);
        return member ? memberTypes(ctx, member, name, depth, chainHops) : [];
    });
    if (types.length > 0)
        return types;
    const superAccess = (0, super_module_1.traceSuperModuleAccess)(ts, checker, receiver);
    if (superAccess) {
        return (0, super_module_1.resolveSuperModuleMemberTypes)(ctx, superAccess, memberName, nextHop(ctx, depth, chainHops));
    }
    const bound = checker.getSymbolAtLocation(name);
    if (bound)
        return memberTypes(ctx, bound, name, depth, chainHops);
    return resolveValues(ctx, (0, member_values_1.localMemberValues)(ctx, receiver, memberName), depth, chainHops);
}
/**
 * A member's declared type, or — when that says nothing, as for most
 * undocumented members (`{apiProduct: apiProduct}`, `this.productSearch =
 * productSearch`) — the types of the values it is declared with.
 */
function memberTypes(ctx, member, location, depth, chainHops) {
    const declared = ctx.checker.getTypeOfSymbolAtLocation(member, location);
    const declaration = member.valueDeclaration ?? member.declarations?.[0];
    if ((0, type_helpers_1.informativeParts)(ctx, declared).length > 0 || !declaration)
        return [declared];
    return (0, context_1.withCycleGuard)(ctx, declaration, [], () => resolveValues(ctx, (0, member_values_1.memberValueExpressions)(ctx, member), depth, chainHops));
}
/**
 * The return types of `methodType`'s call signatures. A signature returning
 * `any` (an undocumented function reached through a superModule export type)
 * is inferred from its own declaration instead.
 */
function signatureReturnTypes(ctx, methodType, depth) {
    const { ts, checker } = ctx;
    return methodType.getCallSignatures().flatMap((signature) => {
        const returnType = checker.getReturnTypeOfSignature(signature);
        if (!(0, type_helpers_1.isAnyType)(ts, returnType))
            return [returnType];
        const declaration = signature.declaration;
        return declaration && ts.isFunctionLike(declaration) ? inferReturnType(ctx, declaration, depth + 1) : [];
    });
}
/**
 * What `fn` returns for this `call`. Its return across all callers, unless
 * that says nothing or leaves a choice (`Shipment | ProductLineItem` from a
 * helper handed either collection): then what it returns for the arguments
 * this call passes it (see ./bindings), when that says anything. A choice
 * across callers is the union of what each of them gets, and this call is
 * one of them, so its own answer is the more precise one, also where the
 * union missed it (a caller the depth or reference budget left out).
 */
function calleeReturnTypes(ctx, fn, call, depth) {
    const general = inferReturnType(ctx, fn, depth + 1);
    if (general.length === 1 || (0, ast_helpers_1.hasExplicitReturnType)(fn, ctx.ts))
        return general;
    const bindings = (0, bindings_1.argumentBindings)(ctx, fn, call.arguments, depth);
    const specific = bindings ? (0, bindings_1.withBindings)(ctx, bindings, () => inferReturnType(ctx, fn, depth + 1)) : [];
    return specific.length > 0 ? specific : general;
}
/**
 * What a call of a bound parameter returns (`callback(item)` inside
 * `collections.map`, inferred for one call): what the function the call
 * being resolved passes returns, with its parameters bound to these
 * arguments.
 */
function boundCallbackReturnTypes(ctx, { fn, args }, depth) {
    const bindings = (0, bindings_1.argumentBindings)(ctx, fn, args, depth) ?? ctx.bindings;
    return (0, bindings_1.withBindings)(ctx, bindings, () => inferReturnType(ctx, fn, depth + 1));
}
/**
 * Resolves an `any` call expression: first by inferring the callee's own
 * return type, then — for a method call on an undocumented receiver
 * (`x.getPriceModel().getPrice()`) — from the method's real signature(s) on
 * the receiver's inferred type(s).
 */
function resolveCallResultTypes(ctx, expr, depth, chainHops) {
    const callback = ctx.bindings.size > 0 ? (0, bindings_1.boundCallback)(ctx, expr) : undefined;
    if (callback)
        return boundCallbackReturnTypes(ctx, callback, depth);
    const calleeFn = (0, signatures_1.resolveCalleeDeclaration)(ctx, expr);
    const inferred = calleeFn ? calleeReturnTypes(ctx, calleeFn, expr, depth) : [];
    if (inferred.length > 0)
        return inferred;
    const hookResults = (0, hook_calls_1.hookImplementations)(ctx, expr).flatMap((hook) => inferReturnType(ctx, hook, depth + 1));
    if (hookResults.length > 0)
        return (0, type_helpers_1.dedupeTypes)(ctx, hookResults);
    const generic = (0, generic_calls_1.genericResultSource)(ctx, expr);
    if (generic) {
        return generic.kind === 'return'
            ? inferReturnType(ctx, generic.fn, depth + 1)
            : resolveExpressionTypes(ctx, generic.argument, depth, chainHops + 1);
    }
    const callee = expr.expression;
    if (!ctx.ts.isPropertyAccessExpression(callee))
        return [];
    return (0, type_helpers_1.dedupeTypes)(ctx, memberTypesOfReceiver(ctx, callee.expression, callee.name, depth, chainHops).flatMap((methodType) => signatureReturnTypes(ctx, methodType, depth)));
}
/** Resolves an `any` property access (`x.ID`) on an undocumented receiver from the receiver's inferred type(s). */
function resolvePropertyTypes(ctx, expr, depth, chainHops) {
    return (0, type_helpers_1.dedupeKnownTypes)(ctx, memberTypesOfReceiver(ctx, expr.expression, expr.name, depth, chainHops));
}
/** Resolves an `any` identifier through what it names: a parameter's call sites or a variable's values. */
function resolveIdentifierTypes(ctx, expr, depth, chainHops) {
    const { ts } = ctx;
    const decl = (0, member_values_1.valueDeclarationOf)(ctx, expr);
    // Only a search of another function's call sites costs depth: an anonymous
    // callback's parameter is read off the call it is passed to, in this body.
    if (decl && ts.isParameter(decl)) {
        return inferParameterType(ctx, decl, (0, value_flow_1.getReferenceNameNode)(decl.parent, ts) ? depth + 1 : depth);
    }
    if (decl && ts.isVariableDeclaration(decl))
        return resolveVariableTypes(ctx, decl, depth, chainHops + 1);
    return [];
}
/**
 * The argument types a parameter receives: at every call site of its
 * function across the project (`helper(x)`, `new Helper(x)`,
 * `Helper.call(this, x)`, and for a hook script's export, the
 * `HookMgr.callHook(...)` calls dispatched to it), or — for an anonymous
 * callback with no name to search for — from the collection it iterates.
 */
function parameterEvidence(ctx, fn, paramIndex, depth) {
    const nameNode = (0, value_flow_1.getReferenceNameNode)(fn, ctx.ts);
    if (!nameNode)
        return inferCallbackParameterTypes(ctx, fn, paramIndex, depth);
    return [...(0, call_sites_1.collectCallSites)(ctx, nameNode), ...(0, hook_calls_1.hookCallSites)(ctx, fn)].flatMap((site) => {
        const arg = site.args[paramIndex];
        return arg ? argumentEvidence(ctx, arg, depth) : [];
    });
}
/**
 * The types one call-site argument passes. A caller's own untyped parameter
 * passed on as is (see {@link forwardedParameter}) is the same value, so its
 * call sites are searched at the same depth: a chain of helpers handing a
 * value down (`addProductToCart` -> `getExistingProductLineItemInCart` ->
 * `getExistingProductLineItemsInCart` -> `getMatchingProducts`) costs one
 * level, not one per helper. The search budget still bounds the chain.
 */
function argumentEvidence(ctx, arg, depth) {
    const forwarded = (0, call_sites_1.forwardedParameter)(ctx, arg);
    return forwarded ? inferParameterType(ctx, forwarded, depth) : resolveExpressionTypes(ctx, arg, depth);
}
/**
 * Infers a parameter's type(s): from a platform contract when the function
 * is one the platform calls (see ./framework-contracts), otherwise from the
 * arguments it receives and its own usage (see ./policy for how the two are
 * weighed). Plain un-annotated JS parameters default to `any` with no
 * back-inference from call sites, which is the gap this fills.
 *
 * @param depth - Recursion budget already consumed by the call chain that
 * led here; defaults to 0 for a top-level request.
 */
function inferParameterType(ctx, param, depth = 0) {
    const { ts } = ctx;
    const fn = param.parent;
    if ((0, ast_helpers_1.hasExplicitParameterType)(param, ts) || !ts.isFunctionLike(fn))
        return [];
    return (0, context_1.withInferenceGuards)(ctx, param, depth, () => {
        const paramIndex = fn.parameters.indexOf(param);
        const contract = (0, framework_contracts_1.frameworkParameterTypes)(ctx, fn, paramIndex);
        if (contract.length > 0)
            return contract;
        const evidence = parameterEvidence(ctx, fn, paramIndex, depth);
        return (0, policy_1.decideType)(ctx, evidence, (0, usage_profile_1.usageProfileOf)(ctx, param), param.name, true);
    });
}
/**
 * Infers a function's return type(s) from its own return statements,
 * chasing into undocumented callees when a return expression itself
 * resolves to `any`.
 *
 * @param depth - Recursion budget already consumed by the call chain that
 * led here; defaults to 0 for a top-level request.
 */
function inferReturnType(ctx, fn, depth = 0) {
    if ((0, ast_helpers_1.hasExplicitReturnType)(fn, ctx.ts))
        return [];
    return (0, context_1.withInferenceGuards)(ctx, fn, depth, () => {
        const types = (0, ast_helpers_1.collectReturnExpressions)(fn, ctx.ts).flatMap((expr) => resolveExpressionTypes(ctx, expr, depth));
        return (0, policy_1.limitUnion)(ctx, (0, policy_1.normalizeCandidates)(ctx, types));
    });
}
/**
 * Entry point for hover and completions on an identifier: infers the type of
 * the parameter or variable it names, or the return type of the function it
 * names.
 */
function inferTypeForNode(ctx, node) {
    const { ts, checker } = ctx;
    if (!ts.isIdentifier(node))
        return [];
    const decl = checker.getSymbolAtLocation(node)?.valueDeclaration;
    if (!decl)
        return [];
    if (ts.isParameter(decl))
        return inferParameterType(ctx, decl);
    if (ts.isVariableDeclaration(decl))
        return resolveVariableTypes(ctx, decl, 0, 0);
    if (ts.isFunctionLike(decl))
        return inferReturnType(ctx, decl);
    return [];
}
/**
 * Like {@link inferTypeForNode}, but for an arbitrary expression — the
 * completion case `product.getPriceModel().|` and member hovers, where the
 * thing to type is a call or chain rather than a declared name.
 */
function inferTypeForExpression(ctx, expr) {
    if (ctx.ts.isIdentifier(expr))
        return inferTypeForNode(ctx, expr);
    return (0, policy_1.limitUnion)(ctx, (0, policy_1.normalizeCandidates)(ctx, resolveExpressionTypes(ctx, expr, 0)));
}
