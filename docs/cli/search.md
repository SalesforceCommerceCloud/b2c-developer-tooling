---
description: Commands for checking whether Agentic Commerce Search is serving a site, capturing product search results from the Shopper Search API or the storefront search page, comparing two captures query by query, and analyzing captures of the storefront and the API under lexical and semantic search.
---

# Search Commands

Commands for capturing product search results, through the Shopper Search API or from the storefront search page, and comparing two captures query by query. Use them to see how results differ between two search setups, such as lexical (native) search and semantic search with Agentic Commerce Search on the same site, a site before and after a search change, or the storefront search page and the Shopper Search API. Before you compare engines, `b2c search status` checks whether Agentic Commerce Search is serving the site. To see the storefront and the API under both engines at once, `b2c search analyze` compares the captures and lists what differs and what is likely behind it.

## Command Overview

| Command                         | Description                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `b2c search status`             | Check whether Agentic Commerce Search is serving a site                           |
| `b2c search capture`            | Run a list of queries through Shopper Search `productSearch` and save the results |
| `b2c search capture-storefront` | Read the storefront search page for a list of queries and save the results        |
| `b2c search diff`               | Compare two captures query by query                                               |
| `b2c search analyze`            | Analyze captures of the storefront and the API under lexical and semantic search  |

## Authentication

`b2c search status` and `b2c search capture` call the Shopper Search API as a guest shopper. They get a SLAS guest token with the SLAS client you provide and do not use an Account Manager API client, so the Account Manager authentication flags in their help are not needed.

| SLAS client                                 | Flow                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Private client (`--slas-client-secret` set) | `client_credentials`                                                                                            |
| Public client (no secret)                   | Guest PKCE (`authorization_code_pkce`). The redirect URI must be registered on the client; see `--redirect-uri` |

The SLAS client needs the `sfcc.shopper-product-search` scope, and the site you search must be one of its channels. Clients created with `b2c slas client create --default-scopes` include that scope. To find an existing client, run `b2c slas client list`. See [SLAS Commands](./slas).

`b2c search capture-storefront` requests storefront pages as an anonymous shopper and needs no API client. When the storefront is password protected, as development and staging storefronts often are, set the storefront password in `SFCC_STOREFRONT_PASSWORD`. The user name is `storefront` unless you set `--storefront-user`. The password is sent only to the storefront host, never to a host the storefront redirects to.

`b2c search diff` and `b2c search analyze` read local files only and need no credentials.

## b2c search status

Checks whether Agentic Commerce Search is serving a site. For each query you give, the command sends three Shopper Search `productSearch` requests with a SLAS guest token, each asking for one hit: one without a `searchMode`, one with `searchMode=lexical`, and one with `searchMode=semantic`. It reads `effectiveSearchMode` in each response, which names the engine that served the request, and reports whether Agentic Commerce Search is serving the site and which engine answers requests without a search mode, which is what shoppers on the storefront get. Requests run one at a time, in order.

Run it before you compare engines with `search capture`, and after you turn Agentic Commerce Search on, to see when it starts serving.

### Usage

```bash
b2c search status --site-id <SITE_ID> --slas-client-id <CLIENT_ID> --query <QUERY>
```

### Flags

| Flag                   | Environment Variable      | Description                                                                                 | Required |
| ---------------------- | ------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| `--tenant-id`          | `SFCC_TENANT_ID`          | Organization/tenant ID                                                                      | Yes      |
| `--short-code`         | `SFCC_SHORTCODE`          | SCAPI short code                                                                            | Yes      |
| `--site-id`            | `SFCC_SITE_ID`            | Site ID to search                                                                           | Yes      |
| `--slas-client-id`     | `SFCC_SLAS_CLIENT_ID`     | SLAS client ID used to get a guest shopper token                                            | Yes      |
| `--slas-client-secret` | `SFCC_SLAS_CLIENT_SECRET` | SLAS client secret (omit for public clients)                                                | No       |
| `--redirect-uri`       |                           | Redirect URI registered on a public SLAS client (default: `http://localhost:3000/callback`) | No       |
| `-q`, `--query`        |                           | Search query to check (repeatable, 1-5). Use multi-word queries that shoppers type          | Yes      |
| `--locale`             |                           | Locale to search in, for example `en-US`                                                    | No       |
| `--currency`           |                           | Currency for prices, for example `USD`                                                      | No       |

