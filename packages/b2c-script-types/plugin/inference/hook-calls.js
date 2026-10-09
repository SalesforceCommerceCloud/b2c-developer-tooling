"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hookCallSites = hookCallSites;
exports.hookImplementations = hookImplementations;
const constants_1 = require("./constants");
const ast_helpers_1 = require("./ast-helpers");
const call_sites_1 = require("./call-sites");
// Where the Script API declares `HookMgr.callHook`, whichever copy of the dw
// types a project loads.
const HOOK_MANAGER_FILE = '/dw/system/HookMgr.d.ts';
const CALL_HOOK = 'callHook';
// Request-scoped: a request asks the host for its registrations once, and
// searches for callHook calls once.
const scriptsByRequest = new WeakMap();
const hookCallsByRequest = new WeakMap();
/** The extension points each script of the program is registered for. */
function registeredScripts(ctx) {
    let scripts = scriptsByRequest.get(ctx);
    if (!scripts) {
        const index = new Map();
        for (const { extensionPoint, script } of ctx.host.hookRegistrations?.(ctx.program) ?? []) {
            const file = ctx.program.getSourceFile(script);
            if (file)
                index.set(file, [...(index.get(file) ?? []), extensionPoint]);
        }
        scripts = index;
        scriptsByRequest.set(ctx, scripts);
    }
    return scripts;
}
function reaches(pattern, extensionPoint) {
    return pattern.isPrefix ? extensionPoint.startsWith(pattern.text) : extensionPoint === pattern.text;
}
/** The string `expr` always evaluates to: a literal, or a value the checker types as one (a `const`). */
function stringValue(ctx, expr) {
    if (ctx.ts.isStringLiteralLike(expr))
        return expr.text;
    const type = ctx.checker.getTypeAtLocation(expr);
    return type.isStringLiteral() ? type.value : undefined;
}
/** The literal text a string built at runtime starts with: `'app.payment.processor.' + id`, `` `app.${id}` ``. */
function literalPrefix(ctx, expr) {
    const { ts } = ctx;
    if (ts.isTemplateExpression(expr))
        return expr.head.text || undefined;
    if (ts.isParenthesizedExpression(expr))
        return literalPrefix(ctx, expr.expression);
    if (!ts.isBinaryExpression(expr) || expr.operatorToken.kind !== ts.SyntaxKind.PlusToken)
        return undefined;
    return stringValue(ctx, expr.left) || literalPrefix(ctx, expr.left);
}
function extensionPointPattern(ctx, expr) {
    const name = stringValue(ctx, expr);
    if (name !== undefined)
        return { text: name, isPrefix: false };
    const prefix = literalPrefix(ctx, expr);
    return prefix ? { text: prefix, isPrefix: true } : undefined;
}
/** True when `call` invokes the Script API's `HookMgr.callHook`, through whatever name it is required as. */
function isCallHookCall(ctx, call) {
    const { ts, checker } = ctx;
    const callee = call.expression;
    if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== CALL_HOOK)
        return false;
    const declaration = checker.getSymbolAtLocation(callee.name)?.valueDeclaration;
    return declaration?.getSourceFile().fileName.endsWith(HOOK_MANAGER_FILE) === true;
}
/** `call` read as a callHook call, when it is one and its extension point and function name are known. */
function hookCallOf(ctx, call) {
    const [extensionPointArgument, functionNameArgument] = call.arguments;
    if (!functionNameArgument || !isCallHookCall(ctx, call))
        return undefined;
    const extensionPoint = extensionPointPattern(ctx, extensionPointArgument);
    const functionName = stringValue(ctx, functionNameArgument);
    return extensionPoint && functionName ? { call, extensionPoint, functionName } : undefined;
}
/** The name `HookMgr.callHook` is declared by, when the program loads the Script API's HookMgr. */
function callHookName(ctx) {
    const { ts, program } = ctx;
    const file = program
        .getSourceFiles()
        .find((sourceFile) => sourceFile.isDeclarationFile && sourceFile.fileName.endsWith(HOOK_MANAGER_FILE));
    for (const statement of file?.statements ?? []) {
        if (!ts.isClassDeclaration(statement))
            continue;
        const member = statement.members.find((m) => m.name && ts.isIdentifier(m.name) && m.name.text === CALL_HOOK);
        if (member)
            return member.name;
    }
    return undefined;
}
/** The callHook call a reference to `callHook` is the callee of. */
function hookCallAt(ctx, reference) {
    const { ts } = ctx;
    const file = ctx.program.getSourceFile(reference.fileName);
    const node = file && !file.isDeclarationFile ? (0, ast_helpers_1.getNodeAtPosition)(file, ts, reference.textSpan.start) : undefined;
    const access = node && (0, ast_helpers_1.propertyAccessNamedBy)(node, ts);
    const call = access?.parent;
    return call && ts.isCallExpression(call) && call.expression === access ? hookCallOf(ctx, call) : undefined;
}
/** Every callHook call in the project: one project-wide search, made once per request. */
function hookCalls(ctx) {
    let calls = hookCallsByRequest.get(ctx);
    if (!calls) {
        const name = callHookName(ctx);
        const searchable = name !== undefined && ctx.searchBudget > 0;
        if (searchable)
            ctx.searchBudget--;
        calls = searchable ? (0, call_sites_1.findReferences)(ctx, name).flatMap((reference) => hookCallAt(ctx, reference) ?? []) : [];
        hookCallsByRequest.set(ctx, calls);
    }
    return calls;
}
/**
 * What a CommonJS module exports, as the checker types the object its first
 * top-level `exports.x = ...` / `module.exports = ...` statement writes to
 * (the public API gives no module symbol for a CommonJS file).
 */
