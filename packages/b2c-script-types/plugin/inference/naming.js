"use strict";
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickByName = pickByName;
// Identifier-name hints. SFCC code conventionally names a variable after the
// Script API class it holds (`customer`, `currentBasket`, `apiProduct`,
// `pli`). Usage alone often fits several classes (`.email` + `.firstName`
// fits both Profile and ProductListRegistrant), so the name is used to pick
// one — but only ever among classes the usage already fits: a name never adds
// a candidate of its own.
// Abbreviations whose class the identifier does not spell out, keyed and
// valued in lowercase. Everything else is derived from the identifier's own
// camelCase words, so this stays short.
const ABBREVIATIONS = new Map([
    ['pli', 'productlineitem'],
    ['lineitem', 'productlineitem'],
    ['paymentinstrument', 'orderpaymentinstrument'],
    ['shippingaddress', 'orderaddress'],
    ['billingaddress', 'orderaddress'],
]);
// All-lowercase qualifiers SFRA code glues onto a class name
// (`apiproduct`, `currentbasket`): stripping them leaves the class.
const QUALIFIER_PREFIXES = ['api', 'current', 'default', 'selected', 'new'];
// The expansion goes first: SFRA's `lineItem` parameters hold a
// ProductLineItem, even where the usage would also fit the LineItem base.
function withAbbreviation(key) {
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
function conventionalClassNames(identifier) {
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
function pickByName(identifier, candidates) {
    const byName = new Map();
    for (const candidate of candidates) {
        const key = candidate.name.toLowerCase();
        const named = byName.get(key);
        if (named)
            named.push(candidate);
        else
            byName.set(key, [candidate]);
    }
    for (const key of conventionalClassNames(identifier)) {
        const named = byName.get(key);
        if (named?.length === 1)
            return named[0];
    }
    if (identifier === identifier.toLowerCase())
        return undefined;
    const lower = identifier.toLowerCase();
    const tails = candidates.filter((candidate) => candidate.name.toLowerCase().endsWith(lower));
    return tails.length === 1 ? tails[0] : undefined;
}
