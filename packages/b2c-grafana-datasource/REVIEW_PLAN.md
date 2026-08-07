# B2C Grafana Plugin + Go SDK — Consolidated Review & Polish Plan

> **Progress (2026-07-14):** sqlds adoption + Tier 0 + Tier 1 correctness/error-source DONE
> and live-verified vs bdpx_prd. Hygiene/SDK-tests/CI/docs sweep ran in worktrees (reconciled
> into main). See the "IMPLEMENTED" markers below.
>
> - ✅ **CIP → grafana/sqlds/v4** — driver.go (Connect/Settings/Macros/Converters), Calcite
>   macros via sqlutil (fixes `$__interval` + multiplier bugs structurally), RowLimit+Timeout
>   from the framework, format is now a numeric enum (0=time_series/1=table), macros.go deleted,
>   ResponseMutator dropped (sqlds does long→wide). Live: time-series, dimension-pivot, table all pass.
> - ✅ **Tier 0** — lockfile regenerated (frozen install passes); default CIP query fixed via sqlds;
>   Metrics >24h range partitioning (clients/metrics/partition.go, merge/sort/dedupe) — "Last 7 days"
>   now returns 2801 pts over 168h (was 400).
> - ✅ **Tier 1** — RefID keyed by authoritative query.RefID; typed `HTTPError` (errors.go) + bounded
>   error-body read; `mapMetricsError` → StatusTooManyRequests/BadGateway + ErrorSourceDownstream;
>   idempotent timestamp normalization; discovery probe errors surfaced (not empty dropdowns);
>   frontend valueCache cleared on category change.
> - ✅ **Sweep — DONE + reconciled into main** (carefully, not blind-copied: the docs worktree had
>   branched from a pre-sqlds snapshot, so only the genuinely-new doc artifacts were pulled; all
>   source/build files kept from the current tree). Landed: mock binary untracked + gitignored;
>   transient docs deleted (BOOT-VERIFICATION-REPORT/DEMO.boot.log/STACK-VERIFICATION); Go copyright
>   headers; CIP client_test.go + metadata_test.go; build scripts build BOTH binaries (no mage
>   fake-success); catalog parity test (TS↔Go drift tripwire, in CI); `.github/workflows/ci.yml`
>   test-go job (Go 1.26, both modules build/vet/test); docs consolidated → `docs/{quickstart,
>   configuration,query-editor,api-reference,architecture}.md` (old QUICKSTART/DEMO/INTEGRATION/
>   BACKEND-CONTRACT/ARCHITECTURE removed, README links in); expanded SDK README; CLAUDE.md lists
>   both new packages + a Grafana/Go-SDK dev section.
>
> **Final main-tree state: all Go tests pass (SDK incl. cip + parity, plugin), both binaries build,
> frozen lockfile clean, frontend typechecks. sqlds CIP + Tier-0/1 live-verified vs bdpx_prd.**
> - ⬜ **Deferred** — RESILIENCE_PLAN Tier 1 (retry/backoff/cache/singleflight); plugin.json
>   screenshots+signing artifact split; frontend loading states/memo; OAuth timeout; Metrics
>   VariableQueryEditor; wholeAs panic guard + DECIMAL-parse warn (DECIMAL warn already added in sqlds driver).


_Reconciles two independent reviews (2026-07-14): an internal 30-agent workflow
(73 findings → 19 adversarially verified) and an external hostile-agent review
(`REVIEW_HOSTILE.md`). Rate-limit/caching items cross-reference `RESILIENCE_PLAN.md`._

## Overall verdict

**Credible, end-to-end-working POC — not yet ready for shared deployment or catalog
signing.** Both reviews independently agree. The architecture (dual datasource, Go SDK,
macros, discovery, dashboards) is sound; the gaps are functional bugs, missing bounds,
error attribution, and build/CI/release hygiene.

**Confidence signal:** where both reviews overlap (functional query bugs, error-source,
discovery amplification, build/CI, docs noise) treat as high-confidence. Disagreements
were resolved by direct code check (noted inline).

---

## Tier 0 — Ship-blockers (broken on first contact) — DO FIRST

