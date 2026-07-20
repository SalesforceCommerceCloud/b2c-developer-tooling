"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INFERRED_COMPLETION_SOURCE = void 0;
exports.createInferenceContext = createInferenceContext;
exports.isAnyType = isAnyType;
exports.getNodeAtPosition = getNodeAtPosition;
exports.findEnclosingPropertyAccess = findEnclosingPropertyAccess;
exports.inferParameterType = inferParameterType;
exports.inferReturnType = inferReturnType;
exports.inferTypeForNode = inferTypeForNode;
exports.inferTypeForExpression = inferTypeForExpression;
exports.describeTypes = describeTypes;
exports.typesToCompletionEntries = typesToCompletionEntries;
// Bounds how far we chase an undocumented call chain (helper calls helper calls
// helper...) before giving up. Keeps worst-case cost predictable regardless of
// how deep a cartridge's helper stack goes.
const MAX_INFERENCE_DEPTH = 3;
// Bounds how many indirection hops (require() binding -> destructuring ->
// renamed re-export, etc.) collectCallSites() will follow from a reference
// before giving up on finding an actual call site.
const MAX_REFERENCE_HOPS = 2;
// Hard cap on how many reference-search hits collectCallSites() will process
// across a single top-level inference request (not just one call site) —
// bounds worst-case cost for a helper referenced from dozens of places,
// complementing MAX_INFERENCE_DEPTH's cap on recursion depth. Generous enough
// to cover realistic cartridge helper usage without being effectively
// unlimited. Note what this does and doesn't bound: it caps how many results
// get processed and how far the search fans out, but a single
// getReferencesAtPosition call still scans the whole program regardless — on
// a large project the dominant cost is that first search, and the real bound
// on it is TS's own cooperative cancellation (rethrown, never swallowed, by
// the plugin's `guarded` wrapper).
const MAX_REFERENCES_PER_REQUEST = 200;
// Caps how much of that shared request-wide budget a *single* collectCallSites
// call can spend, so one widely-referenced sub-helper (e.g. reached from the
// first of several sibling return statements or call-site arguments) can't
// exhaust the whole budget and starve the others processed later in the same
// request.
const MAX_REFERENCES_PER_CALL = 50;
// Bounds how many `.method()` hops resolveExpressionTypes() will chase within
// a single static method-chain expression (e.g. `a.b().c().d()`). This is
// separate from MAX_INFERENCE_DEPTH, which only bounds crossing into another
// undocumented helper's own return-type inference — an in-expression chain
// never crosses a function boundary, so without its own cap it would be
// bounded only by how long an expression a cartridge author (or a generated
// file) happens to write, not by a predictable cost.
const MAX_CHAIN_HOPS = 10;
exports.INFERRED_COMPLETION_SOURCE = '@salesforce/b2c-script-types/inferred-usage';
/**
 * Builds a fresh inference context for one top-level hover/completion
 * request, or `undefined` if the language service has no program yet.
 */
function createInferenceContext(ts, languageService) {
    const program = languageService.getProgram();
    if (!program)
        return undefined;
    return {
        ts,
        program,
        checker: program.getTypeChecker(),
        languageService,
        visiting: new Set(),
        memo: new Map(),
        referenceBudget: MAX_REFERENCES_PER_REQUEST,
        cycleHits: 0,
    };
}
/** True when `type` is (or includes) `any` — the signal that the checker gave up and usage inference should try to help. */
function isAnyType(ts, type) {
    return (type.flags & ts.TypeFlags.Any) !== 0;
}
/**
 * Finds the most specific node whose span contains `pos`. Standard technique
 * built only on public Node/forEachChild APIs — deliberately avoids TS's
 * internal (unversioned) getTokenAtPosition helper.
 */
