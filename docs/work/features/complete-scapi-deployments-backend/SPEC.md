# Spec: Complete the SCAPI Deployments Backend

**GUS:** W-24181435
**Date:** 2026-09-15
**Author:** Oluwatimileyin Olaosebikan

---

## Context & Goal

The B2C CLI is migrating MRT (Managed Runtime) operations from the legacy MRT Cloud API (`cloud.mobify.com`, per-user API key) to the SCAPI Storefront Deployments API (scope-based OAuth). W-23941083 established the `--mrt-backend` foundation (auto/legacy/scapi with safe one-shot fallback) and wired the deployment operations, but left the two `/bundles` operations — listing and uploading bundles — on the legacy backend.

This work completes the Deployments v1.0.5 spec by adding SCAPI support for the remaining bundle operations, so that customers opting into the SCAPI backend can run their full deploy workflow (list bundles, upload a local build, and deploy) without falling back to the legacy API. The generated SCAPI client already declares `getBundlesForStorefront` and `uploadBundleForStorefront`; this work adds the SDK operation wrappers and CLI wiring on top.

**Who benefits:** MRT customers migrating to the SCAPI-based auth model, and the broader Beta opt-in/migration effort (epic *SCAPI MRT API — Beta*).

## Acceptance Criteria

### Scenario: List bundles via SCAPI backend

```gherkin
Given a project configured for MRT with valid SCAPI credentials
When I run `mrt bundle list --mrt-backend scapi`
Then bundles are read via getBundlesForStorefront (storefrontId = mrtProject, organizationId = f_ecom_<tenant>)
And the output matches the bundles returned by the SCAPI Deployments API
```

### Scenario: List bundles on legacy backend is unchanged

```gherkin
Given a project configured for MRT
When I run `mrt bundle list --mrt-backend legacy`
Then bundles are read via the legacy MRT Cloud API exactly as before
```

### Scenario: Auto backend falls back on a safe pre-execution error

```gherkin
Given `mrt bundle list` running under `--mrt-backend auto`
When the SCAPI call fails with a safe pre-execution error (e.g. 401/403/404/415)
Then the command transparently falls back to the legacy backend once
And returns the legacy result
```

### Scenario: Auto backend does NOT fall back on unsafe errors

```gherkin
Given a command running under `--mrt-backend auto`
When the SCAPI call fails with 409, 5xx, 429, or a network error
Then the command surfaces the error and does not fall back to legacy
```

### Scenario: Local-build deploy over SCAPI

```gherkin
Given a local build and no bundle ID
When I run `mrt bundle deploy --mrt-backend scapi`
Then the build is uploaded via uploadBundleForStorefront as multipart/form-data
And a deployment is created via the existing SCAPI create-deployment path
And the command no longer errors on the local-build path under scapi
```

### Scenario: Local-build deploy under auto

```gherkin
Given a local build and no bundle ID under `--mrt-backend auto`
When I run `mrt bundle deploy`
Then the upload + deploy runs over SCAPI (with safe fallback to legacy as applicable)
```

### Scenario: SCAPI upload payload mirrors the legacy bundle shape

```gherkin
Given a local build to be uploaded via SCAPI (uploadBundleForStorefront)
When the multipart/form-data payload is constructed
Then it mirrors the legacy bundle payload shape produced by createBundleV2 / uploadBundleV2
And it supports both an uncompressed and a gzip tar archive
And the same bundle-building logic is reused rather than duplicated, so the two backends stay in sync
```

### Scenario: JSON output stays backend-specific

```gherkin
Given any of the above commands with `--json`
When the command runs against a given backend
Then the JSON shape reflects that backend's response and is not normalized across backends
```

## Constraints & Out of Scope

### Constraints

- **Payload parity:** The SCAPI multipart/form-data upload must mirror the legacy v2 bundle payload shape (`createBundleV2` / `uploadBundleV2`), supporting both uncompressed and gzip tar archives. Reuse the existing bundle-building logic rather than duplicating it.
- **Backend selection semantics unchanged:** Reuse the W-23941083 foundation — `--mrt-backend auto/legacy/scapi`, precedence (flag > env > dw.json > auto), the `supportsScapiMrt()` guard, and `runMrtWithFallback` (safe one-shot fallback only on `SAFE_SCAPI_FALLBACK_STATUSES`; never on 409/5xx/429/network).
- **Backward compatibility:** Legacy `mrt bundle list` / `mrt bundle deploy` behavior must be unchanged. `--json` output stays backend-specific (not normalized).
- **Identifier mapping:** `getBundlesForStorefront` uses storefrontId = mrtProject, organizationId = `f_ecom_<tenant>`.
- **No new dependencies.** Build on the existing SCAPI client factory and openapi-fetch multipart handling.
- **Test coverage:** Unit + MSW tests covering the full backend matrix (legacy/scapi/auto × list/deploy).

