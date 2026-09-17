# Implementation Plan: W-24181435 — Complete the SCAPI Deployments Backend

## Context

The B2C CLI is migrating MRT operations from the legacy MRT Cloud API (`cloud.mobify.com`,
per-user API key) to the SCAPI Storefront Deployments API (scope-based OAuth). W-23941083 built
the `--mrt-backend` foundation (auto/legacy/scapi with safe one-shot fallback) and wired the
**deployment** operations, but left the two `/bundles` operations — **listing** and **uploading**
bundles — on the legacy backend.

This work finishes the Deployments v1.0.5 surface so a customer on the SCAPI backend can run the
full deploy workflow (list bundles → upload a local build → deploy) without falling back to legacy.
The generated SCAPI client already declares `getBundlesForStorefront` and `uploadBundleForStorefront`
(`storefront-deployments.generated.ts`); this work adds the SDK operation wrappers and the CLI wiring
on top, exactly mirroring the deployment operations delivered in W-23941083.

Spec: `docs/work/features/complete-scapi-deployments-backend/SPEC.md`.

## Key design decisions

- **File placement:** Both the legacy `listBundles` and the v2 multipart `uploadBundleV2` already
  live in `operations/mrt/push.ts`. To mirror `deployment.ts` (which holds legacy + SCAPI +
  backend-aware in one module), all new bundle wrappers go in `push.ts` next to their legacy
  counterparts. (The spec's Technical Context tentatively named `bundle.ts` for the list wrapper;
  `push.ts` is the correct home since the legacy `listBundles` lives there — noting the deviation.)
- **Payload parity (spec constraint):** `uploadBundleForStorefront`'s multipart fields
  (`bundle`, `message`, `rootDir`, `configPath`, `matchMode`) are identical to the legacy v2 upload.
  The SCAPI upload wrapper reuses `createBundleV2()` and builds the **same** `FormData` as
  `uploadBundleV2()` — no duplicated bundle-building logic.
- **Fallback safety for the two-call local-build deploy:** the SCAPI local-build path is
  `uploadBundleScapi` → (optional) `createDeploymentScapi`. Only the **upload** is fallback-eligible
  (if it throws a safe pre-execution `ScapiRequestError`, `runMrtWithFallback` retries on legacy —
  nothing was created yet). Once the upload succeeds a bundle exists on SCAPI, so a failure of the
  subsequent `createDeploymentScapi` is re-thrown as a **plain `Error`** (not a fallback trigger) to
  avoid a double-upload on legacy.
- **`--json` stays backend-specific:** backend-aware wrappers return normalized rows for the human
  table plus `raw` (the backend-native response) surfaced verbatim under `--json`, exactly like
  `listMrtDeployments` / `deployMrtBundle`.

## Implementation Steps

### Step 1 — SDK: SCAPI bundle-list wrapper + backend-aware `listMrtBundles`
**Files:** `packages/b2c-tooling-sdk/src/operations/mrt/push.ts`, `.../operations/mrt/index.ts`
- Add `MrtBundleView` (backend-neutral row: `id?`, `message?`, `status?`, `user?`, `created?`, `backend`).
- Add `normalizeLegacyBundle(MrtBundle)` and `normalizeBundleScapi(Bundle)` (legacy `id/message/status/user/created_at`
  ↔ SCAPI `bundleId/description/status/createdBy/creationDate`).
- Add `listBundlesScapi(conn, {storefrontId, limit, offset})` — GET
  `/organizations/{organizationId}/storefronts/{storefrontId}/bundles`, `READ_HEADERS`,
  `toOrganizationId(conn.tenantId)`, `createScapiRequestError` on failure. Mirrors `listDeploymentsScapi`.
- Add backend-aware `listMrtBundles(options)` using `runMrtWithFallback` (mirrors `listMrtDeployments`),
  returning `{backend, count, bundles: MrtBundleView[], raw}`.
- Reuse the `READ_HEADERS`/`buildScapiDeploymentsClient` helpers — factor the shared bits so they're
  not duplicated between `push.ts` and `deployment.ts` (export from `deployment.ts` or a small shared
  module; simplest: export `buildScapiDeploymentsClient` + header consts from `deployment.ts` and import).
- Export new symbols from the `operations/mrt/index.ts` barrel.
**Tests:** extend `test/operations/mrt/push.test.ts` (or a new `bundle-backend` block) with MSW —
scapi list happy path, auto fallback on a safe status (e.g. 403), no-fallback on 409/5xx.

### Step 2 — SDK: SCAPI bundle-upload wrapper `uploadBundleScapi`
**Files:** `packages/b2c-tooling-sdk/src/operations/mrt/push.ts`, barrel
- Add `uploadBundleScapi(conn, {storefrontId, bundle: BundleV2})` — builds the **same** `FormData` as
  `uploadBundleV2` (`bundle` Blob + `message`/`rootDir`/`configPath`/`matchMode`), POSTs
  `/organizations/{organizationId}/storefronts/{storefrontId}/bundles` with `WRITE_HEADERS`, returns
  `{bundleId, warnings, matches, raw}` from `BundleUploadResponse`. `createScapiRequestError` on non-2xx.
- Export from barrel.
**Tests:** MSW test asserting the multipart payload mirrors the legacy v2 shape (same field names/values;
uncompressed + gzip archive both accepted), and the 201 response maps to `bundleId`.

