---
name: b2c-search-storefront
description: Capture what a B2C Commerce storefront search page shows for a list of queries with the b2c CLI, take a native search baseline before Agentic Commerce Search is turned on, and compare the storefront before and after the switch and against the Shopper Search API. Use this skill whenever the user wants to snapshot the storefront search results before enabling Agentic Commerce Search, compare the storefront search page before and after the switch, check that the storefront shows what the Shopper Search API returns for native (lexical) or semantic search, check whether the storefront is really serving Agentic Commerce Search, compare storefront sorting and filters across engines, or read search results from a password protected storefront, even if they just say "what does the storefront show" or "save the search page first". For comparing lexical and semantic search through the API alone, use b2c-search.
---

# B2C Search Storefront Skill

Use `b2c search capture-storefront` to read the search results page of a storefront for a list of queries: the ranked product tiles, the result count, the filters (refinements), and the sorting options. It requests the server-rendered page over HTTP as an anonymous shopper, with no browser and no JavaScript, and writes the same format as `b2c search capture`. `b2c search diff` and `b2c search analyze` then compare storefront pages with each other and with Shopper Search API results. They report differences only and have no pass or fail verdict, so summarize what changed and let the user decide what is acceptable.

The main use is a storefront test around turning on Agentic Commerce Search (ACS, the semantic engine). Once ACS is serving, the storefront can no longer show native (lexical) results, so capture the native baseline first. The order is: baseline, the user turns ACS on, the same captures again, then compare.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli search capture-storefront --query shirt`).

## Configuration

`search capture-storefront` needs no API client. Values resolve from `dw.json` / `SFCC_*` env vars / the active instance; add flags only to override configured values:

- `--server` / `SFCC_SERVER` / `hostname`: the storefront host, or an origin such as `http://localhost:8080`
- `--site-id` / `SFCC_SITE_ID` / `siteId`
- `SFCC_STOREFRONT_PASSWORD`: the storefront password, when the storefront is password protected (development and staging storefronts often are). The user name defaults to `storefront` (`--storefront-user` / `SFCC_STOREFRONT_USER`). Use the environment variable rather than `--storefront-password` so the password stays out of the process list and shell history, and never print it or write it to a file.

**Ask the user which storefront host to test**, and send requests only to a host the user named. The host in the configuration is the instance host, which may not be the storefront they mean. Keep the default `--delay` so the capture does not load the site.

The preflight check and the API captures use a SLAS client; see `b2c-cli:b2c-search` for that configuration, `b2c-cli:b2c-slas` for the client, and `b2c-cli:b2c-config` to see the resolved values (`b2c setup inspect`).

## Choose a Path

| Situation                                                  | Path                                                                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ACS is not serving yet and the user wants before and after | The full procedure below                                                                                  |
| ACS is already serving                                     | Preflight step 1: pin the storefront to native search if it honors `searchMode`, or analyze three sources |
| One engine, no ACS involved (storefront against the API)   | Steps 2 and 3, one API capture with the same settings, then `diff`                                        |

## Procedure

### 1. Preflight: is ACS serving?

The baseline has to be taken while the storefront still gets native search. Run `status` with two or three multi-word queries that match products (single words can be answered by native search even when ACS is on):

```bash
b2c search status --query "red dress" --query "men's running shoes" --query "gift for a runner"
```

Read the two lines below the table: `Agentic Commerce Search:` (`serving`, `not serving`, or `unknown`; `--json` uses `not-serving`) and `Site default engine:` (`semantic`, `lexical`, `mixed`, `unreported`, or `failed`), the engine that answers requests without a search mode, which is what the storefront sends. Relay every warning to the user.

