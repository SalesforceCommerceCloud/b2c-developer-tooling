---
description: Commands for capturing product search results from the Shopper Search API or the storefront search page, and comparing two captures query by query.
---

# Search Commands

Commands for capturing product search results, through the Shopper Search API or from the storefront search page, and comparing two captures query by query. Use them to see how results differ between two search setups, such as lexical (native) search and semantic search with Agentic Commerce Search on the same site, a site before and after a search change, or the storefront search page and the Shopper Search API.

## Command Overview

| Command                         | Description                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `b2c search capture`            | Run a list of queries through Shopper Search `productSearch` and save the results |
| `b2c search capture-storefront` | Read the storefront search page for a list of queries and save the results        |
| `b2c search diff`               | Compare two captures query by query                                               |

## Authentication

`b2c search capture` calls the Shopper Search API as a guest shopper. It gets a SLAS guest token with the SLAS client you provide and does not use an Account Manager API client, so the Account Manager authentication flags in its help are not needed.

| SLAS client                                 | Flow                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Private client (`--slas-client-secret` set) | `client_credentials`                                                                                            |
| Public client (no secret)                   | Guest PKCE (`authorization_code_pkce`). The redirect URI must be registered on the client; see `--redirect-uri` |

The SLAS client needs the `sfcc.shopper-product-search` scope, and the site you search must be one of its channels. Clients created with `b2c slas client create --default-scopes` include that scope. To find an existing client, run `b2c slas client list`. See [SLAS Commands](./slas).

`b2c search capture-storefront` requests storefront pages as an anonymous shopper and needs no API client. When the storefront is password protected, as development and staging storefronts often are, set the storefront password in `SFCC_STOREFRONT_PASSWORD`. The user name is `storefront` unless you set `--storefront-user`. The password is sent only to the storefront host, never to a host the storefront redirects to.

`b2c search diff` reads local files only and needs no credentials.

## b2c search capture

Runs each query through the Shopper Search `productSearch` API and records the ranked hits with their prices, totals, refinements with their hit counts, sorting options, and the search mode that served each request. Queries run one at a time, in order. A sort and refinements, when you give them, apply to every query.

### Usage

```bash
b2c search capture --site-id <SITE_ID> --slas-client-id <CLIENT_ID> --query <QUERY>
```

### Flags

| Flag                   | Environment Variable      | Description                                                                                         | Required |
| ---------------------- | ------------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| `--tenant-id`          | `SFCC_TENANT_ID`          | Organization/tenant ID                                                                              | Yes      |
| `--short-code`         | `SFCC_SHORTCODE`          | SCAPI short code                                                                                    | Yes      |
| `--site-id`            | `SFCC_SITE_ID`            | Site ID to search                                                                                   | Yes      |
| `--slas-client-id`     | `SFCC_SLAS_CLIENT_ID`     | SLAS client ID used to get a guest shopper token                                                    | Yes      |
| `--slas-client-secret` | `SFCC_SLAS_CLIENT_SECRET` | SLAS client secret (omit for public clients)                                                        | No       |
| `--redirect-uri`       |                           | Redirect URI registered on a public SLAS client (default: `http://localhost:3000/callback`)         | No       |
| `-q`, `--query`        |                           | Search query to capture (repeatable)                                                                | Yes\*    |
| `--queries-file`       |                           | File with one query per line; blank lines and lines starting with `#` are skipped (`-` reads stdin) | Yes\*    |
| `--limit`              |                           | Hits to capture per query, 1-200 (default: 25)                                                      | No       |
| `--search-mode`        |                           | `semantic` (Agentic Commerce Search) or `lexical` (native search). Omit to use the site default     | No       |
| `--locale`             |                           | Locale to search in, for example `en-US`                                                            | No       |
| `--currency`           |                           | Currency for prices, for example `USD`                                                              | No       |
| `--sort`               |                           | ID of the sorting option to sort by, for example `price-low-to-high`. Omit to use the default sort  | No       |
| `--refine`             |                           | Refinement to apply to every query, as `attribute=value` (repeatable, at most 9)                    | No       |
| `--label`              |                           | Label stored in the capture and shown by `search diff` (default: the search mode, or `capture`)     | No       |
| `-o`, `--output`       |                           | Write the capture JSON to this file                                                                 | No       |

