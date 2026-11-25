---
name: b2c-search
description: Test Agentic Commerce Search (semantic search) against native (lexical) search on a B2C Commerce site with the b2c CLI and the Shopper Search API. Check that Agentic Commerce Search is serving, capture results for a query list with each engine, add price sorts and facet refinements, and compare the captures query by query. Use this skill whenever the user wants to check whether Agentic Commerce Search is on or serving, smoke test or compare lexical (native) and semantic search, measure result overlap or rank changes, compare facets, facet hit counts, or sorting options between engines, check that a sort or a refinement is applied, find queries that return identical or empty results, or compare search results before and after a search setting changes, even if they just say "compare search results" or "did search change after the switch". For the storefront search page itself, including a baseline taken before Agentic Commerce Search is turned on, use b2c-search-storefront.
---

# B2C Search Skill

Test Agentic Commerce Search (ACS, the semantic engine) against native (lexical) search through the Shopper Search API. `b2c search status` checks whether ACS is serving a site, `b2c search capture` runs a query list through `productSearch` and saves the ranked results with their prices, refinements, and sorting options, `b2c search diff` compares two captures query by query, and `b2c search analyze` compares up to four captures (storefront and API, native and semantic) and lists findings with likely causes. `diff` and `analyze` report differences only and have no pass or fail verdict, so summarize what changed and let the user decide what is acceptable.

To capture the storefront search page, or to measure what shoppers see before and after ACS is turned on, use `b2c-cli:b2c-search-storefront` with this skill.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli search status --query "red dress"`).

## Configuration

`search status` and `search capture` search as a guest shopper with a SLAS token. They do not use an Account Manager API client. Values resolve from `dw.json` / `SFCC_*` env vars / the active instance; add flags only to override configured values:

- `--tenant-id` / `SFCC_TENANT_ID` / `tenantId`
- `--short-code` / `SFCC_SHORTCODE` / `shortCode`
- `--site-id` / `SFCC_SITE_ID` / `siteId`
- `--slas-client-id` / `SFCC_SLAS_CLIENT_ID` / `slasClientId`
- `--slas-client-secret` / `SFCC_SLAS_CLIENT_SECRET` / `slasClientSecret` (private clients only)

The SLAS client needs the `sfcc.shopper-product-search` scope and the site in its channels. A public client gets the token through PKCE, so `--redirect-uri` must match a URI registered on the client (default `http://localhost:3000/callback`). To find or create a client, see `b2c-cli:b2c-slas`. Run `b2c setup inspect` to see resolved values (see `b2c-cli:b2c-config`). `search diff` and `search analyze` read local files and need no configuration.

## Procedure

### 1. Check that Agentic Commerce Search is serving

Run `status` with two or three multi-word queries that match products in the catalog (1 to 5 are allowed, and each sends three requests). Single-word queries can be served by native search even when ACS is on, so they cannot show whether ACS serves the site.

```bash
b2c search status --query "red dress" --query "men's running shoes" --query "gift for a runner"
```

The table lists each request and the engine that served it (`Served by`). Below it, `Agentic Commerce Search:` reads `serving`, `not serving`, or `unknown`, and `Site default engine:` names the engine that answers requests that do not pin a search mode (`semantic`, `lexical`, `mixed`, `unreported`, or `failed`). With `--json`, read `agenticCommerceSearch` (`serving`, `not-serving`, or `unknown`), `siteDefault`, `semanticRequests`, `probes`, and `warnings`. Relay every warning to the user.

| Result        | Meaning                                                                                                                                    | Action                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `serving`     | A semantic request was served by ACS                                                                                                       | Continue with step 2                                    |
| `not-serving` | The API rejected `searchMode=semantic`, or multi-word semantic requests fell back to native search: ACS is off, provisioning, or not ready | **Stop and ask the user** (below)                       |
| `unknown`     | The requests do not settle it: only single-word queries fell back, the API did not report the engine, or requests failed                   | **Ask the user to confirm in Business Manager** (below) |

`serving` says ACS answers when asked. If `Site default engine` is `lexical` or `mixed`, requests that do not pin a search mode still get native search for some or all queries, which is what the storefront sends. The captures below pin `--search-mode`, so they still compare the two engines; tell the user.

**`not-serving`: stop here.** A semantic capture now would compare native search with itself. Do not change Business Manager yourself. Tell the user:

