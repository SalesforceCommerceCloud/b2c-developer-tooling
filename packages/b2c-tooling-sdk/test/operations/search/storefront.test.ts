/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {getUserAgent} from '@salesforce/b2c-tooling-sdk/clients';
import {
  buildStorefrontSearchUrl,
  captureStorefrontSearch,
  parseStorefrontSearchPage,
  resolvePageProfile,
  SEARCH_CAPTURE_SCHEMA_VERSION,
  SFRA_PAGE_PROFILE,
  type CaptureStorefrontSearchOptions,
  type StorefrontPageResponse,
  type StorefrontSearchUrlOptions,
} from '@salesforce/b2c-tooling-sdk/operations/search';

const ORIGIN = 'https://www.example.com';
const SEARCH_PATH = '/on/demandware.store/Sites-RefArch-Site/default/Search-Show';
const AJAX_PATH = '/on/demandware.store/Sites-RefArch-Site/default/Search-ShowAjax';
const GRID_PATH = '/on/demandware.store/Sites-RefArch-Site/default/Search-UpdateGrid';
const PAGE_URL = `${ORIGIN}${SEARCH_PATH}?q=shirt&sz=25`;

/** An SFRA filter value: a button whose data-href applies the value. */
function filterValue(href: string, visible: string, assistive: string): string {
  return `<li><button class="btn btn-block" data-href="${href}"><i class="fa fa-square-o"></i><span aria-hidden="true">${visible}</span><span class="sr-only selected-assistive-text">${assistive}</span></button></li>`;
}

/** An SFRA filter panel. */
function panel(name: string, label: string, values: string): string {
  return `<div class="card collapsible-sm refinement refinement-${name}">
    <div class="card-header col-sm-12">
      <button class="title btn text-left btn-block" aria-controls="refinement-${name}"><span>${label}</span></button>
      <h2 aria-label="${label}" class="d-none d-sm-block">${label}</h2>
    </div>
    <div class="card-body content value" id="refinement-${name}"><ul class="values content">${values}</ul></div>
  </div>`;
}

