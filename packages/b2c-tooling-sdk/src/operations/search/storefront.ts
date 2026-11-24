/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {setTimeout as sleep} from 'node:timers/promises';
import {getApiFetch} from '../../clients/http-transport.js';
import {getUserAgent} from '../../clients/user-agent.js';
import {wrapNetworkError} from '../../errors/network-error.js';
import {getLogger} from '../../logging/logger.js';
import {DEFAULT_CAPTURE_LIMIT, MAX_CAPTURE_LIMIT, normalizeQueries, withoutUndefined} from './capture.js';
import {
  firstTextOf,
  matches,
  parseHtml,
  parseSelector,
  querySelector,
  querySelectorAll,
  textOf,
  type HtmlElement,
} from './html.js';
import {
  SEARCH_CAPTURE_SCHEMA_VERSION,
  type CapturedHit,
  type CapturedRefinement,
  type CapturedRefinementValue,
  type SearchCapture,
  type SearchCaptureEntry,
  type StorefrontSearchCaptureRequest,
} from './types.js';

/** User name for storefront password protection. B2C Commerce always uses this name. */
export const DEFAULT_STOREFRONT_USER = 'storefront';

/** Locale segment of the default search page path. */
export const DEFAULT_STOREFRONT_LOCALE = 'default';

/** Time allowed for each page, including redirects, before the request is abandoned. */
export const DEFAULT_STOREFRONT_TIMEOUT_MS = 60_000;

/** Most redirects followed for one page. */
const MAX_REDIRECTS = 5;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** Query parameter that makes each capture's URLs unique, so the page cache cannot answer. */
const CACHE_BUSTER_PARAM = '_';

/**
 * CSS selectors that find the search results on a storefront search page.
 *
 * Selectors support type, universal, class, ID and attribute selectors, the
 * descendant and child (`>`) combinators, and comma-separated lists.
 * Pseudo-classes are not supported.
 */
export interface StorefrontPageProfile {
  /** Product tiles, in ranked order. A tile inside another tile is ignored. */
  productTile: string;
  /** Tile attribute that holds the product ID. */
  productIdAttribute: string;
  /** Product name, inside a tile. */
  productName: string;
  /**
   * Sales price, inside a tile. The price is read from the element's `content`
   * attribute, as the SFRA price template writes it (`content="24.00"`); the text
   * is not read. For a price range, the first match is the lowest price.
   */
  productPrice: string;
  /**
   * Elements that state the number of results, in order of preference. The first
   * element whose text holds a number is used, and the largest number in it is
   * the total. Numbers that are part of the query are ignored.
   */
  resultCount: string;
  /** Filter (refinement) panels. A panel supplies the label of the filters in it. */
  refinement: string;
  /** Filter label, inside a panel. Its first text is used. */
  refinementLabel: string;
  /**
   * Filter values, inside a panel. Each must link (`data-href`, `href`, `data-url`
   * or `value`) to the page with the value applied, or removed when it is selected.
   * The link tells which attribute and value it stands for.
   */
  refinementValue: string;
  /**
   * Hit count, inside a filter value. When not set, a trailing number in
   * parentheses in the value's label, such as `Shirts (12)`, is read as the count.
   */
  refinementValueCount?: string;
  /** Sorting options. */
  sortingOption: string;
  /** Text that only screen readers read. Left out of product names and labels. */
  hiddenText: string;
}

/** Selectors for the search page of the Storefront Reference Architecture (SFRA) base cartridge. */
export const SFRA_PAGE_PROFILE: Readonly<StorefrontPageProfile> = Object.freeze({
  productTile: '.product-grid .product[data-pid]',
  productIdAttribute: 'data-pid',
  productName: '.pdp-link a',
  productPrice: '.price .sales .value',
  resultCount: '.search-result-count, .result-count',
  refinement: '.refinement',
  refinementLabel: '.card-header',
  refinementValue: '[data-href], a[href]',
  sortingOption: 'select[name=sort-order] option',
  hiddenText: '.sr-only',
});

const PROFILE_KEYS: ReadonlyArray<keyof StorefrontPageProfile> = [
  'productTile',
  'productIdAttribute',
  'productName',
  'productPrice',
  'resultCount',
  'refinement',
  'refinementLabel',
  'refinementValue',
  'refinementValueCount',
  'sortingOption',
  'hiddenText',
];

