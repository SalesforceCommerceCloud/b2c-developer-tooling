/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type tsserver from 'typescript/lib/tsserverlibrary';

// Bounds how far we chase an undocumented call chain (helper calls helper calls
// helper...) before giving up. Keeps worst-case cost predictable regardless of
// how deep a cartridge's helper stack goes.
const MAX_INFERENCE_DEPTH = 3;

export const INFERRED_COMPLETION_SOURCE = '@salesforce/b2c-script-types/inferred-usage';

export interface InferenceContext {
  readonly ts: typeof tsserver;
  readonly program: tsserver.Program;
  readonly checker: tsserver.TypeChecker;
  readonly languageService: tsserver.LanguageService;
  // Recursion guard for the current inference request only (cleared as the
  // call stack unwinds) — NOT a cross-request memoization cache. It exists
  // solely to break cycles like `function a(){return b()} function b(){return a()}`.
  readonly visiting: Set<tsserver.Node>;
}

export function createInferenceContext(
  ts: typeof tsserver,
  languageService: tsserver.LanguageService,
): InferenceContext | undefined {
  const program = languageService.getProgram();
  if (!program) return undefined;
  return {ts, program, checker: program.getTypeChecker(), languageService, visiting: new Set()};
}

export function isAnyType(ts: typeof tsserver, type: tsserver.Type): boolean {
  return (type.flags & ts.TypeFlags.Any) !== 0;
}

// Finds the most specific node whose span contains `pos`. Standard technique
// built only on public Node/forEachChild APIs — deliberately avoids TS's
// internal (unversioned) getTokenAtPosition helper.
export function getNodeAtPosition(
  sourceFile: tsserver.SourceFile,
  ts: typeof tsserver,
  pos: number,
): tsserver.Node | undefined {
  let result: tsserver.Node | undefined;
  const visit = (node: tsserver.Node) => {
    if (pos >= node.getStart(sourceFile) && pos < node.getEnd()) {
      result = node;
      ts.forEachChild(node, visit);
    }
  };
  visit(sourceFile);
  return result;
}

export function findEnclosingPropertyAccess(
  node: tsserver.Node,
  ts: typeof tsserver,
): tsserver.PropertyAccessExpression | undefined {
  let current: tsserver.Node | undefined = node;
  while (current) {
    if (ts.isPropertyAccessExpression(current)) return current;
    current = current.parent;
  }
  return undefined;
}

// Identifies the name to run findReferences on for a function-like
// declaration that itself has no `name` (the common CommonJS shapes:
// `const foo = function(){}`, `{foo: function(){}}`, `exports.foo = function(){}`).
function getReferenceNameNode(fn: tsserver.SignatureDeclaration, ts: typeof tsserver): tsserver.Identifier | undefined {
  if (ts.isFunctionDeclaration(fn) && fn.name) return fn.name;
  const parent = fn.parent;
  if (!parent) return undefined;
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name;
  if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) return parent.name;
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const left = parent.left;
    if (ts.isPropertyAccessExpression(left) && ts.isIdentifier(left.name)) return left.name;
    if (ts.isIdentifier(left)) return left;
  }
  return undefined;
}

// Given a reference identifier (`helper` in either `helper(x)` or
// `exports.helper(x)`/`obj.helper(x)`), finds the enclosing CallExpression if
// the identifier sits in callee position — one parent up for a direct call,
// two parents up when the identifier is the `.name` of a property access.
function findCallInCalleePosition(node: tsserver.Node, ts: typeof tsserver): tsserver.CallExpression | undefined {
  const parent = node.parent;
  if (!parent) return undefined;
  if (ts.isCallExpression(parent) && parent.expression === node) return parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    const grandparent = parent.parent;
    if (grandparent && ts.isCallExpression(grandparent) && grandparent.expression === parent) return grandparent;
  }
  return undefined;
}

function resolveCalleeDeclaration(
  ctx: InferenceContext,
  call: tsserver.CallExpression,
): tsserver.SignatureDeclaration | undefined {
  const {checker, ts} = ctx;
  const sym = checker.getSymbolAtLocation(call.expression);
  const decl = sym?.valueDeclaration ?? sym?.declarations?.[0];
  if (decl && ts.isFunctionLike(decl)) return decl;
  const sig = checker.getResolvedSignature(call);
  const sigDecl = sig?.declaration;
  if (sigDecl && ts.isFunctionLike(sigDecl)) return sigDecl;
  return undefined;
}