function moduleExportsType(ctx, file) {
    for (const statement of file.statements) {
        const exportsObject = (0, ast_helpers_1.exportsObjectWrittenBy)(statement, ctx.ts);
        if (exportsObject)
            return ctx.checker.getTypeAtLocation(exportsObject);
    }
    return undefined;
}
/** The functions `file` exports, with the names it exports them under; only those named `name` when given. */
function exportedFunctions(ctx, file, name) {
    const { ts, checker } = ctx;
    const exportsType = moduleExportsType(ctx, file);
    const members = exportsType ? checker.getPropertiesOfType(exportsType) : [];
    return members
        .filter((member) => name === undefined || member.name === name)
        .flatMap((member) => checker
        .getTypeOfSymbolAtLocation(member, file)
        .getCallSignatures()
        .flatMap((signature) => {
        const fn = signature.getDeclaration();
        return fn && ts.isFunctionLike(fn) ? [{ name: member.name, fn }] : [];
    }));
}
/**
 * The callHook calls that invoke `fn`, an export of a registered hook script,
 * with the hook's own arguments by parameter index. Each call spends one
 * reference from the request's budget.
 */
function hookCallSites(ctx, fn) {
    const extensionPoints = registeredScripts(ctx).get(fn.getSourceFile());
    if (!extensionPoints)
        return [];
    const exported = exportedFunctions(ctx, fn.getSourceFile()).filter((entry) => entry.fn === fn);
    const names = new Set(exported.map((entry) => entry.name));
    if (names.size === 0)
        return [];
    const calls = hookCalls(ctx).filter((hook) => names.has(hook.functionName) && extensionPoints.some((point) => reaches(hook.extensionPoint, point)));
    const sites = calls.slice(0, Math.max(0, Math.min(constants_1.MAX_REFERENCES_PER_CALL, ctx.referenceBudget)));
    ctx.referenceBudget -= sites.length;
    return sites.map(({ call }) => ({ node: call, args: call.arguments.slice(2) }));
}
/** The hook functions a callHook call dispatches to: the matching export of every script registered for it. */
function hookImplementations(ctx, call) {
    const hook = hookCallOf(ctx, call);
    if (!hook)
        return [];
    return [...registeredScripts(ctx)].flatMap(([file, extensionPoints]) => extensionPoints.some((point) => reaches(hook.extensionPoint, point))
        ? exportedFunctions(ctx, file, hook.functionName).map((entry) => entry.fn)
        : []);
}
