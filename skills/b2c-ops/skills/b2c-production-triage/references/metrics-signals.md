# Metrics signals catalog

Shared reference for the b2c-ops runbooks: every Metrics API category, the
metrics and dimensions each one returns, what each signal can and cannot show,
and which symptom it answers. Verified against live production data; confirm
`metricId`, `title` and `description` in the response before quoting a number,
because the API is a closed beta and can change.

This catalog is a reference, not a procedure. For an incident, follow the
runbook for the symptom and use this page to read what it returns:

- Slow or erroring pages or APIs, cache or hook latency: [performance triage](skill://b2c-ops/b2c-performance-triage/SKILL.md).
- External service calls failing, slow or stopped: [integration triage](skill://b2c-ops/b2c-integration-triage/SKILL.md).
- Checkout or orders: [checkout triage](skill://b2c-ops/b2c-checkout-triage/SKILL.md). Edge or bot traffic: [edge traffic triage](skill://b2c-ops/b2c-edge-traffic-triage/SKILL.md).

## Access and failure modes

`metrics_get` (CLI `b2c metrics <category>`) needs the Metrics API enabled for
the organization, an API client with scope `sfcc.metrics`, and a tenant filter
for the target org. These are access gaps, not "no errors":

- "not enrolled in the beta program": the org is not enabled. Stop using metrics;
  continue with logs, CIP and job evidence.
- 403: client role, scope or tenant filter. 404: category not enabled. 503: retry later.
- A category can succeed with every series empty (for example `mrt` on a tenant
  without Managed Runtime). Empty means no data for that category, not healthy.

## Reading the data

- **Granularity**: 1 minute (`hookExecutionTimes` is 15 minutes). Max request
  window 24 h; retention 30 days. Treat timestamps as UTC.
- **Response size**: a 24 h request can return hundreds of KB (1440 points per
  series) and exceed the tool's output limit. During an incident use 15-60
  minute windows, then widen only the category you need. Prefer the filters
  (`apiFamily`, `ocapiCategory`, `thirdPartyServiceId`) to cut series.
- **Summaries first**: MCP `metrics_get` with `summarize: true` replaces each
  series' points with `points`, `sum`, `min`, `max`, `avg`, `maxAt`, `firstAt`
  and `lastAt`. Use it for the first sweep and the comparison window, then
  request raw points only for the series and window you need to date a change.
  `points` counts only intervals with data, so `avg` of a sparse latency series
  is the mean over intervals with calls; `sum` of a count series is the total.
- **Fixed windows for comparison**: take the incident window and a comparison
  window of equal length (same hours the previous day, or last week for weekly
  seasonality) as two calls. Do not compare a 24 h average with a 15 minute peak.
- **Zero-filled vs sparse**: counts (`callsCount`, `totalCalls`) are usually
  zero-filled; latency and rate series (`callsP95`, `callsMean`, `hookExecutionTimes`)
  only have points in intervals that had events. A missing latency point means
  no calls, not fast calls. Do not treat gaps as zero or interpolate.
- **Placeholder series**: a series whose `id` equals its `metricId` and whose
  `data` is empty is a placeholder (no events). `orders` returns three series
  with the same id and `mrt` `errorRate` returns two, so series cannot be told
  apart by id; do not guess which is which.
- **Series ids are packed strings**; use `tags` (default on) to group. Most
  categories prefix ids with `<realm>_<environment>` (for example `bdpx_prd.Home-Show`);
  `ecdn` uses the bare realm. Tags besides `realm`, `environment` and applied
  filters are parsed best-effort; unparsed ids land in `series`.
- **Filters drill down**: `apiFamily=shopper` returns finer series (family.api.version),
  not a subset. The series label `product` is not the valid filter value
  (`products`). Start unfiltered, find the outlier, then drill in.
- **Rollups are not parts**: do not add `aggregation=overall` to per-family series.
- Metrics are aggregates. They show where and when, not which customer, order
  or request. Pair with logs, jobs, CIP or order data for the affected records.
- Pair every rate with volume. A latency or error ratio over a handful of
  calls is noise.

## Categories

### `overall` (no dimensions)

| Metric                            | Unit      | Reads as                                                                                                                                          |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `totalCalls`                      | calls/min | All platform requests. First check for "is traffic different?"                                                                                    |
| `requests`                        | calls/min | Storefront (SFRA) requests across sites; excludes includes and OCAPI.                                                                             |
| `sessions`                        | count/min | Active sessions including storefront, OCAPI, Business Manager and job sessions. A sessions rise without request rise can be a job or integration. |
| `responseTime`, `responseTimeP95` | s         | Average and p95 across all requests. Rising p95 with flat average is tail latency.                                                                |
| `systemWorkload`                  | %         | Realm resource utilization. Sustained high values mean capacity pressure, not a single bad request.                                               |
| `emailsSent`                      | count/min | Series `SuccessCount` only; no failure series. Zero or empty does not prove email is broken.                                                      |

### `sales` (no dimensions)

| Metric                             | Reads as                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `basketCreations`, `basketUpdates` | Shopper activity per minute across sites. A drop with healthy `overall` traffic points at cart/checkout, not edge or traffic.                                                                                                              |
| `orders`                           | Placed, failed and cancelled orders per minute across sites (three series sharing one id). Order of series is not documented: do not label them. Use [order failure triage](skill://b2c-ops/b2c-order-failure-triage/SKILL.md) for counts. |

### `scapi` (dimension `apiFamily`, `statusClass`, `cacheStatus`)

Latency is measured at the SCAPI zone in the edge network, so it includes
network and cache effects.

| Metric                   | Reads as                                                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requestLatency`         | Per-`apiFamily` average seconds plus an `aggregation=overall` rollup. Families seen: `custom`, `experience`, `product`, `shopper`. One family high with the rollup normal = that API or its hooks. |
| `responseCount`          | Per-`apiFamily` counts plus `statusClass` series (`2xx`, `3xx`, `4xx`, `5xx`) in the same metric. Group by tag before summing; family series and class series each total all calls.                |
| `errors4xx`, `errors5xx` | Counts per `apiFamily`. `errors5xx` returns only a placeholder when there were none.                                                                                                               |
| `cacheHitRate`           | Despite the name, counts by `apiFamily` and `cacheStatus` (`MISS` seen; `HIT` and partial hits when present). Compute hit share yourself; empty placeholders appear when no cached responses.      |

### `ocapi` (dimension `ocapiCategory`, `ocapiApi` filter)

`totalCalls`, `callsMean` (s), `totalErrors`, `errors4xx`, `errors5xx`. Category
seen: `shop`. Use for OCAPI-based integrations, mobile apps, and legacy
storefront code. `callsMean` hides tail latency; error series are placeholders
when there were no errors.

### `controller` (dimension `controller`)

`totalCalls`, `callsMean` (s), `totalErrors` per SFRA controller route
(`Home-Show`, `Product-Show`, `Search-Show`, `Cart-*`, `Checkout-Begin`,
`CheckoutServices-SubmitPayment`, `CheckoutServices-PlaceOrder`, `Order-Confirm`,
`Account-Show`, `Login-Show`). The list is curated; routes without traffic
return empty series, and names can differ by case (`Search-ShowAjax` and
`search-showajax`). Checkout controllers at zero calls while browse controllers
are normal localizes a checkout-path problem. `totalErrors` covers fewer
controllers than `totalCalls`; absent is not zero.

### `scapi-hooks`

`hookExecutionTimes` (15 minute points, a `Shop average` series seen) and
`hookErrors`. A plateau change in hook time (for example 0.08 s to 0.25 s) is the
signal: correlate its start with a code activation or a dependency change.
`hookErrors` is a placeholder when there are none. Hook time is added to SCAPI
latency for the affected family.

### `third-party` (dimension `host`, `exceptionType`)

The only metric source for outbound service-framework calls, per host.

| Metric             | Reads as                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `callsCount`       | Calls per minute per host, zero-filled. A step to zero means the caller stopped, the feature was off, or the service was disabled.       |
| `callsP95`         | p95 seconds per host, sparse. Rising p95 with stable calls = provider slowdown. Compare to the host's own baseline; hosts differ widely. |
| `remoteExceptions` | Count per host and `exceptionType` (`socketReadTimeout` seen). Other exception types appear only as they occur.                          |

Not available: HTTP status or error body, service ID or name (host only),
payload, circuit-breaker or disabled state, and per-request detail. Use service
logs, the service definition in Business Manager, and the provider's status.

### `ecdn` (dimension `host`, `statusClass`)

`successAndError` (series `2xx` and combined `4xx/5xx` per host), `totalRequests`,
`cacheHits` (%), `totalBandwidth`, `totalPageviews`, `totalUniques`. The response
includes every host in the realm across environments (dev, staging, production,
Business Manager, API); filter to production hosts before concluding. Values
are rate-like averages over the window and come back as one point per host for
short windows. 403, 429 and 5xx are not separated and there is no per-path,
user agent or source data; use [edge traffic triage](skill://b2c-ops/b2c-edge-traffic-triage/SKILL.md)
for sources and rules.

### `mrt`

`requestCount`, `cacheHitRate`, `errorRate` (%; two same-id series), `lambdaInvocations`
(SSR), `requestTime` (s). Series are empty for realms without Managed Runtime
data. No dimensions; no per-route breakdown.

## Symptom to signal

| Symptom                    | Start with                                                                  | Split by                           | Confirms                                                                    | Rules out / next                                                                                         |
| -------------------------- | --------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Is anything different?     | `overall` `totalCalls`, `responseTimeP95`, `systemWorkload`                 | none                               | Start minute, scale, compare window                                         | Nothing changed: ask what the reporter saw                                                               |
| Headless/PWA API slow      | `scapi` `requestLatency`                                                    | `apiFamily`                        | One family vs all; rollup                                                   | Then `scapi-hooks`, `third-party`, [performance triage](skill://b2c-ops/b2c-performance-triage/SKILL.md) |
| Headless/PWA API errors    | `scapi` `responseCount` `statusClass`, `errors4xx/5xx`                      | `apiFamily`                        | 5xx vs 4xx, which family                                                    | 4xx after a release or credential change = client/config; 5xx on custom family = hook or custom API code |
| SFRA page slow or erroring | `controller` `callsMean`, `totalErrors`                                     | `controller`                       | Single route vs all routes                                                  | One route: its code/integration; all routes: platform, DB, edge                                          |
| Checkout/cart failing      | `controller` `Cart-*`, `Checkout*`, `Order-Confirm`; `sales` baskets/orders | `controller`                       | Checkout path at zero or erroring while browse is normal                    | [Checkout triage](skill://b2c-ops/b2c-checkout-triage/SKILL.md)                                          |
| Orders falling             | `sales` baskets, `overall` traffic                                          | none                               | Fewer baskets (traffic/shopper) vs baskets but no orders (checkout/payment) | [Order failure triage](skill://b2c-ops/b2c-order-failure-triage/SKILL.md)                                |
| External service failing   | `third-party` `callsCount`, `callsP95`, `remoteExceptions`                  | `host`, `exceptionType`            | See [integration triage](skill://b2c-ops/b2c-integration-triage/SKILL.md)   | Logs and service configuration for cause                                                                 |
| Hooks slow or failing      | `scapi-hooks`                                                               | none                               | Step change time; `hookErrors`                                              | Code activation; hook's dependencies                                                                     |
| Cache/origin load          | `scapi` `cacheHitRate`; `ecdn` `cacheHits`, `totalRequests`                 | `apiFamily`, `cacheStatus`, `host` | Hit share fall plus volume/latency rise                                     | Config or code that made responses uncacheable; purge; bots                                              |
| Edge errors, bot load      | `ecdn` `successAndError`, `totalRequests`, `totalBandwidth`                 | `host`, `statusClass`              | Which prod host, error share, bandwidth jump                                | [Edge traffic triage](skill://b2c-ops/b2c-edge-traffic-triage/SKILL.md)                                  |
| Capacity                   | `overall` `systemWorkload`, `sessions`                                      | none                               | Sustained workload with sessions from jobs                                  | [Job health](skill://b2c-ops/b2c-job-health/SKILL.md) for overlapping jobs                               |
| OCAPI integration          | `ocapi`                                                                     | `ocapiCategory`                    | Calls, mean duration, errors                                                | Drill with `ocapiApi`                                                                                    |
| MRT/PWA Kit SSR            | `mrt`                                                                       | none                               | `errorRate`, `requestTime`, `lambdaInvocations`                             | MRT logs; empty = no MRT data                                                                            |

## Interpreting combinations

- `third-party` p95 up, `scapi` or `controller` latency up for the routes that
  call it, calls flat: the dependency is slow; the platform and this code are not
  the first suspect.
- `third-party` calls to zero and a feature broken: caller stopped, service
  disabled or configuration removed; check service config and logs.
- `scapi` latency up with `cacheHitRate` share down and volume up: load or
  uncacheable responses; check edge and bots.
- `scapi` latency up for one family and `scapi-hooks` time stepped up at the
  same minute: hook or its dependency.
- `controller` errors on one route and no `scapi` change: SFRA code or integration.
- `overall` p95 up and `systemWorkload` high: capacity or overlapping jobs.
- Errors starting at a minute boundary matching a code activation, job start or
  configuration change: correlate with `code-version-inspect` and job executions.
- Sparse series: absence of points is absence of calls, not zero latency.

## What not to conclude

Do not name a root cause from metrics alone, report a rate without its volume,
compare windows with different seasonality or length, recommend a change from
one series, or call a category healthy when its series are empty. State the
signal, the comparison window, the volume, and what would confirm or refute it.