- ACS is not serving this site. To turn it on, open Business Manager, go to Merchant Tools > Agentic Commerce Search, choose the site in the Site dropdown, then Search Dashboard > Go to Search Preferences > Enable Agentic Commerce Search. Some releases put Search Preferences under Merchant Tools > Search > Search Preferences. Provisioning takes about two to three days, and `status` keeps reporting `not-serving` until it completes.
- If Business Manager has no Merchant Tools > Agentic Commerce Search menu, the feature is not available on that instance yet. Stop, and tell the user to ask their Salesforce account team to make it available. Do not call this a permissions problem. Only when the menu is there but the Enable toggle is read-only does their Business Manager role need write access to the Agentic Commerce Search module.
- If they also want to compare what shoppers see on the storefront, take the storefront baseline first with `b2c-cli:b2c-search-storefront`. Once ACS is on, the storefront page can no longer show native results. Native results from this API stay available, because `--search-mode lexical` pins the engine.

Wait for the user to say ACS is on, then run `status` again. Continue only when it reports `serving`.

**`unknown`: ask first.** Read the warnings; they say which case applies. If you used single-word queries, run `status` again with multi-word ones. If requests failed, check the site ID, the SLAS client, and `--locale` and `--currency`. If the API did not report the engine that served each request (`effectiveSearchMode`), fallbacks cannot be detected. If it stays `unknown`, ask the user to confirm in Business Manager (Merchant Tools > Agentic Commerce Search > Search Dashboard) that ACS is enabled and provisioning has finished, and wait for the answer. If they confirm, continue and say in the report that the engine could not be verified from the responses. If that menu does not exist, the feature is not available on the instance yet; handle it as `not-serving`.

### 2. Choose the queries

Ask the user for the queries that matter to them (top searches, zero-result searches, complaints) and complete the list so it covers:

- single words and product types (`shirt`), where semantic search can fall back to native
- multi-word and attribute queries (`red dress`, `black leather boots`)
- descriptive or intent queries (`warm jacket for hiking`, `gift for a runner`), where semantic search is expected to differ most
- synonyms and misspellings (`sneakers` and `trainers`, `shrit`)
- brand names, product names, and IDs, where native search is often strong
- queries known to return few or no results

Fifteen to thirty queries show patterns. Write them to `queries.txt`, one per line (`#` starts a comment), and use that same file for every capture.

### 3. Capture the baselines

```bash
b2c search capture --queries-file queries.txt --search-mode lexical --output scapi-lexical.json
b2c search capture --queries-file queries.txt --search-mode semantic --output scapi-semantic.json
```

Check the `Served by` column of the semantic capture before going on. Requests served by `lexical` are fallbacks, so return to step 1.

### 4. Sorting

Native search offers the site's sort rules. ACS replaces them with its three built-in options: AI-Driven Relevance, Price: High to Low, and Price: Low to High. Merchants choose which of them appear, rename them, and set the default order, so take the option IDs from the captures' `sortingOptions`, never from assumed names; `sortingOptionLabels` holds the label shoppers see for each ID. The price sorts need price books, and products without price data do not sort correctly. List the sort option IDs and labels each engine returned:

```bash
jq -r '(reduce .results[] as $r ({}; . + ($r.sortingOptionLabels // {}))) as $l | [.results[].sortingOptions // [] | .[]] | unique[] | [., ($l[.] // "-")] | @tsv' scapi-lexical.json
jq -r '(reduce .results[] as $r ({}; . + ($r.sortingOptionLabels // {}))) as $l | [.results[].sortingOptions // [] | .[]] | unique[] | [., ($l[.] // "-")] | @tsv' scapi-semantic.json
```

Explain to the user which options each engine offers, which only one engine offers, and which shoppers would lose.

**If the semantic list has no price sort** although the queries returned results, the ACS sort options are probably not set up to show one. Do not report that as a difference between the engines. **Stop and ask the user** to configure the ACS sort options in Business Manager (Merchant Tools, after provisioning completes; `b2c docs read help-merchant/b2c_acs_configure_sort_options`), wait for the answer, then recapture `scapi-semantic.json` and list the options again before the price-sort round. If an ID does not say whether it sorts by price, capture a few queries with `--sort <id>` and read the **Price order** column, or ask the user, before you conclude there is no price sort. If the native list has no price sort, report that and ask whether to skip the native price captures.

By default capture the two price sorts, each engine with its own option ID. The IDs below are examples; use the IDs from the lists above:

```bash
b2c search capture --queries-file queries.txt --search-mode lexical --sort price-low-to-high --output scapi-lexical-price-asc.json
b2c search capture --queries-file queries.txt --search-mode semantic --sort price-low-to-high --output scapi-semantic-price-asc.json
b2c search capture --queries-file queries.txt --search-mode lexical --sort price-high-to-low --output scapi-lexical-price-desc.json
b2c search capture --queries-file queries.txt --search-mode semantic --sort price-high-to-low --output scapi-semantic-price-desc.json
```

**Ask the user** whether to add any other option found, for example top sellers or newest, and wait for the answer.

### 5. Facets

Facets (refinements) are the filters shoppers use to narrow a result list, each value with a count of matching products. List each attribute a capture returned with its label, the most values any query returned, and the number of queries that returned it:

```bash
jq -r '[.results[].refinements[]] | group_by(.attributeId)[] | [.[0].attributeId, (.[0].label // "-"), (map(.values | length) | max), length] | @tsv' scapi-lexical.json
jq -r '[.results[].refinements[]] | group_by(.attributeId)[] | [.[0].attributeId, (.[0].label // "-"), (map(.values | length) | max), length] | @tsv' scapi-semantic.json
```

Explain what you found: the facets both engines return, any only one returns, and the attribute IDs that `--refine` takes (custom attributes start with `c_`). Then **ask the user** and wait for the answers:

1. **Add `--refine orderable_only=true`?** ACS shows products that cannot be ordered by default (its Show Only Orderable Products setting is off), while native search may hide them, depending on the site's Show Orderable Products Only search preference and each product's Searchable If Unavailable setting. Without the refinement, totals and top results can differ because of unavailable products rather than ranking. With it on both engines, the comparison is like for like. It counts toward the limit of 9 refinements.
2. **Add one or two facet value refinements?** Pick values both engines return with a healthy count, such as a color or a brand. To list the values of one attribute, most frequent first:

   ```bash
   jq -r --arg a c_refinementColor '[.results[].refinements[] | select(.attributeId == $a) | .values[]] | group_by(.value)[] | [.[0].value, (map(.hitCount // 0) | add)] | @tsv' scapi-semantic.json | sort -t$'\t' -k2,2nr | head
   ```

### 6. Capture the variants

Capture each variant on both engines with identical settings. Use the facet `value`, not its label, and quote values that contain spaces or parentheses:

```bash
b2c search capture --queries-file queries.txt --search-mode lexical --refine orderable_only=true --output scapi-lexical-orderable.json
b2c search capture --queries-file queries.txt --search-mode semantic --refine orderable_only=true --output scapi-semantic-orderable.json
b2c search capture --queries-file queries.txt --search-mode lexical --refine c_refinementColor=Red --output scapi-lexical-color-red.json
b2c search capture --queries-file queries.txt --search-mode semantic --refine c_refinementColor=Red --output scapi-semantic-color-red.json
```

Name every file `scapi-<engine>[-<variant>].json`. The storefront skill uses `storefront-<engine>[-<variant>].json`, so the captures line up for `analyze`.

### 7. Compare

```bash
b2c search diff scapi-lexical.json scapi-semantic.json --k 1,5,10
b2c search diff scapi-lexical-price-asc.json scapi-semantic-price-asc.json
b2c search diff scapi-lexical.json scapi-semantic.json --json > diff.json
b2c search analyze --scapi-lexical scapi-lexical.json --scapi-semantic scapi-semantic.json --output analysis.json
```

Run `diff` for each pair and read the results as described below. `analyze` adds findings with likely causes; to include storefront captures too, see `b2c-cli:b2c-search-storefront`. Summarize per variant what changed and what the user should look at. Do not declare a pass or fail.

### Other comparisons

To measure a change on one engine, such as a reindex or a search setting, capture before and after with the same settings and `diff` them. If requests with `--search-mode` fail, capture without it; the site default engine then answers.

```bash
b2c search capture --queries-file queries.txt --label before --output before.json
b2c search capture --queries-file queries.txt --label after --output after.json
b2c search diff before.json after.json
```

## Reading the Results

Check these first, because they decide whether the rankings can be compared at all:

- **Served by / `effectiveSearchMode`**: the engine that served each request. `(fallback)` or **Mode fallbacks** above 0 means the requested engine was not used, for example because the semantic index is not ready. A fallback query compares lexical with lexical; report it separately. `-` or `unreported` means the API did not report the engine.
- **Distinct result lists** well below **With hits**, or **Largest shared list** above 1: different queries returned the identical ranked list, so the engine may be ignoring the query text. Report this before any overlap numbers.
- **Failed** and **Zero results**: failed queries have no metrics; zero-result queries show which side found nothing.