The tenant ID, short code, site ID, and SLAS client values can also come from `dw.json` (`tenant-id`, `short-code`, `site-id`, `slas-client-id`, `slas-client-secret`). See the [Configuration Guide](/guide/configuration).

\* Provide at least one query with `--query` or `--queries-file`. Queries from both are combined; surrounding whitespace is trimmed and duplicates are captured once.

### Search Modes

When Agentic Commerce Search is turned on for a site, the `searchMode` request parameter chooses the engine per request: `semantic` routes to Agentic Commerce Search and `lexical` routes to native search. This lets you capture both engines on the same site without changing settings in Business Manager. Omit `--search-mode` to use the site default.

The API can serve a request with a different engine than the one requested, for example when the semantic index is not ready. When the response includes `effectiveSearchMode`, the capture records it, the table shows it in the **Served by** column, and `search diff` counts the fallbacks. When the response does not include it, **Served by** shows `-`. See [Search Mode A/B Testing](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-search-mode-ab-testing.html) for the routing rules.

### Sorting and Refinements

`--sort` and `--refine` are sent with every query of the capture, so you can compare how two setups sort and filter the same queries.

- **Sort**: the ID of a sorting option the site offers. Each result lists the offered IDs in `sortingOptions`, so a capture without `--sort` shows which ones there are. Engines can offer different sorting options, so check the IDs each engine offers before you choose one.
- **Refinements**: each `--refine` value is sent as one `refine` parameter. Separate several values of one attribute with `|`, as in `c_refinementColor=red|blue`, and give a price range as `price=(min..max)`, as in `price=(0..50)`. Besides custom attributes (`c_...`), the system attributes include `cgid` (category), `price`, `pmid` (promotion), `htype` (hit type), and `orderable_only`; the `refine` parameter of the [Shopper Search API reference](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=Summary) lists them all. A request takes at most 9 refinements. Each value is checked for the `attribute=value` form before any request is sent. Quote values that contain `|`, spaces, or parentheses so the shell passes each as one argument.

Each hit records the `price` the API returns. For master products and product sets, it is the lowest price of their products. With `--sort`, the table adds a **Price order** column that shows whether the hit prices rise (`ascending`), fall (`descending`), are all the same (`equal`), or both rise and fall (`unordered`); hits without a price are skipped. A response's `selectedSortingOption` can name the requested option even when the hits are not in that order, so check the price order instead: a price sort that was applied shows `ascending` or `descending`. A sort by another price than the lowest, such as the highest price of a master, can show as `unordered`.