function getNodeAtPosition(sourceFile, ts, pos) {
    let result;
    const visit = (node) => {
        if (pos >= node.getStart(sourceFile) && pos < node.getEnd()) {
            result = node;
            ts.forEachChild(node, visit);
        }
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
 * Identifies the name to run findReferences on for a function-like
 * declaration that itself has no `name` (the common CommonJS shapes:
 * `const foo = function(){}`, `{foo: function(){}}`, `{foo(){}}`,
 * `exports.foo = function(){}`, `module.exports = function(){}`).
 */
function getReferenceNameNode(fn, ts) {
    if (ts.isFunctionDeclaration(fn) && fn.name)
        return fn.name;
    if (ts.isMethodDeclaration(fn) && ts.isIdentifier(fn.name))
        return fn.name;
    const parent = fn.parent;
    if (!parent)
        return undefined;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name))
        return parent.name;
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name))
        return parent.name;
    if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const left = parent.left;
        // `module.exports = function(){}` / `exports.foo = function(){}` — the
        // `.name` identifier (`exports` or `foo`) is what findReferences can
        // actually track; for the bare `module.exports` case this resolves to
        // the whole module's value, so callers reach it via collectCallSites()'s
        // require() indirection rather than a direct property-access call.
        if (ts.isPropertyAccessExpression(left) && ts.isIdentifier(left.name))
            return left.name;
        if (ts.isIdentifier(left))
            return left;
    }
    return undefined;
}
/**
 * Given a reference identifier (`helper` in either `helper(x)` or
 * `exports.helper(x)`/`obj.helper(x)`), finds the enclosing CallExpression if
 * the identifier sits in callee position — one parent up for a direct call,
 * two parents up when the identifier is the `.name` of a property access.
 */
function findCallInCalleePosition(node, ts) {
    const parent = node.parent;
    if (!parent)
        return undefined;
    if (ts.isCallExpression(parent) && parent.expression === node)
        return parent;
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
        const grandparent = parent.parent;
        if (grandparent && ts.isCallExpression(grandparent) && grandparent.expression === parent)
            return grandparent;
    }
    return undefined;
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
/**
 * When a reference to our function's name doesn't sit directly in callee
 * position, it may still be one hop away from a real call site through a
 * binding indirection: the module specifier of a `require(...)` call whose
 * result is assigned to a variable (`var helper = require('./helper')`), or
 * a destructuring binding element (`const {helper} = require(...)` or
 * `const {helper: local} = someObject`).
 *
 * @returns Either the further name to search references for, or — for an
 * immediately-invoked require (`require('./helper')(x)`) — the call site itself.
 */
function resolveIndirectReferenceTarget(node, ts) {
    const parent = node.parent;
    if (!parent)
        return undefined;
    if (ts.isCallExpression(parent) && parent.arguments[0] === node && isRequireCallExpression(parent, ts)) {
        const requireCall = parent;
        const outer = requireCall.parent;
        if (outer && ts.isCallExpression(outer) && outer.expression === requireCall) {
            return { kind: 'call', call: outer }; // require('./helper')(x)
        }
        if (outer && ts.isVariableDeclaration(outer) && outer.initializer === requireCall && ts.isIdentifier(outer.name)) {
            return { kind: 'name', name: outer.name }; // var helper = require('./helper')
        }
        return undefined;
    }
    if (ts.isBindingElement(parent) && ts.isIdentifier(parent.name)) {
        // Covers both `{helper}` (shorthand — name and propertyName are the same
        // node) and `{helper: local}` (renamed — redirect to the local binding).
        return { kind: 'name', name: parent.name };
    }
    return undefined;
}
/**
 * Finds actual call sites for `nameNode`, following up to
 * MAX_REFERENCE_HOPS binding indirections (require() bindings, destructuring)
 * when a reference doesn't sit directly in callee position. Stops early once
 * ctx.referenceBudget runs out, returning whatever call sites were already
 * found rather than continuing to fan out — an under-inferred (but still
 * heuristic, clearly-labeled) result beats hanging on a widely-referenced helper.
 */
