"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INFERRED_COMPLETION_SOURCE = void 0;
exports.createInferenceContext = createInferenceContext;
exports.isAnyType = isAnyType;
exports.getNodeAtPosition = getNodeAtPosition;
exports.findEnclosingPropertyAccess = findEnclosingPropertyAccess;
exports.inferParameterType = inferParameterType;
exports.inferReturnType = inferReturnType;
exports.inferTypeForNode = inferTypeForNode;
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
// unlimited.
const MAX_REFERENCES_PER_REQUEST = 200;
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
    for (let hop = 0; hop <= MAX_REFERENCE_HOPS && frontier.length > 0 && ctx.referenceBudget > 0; hop++) {
        const nextFrontier = [];
        for (const name of frontier) {
            if (ctx.referenceBudget <= 0)
                break;
            const sourceFile = name.getSourceFile();
            const key = `${sourceFile.fileName}:${name.getStart(sourceFile)}`;
            if (seenNameKeys.has(key))
                continue;
            seenNameKeys.add(key);
            const refs = languageService.getReferencesAtPosition(sourceFile.fileName, name.getStart(sourceFile)) ?? [];
            for (const ref of refs) {
                if (ctx.referenceBudget <= 0)
                    break;
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
/** Deduplicates candidate types by their display string. */
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
 * Resolves the candidate type(s) of `expr`. If the checker settles on `any`
 * and `expr` is itself a call to a function we can analyze, recurses into
 * that function's inferred return type(s) instead of accepting the `any`.
 *
 * @returns An array (rather than a single unioned Type) because the public
 * TypeChecker API exposed via tsserverlibrary has no way to synthesize a
 * union Type — callers merge candidates for display/completions themselves.
 */
function resolveExpressionTypes(ctx, expr, depth) {
    const { ts, checker } = ctx;
    const direct = checker.getTypeAtLocation(expr);
    if (!isAnyType(ts, direct))
        return [direct];
    if (ts.isCallExpression(expr)) {
        const calleeFn = resolveCalleeDeclaration(ctx, expr);
        if (calleeFn) {
            const inferred = inferReturnType(ctx, calleeFn, depth + 1);
            if (inferred.length > 0)
                return inferred;
        }
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
    if (depth > MAX_INFERENCE_DEPTH)
        return [];
    if (hasExplicitParameterType(param, ts))
        return [];
    const cached = ctx.memo.get(param);
    if (cached && cached.atDepth <= depth)
        return cached.types;
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
    ctx.memo.set(param, { atDepth: depth, types: result });
    return result;
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
    if (depth > MAX_INFERENCE_DEPTH)
        return [];
    if (hasExplicitReturnType(fn, ts))
        return [];
    const cached = ctx.memo.get(fn);
    if (cached && cached.atDepth <= depth)
        return cached.types;
    if (ctx.visiting.has(fn))
        return [];
    ctx.visiting.add(fn);
    try {
        const types = [];
        for (const expr of collectReturnExpressions(fn, ts)) {
            types.push(...resolveExpressionTypes(ctx, expr, depth));
        }
        const result = dedupeTypes(checker, types);
        ctx.memo.set(fn, { atDepth: depth, types: result });
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
    if (ts.isVariableDeclaration(decl) && decl.initializer && ts.isCallExpression(decl.initializer)) {
        const calleeFn = resolveCalleeDeclaration(ctx, decl.initializer);
        if (calleeFn)
            return inferReturnType(ctx, calleeFn);
    }
    if (ts.isFunctionLike(decl))
        return inferReturnType(ctx, decl);
    return [];
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
        for (const sym of checker.getPropertiesOfType(type)) {
            const name = sym.getName();
            if (seen.has(name))
                continue;
            seen.add(name);
            entries.push({
                name,
                kind: ts.ScriptElementKind.memberVariableElement,
                kindModifiers: '',
                sortText: '11',
                source: exports.INFERRED_COMPLETION_SOURCE,
            });
        }
    }
    return entries;
}