| `Agentic Commerce Search` | Meaning                                                                                         | Action                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `not serving`             | Native search still answers searches: ACS is off, provisioning, or not ready                    | Check the menu (below), then take the baseline (steps 2 to 4)                                              |
| `unknown`                 | The requests do not settle it: no engine reported, only single-word queries, or failed requests | **Ask the user** whether ACS is still off or provisioning, and about the menu (below); wait for the answer |
| `serving`                 | ACS answers when asked                                                                          | Read `Site default engine`, below                                                                          |

For `not serving` and `unknown`, **ask the user** before the baseline whether Business Manager shows Merchant Tools > Agentic Commerce Search for the site, and wait for the answer. If it does not, ACS is not available on that instance yet. **Stop** and follow step 5 instead (the user asks their Salesforce account team to make it available), because a baseline is only useful if ACS can be turned on.

When `serving`, the default engine decides whether the baseline is still possible. `lexical`: the storefront still gets native search, so take the baseline now (steps 2 to 4) and ask the user how the site routes search, so the report can say why ACS is on but shoppers do not get it yet. `mixed`: some queries already get ACS, so a storefront capture would mix engines; tell the user and ask before capturing. `semantic`: the window has passed.

When ACS already serves the storefront, a plain storefront capture records ACS results, not the baseline. Choose with the user:

- **Pin the storefront to native search.** A storefront honors `--param searchMode=lexical` only if its search code passes the parameter on to the API. Capture two or three multi-word queries with `--save-html` once with and once without the parameter, and capture the same queries with `b2c search capture --search-mode lexical`. If the pinned page matches the API's lexical results and the unpinned page does not, add `--param searchMode=lexical` to every baseline capture. If both pages are the same, the site ignores the parameter.
- **Skip the storefront lexical baseline.** Capture the storefront once (it shows ACS) and run `analyze` on three sources: `--storefront-semantic`, `--scapi-lexical`, and `--scapi-semantic`. Say in the report that what shoppers saw before ACS was not captured. The API's lexical results stand in for it but do not include custom storefront code.

### 2. Dry run

Write the queries to `queries.txt`, one per line (`#` starts a comment); the query guidance in `b2c-cli:b2c-search` step 2 applies. Start with two or three queries and save the pages:

```bash
b2c search capture-storefront --query "red dress" --query "men's running shoes" --bypass-page-cache --save-html pages/dry-run --output dry-run.json
```

Check the table (`Total`, `Hits`, `Notes`) and any page warnings printed after it. Open one saved page and compare it with what the storefront shows: tile count, result count, filters, and sort menu. Warnings such as "no product tiles found" mean the page selectors do not match this storefront; fix them (see Recovery) before the full run. A page that builds its product list in the browser with JavaScript cannot be read.

### 3. Baseline round

List the storefront's sort options and filters from the dry run (`b2c-cli:b2c-search` steps 4 and 5 explain what to tell the user about them):

```bash
jq -r '(reduce .results[] as $r ({}; . + ($r.sortingOptionLabels // {}))) as $l | [.results[].sortingOptions // [] | .[]] | unique[] | [., ($l[.] // "-")] | @tsv' dry-run.json
jq -r '[.results[].refinements[]] | group_by(.attributeId)[] | [.[0].attributeId, (.[0].label // "-"), (map(.values | length) | max), length] | @tsv' dry-run.json
```

Then decide the variants with the user:

- Default order, plus the two price sorts by default. **Ask the user** whether to add any other sort option found, and wait for the answer.
- One or two facet filters. **Ask the user** which facet values to filter by, and wait for the answer. Use the same attribute and value on the API side.
- `orderable_only` has no URL parameter on the storefront. **Ask the user** whether the native Show Orderable Products Only search preference is on, and note the answer. Keep it in mind for step 5.

Capture each variant with the storefront's own IDs: `srule` takes a sort option ID from the storefront's `sortingOptions`, and `prefn1` and `prefv1` take a filter's attribute ID and value (separate several values with `|`). Storefront attribute IDs have no `c_` prefix, unlike the API's. The IDs below are examples. Always pass `--bypass-page-cache`, and keep the same `--limit`, `--locale`, and `--path` in every capture:

```bash
b2c search capture-storefront --queries-file queries.txt --bypass-page-cache --label storefront-lexical --save-html pages/storefront-lexical --output storefront-lexical.json
b2c search capture-storefront --queries-file queries.txt --bypass-page-cache --param srule=price-low-to-high --label storefront-lexical-price-asc --save-html pages/storefront-lexical-price-asc --output storefront-lexical-price-asc.json
b2c search capture-storefront --queries-file queries.txt --bypass-page-cache --param srule=price-high-to-low --label storefront-lexical-price-desc --save-html pages/storefront-lexical-price-desc --output storefront-lexical-price-desc.json
b2c search capture-storefront --queries-file queries.txt --bypass-page-cache --param prefn1=refinementColor --param prefv1=Red --label storefront-lexical-color-red --save-html pages/storefront-lexical-color-red --output storefront-lexical-color-red.json
```

Save the pages of the baseline: after ACS is on, they are the only record of what the native storefront returned. Add `--param searchMode=lexical` to each command if you pinned the storefront in step 1.

### 4. API lexical baseline

In the same window, capture the API with the same queries and limit, so catalog, price, or inventory changes do not read as engine differences. Use the API's own sort IDs and `c_` attribute IDs (see `b2c-cli:b2c-search` steps 4 to 6):

```bash
b2c search capture --queries-file queries.txt --search-mode lexical --label scapi-lexical --output scapi-lexical.json
b2c search capture --queries-file queries.txt --search-mode lexical --sort price-low-to-high --label scapi-lexical-price-asc --output scapi-lexical-price-asc.json
b2c search capture --queries-file queries.txt --search-mode lexical --sort price-high-to-low --label scapi-lexical-price-desc --output scapi-lexical-price-desc.json
b2c search capture --queries-file queries.txt --search-mode lexical --refine c_refinementColor=Red --label scapi-lexical-color-red --output scapi-lexical-color-red.json
```

### 5. Stop: ask the user to turn on ACS

Skip this step when you pinned the storefront in step 1 and ACS is already serving. Otherwise **stop**. Do not change Business Manager yourself. Tell the user the native baseline is complete (list the files), and ask them to turn ACS on (or, when `status` reported `serving` with a `lexical` default engine, to check that Enable Agentic Commerce Search is on, because requests without a search mode still get native search):

- Business Manager: Merchant Tools > Agentic Commerce Search, choose the site in the Site dropdown, then Search Dashboard > Go to Search Preferences > Enable Agentic Commerce Search. Some releases put Search Preferences under Merchant Tools > Search > Search Preferences.
- If Business Manager has no Merchant Tools > Agentic Commerce Search menu, the feature is not available on that instance yet. Stop, and tell the user to ask their Salesforce account team to make it available. Do not call this a permissions problem. Only when the menu is there but the Enable toggle is read-only does their Business Manager role need write access to the Agentic Commerce Search module.
- A storefront that uses a third-party search provider has to point its search calls to the Shopper Search API before ACS is turned on (`b2c docs read help-merchant/b2c_acs_prerequisites`); otherwise the page may never show ACS results.
- Provisioning takes about two to three days. Until it completes, `status` keeps reporting `not-serving`.
- If they want the totals comparable, the ACS Show Only Orderable Products setting should match the native preference they reported in step 3, because the storefront cannot filter on orderability. If the two differ, the report must say so, since non-orderable products then appear on one side only.
- Until round two is captured, avoid catalog, price, inventory, and search index changes, or note them.

Wait for the user to say ACS is on. The capture files record their own settings, so round two can be repeated from them even in a new session (`jq -c .request storefront-lexical-price-asc.json`), except that `srule` takes the ACS sort option IDs (step 7).

### 6. Confirm ACS is serving