The tenant ID, short code, site ID, and SLAS client values can also come from `dw.json` (`tenant-id`, `short-code`, `site-id`, `slas-client-id`, `slas-client-secret`). See the [Configuration Guide](/guide/configuration).

Give one to five queries. Each query sends three requests, so five queries send 15. Surrounding whitespace is trimmed and duplicates are checked once.

### Choosing Queries

Use queries of several words that shoppers type, such as `red dress` or `leather ankle boots`. Single-word lookups can fall back to lexical search even when Agentic Commerce Search is on, so a single-word query cannot show that it is off. When every query is a single word and the semantic requests were served by lexical search, the result is `unknown` and the command asks for a multi-word query.

### The Result

The command reports three values, and `--json` returns each of them.

**Agentic Commerce Search** (`agenticCommerceSearch`) is the answer to whether it is serving the site:

| Value         | Meaning                                                                                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `serving`     | A `searchMode=semantic` request was served by semantic search, so Agentic Commerce Search is on and its index is answering. Whether shoppers get it depends on the site default engine.                                                                           |
| `not-serving` | Agentic Commerce Search is off for the site, or its semantic index is not ready yet. The API rejected `searchMode=semantic` with HTTP 400 while the requests without it succeeded, or the semantic requests for a multi-word query were served by lexical search. |
| `unknown`     | The requests do not settle it. For example, every query was a single word and was served by lexical search, the responses did not report `effectiveSearchMode`, or the requests failed. The warnings say what to do.                                              |

**Site default engine** (`siteDefault`) is the engine that served the requests without a `searchMode`, which is what shoppers on the storefront get:

| Value        | Meaning                                                              |
| ------------ | -------------------------------------------------------------------- |
| `semantic`   | Semantic search served every request that reported an engine         |
| `lexical`    | Lexical (native) search served every request that reported an engine |
| `mixed`      | Different queries were served by different engines                   |
| `unreported` | The responses did not include `effectiveSearchMode`                  |
| `failed`     | Every request without a `searchMode` failed                          |

**Semantic requests** (`semanticRequests`) is what happened to the `searchMode=semantic` requests:

| Value        | Meaning                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| `served`     | At least one was served by semantic search                                               |
| `fallback`   | Some succeeded, and lexical search served every one that reported an engine              |
| `rejected`   | Every one returned HTTP 400: the API does not accept `searchMode=semantic` for this site |
| `unreported` | Some succeeded, but the responses did not include `effectiveSearchMode`                  |
| `failed`     | None succeeded, and they did not all return HTTP 400                                     |

The `searchMode` request parameter is a hint, not a guarantee, so the command reads `effectiveSearchMode`, which is the engine that served the request. It can only tell when the response includes that field. When it does not, **Served by** shows `-` and the result is `unknown`.

### Turn On Agentic Commerce Search

When the result is `not-serving`, turn Agentic Commerce Search on for the site in Business Manager: **Merchant Tools > Agentic Commerce Search > Search Preferences > Enable Agentic Commerce Search**. Your Business Manager role needs write access to the Agentic Commerce Search module. If **Merchant Tools** has no **Agentic Commerce Search** menu, the feature is not available on the instance yet; contact your Salesforce account team.

After you turn it on, provisioning takes about two to three days. Until the semantic index is ready, semantic requests fall back to lexical search, so run `b2c search status` again later to see when it starts serving.

### Examples

```bash
# Check a site with two multi-word queries
b2c search status --tenant-id abcd_123 --short-code kv7kzm78 --site-id RefArch \
  --slas-client-id my-client --query "red dress" --query "leather ankle boots"

# Private client, a locale and a currency, result as JSON
b2c search status --site-id RefArch --slas-client-id my-client --slas-client-secret sk_xxx \
  --query "red dress" --locale en-US --currency USD --json
```

### Output

- **Normal mode**: a table with one row per request: the query, the mode requested (`default` for a request without a `searchMode`, `lexical`, or `semantic`), HTTP status, the engine that served it, total, and latency. Failed requests add an **Error** column. Below the table, two lines give the result and the site default engine, and each warning follows. Failed requests also add a warning with their count.
- **JSON mode** (`--json`): the result, described below.