/** An SFRA search page with the given result count text, refinement panels and product grid content. */
function searchPage({
  count,
  panels = '',
  grid = '',
  head = '',
}: {
  count: string;
  panels?: string;
  grid?: string;
  head?: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><title>Search</title>${head}</head>
<body>
<div class="container search-results">
  <div class="row"><div class="result-count col-12">${count}</div></div>
  <div class="row">
    <div class="refinement-bar col-md-3">
      <div class="secondary-bar"><button class="reset" data-href="${AJAX_PATH}?q=shirt">Reset</button></div>
      <div class="refinements">${panels}</div>
    </div>
    <div class="col-sm-12 col-md-9">
      <div class="row product-grid" itemtype="http://schema.org/SomeProducts" itemid="#product">${grid}</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

const SEARCH_PAGE = searchPage({
  head: `<script>window.recommendations = '<div class="product-grid"><div class="product" data-pid="from-script"></div></div>';</script>`,
  count: '<span class="search-result-count">1,234 Results for</span> <span class="search-keywords">"shirt"</span>',
  panels: [
    panel(
      'category',
      'Category',
      filterValue(`${AJAX_PATH}?cgid=mens&amp;q=shirt`, 'Mens', 'Refine by Category: Mens') +
        filterValue(`${AJAX_PATH}?cgid=womens&amp;q=shirt`, 'Womens', 'Refine by Category: Womens') +
        `<li><a href="${SEARCH_PATH}?q=shirt">View all</a></li>`,
    ),
    panel(
      'color',
      'Color',
      `<li class="color-attribute" title="Refine by Color: Black"><button data-href="${AJAX_PATH}?prefn1=refinementColor&amp;prefv1=Black&amp;q=shirt" title="Black"><span class="swatch-circle-black swatch-circle color-value swatch-mark"></span><span class="sr-only selected-assistive-text">Refine by Color: Black</span></button></li>
       <li class="color-attribute"><button data-href="${AJAX_PATH}?prefn1=refinementColor&amp;prefv1=Blue&amp;q=shirt"><span class="swatch-circle-blue swatch-circle color-value swatch-mark"></span><span class="sr-only selected-assistive-text">Refine by Color: Blue</span></button></li>`,
    ),
    panel(
      'size',
      'Size',
      filterValue(`${AJAX_PATH}?prefn1=size&amp;prefv1=M&amp;q=shirt`, 'M (12)', 'Refine by Size: M') +
        filterValue(`${AJAX_PATH}?prefn1=size&amp;prefv1=L&amp;q=shirt`, 'L (1,024)', 'Refine by Size: L'),
    ),
    panel(
      'price',
      'Price',
      filterValue(
        `${AJAX_PATH}?pmin=20.00&amp;pmax=49.99&amp;q=shirt`,
        '$20 - $49.99',
        'Refine by Price: $20 - $49.99',
      ) +
        filterValue(`${AJAX_PATH}?pmin=50.00&amp;pmax=100.00&amp;q=shirt`, '$50 - $100', 'Refine by Price: $50 - $100'),
    ),
    `<div class="card refinement refinement-new-arrival"><div class="card-header"><h2>New Arrival</h2></div><div class="card-body"></div></div>`,
  ].join('\n'),
  grid: `
    <div class="col-12 grid-header"><div class="sort-order">
      <select name="sort-order" class="custom-select form-control" aria-label="Sort By">
        <option class="best-matches" value="${GRID_PATH}?q=shirt&amp;srule=best-matches&amp;start=0&amp;sz=25" data-id="best-matches" selected>Best Matches</option>
        <option class="price-low-to-high" value="${GRID_PATH}?q=shirt&amp;srule=price-low-to-high&amp;start=0&amp;sz=25" data-id="price-low-to-high">Price Low To High</option>
        <option value="${GRID_PATH}?q=shirt&amp;srule=top-sellers&amp;start=0&amp;sz=25">Top Sellers</option>
      </select>
    </div></div>
    <div class="col-6 col-sm-4">
      <div class="product" data-pid="25604455M">
        <div class="product-tile">
          <div class="image-container"><a href="/s/RefArch/oxford-shirt/25604455M.html"><img class="tile-image" src="/images/oxford.jpg" alt="Oxford Shirt"></a></div>
          <div class="swatches"><div class="product" data-pid="25604455-BLK"></div></div>
          <div class="tile-body">
            <div class="pdp-link"><a class="link" href="/s/RefArch/oxford-shirt/25604455M.html">Oxford <b>Shirt</b><span class="sr-only">, on sale</span></a></div>
            <div class="price"><span class="sales"><span class="value" content="49.99">$49.99</span></span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-6 col-sm-4"><div class="product" data-pid=""><div class="product-tile"></div></div></div>
    <div class="col-6 col-sm-4"><div class="product" data-pid="25592770M"><div class="product-tile"><div class="pdp-link"><a class="link" href="/s/RefArch/linen-shirt/25592770M.html">Linen Shirt</a></div></div></div></div>
    <div class="col-6 col-sm-4"><div class="product" data-pid="25604455M"><div class="product-tile"></div></div></div>
    <div class="col-6 col-sm-4"><div class="product" data-pid="sku-3"></div></div>
    <div class="col-12 grid-footer" data-page-size="25" data-page-number="0">
      <div class="show-more"><button class="btn more" data-url="${GRID_PATH}?q=shirt&amp;start=25&amp;sz=25">More Results</button></div>
    </div>`,
});

const SEARCH_PAGE_WARNINGS = [
  '1 product tile(s) have no data-pid attribute (productIdAttribute)',
  'No filter value links in panel(s) "New Arrival" (refinementValue)',
  '1 filter link(s) neither apply nor remove a filter (prefn/prefv, cgid, pmin/pmax or pmid) (refinementValue)',
];

function noResultsPage(query: string): string {
  return searchPage({
    count: `<p>We're sorry, no products were found for your search: <span class="search-keywords">"${query}"</span></p>`,
  });
}

const ONE_TILE = '<div class="col-6"><div class="product" data-pid="p1"></div></div>';

interface SentRequest {
  url: string;
  headers: Headers;
  redirect?: RequestInit['redirect'];
}

type Respond = (url: URL, index: number, init: RequestInit) => Promise<Response> | Response;

/**
 * Replaces fetch. MSW is not used here because it keeps its own cookie jar and
 * replays Set-Cookie values on later requests, which would hide what the
 * capture itself sends.
 */
function stubFetch(respond: Respond): SentRequest[] {
  const sent: SentRequest[] = [];
  sinon.stub(globalThis, 'fetch').callsFake(async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    sent.push({url: url.href, headers: new Headers(init.headers), redirect: init.redirect});
    return respond(url, sent.length - 1, init);
  });
  return sent;
}

function response(
  body: null | string,
  {
    status = 200,
    statusText,
    headers = [],
  }: {status?: number; statusText?: string; headers?: Array<[string, string]>} = {},
): Response {
  return new Response(body, {status, statusText, headers: new Headers(headers)});
}

function basic(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function captureError(options: CaptureStorefrontSearchOptions): Promise<Error | undefined> {
  try {
    await captureStorefrontSearch(options);
  } catch (error) {
    return error as Error;
  }
  return undefined;
}

describe('operations/search storefront', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('parseStorefrontSearchPage', () => {
    it('reads the tiles, result count, filters and sorting options of an SFRA search page', () => {
      expect(parseStorefrontSearchPage(SEARCH_PAGE, {pageUrl: PAGE_URL, query: 'shirt'})).to.deep.equal({
        total: 1234,
        hits: [
          {productId: '25604455M', productName: 'Oxford Shirt', price: 49.99},
          {productId: '25592770M', productName: 'Linen Shirt'},
          {productId: 'sku-3'},
        ],
        refinements: [
          {
            attributeId: 'cgid',
            label: 'Category',
            values: [
              {value: 'mens', label: 'Mens'},
              {value: 'womens', label: 'Womens'},
            ],
          },
          {
            attributeId: 'refinementColor',
            label: 'Color',
            values: [
              {value: 'Black', label: 'Black'},
              {value: 'Blue', label: 'Refine by Color: Blue'},
            ],
          },
          {
            attributeId: 'size',
            label: 'Size',
            values: [
              {value: 'M', label: 'M', hitCount: 12},
              {value: 'L', label: 'L', hitCount: 1024},
            ],
          },
          {
            attributeId: 'price',
            label: 'Price',
            values: [
              {value: '(20..49.99)', label: '$20 - $49.99'},
              {value: '(50..100)', label: '$50 - $100'},
            ],
          },
        ],
        sortingOptions: ['best-matches', 'price-low-to-high', 'top-sellers'],
        selectedSortingOption: 'best-matches',
        warnings: SEARCH_PAGE_WARNINGS,
      });
    });

    it('takes the largest number of the result count, without the numbers of the query', () => {
      const totalOf = (query: string, count: string) =>
        parseStorefrontSearchPage(searchPage({count, grid: ONE_TILE}), {pageUrl: PAGE_URL, query}).total;

      expect(totalOf('2 pack', '<span class="search-result-count">12 Results for 2 pack</span>')).to.equal(12);
      expect(totalOf('100', '<span class="search-result-count">100 Results for 100</span>')).to.equal(100);
      expect(totalOf('100', '<span class="search-result-count">7 Results for "100"</span>')).to.equal(7);
      expect(
        totalOf('1,000 piece puzzle', '<span class="search-result-count">57 Results for 1,000 piece puzzle</span>'),
      ).to.equal(57);
      expect(totalOf('shirt', '<span class="search-result-count">Results 1 - 25 of 312</span>')).to.equal(312);
      expect(totalOf('shirt', '<span class="search-result-count">1.234 Ergebnisse</span>')).to.equal(1234);
      expect(totalOf('shirt', '<span class="search-result-count">1\u00A0234 resultats</span>')).to.equal(1234);
      // The first selector of the list wins; a count element without a number defers to the next one.
      expect(totalOf('shirt', '<span class="search-result-count">Results for</span> 5 products')).to.equal(5);
    });

    it('reads a count in parentheses at the end of a filter label', () => {
      const values = ['M (12)', 'L ( 1,024 )', 'XL (1\u00A0024)', 'S (1.5)', 'Pack (2)x']
        .map((label, index) =>
          filterValue(`${AJAX_PATH}?prefn1=size&amp;prefv1=v${index}&amp;q=shirt`, label, `Refine by Size: v${index}`),
        )
        .join('');
      const html = searchPage({
        count: '<span class="search-result-count">5 Results for</span>',
        panels: panel('size', 'Size', values),
        grid: ONE_TILE,
      });

      expect(parseStorefrontSearchPage(html, {pageUrl: PAGE_URL, query: 'shirt'}).refinements).to.deep.equal([
        {
          attributeId: 'size',
          label: 'Size',
          values: [
            {value: 'v0', label: 'M', hitCount: 12},
            {value: 'v1', label: 'L', hitCount: 1024},
            {value: 'v2', label: 'XL', hitCount: 1024},
            {value: 'v3', label: 'S (1.5)'},
            {value: 'v4', label: 'Pack (2)x'},
          ],
        },
      ]);
    });

    it('reads a page without results as a total of 0', () => {
      const pageUrl = `${ORIGIN}${SEARCH_PATH}?q=tumbler+100`;

      expect(parseStorefrontSearchPage(noResultsPage('tumbler 100'), {pageUrl, query: 'tumbler 100'})).to.deep.equal({
        total: 0,
        hits: [],
        refinements: [],
        warnings: [],
      });
    });

    it('warns about the parts of the page it cannot find', () => {
      expect(
        parseStorefrontSearchPage('<html><body><div id="app"></div></body></html>', {pageUrl: PAGE_URL}),
      ).to.deep.equal({
        hits: [],
        refinements: [],
        warnings: [
          'No product tiles and no result count found: the query has no results, or the page profile does not match the page (productTile, resultCount)',
        ],
      });
      expect(
        parseStorefrontSearchPage(`<div class="product-grid">${ONE_TILE}</div>`, {pageUrl: PAGE_URL}).warnings,
      ).to.deep.equal([
        'Found 1 product tile(s) but no result count (resultCount)',
        'No filter panels found (refinement)',
      ]);
      expect(
        parseStorefrontSearchPage(
          '<div class="result-count"><span class="search-result-count">12 Results</span></div>',
          {
            pageUrl: PAGE_URL,
          },
        ),
      ).to.deep.equal({
        total: 12,
        hits: [],
        refinements: [],
        warnings: ['The page states 12 result(s) but no product tiles were found (productTile)'],
      });
    });

    it('reads selected values from the links that remove them', () => {
      const html = searchPage({
        count: '<span class="search-result-count">8 Results for</span>',
        grid: ONE_TILE,
        panels:
          panel(
            'size',
            'Size',
            filterValue(`${AJAX_PATH}?q=shirt`, 'M', 'Selected Refine by Size: M') +
              filterValue(`${AJAX_PATH}?prefn1=size&amp;prefv1=M%7CL&amp;q=shirt`, 'L', 'Refine by Size: L'),
          ) +
          panel(
            'color',
            'Color',
            filterValue(
              `${AJAX_PATH}?prefn1=size&amp;prefv1=M&amp;prefn2=refinementColor&amp;prefv2=Black&amp;q=shirt`,
              'Black',
              'Refine by Color: Black',
            ),
          ),
      });
      const page = parseStorefrontSearchPage(html, {pageUrl: `${ORIGIN}${SEARCH_PATH}?q=shirt&prefn1=size&prefv1=M`});

      expect(page.refinements).to.deep.equal([
        {
          attributeId: 'size',
          label: 'Size',
          values: [
            {value: 'M', label: 'M'},
            {value: 'L', label: 'L'},
          ],
        },
        {attributeId: 'refinementColor', label: 'Color', values: [{value: 'Black', label: 'Black'}]},
      ]);
      expect(page.warnings).to.deep.equal([]);
    });

    it('reads filters whose links carry a category that the page URL does not show', () => {
      const colorAndSize =
        panel(
          'color',
          'Color',
          filterValue(
            `${AJAX_PATH}?cgid=mens-shirts&amp;prefn1=refinementColor&amp;prefv1=Black&amp;q=shirt`,
            'Black',
            '',
          ) +
            filterValue(
              `${AJAX_PATH}?cgid=mens-shirts&amp;prefn1=refinementColor&amp;prefv1=Blue&amp;q=shirt`,
              'Blue',
              '',
            ),
        ) +
        panel(
          'size',
          'Size',
          filterValue(`${AJAX_PATH}?cgid=mens-shirts&amp;prefn1=size&amp;prefv1=M&amp;q=shirt`, 'M', ''),
        );
      const subcategories = panel(
        'category',
        'Category',
        filterValue(`${AJAX_PATH}?cgid=mens-shirts-dress&amp;q=shirt`, 'Dress Shirts', '') +
          filterValue(`${AJAX_PATH}?cgid=mens-shirts-casual&amp;q=shirt`, 'Casual Shirts', ''),
      );
      // A search-friendly URL: the category is in the path, not in a parameter.
      const pageUrl = `${ORIGIN}/s/RefArch/mens/shirts/?q=shirt`;
      const count = '<span class="search-result-count">20 Results for</span>';
      const color = {
        attributeId: 'refinementColor',
        label: 'Color',
        values: [
          {value: 'Black', label: 'Black'},
          {value: 'Blue', label: 'Blue'},
        ],
      };
      const size = {attributeId: 'size', label: 'Size', values: [{value: 'M', label: 'M'}]};

      // Every link carries the category, so it is page state, not a value.
      expect(
        parseStorefrontSearchPage(searchPage({count, grid: ONE_TILE, panels: colorAndSize}), {pageUrl}).refinements,
      ).to.deep.equal([color, size]);

      // The subcategory links replace the category; the other links still carry it
      // next to their own value, which fewer links carry.
      expect(
        parseStorefrontSearchPage(searchPage({count, grid: ONE_TILE, panels: subcategories + colorAndSize}), {pageUrl})
          .refinements,
      ).to.deep.equal([
        {
          attributeId: 'cgid',
          label: 'Category',
          values: [
            {value: 'mens-shirts-dress', label: 'Dress Shirts'},
            {value: 'mens-shirts-casual', label: 'Casual Shirts'},
          ],
        },
        color,
        size,
      ]);
    });

    it('reads customized templates with a page profile', () => {
      const html = `<main>
        <h1 class="results-total">Showing 42 products for "2 pack"</h1>
        <ul class="grid">
          <li class="tile" data-Product-ID="A-1"><h3 class="tile-name">Acme Mug <span class="visually-hidden">(2 pack)</span></h3></li>
          <li class="tile" data-product-id="A-2"><h3 class="tile-name">Acme Cup</h3></li>
        </ul>
        <aside>
          <section class="filter-group">
            <h4 class="filter-title">Brand</h4>
            <ul>
              <li class="filter-value"><a href="/search?q=2+pack&amp;prefn1=brand&amp;prefv1=Acme">Acme <span class="count">(12)</span></a></li>
              <li class="filter-value"><a href="/search?q=2+pack&amp;prefn1=brand&amp;prefv1=Zed">Zed <span class="count">1\u00A0203 items</span></a></li>
            </ul>
          </section>
        </aside>
        <select name="sort-order"><option value="best-matches" selected>Best Matches</option><option value="newest">Newest</option></select>
      </main>`;
      const profile = {
        productTile: '.tile',
        productIdAttribute: 'data-Product-ID',
        productName: '.tile-name',
        resultCount: '.results-total',
        refinement: '.filter-group',
        refinementLabel: '.filter-title',
        refinementValue: '.filter-value a',
        refinementValueCount: '.count',
        hiddenText: '.visually-hidden',
      };

      expect(
        parseStorefrontSearchPage(html, {pageUrl: `${ORIGIN}/search?q=2+pack`, query: '2 pack', profile}),
      ).to.deep.equal({
        total: 42,
        hits: [
          {productId: 'A-1', productName: 'Acme Mug'},
          {productId: 'A-2', productName: 'Acme Cup'},
        ],
        refinements: [
          {
            attributeId: 'brand',
            label: 'Brand',
            values: [
              {value: 'Acme', label: 'Acme', hitCount: 12},
              {value: 'Zed', label: 'Zed', hitCount: 1203},
            ],
          },
        ],
        sortingOptions: ['best-matches', 'newest'],
        selectedSortingOption: 'best-matches',
        warnings: [],
      });
    });
  });

  describe('tile prices', () => {
    it('reads the sales price from the content attribute only, taking the lowest of a range', () => {
      const tile = (id: string, price: string) =>
        `<div class="product" data-pid="${id}"><div class="price">${price}</div></div>`;
      const value = (content: string) =>
        `<span class="sales"><span class="value"${content ? ` content="${content}"` : ''}>$${content}</span></span>`;
      const html = `<div class="search-result-count">4 Results</div><div class="product-grid">
        ${tile('range', `<div class="range">${value('10.00')} - ${value('25.00')}</div>`)}
        ${tile('sale', `<span class="strike-through list"><span class="value" content="30.00">$30.00</span></span>${value('19.99')}`)}
        ${tile('text', value(''))}
        ${tile('other', value('N/A'))}
      </div>`;

      const page = parseStorefrontSearchPage(html, {pageUrl: PAGE_URL, query: 'shirt'});

      expect(page.hits).to.deep.equal([
        {productId: 'range', price: 10},
        {productId: 'sale', price: 19.99},
        {productId: 'text'},
        {productId: 'other'},
      ]);
    });
  });

  describe('resolvePageProfile', () => {
    it('fills in the SFRA selectors and lowercases the product ID attribute', () => {
      expect(resolvePageProfile()).to.deep.equal(SFRA_PAGE_PROFILE);
      expect(
        resolvePageProfile({
          productTile: '.tile',
          productIdAttribute: 'data-Product-ID',
          refinementValueCount: undefined,
        }),
      ).to.deep.equal({...SFRA_PAGE_PROFILE, productTile: '.tile', productIdAttribute: 'data-product-id'});
    });

    it('rejects unknown keys, empty values and unsupported selectors', () => {
      expect(() => resolvePageProfile([] as never)).to.throw(
        'The page profile must be an object that maps profile keys to selectors',
      );
      expect(() => resolvePageProfile(null as never)).to.throw('The page profile must be an object');
      expect(() => resolvePageProfile({tiles: '.tile'} as never)).to.throw(
        'Unknown page profile key(s): tiles. Known keys: productTile, productIdAttribute,',
      );
      expect(() => resolvePageProfile({productName: '  '})).to.throw(
        'Page profile key productName must be a non-empty string',
      );
      expect(() => resolvePageProfile({refinementValueCount: 3 as never})).to.throw(
        'Page profile key refinementValueCount must be a non-empty string',
      );
      expect(() => resolvePageProfile({productIdAttribute: 'data pid'})).to.throw(
        'Page profile key productIdAttribute must be an attribute name, got "data pid"',
      );
      expect(() => resolvePageProfile({refinement: '.card:not(.hidden)'})).to.throw(
        'Page profile key refinement: Unsupported selector syntax',
      );
    });
  });

  describe('buildStorefrontSearchUrl', () => {
    it('builds the URL of the default search page of a site', () => {
      expect(buildStorefrontSearchUrl({host: 'www.example.com', siteId: 'RefArch', query: 'shirt'}).href).to.equal(
        PAGE_URL,
      );
      expect(
        buildStorefrontSearchUrl({
          host: 'http://localhost:8080/',
          siteId: 'Ref Arch',
          query: 'red dress',
          limit: 48,
          locale: 'en-GB',
        }).href,
      ).to.equal('http://localhost:8080/on/demandware.store/Sites-Ref%20Arch-Site/en_GB/Search-Show?q=red+dress&sz=48');
    });

    it('keeps the parameters of a custom path and sets the extra parameters before the query', () => {
      const url = buildStorefrontSearchUrl({
        host: 'www.example.com',
        siteId: 'RefArch',
        query: 'shirt',
        path: '/s/RefArch/search?lang=en_US',
        params: {srule: 'top-sellers', lang: 'fr_FR'},
      });

      expect(url.href).to.equal(`${ORIGIN}/s/RefArch/search?lang=fr_FR&srule=top-sellers&q=shirt&sz=25`);
    });

    it('rejects hosts, paths and parameters it cannot use', () => {
      const build = (options: Partial<StorefrontSearchUrlOptions>) => () =>
        buildStorefrontSearchUrl({host: 'www.example.com', siteId: 'RefArch', query: 'shirt', ...options});

      expect(build({host: ' '})).to.throw('A storefront host is required');
      expect(build({host: 'not a host'})).to.throw('The storefront host is not a valid host name or origin');
      expect(build({host: 'www.example.com/s/RefArch'})).to.throw(
        'Pass only the storefront host (www.example.com), without a path, query or credentials; set the page path with path',
      );
      expect(build({host: 'https://user:secret@www.example.com'})).to.throw(
        'Pass only the storefront host (www.example.com)',
      );
      expect(build({path: 'search'})).to.throw('The search page path must start with a single "/", got "search"');
      expect(build({path: '//other.example.com/search'})).to.throw('must start with a single "/"');
      expect(build({params: {q: 'dress'}})).to.throw(
        'The q parameter is set by the capture and cannot be passed as a parameter',
      );
      expect(build({params: {start: 0 as never}})).to.throw('The value of parameter start must be a string');
    });
  });

  describe('captureStorefrontSearch', () => {
    it('requests the search page of each query and reads it', async () => {
      const sent = stubFetch((url) =>
        response(url.searchParams.get('q') === 'shirt' ? SEARCH_PAGE : noResultsPage('zzzqqq')),
      );
      const progress: Array<[string, number, number]> = [];
      const pages: StorefrontPageResponse[] = [];

      const capture = await captureStorefrontSearch({
        host: 'www.example.com',
        siteId: 'RefArch',
        queries: ['shirt', ' zzzqqq ', 'shirt'],
        limit: 10,
        onResult: (entry, index, count) => progress.push([entry.query, index, count]),
        onPage(page) {
          pages.push(page);
        },
      });

      expect(sent.map((request) => request.url)).to.deep.equal([
        `${ORIGIN}${SEARCH_PATH}?q=shirt&sz=10`,
        `${ORIGIN}${SEARCH_PATH}?q=zzzqqq&sz=10`,
      ]);
      const [first] = sent;
      expect(first.redirect).to.equal('manual');
      expect(first.headers.get('user-agent')).to.equal(getUserAgent());
      expect(first.headers.get('accept')).to.match(/^text\/html,/);
      expect(first.headers.has('authorization')).to.equal(false);
      expect(first.headers.has('cookie')).to.equal(false);

      expect(capture.schemaVersion).to.equal(SEARCH_CAPTURE_SCHEMA_VERSION);
      expect(capture.label).to.equal('storefront');
      expect(Number.isNaN(Date.parse(capture.capturedAt))).to.equal(false);
      expect(capture.request).to.deep.equal({
        source: 'storefront',
        host: 'www.example.com',
        siteId: 'RefArch',
        locale: 'default',
        path: SEARCH_PATH,
        limit: 10,
      });

      const [shirt, none] = capture.results;
      expect(shirt).to.include({
        query: 'shirt',
        status: 200,
        total: 1234,
        url: sent[0].url,
        selectedSortingOption: 'best-matches',
      });
      expect(shirt).to.not.have.property('redirectedTo');
      expect(shirt.latencyMs).to.be.a('number');
      expect(shirt.hits.map((hit) => hit.productId)).to.deep.equal(['25604455M', '25592770M', 'sku-3']);
      expect(shirt.refinements.map((refinement) => refinement.attributeId)).to.deep.equal([
        'cgid',
        'refinementColor',
        'size',
        'price',
      ]);
      expect(shirt.sortingOptions).to.deep.equal(['best-matches', 'price-low-to-high', 'top-sellers']);
      expect(shirt.parseWarnings).to.deep.equal([
        ...SEARCH_PAGE_WARNINGS,
        'The page shows 3 of 1234 products although 10 were requested with sz',
      ]);
      expect(none).to.deep.equal({
        query: 'zzzqqq',
        status: 200,
        latencyMs: none.latencyMs,
        total: 0,
        hits: [],
        refinements: [],
        url: sent[1].url,
      });

      expect(progress).to.deep.equal([
        ['shirt', 0, 2],
        ['zzzqqq', 1, 2],
      ]);
      expect(pages.map(({query, index, url, status}) => ({query, index, url, status}))).to.deep.equal([
        {query: 'shirt', index: 0, url: sent[0].url, status: 200},
        {query: 'zzzqqq', index: 1, url: sent[1].url, status: 200},
      ]);
      expect(pages[0].html).to.equal(SEARCH_PAGE);
    });

    it('sends the storefront password and keeps the session cookies between queries', async () => {
      const setCookies: Array<Array<[string, string]>> = [
        [
          ['Set-Cookie', 'dwsid=first; Path=/; HttpOnly; Secure'],
          ['Set-Cookie', 'dwanonymous_1=abc; Max-Age=15552000; Path=/'],
          ['Set-Cookie', '__cq_dnt=1; Path=/'],
        ],
        [
          ['Set-Cookie', 'dwsid=second; Path=/'],
          ['Set-Cookie', 'dwanonymous_1=; Max-Age=0; Path=/'],
          ['Set-Cookie', '__cq_dnt=1; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'],
          // Max-Age wins over Expires.
          ['Set-Cookie', 'sid=kept; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=3600'],
          ['Set-Cookie', 'invalid'],
        ],
      ];
      const sent = stubFetch((_url, index) => response(SEARCH_PAGE, {headers: setCookies[index] ?? []}));

      await captureStorefrontSearch({
        host: 'https://www.example.com',
        siteId: 'RefArch',
        queries: ['shirt', 'dress', 'shoes'],
        password: 'secret-pass',
      });

      const authorization = basic('storefront', 'secret-pass');
      expect(sent.map((request) => request.headers.get('authorization'))).to.deep.equal([
        authorization,
        authorization,
        authorization,
      ]);
      expect(sent.map((request) => request.headers.get('cookie'))).to.deep.equal([
        null,
        'dwsid=first; dwanonymous_1=abc; __cq_dnt=1',
        'dwsid=second; sid=kept',
      ]);
    });

    it('follows redirects and sends the password and cookies only to the storefront', async () => {
      const sent = stubFetch((url) => {
        if (url.host === 'help.example.org') {
          return response('Unauthorized', {
            status: 401,
            statusText: 'Unauthorized',
            headers: [
              ['WWW-Authenticate', 'Basic realm="help"'],
              ['Set-Cookie', 'other=1; Path=/'],
            ],
          });
        }
        if (url.pathname === SEARCH_PATH && url.searchParams.get('q') === 'gift card') {
          return response(null, {
            status: 302,
            headers: [
              ['Location', '/s/RefArch/gift-cards/'],
              ['Set-Cookie', 'dwsid=s1; Path=/'],
            ],
          });
        }
        if (url.pathname === SEARCH_PATH && url.searchParams.get('q') === 'help') {
          return response(null, {status: 301, headers: [['Location', 'https://help.example.org/search?q=help']]});
        }
        return response(SEARCH_PAGE);
      });

      const capture = await captureStorefrontSearch({
        host: 'www.example.com',
        siteId: 'RefArch',
        queries: ['gift card', 'help', 'shirt'],
        username: 'admin',
        password: 'secret-pass',
      });

      const authorization = basic('admin', 'secret-pass');
      expect(
        sent.map((request) => [request.url, request.headers.get('authorization'), request.headers.get('cookie')]),
      ).to.deep.equal([
        [`${ORIGIN}${SEARCH_PATH}?q=gift+card&sz=25`, authorization, null],
        [`${ORIGIN}/s/RefArch/gift-cards/`, authorization, 'dwsid=s1'],
        [`${ORIGIN}${SEARCH_PATH}?q=help&sz=25`, authorization, 'dwsid=s1'],
        ['https://help.example.org/search?q=help', null, null],
        [`${ORIGIN}${SEARCH_PATH}?q=shirt&sz=25`, authorization, 'dwsid=s1'],
      ]);

      const [giftCard, help, shirt] = capture.results;
      expect(giftCard).to.include({
        status: 200,
        total: 1234,
        url: sent[0].url,
        redirectedTo: `${ORIGIN}/s/RefArch/gift-cards/`,
      });
      expect(help).to.include({
        status: 401,
        error:
          'HTTP 401 Unauthorized: the storefront redirected to help.example.org, which the storefront password is not sent to',
        url: sent[2].url,
        redirectedTo: 'https://help.example.org/search?q=help',
      });
      expect(help.hits).to.deep.equal([]);
      expect(shirt).to.not.have.property('redirectedTo');
    });

    it('stops following redirects after five', async () => {
      const sent = stubFetch((url) =>
        response(null, {
          status: 302,
          headers: [['Location', `/loop?n=${Number(url.searchParams.get('n') ?? 0) + 1}`]],
        }),
      );

      const capture = await captureStorefrontSearch({host: 'www.example.com', siteId: 'RefArch', queries: ['shirt']});

      expect(sent).to.have.length(6);
      expect(capture.results[0]).to.include({
        status: 0,
        error: `Stopped after 5 redirects; the next one was to ${ORIGIN}/loop?n=6`,
      });
    });

    it('records a redirect to an invalid location', async () => {
      stubFetch(() => response(null, {status: 302, headers: [['Location', 'https://[invalid']]}));

      const capture = await captureStorefrontSearch({host: 'www.example.com', siteId: 'RefArch', queries: ['shirt']});

      expect(capture.results[0]).to.include({
        status: 0,
        error: 'The storefront redirected to an invalid location: https://[invalid',
      });
    });

    it('explains failed page requests', async () => {
      stubFetch((url) => {
        switch (url.searchParams.get('q')) {
          case 'locked': {
            return response('', {
              status: 401,
              statusText: 'Unauthorized',
              headers: [['WWW-Authenticate', 'Basic realm="storefront"']],
            });
          }
          case 'denied': {
            return response('', {status: 401, statusText: 'Unauthorized'});
          }
          default: {
            return response('', {status: 500, statusText: 'Internal Server Error'});
          }
        }
      });
      const errors = async (password?: string) =>
        (
          await captureStorefrontSearch({
            host: 'www.example.com',
            siteId: 'RefArch',
            queries: ['locked', 'denied', 'broken'],
            password,
          })
        ).results.map((entry) => [entry.status, entry.error, entry.hits.length]);

      expect(await errors()).to.deep.equal([
        [401, 'HTTP 401 Unauthorized: the storefront is password protected; set the storefront password', 0],
        [401, 'HTTP 401 Unauthorized', 0],
        [500, 'HTTP 500 Internal Server Error', 0],
      ]);
      expect((await errors('wrong'))[0]).to.deep.equal([
        401,
        'HTTP 401 Unauthorized: the storefront password was not accepted',
        0,
      ]);
    });

    it('records requests that do not complete and carries on', async () => {
      stubFetch((url, _index, init) => {
        if (url.searchParams.get('q') === 'shirt') throw new TypeError('fetch failed');
        if (url.searchParams.get('q') === 'slow') {
          return new Promise<Response>((_resolve, reject) => {
            init.signal!.addEventListener('abort', () => reject(init.signal!.reason));
          });
        }
        return response(SEARCH_PAGE);
      });

      const capture = await captureStorefrontSearch({
        host: 'www.example.com',
        siteId: 'RefArch',
        queries: ['shirt', 'slow', 'dress'],
        timeoutMs: 20,
      });

      const [shirt, slow, dress] = capture.results;
      expect(shirt).to.include({status: 0, url: `${ORIGIN}${SEARCH_PATH}?q=shirt&sz=25`});
      expect(shirt.error).to.match(/^Storefront request to www\.example\.com failed: a network error occurred/);
      expect(slow.status).to.equal(0);
      expect(slow.error).to.match(/^Storefront request to www\.example\.com failed: the request timed out/);
      expect(dress).to.include({status: 200, total: 1234});
    });

    it('sends extra parameters and bypasses the page cache on a custom search path', async () => {
      const sent = stubFetch(() => response(SEARCH_PAGE));

      const capture = await captureStorefrontSearch({
        host: 'www.example.com',
        siteId: 'RefArch',
        queries: ['shirt', 'dress'],
        path: '/search',
        locale: 'en-US',
        params: {srule: 'top-sellers', lang: 'en'},
        bypassPageCache: true,
        label: 'before',
      });

      const urls = sent.map((request) => new URL(request.url));
      expect(urls.map((url) => url.pathname)).to.deep.equal(['/search', '/search']);
      expect([...urls[0].searchParams.keys()]).to.deep.equal(['srule', 'lang', 'q', 'sz', '_']);
      expect(urls[0].searchParams.get('_')).to.match(/^[\da-z]+$/);
      expect(urls[1].searchParams.get('_')).to.equal(urls[0].searchParams.get('_'));
      expect(capture.label).to.equal('before');
      // The locale only shapes the default path, so a custom path leaves it out.
      expect(capture.request).to.deep.equal({
        source: 'storefront',
        host: 'www.example.com',
        siteId: 'RefArch',
        path: '/search',
        limit: 25,
        params: {srule: 'top-sellers', lang: 'en'},
        bypassPageCache: true,
      });
      expect(capture.results[0].url).to.equal(sent[0].url);
    });

    it('puts the locale into the default search path', async () => {
      const sent = stubFetch(() => response(SEARCH_PAGE));

      const capture = await captureStorefrontSearch({
        host: 'www.example.com',
        siteId: 'RefArch',
        queries: ['shirt'],
        locale: 'en-US',
      });

      expect(sent[0].url).to.equal(`${ORIGIN}/on/demandware.store/Sites-RefArch-Site/en_US/Search-Show?q=shirt&sz=25`);
      expect(capture.request).to.include({
        locale: 'en_US',
        path: '/on/demandware.store/Sites-RefArch-Site/en_US/Search-Show',
      });
    });

    it('warns when the page shows more products than requested', async () => {
      stubFetch(() => response(SEARCH_PAGE));

      const capture = await captureStorefrontSearch({
        host: 'www.example.com',
        siteId: 'RefArch',
        queries: ['shirt'],
        limit: 2,
      });

      expect(capture.results[0].parseWarnings).to.include(
        'The page shows 3 products, more than the 2 requested with sz',
      );
    });

    it('rejects invalid options before sending a request', async () => {
      const sent = stubFetch(() => response(SEARCH_PAGE));
      const base: CaptureStorefrontSearchOptions = {host: 'www.example.com', siteId: 'RefArch', queries: ['shirt']};
      const cases: Array<[Partial<CaptureStorefrontSearchOptions>, string]> = [
        [{limit: 0}, 'limit must be an integer from 1 to 200'],
        [{limit: 2.5}, 'limit must be an integer from 1 to 200'],
        [{queries: [' ', '']}, 'At least one query is required'],
        [{siteId: ' '}, 'A site ID is required'],
        [{delayMs: -1}, 'delayMs must be a non-negative number of milliseconds'],
        [{timeoutMs: 0}, 'timeoutMs must be a positive number of milliseconds'],
        [{profile: {productTile: '.product:first-child'}}, 'Page profile key productTile: Unsupported selector syntax'],
        [{host: ''}, 'A storefront host is required'],
        [{host: 'www.example.com/s/RefArch'}, 'Pass only the storefront host (www.example.com)'],
        [{path: 'search'}, 'The search page path must start with a single "/", got "search"'],
        [{params: {sz: '50'}}, 'The sz parameter is set by the capture'],
        [{params: {_: '1'}, bypassPageCache: true}, 'The _ parameter is set by the capture'],
      ];

      for (const [overrides, message] of cases) {
        const error = await captureError({...base, ...overrides});
        expect(error?.message, JSON.stringify(overrides)).to.include(message);
      }
      expect(sent).to.deep.equal([]);
    });
  });
});
