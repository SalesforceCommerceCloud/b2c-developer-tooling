# Spec: Add `--mrt-backend` flag to choose between legacy MRT API and SCAPI MRT API

**GUS:** W-23941083
**Date:** 2026-09-02
**Author:** Kieran Haberstock

---

## Context & Goal

The SCAPI MRT API (Storefront Deployments v1) is shipping as a replacement for today's legacy MRT Cloud API (`cloud.mobify.com`). Legacy authenticates with a per-user API key; SCAPI MRT authenticates via API client / OAuth (`AmOAuth2`, scopes `sfcc.storefront.deployments[.rw]`). Developers need to adopt SCAPI MRT at their own pace without breaking existing `b2c mrt` workflows.

This story introduces a dedicated **`--mrt-backend`** flag (`auto` | `legacy` | `scapi`, default `auto`) — separate from the existing `--api-backend` flag, because MRT is a distinct subsystem (`MrtCommand`, API-key auth) and a developer may want SCAPI for instance Data APIs while still needing legacy MRT auth (or vice versa). It mirrors the OCAPI↔SCAPI fallback pattern landed in PR #413.

**Scope (first increment):** the full flag + config-resolution + auto/fallback framework, plus a **net-new SCAPI MRT client covering only deployment list and deployment create** (`getDeploymentsForEnvironment`, `createDeploymentForEnvironment`). Bundle upload, bundle list, get-single-deployment, and all other MRT operations stay legacy-only for now — the flag is still accepted on them, but explicit `scapi` fails with an actionable error and `auto` falls back to legacy. Deployment create is supported only when deploying an **existing bundle by ID** (`mrt bundle deploy <bundleId>`); the local-build path (which uploads a bundle first, then deploys) stays legacy-only in this increment, because bundle upload is out of scope and a single command must not mix backends. Proving the pattern on this narrow, low-risk surface first directly addresses the GUS risk note about validating auto-mode/fallback scope early.

**Who benefits:** developers migrating to SCAPI MRT OAuth auth; the MRT team validating the migration path before broadening it to the rest of the MRT command surface. Because SCAPI MRT reuses the same shortCode + client-credentials setup as other SCAPI commands, a developer already configured for `jobs`/`sites`/SCAPI commands only needs to add the `sfcc.storefront.deployments[.rw]` scope to their API client.

## Acceptance Criteria

### Scenario: Flag is available and defaults to auto

```gherkin
Given the b2c CLI with MRT commands
When I inspect an MRT command that calls the MRT API (e.g. `mrt bundle history`)
Then a `--mrt-backend` flag is present accepting only `auto`, `legacy`, or `scapi`
And when the flag is omitted the effective backend preference is `auto`
```

### Scenario: Config precedence across flag, env var, and dw.json

```gherkin
Given `mrtBackend` is set to `legacy` in dw.json
And the environment variable `MRT_BACKEND` is set to `scapi`
When I run an MRT command with `--mrt-backend auto`
Then the CLI uses `auto` (the flag wins)
And with no flag set the env var `MRT_BACKEND` wins over the dw.json `mrtBackend` value
```

### Scenario: Auto mode selects SCAPI for a supported operation when configured

```gherkin
Given `--mrt-backend auto` (or unset)
And a short code, client credentials, and obtainable `sfcc.storefront.deployments[.rw]` scopes are configured
When I run `mrt bundle history` or `mrt bundle deploy <bundleId>`
Then the CLI calls the SCAPI MRT Storefront Deployments API
And no legacy MRT API request is made
```

### Scenario: Auto mode warns when falling back to legacy for a supported operation

```gherkin
Given `--mrt-backend auto` (or unset) and a supported operation (`mrt bundle history` / `mrt bundle deploy <bundleId>`)
And SCAPI MRT cannot be used (missing prerequisites, unobtainable scope, or a safe fallback status 400/401/403/404/405/406/415)
When I run the command
Then the CLI falls back to the legacy MRT API and the command still succeeds
And it prints a warning that it is falling back to legacy
And the warning notes that `-D` / `--debug` shows what is missing
```

### Scenario: Auto mode does NOT fall back on ambiguous failures

```gherkin
Given `--mrt-backend auto` and SCAPI MRT selected for a supported operation
When the SCAPI MRT request fails with an ambiguous status (429 or 5xx) or a network error
Then the CLI surfaces that error
And does NOT silently retry against the legacy MRT API
```

### Scenario: Explicit scapi with missing prerequisites fails without falling back

```gherkin
Given `--mrt-backend scapi`
And a supported operation (`mrt bundle history` / `mrt bundle deploy <bundleId>`)
And SCAPI MRT prerequisites are missing or the required scope cannot be obtained
When I run the command
Then it fails with a clear, actionable error explaining what is missing
And no legacy MRT API request is attempted
```