function collectCallSites(ctx, nameNode) {
    const { ts, languageService, program } = ctx;
    const calls = [];
    const seenNameKeys = new Set();
    let frontier = [nameNode];
    let localBudget = Math.min(MAX_REFERENCES_PER_CALL, ctx.referenceBudget);
    for (let hop = 0; hop <= MAX_REFERENCE_HOPS && frontier.length > 0 && localBudget > 0; hop++) {
        const nextFrontier = [];
        for (const name of frontier) {
            if (localBudget <= 0)
                break;
            const sourceFile = name.getSourceFile();
            const key = `${sourceFile.fileName}:${name.getStart(sourceFile)}`;
            if (seenNameKeys.has(key))
                continue;
            seenNameKeys.add(key);
            const refs = languageService.getReferencesAtPosition(sourceFile.fileName, name.getStart(sourceFile)) ?? [];
            for (const ref of refs) {
                if (localBudget <= 0)
                    break;
                localBudget--;
                ctx.referenceBudget--;
                const refFile = program.getSourceFile(ref.fileName);
                if (!refFile)
                    continue;
                const node = getNodeAtPosition(refFile, ts, ref.textSpan.start);
                if (!node)
                    continue;
                // Definition sites (the declaration itself) never sit in callee
                // position, so this also naturally excludes them.
                const call = findCallInCalleePosition(node, ts);
                if (call) {
                    calls.push(call);
                    continue;
                }
                const indirect = resolveIndirectReferenceTarget(node, ts);
                if (indirect?.kind === 'call')
                    calls.push(indirect.call);
                else if (indirect?.kind === 'name')
                    nextFrontier.push(indirect.name);
            }
        }
        frontier = nextFrontier;
    }
    return calls;
}
/**
 * True when the developer already gave this parameter an explicit type — TS
 * syntax or JSDoc — even if that type is literally `any`. In that case the
 * checker's `any` reflects a deliberate choice, not an inference failure, so
 * usage inference must never second-guess it. Only genuinely implicit `any`
 * (no annotation at all) is fair game.
 */
function hasExplicitParameterType(param, ts) {
    return param.type !== undefined || ts.getJSDocType(param) !== undefined;
}
/** Same idea as {@link hasExplicitParameterType}, but for a function's return type. */
function hasExplicitReturnType(fn, ts) {
    return fn.type !== undefined || ts.getJSDocReturnType(fn) !== undefined;
}
/** Same idea as {@link hasExplicitParameterType}, but for a variable declaration (`var x = ...`). */
function hasExplicitVariableType(decl, ts) {
    return decl.type !== undefined || ts.getJSDocType(decl) !== undefined;
}
/**
 * Chases a local variable's initializer expression — the missing link for the
 * idiomatic SFCC style of splitting a chain across intermediate variables
 * (`var priceModel = product.getPriceModel(); return priceModel.getPrice();`),
 * which would otherwise dead-end at the variable reference even though the
 * exact same logic written inline resolves fine.
 *
 * Guarded three ways: an explicit type/JSDoc annotation on the variable means
 * its `any` is deliberate (same rule as parameters/returns); the `visiting`
 * set breaks initializer cycles (`var a = b; var b = a;`) and records the hit
 * in ctx.cycleHits; and the hop is charged to `chainHops` — following a
 * variable never crosses a function boundary, so it's an in-expression hop,
 * not a recursion-depth step.
 */
function resolveVariableInitializerTypes(ctx, decl, depth, chainHops) {
    const { ts } = ctx;
    if (!decl.initializer || hasExplicitVariableType(decl, ts))
        return [];
    if (ctx.visiting.has(decl)) {
        ctx.cycleHits++;
        return [];
    }
    ctx.visiting.add(decl);
    try {
        return resolveExpressionTypes(ctx, decl.initializer, depth, chainHops);
    }
    finally {
        ctx.visiting.delete(decl);
    }
}
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
    const sig = checker.getResolvedSignature(call);
    const sigDecl = sig?.declaration;
    if (sigDecl && ts.isFunctionLike(sigDecl))
        return sigDecl;
    return undefined;
}
/**
 * Widens a literal type (e.g. the string literal type of `"hello"`) to its
 * general primitive type, so hover text shows `string` rather than a union
 * of every literal argument ever passed to a helper.
 */
function widenType(checker, type) {
    return checker.getBaseTypeOfLiteralType(type);
}
/**
 * Deduplicates candidate types by their display string. Two distinct types
 * that happen to render identically (e.g. same-named classes from different
 * modules) collapse into one — acceptable here because every consumer of the
 * result is display-oriented (hover text, completion-member names).
 */
