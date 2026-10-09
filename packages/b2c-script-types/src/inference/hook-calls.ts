/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Hooks. Nothing in a project calls a hook script's exports by name: the
// platform dispatches `HookMgr.callHook('dw.order.calculate', 'calculate',
// basket)` to the `calculate` export of every script a cartridge's hooks.json
// registers for `dw.order.calculate` (see ../resolver/hook-registry). So the
// call sites of such an export are the callHook calls naming one of its
// extension points and its export name, passing the hook's arguments from the
// third argument on; and a callHook call returns what those exports return.
// An extension point built at runtime (`'app.payment.processor.' +
// processor.ID.toLowerCase()`) reaches every registered one its literal
// prefix starts. IntelliJ follows hooks in neither direction.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {MAX_REFERENCES_PER_CALL} from './constants';
import type {InferenceContext} from './context';
import {exportsObjectWrittenBy, getNodeAtPosition, propertyAccessNamedBy} from './ast-helpers';
import {findReferences} from './call-sites';
import type {CallSite} from './value-flow';

// Where the Script API declares `HookMgr.callHook`, whichever copy of the dw
// types a project loads.
const HOOK_MANAGER_FILE = '/dw/system/HookMgr.d.ts';
const CALL_HOOK = 'callHook';

/** The extension points a callHook call reaches: one name, or every name starting with a literal prefix. */
interface ExtensionPointPattern {
  readonly text: string;
  readonly isPrefix: boolean;
}

/** One `HookMgr.callHook(extensionPoint, functionName, ...args)` call whose two names are known. */
interface HookCall {
  readonly call: tsserver.CallExpression;
  readonly extensionPoint: ExtensionPointPattern;
  readonly functionName: string;
}

// Request-scoped: a request asks the host for its registrations once, and
// searches for callHook calls once.
const scriptsByRequest = new WeakMap<InferenceContext, ReadonlyMap<tsserver.SourceFile, readonly string[]>>();
const hookCallsByRequest = new WeakMap<InferenceContext, readonly HookCall[]>();

/** The extension points each script of the program is registered for. */
function registeredScripts(ctx: InferenceContext): ReadonlyMap<tsserver.SourceFile, readonly string[]> {
  let scripts = scriptsByRequest.get(ctx);
  if (!scripts) {
    const index = new Map<tsserver.SourceFile, string[]>();
    for (const {extensionPoint, script} of ctx.host.hookRegistrations?.(ctx.program) ?? []) {
      const file = ctx.program.getSourceFile(script);
      if (file) index.set(file, [...(index.get(file) ?? []), extensionPoint]);
    }
    scripts = index;
    scriptsByRequest.set(ctx, scripts);
  }
  return scripts;
}

function reaches(pattern: ExtensionPointPattern, extensionPoint: string): boolean {
  return pattern.isPrefix ? extensionPoint.startsWith(pattern.text) : extensionPoint === pattern.text;
}

/** The string `expr` always evaluates to: a literal, or a value the checker types as one (a `const`). */
function stringValue(ctx: InferenceContext, expr: tsserver.Expression): string | undefined {
  if (ctx.ts.isStringLiteralLike(expr)) return expr.text;
  const type = ctx.checker.getTypeAtLocation(expr);
  return type.isStringLiteral() ? type.value : undefined;
}

/** The literal text a string built at runtime starts with: `'app.payment.processor.' + id`, `` `app.${id}` ``. */
function literalPrefix(ctx: InferenceContext, expr: tsserver.Expression): string | undefined {
  const {ts} = ctx;
  if (ts.isTemplateExpression(expr)) return expr.head.text || undefined;
  if (ts.isParenthesizedExpression(expr)) return literalPrefix(ctx, expr.expression);
  if (!ts.isBinaryExpression(expr) || expr.operatorToken.kind !== ts.SyntaxKind.PlusToken) return undefined;
  return stringValue(ctx, expr.left) || literalPrefix(ctx, expr.left);
}

function extensionPointPattern(ctx: InferenceContext, expr: tsserver.Expression): ExtensionPointPattern | undefined {
  const name = stringValue(ctx, expr);
  if (name !== undefined) return {text: name, isPrefix: false};
  const prefix = literalPrefix(ctx, expr);
  return prefix ? {text: prefix, isPrefix: true} : undefined;
}

/** True when `call` invokes the Script API's `HookMgr.callHook`, through whatever name it is required as. */
function isCallHookCall(ctx: InferenceContext, call: tsserver.CallExpression): boolean {
  const {ts, checker} = ctx;
  const callee = call.expression;
  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== CALL_HOOK) return false;
  const declaration = checker.getSymbolAtLocation(callee.name)?.valueDeclaration;
  return declaration?.getSourceFile().fileName.endsWith(HOOK_MANAGER_FILE) === true;
}

/** `call` read as a callHook call, when it is one and its extension point and function name are known. */
function hookCallOf(ctx: InferenceContext, call: tsserver.CallExpression): HookCall | undefined {
  const [extensionPointArgument, functionNameArgument] = call.arguments;
  if (!functionNameArgument || !isCallHookCall(ctx, call)) return undefined;
  const extensionPoint = extensionPointPattern(ctx, extensionPointArgument);
  const functionName = stringValue(ctx, functionNameArgument);
  return extensionPoint && functionName ? {call, extensionPoint, functionName} : undefined;
}

