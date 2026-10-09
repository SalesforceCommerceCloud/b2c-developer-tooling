"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferenceNameNode = getReferenceNameNode;
exports.collectCallSites = collectCallSites;
const constants_1 = require("./constants");
const ast_helpers_1 = require("./ast-helpers");
// Reference searches are what an inference request spends its time on, and
// a Program never changes, so their results are kept for as long as the
// Program lives: hovering one parameter after another in an unchanged
// project runs each search once. Entries are plain file names and spans, so
// they pin no checker. A search served from here still spends the request's
// search budget, so a request reaches the same call sites, and the same
// answer, whether or not an earlier request warmed the cache.
const referencesByProgram = new WeakMap();
function findReferences(ctx, name) {
    let cache = referencesByProgram.get(ctx.program);
    if (!cache) {
        cache = new Map();
        referencesByProgram.set(ctx.program, cache);
    }
    let references = cache.get(name);
    if (!references) {
        const sourceFile = name.getSourceFile();
        references = ctx.languageService.getReferencesAtPosition(sourceFile.fileName, name.getStart(sourceFile)) ?? [];
        cache.set(name, references);
    }
    return references;
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
/**
 * Given a reference identifier (`helper` in `helper(x)`, `new Helper(x)`,
 * `exports.helper(x)`, `helper.call(this, x)`), finds the call site it
 * invokes, if it sits in callee position. The name of a property access
 * (`obj.helper`) is treated as the whole access.
 */
function findCallInCalleePosition(node, ts) {
    const callee = node.parent && ts.isPropertyAccessExpression(node.parent) && node.parent.name === node ? node.parent : node;
    const parent = callee.parent;
    if (!parent)
        return undefined;
    if ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === callee) {
        return { node: parent, args: parent.arguments ?? [] };
    }
    if (!ts.isPropertyAccessExpression(parent) || parent.expression !== callee)
        return undefined;
    const call = parent.parent;
    if (!call || !ts.isCallExpression(call) || call.expression !== parent)
        return undefined;
    if (parent.name.text === 'call')
        return { node: call, args: call.arguments.slice(1) };
    if (parent.name.text === 'apply')
        return { node: call, args: applyArguments(call, ts) };
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
 * The name a value is bound to when `expression` initializes a variable
 * (`var helper = …`) or an object property (`{helper: …}`) — the next name
 * to search references for when the value's own references dead-end there.
 */
function bindingNameOf(expression, ts) {
    const parent = expression.parent;
    if (!parent || !(ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)))
        return undefined;
    return parent.initializer === expression && ts.isIdentifier(parent.name) ? parent.name : undefined;
}
/**
 * When a reference to our function's name doesn't sit directly in callee
 * position, it may still be one hop away from a real call site through a
 * binding indirection:
 *
 * - the module specifier of a `require(...)` whose result is bound to a
 *   variable (`var helper = require('./helper')`) or to a property of an
 *   export map (SFRA's `decorators/index.js`:
 *   `{images: require('./images')}`, called as `decorators.images(...)`);
 * - a destructuring binding element (`const {helper} = require(...)` or
 *   `const {helper: local} = someObject`);
 * - an alias of the function itself (`var run = helper`, or SFRA's canonical
 *   `module.exports = {getSalePrice: getSalePrice}` export shape): a search
 *   on the function name dead-ends at the alias, while the consumers
 *   (`productHelpers.getSalePrice(x)` in another file) are references of the
 *   alias name.
 *
 * @returns Either the further name to search references for, or — for an
 * immediately-invoked require (`require('./helper')(x)`) — the call site itself.
 */
function resolveIndirectReferenceTarget(node, ts) {
    const parent = node.parent;
    if (!parent)
        return undefined;
    if (ts.isBindingElement(parent) && ts.isIdentifier(parent.name)) {
        // Covers both `{helper}` (shorthand — name and propertyName are the same
        // node) and `{helper: local}` (renamed — redirect to the local binding).
        return { kind: 'name', name: parent.name };
    }
    const isRequireSpecifier = ts.isCallExpression(parent) && parent.arguments[0] === node && isRequireCallExpression(parent, ts);
    const value = isRequireSpecifier ? parent : node;
    const invocation = value.parent;
    if (isRequireSpecifier && invocation && ts.isCallExpression(invocation) && invocation.expression === value) {
        return { kind: 'call', call: { node: invocation, args: invocation.arguments } }; // require('./helper')(x)
    }
    const name = ts.isExpression(value) ? bindingNameOf(value, ts) : undefined;
    return name && { kind: 'name', name };
}
/**
 * Finds actual call sites for `nameNode`, following up to
 * MAX_REFERENCE_HOPS binding indirections (require() bindings, destructuring)
 * when a reference doesn't sit directly in callee position. Stops early once
 * ctx.referenceBudget (result count) or ctx.searchBudget (project scans) runs
 * out, returning whatever call sites were already found rather than
 * continuing to fan out — an under-inferred (but still heuristic,
 * clearly-labeled) result beats hanging on a widely-referenced helper.
 * Results are memoized per name node for the duration of the request.
 */
function collectCallSites(ctx, nameNode) {
    const memoized = ctx.callSiteMemo.get(nameNode);
    if (memoized)
        return memoized;
    const calls = [];
    const seenNameKeys = new Set();
    let frontier = [nameNode];
    let localBudget = Math.min(constants_1.MAX_REFERENCES_PER_CALL, ctx.referenceBudget);
    for (let hop = 0; hop <= constants_1.MAX_REFERENCE_HOPS && frontier.length > 0 && localBudget > 0; hop++) {
        const nextFrontier = [];
        for (const name of frontier) {
            if (localBudget <= 0 || ctx.searchBudget <= 0)
                break;
            const sourceFile = name.getSourceFile();
            const key = `${sourceFile.fileName}:${name.getStart(sourceFile)}`;
            if (seenNameKeys.has(key))
                continue;
            seenNameKeys.add(key);
            localBudget = collectCallsFromName(ctx, name, calls, nextFrontier, localBudget);
        }
        frontier = nextFrontier;
    }
    ctx.callSiteMemo.set(nameNode, calls);
    return calls;
}
/**
 * Runs one reference search for `name` and sorts each hit into either a
 * resolved call site (pushed to `calls`) or a further name to chase on the
 * next hop (pushed to `nextFrontier`) via a single binding indirection.
 * Consumes one unit of the shared search budget and up to `localBudget`
 * result slots, returning the remaining local budget so the caller can stop
 * fanning out once it's exhausted.
 */
function collectCallsFromName(ctx, name, calls, nextFrontier, localBudget) {
    const { ts, program } = ctx;
    ctx.searchBudget--;
    for (const ref of findReferences(ctx, name)) {
        if (localBudget <= 0)
            break;
        localBudget--;
        ctx.referenceBudget--;
        const refFile = program.getSourceFile(ref.fileName);
        if (!refFile)
            continue;
        const node = (0, ast_helpers_1.getNodeAtPosition)(refFile, ts, ref.textSpan.start);
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
    return localBudget;
}