Then describe the differences:

- **Overlap@k** (`results.overlap.atK`): share of the top `k` products both sides returned, computed up to the shorter list. Low overlap between lexical and semantic search is normal; in a before/after comparison it shows how much changed.
- **Only B / Only C** (`baselineOnlyIds`, `candidateOnlyIds`): products only one side returned, in rank order.
- **Top-1**, `firstDivergenceRank`, and `displacement.topMovers`: where the order of shared products changed.
- **Refinement differences** and the refinement table (`refinements`, `summary.refinementAttributes`): facets only one side returned, and facet values that differ. A refinement that is **Only B** or **Only C** for every query is one the other side never returns; report it by name.
- **Refinement count differences** (`refinements.changed[].countChanges`): values both sides returned with different hit counts. Between engines that match different products this is expected; it matters when the totals are close or when both captures come from the same engine.
- **Sort options** and **Sorting differences** (`sorting`): sorting options only one side offers. Report options shoppers would lose, for example a top-sellers or newest sort only the baseline offers. ACS shows only the built-in options a merchant enabled, so say when a missing option is a configuration choice rather than an engine difference. Merchants also set the ACS default order: if **Selected sort** shows ACS applying a price or other non-relevance sort by default, the default-order comparison is between two different sorts, so say that before reporting ranking differences.
- **Price order** and **Price B/C** (only when a capture asked for a sort): `ascending` or `descending` shows the price sort was applied; `unordered` on one side means that engine did not sort by the hit price. Do not rely on **Selected sort**: a response can name the requested option even when the hits are not in that order. Hit prices of masters and sets are their lowest price, so a sort by the highest price can read as `unordered`.
- **Totals with and without a sort or refinement** (same engine): a sort should not change the totals, and a refinement can only lower them. Totals that drop under a sort, or stay the same under a refinement for every query, are worth reporting.

`analyze` findings each carry a `code`, a severity (`warning`, `notice`, or `info`), a message, likely causes, the affected queries, and examples. Report warnings first, name the affected queries, and present the likely causes as possibilities to check, not conclusions.

## Recovery

| Symptom                                              | Action                                                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `status` reports `not-serving` after ACS was enabled | Provisioning takes about two to three days; wait, and run `status` again before capturing semantic results                 |
| `status` reports `unknown`                           | Use multi-word queries and check the warnings; if it stays `unknown`, ask the user to confirm in Business Manager          |
| No Agentic Commerce Search menu in Business Manager  | The feature is not available on the instance yet: ask the user to contact their Salesforce account team (step 1)           |
| The Enable toggle is read-only                       | The user's role needs write access to the Agentic Commerce Search module (step 1)                                          |
| Semantic capture lists no price sort                 | The ACS sort options need configuring in Business Manager; it is not an engine difference (step 4)                         |
| `All N search request(s) failed`                     | Read the HTTP status and message; fix the cause before retrying. `capture` still writes its file                           |
| 401 or 403 from search                               | Check the client's scopes and channels with `b2c slas client get`                                                          |
| Token request fails with a public client             | Pass `--redirect-uri` with a URI registered on the client, or use a private client and its secret                          |
| Diff warns `Captures differ in ...`                  | Recapture with the same settings                                                                                           |
| Diff warns `Captures differ in sort`                 | Expected when each engine was captured with its own sorting option ID; otherwise recapture with the same `--sort`          |
| Diff lists queries found in only one capture         | Use the same query file for both captures                                                                                  |
| `Invalid refinement` or `At most 9 refinements`      | Pass each refinement as `attribute=value`, at most 9, and quote values that contain spaces or parentheses                  |
| Price order `unordered` where the sort was requested | Check the sort ID against that side's `sortingOptions`; an ID the engine does not offer may fall back to its default order |

## References

- CLI reference: [Search Commands](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/search.md) (`b2c docs read cli-search`).
- Routing between engines: [Search Mode A/B Testing](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-search-mode-ab-testing.html).
- Turning ACS on and its settings: `b2c docs read help-merchant/b2c_acs_enable`, `b2c docs read help-merchant/b2c_acs_prerequisites`, `b2c docs read help-merchant/b2c_acs_introduction`, and `b2c docs read help-merchant/b2c_acs_configure_sort_options`.
- Orderable products in native search: `b2c docs read help-merchant/b2c_show_orderable_products_only_at_the_product_level`.
