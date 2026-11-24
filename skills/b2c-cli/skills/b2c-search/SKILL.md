---
name: b2c-search
description: Capture product search results for a list of queries with the b2c CLI, through the Shopper Search API or from the storefront search page, and compare two captures query by query. Use this skill whenever the user wants to compare lexical (native) search with semantic search (Agentic Commerce Search) on a site, check search results before and after turning on Agentic Commerce Search or changing search settings, check that the storefront search page shows what the API returns, measure result overlap or rank changes for a set of queries, compare facets (refinements), facet hit counts, or sorting options between engines, check that a sort or a refinement is applied, or find queries that return identical or empty results — even if they just say "compare search results", "what does the storefront show", or "did search change after the switch".
---

# B2C Search Skill

Use `b2c search capture` to run a list of queries through the Shopper Search `productSearch` API and save the ranked results with their prices, refinements, and sorting options, `b2c search capture-storefront` to read the same from the storefront search results page, and `b2c search diff` to compare two captures query by query. Both capture commands write the same format, so any two captures can be compared. The diff reports differences only and has no pass or fail verdict, so summarize what changed and let the user decide what is acceptable.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli search diff before.json after.json`).

## Configuration

`search capture` searches as a guest shopper with a SLAS token. It does not use an Account Manager API client. Values resolve from `dw.json` / `SFCC_*` env vars / the active instance; add flags only to override configured values:

- `--tenant-id` / `SFCC_TENANT_ID` / `tenantId`
- `--short-code` / `SFCC_SHORTCODE` / `shortCode`
- `--site-id` / `SFCC_SITE_ID` / `siteId`
- `--slas-client-id` / `SFCC_SLAS_CLIENT_ID` / `slasClientId`
- `--slas-client-secret` / `SFCC_SLAS_CLIENT_SECRET` / `slasClientSecret` (private clients only)

The SLAS client needs the `sfcc.shopper-product-search` scope and the site in its channels. A public client gets the token through PKCE, so `--redirect-uri` must match a URI registered on the client (default `http://localhost:3000/callback`). To find or create a client, see the `b2c-slas` skill. Run `b2c setup inspect` to see resolved values (see the `b2c-config` skill).

`search capture-storefront` requests the storefront pages as an anonymous shopper and needs no API client:

- `--server` / `SFCC_SERVER` / `hostname`: the storefront host, or an origin such as `http://localhost:8080`
- `--site-id` / `SFCC_SITE_ID` / `siteId`
- `SFCC_STOREFRONT_PASSWORD`: the storefront password, when the storefront is password protected (development and staging storefronts often are). The user name defaults to `storefront` (`--storefront-user`). Use the environment variable rather than `--storefront-password` so the password stays out of the process list and shell history, and never print it or write it to a file.

`search diff` reads local files and needs no configuration.

## Choose an Approach

| Situation                                                                     | Action                                                                                                          | Note                                                            |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Agentic Commerce Search is on for the site                                    | Capture the same query list with `--search-mode lexical` and with `--search-mode semantic`, then diff           | No Business Manager change needed                               |
| Measuring a change (turning on Agentic Commerce Search, a reindex, a setting) | Capture with `--label before`, make the change, capture with `--label after`, then diff                         | Keep the query list, limit, locale, and currency equal          |
| Requests with `--search-mode` fail                                            | Capture without `--search-mode` and use the before/after approach                                               | The site default engine serves each request                     |
| Checking what shoppers see on the search page                                 | Capture with `search capture-storefront` and with `search capture`, using the same queries and limit, then diff | The page shows the engine the site serves                       |
| Measuring a change on the storefront itself                                   | Capture the storefront with `--label before` and `--label after` and `--bypass-page-cache`, then diff           | Keep the host, path, locale, and limit equal                    |
| Checking facets and sorting                                                   | Capture both sides with the same `--sort` or `--refine`, then diff                                              | Every diff also compares facets, facet counts, and sort options |

## Procedure

1. Write a query list, one query per line (`#` starts a comment). Use queries shoppers actually type: single words, multi-word phrases, and descriptive queries.
2. Capture both sides:

   ```bash
   b2c search capture --queries-file queries.txt --search-mode lexical --output lexical.json
   b2c search capture --queries-file queries.txt --search-mode semantic --output semantic.json
   ```

3. Compare:

   ```bash
   b2c search diff lexical.json semantic.json
   b2c search diff lexical.json semantic.json --k 1,5,10 --json > diff.json
   ```

To check sorting and filtering, capture both engines with the same sort or the same refinements. Take the sorting option ID from the `sortingOptions` of an earlier capture; if the engines name the option differently, capture each with its own ID and expect the diff to warn that the sort differs. A refinement is `attribute=value`, with `|` between values and `price=(min..max)` for a price range, at most 9 per capture:

```bash
b2c search capture --queries-file queries.txt --search-mode lexical --sort price-low-to-high --output lexical-price.json
b2c search capture --queries-file queries.txt --search-mode semantic --sort price-low-to-high --output semantic-price.json
b2c search diff lexical-price.json semantic-price.json
b2c search capture --queries-file queries.txt --search-mode semantic --refine c_refinementColor=blue --output semantic-blue.json
b2c search diff semantic.json semantic-blue.json --json | jq -r '.queries[] | [.query, .baseline.total, .candidate.total] | @tsv'
```

