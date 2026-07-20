/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Finds where an undocumented function is actually *called* across the whole
// project — the raw material for inferring a parameter's type from the
// arguments it receives. A reference search can land on a name that isn't a
// direct call (a require() binding, a destructured import, an alias map), so
// this layer follows a bounded number of those indirection hops to reach the
// real call expressions.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {MAX_REFERENCE_HOPS, MAX_REFERENCES_PER_CALL} from './constants';
import type {InferenceContext} from './context';
import {getNodeAtPosition} from './ast-helpers';

/**
 * Identifies the name to run findReferences on for a function-like
 * declaration that itself has no `name` (the common CommonJS shapes:
 * `const foo = function(){}`, `{foo: function(){}}`, `{foo(){}}`,
 * `exports.foo = function(){}`, `module.exports = function(){}`).
 */
export function getReferenceNameNode(
  fn: tsserver.SignatureDeclaration,
  ts: typeof tsserver,
): tsserver.Identifier | undefined {
  if (ts.isFunctionDeclaration(fn) && fn.name) return fn.name;
  if (ts.isMethodDeclaration(fn) && ts.isIdentifier(fn.name)) return fn.name;
  const parent = fn.parent;
  if (!parent) return undefined;
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name;
  if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) return parent.name;
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const left = parent.left;
    // `module.exports = function(){}` / `exports.foo = function(){}` — the
    // `.name` identifier (`exports` or `foo`) is what findReferences can
    // actually track; for the bare `module.exports` case this resolves to
    // the whole module's value, so callers reach it via collectCallSites()'s
    // require() indirection rather than a direct property-access call.
    if (ts.isPropertyAccessExpression(left) && ts.isIdentifier(left.name)) return left.name;
    if (ts.isIdentifier(left)) return left;
  }
  return undefined;
}

/**
 * Given a reference identifier (`helper` in either `helper(x)` or
 * `exports.helper(x)`/`obj.helper(x)`), finds the enclosing CallExpression if
 * the identifier sits in callee position — one parent up for a direct call,
 * two parents up when the identifier is the `.name` of a property access.
 */
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

/**
 * A `require('specifier')` call, identified structurally (only public
 * AST-node-kind checks — `ts.isRequireCall` exists at runtime but isn't part
 * of TypeScript's public API surface, so isn't safe to depend on here).
 */
function isRequireCallExpression(node: tsserver.Node, ts: typeof tsserver): node is tsserver.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'require' &&
    node.arguments.length > 0 &&
    ts.isStringLiteralLike(node.arguments[0])
  );
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
function resolveIndirectReferenceTarget(
  node: tsserver.Node,
  ts: typeof tsserver,
): {kind: 'call'; call: tsserver.CallExpression} | {kind: 'name'; name: tsserver.Identifier} | undefined {
  const parent = node.parent;
  if (!parent) return undefined;

  if (ts.isCallExpression(parent) && parent.arguments[0] === node && isRequireCallExpression(parent, ts)) {
    const requireCall = parent;
    const outer = requireCall.parent;
    if (outer && ts.isCallExpression(outer) && outer.expression === requireCall) {
      return {kind: 'call', call: outer}; // require('./helper')(x)
    }
    if (outer && ts.isVariableDeclaration(outer) && outer.initializer === requireCall && ts.isIdentifier(outer.name)) {
      return {kind: 'name', name: outer.name}; // var helper = require('./helper')
    }
    return undefined;
  }

  if (ts.isBindingElement(parent) && ts.isIdentifier(parent.name)) {
    // Covers both `{helper}` (shorthand — name and propertyName are the same
    // node) and `{helper: local}` (renamed — redirect to the local binding).
    return {kind: 'name', name: parent.name};
  }

  // `module.exports = {getSalePrice: getSalePrice}` — SFRA's canonical export
  // shape, an alias map from property name to a separately-declared function.
  // A reference search on the *function* name dead-ends at the alias-map
  // initializer; the actual consumers (`productHelpers.getSalePrice(x)` in
  // another file) are references of the property *name*, so redirect the
  // search there. Not scoped to module.exports specifically: any
  // `{run: helper}` alias whose property is later called is a genuine call
  // site of the aliased function.
  if (ts.isPropertyAssignment(parent) && parent.initializer === node && ts.isIdentifier(parent.name)) {
    return {kind: 'name', name: parent.name};
  }

  return undefined;
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
export function collectCallSites(ctx: InferenceContext, nameNode: tsserver.Identifier): tsserver.CallExpression[] {
  const {ts, languageService, program} = ctx;
  const memoized = ctx.callSiteMemo.get(nameNode);
  if (memoized) return memoized;
  const calls: tsserver.CallExpression[] = [];
  const seenNameKeys = new Set<string>();
  let frontier: tsserver.Identifier[] = [nameNode];
  let localBudget = Math.min(MAX_REFERENCES_PER_CALL, ctx.referenceBudget);

  for (let hop = 0; hop <= MAX_REFERENCE_HOPS && frontier.length > 0 && localBudget > 0; hop++) {
    const nextFrontier: tsserver.Identifier[] = [];
    for (const name of frontier) {
      if (localBudget <= 0 || ctx.searchBudget <= 0) break;
      const sourceFile = name.getSourceFile();
      const key = `${sourceFile.fileName}:${name.getStart(sourceFile)}`;
      if (seenNameKeys.has(key)) continue;
      seenNameKeys.add(key);

      ctx.searchBudget--;
      const refs = languageService.getReferencesAtPosition(sourceFile.fileName, name.getStart(sourceFile)) ?? [];
      for (const ref of refs) {
        if (localBudget <= 0) break;
        localBudget--;
        ctx.referenceBudget--;
        const refFile = program.getSourceFile(ref.fileName);
        if (!refFile) continue;
        const node = getNodeAtPosition(refFile, ts, ref.textSpan.start);
        if (!node) continue;
        // Definition sites (the declaration itself) never sit in callee
        // position, so this also naturally excludes them.
        const call = findCallInCalleePosition(node, ts);
        if (call) {
          calls.push(call);
          continue;
        }
        const indirect = resolveIndirectReferenceTarget(node, ts);
        if (indirect?.kind === 'call') calls.push(indirect.call);
        else if (indirect?.kind === 'name') nextFrontier.push(indirect.name);
      }
    }
    frontier = nextFrontier;
  }

  ctx.callSiteMemo.set(nameNode, calls);
  return calls;
}