| # | Issue | File | Source | Verified |
|---|---|---|---|---|
| 0.1 | **`pnpm install --frozen-lockfile` FAILS** — lockfile 17 specifiers stale after the @grafana/toolkit→webpack migration. Breaks clean CI for the whole repo. | `pnpm-lock.yaml` vs `package.json` | hostile #8 | ✅ live |
| 0.2 | **Default CIP query cannot execute** — `types.ts:19` emits `$__timeGroupAlias(submit_date, $__interval)`; `macros.go` doesn't handle `$__interval` (only literal durations) → left in SQL. Also `calciteFloorUnit` keys on last char → `5m`/`15m`/`6h` lose the multiplier (→ MINUTE/HOUR, wrong buckets). | `src/cip/types.ts:19`, `pkg/cip/plugin/macros.go` | hostile #1 | ✅ code |
| 0.3 | **Metrics >24h ranges 400** — SDK declares 24h max but `datasource.go:182` passes Grafana range through unchanged. "Last 7 days" fails. Needs request partitioning (split ≤24h, merge by metric/labels, sort, dedupe boundaries). | `pkg/plugin/datasource.go:182` | hostile #2 | ✅ code |

Fix 0.1 + 0.2 are trivial and make the plugin stop looking broken. 0.3 is a small backend loop.

---

## Tier 1 — Correctness

**From hostile review:**
- **1.1 Unbounded CIP rows** — `FrameFromRows(rows, -1, …)` (`pkg/cip/plugin/datasource.go:124`) + variable queries materialize all rows into maps → OOM risk. Enforce a row cap (mature SQL sources do; e.g. MaxSeries=1000 in InfluxDB). ✅ verified.
- **1.2 RefID keying** — success/error paths key `response.Responses[qm.RefID]` (from JSON) not authoritative `query.RefID`. Missing `refId` in JSON loses the response. `pkg/plugin/datasource.go:176`. ✅ verified.
- **1.3 OAuth token acquisition can hang** — token sources use `context.Background()` + no client timeout (`auth/oauth.go:87`); query cancel doesn't bound a stalled token/HTTP call. Add explicit timeouts / accept injected client. (hostile #5)
- **1.4 CIP template interpolation not SQL-safe** — `src/cip/datasource.ts:29` generic string replace, no Calcite quoting. **NOTE:** internal review's adversarial pass ruled *arbitrary-SQL-in-editor* is **by design** (Grafana SQL datasources intentionally let editors run SQL). So the real, narrower issue = **variable/URL-controlled values** altering query syntax + the need for a **documented read-only CIP account**. Scope to: SQL-safe variable interpolation + SELECT-only validation where feasible + docs. (hostile #3, refined)

**From internal review (adversarially verified survivors):**
- **1.5 Label-values cache stale on category change** — `valueCache` keyed by label key only, not category; `onCategoryChange` doesn't clear it → wrong values after category switch. `src/QueryEditor.tsx` (`setValueCache({})` in `onCategoryChange`). ✅ HIGH, 5 min.
- **1.6 `strategyWholeAs` panics on empty key** — violates `ParseSeriesTags` "never panics" contract; only reachable via hand-edited catalog. Add init-time catalog validation + graceful degradation. `operations/metrics/tags.go:201`. MEDIUM.
- **1.7 Discovery failures return empty arrays, hide errors** — `probeCategory` nil→empty dropdowns; user can't tell "no data" from "API down". Return `sendErr` like CIP does. `pkg/plugin/datasource.go:666+`. MEDIUM.
- **1.8 CIP DECIMAL parse errors silently null'd** — add a Warn log (revenue/AOV/latency columns; silent nulls hide data-quality issues). `pkg/cip/plugin/datasource.go:166`. 5 min.
- **1.9 Timestamp normalization mutates in place** — not a bug yet, but a landmine for the planned response cache (double ×1000). Make idempotent or document. `clients/metrics/client.go:156`. (also = RESILIENCE_PLAN interaction)

---

## Tier 2 — Grafana idiom (measured vs sqlds / postgres / Infinity)