### Step 3 — SDK: backend-aware local-build `pushMrtBundle`
**Files:** `packages/b2c-tooling-sdk/src/operations/mrt/push.ts`, barrel
- Add `pushMrtBundle(options)` mirroring `deployMrtBundle`, via `runMrtWithFallback`:
  - **scapi branch:** `createBundleV2(...)` → `uploadBundleScapi(...)`; if a target is given,
    `createDeploymentScapi(...)` wrapped so a post-upload failure re-throws as a plain `Error`
    (non-fallback). Returns `{backend:'scapi', bundleId, deployed, deploymentId?, warnings, raw}`.
  - **legacy branch:** delegate to existing `pushBundle(...)` (v1 combined upload+deploy), returning the
    legacy `PushResult` as `raw` plus `{backend:'legacy', bundleId, deployed, warnings}`.
- Import `createDeploymentScapi` from `deployment.ts` (no circular import — `deployment.ts` does not
  import `push.ts`).
- Export `pushMrtBundle` + result type from barrel.
**Tests:** MSW — scapi upload+deploy happy path, scapi upload-only (no target), auto fallback when the
upload fails with a safe status, and **no** fallback when the post-upload deploy fails.

### Step 4 — CLI: make `mrt bundle list` backend-aware
**Files:** `packages/b2c-cli/src/commands/mrt/bundle/list.ts` (+ `test/commands/mrt/bundle/list.test.ts`)
- Rework columns onto `MrtBundleView`; keep default columns `id/message/status/user/created`,
  add a `backend` column (matches `history.ts`).
- Replace `requireMrtCredentials()` + `listBundles(...)` with `getMrtBackendContext()` →
  `listMrtBundles({preference, scapiConnection, legacyAuth, projectSlug, limit, offset, origin, onResolve})`.
- Override `supportsScapiMrt()` → `true`; return `result.raw` under `--json`; add a `--mrt-backend scapi`
  example (mirror `history.ts`).
**Tests:** legacy unchanged, scapi path, auto fallback, `--json` stays backend-specific.

### Step 5 — CLI: SCAPI path for `mrt bundle deploy` local build
**Files:** `packages/b2c-cli/src/commands/mrt/bundle/deploy.ts` (+ `test/commands/mrt/bundle/deploy.test.ts`)
- In `pushLocalBuild()`: remove `guardUnsupportedByScapiMrt('pushing a local build')` and the legacy-only
  `requireMrtCredentials()`; resolve `getMrtBackendContext()` and call the new `pushMrtBundle({...})`.
- Add `pushMrtBundle` to `operations`. Update the class doc comment (local build is no longer legacy-pinned).
- `--wait`: for `backend === 'scapi'` with a `deploymentId`, reuse the existing
  `waitForScapiDeploymentById(...)`; for legacy keep `waitForDeployment(...)`. Return `raw` under `--json`.
**Tests:** scapi local-build deploy (with/without `--environment`, with `--wait`), auto fallback, and
that the existing legacy behavior is unchanged.

### Step 6 — Housekeeping, docs, and verification
**Files:** `packages/b2c-tooling-sdk/src/cli/mrt-command.ts`, `.changeset/*.md`, `docs/cli/mrt.*`,
`skills/b2c-cli/skills/**`, `packages/b2c-tooling-sdk/data/tooling/index.json`
- Update the `init()` guard message + `supportsScapiMrt()` doc in `mrt-command.ts` to include
  `mrt bundle list` and the local-build `mrt bundle deploy` as SCAPI-capable.
- Add a changeset (`@salesforce/b2c-cli` + `@salesforce/b2c-tooling-sdk`, `minor`) describing SCAPI
  support for `mrt bundle list` and local-build `mrt bundle deploy`.
- Update MRT docs/user-facing skills for the two commands; regenerate the tooling index
  (`pnpm --filter @salesforce/b2c-tooling-sdk run generate:tooling-index`).
- Ensure copyright headers on any new/edited files.

## Test Strategy
- SDK: MSW-based unit tests in `test/operations/mrt/` covering the backend matrix
  (legacy / scapi / auto × list / local-build deploy), including auto fallback on
  `SAFE_SCAPI_FALLBACK_STATUSES` and no-fallback on 409/5xx, plus the payload-parity assertion for the
  SCAPI multipart upload (uncompressed + gzip).
- CLI: command tests for `list` and `deploy` across backends, asserting `--json` stays backend-specific.
- Run per step: `pnpm --filter @salesforce/b2c-tooling-sdk run test:agent`,
  `pnpm --filter @salesforce/b2c-cli run test:agent`.
- Before PR: `pnpm run typecheck:agent`, `pnpm run lint:agent`, `pnpm run -r format:check`,
  `pnpm --filter @salesforce/b2c-tooling-sdk run check:tooling-index`.

## Risks & Mitigations
- **Double-upload on fallback** — mitigated by making only the upload fallback-eligible and re-throwing
  post-upload deploy failures as plain errors (Step 3).
- **Circular imports** (`push.ts` ↔ `deployment.ts`) — one-directional (`push.ts` imports from
  `deployment.ts`); shared helpers exported from `deployment.ts`.
- **Backward compatibility** — legacy list/deploy paths are untouched; SCAPI is additive and gated by
  `--mrt-backend`. `--json` shapes remain backend-native.
- **Tooling-index drift failing CI** — regenerate and commit the index in Step 6.
