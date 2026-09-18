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

import type {CallSite} from './call-sites';
import {MAX_REFERENCES_PER_REQUEST, MAX_SEARCHES_PER_REQUEST} from './constants';

export interface MemoEntry {
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
  readonly languageService: tsserver.LanguageService;
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
   * collectCallSites() every time it issues a getReferencesAtPosition call
   * (a full project scan each). See MAX_SEARCHES_PER_REQUEST for why this
   * needs its own budget alongside the result-count one.
   */
  searchBudget: number;
  /**
   * Request-scoped memo of collectCallSites() results, keyed by the searched
   * name node. Two different parameters of the same function (or two return
   * paths reaching the same parameter set) otherwise each re-run the exact
   * same reference searches within one request. Reuse is sound because the
   * budgets only ever decrease during a request: a memoized result was
   * computed with at least as much budget as any later call would have had,
   * so it can only be equally or more complete.
   */
  readonly callSiteMemo: Map<tsserver.Identifier, CallSite[]>;
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
   * Mutable, shared across the whole request — incremented every time a
   * cycle guard fires (a `visiting` hit). A result computed while this moved
   * is potentially incomplete *for this call stack only* (the cycle member it
   * skipped could resolve fine from a different entry point later in the same
   * request), so such results must not be memoized — see inferReturnType.
   */
  cycleHits: number;
  /**
   * Maps a cartridge file to the same-subpath file in the next cartridge
   * down the cartridge path — the module `module.superModule` refers to at
   * runtime. Supplied by the plugin host (which owns the cartridge order);
   * without it, `module.superModule` expressions stay uninferred.
   */
  readonly resolveSuperModulePath?: (containingFile: string) => string | undefined;
  /**
   * The hover/completion request's own cursor position, when there is one.
   * Exists so usage-based matching (see ./usage-match) can exclude the
   * property access the request is itself sitting inside of from its own
   * evidence: a dangling `shipment.` immediately followed (after a line
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
  resolveSuperModulePath?: (containingFile: string) => string | undefined,
  triggerPosition?: number,
): InferenceContext | undefined {
  const program = languageService.getProgram();
  if (!program) return undefined;
  return {
    ts,
    program,
    checker: program.getTypeChecker(),
    languageService,
    visiting: new Set(),
    memo: new Map(),
    referenceBudget: MAX_REFERENCES_PER_REQUEST,
    searchBudget: MAX_SEARCHES_PER_REQUEST,
    callSiteMemo: new Map(),
    typeDisplayStrings: new Map(),
    cycleHits: 0,
    resolveSuperModulePath,
    triggerPosition,
  };
}