function dedupeTypes(checker, types) {
    const seen = new Set();
    const out = [];
    for (const t of types) {
        const key = checker.typeToString(t);
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(t);
    }
    return out;
}
/**
 * Strips any nullable part from `type` and computes its apparent type — the
 * shared first step for every place in this file (and `typesToCompletionEntries`)
 * that walks a candidate type's members. `getPropertyOfType`/`getPropertiesOfType`
 * on a union only return members common to *every* constituent, and
 * `null`/`undefined` contribute none, so an un-stripped nullable candidate —
 * the common shape of an SFCC getter that can return nothing, e.g.
 * `ProductMgr.getProduct(): Product | null` — would otherwise never resolve
 * any member. `getApparentType` also picks up a primitive candidate's
 * wrapper-object members (.length, .toUpperCase(), etc.), which live there
 * rather than on the primitive type's own declared members.
 */
function getNonNullableApparentType(checker, type) {
    return checker.getApparentType(checker.getNonNullableType(type));
}
/** Looks up a member by name on `type`'s non-nullable apparent type — see {@link getNonNullableApparentType}. */
function getMemberOfType(checker, type, name) {
    return checker.getPropertyOfType(getNonNullableApparentType(checker, type), name);
}
/**
 * Resolves the candidate type(s) of `expr`. If the checker settles on `any`
 * and `expr` is itself a call to a function we can analyze, recurses into
 * that function's inferred return type(s) instead of accepting the `any`.
 *
 * @param chainHops - how many `.method()`/`.prop` hops within the *same*
 * static expression have already been chased (e.g. the `2` in
 * `a.b().c().d()` when resolving `d`'s receiver `a.b().c()`). This is
 * distinct from `depth`, which only advances when crossing into another
 * undocumented helper's own return-type inference — chain-hopping never
 * crosses a function boundary, so it needs its own bound
 * (`MAX_CHAIN_HOPS`) to keep worst-case cost predictable for a very long
 * inline method chain.
 * @returns An array (rather than a single unioned Type) because the public
 * TypeChecker API exposed via tsserverlibrary has no way to synthesize a
 * union Type — callers merge candidates for display/completions themselves.
 */
function resolveExpressionTypes(ctx, expr, depth, chainHops = 0) {
    const { ts, checker } = ctx;
    const direct = checker.getTypeAtLocation(expr);
    if (!isAnyType(ts, direct))
        return [widenType(checker, direct)];
    if (chainHops >= MAX_CHAIN_HOPS)
        return [];
    if (ts.isCallExpression(expr)) {
        const calleeFn = resolveCalleeDeclaration(ctx, expr);
        if (calleeFn) {
            const inferred = inferReturnType(ctx, calleeFn, depth + 1);
            if (inferred.length > 0)
                return inferred;
        }
        if (ts.isPropertyAccessExpression(expr.expression)) {
            // `expr` (e.g. `x.getPriceModel().getPrice()`) is `any` because the
            // receiver's own base is undocumented — resolveCalleeDeclaration can't
            // find a real declaration since the checker never got far enough to
            // resolve the method itself. Infer the receiver's type first (recursing
            // through as many chained calls/property accesses as it takes to reach
            // an untyped parameter or undocumented helper), then look up this
            // method by name on that resolved type's real, documented signature(s).
            const methodAccess = expr.expression;
            const methodName = methodAccess.name.text;
            const returnTypes = [];
            for (const receiverType of resolveExpressionTypes(ctx, methodAccess.expression, depth, chainHops + 1)) {
                const methodSymbol = getMemberOfType(checker, receiverType, methodName);
                if (!methodSymbol)
                    continue;
                const methodType = checker.getTypeOfSymbolAtLocation(methodSymbol, methodAccess.name);
                for (const sig of methodType.getCallSignatures()) {
                    returnTypes.push(widenType(checker, checker.getReturnTypeOfSignature(sig)));
                }
            }
            if (returnTypes.length > 0)
                return dedupeTypes(checker, returnTypes);
        }
    }
    else if (ts.isPropertyAccessExpression(expr)) {
        // `expr` (e.g. `x.ID`) is `any` because its base is itself undocumented
        // (an untyped parameter, say) — infer the base's type first, then look
        // up this specific property on it, rather than giving up on the whole
        // access just because the access itself resolved to `any`.
        const propName = expr.name.text;
        const propTypes = [];
        for (const baseType of resolveExpressionTypes(ctx, expr.expression, depth, chainHops + 1)) {
            const propSymbol = getMemberOfType(checker, baseType, propName);
            if (propSymbol)
                propTypes.push(widenType(checker, checker.getTypeOfSymbolAtLocation(propSymbol, expr)));
        }
        if (propTypes.length > 0)
            return dedupeTypes(checker, propTypes);
    }
    else if (ts.isIdentifier(expr)) {
        // `expr` is itself an undocumented parameter reference (e.g. a helper
        // that just returns/forwards one of its own params) — chase that
        // parameter's inferred type too, rather than stopping at `any`.
        const sym = checker.getSymbolAtLocation(expr);
        const decl = sym?.valueDeclaration;
        if (decl && ts.isParameter(decl)) {
            const inferred = inferParameterType(ctx, decl, depth + 1);
            if (inferred.length > 0)
                return inferred;
        }
        else if (decl && ts.isVariableDeclaration(decl)) {
            // ...or a local variable holding an intermediate result — chase its
            // initializer the same way, so splitting a chain across `var`
            // statements infers exactly like the inline expression would.
            const inferred = resolveVariableInitializerTypes(ctx, decl, depth, chainHops + 1);
            if (inferred.length > 0)
                return inferred;
        }
    }
    return [];
}
/**
 * Infers a parameter's candidate type(s) from the arguments it's actually
 * called with across the project, since plain un-annotated JS parameters
 * default to `any` with no back-inference from call sites.
 *
 * @param depth - Recursion budget already consumed by the call chain that
 * led here; defaults to 0 for a top-level request.
 */