const ATTRIBUTE_NAME = /^[^\s"'<>/=]+$/;

/**
 * Merges page profile overrides with {@link SFRA_PAGE_PROFILE} and checks every selector.
 *
 * @param overrides - Selectors to replace, for example from a profile file
 * @throws Error for unknown keys, empty values and unsupported selector syntax
 */
export function resolvePageProfile(overrides: Partial<StorefrontPageProfile> = {}): StorefrontPageProfile {
  if (overrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('The page profile must be an object that maps profile keys to selectors');
  }
  const unknown = Object.keys(overrides).filter((key) => !(PROFILE_KEYS as readonly string[]).includes(key));
  if (unknown.length > 0) {
    throw new Error(`Unknown page profile key(s): ${unknown.join(', ')}. Known keys: ${PROFILE_KEYS.join(', ')}`);
  }

  const profile: StorefrontPageProfile = {...SFRA_PAGE_PROFILE, ...withoutUndefined(overrides)};
  for (const key of PROFILE_KEYS) {
    const value: unknown = profile[key];
    if (value === undefined) continue;
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Page profile key ${key} must be a non-empty string`);
    }
    if (key === 'productIdAttribute') {
      if (!ATTRIBUTE_NAME.test(value)) {
        throw new Error(`Page profile key productIdAttribute must be an attribute name, got "${value}"`);
      }
      continue;
    }
    try {
      parseSelector(value);
    } catch (error) {
      throw new Error(`Page profile key ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return {...profile, productIdAttribute: profile.productIdAttribute.toLowerCase()};
}

// ---------------------------------------------------------------------------
// Reading a search page
// ---------------------------------------------------------------------------

/** Options for {@link parseStorefrontSearchPage}. */
export interface ParseStorefrontSearchPageOptions {
  /** URL the page was served from. Resolves relative links and supplies the filters already applied. */
  pageUrl: string | URL;
  /** The query searched for. Numbers in it are not taken for the result count. */
  query?: string;
  /** Selector overrides. Defaults to {@link SFRA_PAGE_PROFILE}. */
  profile?: Partial<StorefrontPageProfile>;
}

/** What {@link parseStorefrontSearchPage} reads from a search page. */
export interface StorefrontSearchPage {
  /** Number of results the page states, if it states one. */
  total?: number;
  /** Product tiles, in page order. */
  hits: CapturedHit[];
  /** Filters, with the attribute and value each filter link applies. */
  refinements: CapturedRefinement[];
  /** IDs of the sorting options offered. */
  sortingOptions?: string[];
  /** ID of the sorting option marked as selected. */
  selectedSortingOption?: string;
  /** Parts of the page that could not be read, for tuning the page profile. */
  warnings: string[];
}

/** One filter value: a refinement attribute and one of its values. */
interface Selection {
  attributeId: string;
  value: string;
}

/** A filter link found in a panel, with the filters its target page would have applied. */
interface ValueLink {
  element: HtmlElement;
  panelLabel?: string;
  selections: Selection[];
}

/** A number, with digit group separators (`1,234`, `1.234`, `1 234`, `1'234`). */
const NUMBER = /\d[\d,.'\u00A0\u202F]*/g;

/**
 * A count in parentheses at the end of a label, as in `Shirts (12)` or `Shirts (1,024)`.
 * Label text has its whitespace collapsed, so a space is a digit group separator here.
 */
const TRAILING_COUNT = /\s*\(\s*(\d{1,3}(?:[,.' \u00A0\u202F]\d{3})+|\d+)\s*\)$/;

/** Attributes that may carry a filter value's link, in order of preference. */
const LINK_ATTRIBUTES = ['data-href', 'href', 'data-url', 'value'];

function selectionKey(selection: Selection): string {
  return `${selection.attributeId}\u0000${selection.value}`;
}

/** The digits of each number in the text, in order. */
function numberTokens(text: string): string[] {
  return [...text.matchAll(NUMBER)].map((match) => match[0].replaceAll(/\D/g, '')).filter(Boolean);
}

/**
 * The largest number in the text. Numbers listed in `ignore` are left out, each
 * once and starting from the end, because a page states its count before the query.
 */
function readCount(text: string, ignore: string[] = []): number | undefined {
  const tokens = numberTokens(text);
  const remaining = [...ignore];
  for (let index = tokens.length - 1; index >= 0 && remaining.length > 0; index--) {
    const position = remaining.indexOf(tokens[index]);
    if (position !== -1) {
      remaining.splice(position, 1);
      tokens.splice(index, 1);
    }
  }
  let largest: number | undefined;
  for (const digits of tokens) {
    const value = Number(digits);
    if (Number.isSafeInteger(value) && (largest === undefined || value > largest)) largest = value;
  }
  return largest;
}

/** Writes a range bound the way the API does: `20.00` becomes `20`. */
function formatBound(bound: null | string): string {
  if (bound === null) return '';
  const trimmed = bound.trim();
  return trimmed !== '' && Number.isFinite(Number(trimmed)) ? String(Number(trimmed)) : trimmed;
}

/**
 * The filters a storefront URL applies, in URL order: attribute refinements
 * (`prefnN` with `prefvN`, values separated by `|`, or `prefminN`/`prefmaxN`),
 * the category (`cgid`), the price range (`pmin`/`pmax`, as attribute `price`)
 * and the promotion (`pmid`).
 */
function selectionsOf(url: URL): Selection[] {
  const params = url.searchParams;
  const found: Selection[] = [];
  const add = (attributeId: string, value: string) => {
    if (attributeId && value) found.push({attributeId, value});
  };

  for (const [name, value] of params) {
    const refinement = /^prefn(\d+)$/.exec(name);
    if (refinement) {
      const index = refinement[1];
      const values = params.get(`prefv${index}`);
      const min = params.get(`prefmin${index}`);
      const max = params.get(`prefmax${index}`);
      if (values !== null) {
        for (const single of values.split('|')) add(value, single);
      } else if (min !== null || max !== null) {
        add(value, `(${formatBound(min)}..${formatBound(max)})`);
      }
    } else if (name === 'cgid' || name === 'pmid') {
      add(name, value);
    }
  }
  const pmin = params.get('pmin');
  const pmax = params.get('pmax');
  if (pmin !== null || pmax !== null) add('price', `(${formatBound(pmin)}..${formatBound(pmax)})`);

  const seen = new Set<string>();
  return found.filter((selection) => {
    const key = selectionKey(selection);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toUrl(href: string, base: URL): URL | undefined {
  try {
    return new URL(href, base);
  } catch {
    return undefined;
  }
}

/** Drops elements that sit inside another element of the list. */
function outermost(elements: HtmlElement[]): HtmlElement[] {
  const set = new Set(elements);
  return elements.filter((element) => {
    for (let ancestor = element.parent; ancestor; ancestor = ancestor.parent) {
      if (set.has(ancestor)) return false;
    }
    return true;
  });
}

/** The price in an element's `content` attribute, or `undefined` when it holds no number. */
function priceOf(element: HtmlElement | undefined): number | undefined {
  const content = element?.attributes.content?.trim();
  if (!content) return undefined;
  const price = Number(content);
  return Number.isFinite(price) ? price : undefined;
}

function readHits(
  root: HtmlElement,
  profile: StorefrontPageProfile,
  skipHidden: (element: HtmlElement) => boolean,
  warnings: string[],
): CapturedHit[] {
  const hits: CapturedHit[] = [];
  const seen = new Set<string>();
  let withoutId = 0;
  for (const tile of outermost(querySelectorAll(root, profile.productTile))) {
    const productId = tile.attributes[profile.productIdAttribute]?.trim();
    if (!productId) {
      withoutId++;
      continue;
    }
    if (seen.has(productId)) continue;
    seen.add(productId);
    const nameElement = querySelector(tile, profile.productName);
    const productName = nameElement ? textOf(nameElement, {skip: skipHidden}) : '';
    const price = priceOf(querySelector(tile, profile.productPrice));
    hits.push(withoutUndefined({productId, productName: productName || undefined, price}));
  }
  if (withoutId > 0) {
    warnings.push(`${withoutId} product tile(s) have no ${profile.productIdAttribute} attribute (productIdAttribute)`);
  }
  return hits;
}

/** Reads the result count: `found` tells whether any result count element was on the page. */
function readTotal(
  root: HtmlElement,
  profile: StorefrontPageProfile,
  query: string | undefined,
  skipHidden: (element: HtmlElement) => boolean,
): {found: boolean; total?: number} {
  const ignore = query ? numberTokens(query) : [];
  let found = false;
  for (const complex of parseSelector(profile.resultCount)) {
    for (const element of querySelectorAll(root, [complex])) {
      found = true;
      const total = readCount(textOf(element, {skip: skipHidden, raw: true}), ignore);
      if (total !== undefined) return {found, total};
    }
  }
  return {found};
}

function linkOf(element: HtmlElement): string | undefined {
  for (const name of LINK_ATTRIBUTES) {
    const value = element.attributes[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function readValueLabel(
  element: HtmlElement,
  value: string,
  skipLabel: (element: HtmlElement) => boolean,
  countSelector: string | undefined,
): CapturedRefinementValue {
  let label =
    textOf(element, {skip: skipLabel}) ||
    element.attributes.title?.trim() ||
    element.attributes['aria-label']?.trim() ||
    textOf(element);
  let hitCount: number | undefined;
  if (countSelector) {
    const countElement = querySelector(element, countSelector);
    if (countElement) hitCount = readCount(textOf(countElement, {raw: true}));
  } else if (label) {
    const match = TRAILING_COUNT.exec(label);
    if (match) {
      hitCount = readCount(match[1].replaceAll(/\D/g, ''));
      label = label.slice(0, match.index);
    }
  }
  return withoutUndefined({value, label: label || undefined, hitCount});
}

function readRefinements(
  root: HtmlElement,
  pageUrl: URL,
  profile: StorefrontPageProfile,
  skipHidden: (element: HtmlElement) => boolean,
  warnings: string[],
): CapturedRefinement[] {
  const panels = outermost(querySelectorAll(root, profile.refinement));
  const countSelector = profile.refinementValueCount;
  const countList = countSelector ? parseSelector(countSelector) : undefined;
  const skipLabel = (element: HtmlElement) =>
    skipHidden(element) || (countList !== undefined && matches(element, countList));

  const links: ValueLink[] = [];
  const panelsWithoutLinks: string[] = [];
  for (const panel of panels) {
    const labelElement = querySelector(panel, profile.refinementLabel);
    const panelLabel = labelElement ? firstTextOf(labelElement, {skip: skipHidden}) : undefined;
    let count = 0;
    for (const element of querySelectorAll(panel, profile.refinementValue)) {
      const href = linkOf(element);
      const url = href ? toUrl(href, pageUrl) : undefined;
      if (!url) continue;
      links.push({element, panelLabel, selections: selectionsOf(url)});
      count++;
    }
    if (count === 0) panelsWithoutLinks.push(`"${panelLabel ?? '(no label)'}"`);
  }

  // The filters in effect: those in the page URL, plus any that every link carries
  // although the URL does not show them (for example a default category). With
  // fewer than two distinct links, such a filter cannot be told from a value.
  const applied = new Map(selectionsOf(pageUrl).map((selection) => [selectionKey(selection), selection]));
  const distinct = new Map<string, Selection[]>();
  for (const link of links) {
    distinct.set(
      link.selections
        .map((selection) => selectionKey(selection))
        .sort()
        .join('\u0001'),
      link.selections,
    );
  }
  if (distinct.size >= 2) {
    const [first, ...rest] = [...distinct.values()].map(
      (selections) => new Map(selections.map((selection) => [selectionKey(selection), selection])),
    );
    for (const [key, selection] of first) {
      if (rest.every((set) => set.has(key))) applied.set(key, selection);
    }
  }

  // How many links carry each filter. Of the filters a link adds, the one fewest
  // links carry is its own value; the others are page state the URL does not show.
  const frequency = new Map<string, number>();
  for (const link of links) {
    for (const key of new Set(link.selections.map((selection) => selectionKey(selection)))) {
      frequency.set(key, (frequency.get(key) ?? 0) + 1);
    }
  }
  const rarest = (selections: Selection[]): Selection | undefined =>
    selections.reduce<Selection | undefined>(
      (best, selection) =>
        best === undefined || frequency.get(selectionKey(selection))! < frequency.get(selectionKey(best))!
          ? selection
          : best,
      undefined,
    );

  const byAttribute = new Map<string, CapturedRefinement>();
  const seen = new Set<string>();
  let unreadable = 0;
  for (const link of links) {
    const keys = new Set(link.selections.map((selection) => selectionKey(selection)));
    const added = link.selections.filter((selection) => !applied.has(selectionKey(selection)));
    const removed = [...applied].filter(([key]) => !keys.has(key)).map(([, selection]) => selection);
    // A link applies its value, or removes it when the value is already selected.
    const selection = rarest(added) ?? (removed.length === 1 ? removed[0] : undefined);
    if (!selection) {
      unreadable++;
      continue;
    }
    const key = selectionKey(selection);
    if (seen.has(key)) continue;
    seen.add(key);

    let refinement = byAttribute.get(selection.attributeId);
    if (!refinement) {
      refinement = withoutUndefined({attributeId: selection.attributeId, label: link.panelLabel, values: []});
      byAttribute.set(selection.attributeId, refinement);
    }
    refinement.values.push(readValueLabel(link.element, selection.value, skipLabel, countSelector));
  }

  if (panelsWithoutLinks.length > 0) {
    warnings.push(`No filter value links in panel(s) ${panelsWithoutLinks.join(', ')} (refinementValue)`);
  }
  if (unreadable > 0) {
    warnings.push(
      `${unreadable} filter link(s) neither apply nor remove a filter (prefn/prefv, cgid, pmin/pmax or pmid) (refinementValue)`,
    );
  }
  return [...byAttribute.values()];
}

function readSorting(
  root: HtmlElement,
  pageUrl: URL,
  profile: StorefrontPageProfile,
): Pick<StorefrontSearchPage, 'selectedSortingOption' | 'sortingOptions'> {
  const ids: string[] = [];
  let selected: string | undefined;
  for (const option of querySelectorAll(root, profile.sortingOption)) {
    const value = option.attributes.value?.trim();
    // SFRA puts the option's URL in `value`; the rule ID is then its `srule` parameter.
    const isUrl = value !== undefined && /[/?=]/.test(value);
    const rule = isUrl ? toUrl(value, pageUrl)?.searchParams.get('srule') : undefined;
    const id = option.attributes['data-id']?.trim() || rule || (isUrl ? undefined : value) || textOf(option);
    if (!id) continue;
    if (!ids.includes(id)) ids.push(id);
    if (selected === undefined && option.attributes.selected !== undefined) selected = id;
  }
  return withoutUndefined({sortingOptions: ids.length > 0 ? ids : undefined, selectedSortingOption: selected});
}

/**
 * Reads a storefront search results page: the product tiles in order, the
 * number of results, the filters and the sorting options.
 *
 * Product IDs come from the tile attribute (`data-pid` on SFRA), and prices from
 * the `content` attribute of the tile's price element. Each filter
 * value's attribute ID and value come from its link, by comparing the filters
 * the link applies with those of `pageUrl`. Custom attributes appear without
 * the `c_` prefix the Shopper Search API uses.
 *
 * @param html - The page HTML
 * @param options - Page URL, query and selector overrides
 */
export function parseStorefrontSearchPage(
  html: string,
  options: ParseStorefrontSearchPageOptions,
): StorefrontSearchPage {
  const profile = resolvePageProfile(options.profile);
  const pageUrl = new URL(options.pageUrl);
  const root = parseHtml(html);
  const hiddenList = parseSelector(profile.hiddenText);
  const skipHidden = (element: HtmlElement) => matches(element, hiddenList);
  const warnings: string[] = [];

  const hits = readHits(root, profile, skipHidden, warnings);
  const count = readTotal(root, profile, options.query, skipHidden);
  // A count element without a number and no tiles is how a page with no results reads.
  const total = count.total ?? (count.found && hits.length === 0 ? 0 : undefined);
  if (hits.length === 0 && !count.found) {
    warnings.push(
      'No product tiles and no result count found: the query has no results, or the page profile does not match the page (productTile, resultCount)',
    );
  } else if (hits.length > 0 && total === undefined) {
    warnings.push(`Found ${hits.length} product tile(s) but no result count (resultCount)`);
  } else if (hits.length === 0 && total !== undefined && total > 0) {
    warnings.push(`The page states ${total} result(s) but no product tiles were found (productTile)`);
  }

  const refinements = readRefinements(root, pageUrl, profile, skipHidden, warnings);
  if (hits.length > 0 && refinements.length === 0 && querySelectorAll(root, profile.refinement).length === 0) {
    warnings.push('No filter panels found (refinement)');
  }

  return withoutUndefined({total, hits, refinements, ...readSorting(root, pageUrl, profile), warnings});
}

// ---------------------------------------------------------------------------
// Requesting search pages
// ---------------------------------------------------------------------------

/** Options for {@link buildStorefrontSearchUrl}. */
export interface StorefrontSearchUrlOptions {
  /** Storefront host name, or an origin such as `https://www.example.com`. */
  host: string;
  /** Site ID, used in the default path. */
  siteId: string;
  query: string;
  /** Page size, sent as `sz`. Defaults to 25. */
  limit?: number;
  /** Locale segment of the default path. Defaults to `default`. */
  locale?: string;
  /**
   * Path of the search page, starting with `/`. May carry query parameters.
   * Defaults to `/on/demandware.store/Sites-{siteId}-Site/{locale}/Search-Show`.
   */
  path?: string;
  /** Extra query parameters, such as filters. `q` and `sz` are set by the capture. */
  params?: Record<string, string>;
}

/**
 * Path of a site's search page in the `demandware.store` URL form, which works
 * on every storefront whatever its search-friendly URL settings.
 */
export function storefrontSearchPath(siteId: string, locale: string = DEFAULT_STOREFRONT_LOCALE): string {
  return `/on/demandware.store/Sites-${encodeURIComponent(siteId)}-Site/${encodeURIComponent(locale.replaceAll('-', '_'))}/Search-Show`;
}

function toOrigin(host: string): string {
  const trimmed = host.trim();
  if (!trimmed) throw new Error('A storefront host is required');
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error('The storefront host is not a valid host name or origin');
  }
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error(
      `Pass only the storefront host (${url.host}), without a path, query or credentials; set the page path with path`,
    );
  }
  return url.origin;
}

function checkPath(path: string): void {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`The search page path must start with a single "/", got "${path}"`);
  }
}

function checkParams(params: Record<string, string> | undefined, reserved: string[]): void {
  for (const [name, value] of Object.entries(params ?? {})) {
    if (reserved.includes(name)) {
      throw new Error(`The ${name} parameter is set by the capture and cannot be passed as a parameter`);
    }
    if (typeof value !== 'string') {
      throw new TypeError(`The value of parameter ${name} must be a string`);
    }
  }
}

/**
 * Builds the URL of a storefront search page for one query.
 *
 * @example
 * ```typescript
 * buildStorefrontSearchUrl({host: 'www.example.com', siteId: 'RefArch', query: 'shirt'}).href;
 * // https://www.example.com/on/demandware.store/Sites-RefArch-Site/default/Search-Show?q=shirt&sz=25
 * ```
 */
export function buildStorefrontSearchUrl(options: StorefrontSearchUrlOptions): URL {
  const origin = toOrigin(options.host);
  const path = options.path ?? storefrontSearchPath(options.siteId, options.locale);
  checkPath(path);
  checkParams(options.params, ['q', 'sz']);
  const url = new URL(path, origin);
  for (const [name, value] of Object.entries(options.params ?? {})) url.searchParams.set(name, value);
  url.searchParams.set('q', options.query);
  url.searchParams.set('sz', String(options.limit ?? DEFAULT_CAPTURE_LIMIT));
  return url;
}

/** Keeps the storefront's cookies between requests, so every query runs in one shopper session. */
class CookieJar {
  private readonly cookies = new Map<string, string>();

  header(): string | undefined {
    if (this.cookies.size === 0) return undefined;
    return Array.from(this.cookies, ([name, value]) => `${name}=${value}`).join('; ');
  }

  store(headers: Headers): void {
    for (const setCookie of headers.getSetCookie()) {
      const [pair, ...attributes] = setCookie.split(';');
      const separator = pair.indexOf('=');
      if (separator <= 0) continue;
      const name = pair.slice(0, separator).trim();
      if (!name) continue;
      if (CookieJar.isExpired(attributes)) this.cookies.delete(name);
      else this.cookies.set(name, pair.slice(separator + 1).trim());
    }
  }

  private static isExpired(attributes: string[]): boolean {
    let maxAge: number | undefined;
    let expires: number | undefined;
    for (const attribute of attributes) {
      const separator = attribute.indexOf('=');
      const name = (separator === -1 ? attribute : attribute.slice(0, separator)).trim().toLowerCase();
      const value = separator === -1 ? '' : attribute.slice(separator + 1).trim();
      if (name === 'max-age' && /^-?\d+$/.test(value)) maxAge = Number(value);
      if (name === 'expires') {
        const time = Date.parse(value);
        if (!Number.isNaN(time)) expires = time;
      }
    }
    // Max-Age wins over Expires (RFC 6265, section 5.3).
    if (maxAge !== undefined) return maxAge <= 0;
    return expires !== undefined && expires <= Date.now();
  }
}

interface FetchContext {
  /** Origin of the storefront. Credentials and cookies are sent only there. */
  origin: string;
  authorization?: string;
  jar: CookieJar;
  timeoutMs: number;
}

interface FetchedPage {
  /** URL of the page finally served. */
  url: URL;
  status: number;
  statusText: string;
  html: string;
  /** True when the response asked for credentials (`WWW-Authenticate`). */
  authenticate: boolean;
}

/** Fetches a page, following redirects itself so credentials never leave the storefront's origin. */
async function fetchPage(start: URL, context: FetchContext): Promise<FetchedPage> {
  const signal = AbortSignal.timeout(context.timeoutMs);
  let url = start;
  for (let redirects = 0; ; redirects++) {
    const sameOrigin = url.origin === context.origin;
    const headers: Record<string, string> = {
      'User-Agent': getUserAgent(),
      Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    };
    if (sameOrigin && context.authorization) headers.Authorization = context.authorization;
    const cookie = sameOrigin ? context.jar.header() : undefined;
    if (cookie) headers.Cookie = cookie;

    let response: Response;
    try {
      response = await getApiFetch(undefined)(url, {headers, redirect: 'manual', signal});
    } catch (error) {
      throw wrapNetworkError(error, {operation: 'Storefront request', host: url.host});
    }
    if (sameOrigin) context.jar.store(response.headers);

    const location = response.headers.get('location');
    if (REDIRECT_STATUSES.has(response.status) && location) {
      await response.body?.cancel();
      const next = toUrl(location, url);
      if (!next) throw new Error(`The storefront redirected to an invalid location: ${location}`);
      if (redirects >= MAX_REDIRECTS) {
        throw new Error(`Stopped after ${MAX_REDIRECTS} redirects; the next one was to ${next.href}`);
      }
      url = next;
      continue;
    }
    return {
      url,
      status: response.status,
      statusText: response.statusText,

      html: await response.text(),
      authenticate: response.headers.has('www-authenticate'),
    };
  }
}

function describeHttpError(page: FetchedPage, origin: string, sentPassword: boolean): string {
  const status = `HTTP ${page.status}${page.statusText ? ` ${page.statusText}` : ''}`;
  if (page.status !== 401 || !page.authenticate) return status;
  if (page.url.origin !== origin) {
    return `${status}: the storefront redirected to ${page.url.host}, which the storefront password is not sent to`;
  }
  return sentPassword
    ? `${status}: the storefront password was not accepted`
    : `${status}: the storefront is password protected; set the storefront password`;
}

function pageSizeWarnings(page: StorefrontSearchPage, limit: number): string[] {
  const shown = page.hits.length;
  if (shown > limit) {
    return [`The page shows ${shown} products, more than the ${limit} requested with sz`];
  }
  const expected = page.total === undefined ? undefined : Math.min(limit, page.total);
  if (expected !== undefined && shown > 0 && shown < expected) {
    return [`The page shows ${shown} of ${page.total} products although ${expected} were requested with sz`];
  }
  return [];
}

/** A page fetched by {@link captureStorefrontSearch}, passed to `onPage`. */
export interface StorefrontPageResponse {
  query: string;
  /** Position of the query in the capture, from 0. */
  index: number;
  /** URL of the page finally served. */
  url: string;
  status: number;
  html: string;
}

/** Options for {@link captureStorefrontSearch}. */
export interface CaptureStorefrontSearchOptions {
  /** Storefront host name, or an origin such as `https://www.example.com`. */
  host: string;
  /** Site ID. */
  siteId: string;
  /** Queries to run, in order. Blank and repeated queries are skipped. */
  queries: string[];
  /** Page size to request with `sz`, 1 to 200. Defaults to 25. */
  limit?: number;
  /** Locale segment of the default path. Defaults to `default`. */
  locale?: string;
  /** Path of the search page. Defaults to the site's `Search-Show` pipeline URL. */
  path?: string;
  /** Extra query parameters sent with every request, such as filters. */
  params?: Record<string, string>;
  /**
   * Adds a parameter that is unique to this capture, so the page cache cannot
   * serve pages rendered before the capture (for example before a search change).
   */
  bypassPageCache?: boolean;
  /** User name for storefront password protection. Defaults to `storefront`. */
  username?: string;
  /** Storefront password, when the storefront is password protected. */
  password?: string;
  /** Pause between requests in milliseconds. Defaults to 0. */
  delayMs?: number;
  /** Time allowed for each page in milliseconds. Defaults to 60 seconds. */
  timeoutMs?: number;
  /** Selector overrides for customized templates. Defaults to {@link SFRA_PAGE_PROFILE}. */
  profile?: Partial<StorefrontPageProfile>;
  /** Label stored in the capture. Defaults to `storefront`. */
  label?: string;
  /** Called after each query completes. */
  onResult?: (entry: SearchCaptureEntry, index: number, count: number) => void;
  /** Called with each page fetched, before it is read; for example to save the HTML. */
  onPage?: (page: StorefrontPageResponse) => Promise<void> | void;
}

function checkMilliseconds(name: string, value: number, allowZero: boolean): void {
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new Error(`${name} must be a ${allowZero ? 'non-negative' : 'positive'} number of milliseconds`);
  }
}

/**
 * Fetches the storefront search page for each query and reads the ranked
 * product tiles, the number of results, the filters and the sorting options,
 * as a capture that {@link diffSearchCaptures} compares with another storefront
 * capture or a Shopper Search capture.
 *
 * This is a plain HTTP GET of the server-rendered page: no browser and no
 * scripts. Results that a page loads with scripts after it renders are not seen.
 * Redirects are followed, the storefront's cookies are kept between requests,
 * and the storefront password and cookies are only sent to the storefront's own
 * origin. A failed request is recorded with its status and error instead of
 * stopping the capture.
 *
 * @param options - Storefront, queries and request settings
 * @returns The capture, ready to save as JSON
 *
 * @example
 * ```typescript
 * const capture = await captureStorefrontSearch({
 *   host: 'www.example.com',
 *   siteId: 'RefArch',
 *   queries: ['shirt', 'red dress'],
 *   password: process.env.SFCC_STOREFRONT_PASSWORD,
 * });
 * ```
 */
export async function captureStorefrontSearch(options: CaptureStorefrontSearchOptions): Promise<SearchCapture> {
  const logger = getLogger();
  const limit = options.limit ?? DEFAULT_CAPTURE_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CAPTURE_LIMIT) {
    throw new Error(`limit must be an integer from 1 to ${MAX_CAPTURE_LIMIT}`);
  }
  const queries = normalizeQueries(options.queries);
  if (queries.length === 0) {
    throw new Error('At least one query is required');
  }
  if (!options.siteId?.trim()) {
    throw new Error('A site ID is required');
  }
  const delayMs = options.delayMs ?? 0;
  const timeoutMs = options.timeoutMs ?? DEFAULT_STOREFRONT_TIMEOUT_MS;
  checkMilliseconds('delayMs', delayMs, true);
  checkMilliseconds('timeoutMs', timeoutMs, false);

  const profile = resolvePageProfile(options.profile);
  const origin = toOrigin(options.host);
  const locale = options.path ? undefined : (options.locale ?? DEFAULT_STOREFRONT_LOCALE).replaceAll('-', '_');
  const path = options.path ?? storefrontSearchPath(options.siteId, locale);
  checkPath(path);
  checkParams(options.params, options.bypassPageCache ? ['q', 'sz', CACHE_BUSTER_PARAM] : ['q', 'sz']);
  const params = options.params && Object.keys(options.params).length > 0 ? {...options.params} : undefined;

  const capturedAt = new Date();
  const cacheBuster = options.bypassPageCache ? capturedAt.getTime().toString(36) : undefined;
  const username = options.username ?? DEFAULT_STOREFRONT_USER;
  const context: FetchContext = {
    origin,
    jar: new CookieJar(),
    timeoutMs,
    ...(options.password && {
      authorization: `Basic ${Buffer.from(`${username}:${options.password}`, 'utf8').toString('base64')}`,
    }),
  };

  const request: StorefrontSearchCaptureRequest = {
    source: 'storefront',
    host: new URL(origin).host,
    siteId: options.siteId,
    ...(locale && {locale}),
    path,
    limit,
    ...(params && {params}),
    ...(options.bypassPageCache && {bypassPageCache: true}),
  };
  const capture: SearchCapture = {
    schemaVersion: SEARCH_CAPTURE_SCHEMA_VERSION,
    label: options.label ?? 'storefront',
    capturedAt: capturedAt.toISOString(),
    request,
    results: [],
  };

  for (const [index, query] of queries.entries()) {
    if (index > 0 && delayMs > 0) {
      await sleep(delayMs);
    }
    const url = buildStorefrontSearchUrl({host: origin, siteId: options.siteId, query, limit, path, params});
    if (cacheBuster) url.searchParams.set(CACHE_BUSTER_PARAM, cacheBuster);

    const started = performance.now();
    let page: FetchedPage | undefined;
    let failure: unknown;
    try {
      page = await fetchPage(url, context);
    } catch (error) {
      failure = error;
    }
    const latencyMs = Math.round(performance.now() - started);

    let entry: SearchCaptureEntry;
    if (page) {
      await options.onPage?.({query, index, url: page.url.href, status: page.status, html: page.html});
      const redirectedTo = page.url.href === url.href ? undefined : page.url.href;
      if (page.status < 200 || page.status >= 300) {
        entry = withoutUndefined({
          query,
          status: page.status,
          error: describeHttpError(page, origin, context.authorization !== undefined),
          latencyMs,
          hits: [],
          refinements: [],
          url: url.href,
          redirectedTo,
        });
      } else {
        const parsed = parseStorefrontSearchPage(page.html, {pageUrl: page.url, query, profile});
        const warnings = [...parsed.warnings, ...pageSizeWarnings(parsed, limit)];
        entry = withoutUndefined({
          query,
          status: page.status,
          latencyMs,
          total: parsed.total,
          hits: parsed.hits,
          refinements: parsed.refinements,
          sortingOptions: parsed.sortingOptions,
          selectedSortingOption: parsed.selectedSortingOption,
          url: url.href,
          redirectedTo,
          ...(warnings.length > 0 && {parseWarnings: warnings}),
        });
      }
    } else {
      entry = {
        query,
        status: 0,
        error: failure instanceof Error ? failure.message : String(failure),
        latencyMs,
        hits: [],
        refinements: [],
        url: url.href,
      };
    }

    logger.debug(
      {query, status: entry.status, total: entry.total, hits: entry.hits.length, redirectedTo: entry.redirectedTo},
      `[SEARCH] Captured storefront page for "${query}"`,
    );
    capture.results.push(entry);
    options.onResult?.(entry, index, queries.length);
  }

  return capture;
}
