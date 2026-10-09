/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// The InferenceContext is the "scratchpad" for a single hover/completion
// request: the TypeScript program/checker to ask questions of, the budgets
// that keep one request bounded, and the per-request memo/guards that stop
// the recursive walk from repeating work or looping forever. A fresh one is
// built per request and thrown away when it finishes.

import type tsserver from 'typescript/lib/tsserverlibrary';

import {NO_BINDINGS} from './bindings';
import type {Bindings} from './bindings';
import type {CallSites} from './value-flow';
import {MAX_INFERENCE_DEPTH, MAX_REFERENCES_PER_REQUEST, MAX_SEARCHES_PER_REQUEST} from './constants';
import type {UsageProfile} from './usage-profile';
import type {HookRegistration} from '../resolver/hook-registry';

/**
 * What the plugin host knows about the project beyond its Program: the
 * cartridge path and the cartridges' hook registrations. Without it, the
 * evidence that depends on them is simply not gathered.
 */
export interface InferenceHost {
  /**
   * Maps a cartridge file to the same-subpath file in the next cartridge
   * down the cartridge path — the module `module.superModule` refers to at
   * runtime. Without it, `module.superModule` expressions stay uninferred.
   */
  readonly resolveSuperModulePath?: (containingFile: string) => string | undefined;
  /**
   * The extension points the cartridges' hooks.json files register scripts
   * for (see ./hook-calls). Asked at most once per request; a host may cache
   * the answer per Program.
   */
  readonly hookRegistrations?: (program: tsserver.Program) => readonly HookRegistration[];
  /**
   * True once the editor has cancelled the request (the user kept typing).
   * Reference searches poll it between files and throw TypeScript's
   * OperationCanceledException, the way TypeScript's own searches do.
   */
  readonly isCancellationRequested?: () => boolean;
}

interface MemoEntry {
  /**
   * The `depth` this was computed at — i.e. how much of the recursion budget
   * had already been spent getting here. A result computed at an equal-or-
   * shallower depth (equal-or-more remaining budget) is always safe to reuse
   * for a request now at an equal-or-deeper depth, since more budget can only
   * surface the same types or more, never fewer.
   */
  readonly atDepth: number;
  readonly types: tsserver.Type[];
}

export interface InferenceContext {
  readonly ts: typeof tsserver;
  readonly program: tsserver.Program;
  readonly checker: tsserver.TypeChecker;
  /**
   * Recursion guard for the current inference request only (cleared as the
   * call stack unwinds) — NOT a cross-request memoization cache. It exists
   * solely to break cycles like `function a(){return b()} function b(){return a()}`.
   */
  readonly visiting: Set<tsserver.Node>;
  /**
   * Request-scoped memoization so sibling branches (e.g. several return
   * statements or call-site arguments that all resolve through the same
   * undocumented sub-helper) don't redo the same reference search and
   * recursive inference repeatedly within one hover/completion request.
   */
  readonly memo: Map<tsserver.Node, MemoEntry>;
  /**
   * Mutable, shared across the whole request — decremented by
   * collectCallSites() every time it processes a reference.
   */
  referenceBudget: number;
  /**
   * Mutable, shared across the whole request — decremented by
   * collectCallSites() for every reference search it runs, except one for a
   * name declared inside a function. See MAX_SEARCHES_PER_REQUEST for why
   * this needs its own budget alongside the result-count one.
   */
  searchBudget: number;
  /**
   * Request-scoped memo of collectCallSites() results, keyed by the searched
   * name and the role it holds the function in (see ./value-flow). Two different parameters of the same function (or two return
   * paths reaching the same parameter set) otherwise each re-run the exact
   * same reference searches within one request. Reuse is sound because the
   * budgets only ever decrease during a request: a memoized result was
   * computed with at least as much budget as any later call would have had,
   * so it can only be equally or more complete.
   */
  readonly callSiteMemo: Map<string, CallSites>;
  /**
   * Request-scoped memo of checker.typeToString() results, used by
   * dedupeTypes(). Candidate types propagate up through every recursion
   * level (parameter -> return -> forwarding helper -> ...), and each level
   * dedupes its combined result — without the memo the same Type objects get
   * re-stringified once per level (measured: 192 stringifications for 48
   * unique candidate types, 13ms of a 34ms request, when 50 call sites pass
   * large distinct object literals through a two-hop forwarding chain).
   * Stringifying a type is pure for a given checker, and the context never
   * outlives its checker, so memoizing per request is sound.
   */
  readonly typeDisplayStrings: Map<tsserver.Type, string>;
  /**
   * Request-scoped memo of own usage profiles (see ./usage-profile; the
   * usage of the parameters a value is passed on to is merged in on top),
   * keyed by the parameter's or variable's symbol. Every consumer of a profile (the
   * body-usage filter, contextual constraints, ambient matching, reassigned
   * values) reads the same single walk of the declaring scope.
   */
  readonly profiles: Map<tsserver.Symbol, UsageProfile>;
  /**
   * Mutable, shared across the whole request — incremented every time a
   * cycle guard fires (a `visiting` hit). A result computed while this moved
   * is potentially incomplete *for this call stack only* (the cycle member it
   * skipped could resolve fine from a different entry point later in the same
   * request), so such results must not be memoized — see withInferenceGuards.
   */
  cycleHits: number;
  /**
   * The parameters bound to one call's arguments while that call's
   * result is inferred (see ./bindings); empty otherwise. Swapped in and out
   * as calls nest, never shared between them.
   */
  bindings: Bindings;
  /** What the plugin host supplies about the project (cartridge path, hook registrations). */
  readonly host: InferenceHost;
  /**
   * A completion request's cursor position. Exists so usage profiling (see
   * ./usage-profile) can exclude the property access the completion is
   * itself sitting inside of from its own evidence. A member name still
   * being typed (`shipment.pro|`) is not a member anything has, and a
   * dangling `shipment.` immediately followed (after a line
   * break) by more code doesn't get automatic semicolon insertion — `.`
   * always demands a following identifier — so the parser merges it with
   * whatever statement comes next (`shipment.\n\nTransaction.wrap(...)`
   * parses as one expression, `shipment.Transaction.wrap(...)`). Left
   * uncorrected, that phantom `Transaction` member would count as real usage
   * evidence and poison the match with a member no real class has, silently
   * producing no completions for the very position asking for them.
   */
  readonly triggerPosition?: number;
}

