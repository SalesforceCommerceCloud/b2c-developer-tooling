---
name: b2c-performance-triage
description: Investigate slow or erroring B2C Commerce storefront, SCAPI, OCAPI or SFRA responses using Metrics API signals (overall traffic and p95, SCAPI family latency and status class, SFRA controller duration and errors, SCAPI hook time, cache, third-party calls, system workload, Managed Runtime). Localize a latency or error change to a layer, route or dependency and since when, then hand off with evidence.
---

# Performance and error-rate triage

Outcome: decide where latency or errors changed and since when, rule layers in
or out, and hand off comparable evidence. Metrics localize; they do not prove
cause. Inspection does not authorize changes.

## Scope and impact

Resolve the target with `config_inspect` (CLI: `b2c setup inspect`). Confirm
the storefront type (SFRA, PWA Kit or headless, both), the symptom (slow,
errors, timeouts), the UTC start time, and who is affected. Propose a 60 minute
incident window plus a comparison window of equal length (same hours the
previous day, or last week if weekly seasonality) and label the assumption.
Follow the team's incident process for live impact.

## Access and tools

| Evidence              | Preferred path                                                                                   | Fallback / limit                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Metrics (closed beta) | `metrics_get` per category with fixed `from`/`to`, 15-60 minute windows, `summarize: true` first | `b2c metrics <category>`. If not enrolled, 403 or 404, say so and continue below. A 24 h request can exceed output limits. |
| Warehouse trends      | `cip_discover` / `cip_query` after [CIP guidance](skill://mcp/b2c-mcp-cip/SKILL.md)              | Delayed, aggregate; `b2c cip`.                                                                                             |
| Logs                  | `logs_list_files` then `logs_get_recent` filtered to the suspect route or integration            | Samples, not counts.                                                                                                       |
| Overlapping jobs      | [Job health](skill://b2c-ops/b2c-job-health/SKILL.md)                                            | A long job can cause load-driven latency.                                                                                  |
| Recent code change    | Code mode `builtin/code-version-inspect`                                                         | Metadata, not a full activation history.                                                                                   |
| MRT                   | `mrt_logs_watch` / `mrt_logs_watch_poll`                                                         | Needs MRT credentials.                                                                                                     |

Read the [metrics signals catalog](skill://b2c-ops/b2c-production-triage/references/metrics-signals.md)
(native: `b2c-production-triage` `references/metrics-signals.md`) before
interpreting; it lists each category's metrics, dimensions, sparse-series and
placeholder behavior, and gaps.

## Checks and decisions

1. **Confirm and date it.** Before the first `metrics_get`, read the
   [metrics signals catalog](skill://b2c-ops/b2c-production-triage/references/metrics-signals.md).
   Then, in `overall`, compare `totalCalls`, `responseTime`,
   `responseTimeP95`, `systemWorkload` and `sessions` for the incident and
   comparison windows, using `summarize: true` for both. Then fetch raw points
   for the series that moved to state the first minute that differs. If nothing differs,
   report no metric evidence and ask what the reporter saw.
2. **Choose the stack.**
   - SFRA: `controller` `callsMean` and `totalErrors` by `controller`. One route
     out of line localizes to that route's code or its integration; every route
     moving together points to a shared dependency, database, workload or edge.
     Checkout routes at zero calls with browse normal means checkout is not
     being reached.
   - Headless or PWA: `scapi` `requestLatency` by `apiFamily` (compare to the
     `overall` rollup), `responseCount` by `statusClass`, `errors4xx`, `errors5xx`.
     Then `mrt` if the realm has Managed Runtime data (empty means none).
   - Integrations and mobile: `ocapi` `totalCalls`, `callsMean`, errors by `ocapiCategory`.
3. **Check amplifiers.**
   - `scapi-hooks` `hookExecutionTimes`: a plateau step at the same minute as the
     family latency rise implicates a hook or its dependency. `hookErrors`.
   - `third-party` by host: [integration triage](skill://b2c-ops/b2c-integration-triage/SKILL.md)
     when `callsP95` rises, calls stop, or exceptions appear.
   - Cache: `scapi` `cacheHitRate` counts by `cacheStatus` (compute the hit share
     yourself); `ecdn` `cacheHits` for storefront hosts.
   - Load: `sessions` rising without storefront `requests` suggests jobs or
     integration traffic; `systemWorkload` sustained high is capacity.
   - Edge: `ecdn` for production hosts only (the response includes dev, staging
     and BM hosts). For bots or abuse use [edge traffic triage](skill://b2c-ops/b2c-edge-traffic-triage/SKILL.md).
4. **Drill down once.** Re-query the outlier with its filter (`apiFamily`,
   `ocapiApi`, `thirdPartyServiceId`), mindful that filters return finer series
   and `product` is `products` as a filter value. Then verify in logs for that
   route, hook or host and in overlapping job executions or a code activation.
5. **Denominators and gaps.** Pair every rate or average with volume. Latency
   series are sparse (no calls, no point); empty placeholder series mean no
   events. Do not add rollups to parts, and do not call a category healthy when
   it returned only empty series.
6. **State confidence.** Observed (series, window, value), inferred (layer) and
   unknown (cause), with one alternative explanation.

## Mitigation and recovery

Recommend the smallest supported action with blast radius and rollback: roll
back a code version, pause an overlapping job, take a failing integration out of
the path, or add an edge rule (via edge traffic triage). The authorized owner
decides. After any change, re-query the same metrics over a fresh equivalent
window and report recovered, partial, pending or unknown.

## Escalation and handoff

Report: target and site; UTC incident and comparison windows; layer and
dimension (route, family, host); series and values with volume; hooks, cache,
third-party and workload findings; log, job and code-change correlation; access
gaps (metrics beta, logs, CIP); alternatives ruled out; next owner. Route
integration evidence to the integration owner, custom route/hook defects to the
developer, and platform-wide or edge-wide degradation to Salesforce Support
using the [case template](skill://b2c-ops/b2c-production-triage/references/escalation.md).
Exclude tokens and customer data.