To compare the storefront search page with the API, capture the storefront instead of one side. Start with two or three queries and `--save-html`, check the page warnings, and only then run the full list:

```bash
b2c search capture-storefront --queries-file queries.txt --bypass-page-cache --save-html pages --output storefront.json
b2c search capture --queries-file queries.txt --output api.json
b2c search diff storefront.json api.json
```

Ask before sending requests to a storefront the user did not name, and keep the default `--delay` so the capture does not load the site.

## Reading the Results

Check these first, because they decide whether the rankings can be compared at all:

- **Served by / `effectiveSearchMode`**: the engine that served each request. `(fallback)` or **Mode fallbacks** above 0 means the requested engine was not used, for example because the semantic index is not ready. A fallback query compares lexical with lexical; report it separately. `-` or `unreported` means the API did not report the engine.
- **Distinct result lists** well below **With hits**, or **Largest shared list** above 1: different queries returned the identical ranked list, so the engine may be ignoring the query text. Report this before any overlap numbers.
- **Failed** and **Zero results**: failed queries have no metrics; zero-result queries show which side found nothing.
- **Page warnings** (storefront captures, `parseWarnings`): the page selectors did not match part of the page, so tiles, the total, or filters may be missing. Each warning names the page profile key to check. Fix the profile before reading any comparison.

Then describe the differences:

- **Overlap@k** (`results.overlap.atK`): share of the top `k` products both sides returned, computed up to the shorter list. Low overlap between lexical and semantic search is normal; in a before/after comparison it shows how much changed.
- **Only B / Only C** (`baselineOnlyIds`, `candidateOnlyIds`): products only one side returned, in rank order.
- **Top-1**, `firstDivergenceRank`, and `displacement.topMovers`: where the order of shared products changed.
- **Refinement differences** and the refinement table (`refinements`, `summary.refinementAttributes`): facets only one side returned, and facet values that differ. A refinement that is **Only B** or **Only C** for every query is one the other side never returns, for example a facet the semantic engine has no values for; report it by name.
- **Refinement count differences** (`refinements.changed[].countChanges`): values both sides returned with different hit counts. Between engines that match different products this is expected; it matters when the totals are close or when both captures come from the same engine.
- **Sort options** and **Sorting differences** (`sorting`): sorting options only one side offers. Report options shoppers would lose, for example a top-sellers or newest sort only the baseline offers.
- **Price order** and **Price B/C** (only when a capture asked for a sort): `ascending` or `descending` shows the price sort was applied; `unordered` on one side means that engine did not sort by the hit price. Do not rely on **Selected sort**: a response can name the requested option even when the hits are not in that order. Hit prices of masters and sets are their lowest price, so a sort by the highest price can read as `unordered`.
- **Totals with and without a sort or refinement** (same engine): a sort should not change the totals, and a refinement can only lower them. Totals that drop under a sort, or stay the same under a refinement for every query, are worth reporting.

When one side is a storefront capture, the diff warns that the sources differ. Storefront tiles can show variants where the API returns masters, so low overlap with matching product names can be an ID difference rather than a ranking difference; check the names in the capture before reporting it. A storefront capture has no search mode, so its **Served by** column is `unreported`.

## Recovery

| Symptom                                              | Action                                                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `All N search request(s) failed`                     | Read the HTTP status and message; fix the cause before retrying. The capture file is still written                         |
| 401 or 403 from search                               | Check the client's scopes and channels with `b2c slas client get`                                                          |
| Token request fails with a public client             | Pass `--redirect-uri` with a URI registered on the client, or use a private client and its secret                          |
| Diff warns `Captures differ in ...`                  | Recapture with the same settings                                                                                           |
| Diff warns `Captures differ in sort`                 | Expected when each engine was captured with its own sorting option ID; otherwise recapture with the same `--sort`          |
| `All N page request(s) failed`                       | Read the status. A 401 error says whether the storefront password is missing or was not accepted                           |
| Storefront page warnings for every page              | Save the pages with `--save-html`, find the elements in the HTML, and pass a `--profile` JSON file                         |
| Storefront results look stale                        | Recapture with `--bypass-page-cache`                                                                                       |
| Storefront result has `redirectedTo`                 | A search redirect sent the query to another page; the capture reads the page it was sent to                                |
| Diff lists queries found in only one capture         | Use the same query file for both captures                                                                                  |
| `Invalid refinement` or `At most 9 refinements`      | Pass each refinement as `attribute=value`, at most 9, and quote values that contain spaces or parentheses                  |
| Price order `unordered` where the sort was requested | Check the sort ID against that side's `sortingOptions`; an ID the engine does not offer may fall back to its default order |

## References

- CLI reference: [Search Commands](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/search.md) (`b2c docs read cli-search`).
- Routing between engines: [Search Mode A/B Testing](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-search-mode-ab-testing.html).
