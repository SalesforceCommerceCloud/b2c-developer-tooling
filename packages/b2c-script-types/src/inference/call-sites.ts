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
// SFRA's constructor-function "class" models are invoked and inherited with.
// An argument that is the caller's own untyped parameter is recognized here
// too, so ./core can follow a value handed down a chain of helpers to where
// it really comes from.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {MAX_REFERENCE_HOPS, MAX_REFERENCES_PER_CALL} from './constants';
import type {InferenceContext} from './context';
import {getNodeAtPosition, hasExplicitParameterType} from './ast-helpers';
import {boundArgument} from './bindings';
import {valueDeclarationOf} from './member-values';
import {informativeParts} from './type-helpers';
import {enclosingFunction, valueTarget} from './value-flow';
import type {CallSite, ReferenceTarget, ValueRole} from './value-flow';

// Reference searches are what an inference request spends its time on, and
// a Program never changes, so their results are kept for as long as the
// Program lives: hovering one parameter after another in an unchanged
// project runs each search once. Entries are plain file names and spans, so
// they pin no checker. A search served from here still spends the request's
// search budget, so a request reaches the same call sites, and the same
// answer, whether or not an earlier request warmed the cache.
const referencesByProgram = new WeakMap<
  tsserver.Program,
  Map<tsserver.Identifier, readonly tsserver.ReferenceEntry[]>
>();

/** Every reference to `name` across the project, from the per-Program cache. Spends no budget: callers do. */
export function findReferences(ctx: InferenceContext, name: tsserver.Identifier): readonly tsserver.ReferenceEntry[] {
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

/** A name whose references are searched next, and how it holds the function. */
interface FrontierName {
  readonly name: tsserver.Identifier;
  readonly role: ValueRole;
}

/**
 * True when `name` declares a parameter or a variable inside a function.
 * TypeScript scopes a reference search on such a local to its function, so
 * it reads one file instead of scanning the program: it is not charged to
 * ctx.searchBudget, though each of its hits still spends ctx.referenceBudget.
 */
function isFunctionLocal(ts: typeof tsserver, name: tsserver.Identifier): boolean {
  const declaration = name.parent;
  if (ts.isParameter(declaration)) return true;
  const isVariable = ts.isVariableDeclaration(declaration) || ts.isBindingElement(declaration);
  return isVariable && enclosingFunction(declaration, ts) !== undefined;
}

function frontierKey({name, role}: FrontierName): string {
  const sourceFile = name.getSourceFile();
  return `${role}:${sourceFile.fileName}:${name.getStart(sourceFile)}`;
}

/**
 * Finds actual call sites for `nameNode`, following up to
 * MAX_REFERENCE_HOPS names the function value flows into (see ./value-flow:
 * require() bindings, exports, aliases, factories returning it, parameters
 * it is passed to) when a reference doesn't sit directly in callee
 * position. Stops early once ctx.referenceBudget (result count) or
 * ctx.searchBudget (project scans) runs out, returning whatever call sites
 * were already found rather than continuing to fan out — an under-inferred
 * (but still heuristic, clearly-labeled) result beats hanging on a
 * widely-referenced helper. Results are memoized per name node for the
 * duration of the request.
 */
export function collectCallSites(ctx: InferenceContext, nameNode: tsserver.Identifier): CallSite[] {
  const memoized = ctx.callSiteMemo.get(nameNode);
  if (memoized) return memoized;
  const calls: CallSite[] = [];
  const seenNameKeys = new Set<string>();
  let frontier: FrontierName[] = [{name: nameNode, role: 'value'}];
  let localBudget = Math.min(MAX_REFERENCES_PER_CALL, ctx.referenceBudget);

  for (let hop = 0; hop <= MAX_REFERENCE_HOPS && frontier.length > 0 && localBudget > 0; hop++) {
    const nextFrontier: FrontierName[] = [];
    for (const next of frontier) {
      if (localBudget <= 0) break;
      const key = frontierKey(next);
      const searchable = ctx.searchBudget > 0 || isFunctionLocal(ctx.ts, next.name);
      if (seenNameKeys.has(key) || !searchable) continue;
      seenNameKeys.add(key);
      localBudget = collectCallsFromName(ctx, next, calls, nextFrontier, localBudget);
    }
    frontier = nextFrontier;
  }

  ctx.callSiteMemo.set(nameNode, calls);
  return calls;
}

/**
 * Runs one reference search for `next.name` and sorts each hit into either a
 * resolved call site (pushed to `calls`, once per call) or a further name to
 * chase on the next hop (pushed to `nextFrontier`). Consumes one unit of the
 * shared search budget unless the name is function-local, and up to
 * `localBudget` result slots, returning the remaining local budget so the
 * caller can stop fanning out once it's exhausted.
 */
function collectCallsFromName(
  ctx: InferenceContext,
  next: FrontierName,
  calls: CallSite[],
  nextFrontier: FrontierName[],
  localBudget: number,
): number {
  if (!isFunctionLocal(ctx.ts, next.name)) ctx.searchBudget--;
  for (const reference of findReferences(ctx, next.name)) {
    if (localBudget <= 0) break;
    localBudget--;
    ctx.referenceBudget--;
    const target = referenceTarget(ctx, reference, next.role);
    if (target?.kind === 'name') nextFrontier.push(target);
    else if (target && !calls.some((site) => site.node === target.call.node)) calls.push(target.call);
  }
  return localBudget;
}

/**
 * Where one reference search hit leads (see valueTarget()). Definition sites
 * (the declaration itself) lead nowhere new; neither does a hit on a whole
 * module (the source file itself, which has no parent — e.g. a
 * `module.exports` reference landing in a file's leading comment).
 */
function referenceTarget(
  ctx: InferenceContext,
  reference: tsserver.ReferenceEntry,
  role: ValueRole,
): ReferenceTarget | undefined {
  const file = ctx.program.getSourceFile(reference.fileName);
  const node = file && getNodeAtPosition(file, ctx.ts, reference.textSpan.start);
  return node?.parent ? valueTarget(ctx, node, role) : undefined;
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
