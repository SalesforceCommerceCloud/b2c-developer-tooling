# Hostile-Agent Review — B2C Grafana Plugin + Go SDK

_External adversarial review (2026-07-14). Captured verbatim as an independent second
reviewer, to be reconciled with the internal review workflow's synthesized plan
(see the review-polish plan output). Spot-verified claims annotated **[VERIFIED]** /
**[VERIFIED-LIVE]** / **[PARTIAL]** where checked against current code._

## Verdict

Credible exploratory POC; **not** ready for shared deployment or Grafana catalog
packaging. Main problems: functional query failures, unbounded SQL behavior, transport
lifecycle issues, build/CI gaps.

## Critical

1. **Default CIP query cannot execute.** `src/cip/types.ts:17` emits
   `$__timeGroupAlias(..., $__interval)`, but `pkg/cip/plugin/macros.go:25` only accepts
   literal durations — `$__interval` is left in the SQL. Also `5m`/`15m`/`6h` reduce to
   MINUTE/HOUR, losing the multiplier → wrong buckets. **[VERIFIED]** default query uses
   `$__interval` (unhandled); `calciteFloorUnit` keys on last char only (multiplier dropped).
2. **Metrics queries wider than 24h fail.** SDK declares 24h max (`window.go:16`) but
   explicit Grafana ranges pass through unchanged (`pkg/plugin/datasource.go:182`).
   "Last 7 days" → API 400. Fix: partition into ≤24h requests, merge by metric/labels,
   sort, dedupe boundary points. **[VERIFIED]** window passed through as-is.
3. **CIP template interpolation is not SQL-safe.** `src/cip/datasource.ts:29` does generic
   string replace without Calcite quoting/escaping; textbox/URL variables can alter query
   syntax. The `variable` resource also executes arbitrary submitted SQL
   (`pkg/cip/plugin/datasource.go:227`). Fix: SQL-aware interpolation, SELECT-only
   validation where feasible, documented read-only CIP account.
4. **CIP result processing unbounded.** `sqlutil.FrameFromRows(rows, -1, …)`
   (`pkg/cip/plugin/datasource.go:124`) = unlimited rows; variable queries materialize all
   rows into maps before dedupe. Broad query → plugin OOM. Mature SQL sources enforce a row
   limit (Grafana MySQL). **[VERIFIED]** `-1`.

## High

5. **OAuth token acquisition can hang.** Both token sources use `context.Background()` and
   clients without timeouts (`auth/oauth.go:87`); query cancellation doesn't bound a
   stalled token request. Metrics HTTP calls also lack a client timeout. Fix: accept a
   caller transport/client or set explicit connect/response-header/total timeouts.
6. **Per-query tenancy → unbounded credential/client cache.** Arbitrary `tenantId` creates
   permanent clients + token sources (`pkg/plugin/datasource.go:30`). Fix: allowlist or
   normalized same-realm validation + bounded TTL/LRU cache. **[PARTIAL]** cache is
   same-realm-gated already; but it's an unbounded `map`, no TTL/LRU — unbounded growth real.
7. **Normal build path doesn't produce the CIP plugin.** `package.json:9`, `Magefile.go:10`,
   Makefile build only Metrics. `build:backend:all` exits 0 with no binary when Mage absent
   (reproduced). Only the Dockerfile builds CIP. **[VERIFIED]**.
8. **Clean CI install fails.** manifest vs `pnpm-lock.yaml:404` disagree on 17 dep entries;
   `pnpm install --frozen-lockfile` → `ERR_PNPM_OUTDATED_LOCKFILE`. **[VERIFIED-LIVE]**.
9. **New Go code effectively outside CI.** `.github/workflows/ci.yml:58` runs workspace
   scripts but never configures Go or runs Go tests/vet. Grafana package has no
   test:agent/lint:agent/backend build hook. Coverage: 0% Metrics backend & CIP client,
   18.3% CIP backend.
10. **Discovery amplifies rate limits.** Opening the Metrics editor does multiple 24h
    probes; every label-value picker fetches a full category response. No cache/singleflight
    (`pkg/plugin/datasource.go:631`). (Overlaps RESILIENCE_PLAN.md.)
11. **Two-plugin artifact not structured for signing/release.** Frontend build nests CIP
    beneath the Metrics `dist`; Grafana expects one plugin-root archive per plugin ID with
    its own executable + manifest (one MANIFEST.txt per root). Split release artifacts even
    if source stays one workspace package.

## Medium

12. Metrics responses keyed by JSON `qm.RefID` not authoritative `query.RefID`
    (`pkg/plugin/datasource.go:176`); missing/inconsistent JSON can lose the response.
    **[VERIFIED]**.
13. All downstream 400/401/403/429/5xx → `StatusInternal`, no `ErrorSourceDownstream`, no
    retry metadata, no typed SDK errors. (Overlaps RESILIENCE_PLAN.md.)
14. Cross-language catalog duplicated not generated end-to-end: TS generator writes
    `packages/b2c-tooling-sdk/scripts/generate-metrics-tags-catalog.ts:23`, Go embeds a copy
    at `tags.go:14`. Currently hash-identical but no test enforces it.
15. Grafana compatibility overclaimed: manifests say `>=9.0.0`, frontend compiles against
    10.4, Docker tests only 11.2. Add `@grafana/plugin-e2e` across supported versions + run
    Plugin Validator.
16. Go Metrics client only superficially typed: constructors can't report invalid
    URL/config, filters are unrestricted maps, errors are strings not inspectable types.
    Prefer validated constructors, category-specific options, typed HTTP error, injected
    `http.Client`/`RoundTripper`.
17. Untracked mock server includes a ~3 MB arm64 Mach-O binary not ignored
    (`demo/mock-metrics/mock-metrics`). **[VERIFIED]** git-tracked; `.gitignore` only has `dist/`.

## Reference points (mature datasources)
InfluxDB defaults MaxSeries=1000, uses Grafana HTTPClientOptions/TLS/timeout/proxy/PDC.
Grafana recommends bounded concurrent QueryData, sqlutil/sqlds, cached connections, backend
telemetry, resource handlers for editor metadata.

## Reviewer verification
Passed: Go tests w/ race, vet, module verify, SDK 2,067-test suite, SDK typecheck, plugin
FE typecheck/build, ESLint, compose config, cross-language fixture byte parity.
Failed: frozen-lockfile install. (Root lint/format also fail on unrelated pre-existing MCP
import-resolution + VS-extension CSS issues.) No files changed during review.