```text
Query      Requested  Status  Served by  Total  ms
───────────────────────────────────────────────────
red dress  default    200     lexical    96     131
red dress  lexical    200     lexical    96     118
red dress  semantic   200     lexical    96     125

Agentic Commerce Search: not serving
Site default engine: lexical
```

The warnings explain the result in plain language and say what to do. For the output above, the command warns that the semantic request for `red dress` fell back to lexical search, and that Agentic Commerce Search is off for the site or its semantic index is not ready yet. When the API rejects `searchMode=semantic` instead, the failed request shows its error in the table, and the warning includes the API's message. When semantic requests are served by semantic search but requests without a `searchMode` are served by lexical search, the command warns that shoppers probably still get lexical search. When some multi-word queries are served by semantic search and others fall back to lexical search, the verdict is `serving` and a warning names the queries that fell back.

```json
{
  "schemaVersion": 1,
  "siteId": "RefArch",
  "organizationId": "f_ecom_abcd_123",
  "shortCode": "kv7kzm78",
  "checkedAt": "2026-01-01T00:00:00.000Z",
  "agenticCommerceSearch": "not-serving",
  "siteDefault": "lexical",
  "semanticRequests": "fallback",
  "probes": [
    {
      "query": "red dress",
      "requested": "default",
      "status": 200,
      "latencyMs": 131,
      "total": 96,
      "effectiveSearchMode": "lexical"
    },
    {
      "query": "red dress",
      "requested": "lexical",
      "status": 200,
      "latencyMs": 118,
      "total": 96,
      "effectiveSearchMode": "lexical"
    },
    {
      "query": "red dress",
      "requested": "semantic",
      "status": 200,
      "latencyMs": 125,
      "total": 96,
      "effectiveSearchMode": "lexical"
    }
  ],
  "warnings": [
    "Semantic requests for multi-word queries fell back to lexical search (\"red dress\"). Agentic Commerce Search is off for the site, or its semantic index is not ready yet; provisioning takes about two to three days after it is turned on."
  ]
}
```