Run the `status` command from step 1 again. Continue only when it reports `Agentic Commerce Search: serving` and `Site default engine: semantic`. If it reports `not serving`, provisioning has not finished; tell the user and wait. The storefront sends no search mode, so it gets the default engine: when `serving` comes with a `lexical` or `mixed` default, the storefront still shows native results for some or all queries. Tell the user and ask how the site routes search before round two, and check the result with `analyze` (`storefront-engine-mismatch`).

### 7. Round two

Capture the default order first (`storefront-semantic.json`) and list its sort options with the first jq command of step 3. ACS replaces the native sort rules with its three built-in options (AI-Driven Relevance, Price: High to Low, and Price: Low to High). Merchants choose which of them appear, rename them, and set the default order, so the IDs can differ from round one and the default capture may not be sorted by relevance. Take the `srule` IDs from this list, never from assumed names; the second column is the label the page shows. **If the storefront now lists no price sort**, the ACS sort options are probably not set up to show one. Do not report that as a difference between the engines. **Stop and ask the user** to configure the ACS sort options in Business Manager (Merchant Tools, after provisioning completes; `b2c docs read help-merchant/b2c_acs_configure_sort_options`), and wait for the answer before the price-sort captures. If the IDs do not say which option sorts by price, ask the user before you conclude there is none.

Repeat the other storefront captures from step 3 with identical settings: the same queries file, `--limit`, `--locale`, `--path`, filter `--param` values, and `--bypass-page-cache`. Only the labels, file names, `--save-html` directories (`storefront-semantic...`), and the `srule` IDs change. Do not add `--param searchMode=lexical`. Then capture the API's semantic results with the settings of step 4:

```bash
b2c search capture --queries-file queries.txt --search-mode semantic --label scapi-semantic --output scapi-semantic.json
```

Capture a semantic API file for each variant too (`--sort` with the ACS option IDs, `--refine` as in step 4), and check the `Served by` column: requests served by `lexical` are fallbacks.

### 8. Compare

Compare the storefront before and after, then analyze all four sources. Run both once for the default order and once for each variant, writing each analysis to its own file:

```bash
b2c search diff storefront-lexical.json storefront-semantic.json --k 1,5,10
b2c search analyze \
  --storefront-lexical storefront-lexical.json --storefront-semantic storefront-semantic.json \
  --scapi-lexical scapi-lexical.json --scapi-semantic scapi-semantic.json \
  --output analysis.json
```

`analyze` accepts any two or more of the four sources. For the variants, pass that variant's four files (for example the `-price-asc` files with `--output analysis-price-asc.json`).

## File Naming

Name every capture `<source>-<engine>[-<variant>].json` and set `--label` to the same name without `.json`, so `diff` and `analyze` name their sides. With a default order, two price sorts, and one filter, a test has sixteen files.

| File                                                      | Contents                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `storefront-lexical.json`                                 | Storefront page, native engine (round one, before ACS)                             |
| `storefront-semantic.json`                                | Storefront page, ACS (round two, after ACS)                                        |
| `scapi-lexical.json`, `scapi-semantic.json`               | Shopper Search API with `--search-mode lexical` or `semantic`                      |
| `<source>-<engine>-price-asc.json` and `-price-desc.json` | The same captures with a price sort                                                |
| `<source>-<engine>-<attribute>-<value>.json`              | The same captures with a facet filter, such as `storefront-lexical-color-red.json` |

Saved pages go in `pages/<name>/`. Keep captures and saved pages out of version control: they contain the storefront host and product data.

## Reading the Results

Read `b2c-cli:b2c-search` (Reading the Results) for overlap, rank, facet, sort, and price order. These points are specific to storefront captures:

- **Page warnings** (`parseWarnings`): part of the page was not read, so tiles, the total, or filters may be missing. Fix the page profile before reading any comparison. A warning that the page shows fewer products than requested with `sz` can mean the storefront caps the page size; use the number it did show as `--limit` on both sides.
- A storefront capture has no search mode, so **Served by** is `unreported`. `analyze` attributes each storefront capture to the API engine it resembles (`closerTo`).
- **Redirects**: a result with `redirectedTo` means a search redirect sent the query to another page, and the capture read that page. Redirect rules still apply when ACS is on.
- **Product IDs**: storefront tiles can be variants or variation groups where the API returns masters. Compare product names before reporting low overlap as a ranking difference.

Report the `analyze` findings that involve the storefront like this (warnings first; no pass or fail):

| Finding                                            | What to report                                                                                                                                                                                                                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storefront-only-products`                         | Products the storefront shows that the API did not return for the same engine. With the same engine this probably points to custom storefront code. Check the names first                                                                                                        |
| `api-only-products`                                | Products the API returned that the storefront did not show: page size, filtered tiles, or ID differences                                                                                                                                                                         |
| `storefront-engine-mismatch`                       | The storefront capture resembles the other engine. After ACS is on, the storefront may still be serving lexical; check `status` (`Site default engine`), the page cache, and that the storefront's search reaches the engine ACS serves (a third-party search provider does not) |
| `engine-change`, `channel-gap-grew`                | What changed on the storefront between rounds, and whether the storefront moved further from the API after the switch                                                                                                                                                            |
| `facets-only-on-storefront`, `facets-only-in-api`  | Filters one channel shows and the other does not                                                                                                                                                                                                                                 |
| `sorting-options-differ`, `price-sort-not-applied` | Sort options shoppers gain or lose (ACS shows only the built-in options a merchant enabled, so a missing one can be a configuration choice); a price sort that did not order the products                                                                                        |

## Recovery

| Symptom                                             | Action                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `All N page request(s) failed`                      | Read the status. A 401 error says whether the storefront password is missing or was not accepted                                                 |
| Storefront page warnings for every page             | Save the pages with `--save-html`, find the elements in the HTML, and pass a `--profile` JSON file (see the CLI reference)                       |
| Storefront results look stale                       | Recapture with `--bypass-page-cache`                                                                                                             |
| Result has `redirectedTo`                           | A search redirect sent the query to another page; the capture reads the page it was sent to                                                      |
| `The q parameter is set by the capture` (or `sz`)   | `q` and `sz` come from the queries and `--limit`; remove them from `--param`                                                                     |
| Round two looks like round one                      | Run `status` and read `Site default engine`; the storefront may still be serving native search. Check `analyze` for `storefront-engine-mismatch` |
| Diff warns `Captures differ in ...`                 | Recapture with the same settings. A difference in `params` limited to `srule` or `searchMode` is expected: ACS has its own sort IDs              |
| No Agentic Commerce Search menu in Business Manager | The feature is not available on the instance yet: ask the user to contact their Salesforce account team (step 5)                                 |
| The Enable toggle is read-only                      | The user's role needs write access to the Agentic Commerce Search module (step 5)                                                                |
| No price sort on the storefront or API after ACS    | The ACS sort options need configuring in Business Manager; it is not an engine difference (step 7)                                               |
| Diff lists queries found in only one capture        | Use the same query file for both captures                                                                                                        |
| 401 or 403 from `status` or `search capture`        | Check the SLAS client's scopes and channels (`b2c-cli:b2c-slas`)                                                                                 |

## Related Skills

- `b2c-cli:b2c-search` - Check that ACS is serving, capture and compare Shopper Search API results, and read the diff
- `b2c-cli:b2c-slas` - Find or create the SLAS client the API captures use
- `b2c-cli:b2c-config` - Resolved instance, site, and credential configuration

## References

- CLI reference: [Search Commands](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/search.md) (`b2c docs read cli-search`), including the page profile keys.
- Turning ACS on, its prerequisites, and its settings: `b2c docs read help-merchant/b2c_acs_enable`, `b2c docs read help-merchant/b2c_acs_prerequisites`, and `b2c docs read help-merchant/b2c_acs_introduction`.
