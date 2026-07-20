/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Small, self-contained helpers for walking the TypeScript AST: finding the
// node under the cursor, walking up to an enclosing property access, checking
// whether a parameter/return/variable already has an explicit type, and
// collecting a function's return expressions. Everything here depends only on
// the `ts` namespace — no checker, no inference context — so it's the safest,
// most reusable layer to read first.

import type tsserver from 'typescript/lib/tsserverlibrary';

/**
 * Finds the most specific node whose span contains `pos`. Standard technique
 * built only on public Node/forEachChild APIs — deliberately avoids TS's
 * internal (unversioned) getTokenAtPosition helper.
 *
 * The walk stops scanning a sibling list as soon as it passes `pos`
 * (forEachChild aborts when the callback returns truthy, and siblings are
 * ordered and non-overlapping). Without that, every call in a file whose
 * top-level (or any enclosing) node has thousands of children — a generated
 * data file with an 8,000-element array literal, say — pays for the full
 * child list on every one of the up-to-50 reference hits collectCallSites()
 * resolves in that file.
 */
export function getNodeAtPosition(
  sourceFile: tsserver.SourceFile,
  ts: typeof tsserver,
  pos: number,
): tsserver.Node | undefined {
  let result: tsserver.Node | undefined;
  const visit = (node: tsserver.Node): boolean | undefined => {
    if (pos < node.getStart(sourceFile)) return true; // walked past pos — later siblings can't contain it
    if (pos >= node.getEnd()) return undefined; // before pos — keep scanning this sibling list
    result = node;
    ts.forEachChild(node, visit);
    return true; // containing child handled — siblings don't overlap
  };
  visit(sourceFile);
  return result;
}

/** Walks up from `node` to the nearest enclosing PropertyAccessExpression, or `undefined` if there isn't one. */
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

/**
 * True when the developer already gave this parameter an explicit type — TS
 * syntax or JSDoc — even if that type is literally `any`. In that case the
 * checker's `any` reflects a deliberate choice, not an inference failure, so
 * usage inference must never second-guess it. Only genuinely implicit `any`
 * (no annotation at all) is fair game.
 */
export function hasExplicitParameterType(param: tsserver.ParameterDeclaration, ts: typeof tsserver): boolean {
  return param.type !== undefined || ts.getJSDocType(param) !== undefined;
}

/** Same idea as {@link hasExplicitParameterType}, but for a function's return type. */
export function hasExplicitReturnType(fn: tsserver.SignatureDeclaration, ts: typeof tsserver): boolean {
  return fn.type !== undefined || ts.getJSDocReturnType(fn) !== undefined;
}

/** Same idea as {@link hasExplicitParameterType}, but for a variable declaration (`var x = ...`). */
export function hasExplicitVariableType(decl: tsserver.VariableDeclaration, ts: typeof tsserver): boolean {
  return decl.type !== undefined || ts.getJSDocType(decl) !== undefined;
}

/**
 * Recursively walks a function body collecting `return` expressions, without
 * descending into nested function-like boundaries (their returns belong to
 * them, not to `fn`).
 */
export function collectReturnExpressions(
  fn: tsserver.SignatureDeclaration,
  ts: typeof tsserver,
): tsserver.Expression[] {
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
