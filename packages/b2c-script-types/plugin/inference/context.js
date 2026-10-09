"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInferenceContext = createInferenceContext;
exports.contextForProgram = contextForProgram;
exports.withCycleGuard = withCycleGuard;
exports.withInferenceGuards = withInferenceGuards;
const bindings_1 = require("./bindings");
const constants_1 = require("./constants");
/**
 * Builds a fresh inference context for one top-level hover/completion
 * request, or `undefined` if the language service has no program yet.
 */
function createInferenceContext(ts, languageService, host = {}, triggerPosition) {
    const program = languageService.getProgram();
    return program && contextForProgram(ts, program, host, triggerPosition);
}
/**
 * Like {@link createInferenceContext}, for a caller that already holds the
 * request's Program: asking the language service for it again brings it up
 * to date with the host again, which reads the version of every file.
 */
function contextForProgram(ts, program, host = {}, triggerPosition) {
    return {
        ts,
        program,
        checker: program.getTypeChecker(),
        visiting: new Set(),
        memo: new Map(),
        referenceBudget: constants_1.MAX_REFERENCES_PER_REQUEST,
        searchBudget: constants_1.MAX_SEARCHES_PER_REQUEST,
        callSiteMemo: new Map(),
        typeDisplayStrings: new Map(),
        profiles: new Map(),
        cycleHits: 0,
        bindings: bindings_1.NO_BINDINGS,
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
function withCycleGuard(ctx, node, fallback, compute) {
    if (ctx.visiting.has(node)) {
        ctx.cycleHits++;
        return fallback;
    }
    ctx.visiting.add(node);
    try {
        return compute();
    }
    finally {
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
function withInferenceGuards(ctx, node, depth, compute) {
    const unbound = ctx.bindings.size === 0;
    const cached = unbound || !isInBoundFunction(ctx, node) ? ctx.memo.get(node) : undefined;
    if (cached && cached.atDepth <= depth)
        return cached.types;
    if (depth > constants_1.MAX_INFERENCE_DEPTH)
        return [];
    return withCycleGuard(ctx, node, [], () => {
        const cycleHitsBefore = ctx.cycleHits;
        const types = compute();
        if (unbound && ctx.cycleHits === cycleHitsBefore)
            ctx.memo.set(node, { atDepth: depth, types });
        return types;
    });
}
/** True when `node` lies inside a function whose parameters are bound to one call's arguments. */
function isInBoundFunction(ctx, node) {
    const file = node.getSourceFile();
    for (const parameter of ctx.bindings.keys()) {
        const fn = parameter.parent;
        if (fn.getSourceFile() === file && node.pos >= fn.pos && node.end <= fn.end)
            return true;
    }
    return false;
}