function dedupeTypes(checker: tsserver.TypeChecker, types: tsserver.Type[]): tsserver.Type[] {
  const seen = new Set<string>();
  const out: tsserver.Type[] = [];
  for (const t of types) {
    const key = checker.typeToString(t);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

// Resolves the candidate type(s) of `expr`. If the checker settles on `any`
// and `expr` is itself a call to a function we can analyze, recurses into
// that function's inferred return type(s) instead of accepting the `any`.
// Returns an array (rather than a single unioned Type) because the public
// TypeChecker API exposed via tsserverlibrary has no way to synthesize a
// union Type — callers merge candidates for display/completions themselves.
function resolveExpressionTypes(ctx: InferenceContext, expr: tsserver.Expression, depth: number): tsserver.Type[] {
  const {ts, checker} = ctx;
  const direct = checker.getTypeAtLocation(expr);
  if (!isAnyType(ts, direct)) return [direct];
  if (ts.isCallExpression(expr)) {
    const calleeFn = resolveCalleeDeclaration(ctx, expr);
    if (calleeFn) {
      const inferred = inferReturnType(ctx, calleeFn, depth + 1);
      if (inferred.length > 0) return inferred;
    }
  } else if (ts.isIdentifier(expr)) {
    // `expr` is itself an undocumented parameter reference (e.g. a helper
    // that just returns/forwards one of its own params) — chase that
    // parameter's inferred type too, rather than stopping at `any`.
    const sym = checker.getSymbolAtLocation(expr);
    const decl = sym?.valueDeclaration;
    if (decl && ts.isParameter(decl)) {
      const inferred = inferParameterType(ctx, decl, depth + 1);
      if (inferred.length > 0) return inferred;
    }
  }
  return [];
}

// Infers a parameter's candidate type(s) from the arguments it's actually
// called with across the project, since plain un-annotated JS parameters
// default to `any` with no back-inference from call sites.
export function inferParameterType(
  ctx: InferenceContext,
  param: tsserver.ParameterDeclaration,
  depth = 0,
): tsserver.Type[] {
  const {ts, languageService, program, checker} = ctx;
  if (depth > MAX_INFERENCE_DEPTH) return [];
  const fn = param.parent;
  if (!ts.isFunctionLike(fn)) return [];
  const nameNode = getReferenceNameNode(fn, ts);
  if (!nameNode) return [];
  const paramIndex = fn.parameters.indexOf(param);
  if (paramIndex < 0) return [];

  const sourceFile = nameNode.getSourceFile();
  const refs = languageService.getReferencesAtPosition(sourceFile.fileName, nameNode.getStart(sourceFile)) ?? [];

  const types: tsserver.Type[] = [];
  for (const ref of refs) {
    const refFile = program.getSourceFile(ref.fileName);
    if (!refFile) continue;
    const node = getNodeAtPosition(refFile, ts, ref.textSpan.start);
    if (!node) continue;
    // Definition sites (the declaration itself) never sit in callee position,
    // so this also naturally excludes them.
    const call = findCallInCalleePosition(node, ts);
    if (!call) continue;
    const arg = call.arguments[paramIndex];
    if (!arg) continue;
    types.push(...resolveExpressionTypes(ctx, arg, depth));
  }

  return dedupeTypes(checker, types);
}

// Recursively walks a function body collecting `return` expressions, without
// descending into nested function-like boundaries (their returns belong to
// them, not to `fn`).
function collectReturnExpressions(fn: tsserver.SignatureDeclaration, ts: typeof tsserver): tsserver.Expression[] {
  if (ts.isArrowFunction(fn) && fn.body && !ts.isBlock(fn.body)) {
    return [fn.body];
  }
  const body = (fn as tsserver.FunctionLikeDeclaration).body;
  const out: tsserver.Expression[] = [];
  if (!body) return out;
  const visit = (n: tsserver.Node) => {
    if (ts.isFunctionLike(n) && n !== fn) return;
    if (ts.isReturnStatement(n) && n.expression) {
      out.push(n.expression);
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(body);
  return out;
}

// Infers a function's candidate return type(s) from its own return
// statements, chasing into undocumented callees when a return expression
// itself resolves to `any`.
export function inferReturnType(ctx: InferenceContext, fn: tsserver.SignatureDeclaration, depth = 0): tsserver.Type[] {
  const {ts, checker} = ctx;
  if (depth > MAX_INFERENCE_DEPTH) return [];
  if (ctx.visiting.has(fn)) return [];
  ctx.visiting.add(fn);
  try {
    const types: tsserver.Type[] = [];
    for (const expr of collectReturnExpressions(fn, ts)) {
      types.push(...resolveExpressionTypes(ctx, expr, depth));
    }
    return dedupeTypes(checker, types);
  } finally {
    ctx.visiting.delete(fn);
  }
}

// Entry point for both hover and completion wiring: given an identifier node,
// figures out what it's worth inferring a better type for (a parameter it's
// declared as, a variable holding an undocumented call's result, or the
// function it names) and returns candidate type(s), if any.
export function inferTypeForNode(ctx: InferenceContext, node: tsserver.Node): tsserver.Type[] {
  const {ts, checker} = ctx;
  if (!ts.isIdentifier(node)) return [];
  const sym = checker.getSymbolAtLocation(node);
  const decl = sym?.valueDeclaration;
  if (!decl) return [];
  if (ts.isParameter(decl)) return inferParameterType(ctx, decl);
  if (ts.isVariableDeclaration(decl) && decl.initializer && ts.isCallExpression(decl.initializer)) {
    const calleeFn = resolveCalleeDeclaration(ctx, decl.initializer);
    if (calleeFn) return inferReturnType(ctx, calleeFn);
  }
  if (ts.isFunctionLike(decl)) return inferReturnType(ctx, decl);
  return [];
}

export function describeTypes(checker: tsserver.TypeChecker, types: tsserver.Type[]): string {
  return dedupeTypes(checker, types)
    .map((t) => checker.typeToString(t))
    .join(' | ');
}

export function typesToCompletionEntries(
  ts: typeof tsserver,
  checker: tsserver.TypeChecker,
  types: tsserver.Type[],
): tsserver.CompletionEntry[] {
  const seen = new Set<string>();
  const entries: tsserver.CompletionEntry[] = [];
  for (const type of types) {
    for (const sym of checker.getPropertiesOfType(type)) {
      const name = sym.getName();
      if (seen.has(name)) continue;
      seen.add(name);
      entries.push({
        name,
        kind: ts.ScriptElementKind.memberVariableElement,
        kindModifiers: '',
        sortText: '11',
        source: INFERRED_COMPLETION_SOURCE,
      });
    }
  }
  return entries;
}