/**
 * Builds a fresh inference context for one top-level hover/completion
 * request, or `undefined` if the language service has no program yet.
 */
export function createInferenceContext(
  ts: typeof tsserver,
  languageService: tsserver.LanguageService,
  host: InferenceHost = {},
  triggerPosition?: number,
): InferenceContext | undefined {
  const program = languageService.getProgram();
  return program && contextForProgram(ts, program, host, triggerPosition);
}

/**
 * Like {@link createInferenceContext}, for a caller that already holds the
 * request's Program: asking the language service for it again brings it up
 * to date with the host again, which reads the version of every file.
 */
export function contextForProgram(
  ts: typeof tsserver,
  program: tsserver.Program,
  host: InferenceHost = {},
  triggerPosition?: number,
): InferenceContext {
  return {
    ts,
    program,
    checker: program.getTypeChecker(),
    visiting: new Set(),
    memo: new Map(),
    referenceBudget: MAX_REFERENCES_PER_REQUEST,
    searchBudget: MAX_SEARCHES_PER_REQUEST,
    callSiteMemo: new Map(),
    typeDisplayStrings: new Map(),
    profiles: new Map(),
    cycleHits: 0,
    bindings: NO_BINDINGS,
    host,
    triggerPosition,
  };
}

/**
 * Runs `compute` with `node` marked as in progress, so a cycle that leads
 * back to the same node (`var a = b; var b = a;`, or two helpers returning
 * each other's result) gets `fallback` instead of recursing forever. Each hit
 * is counted in ctx.cycleHits; see {@link withInferenceGuards}.
 */
export function withCycleGuard<T>(ctx: InferenceContext, node: tsserver.Node, fallback: T, compute: () => T): T {
  if (ctx.visiting.has(node)) {
    ctx.cycleHits++;
    return fallback;
  }
  ctx.visiting.add(node);
  try {
    return compute();
  } finally {
    ctx.visiting.delete(node);
  }
}

/**
 * The shared preamble for every memoized inference entry point: serve a memo
 * hit, enforce MAX_INFERENCE_DEPTH, break cycles, and memoize the result.
 *
 * The memo is consulted before the depth cap: a result computed at an equal
 * or shallower depth had at least as much budget as this call would, so it is
 * reusable however deep the current path is. A result whose computation hit
 * a cycle guard is not memoized: it was cut short by what happened to be on
 * the current call stack, and the same node reached later from outside the
 * cycle could resolve more. While call-specific bindings are in force
 * nothing is memoized, since a result for one call's arguments is not the
 * node's general result; and inside a bound function the memo is not read
 * either, since its general result is what the bindings are there to
 * improve on. Anywhere else the general result still holds.
 */
export function withInferenceGuards(
  ctx: InferenceContext,
  node: tsserver.Node,
  depth: number,
  compute: () => tsserver.Type[],
): tsserver.Type[] {
  const unbound = ctx.bindings.size === 0;
  const cached = unbound || !isInBoundFunction(ctx, node) ? ctx.memo.get(node) : undefined;
  if (cached && cached.atDepth <= depth) return cached.types;
  if (depth > MAX_INFERENCE_DEPTH) return [];
  return withCycleGuard(ctx, node, [], () => {
    const cycleHitsBefore = ctx.cycleHits;
    const types = compute();
    if (unbound && ctx.cycleHits === cycleHitsBefore) ctx.memo.set(node, {atDepth: depth, types});
    return types;
  });
}

/** True when `node` lies inside a function whose parameters are bound to one call's arguments. */
function isInBoundFunction(ctx: InferenceContext, node: tsserver.Node): boolean {
  const file = node.getSourceFile();
  for (const parameter of ctx.bindings.keys()) {
    const fn = parameter.parent;
    if (fn.getSourceFile() === file && node.pos >= fn.pos && node.end <= fn.end) return true;
  }
  return false;
}
