"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ELEMENT_FIRST_CALLBACK_CALLEES = exports.WEAK_USAGE_MEMBERS = exports.UNINFORMATIVE_ANCESTORS = exports.MAX_UNION_TYPES = exports.MIN_USAGE_SIGNATURE_MEMBERS = exports.INFERRED_COMPLETION_SOURCE = exports.MAX_DISPLAY_CACHE_ENTRIES = exports.MAX_SEARCHES_PER_REQUEST = exports.MAX_SUPERMODULE_HOPS = exports.MAX_CHAIN_HOPS = exports.MAX_REFERENCES_PER_CALL = exports.MAX_REFERENCES_PER_REQUEST = exports.MAX_REFERENCE_HOPS = exports.MAX_INFERENCE_DEPTH = void 0;
// Tunable limits for the usage-inference engine. They exist so a crafted (or
// merely huge) cartridge can't make a single hover/completion do unbounded
// work — every recursive walk and reference search is capped by one of these.
// Grouping them here keeps the "how hard will this try?" knobs in one place.
// How far we chase an undocumented call chain (helper calls helper calls
// helper...) before giving up. Keeps worst-case cost predictable regardless of
// how deep a cartridge's helper stack goes.
exports.MAX_INFERENCE_DEPTH = 3;
// How many indirection hops (require() binding -> destructuring -> renamed
// re-export, etc.) collectCallSites() will follow from a reference before
// giving up on finding an actual call site.
exports.MAX_REFERENCE_HOPS = 2;
// Hard cap on how many reference-search hits collectCallSites() will process
// across a single top-level inference request (not just one call site) —
// bounds worst-case cost for a helper referenced from dozens of places,
// complementing MAX_INFERENCE_DEPTH's cap on recursion depth. Generous enough
// to cover realistic cartridge helper usage without being effectively
// unlimited. Note what this does and doesn't bound: it caps how many results
// get processed and how far the search fans out, but a single
// getReferencesAtPosition call still scans the whole program regardless — on
// a large project the dominant cost is that first search, and the real bound
// on it is TS's own cooperative cancellation (rethrown, never swallowed, by
// the plugin's `guarded` wrapper).
exports.MAX_REFERENCES_PER_REQUEST = 200;
// Caps how much of that shared request-wide budget a *single* collectCallSites
// call can spend, so one widely-referenced sub-helper (e.g. reached from the
// first of several sibling return statements or call-site arguments) can't
// exhaust the whole budget and starve the others processed later in the same
// request.
exports.MAX_REFERENCES_PER_CALL = 50;
// How many `.method()` hops resolveExpressionTypes() will chase within a
// single static method-chain expression (e.g. `a.b().c().d()`). This is
// separate from MAX_INFERENCE_DEPTH, which only bounds crossing into another
// undocumented helper's own return-type inference — an in-expression chain
// never crosses a function boundary, so without its own cap it would be
// bounded only by how long an expression a cartridge author (or a generated
// file) happens to write, not by a predictable cost.
exports.MAX_CHAIN_HOPS = 10;
// How many cartridge levels the superModule member walk descends (top overlay
// -> mid overlay -> ... -> base). Real cartridge paths rarely stack more than
// three or four overlays of the same module.
exports.MAX_SUPERMODULE_HOPS = 8;
// Hard cap on how many getReferencesAtPosition SEARCHES one top-level request
// may issue. This is a different axis from MAX_REFERENCES_PER_REQUEST, which
// only bounds how many search *results* get processed: every search is a full
// project scan even when it returns almost nothing, so a helper whose call
// sites feed it results of many DISTINCT sub-helpers (each searched once,
// each contributing only 2-3 results) drains the result budget at ~2-3 per
// search — measured at 76 scans ≈ 115ms for a single hover on an SFRA-sized
// program (~1,900 cartridge files) before this cap existed. Legitimate
// scenarios in the perf baseline suite need at most 6 searches; 12 doubles
// that headroom while keeping the worst case at ~12 scans per request.
exports.MAX_SEARCHES_PER_REQUEST = 12;
// Bounds the editor's per-Program cache of finished hovers and completion
// lists during a long session without edits (hours of hovering around one
// Program). Entries are small plain data, so this is belt-and-braces, and a
// wholesale clear is honest: no LRU bookkeeping for a cache this cheap to
// refill.
exports.MAX_DISPLAY_CACHE_ENTRIES = 512;
// Marks the completion entries this plugin synthesizes (as opposed to ones the
// TypeScript language service produced itself), so the editor can tell them
// apart. Purely a label — it carries no path or other data.
exports.INFERRED_COMPLETION_SOURCE = '@salesforce/b2c-script-types/inferred-usage';
// Ambient usage matching (see ./ambient-index): a usage signature with fewer
// distinct member names than this is only trusted when exactly one ambient
// class declares it (`.addresses` is AddressBook's alone) or when the
// identifier name picks one of the matches (`customer` + `.profile`).
exports.MIN_USAGE_SIGNATURE_MEMBERS = 2;
// Most distinct types a hover or completion list shows as a union, IntelliJ
// style (`Product | Order`). More than this collapses to the candidates'
// closest shared ancestor class when one fits, and otherwise stays silent: a
// longer union is noise rather than a hint.
exports.MAX_UNION_TYPES = 3;
// Root classes nearly every Script API class inherits from. Offering them as
// the "common ancestor" of unrelated candidates tells the reader nothing.
exports.UNINFORMATIVE_ANCESTORS = new Set(['Object', 'ExtensibleObject', 'PersistentObject']);
// Member names so common across dw.* that they barely discriminate a class
// on their own (nearly every ExtensibleObject exposes `.custom` / `.UUID`).
// They still narrow an ambient match, but a signature made only of these
// never picks one class out of several.
exports.WEAK_USAGE_MEMBERS = new Set(['custom', 'UUID', 'toString', 'valueOf']);
// Callee names whose callbacks lead with the collection element
// (`collections.forEach(coll, function (item) {...})`). Only these get the
// sibling-collection element-type heuristic; `reduce` (accumulator first)
// and unknown helpers stay out.
exports.ELEMENT_FIRST_CALLBACK_CALLEES = new Set([
    'forEach',
    'map',
    'filter',
    'every',
    'some',
    // SFRA `collections.find(coll, function (item) {...})` — same element-first
    // shape; used heavily for address-book and line-item lookups.
    'find',
    // Stock SFRA `collections.first` takes only the collection, but several
    // storefronts (and common calculate.js ports) call it with a predicate
    // the same shape as `find`. Treat that second-arg callback as element-first
    // when present so the predicate parameter still gets a type.
    'first',
]);
