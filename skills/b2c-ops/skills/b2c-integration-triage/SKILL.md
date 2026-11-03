---
name: b2c-integration-triage
description: Investigate failing, slow or silent calls from B2C Commerce to external services (payment, tax, shipping, OMS, search, email, custom APIs) using Metrics API third-party signals (call volume, p95 duration, remote exceptions by host) with logs and service configuration. Decide whether the provider is slow or unreachable, whether calls stopped, or whether the fault is elsewhere.
---

# External service (integration) triage

Outcome: for one or more outbound hosts, establish whether calls stopped, got
slow, or raised exceptions, since when, and who owns the next step. Metrics
identify the host and the failure shape; logs and service configuration
identify the cause. Inspection never authorizes disabling services,
changing credentials or editing configuration.

## Scope and impact

Resolve the target with `config_inspect` (CLI: `b2c setup inspect`). Confirm the
integration or feature affected (payment, tax, shipping, order export, search,
email), the site, the symptom (errors, slowness, feature missing) and a fixed
UTC window; propose the last 60 minutes and a comparison window of equal
length (same hours the previous day). Follow the team's incident process for
live customer impact.

## Access and tools

| Evidence               | Preferred path                                                                                                                               | Limit / fallback                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Outbound calls by host | `metrics_get` `category: "third-party"` with 15-60 minute windows                                                                            | Closed beta. Service ID and HTTP status are not in the data; the host is the only identity. CLI `b2c metrics third-party`. |
| Single host drill-down | Same call with `thirdPartyServiceId`                                                                                                         | Filter semantics are drill-down; verify the returned series.                                                               |
| Service error detail   | `logs_list_files` then `logs_get_recent` on discovered `service-*`, `custom-*` and error prefixes with `search` for the host or service name | Samples, not counts. CLI `b2c logs get`.                                                                                   |
| Caller context         | `metrics_get` `controller` and `scapi`, `scapi-hooks`                                                                                        | Shows which pages or APIs call the host.                                                                                   |
| Job-driven calls       | [Job health](skill://b2c-ops/b2c-job-health/SKILL.md)                                                                                        | Feeds and exports often call external hosts on a schedule.                                                                 |
| Orders affected        | [Checkout triage](skill://b2c-ops/b2c-checkout-triage/SKILL.md), [failed-order triage](skill://b2c-ops/b2c-order-failure-triage/SKILL.md)    | For payment or order-export integrations.                                                                                  |

Read the [metrics signals catalog](skill://b2c-ops/b2c-production-triage/references/metrics-signals.md)
(native: `b2c-production-triage` `references/metrics-signals.md`) first. It covers
sparse series, placeholders and the limits below.

## Checks and decisions

1. **Inventory hosts.** Before the first `metrics_get`, read the
   [metrics signals catalog](skill://b2c-ops/b2c-production-triage/references/metrics-signals.md).
   Then make one `third-party` call for the window with `summarize: true`;
   list hosts with `callsCount` totals (`sum`). An integration host with no series at all means no calls
   in the window or a host name you did not expect. Ask the integration owner for
   the real hostname before concluding.
2. **Classify each host's shape** against its comparison window:
   - Calls fell to zero: the caller stopped, a feature or service was disabled,
     configuration was removed, or an upstream path (checkout, job) is not
     reaching it. Check the caller (`controller`, jobs) before blaming the provider.
   - Calls normal, `callsP95` up: provider or network slow. Latency points are
     sparse, so compare only intervals with calls, and compare to that host's own
     baseline.
   - `remoteExceptions` nonzero: read `exceptionType`. A read timeout with high
     p95 = provider slow or overloaded. Other types need the log message to
     interpret; do not map a type name to a cause from the metric alone.
   - Calls and exceptions both normal but the feature is broken: the failure is
     not at the transport layer. Logs will show HTTP status or payload errors
     (4xx/5xx and business errors are not in the metrics).
3. **Find the caller.** Match the start minute to `controller` routes,
   `scapi` families and hooks that depend on the host, and to job executions.
   A slow host that is only used by a job explains job duration, not storefront
   latency.
4. **Corroborate in logs.** Search the integration logs for the host or service
   name in the same window; extract status codes, timeout settings and safe
   correlation IDs, not payloads or customer data.
5. **Check for a change.** Compare the start time with code activations
   (`builtin/code-version-inspect`), service configuration changes and
   credentials or certificate expiry, which the metrics cannot show.
6. **State confidence.** Observed (host, shape, start, size), inferred (provider
   vs caller) and unknown (cause). Offer an alternative explanation.

## Mitigation and recovery

Possible actions, each for the authorized owner to decide: contact the provider
with host, window and exception evidence; adjust timeouts or retries in service
configuration; take a non-critical integration out of the path with a fallback;
roll back a code version that changed the call. Note blast radius (for payment
or tax, orders may fail) and rollback. After any change, re-query the same host
over a fresh equivalent window for calls, p95 and exceptions, and check
business behavior; report recovered, partial, pending or unknown.

## Escalation and handoff

Report: target and site; UTC windows; host(s); call volume, p95 and exceptions
vs comparison; callers and affected features; log excerpts and correlation IDs;
changes ruled in or out; access gaps (metrics beta, logs); next owner. Route
provider evidence to the integration owner, custom-code defects to the
developer and platform-side failures to Salesforce Support using the
[case template](skill://b2c-ops/b2c-production-triage/references/escalation.md).
Exclude credentials, payment data and unnecessary customer data.