function inferParameterType(ctx, param, depth = 0) {
    const { ts, checker } = ctx;
    // Check the memo before the depth cap: a result already computed at an
    // equal-or-shallower depth is valid regardless of how deep the *current*
    // call is — it would be wrong to discard a known-good cached answer just
    // because this particular path to it happens to run over budget.
    const cached = ctx.memo.get(param);
    if (cached && cached.atDepth <= depth)
        return cached.types;
    if (depth > MAX_INFERENCE_DEPTH)
        return [];
    if (hasExplicitParameterType(param, ts))
        return [];
    // Cycle guard: a self-forwarding helper (e.g. `function id(x){return x}`
    // called as `id(id(y))`) could otherwise re-enter inference for this same
    // parameter before the first call has finished and memoized its result.
    if (ctx.visiting.has(param)) {
        ctx.cycleHits++;
        return [];
    }
    ctx.visiting.add(param);
    const cycleHitsBefore = ctx.cycleHits;
    try {
        const fn = param.parent;
        if (!ts.isFunctionLike(fn))
            return [];
        const nameNode = getReferenceNameNode(fn, ts);
        if (!nameNode)
            return [];
        const paramIndex = fn.parameters.indexOf(param);
        if (paramIndex < 0)
            return [];
        const types = [];
        for (const call of collectCallSites(ctx, nameNode)) {
            const arg = call.arguments[paramIndex];
            if (!arg)
                continue;
            types.push(...resolveExpressionTypes(ctx, arg, depth));
        }
        const result = dedupeTypes(checker, types);
        // Don't memoize a result whose computation hit a cycle guard: it was
        // truncated by what happened to be on the *current* call stack, and the
        // same node queried later in this request from outside the cycle could
        // legitimately resolve more. (Depth-cap truncation, by contrast, IS
        // safely memoized — the atDepth field encodes exactly how truncated it
        // can be, and reuse is restricted accordingly.)
        if (ctx.cycleHits === cycleHitsBefore) {
            ctx.memo.set(param, { atDepth: depth, types: result });
        }
        return result;
    }
    finally {
        ctx.visiting.delete(param);
    }
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
/**
 * Infers a function's candidate return type(s) from its own return
 * statements, chasing into undocumented callees when a return expression
 * itself resolves to `any`.
 *
 * @param depth - Recursion budget already consumed by the call chain that
 * led here; defaults to 0 for a top-level request.
 */
function inferReturnType(ctx, fn, depth = 0) {
    const { ts, checker } = ctx;
    // See inferParameterType for why the memo is checked before the depth cap.
    const cached = ctx.memo.get(fn);
    if (cached && cached.atDepth <= depth)
        return cached.types;
    if (depth > MAX_INFERENCE_DEPTH)
        return [];
    if (hasExplicitReturnType(fn, ts))
        return [];
    if (ctx.visiting.has(fn)) {
        ctx.cycleHits++;
        return [];
    }
    ctx.visiting.add(fn);
    const cycleHitsBefore = ctx.cycleHits;
    try {
        const types = [];
        for (const expr of collectReturnExpressions(fn, ts)) {
            types.push(...resolveExpressionTypes(ctx, expr, depth));
        }
        const result = dedupeTypes(checker, types);
        // See inferParameterType for why cycle-truncated results skip the memo.
        if (ctx.cycleHits === cycleHitsBefore) {
            ctx.memo.set(fn, { atDepth: depth, types: result });
        }
        return result;
    }
    finally {
        ctx.visiting.delete(fn);
    }
}
/**
 * Entry point for both hover and completion wiring: given an identifier
 * node, figures out what it's worth inferring a better type for (a parameter
 * it's declared as, a variable holding an undocumented call's result, or the
 * function it names) and returns candidate type(s), if any.
 */
function inferTypeForNode(ctx, node) {
    const { ts, checker } = ctx;
    if (!ts.isIdentifier(node))
        return [];
    const sym = checker.getSymbolAtLocation(node);
    const decl = sym?.valueDeclaration;
    if (!decl)
        return [];
    if (ts.isParameter(decl))
        return inferParameterType(ctx, decl);
    if (ts.isVariableDeclaration(decl)) {
        // Resolve the full initializer expression, not just a direct call's
        // callee: `var pm = product.getPriceModel()` (a method call on an
        // undocumented parameter) and `var pm = product.priceModel` (a property
        // access) both need the same chain-chasing that return-type inference
        // already does — resolveVariableInitializerTypes routes through it.
        return dedupeTypes(checker, resolveVariableInitializerTypes(ctx, decl, 0, 0));
    }
    if (ts.isFunctionLike(decl))
        return inferReturnType(ctx, decl);
    return [];
}
/**
 * Like {@link inferTypeForNode}, but for an arbitrary expression in receiver
 * position — the completion case `product.getPriceModel().|`, where the thing
 * before the dot is a call or chain rather than a plain identifier, so there's
 * no declaration to look up; the expression itself is what gets resolved.
 */
function inferTypeForExpression(ctx, expr) {
    const { ts, checker } = ctx;
    if (ts.isIdentifier(expr))
        return inferTypeForNode(ctx, expr);
    return dedupeTypes(checker, resolveExpressionTypes(ctx, expr, 0));
}
/** Renders candidate types as human-readable hover text, e.g. `"Product | Category"`. */
function describeTypes(checker, types) {
    return dedupeTypes(checker, types)
        .map((t) => checker.typeToString(t))
        .join(' | ');
}
/** Synthesizes completion entries for candidate types' members, deduplicated by property name. */
function typesToCompletionEntries(ts, checker, types) {
    const seen = new Set();
    const entries = [];
    for (const type of types) {
        for (const sym of checker.getPropertiesOfType(getNonNullableApparentType(checker, type))) {
            const name = sym.getName();
            if (seen.has(name))
                continue;
            seen.add(name);
            entries.push({
                name,
                // Method vs property determines the completion icon the editor shows.
                kind: sym.flags & ts.SymbolFlags.Method
                    ? ts.ScriptElementKind.memberFunctionElement
                    : ts.ScriptElementKind.memberVariableElement,
                kindModifiers: '',
                // '11' mirrors TS's own internal SortText.LocationPriority — the rank
                // ordinary resolved members get — so inferred members sort alongside
                // real ones rather than above or below them.
                sortText: '11',
                source: exports.INFERRED_COMPLETION_SOURCE,
            });
        }
    }
    return entries;
}
