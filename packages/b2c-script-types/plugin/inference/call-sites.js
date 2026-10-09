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
/** The name a function declaration, method or class declares itself by. */
function ownName(fn, ts) {
    const declaresName = ts.isFunctionDeclaration(fn) || ts.isMethodDeclaration(fn) || ts.isClassDeclaration(fn);
    return declaresName && fn.name && ts.isIdentifier(fn.name) ? fn.name : undefined;
}
/**
 * The name `fn` is assigned to: `exports.foo = function(){}` or
 * `module.exports = function(){}`. The `.name` identifier (`foo` or
 * `exports`) is what findReferences can actually track; for the bare
 * `module.exports` case this resolves to the whole module's value, so callers
 * reach it through collectCallSites()'s require() indirection rather than a
 * direct property-access call.
 */
function assignedName(fn, ts) {
    const assignment = fn.parent;
    if (!ts.isBinaryExpression(assignment) || assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
        return undefined;
    }
    const { left } = assignment;
    if (ts.isPropertyAccessExpression(left))
        return ts.isIdentifier(left.name) ? left.name : undefined;
    return ts.isIdentifier(left) ? left : undefined;
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
    const boundName = ts.isExpression(callable) ? bindingNameOf(callable, ts) : undefined;
    return ownName(callable, ts) ?? boundName ?? assignedName(callable, ts);
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
/** What a reference invokes when called: the reference itself, or for a member name (`obj.helper`), the whole access. */
function calleeOf(node, ts) {
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
 * Given a reference identifier (`helper` in `helper(x)`, `new Helper(x)`,
 * `exports.helper(x)`, `helper.call(this, x)`), finds the call site it
 * invokes, if it sits in callee position. The name of a property access
 * (`obj.helper`) is treated as the whole access.
 */
function findCallInCalleePosition(node, ts) {
    const callee = calleeOf(node, ts);
    return directCall(callee, ts) ?? borrowedCall(callee, ts);
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
/** The `require('…')` call whose module specifier `node` is. */
function requireCallOf(node, ts) {
    const call = node.parent;
    return isRequireCallExpression(call, ts) && call.arguments[0] === node ? call : undefined;
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
    const { parent } = node;
    if (ts.isBindingElement(parent) && ts.isIdentifier(parent.name)) {
        // Covers both `{helper}` (shorthand — name and propertyName are the same
        // node) and `{helper: local}` (renamed — redirect to the local binding).
        return { kind: 'name', name: parent.name };
    }
    const required = requireCallOf(node, ts);
    const invocation = required && directCall(required, ts);
    if (invocation)
        return { kind: 'call', call: invocation }; // require('./helper')(x)
    const value = required ?? node;
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
    ctx.searchBudget--;
    for (const reference of findReferences(ctx, name)) {
        if (localBudget <= 0)
            break;
        localBudget--;
        ctx.referenceBudget--;
        const target = referenceTarget(ctx, reference);
        if (target?.kind === 'call')
            calls.push(target.call);
        else if (target?.kind === 'name')
            nextFrontier.push(target.name);
    }
    return localBudget;
}
/**
 * Where one reference search hit leads. Definition sites (the declaration
 * itself) never sit in callee position, so they lead nowhere new; neither
 * does a hit on a whole module (the source file itself, which has no parent
 * — e.g. a `module.exports` reference landing in a file's leading comment).
 */
function referenceTarget(ctx, reference) {
    const { ts, program } = ctx;
    const file = program.getSourceFile(reference.fileName);
    const node = file && (0, ast_helpers_1.getNodeAtPosition)(file, ts, reference.textSpan.start);
    if (!node?.parent)
        return undefined;
    const call = findCallInCalleePosition(node, ts);
    return call ? { kind: 'call', call } : resolveIndirectReferenceTarget(node, ts);
}