### Scenario: Explicit scapi on an unsupported operation fails before any legacy request

```gherkin
Given `--mrt-backend scapi`
When I run an MRT command outside the supported subset (e.g. `mrt bundle list`, `mrt bundle download`, or an env, org, project, or user command)
Then it fails with an actionable error stating the operation is not yet supported on the SCAPI MRT backend
And no legacy MRT API request is attempted
```

### Scenario: Auto mode warns when using legacy for an unsupported operation

```gherkin
Given `--mrt-backend auto` (or unset)
When I run an MRT command outside the supported subset
Then the CLI uses the legacy MRT API
And it emits a warning that SCAPI MRT does not yet support this operation and the legacy backend is being used
And the command still succeeds (no error)
```

### Scenario: Explicit legacy always uses the legacy API

```gherkin
Given `--mrt-backend legacy`
And a short code and client credentials for SCAPI MRT are also configured
When I run any MRT command
Then the CLI uses only the legacy MRT API-key path
And no SCAPI MRT detection or request occurs
```

### Scenario: A multi-request operation does not mix backends

```gherkin
Given `--mrt-backend auto` and a paginated `mrt bundle history`
When the CLI resolves a backend for the first page
Then the same backend is used for all subsequent pages in that invocation
And legacy and SCAPI responses are never mixed within one command run
```

### Scenario: Debug output explains SCAPI MRT backend selection

```gherkin
Given a supported MRT operation run with `-D` / `--debug` (or `--log-level debug`)
When I run the command
Then the debug log reports each SCAPI MRT prerequisite as satisfied or missing —
  short code, tenant/organization ID, a stateless auth method (client-credentials/JWT), and the required scope
And it logs which backend was selected and why
```

### Scenario: Documentation describes the three modes

```gherkin
Given the MRT CLI documentation (docs/cli/mrt.md) and the auth/config guides
When a developer reads it
Then it explains `auto`, `legacy`, and `scapi`, the auto-detection criteria, and which operations SCAPI MRT currently supports
```

## Constraints & Out of Scope

### Constraints

- **Backward compatibility is non-negotiable.** Default `auto` must match today's legacy MRT experience whenever SCAPI MRT prerequisites are absent — existing `b2c mrt` workflows keep working with no config change.
- **Dedicated flag, not `--api-backend`** (per the Slack decision with Charles Lavery) — the two represent independent concerns. Value is `legacy` (not `mrt`) for the old system.
- **Reuse, don't reinvent.** Mirror the #413 fallback pattern — prefer `compat/dispatcher.ts` (`BackendDispatcher`) for per-operation backend pinning, and `clients/scapi-backend-utils.ts` (`resolveScapiOrOcapi`, `isFallbackTrigger`, `SAFE_SCAPI_FALLBACK_STATUSES`). Reuse the existing SCAPI auth stack (`OAuthStrategy` → Account Manager; the `scapiClientConfig` eligibility gate) — SCAPI MRT uses the same AmOAuth2 / client-credentials / `{shortCode}.api.commercecloud.salesforce.com` model, so no new auth mechanism.
- **SCAPI MRT requires system auth.** Client-credentials or JWT Bearer + shortCode; browser PKCE/implicit/fixed-token/API-key sessions cannot reach SCAPI MRT.
- **Fall back only on safe failures** (400/401/403/404/405/406/415), never on ambiguous 429/5xx/network errors. Explicit `scapi` never crosses into legacy. Deployment create's `409 Conflict` is *not* a fallback trigger either — a create must never be retried across backends, so a 409 is surfaced.
- **Pin the backend per invocation** — a single multi-request command must not mix legacy and SCAPI responses.
- **Fallback is a warning, not an error.** Auto-mode fallback surfaces a warning (with details at debug level), but the command still succeeds. Recommended behavior: warn only when SCAPI was plausibly intended (some SCAPI config present but incomplete, or an attempt failed); stay quiet for pure legacy-only setups. (Revisitable during implementation.)
- **Config precedence follows existing MRT config:** `--mrt-backend` > `MRT_BACKEND` env > `mrtBackend` dw.json. Add `mrtBackend` alongside the existing `apiBackend` entries across the config layer.
- **No new external dependencies;** follow repo conventions (copyright header, `lint:agent` clean, Mocha/Chai/Sinon tests, docs updates, tooling-index regeneration).
- **Targeted for CLI 2.0.**

### Out of Scope