- **2.1 ⭐ Adopt `github.com/grafana/sqlds` for CIP?** Both reviews flag hand-rolled `QueryData`. Internal review **recommends adopting** (standard for Postgres/MySQL/ClickHouse; gives retry/timeout/tracing/maxDataPoints; our `cip.Client.DB()` + converters make it feasible; conditional wide-framing moves to a `ResponseMutator`). **Decision needed** — adopt before release, or document why hand-rolled is justified. ~3–4h prototype.
- **2.2 Error-source attribution** — all downstream 400/401/403/429/5xx → `StatusInternal`, no `ErrorSourceDownstream`, no typed errors. Both reviews + already designed in `RESILIENCE_PLAN.md §3`. 429 should show as downstream/rate-limited, not a plugin bug.
- **2.3 Rate-limit resilience** (hostile #10, #13; RESILIENCE_PLAN) — discovery/probe amplification, no retry/backoff/Retry-After, no cache/singleflight. Governed by `RESILIENCE_PLAN.md` (separate track).
- **2.4 `plugin.json` completeness** — dynamic version (not hardcoded 0.1.0), screenshots, build metadata; needed for signing. Both reviews. `src/plugin.json`, `src/cip/plugin.json`.
- **2.5 Release/signing artifact structure** (hostile #11) — frontend nests CIP under Metrics `dist`; Grafana signing wants one plugin-root archive per plugin ID (own executable + MANIFEST.txt). Split release artifacts (source can stay one workspace pkg).
- **2.6 Compatibility overclaim** (hostile #15) — manifests say `>=9.0.0`, FE compiles vs 10.4, Docker tests only 11.2. Add `@grafana/plugin-e2e` + Plugin Validator; set an honest floor.
- **2.7 Lower-impact idiom** — `PreferredVisualisationType` hint on frames; lightweight `CheckHealth` (Metrics fetches 5min of data vs CIP's `Ping`); add a Metrics `VariableQueryEditor` (CIP has one; `metricFindQuery` already supports it).

---

## Tier 3 — Frontend polish
- **3.1** Loading state (`isLoading`) on Metrics discovery dropdowns (CIP shows "Loading tables…"; Metrics shows nothing). `src/QueryEditor.tsx`. 15 min.
- **3.2** `useMemo` `labelKeyOptions` + hoist `CATEGORY_OPTIONS` out of component. 5 min.
- **3.3** (optional) `@testing-library/react` tests for the editors (~650 LOC untested stateful logic).

## Tier 4 — SDK as publishable artifact
- **4.1** Copyright headers on **all `.go` files** (TS has them; Go doesn't). _Resolves internal review's own §7.1 miss._
- **4.2** CIP client has **no tests** (`clients/cip` — no `*_test.go`); metrics/tenant/window/tags/oauth are tested. Add sticky-session + query + metadata tests.
- **4.3** Typed inspectable errors (`HTTPError` w/ `Is`/`As`) — shared with RESILIENCE_PLAN §3.1. (hostile #16)
- **4.4** Validated constructors (report bad URL/config), category-specific options instead of unrestricted `map[string]string` filters, injectable `http.Client`. (hostile #16)
- **4.5** Module-path decision — keep monorepo path (works) vs separate repo for clean `go get`. Document choice in SDK README.
- **4.6** Confirm **zero Grafana-SDK leakage** in the SDK module (it must not import grafana-plugin-sdk-go) — internal review confirms clean; keep a guard.

## Tier 5 — Docs (see §Documentation plan below)
## Tier 6 — Repo hygiene
- **6.1 Committed 3MB `mock-metrics` arm64 binary** is git-tracked; `.gitignore` only has `dist/`. `git rm` + ignore. _Hostile #17 correct; internal §7.1 wrong — resolved by direct check._
- **6.2 Go code outside CI** (hostile #9) — `.github/workflows/ci.yml` never configures Go or runs `go test`/`vet`; plugin pkg has no `test:agent`/`lint:agent`. 0% coverage on Metrics backend + CIP client. Wire both Go modules + the plugin into CI.
- **6.3 Normal build omits CIP** (hostile #7) — `build:backend`/Makefile/Magefile build only `gpx_b2c_metrics`; CIP is Docker-only. `build:backend:all` fake-succeeds when mage absent. Fix build scripts to produce both binaries.
- **6.4 Cross-language catalog parity untested** (hostile #14) — TS `generate-metrics-tags-catalog.ts` and Go `tags.go` embed copies; identical now but nothing enforces it. Add a CI parity check (regenerate + diff, or hash-compare).
- **6.5 Changeset/versioning** — new packages aren't in the changeset allow-list; Go module is git-tag versioned. Decide: git tags for Go SDK + plugin, changeset only for docs. Add to `.changeset/config.json ignore` + `pnpm-workspace.yaml` as needed.
- **6.6 Makefile/compose robustness** — `docker compose down` fails on env interpolation in real mode (observed); guard the down target.

---

## Documentation plan

**DELETE (transient dev noise, git rm):** `BOOT-VERIFICATION-REPORT.md`, `DEMO.boot.log`,
`STACK-VERIFICATION.md`, the tracked `demo/mock-metrics/mock-metrics` binary. Consider
`REVIEW_HOSTILE.md`/`REVIEW_PLAN.md`/`RESILIENCE_PLAN.md` as contributor docs (keep, or move
under a `docs/dev/`).

**CONSOLIDATE (README/QUICKSTART/DEMO/INTEGRATION/ARCHITECTURE/BACKEND-CONTRACT overlap → target):**
```
packages/b2c-grafana-datasource/
├── README.md                 — overview, features, quick install, links
├── docs/
│   ├── quickstart.md         — merge QUICKSTART + DEMO (one Docker walkthrough)
│   ├── configuration.md      — datasource settings, OAuth, demo vs real, multi-tenant
│   ├── query-editor.md       — Metrics tiered filters + CIP SQL/macros/schema/variables
│   ├── api-reference.md      — CallResource endpoints (was INTEGRATION.md)
│   └── architecture.md       — ARCHITECTURE.md + BACKEND-CONTRACT.md merged
└── (dev) RESILIENCE_PLAN.md, REVIEW_PLAN.md
```

**WRITE (gaps):**
- Plugin **user guide** (install signed/unsigned, add both datasources, first dashboard, query editor, template variables, alerting, troubleshooting, **read-only CIP account** guidance).
- Go SDK **usage guide** — expand `b2c-tooling-sdk-go/README.md`: install, quick start, package overview, error handling, testing; link to godoc. (godoc package comments already present ✅.)
- **Monorepo integration**: add Grafana plugin + Go SDK entries to `docs/` Vitepress site + sidebar; update root **CLAUDE.md** (new packages + build commands).

---

## Recommended execution order

1. **Tier 0 ship-blockers** (0.1 lockfile, 0.2 default query + macro multiplier, 0.3 >24h partitioning) — hours. *Re-verify vs bdpx_prd.*
2. **Tier 1 correctness** (1.1 row cap, 1.2 RefID, 1.5 cache, 1.6–1.8, 1.3 timeouts, 1.4 var-safety) — ~1 day.
3. **Tier 6 hygiene** (6.1 binary, 6.3 build both, 6.2 CI wiring, 6.4 parity test) — ~0.5 day; unblocks trustworthy CI.
4. **Tier 2 idiom** — error-source (2.2, w/ RESILIENCE_PLAN §3) + **sqlds decision (2.1)** + plugin.json/signing (2.4/2.5) — 1–2 days.
5. **Tier 4 SDK** (headers, CIP tests, typed errors) — ~0.5–1 day.
6. **Tier 5 docs** — ~1 day.
7. **Tier 3 frontend polish** + **RESILIENCE_PLAN Tier 1** — as scheduled.

**False positives filtered (considered, not real):** discovery-loader memoization (perf non-issue),
webpack-vs-scaffold (intentional dual-entry), CodeEditor onBlur (does pass value), SQL-injection-via-macros
(Grafana editors are trusted-SQL by design — narrowed to variable-value safety, see 1.4).