/** The name `HookMgr.callHook` is declared by, when the program loads the Script API's HookMgr. */
function callHookName(ctx: InferenceContext): tsserver.Identifier | undefined {
  const {ts, program} = ctx;
  const file = program
    .getSourceFiles()
    .find((sourceFile) => sourceFile.isDeclarationFile && sourceFile.fileName.endsWith(HOOK_MANAGER_FILE));
  for (const statement of file?.statements ?? []) {
    if (!ts.isClassDeclaration(statement)) continue;
    const member = statement.members.find((m) => m.name && ts.isIdentifier(m.name) && m.name.text === CALL_HOOK);
    if (member) return member.name as tsserver.Identifier;
  }
  return undefined;
}

/** The callHook call a reference to `callHook` is the callee of. */
function hookCallAt(ctx: InferenceContext, reference: tsserver.ReferenceEntry): HookCall | undefined {
  const {ts} = ctx;
  const file = ctx.program.getSourceFile(reference.fileName);
  const node = file && !file.isDeclarationFile ? getNodeAtPosition(file, ts, reference.textSpan.start) : undefined;
  const access = node && propertyAccessNamedBy(node, ts);
  const call = access?.parent;
  return call && ts.isCallExpression(call) && call.expression === access ? hookCallOf(ctx, call) : undefined;
}

/** Every callHook call in the project: one project-wide search, made once per request. */
function hookCalls(ctx: InferenceContext): readonly HookCall[] {
  let calls = hookCallsByRequest.get(ctx);
  if (!calls) {
    const name = callHookName(ctx);
    const searchable = name !== undefined && ctx.searchBudget > 0;
    if (searchable) ctx.searchBudget--;
    calls = searchable ? findReferences(ctx, name).flatMap((reference) => hookCallAt(ctx, reference) ?? []) : [];
    hookCallsByRequest.set(ctx, calls);
  }
  return calls;
}

/**
 * What a CommonJS module exports, as the checker types the object its first
 * top-level `exports.x = ...` / `module.exports = ...` statement writes to
 * (the public API gives no module symbol for a CommonJS file).
 */
function moduleExportsType(ctx: InferenceContext, file: tsserver.SourceFile): tsserver.Type | undefined {
  for (const statement of file.statements) {
    const exportsObject = exportsObjectWrittenBy(statement, ctx.ts);
    if (exportsObject) return ctx.checker.getTypeAtLocation(exportsObject);
  }
  return undefined;
}

/** The functions `file` exports, with the names it exports them under; only those named `name` when given. */
function exportedFunctions(
  ctx: InferenceContext,
  file: tsserver.SourceFile,
  name?: string,
): Array<{readonly name: string; readonly fn: tsserver.SignatureDeclaration}> {
  const {ts, checker} = ctx;
  const exportsType = moduleExportsType(ctx, file);
  const members = exportsType ? checker.getPropertiesOfType(exportsType) : [];
  return members
    .filter((member) => name === undefined || member.name === name)
    .flatMap((member) =>
      checker
        .getTypeOfSymbolAtLocation(member, file)
        .getCallSignatures()
        .flatMap((signature) => {
          const fn = signature.getDeclaration() as tsserver.SignatureDeclaration | undefined;
          return fn && ts.isFunctionLike(fn) ? [{name: member.name, fn}] : [];
        }),
    );
}

/**
 * The callHook calls that invoke `fn`, an export of a registered hook script,
 * with the hook's own arguments by parameter index. Each call spends one
 * reference from the request's budget.
 */
export function hookCallSites(ctx: InferenceContext, fn: tsserver.SignatureDeclaration): CallSite[] {
  const extensionPoints = registeredScripts(ctx).get(fn.getSourceFile());
  if (!extensionPoints) return [];
  const exported = exportedFunctions(ctx, fn.getSourceFile()).filter((entry) => entry.fn === fn);
  const names = new Set(exported.map((entry) => entry.name));
  if (names.size === 0) return [];
  const calls = hookCalls(ctx).filter(
    (hook) => names.has(hook.functionName) && extensionPoints.some((point) => reaches(hook.extensionPoint, point)),
  );
  const sites = calls.slice(0, Math.max(0, Math.min(MAX_REFERENCES_PER_CALL, ctx.referenceBudget)));
  ctx.referenceBudget -= sites.length;
  return sites.map(({call}) => ({node: call, args: call.arguments.slice(2)}));
}

/** The hook functions a callHook call dispatches to: the matching export of every script registered for it. */
export function hookImplementations(
  ctx: InferenceContext,
  call: tsserver.CallExpression,
): tsserver.SignatureDeclaration[] {
  const hook = hookCallOf(ctx, call);
  if (!hook) return [];
  return [...registeredScripts(ctx)].flatMap(([file, extensionPoints]) =>
    extensionPoints.some((point) => reaches(hook.extensionPoint, point))
      ? exportedFunctions(ctx, file, hook.functionName).map((entry) => entry.fn)
      : [],
  );
}
