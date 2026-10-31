/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Tunable limits for the usage-inference engine. They exist so a crafted (or
// merely huge) cartridge can't make a single hover/completion do unbounded
// work — every recursive walk and reference search is capped by one of these.
// Grouping them here keeps the "how hard will this try?" knobs in one place.

// How far we chase an undocumented call chain (helper calls helper calls
// helper...) before giving up. Keeps worst-case cost predictable regardless of
// how deep a cartridge's helper stack goes.
export const MAX_INFERENCE_DEPTH = 3;

// How many functions a parameter's usage is followed into when the body
// passes the parameter on unchanged (`new BooleanAttributeValue(search,
// definition, refinementValue)`): what the receiving parameter's function
// does with it is usage of this one too. Each hop is one walk of a function
// (or of its file, for a value stored on `this`) and no reference search.
export const MAX_USAGE_FORWARDING_HOPS = 3;

// How many names a function value is followed through (see ./value-flow)
// before collectCallSites() gives up on finding an actual call site. SFRA's
// refinement models need four: the model -> `module.exports` (its require()
// calls) -> the factory returning it -> `var Model = factory(...)` -> the
// `Model` parameter it is passed on to, where `new Model(...)` finally runs.
// Hops into function-local names cost no project-wide search.
export const MAX_REFERENCE_HOPS = 4;

// Hard cap on how many reference-search hits collectCallSites() will process
// across a single top-level inference request (not just one call site) —
// bounds worst-case cost for a helper referenced from dozens of places,
// complementing MAX_INFERENCE_DEPTH's cap on recursion depth. Generous enough
// to cover realistic cartridge helper usage without being effectively
// unlimited. Note what this does and doesn't bound: it caps how many results
// get processed and how far the search fans out, but a single search still
// checks every occurrence of the name in the files that can refer to it —
// on a large project the dominant cost is that first search, and the real
// bound on it is cancellation: the search polls the host's cancellation
// token between files and throws TypeScript's OperationCanceledException,
// which the plugin's `guarded` wrapper rethrows, never swallows.
export const MAX_REFERENCES_PER_REQUEST = 200;

// Caps how much of that shared request-wide budget a *single* collectCallSites
// call can spend, so one widely-referenced sub-helper (e.g. reached from the
// first of several sibling return statements or call-site arguments) can't
// exhaust the whole budget and starve the others processed later in the same
// request.
export const MAX_REFERENCES_PER_CALL = 50;

// How many `.method()` hops resolveExpressionTypes() will chase within a
// single static method-chain expression (e.g. `a.b().c().d()`). This is
// separate from MAX_INFERENCE_DEPTH, which only bounds crossing into another
// undocumented helper's own return-type inference — an in-expression chain
// never crosses a function boundary, so without its own cap it would be
// bounded only by how long an expression a cartridge author (or a generated
// file) happens to write, not by a predictable cost.
export const MAX_CHAIN_HOPS = 10;

// How many cartridge levels the superModule member walk descends (top overlay
// -> mid overlay -> ... -> base). Real cartridge paths rarely stack more than
// three or four overlays of the same module.
export const MAX_SUPERMODULE_HOPS = 8;

// Hard cap on how many reference SEARCHES one top-level request may issue
// (one for a name declared inside a function is not counted: it reads that
// function only). This is a different axis from MAX_REFERENCES_PER_REQUEST,
// which only bounds how many search *results* get processed: every search
// costs its reads and checks even when it returns almost nothing, so a
// helper whose call sites feed it results of many DISTINCT sub-helpers (each
// searched once, each contributing only 2-3 results) drains the result
// budget at ~2-3 per search — measured at 76 searches ≈ 115ms for a single
// hover on an SFRA-sized program (~1,900 cartridge files) before this cap
// existed. Legitimate scenarios in the perf baseline suite need at most 6
// searches; 12 doubles that headroom while keeping the worst case at ~12
// searches per request.
export const MAX_SEARCHES_PER_REQUEST = 12;

// Bounds the editor's per-Program cache of finished hovers and completion
// lists during a long session without edits (hours of hovering around one
// Program). Entries are small plain data, so this is belt-and-braces, and a
// wholesale clear is honest: no LRU bookkeeping for a cache this cheap to
// refill.
export const MAX_DISPLAY_CACHE_ENTRIES = 512;

// Marks the completion entries this plugin synthesizes (as opposed to ones the
// TypeScript language service produced itself), so the editor can tell them
// apart. Purely a label — it carries no path or other data.
export const INFERRED_COMPLETION_SOURCE = '@salesforce/b2c-script-types/inferred-usage';

// Ambient usage matching (see ./ambient-index): a usage signature with fewer
// distinct member names than this is only trusted when exactly one ambient
// class declares it (`.addresses` is AddressBook's alone) or when the
// identifier name picks one of the matches (`customer` + `.profile`).
export const MIN_USAGE_SIGNATURE_MEMBERS = 2;

// Most distinct types a hover or completion list shows as a union, IntelliJ
// style (`Product | Order`). More than this collapses to the candidates'
// closest shared ancestor class when one fits, and otherwise stays silent: a
// longer union is noise rather than a hint.
export const MAX_UNION_TYPES = 3;

// Root classes nearly every Script API class inherits from. Offering them as
// the "common ancestor" of unrelated candidates tells the reader nothing.
export const UNINFORMATIVE_ANCESTORS: ReadonlySet<string> = new Set(['Object', 'ExtensibleObject', 'PersistentObject']);

// Member names so common across dw.* that they barely discriminate a class
// on their own (nearly every ExtensibleObject exposes `.custom` / `.UUID`).
// They still narrow an ambient match, but a signature made only of these
// never picks one class out of several.
export const WEAK_USAGE_MEMBERS: ReadonlySet<string> = new Set(['custom', 'UUID', 'toString', 'valueOf']);

// Script API TopLevel classes that describe one global object (`module`,
// `arguments`) rather than a kind of value code passes around. Usage matching
// skips them: `regionDefinition.id` is not a Module.
export const GLOBAL_OBJECT_CLASSES: ReadonlySet<string> = new Set(['Module', 'arguments']);

// JavaScript built-ins whose members ordinary code uses all the time. A usage
// signature one of them also satisfies (`msg.replace(...)`, `x.length`) is
// ambiguous: the value may well be a string or an array, so ambient matching
// stays silent rather than naming the Script API class that happens to fit.
export const BUILTIN_VALUE_TYPES: readonly string[] = [
  'String',
  'Number',
  'Boolean',
  'Array',
  'Function',
  'Date',
  'RegExp',
];

// Callee names whose callbacks lead with the collection element
// (`collections.forEach(coll, function (item) {...})`). A project helper's
// callbacks are typed from what its body passes them; this list only covers
// helpers whose body can't be read, and for those only these names get the
// sibling-collection element-type heuristic. `reduce` (accumulator first)
// and other unknown helpers stay out.
export const ELEMENT_FIRST_CALLBACK_CALLEES: ReadonlySet<string> = new Set([
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
