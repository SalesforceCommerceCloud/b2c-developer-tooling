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

// How many indirection hops (require() binding -> destructuring -> renamed
// re-export, etc.) collectCallSites() will follow from a reference before
// giving up on finding an actual call site.
export const MAX_REFERENCE_HOPS = 2;

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
export const MAX_SEARCHES_PER_REQUEST = 12;

// Marks the completion entries this plugin synthesizes (as opposed to ones the
// TypeScript language service produced itself), so the editor can tell them
// apart. Purely a label — it carries no path or other data.
export const INFERRED_COMPLETION_SOURCE = '@salesforce/b2c-script-types/inferred-usage';

// Last-resort fallback when call-site/return-expression inference (the whole
// rest of the engine) comes up empty: match the member names a parameter is
// actually accessed by (`shipment.custom`, `shipment.productLineItems`, ...)
// against every ambient class/interface visible in the program, and accept
// the most specific one(s) that expose all of them. A single accessed member
// name (e.g. just `.custom`) is carried by dozens of unrelated business
// objects, so it's too weak a signal on its own to guess from — UNLESS that
// single member happens to be globally unique across every ambient class
// (e.g. `.addresses`, which only `dw.customer.AddressBook` declares), in
// which case there's no ambiguity to be weak about. See
// matchAmbientTypesByUsage's unambiguous-single-member exception.
export const MIN_USAGE_SIGNATURE_MEMBERS = 2;

// If the member-name signature still ties across more candidates than this
// after ranking by specificity (distinctiveness, then fewest total members),
// the match is too ambiguous to be a useful hint — silence beats a wall of
// unrelated candidates in the hover text.
export const MAX_USAGE_MATCH_CANDIDATES = 5;

// When call-site arguments don't converge on a single distinct type, silence
// rather than union a noisy hover like `Product | Order`. A two-type union is
// already usually wrong for any given call site; ambient usage-matching is
// also skipped in that case — conflicting evidence is not "no call sites".
export const MAX_CALL_SITE_CANDIDATES = 1;

// Member names so common across dw.* that they barely discriminate a class
// on their own (nearly every ExtensibleObject exposes `.custom` / `.UUID`).
// They still count as usage evidence for matching, but contribute far less
// to the distinctiveness score used to rank ambient candidates.
export const WEAK_USAGE_MEMBERS: ReadonlySet<string> = new Set(['custom', 'UUID', 'toString', 'valueOf']);

// Callee names whose callbacks lead with the collection element
// (`collections.forEach(coll, function (item) {...})`). Only these get the
// sibling-collection element-type heuristic; `reduce` (accumulator first)
// and unknown helpers stay out.
export const ELEMENT_FIRST_CALLBACK_CALLEES: ReadonlySet<string> = new Set([
  'forEach',
  'map',
  'filter',
  'every',
  'some',
  // SFRA `collections.find(coll, function (item) {...})` — same element-first
  // shape; used heavily for address-book / line-item lookups (a storefront cartridge).
  'find',
  // Stock SFRA `collections.first` takes only the collection, but several
  // storefronts (and common calculate.js ports) call it with a predicate
  // the same shape as `find`. Treat that second-arg callback as element-first
  // when present so the predicate parameter still gets a type.
  'first',
]);

/**
 * SFRA/storefront parameter names that conventionally hold a Script API class
 * whose declared name does not equal the identifier (case-insensitive). Used
 * by ambient usage-matching's identifier short-circuit — `lineItem` must map
 * to `ProductLineItem`, not look for a nonexistent ambient class named
 * `LineItem`. Keys are lowercase; values are ambient class simple names.
 *
 * Keep this list conservative: only aliases that are unambiguous in real
 * cartridges. Bare `address` is deliberately omitted (CustomerAddress vs
 * OrderAddress vs Store address models). Prefer adding PascalCase suffixes to
 * {@link CONVENTIONAL_IDENTIFIER_PASCAL_SUFFIXES} for `resettingCustomer`-style
 * names; this map is for short / all-lowercase tokens (`pli`, `pricemodel`).
 */
export const CONVENTIONAL_IDENTIFIER_ALIASES: ReadonlyMap<string, string> = new Map([
  ['lineitem', 'ProductLineItem'],
  ['pli', 'ProductLineItem'],
  ['productlineitem', 'ProductLineItem'],
  ['pricemodel', 'ProductPriceModel'],
  ['availabilitymodel', 'ProductAvailabilityModel'],
  ['shippingaddress', 'OrderAddress'],
  ['billingaddress', 'OrderAddress'],
  ['paymentinstrument', 'OrderPaymentInstrument'],
  ['shippingmethod', 'ShippingMethod'],
  ['shippinglineitem', 'ShippingLineItem'],
  ['priceadjustment', 'PriceAdjustment'],
  ['giftcertificatelineitem', 'GiftCertificateLineItem'],
  ['couponlineitem', 'CouponLineItem'],
  ['customeraddress', 'CustomerAddress'],
  ['orderaddress', 'OrderAddress'],
  // High-frequency all-lowercase / compound forms seen across storefronts
  // (when authors don't camelCase the class token).
  ['currentbasket', 'Basket'],
  ['currentcustomer', 'Customer'],
  ['currentorder', 'Order'],
  ['apiproduct', 'Product'],
  ['apiorder', 'Order'],
  ['apilineitem', 'ProductLineItem'],
]);

/**
 * Trailing PascalCase class tokens → ambient class simple name. Matched with
 * `identifierName.endsWith(pascalSuffix)` (case-sensitive on the original
 * identifier) so `resettingCustomer` / `apiProduct` / `currentBasket` resolve
 * while all-lowercase noise like `border` / `emailaddress` does not.
 *
 * Ordered longest-first so `productLineItem` hits ProductLineItem rather than
 * Product. Generic `Address` is omitted — too many false friends
 * (`emailAddress`, `ipAddress`, store address models).
 */
export const CONVENTIONAL_IDENTIFIER_PASCAL_SUFFIXES: ReadonlyArray<readonly [string, string]> = [
  ['GiftCertificateLineItem', 'GiftCertificateLineItem'],
  ['CouponLineItem', 'CouponLineItem'],
  ['ProductLineItem', 'ProductLineItem'],
  ['ShippingLineItem', 'ShippingLineItem'],
  ['OrderPaymentInstrument', 'OrderPaymentInstrument'],
  ['PaymentInstrument', 'OrderPaymentInstrument'],
  ['ProductAvailabilityModel', 'ProductAvailabilityModel'],
  ['AvailabilityModel', 'ProductAvailabilityModel'],
  ['ProductPriceModel', 'ProductPriceModel'],
  ['PriceModel', 'ProductPriceModel'],
  ['ShippingAddress', 'OrderAddress'],
  ['BillingAddress', 'OrderAddress'],
  ['CustomerAddress', 'CustomerAddress'],
  ['OrderAddress', 'OrderAddress'],
  ['ShippingMethod', 'ShippingMethod'],
  ['PriceAdjustment', 'PriceAdjustment'],
  ['LineItem', 'ProductLineItem'],
  ['Customer', 'Customer'],
  ['Profile', 'Profile'],
  ['Product', 'Product'],
  ['Basket', 'Basket'],
  ['Shipment', 'Shipment'],
  ['Category', 'Category'],
  ['Order', 'Order'],
  ['Store', 'Store'],
  ['Variant', 'Variant'],
  ['Money', 'Money'],
];