| Field                                                      | Description                                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `schemaVersion`                                            | Format version, the same as in a capture                                                                                                   |
| `siteId`, `organizationId`, `shortCode`                    | The site and API endpoint that were checked                                                                                                |
| `checkedAt`                                                | When the check started                                                                                                                     |
| `agenticCommerceSearch`, `siteDefault`, `semanticRequests` | The values described in [The Result](#the-result)                                                                                          |
| `probes`                                                   | One entry per request, in the order sent: `query`, `requested`, `status`, `latencyMs`, and `total` and `effectiveSearchMode` when reported |
| `warnings`                                                 | The warnings, in plain language                                                                                                            |

A failed request is recorded with its HTTP status (`0` when the request did not complete) and an `error` message, and the run continues with the next request. The command exits with an error only when every request fails.

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

- **Sort**: the ID of a sorting option the site offers. Each result lists the offered IDs in `sortingOptions` and the labels shoppers see, such as `Price Low To High`, in `sortingOptionLabels`, so a capture without `--sort` shows which ones there are. Engines can offer different sorting options, so check the IDs each engine offers before you choose one.
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
      "sortingOptionLabels": {"best-matches": "Best Matches", "price-low-to-high": "Price Low To High"},
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
      "sortingOptionLabels": {"best-matches": "Best Matches", "price-low-to-high": "Price Low To High"},
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

## b2c search analyze

Analyzes up to four captures of the same queries together: the storefront search page and the Shopper Search API, each with lexical (native) search and with semantic search from Agentic Commerce Search. The command compares the captures in pairs, judges which engine each storefront capture looks like, and lists findings: what differs, how many queries it affects, and what is likely behind it. Findings are leads to check; the analysis has no pass or fail verdict.

Use it around turning on Agentic Commerce Search: capture the storefront and the API with lexical search before you turn it on, and with semantic search once it is serving. The analysis then shows what semantic search changes and whether the storefront shows what the API returns; see [Analyze Search Around Turning On Agentic Commerce Search](#analyze-search-around-turning-on-agentic-commerce-search). A storefront cannot report which engine served a page, so the analysis judges it from how closely the storefront results match the API results of each engine.

### Usage

```bash
b2c search analyze --storefront-lexical <FILE> --storefront-semantic <FILE> --scapi-lexical <FILE> --scapi-semantic <FILE>
```

Give at least two of the four captures. Each pair of captures that forms a [comparison](#comparisons) is compared. Findings about one capture, such as failed queries, are reported for every capture you give. Two captures that form no comparison, such as `--storefront-lexical` with `--scapi-semantic`, give a warning and only those findings.

### Flags

| Flag                    | Description                                                                                 | Default    |
| ----------------------- | ------------------------------------------------------------------------------------------- | ---------- |
| `--storefront-lexical`  | Storefront capture under lexical (native) search, from `search capture-storefront`          |            |
| `--storefront-semantic` | Storefront capture with Agentic Commerce Search turned on, from `search capture-storefront` |            |
| `--scapi-lexical`       | Shopper Search capture taken with `--search-mode lexical`, from `search capture`            |            |
| `--scapi-semantic`      | Shopper Search capture taken with `--search-mode semantic`, from `search capture`           |            |
| `--k`                   | Depths at which to report overlap (comma-separated or repeatable)                           | `1,3,5,10` |
| `--max-examples`        | Most example queries with product IDs to keep per finding; `0` keeps none                   | `5`        |
| `-o`, `--output`        | Write the analysis JSON to this file                                                        |            |

Use `-` as the file of one capture flag to read that capture from stdin. The command checks each capture against its flag and names the flag when they do not match: a `--storefront-*` flag needs a capture from `search capture-storefront`, and a `--scapi-*` flag needs one from `search capture`. Like `search diff`, it reads local files only and needs no credentials.

### Comparisons

The command compares the captures in pairs, as `search diff` does, and reports the comparisons in this order. A comparison is made when both of its captures are given, and the first capture is its baseline.

| Comparison                       | Compares                                            | Answers                                                |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| `storefront-vs-scapi-lexical`    | `--storefront-lexical` with `--scapi-lexical`       | Does the storefront show what native search returns?   |
| `storefront-vs-scapi-semantic`   | `--storefront-semantic` with `--scapi-semantic`     | Does the storefront show what semantic search returns? |
| `scapi-lexical-vs-semantic`      | `--scapi-lexical` with `--scapi-semantic`           | What does semantic search change in the API results?   |
| `storefront-lexical-vs-semantic` | `--storefront-lexical` with `--storefront-semantic` | What changed for shoppers?                             |

The two storefront-versus-API comparisons have the same engine on both sides, so a difference there comes from the storefront layer and not from the engine: custom code, redirects, the page cache, shopper context, filtering of products that cannot be ordered, or the template. The two lexical-versus-semantic comparisons show what the change of engine does, in the API and for shoppers.

Before a storefront capture is compared with an API capture, a storefront product ID that is the variant an API hit stands for (its `representedProductId`) counts as that hit's product ID, because a tile can show a variant where the API returns the master. The capture files are not changed. The **IDs via variant** column and `idsMatchedThroughRepresentedProduct` show how many IDs were matched this way.

A list that stops at its limit says nothing about what lies beyond it. A product therefore counts as missing from the other list only when it ranks within the depth that list covers, which is every rank when the list holds every match. A storefront page size that differs from the limit of the API capture does not show up as products only one side returns.

The command warns when a Shopper Search capture requested another search mode than its flag names, or none, so the site default engine served it; when a capture has no result for queries that other captures have; and, as `search diff` does, when the two captures of a comparison were taken with different settings (the site and the limit, for a storefront compared with the API).

### Engine Attribution

A storefront cannot report the engine that served a page, so the analysis judges it. With both API captures, each storefront capture is compared with the lexical API results and with the semantic API results, and the mean overlap of each is taken at the deepest depth both comparisons report. When the two means differ by at least 0.15, the storefront capture is `closer to lexical` or `closer to semantic`. A smaller gap is `unclear`, for example when customization changes the storefront results under either engine.

A storefront semantic capture that is closer to the lexical results, or a storefront lexical capture that is closer to the semantic results, raises `storefront-engine-mismatch`. The attribution is a judgment from overlap, not a report from the platform; to see which engine the API serves, use `b2c search status`.

### Findings

Each finding has a stable `code`, a `severity`, the comparison (`pair`) or the capture (`source`) it is about, a `message` with the counts, the `likelyCauses`, the affected `queries` (the most affected first, at most 10), and `examples`: queries with the product IDs concerned, at most `--max-examples` of them. The command prints at most three examples per finding; `--json` has all of them.

The severity is `warning`, `notice`, or `info`. Findings are listed by severity, and within a severity those about one capture or across comparisons come before those of the comparisons, which follow the [order of the comparisons](#comparisons). A difference between the storefront and the API is a warning when it affects at least 10% of the compared queries and a notice below that, so one odd query among many does not raise a warning; `zero-results` uses the same share of the successful queries, and `identical-result-lists` is a warning from 20% of the queries with results. The command uses fixed thresholds, so the same captures always give the same findings.

Where a cached page is a possible cause, the finding suggests capturing again with `--bypass-page-cache`, unless the storefront capture already did.

**Storefront compared with the API**, in `storefront-vs-scapi-lexical` and `storefront-vs-scapi-semantic`:

| Code                        | Severity          | Reported when                                                                                                                   | What to check                                                                                                                                                                                              |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storefront-only-products`  | Warning or notice | The storefront shows products the API does not return.                                                                          | Custom storefront code that adds or pins products, a search redirect or landing page, shopper context (customer groups, price books, personalization), a cached page, and IDs that could not be matched.   |
| `api-only-products`         | Warning or notice | The API returns products the storefront does not show.                                                                          | Products the storefront filters out, such as products that are not orderable, a template or custom code that hides tiles, a page that shows fewer tiles than requested, and IDs that could not be matched. |
| `totals-differ`             | Warning or notice | The result totals differ by more than 10% of the larger total.                                                                  | How each side counts (orderable products only, variants against masters), custom code that filters or adds products after the search, and a cached page.                                                   |
| `facets-only-on-storefront` | Warning or notice | The storefront offers filters the API does not return.                                                                          | Filters that custom code or the template adds, a [page profile](#page-profile) that reads page elements as filters, and refinements the storefront category defines but the API request did not return.    |
| `facets-only-in-api`        | Warning or notice | The API returns filters the storefront does not offer.                                                                          | A template that does not render them, custom code that removes them, and a page profile that does not read them; check the parse warnings of the storefront capture.                                       |
| `facet-counts-differ`       | Warning or notice | The hit counts of the same filter values differ.                                                                                | How each side counts products (orderable products only, variants against masters), and a category or default refinement the storefront applies and the API request did not.                                |
| `sorting-options-differ`    | Warning or notice | The two sides offer different sorting options.                                                                                  | Sorting rules the storefront offers that are not assigned to the category or search of the API request, and sorting rules the template hides.                                                              |
| `order-differs`             | Warning or notice | Products both sides return are ranked in a different relative order. The examples show the first two products that swap places. | Custom sorting rules or sort parameters on the storefront, personalization or shopper context, and a cached page.                                                                                          |

**Lexical compared with semantic**, in `scapi-lexical-vs-semantic` and `storefront-lexical-vs-semantic`:

| Code            | Severity | Reported when                                                                                                                                                                                                                                                    | What to check                                                                                                                                                                                                                                                                                                                        |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `engine-change` | Info     | For each comparison with compared queries. It gives the mean overlap at the deepest depth, how many top hits are the same, and the filters and sorting options only one engine returns. The examples show the top hit under lexical, then under semantic search. | When both captures return the same products, which engine served each: the **Served by** column for the API, and for the storefront whether Agentic Commerce Search is turned on and serving (`b2c search status`). Otherwise the queries with the least overlap, and filters or sorting options that semantic search never returns. |

**One capture**, reported for each capture you give:

| Code                     | Severity          | Reported when                                                                                                                                                                                                                                                                 | What to check                                                                                                                                                                                                                                                                 |
| ------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `failed-queries`         | Warning           | Queries failed: the response status is outside 200-299, or the capture recorded an error. The message quotes the first error.                                                                                                                                                 | The error messages stored in the capture: a storefront password or blocked requests, a token without the `sfcc.shopper-product-search` scope or a site that is not a channel of the SLAS client, a rejected query, refinement, or sort ID, rate limits, and temporary errors. |
| `mode-fallbacks`         | Warning           | A Shopper Search capture asked for one search mode and some queries were served by another.                                                                                                                                                                                   | When every query fell back, whether Agentic Commerce Search is serving the site yet; run `b2c search status`.                                                                                                                                                                 |
| `price-sort-not-applied` | Warning           | A capture asked for a price sort (a sort ID that contains `price`, or the `srule` parameter of a storefront capture) and the hit prices of some queries both rise and fall, or run against the direction the sort ID names (`low-to-high` or `asc`, `high-to-low` or `desc`). | Whether the engine applies the sort (semantic search may rank by relevance only), whether the sorting rule sorts in the direction its ID names, and whether the sort ID is one the site offers.                                                                               |
| `identical-result-lists` | Warning or notice | Several queries return exactly the same result list.                                                                                                                                                                                                                          | An engine that returns a default list for queries it cannot interpret, a cached page or a redirect that serves one page for different queries, and queries that differ only in spelling or plural form, which can match the same products.                                    |
| `zero-results`           | Warning or notice | Queries returned no products. The message says how many of them have results in another capture and how many were redirected.                                                                                                                                                 | Redirects and a page profile that does not read the product tiles (storefront), no match for the query, and a locale, currency, or refinement that excludes every product (API).                                                                                              |

**Across the comparisons:**

| Code                         | Severity | Reported when                                                                                                                                                    | What to check                                                                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channel-gap-grew`           | Warning  | Both storefront-versus-API comparisons are present, and the mean overlap fell by at least 0.2 from lexical to semantic search, at the deepest depth both report. | Storefront customization (a custom search model, sorting, or filtering) that interacts differently with semantic results, shopper context, and a storefront semantic capture that semantic search did not serve; see [Engine Attribution](#engine-attribution).                                                                     |
| `storefront-engine-mismatch` | Warning  | A storefront capture looks closer to the other engine's API results than to its own; see [Engine Attribution](#engine-attribution).                              | For the semantic capture: whether the storefront is served by Agentic Commerce Search yet, an A/B split that routed the capture session to the lexical group, and a cached page. For the lexical capture: whether Agentic Commerce Search was already on, whether the lexical and semantic captures are swapped, and a cached page. |

### Examples

```bash
# All four captures
b2c search analyze --storefront-lexical storefront-lexical.json --storefront-semantic storefront-semantic.json \
  --scapi-lexical api-lexical.json --scapi-semantic api-semantic.json

# What semantic search changes in the API
b2c search analyze --scapi-lexical api-lexical.json --scapi-semantic api-semantic.json

# Does the storefront show what native search returns?
b2c search analyze --storefront-lexical storefront-lexical.json --scapi-lexical api-lexical.json

# After the change, without a storefront capture from before it
b2c search analyze --storefront-semantic storefront-semantic.json \
  --scapi-lexical api-lexical.json --scapi-semantic api-semantic.json

# Report overlap at depths 1, 5, 10, and 25, keep ten examples per finding, and save the analysis
b2c search analyze --storefront-lexical storefront-lexical.json --scapi-lexical api-lexical.json \
  --k 1,5,10,25 --max-examples 10 --output analysis.json

# Read the semantic API capture from stdin
b2c search capture --queries-file queries.txt --search-mode semantic --json \
  | b2c search analyze --storefront-semantic storefront-semantic.json --scapi-lexical api-lexical.json --scapi-semantic -

# List the codes of the warnings
b2c search analyze --storefront-lexical storefront-lexical.json --scapi-lexical api-lexical.json --json \
  | jq -r '.findings[] | select(.severity == "warning") | .code'
```

### Output

- **Normal mode**: the sources, a table of the comparisons, the engine attribution when both API captures are given, and the findings grouped by severity, each with its likely causes, the queries it affects, and examples. A storefront capture reports no engine, so its **Served by** shows `-`. The comparison table shows the mean overlap at each depth, how many compared queries have the same top hit, how many have different refinements and different sorting options, and how many IDs were matched through a variant (`-` for a comparison of the two engines). Warnings about the captures go to stderr before the tables. The note that the sources differ, which `search diff` prints for a storefront compared with the API, is left out because the analysis compares them by design.
- **JSON mode** (`--json`) and `--output`: the analysis, described below.

```text
Sources
Role                   Label                Source      Captured                  Queries  Served by
────────────────────────────────────────────────────────────────────────────────────────────────────────
Storefront (lexical)   storefront-lexical   storefront  2026-01-01T09:05:00.000Z  3        -
Storefront (semantic)  storefront-semantic  storefront  2026-01-08T09:05:00.000Z  3        -
API (lexical)          api-lexical          scapi       2026-01-01T09:00:00.000Z  3        lexical: 3
API (semantic)         api-semantic         scapi       2026-01-08T09:00:00.000Z  3        semantic: 3

Comparisons (mean overlap at each depth; the baseline is the first source of the pair)
Pair                            Compared  @1    @3    @5    @10  Top-1 same  Facet diffs  Sort diffs  IDs via variant
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
storefront-vs-scapi-lexical     3 of 3    1.00  1.00  1.00  -    3 of 3      0            0           0
storefront-vs-scapi-semantic    3 of 3    0.33  0.44  0.50  -    1 of 3      0            0           0
scapi-lexical-vs-semantic       3 of 3    0.33  0.44  0.50  -    1 of 3      0            0           -
storefront-lexical-vs-semantic  3 of 3    1.00  1.00  1.00  -    3 of 3      0            0           -

Engine attribution
  Storefront (lexical): closer to lexical (mean overlap at 5: 1.00 with the lexical API results, 0.50 with the semantic API results)
  Storefront (semantic): closer to lexical (mean overlap at 5: 1.00 with the lexical API results, 0.50 with the semantic API results)

Warnings (5)
  ...
  storefront-engine-mismatch (Storefront (semantic))
    The storefront (semantic) capture looks closer to the lexical API results than to the semantic ones (mean overlap at 5: 1.00 with the lexical API results, 0.50 with the semantic API results).
    Likely causes:
      - The storefront may not be served by Agentic Commerce Search yet, for example because the change to the site is not in effect for the storefront.
      - An A/B split may have routed the capture session to the lexical group.
    Queries: leather boots, shirt
  ...
  api-only-products (storefront-vs-scapi-semantic)
    With semantic search, the API returns products the storefront does not show in 3 of 3 compared queries (9 products in total).
    Likely causes:
      - The storefront likely filters products out, for example products that are not orderable or not available to the shopper.
      - The page template or custom code may hide some product tiles.
      - The page may show fewer tiles than the page size requested.
      - Variant or master IDs the analysis could not match may remain: a storefront tile can show a different variant than the API hit represents.
    Queries: shirt, red dress, leather boots
    Examples:
      shirt: shirt-009, shirt-010, shirt-011
      red dress: dress-110, dress-111, dress-112
      leather boots: boot-210, boot-211, boot-212
  ...

Info (2)
  ...
  engine-change (storefront-lexical-vs-semantic)
    Lexical and semantic search compared on the storefront: the mean overlap at 5 is 1.00, and the top hit is the same in 3 of 3 compared queries. The examples show the top hit of lexical search, then of semantic search.
    Likely causes:
      - Both captures return the same products, so the semantic capture was likely not served by Agentic Commerce Search; check that it is turned on for the site.
    Queries: shirt, red dress, leather boots
```

The lines with `...` stand for findings the sample leaves out. Here the storefront semantic capture returns the same products as the lexical one, so it looks like lexical search, and the comparison of the storefront with the semantic API results reports the differences that follow from it. A `-` in an overlap column means the depth is deeper than one of the lists, as in `search diff`.

The analysis has these fields:

| Field               | Description                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schemaVersion`     | Format version, the same as in a capture                                                                                                                                                                                                               |
| `kValues`           | The depths of the overlap in `pairs`                                                                                                                                                                                                                   |
| `sources`           | One entry per capture you gave, keyed by role (`storefrontLexical`, `storefrontSemantic`, `scapiLexical`, `scapiSemantic`): `label`, `capturedAt`, `source` (`storefront` or `scapi`), `queries`, and `effectiveSearchModes` (queries per engine)      |
| `pairs`             | One entry per comparison, in the order of the [table above](#comparisons): `id`, `baseline` and `candidate` (roles), `summary` (the summary of `search diff --json`, without the per-query details), `idsMatchedThroughRepresentedProduct`, `warnings` |
| `engineAttribution` | For `storefrontLexical` and `storefrontSemantic` when both API captures are given: `closerTo` (`lexical`, `semantic`, or `unclear`), `meanOverlapWithLexical`, `meanOverlapWithSemantic`, and the depth `k` they are taken at                          |
| `findings`          | The findings, most severe first: `code`, `severity`, `pair` or `source`, `message`, `likelyCauses`, `queries`, and `examples` (each with `query` and `productIds`) when there are any                                                                  |
| `warnings`          | Warnings about the captures as a whole: a search mode that does not match the role, queries a capture has no result for, and captures that form no comparison                                                                                          |

A finding looks like this:

```json
{
  "code": "order-differs",
  "severity": "warning",
  "pair": "storefront-vs-scapi-semantic",
  "message": "With semantic search, the storefront and the API rank the products they both return in a different order in 1 of 3 compared queries. The examples show the first two products that swap places: the storefront's, then the API's.",
  "likelyCauses": [
    "Custom sorting rules or sort parameters on the storefront likely re-order the results.",
    "Personalization or shopper context (customer groups, price books, promotions) may influence the order for a shopper but not for the guest API request."
  ],
  "queries": ["shirt"],
  "examples": [
    {
      "query": "shirt",
      "productIds": ["shirt-001", "shirt-004"]
    }
  ]
}
```

## Workflows

### Check That Agentic Commerce Search Is Serving a Site

Check the site before you compare engines. A `semantic` capture of a site that does not serve semantic search returns lexical results, which `search diff` counts as mode fallbacks. Use queries of several words that shoppers type:

```bash
b2c search status --site-id RefArch --slas-client-id my-client \
  --query "red dress" --query "leather ankle boots"
```

When the result is `serving`, continue with the comparison below. When it is `not-serving`, turn Agentic Commerce Search on in Business Manager, wait for provisioning (about two to three days), and run the command again.

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

### Analyze Search Around Turning On Agentic Commerce Search

Capture the storefront and the API before you turn Agentic Commerce Search on, capture both again once it is serving, and analyze the four captures. The analysis shows what semantic search changes in the API and for shoppers, whether the storefront shows what the API returns under each engine, and whether the storefront is served by Agentic Commerce Search. Use the same query list and the same limit for all four captures, and `--bypass-page-cache` for the storefront so a cached page cannot show results from before or after the change.

Before the change, capture lexical search:

```bash
b2c search capture-storefront --queries-file queries.txt --bypass-page-cache --label storefront-lexical --output storefront-lexical.json
b2c search capture --queries-file queries.txt --search-mode lexical --label api-lexical --output api-lexical.json
```

Turn Agentic Commerce Search on (see [Turn On Agentic Commerce Search](#turn-on-agentic-commerce-search)) and run `b2c search status` until it reports `serving` with the site default engine `semantic`. Then capture semantic search and analyze the four captures:

```bash
b2c search capture-storefront --queries-file queries.txt --bypass-page-cache --label storefront-semantic --output storefront-semantic.json
b2c search capture --queries-file queries.txt --search-mode semantic --label api-semantic --output api-semantic.json
b2c search analyze --storefront-lexical storefront-lexical.json --storefront-semantic storefront-semantic.json \
  --scapi-lexical api-lexical.json --scapi-semantic api-semantic.json
```

Read the findings from the top. `failed-queries` and `mode-fallbacks` say whether a capture can be trusted. `storefront-engine-mismatch` says whether the storefront is served by Agentic Commerce Search yet; when it is not, the other findings of the storefront compared with the API follow from that. The findings of `scapi-lexical-vs-semantic` show what semantic search changes in the results.

Without a storefront capture from before the change, leave out `--storefront-lexical`. A page request cannot choose the engine the way `--search-mode` does, so lexical search cannot be captured on the storefront once the change is in effect; see [Limitations](#limitations). The analysis then has no `storefront-lexical-vs-semantic` comparison and no `channel-gap-grew` finding; the engine attribution and the other findings remain.

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