- **SCAPI MRT coverage beyond deployment list + deployment create.** Bundle upload, bundle list, and all other MRT operations (env, org, project, user, tail-logs, and the rest of `bundle/` — delete, download, save, plus the local-build path of `deploy`) stay legacy-only — the flag is accepted, `scapi` errors on them, `auto` warns and uses legacy.
- **Bundle upload / bundle list** (`uploadBundleForStorefront`, `getBundlesForStorefront`) from the deployments spec — of the SCAPI MRT surface, only `getDeploymentsForEnvironment`, `createDeploymentForEnvironment`, and `getDeploymentById` are in scope this increment. (`getDeploymentById` is used solely to poll a known deployment for `--wait`; it reads within the same `sfcc.storefront.deployments` scope as the list, so it adds no scope surface — see the note under "`--wait`" below.)
- **Removing `auto` mode** (a future release may require explicit selection, per the `--api-backend` precedent).
- **Deprecating or removing the legacy MRT API / per-user API key.**
- **Changing existing MRT config field names or behavior** (`mrtProject`, `mrtEnvironment`, `mrtOrigin`, `mrtApiKey`).
- **Reusing `--api-backend` for MRT** (considered and rejected).
- **A dedicated diagnostic flag** (`--explain-mrt-backend`) — folded into existing `-D`/`--debug` output instead.
- **SLAS / shopper auth.**

## Technical Context & References

### Target Files / Directories

**Config layer — add `mrtBackend` (mirror the `apiBackend` entries)**
- `packages/b2c-tooling-sdk/src/config/types.ts` — add `mrtBackend?: 'auto'|'legacy'|'scapi'` to `NormalizedConfig`.
- `packages/b2c-tooling-sdk/src/config/dw-json.ts` — add `mrtBackend` to `DwJsonConfig` (~`:74-80`).
- `packages/b2c-tooling-sdk/src/config/mapping.ts` — forward map (~`:195`), reverse (~`:353`), merge (~`:563`).
- `packages/b2c-tooling-sdk/src/config/sources/env-source.ts` — `MRT_BACKEND`/`SFCC_MRT_BACKEND` alias (~`:59-68`) + enum validation in `ENUM_FIELDS` (~`:91`).

**CLI command layer**
- `packages/b2c-tooling-sdk/src/cli/mrt-command.ts` — add `--mrt-backend` to `MrtCommand.baseFlags` (~`:44-62`) and a `get mrtBackendPreference()` accessor (parallel to `InstanceCommand.apiBackendPreference`). `-D`/`--debug` is inherited from `BaseCommand` (`base-command.ts:121`).
- `packages/b2c-tooling-sdk/src/cli/config.ts` — `extractMrtFlags` (~`:159`) sets `mrtBackend`.

**SCAPI MRT client — net-new**
- `packages/b2c-tooling-sdk/src/clients/scapi-mrt-deployments.ts` — built via `buildScapiClient` (`scapi-client-factory.ts`), `pathSegment: 'storefront/deployments/v1'`, scope cascade for `sfcc.storefront.deployments[.rw]`.
- Covers `getDeploymentsForEnvironment` (`GET …/storefronts/{storefrontId}/environments/{environmentId}/deployments`, paginated — maxLimit 200, default 25) and `createDeploymentForEnvironment` (`POST …/deployments`, JSON `DeploymentCreateRequest` body referencing an existing bundle, returns `202` queued).
- New generated types from the deployments OAS (add spec to `specs/` + generate, mirroring `specs/mrt-api-v1.json` → `mrt.generated.ts`).
- Barrel export in `clients/index.ts`.

**Backend selection / dispatch — net-new, mirror #413**
- New MRT dispatcher analogous to `compat/dispatcher.ts` (`BackendDispatcher`) resolving legacy vs scapi and pinning per operation; reuse `resolveScapiOrOcapi`/`isFallbackTrigger` from `clients/scapi-backend-utils.ts`.
- Auto-eligibility gate mirroring `B2CInstance.scapiClientConfig` (`instance/index.ts:194`): shortCode + tenantId + client-credentials/JWT.

**Operations layer — integration surface**
- `packages/b2c-tooling-sdk/src/operations/mrt/deployment.ts` (`listDeployments` ~`:109`, `createDeployment` ~`:227`) — make backend-aware (they currently take a bare `auth` and instantiate `createMrtClient` inline).

**Commands**
- `packages/b2c-cli/src/commands/mrt/bundle/history.ts` (list deployments) and `.../bundle/deploy.ts` (create deployment) — inherit the flag via `MrtCommand` and route through backend selection. `mrt bundle deploy` routes to SCAPI only when given an explicit bundle ID; its local-build path (upload-then-deploy) stays legacy.

**Docs**
- `docs/guide/authentication.md` — add `sfcc.storefront.deployments[.rw]` scope row + MRT-command auth row.
- `docs/guide/configuration.md` — add `MRT_BACKEND` env var + `mrtBackend` dw.json field.
- `docs/cli/mrt.md` — document the three modes, auto-detection criteria, and supported operations.
- `skills/b2c-cli/skills/` MRT skill + regenerate `packages/b2c-tooling-sdk/data/tooling/index.json`.

