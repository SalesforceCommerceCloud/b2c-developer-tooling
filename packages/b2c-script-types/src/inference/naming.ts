/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Identifier-name hints. SFCC code conventionally names a variable after the
// Script API class it holds (`customer`, `currentBasket`, `apiProduct`,
// `pli`). Usage alone often fits several classes (`.email` + `.firstName`
// fits both Profile and ProductListRegistrant), so the name is used to pick
// one — but only ever among classes the usage already fits: a name never adds
// a candidate of its own.

// Abbreviations whose class the identifier does not spell out, keyed and
// valued in lowercase. Everything else is derived from the identifier's own
// camelCase words, so this stays short.
const ABBREVIATIONS: ReadonlyMap<string, string> = new Map([
  ['pli', 'productlineitem'],
  ['lineitem', 'productlineitem'],
  ['paymentinstrument', 'orderpaymentinstrument'],
  ['shippingaddress', 'orderaddress'],
  ['billingaddress', 'orderaddress'],
]);

// All-lowercase qualifiers SFRA code glues onto a class name
// (`apiproduct`, `currentbasket`): stripping them leaves the class.
const QUALIFIER_PREFIXES = ['api', 'current', 'default', 'selected', 'new'];

interface Named {
  readonly name: string;
}

// Candidates by lowercased name, per candidate list. Every request on a
// Program picks among the same ambient class list (see ./ambient-index), so
// its table is built once per Program instead of once per pick.
const tablesByCandidates = new WeakMap<readonly Named[], ReadonlyMap<string, readonly Named[]>>();

function byLowercaseName<T extends Named>(candidates: readonly T[]): ReadonlyMap<string, readonly T[]> {
  const cached = tablesByCandidates.get(candidates) as ReadonlyMap<string, readonly T[]> | undefined;
  if (cached) return cached;
  const table = new Map<string, T[]>();
  for (const candidate of candidates) {
    const key = candidate.name.toLowerCase();
    const named = table.get(key);
    if (named) named.push(candidate);
    else table.set(key, [candidate]);
  }
  tablesByCandidates.set(candidates, table);
  return table;
}

// The expansion goes first: SFRA's `lineItem` parameters hold a
// ProductLineItem, even where the usage would also fit the LineItem base.
function withAbbreviation(key: string): string[] {
  const expanded = ABBREVIATIONS.get(key);
  return expanded ? [expanded, key] : [key];
}

/**
 * Lowercased class names `identifier` conventionally denotes, most specific
 * first: the whole name, then each shorter camelCase word suffix
 * (`resettingCustomer` → `customer`, `productShippingLineItem` →
 * `shippinglineitem` → `lineitem` → `item`), each preceded by its
 * abbreviation expansion, then the name with a qualifier prefix stripped.
 * Splitting on camelCase boundaries only is what keeps an all-lowercase
 * `border` from reading as `Order`.
 */
function conventionalClassNames(identifier: string): string[] {
  const words = identifier.split(/(?=[A-Z])/);
  const keys = words.flatMap((_, start) => withAbbreviation(words.slice(start).join('').toLowerCase()));
  const lower = identifier.toLowerCase();
  for (const prefix of QUALIFIER_PREFIXES) {
    if (lower.length > prefix.length && lower.startsWith(prefix))
      keys.push(...withAbbreviation(lower.slice(prefix.length)));
  }
  return keys;
}

/**
 * Picks the one candidate `identifier` names, or `undefined` when the name
 * points at none of them (or at several equally). Besides
 * {@link conventionalClassNames}, a camelCase identifier that is the tail of
 * exactly one candidate's name also counts (`priceModel` →
 * `ProductPriceModel`, `availabilityModel` → `ProductAvailabilityModel`).
 */
export function pickByName<T extends Named>(identifier: string, candidates: readonly T[]): T | undefined {
  const byName = byLowercaseName(candidates);
  for (const key of conventionalClassNames(identifier)) {
    const named = byName.get(key);
    if (named?.length === 1) return named[0];
  }
  const lower = identifier.toLowerCase();
  if (identifier === lower) return undefined;
  const tails = [...byName].filter(([name]) => name.endsWith(lower)).flatMap(([, named]) => named);
  return tails.length === 1 ? tails[0] : undefined;
}