When a response lists the refinements that were applied, the capture records them in `selectedRefinements`. To check that a sort or a refinement was applied, also compare the totals with a capture of the same queries without it; see [Compare Sorting and Refinements](#compare-sorting-and-refinements).

### Examples

```bash
# Capture two queries
b2c search capture --tenant-id abcd_123 --short-code kv7kzm78 --site-id RefArch \
  --slas-client-id my-client --query shirt --query "red dress"

# Capture a query list with each engine (Agentic Commerce Search turned on)
b2c search capture --site-id RefArch --slas-client-id my-client \
  --queries-file queries.txt --search-mode lexical --output lexical.json
b2c search capture --site-id RefArch --slas-client-id my-client \
  --queries-file queries.txt --search-mode semantic --output semantic.json

# Private client, capture JSON on stdout
b2c search capture --site-id RefArch --slas-client-id my-client --slas-client-secret sk_xxx \
  --queries-file queries.txt --label before --json > before.json

# Sort every query by price
b2c search capture --site-id RefArch --slas-client-id my-client \
  --queries-file queries.txt --sort price-low-to-high --output price-asc.json

# Apply a color refinement and a price range to every query
b2c search capture --site-id RefArch --slas-client-id my-client \
  --queries-file queries.txt --refine c_refinementColor=blue --refine "price=(0..50)" --output blue.json
```

A query file lists one query per line:

```text
# apparel
shirt
red dress

leather boots
```

### Output

- **Normal mode**: a table with one row per query: HTTP status, total, hits captured, the engine that served it, the top hit, and latency. With `--sort`, a **Price order** column shows the order of the hit prices. Failed requests add an **Error** column and a warning.
- **JSON mode** (`--json`) and `--output`: the capture. With `--sort` or `--refine`, the request records `sort` and `refine`.

```json
{
  "schemaVersion": 1,
  "label": "semantic",
  "capturedAt": "2026-01-01T00:00:00.000Z",
  "request": {
    "shortCode": "kv7kzm78",
    "organizationId": "f_ecom_abcd_123",
    "siteId": "RefArch",
    "limit": 25,
    "searchMode": "semantic"
  },
  "results": [
    {
      "query": "shirt",
      "status": 200,
      "latencyMs": 182,
      "total": 48,
      "searchMode": "semantic",
      "effectiveSearchMode": "semantic",
      "hits": [{"productId": "shirt-001", "productName": "Linen Shirt", "hitType": "master", "price": 49.99}],
      "refinements": [
        {"attributeId": "c_color", "label": "Color", "values": [{"value": "blue", "label": "Blue", "hitCount": 12}]}
      ],
      "sortingOptions": ["best-matches", "price-low-to-high"],
      "selectedSortingOption": "best-matches"
    }
  ]
}
```

A failed request is recorded with its HTTP status (`0` when the request did not complete) and an `error` message, and the run continues with the next query. The command exits with an error only when every request fails; the capture file is still written.

## b2c search capture-storefront

Requests the storefront search results page for each query and reads what a shopper sees: the product tiles in order, the result count, the filters, and the sorting options. The capture has the same format as `search capture`, so `search diff` compares a storefront capture with another storefront capture or with a Shopper Search capture.

The command reads the HTML the server returns. It runs no scripts, so results that the page loads with JavaScript after it opens are not captured. The page selectors default to the Storefront Reference Architecture (SFRA) base templates; for customized templates, provide a [page profile](#page-profile).

### Usage

```bash
b2c search capture-storefront --server <HOST> --site-id <SITE_ID> --query <QUERY>
```

### Flags

| Flag                    | Environment Variable       | Description                                                                                                                                               | Required |
| ----------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `-s`, `--server`        | `SFCC_SERVER`              | Storefront host name or origin, for example `www.example.com` or `http://localhost:8080` (default: `hostname` from `dw.json`)                             | Yes      |
| `--site-id`             | `SFCC_SITE_ID`             | Site ID to search                                                                                                                                         | Yes      |
| `--storefront-user`     | `SFCC_STOREFRONT_USER`     | User name for storefront password protection (default: `storefront`)                                                                                      | No       |
| `--storefront-password` | `SFCC_STOREFRONT_PASSWORD` | Storefront password, when the storefront is password protected. Prefer the environment variable: a flag value shows in the process list and shell history | No       |
| `-q`, `--query`         |                            | Search query to capture (repeatable)                                                                                                                      | Yes\*    |
| `--queries-file`        |                            | File with one query per line; blank lines and lines starting with `#` are skipped (`-` reads stdin)                                                       | Yes\*    |
| `--limit`               |                            | Products to request per page with the `sz` parameter, 1-200 (default: 25)                                                                                 | No       |
| `--locale`              |                            | Locale segment of the default search page path, for example `en_US` (default: `default`)                                                                  | No       |
| `--path`                |                            | Path of the search page, for example `/search` (default: `/on/demandware.store/Sites-{site}-Site/{locale}/Search-Show`)                                   | No       |
| `--param`               |                            | Extra query parameter for every request, as `name=value` (repeatable)                                                                                     | No       |
| `--bypass-page-cache`   |                            | Add a parameter unique to this capture so the page cache cannot serve pages rendered before it                                                            | No       |
| `--delay`               |                            | Pause between requests in milliseconds (default: 250)                                                                                                     | No       |
| `--profile`             |                            | JSON file of page selectors that replace the SFRA defaults (see [Page Profile](#page-profile))                                                            | No       |
| `--save-html`           |                            | Directory to save the HTML of each page in, for checking what the capture read                                                                            | No       |
| `--label`               |                            | Label stored in the capture and shown by `search diff` (default: `storefront`)                                                                            | No       |
| `-o`, `--output`        |                            | Write the capture JSON to this file                                                                                                                       | No       |

\* Provide at least one query with `--query` or `--queries-file`, as for `search capture`.

### Search Page Requests

Each query is one `GET` request for `<server><path>?q=<query>&sz=<limit>`, plus the `--param` values. The default path is the URL of the SFRA `Search-Show` controller, which works whether or not search-friendly URLs are turned on. To capture your search-friendly search URL instead, pass it with `--path`. `--locale` applies to the default path only; with `--path`, include the locale in the path or pass it with `--param`.

- **Page cache**: the page cache and the CDN can serve a page rendered before a change. `--bypass-page-cache` adds a parameter (`_`) that is unique to the capture, so every page is rendered for it.
- **Redirects**: up to five redirects are followed, for example a search redirect that sends a query to a category or content page. The capture records the final URL in `redirectedTo`. The storefront password and cookies are sent only to the storefront's own origin.
- **Cookies**: cookies the storefront sets are sent with the later requests of the capture, so all pages are requested in one shopper session.
- **Load**: requests run one at a time with `--delay` between them. Each page, redirects included, has 60 seconds to complete.

### Page Profile

The page profile tells the command where the search results are on the page. It is a JSON file that maps profile keys to CSS selectors. Keys you leave out keep the SFRA default.

| Key                    | Finds                                                                                                                                                          | SFRA default                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `productTile`          | Product tiles, in ranked order. A tile inside another tile, such as a swatch, is ignored                                                                       | `.product-grid .product[data-pid]`                         |
| `productIdAttribute`   | Tile attribute that holds the product ID (an attribute name, not a selector)                                                                                   | `data-pid`                                                 |
| `productName`          | Product name, inside a tile                                                                                                                                    | `.pdp-link a`                                              |
| `productPrice`         | Sales price, inside a tile. The price is read from the element's `content` attribute; for a price range, the first match is the lowest price                   | `.price .sales .value`                                     |
| `resultCount`          | Elements that state the number of results, in order of preference                                                                                              | `.search-result-count, .result-count`                      |
| `refinement`           | Filter (refinement) panels                                                                                                                                     | `.refinement`                                              |
| `refinementLabel`      | Filter label, inside a panel                                                                                                                                   | `.card-header`                                             |
| `refinementValue`      | Filter values, inside a panel. Each must link (`data-href`, `href`, `data-url`, or `value`) to the page with the value applied, or removed when it is selected | `[data-href], a[href]`                                     |
| `refinementValueCount` | Hit count, inside a filter value                                                                                                                               | Not set: see [How the Page Is Read](#how-the-page-is-read) |
| `sortingOption`        | Sorting options                                                                                                                                                | `select[name=sort-order] option`                           |
| `hiddenText`           | Text that only screen readers read, left out of product names and labels                                                                                       | `.sr-only`                                                 |

Selectors support type, universal (`*`), class, ID, and attribute selectors (`[a]`, `[a=v]`, `[a~=v]`, `[a|=v]`, `[a^=v]`, `[a$=v]`, `[a*=v]`), the descendant and child (`>`) combinators, and comma-separated lists. Pseudo-classes such as `:not()` and the `+` and `~` combinators are not supported. The command checks the profile before it sends any request.

```json
{
  "productTile": ".search-results .product-tile[data-itemid]",
  "productIdAttribute": "data-itemid",
  "productName": ".product-name a",
  "refinementValueCount": ".refinement-count"
}
```

### How the Page Is Read

- **Products**: the product ID comes from the tile attribute. A product that appears twice keeps its first position. The name is the text of the name element, without the text that only screen readers read.
- **Prices**: the number in the `content` attribute of the price element, as the SFRA price templates write it (`content="49.99"`). The element's text is not read, because its format depends on the locale. The SFRA default reads the sales price, so a list price shown struck through is left out, and a price range reads as its lowest price.
- **Total**: the first result count element whose text holds a number. The largest number in that text is the total; numbers that are part of the query are not counted, so `2 Results for 12 pack` reads as 2. Digit groups can be separated by commas, periods, apostrophes, or no-break spaces. On a page without product tiles, a result count element without a number reads as 0 results.
- **Filters**: a filter value's attribute ID and value come from its link, not from its text. `prefn1=size&prefv1=M` is attribute `size` with value `M`, `cgid` is the category, `pmin` and `pmax` are the price range (attribute `price`, value `(20..49.99)`), and `pmid` is the promotion. Each link is compared with the page URL, so selected values are read from the links that remove them, and a filter that every link carries, such as the category of a search-friendly URL, is read as part of the page rather than as a value. Custom attributes appear without the `c_` prefix the Shopper Search API uses.
- **Hit counts**: the text of the `refinementValueCount` element, when the profile sets one. Otherwise a number in parentheses at the end of the value's label, such as `Shirts (12)`, is the count and is removed from the label.
- **Sorting options**: the option's `data-id`, else the `srule` parameter of the URL in its `value`, else its `value`, else its text. The option marked `selected` is recorded as `selectedSortingOption`.

When part of the page cannot be found, the result records a warning in `parseWarnings` that names the profile key to check, for example `No filter panels found (refinement)`. In normal mode, each warning is printed once with the number of pages that had it. Use `--save-html` to keep the pages and check the selectors against them.

### Limitations

- **Search engine**: the page shows the results of the engine the site serves. A page request cannot choose the engine the way `search capture --search-mode` does, unless the storefront has its own parameter for it, which you can pass with `--param`. To compare engines, capture the storefront before and after the change, or compare it with `search capture` captures.
- **Product IDs**: a tile can show a variant or a variation group where the Shopper Search API returns the master product, so the same result can have different IDs on each side.
- **Hit counts**: the SFRA base templates do not show filter hit counts, so `hitCount` is set only on pages that show them.
- **Prices**: prices are read only from a `content` attribute. On templates that show the price as text only, hits have no price, and `search diff` shows no price order for them.
- **Categories**: category values are read as a flat list; the category tree is not kept.
- **Price ranges**: range bounds are read from the page's links. They can differ from the values the Shopper Search API returns for the same range, for example `49.99` and `50` as the upper bound, and `search diff` then reports the values as different.
- **Page size**: some storefronts limit the page size. When the page shows fewer products than requested and than its total, the result has a warning.

### Examples

```bash
# Capture two queries
b2c search capture-storefront --server www.example.com --site-id RefArch --query shirt --query "red dress"

# Password-protected storefront: read the password without echoing it, then capture a query list
read -rs SFCC_STOREFRONT_PASSWORD && export SFCC_STOREFRONT_PASSWORD
b2c search capture-storefront --server dev.example.com --site-id RefArch \
  --queries-file queries.txt --bypass-page-cache --save-html pages --output storefront.json

# Search-friendly search URL and a customized template
b2c search capture-storefront --server www.example.com --site-id RefArch --path /search \
  --profile profile.json --queries-file queries.txt

# Sort with a sorting rule
b2c search capture-storefront --server www.example.com --site-id RefArch \
  --queries-file queries.txt --param srule=price-low-to-high

# Filter by a refinement, as the page's filter links do
b2c search capture-storefront --server www.example.com --site-id RefArch \
  --queries-file queries.txt --param prefn1=refinementColor --param prefv1=Blue
```

`search diff` reads the `srule` parameter as the sort the capture asked for and shows the order of the hit prices, as for `search capture --sort`.

### Output

- **Normal mode**: a table with one row per query: HTTP status, total, products read, the top product, and latency. A **Notes** column shows redirects and page warnings. Failed requests add an **Error** column and a warning.
- **JSON mode** (`--json`) and `--output`: the capture. The request has `source` set to `storefront`, and each result records the page URL.

```json
{
  "schemaVersion": 1,
  "label": "storefront",
  "capturedAt": "2026-01-01T00:00:00.000Z",
  "request": {
    "source": "storefront",
    "host": "www.example.com",
    "siteId": "RefArch",
    "locale": "default",
    "path": "/on/demandware.store/Sites-RefArch-Site/default/Search-Show",
    "limit": 25
  },
  "results": [
    {
      "query": "shirt",
      "status": 200,
      "latencyMs": 412,
      "total": 48,
      "hits": [{"productId": "shirt-001", "productName": "Linen Shirt", "price": 49.99}],
      "refinements": [
        {"attributeId": "refinementColor", "label": "Color", "values": [{"value": "Blue", "label": "Blue"}]}
      ],
      "sortingOptions": ["best-matches", "price-low-to-high"],
      "selectedSortingOption": "best-matches",
      "url": "https://www.example.com/on/demandware.store/Sites-RefArch-Site/default/Search-Show?q=shirt&sz=25"
    }
  ]
}
```

As with `search capture`, a failed request is recorded with its HTTP status (`0` when the request did not complete) and an `error` message, and the command exits with an error only when every request fails. The error of a `401` response says whether the storefront needs a password, did not accept the one sent, or redirected to another host, which the password is not sent to.

## b2c search diff

Compares two captures query by query. Queries are matched by their exact text; queries in only one capture are listed and not compared. The diff reports differences and has no pass or fail verdict.

### Usage

```bash
b2c search diff <BASELINE> <CANDIDATE>
```

### Arguments

| Argument    | Description                                                                 | Required |
| ----------- | --------------------------------------------------------------------------- | -------- |
| `BASELINE`  | Baseline capture file from `search capture` or `search capture-storefront`  | Yes      |
| `CANDIDATE` | Candidate capture file from `search capture` or `search capture-storefront` | Yes      |

Use `-` for one of the arguments to read that capture from stdin.

### Flags

| Flag             | Description                                                                   | Default    |
| ---------------- | ----------------------------------------------------------------------------- | ---------- |
| `--k`            | Depths at which to report overlap (comma-separated or repeatable)             | `1,3,5,10` |
| `--max-ids`      | Longest list of baseline-only or candidate-only product IDs to keep per query | All        |
| `-o`, `--output` | Write the diff JSON to this file                                              |            |

### What the Diff Reports

For each query where both requests succeeded:

| Measure     | Meaning                                                                                                                                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overlap@k   | Share of the top `k` products that both sides returned. It is computed only up to the length of the shorter list (`effectiveMaxK`), so a shorter list does not count as a difference, and overlap at that depth is always included. Requested depths deeper than that are listed in `skippedK`. |
| Membership  | Product IDs only one side returned, in rank order, and how the two sets relate: `equal`, `disjoint`, `baseline_subset_of_candidate`, `candidate_subset_of_baseline`, `neither_subset`, or an empty side.                                                                                        |
| Order       | Whether the top hit is the same, the first rank where the lists differ, the longest common prefix, and the rank changes of products both sides returned (mean, maximum, and the largest movers).                                                                                                |
| Refinements | Refinements only one side returned, refinements whose values differ, and values both sides returned with a different hit count (`countChanges`). A value without a hit count on either side is not compared.                                                                                    |
| Sorting     | Sorting options only one side offered, and the option each side reported as applied (`selectedSortingOption`).                                                                                                                                                                                  |
| Price order | For each side, whether the hit prices rise (`ascending`), fall (`descending`), are all the same (`equal`), or both rise and fall (`unordered`). Set when at least two hits have a price.                                                                                                        |

The summary shows the mean overlap at each depth, how many queries have the same top hit, and how many have different refinements, different refinement hit counts, and different sorting. For each side it shows the failed, zero-result, and with-hit query counts, the engines that served the queries, the sorting options offered, and the option reported as applied. When either capture asked for a sort (`--sort`, or the `srule` parameter of a storefront capture), it also shows the price order of each side's queries, and the query table adds a **Price B/C** column. A refinement table then lists each refinement attribute: in how many queries both sides returned it, only one side did, its values differ, or its hit counts differ. A refinement one side never returns shows as **Only B** or **Only C** for every query.

The summary also shows two checks for a broken setup:

- **Distinct result lists** and **Largest shared list**: when many different queries return the same ranked list, the engine is probably not using the query text, for example because an index is not ready. The diff prints a note when two or more queries share a list.
- **Mode fallbacks**: queries where the response reported a different engine than the one requested.

The diff warns when the captures were taken with different settings: organization, site, limit, locale, currency, sort, or refinements for Shopper Search captures (refinements in any order), and host, site, locale, path, limit, parameters, or page cache bypass for storefront captures.

When one capture comes from the storefront and the other from the Shopper Search API, the diff warns that the sources differ and compares the site and limit only. Refinement attribute IDs are compared without the `c_` prefix of custom attributes, and refinements without values are left out. Product IDs are compared as they are; see the [storefront limitations](#limitations). The storefront side has no search mode, so it reports no mode fallbacks.

### Examples

```bash
# Compare lexical and semantic captures
b2c search diff lexical.json semantic.json

# Report overlap at depths 1, 5, 10, and 25
b2c search diff before.json after.json --k 1,5,10,25

# Keep at most 10 differing product IDs per query and save the diff
b2c search diff before.json after.json --max-ids 10 --output diff.json

# List queries whose overlap@5 is below 0.5
b2c search diff before.json after.json --json | jq -r '.queries[] | select((.results.overlap.atK["5"] // 1) < 0.5) | .query'
```

### Output

```text
Baseline:  lexical (2026-01-01T00:00:00.000Z, site RefArch, mode lexical)
Candidate: semantic (2026-01-01T00:05:00.000Z, site RefArch, mode semantic)

Queries compared: 2 of 2
Mean overlap:     @1 1.00  @3 0.67  @5 0.60
Top-1 agreement:  2 of 2
Refinement differences: 1 of 2
Refinement count differences: 1 of 2
Sorting differences: 2 of 2

                       Baseline                                      Candidate
──────────────────────────────────────────────────────────────────────────────────────────────────────
Label                  lexical                                       semantic
Failed                 0                                             0
Zero results           0                                             0
With hits              2                                             2
Distinct result lists  2                                             2
Largest shared list    1                                             1
Served by              unreported: 2                                 semantic: 1, lexical: 1
Mode fallbacks         0                                             1
Sort options           best-matches, price-low-to-high, top-sellers  best-matches, price-low-to-high
Selected sort          unreported: 2                                 unreported: 2

Refinement  Both  Only B  Only C  Values differ  Counts differ
────────────────────────────────────────────────────────────────
c_color     2     0       0       0              1
c_size      0     1       0       0              0

Query  Hits B/C  @1    @3    @5    Top-1  Only B  Only C  Served by (C)       Note
────────────────────────────────────────────────────────────────────────────────────
shirt  6/6       1.00  0.67  0.60  same   2       2       semantic
dress  2/2       1.00  -     -     same   0       0       lexical (fallback)
```

A `-` in an overlap column means the depth is deeper than one of the lists. `unreported` in **Selected sort** means the responses did not name the sort applied, as when no sort was requested. With `--json`, the command returns the full diff, including the per-query membership, order, refinement, and sorting details.

## Workflows

### Compare Lexical and Semantic Search on One Site

With Agentic Commerce Search turned on, capture the same queries with each engine and compare them:

```bash
b2c search capture --queries-file queries.txt --search-mode lexical --output lexical.json
b2c search capture --queries-file queries.txt --search-mode semantic --output semantic.json
b2c search diff lexical.json semantic.json
```

### Compare Before and After a Change

Capture the site, make the change, capture again, and compare. Use this when you cannot choose the engine per request, or to measure a change such as turning on Agentic Commerce Search, rebuilding a search index, or changing search settings:

```bash
b2c search capture --queries-file queries.txt --label before --output before.json
# ...make the change...
b2c search capture --queries-file queries.txt --label after --output after.json
b2c search diff before.json after.json
```

Use the same query list, limit, locale, and currency for both captures so the results are comparable.

### Compare the Storefront with Shopper Search

Capture the storefront search page and the Shopper Search API with the same queries and compare them. This shows whether the storefront serves the results the API returns, for example after turning on Agentic Commerce Search:

```bash
b2c search capture-storefront --queries-file queries.txt --bypass-page-cache --output storefront.json
b2c search capture --queries-file queries.txt --search-mode semantic --output semantic.json
b2c search diff storefront.json semantic.json
```

Use the same limit for both captures. If the storefront shows variants where the API returns masters, compare top-hit agreement and overlap with that in mind.

### Compare Sorting and Refinements

Every diff compares the refinements, their hit counts, and the sorting options of each query, so a lexical and semantic diff already shows refinements that only one engine returns and sorting options that only one engine offers. To check that each engine applies a sort, capture both engines with the same `--sort`:

```bash
b2c search capture --queries-file queries.txt --search-mode lexical --sort price-low-to-high --output lexical-price.json
b2c search capture --queries-file queries.txt --search-mode semantic --sort price-low-to-high --output semantic-price.json
b2c search diff lexical-price.json semantic-price.json
```

```text
Selected sort          price-low-to-high: 2                          price-low-to-high: 2
Price order            ascending: 2                                  unordered: 1, ascending: 1

Query  Hits B/C  @1    @3    @5    Top-1  Only B  Only C  Price B/C      Served by (C)  Note
──────────────────────────────────────────────────────────────────────────────────────────────
shirt  6/6       0.00  0.67  0.80  diff   0       0       asc/unordered  semantic
dress  2/2       1.00  -     -     same   0       0       asc/asc        semantic
```

Here both sides report the requested sort, but the candidate's prices for `shirt` are not in ascending order. If the engines offer the option under different IDs, capture each engine with its own ID; the diff then warns that the sort differs, which is expected.

To check whether a sort or a refinement changes which products match, compare a capture with one of the same engine without it. A sort should not change the totals. A refinement can only lower them, so totals that stay the same for every query suggest that the refinement was not applied. The diff warns that the captures differ in sort or refinements, which is expected here:

```bash
b2c search capture --queries-file queries.txt --search-mode semantic --output semantic.json
b2c search capture --queries-file queries.txt --search-mode semantic --refine c_refinementColor=blue --output semantic-blue.json
b2c search diff semantic.json semantic-blue.json --json \
  | jq -r '.queries[] | [.query, .baseline.total, .candidate.total] | @tsv'
```