### Out of Scope

- Migrating other MRT bundle commands (`download`, `delete`, `save`, `upload-v2`, `history`) to SCAPI — this work covers only `list` and the local-build `deploy` path.
- Deploying an existing bundle by ID over SCAPI (this work covers only the no-bundle-ID local-build path).
- Changes to the `--mrt-backend` foundation itself (delivered by W-23941083).
- Deprecating or removing the legacy MRT Cloud API.

## Technical Context & References

### Target Files / Directories

- `packages/b2c-tooling-sdk/src/operations/mrt/bundle.ts` — add a SCAPI list wrapper (`getBundlesForStorefront`) alongside the existing legacy `listBundles`.
- `packages/b2c-tooling-sdk/src/operations/mrt/push.ts` — add a SCAPI upload wrapper (`uploadBundleForStorefront`) mirroring the multipart `uploadBundleV2`.
- `packages/b2c-tooling-sdk/src/clients/storefront-deployments.ts` — SCAPI Deployments client; `getBundlesForStorefront` / `uploadBundleForStorefront` already declared in `.generated.ts`.
- `packages/b2c-cli/src/commands/mrt/bundle/list.ts` — make backend-aware (currently legacy-only).
- `packages/b2c-cli/src/commands/mrt/bundle/deploy.ts` — add a SCAPI path to the local-build (`pushLocalBuild`) branch; set/keep `supportsScapiMrt()`.
- `packages/b2c-tooling-sdk/src/operations/mrt/index.ts` — barrel; export any new operation wrappers.

### Existing Patterns to Reuse

- **Multipart upload:** `push.ts` `pushBundleV2` / `uploadBundleV2` build a real `FormData` and hand it to openapi-fetch so the `multipart/form-data` Content-Type + boundary are set automatically.
- **Bundle building:** `bundle.ts` `createBundleV2` (uncompressed/gzip tar; constants `DEFAULT_V2_ROOT_DIR`, `DEFAULT_V2_CONFIG_PATH`, `DEFAULT_V2_MATCH_MODE`) — reuse for payload parity.
- **Backend selection + fallback:** `cli/mrt-command.ts` (`--mrt-backend` flag, `mrtBackendPreference`, `supportsScapiMrt()`, `ScapiMrtConnection`), `operations/mrt/mrt-backend.ts` (`resolveMrtBackend`, `runMrtWithFallback`), `clients/scapi-backend-utils.ts` (`SAFE_SCAPI_FALLBACK_STATUSES`, `isFallbackTrigger`).
- **SCAPI deployment ops** (the create-deployment path deploy reuses): `operations/mrt/deployment.ts` (`listDeployments`, `createDeployment`).
- **CLI reference for backend-aware commands:** `deploy.ts` and `history.ts` as templates for wiring `list.ts`.

### Test Strategy

- MSW-based unit tests in both packages, covering the backend matrix (legacy / scapi / auto × list / local-build deploy), including auto fallback on safe statuses and no-fallback on 409/5xx/429/network.
- Assert the SCAPI multipart payload matches the legacy v2 bundle shape (uncompressed + gzip tar).
- Assert `--json` output stays backend-specific.
- Extend/mirror existing tests: SDK `test/operations/mrt/{bundle,deployment,mrt-backend}.test.ts`, `test/clients/storefront-deployments.test.ts`; CLI `test/commands/mrt/bundle/{list,deploy}.test.ts`.

### References

- GUS: W-24181435 (this item); builds on W-23941083 (`--mrt-backend` foundation + Deployments client).
- Epic: SCAPI MRT API — Beta (API): Opt-in and Migration [26.10].
- Deployments spec v1.0.5 — base path `/storefront/deployments/v1`, scope `sfcc.storefront.deployments[.rw]`.
