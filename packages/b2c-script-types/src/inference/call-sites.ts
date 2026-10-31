/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Finds where an undocumented function is actually *called* across the whole
// project — the raw material for inferring a parameter's type from the
// arguments it receives. A reference search can land on a name that isn't a
// direct call (a require() binding, an export, a factory returning the
// function, a parameter it is passed to — see ./value-flow), so this layer
// follows a bounded number of those hops to reach the real call expressions.
// "Call" includes `new Helper(x)` and `Helper.call(this, x)` — the shapes
// SFRA's constructor-function "class" models are invoked and inherited with
// — and a function handed to a declared API that calls it (`server.get(
// 'Show', cache.applyDefaultCache)`), whose declaration types the arguments.
// An argument that is the caller's own untyped parameter is recognized here
// too, so ./core can follow a value handed down a chain of helpers to where
// it really comes from.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {MAX_REFERENCE_HOPS, MAX_REFERENCES_PER_CALL} from './constants';
import type {InferenceContext} from './context';
import {hasExplicitParameterType} from './ast-helpers';
import {boundArgument} from './bindings';
import {valueDeclarationOf} from './member-values';
import {searchReferences} from './reference-search';
import {informativeParts} from './type-helpers';
import {enclosingFunction, valueTarget} from './value-flow';
import type {CallSites, ReferenceTarget, ValueHolder} from './value-flow';

/**
 * True when `name` declares a parameter or a variable inside a function.
 * Such a search reads that function only (see ./reference-search) and can be
 * reached only through a hop from a search that was charged, so it is not
 * charged to ctx.searchBudget, though each of its hits still spends
 * ctx.referenceBudget. Every other search spends one unit, even one confined
 * to its own file: the budget bounds how far a request follows values from
 * helper to helper, not only how many files it reads.
 */
function isFunctionLocal(ts: typeof tsserver, name: tsserver.Identifier): boolean {
  const declaration = name.parent;
  if (ts.isParameter(declaration)) return true;
  const isVariable = ts.isVariableDeclaration(declaration) || ts.isBindingElement(declaration);
  return isVariable && enclosingFunction(declaration, ts) !== undefined;
}

function holderKey({name, role}: ValueHolder): string {
  const sourceFile = name.getSourceFile();
  return `${role}:${sourceFile.fileName}:${name.getStart(sourceFile)}`;
}

/**
 * True when `next` is searched now: it was not searched before in this walk
 * and the request can still pay for it. Records the search and spends its
 * unit of ctx.searchBudget, when it costs one.
 */
function claimSearch(ctx: InferenceContext, next: ValueHolder, searched: Set<string>): boolean {
  const key = holderKey(next);
  const charged = !isFunctionLocal(ctx.ts, next.name);
  if (searched.has(key) || (charged && ctx.searchBudget <= 0)) return false;
  searched.add(key);
  if (charged) ctx.searchBudget--;
  return true;
}

/**
 * Finds the actual call sites of the function `holder` holds (see
 * ./value-flow's holderOf), and the handoffs to declared callees, following up to MAX_REFERENCE_HOPS names the function value flows
 * into (see ./value-flow: require() bindings, exports, aliases, factories
 * returning it, parameters it is passed to) when a reference doesn't sit
 * directly in callee position. Stops early once ctx.referenceBudget (result
 * count) or ctx.searchBudget (searches) runs out, returning whatever call
 * sites were already found rather than continuing to fan out — an
 * under-inferred (but still heuristic, clearly-labeled) result beats hanging
 * on a widely-referenced helper. Results are memoized per name node for the
 * duration of the request.
 */
export function collectCallSites(ctx: InferenceContext, holder: ValueHolder): CallSites {
  const key = holderKey(holder);
  const memoized = ctx.callSiteMemo.get(key);
  if (memoized) return memoized;
  const found: CallSites = {calls: [], handoffs: []};
  const searched = new Set<string>();
  let frontier: ValueHolder[] = [holder];
  let localBudget = Math.min(MAX_REFERENCES_PER_CALL, ctx.referenceBudget);

  for (let hop = 0; hop <= MAX_REFERENCE_HOPS && frontier.length > 0 && localBudget > 0; hop++) {
    const nextFrontier: ValueHolder[] = [];
    for (const next of frontier) {
      if (localBudget <= 0) break;
      if (claimSearch(ctx, next, searched)) {
        localBudget = collectCallsFromName(ctx, next, found, nextFrontier, localBudget);
      }
    }
    frontier = nextFrontier;
  }

  ctx.callSiteMemo.set(key, found);
  return found;
}

/**
 * Runs one reference search for `next.name` and sorts each hit into a
 * resolved call site or handoff (recorded in `found`, once per call) or a
 * further name to chase on the next hop (pushed to `nextFrontier`). Consumes
 * up to `localBudget` result slots, returning the remaining local budget so
 * the caller can stop fanning out once it's exhausted.
 */
function collectCallsFromName(
  ctx: InferenceContext,
  next: ValueHolder,
  found: CallSites,
  nextFrontier: ValueHolder[],
  localBudget: number,
): number {
  for (const reference of searchReferences(ctx, next.name)) {
    if (localBudget <= 0) break;
    localBudget--;
    ctx.referenceBudget--;
    const target = valueTarget(ctx, reference, next.role);
    if (target?.kind === 'name') nextFrontier.push(target);
    else if (target) record(found, target);
  }
  return localBudget;
}

/** Records a call site or handoff in `found`, unless a reference found earlier already led to the same call. */
function record(found: CallSites, target: Exclude<ReferenceTarget, {kind: 'name'}>): void {
  if (target.kind === 'call') {
    if (!found.calls.some((site) => site.node === target.call.node)) found.calls.push(target.call);
  } else if (!found.handoffs.some((handoff) => handoff.call === target.handoff.call)) {
    found.handoffs.push(target.handoff);
  }
}

/**
 * The caller's own parameter an argument passes on as is (`items` in
 * `getMatchingProducts(productId, items)` inside a function taking `items`),
 * when only that parameter's call sites can say what it holds: the checker
 * has no type for it, it has no default value and no type of its own, and it
 * is not bound to a call being resolved (see ./bindings).
 */
export function forwardedParameter(
  ctx: InferenceContext,
  argument: tsserver.Expression,
): tsserver.ParameterDeclaration | undefined {
  const {ts, checker} = ctx;
  if (!ts.isIdentifier(argument) || boundArgument(ctx, argument)) return undefined;
  const declaration = valueDeclarationOf(ctx, argument);
  if (!declaration || !ts.isParameter(declaration) || declaration.initializer) return undefined;
  if (hasExplicitParameterType(declaration, ts)) return undefined;
  return informativeParts(ctx, checker.getTypeAtLocation(argument)).length === 0 ? declaration : undefined;
}