### Existing Patterns to Reuse
- `clients/scapi-backend-utils.ts` — `resolveScapiOrOcapi`, `isFallbackTrigger`, `SAFE_SCAPI_FALLBACK_STATUSES`, `withScopes`, error types (`ScapiRequestError`, `ScapiCapabilityUnsupportedError`).
- `compat/dispatcher.ts` — `BackendDispatcher` (preferred; `createFallbackBackend` in `clients/scapi-fallback-backend.ts` is the deprecated alternative).
- `clients/scapi-client-factory.ts` — `buildScapiClient` (baseUrl + auth middleware + scope cascade).
- `instance/index.ts:194` — `scapiClientConfig` eligibility-gate pattern.
- `cli/instance-command.ts` — `--api-backend` flag def (~`:106`) + `apiBackendPreference` (~`:212`) as the template.
- `clients/mrt.ts` — `createMrtClient` / `DEFAULT_MRT_ORIGIN` (legacy path).

### Test Strategy
- **Backend selection/fallback (SDK):** new tests modeled on `test/clients/scapi-fallback-backend.test.ts` + `test/compat/dispatcher.test.ts` — fake backends, invalid-scope trigger, safe-status fallback, ambiguous 429/5xx/network → no fallback, pin-per-invocation, warning-on-fallback.
- **Config:** mirror `test/config/env-source.test.ts` for `MRT_BACKEND` + `ENUM_FIELDS`; dw.json mapping/precedence tests.
- **`MrtCommand` base:** extend `test/cli/mrt-command.test.ts` + integration test for `mrtBackendPreference` resolution (flag > env > dw.json).
- **Commands:** extend `packages/b2c-cli/test/commands/mrt/bundle/{deploy,history}.test.ts` with the `--mrt-backend` × {supported/unsupported} matrix; `isolateConfig`/`stubParse`, MSW for SCAPI-vs-legacy HTTP; assert debug-level prerequisite output under `-D`. For `deploy`, cover both paths: explicit bundle ID (SCAPI-eligible) and local build (legacy-pinned).
- **E2E (optional):** `packages/b2c-cli/test/functional/e2e/mrt-lifecycle.test.ts`.

### Open Questions / Early-Exploration Items (the GUS risk note)
1. **MRT commands don't have instance/OAuth config wired.** `MrtCommand extends BaseCommand` (not `InstanceCommand`), so shortCode/client-credentials aren't resolved on MRT commands today. Deciding how MRT commands obtain the SCAPI auth prerequisites (share `scapiClientConfig`/instance config, or add a targeted resolver) is a core design task.
2. **`storefrontId` + `environmentId` mapping.** `organizationId` is resolved — it's `f_ecom_<realm>_<instance_type>`, i.e. `f_ecom_` + the configured `tenantId`. Remaining: the deployment endpoints are **environment-scoped** (`…/storefronts/{storefrontId}/environments/{environmentId}/deployments`), so confirm both the `mrtProject` → `storefrontId` mapping and the `mrtEnvironment` → `environmentId` mapping. Also confirm the `DeploymentCreateRequest` body shape (the field naming the existing bundle to deploy) against the OAS.
3. **`--wait` and get-single-deployment. (Resolved.)** `mrt bundle deploy --wait` polls deployment status today via the legacy path (`waitForEnv`). On the SCAPI backend, `--wait` polls the just-created deployment **by ID** (`getDeploymentById` → `GET …/deployments/{deploymentId}`) until it reaches a terminal status (`finished`/`failed`) or the timeout elapses, honoring `--poll-interval`/`--timeout`. `getDeploymentById` reads within the same `sfcc.storefront.deployments` scope already required by the list, so it adds **no scope surface** over list-polling — and a direct by-ID read avoids the page-scanning ambiguity of matching a deployment out of a paginated list. The create response supplies the `deploymentId`; if a create ever returns without one, `--wait` warns and returns the raw create result (the non-waiting case) rather than failing.

### References
- GUS **W-23941083**; Epic *SCAPI MRT API — Beta (API): Opt-in and Migration [26.10]*.
- **PR #413** — `feat: complete SCAPI migration with OCAPI fallback` (the pattern to mirror).
- **SCAPI MRT deployments OAS** — `git.soma.salesforce.com/cc-mercury-api/storefront-oas` → `deployments-oas/v1/api_spec/src/deployments.yaml` (`#L88-L191`). In-scope: `getDeploymentsForEnvironment`, `createDeploymentForEnvironment`, `getDeploymentById` (`--wait` status polling only). Out: `getBundlesForStorefront`, `uploadBundleForStorefront`.
- `docs/guide/authentication.md`, `docs/guide/configuration.md`, `docs/cli/auth.md`, `docs/cli/setup.md`.
