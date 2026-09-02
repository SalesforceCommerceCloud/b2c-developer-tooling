# Spec: Support v2 bundle upload in b2c-developer-tooling

**GUS:** W-24044590
**Date:** 2026-08-31
**Author:** Kieran Haberstock

---

## Context & Goal

Managed Runtime has introduced a **v2 bundle format and upload API** (portal_app PR #8026, "Cohort 1 SCAPI APIs"). It differs from the v1 upload that `b2c-developer-tooling` supports today in three material ways:

1. **Transport:** `multipart/form-data` with the raw archive bytes in a `bundle` part — not a base64-encoded tar embedded in a JSON body.
2. **Config location:** `ssrOnly` / `ssrShared` / `ssrParameters` / `bundleMetadata` move **inside** the archive as a JSON file at `{rootDir}/{configPath}` (default `bld/.mrt/config.json`), rather than being sent as request fields.
3. **Matching & limits:** v2 supports **glob patterns** for SSR file matching (with a `matchMode` of `strict` or `ignore_missing`) and enforces new per-category file/size limits.

Today the tooling only speaks v1 (`createBundle` → base64 tar → JSON POST to `/api/projects/{slug}/builds/`). To let MRT developers and CI/CD flows adopt the v2 format during the SCAPI-MRT beta/migration, the SDK and CLI need a v2 upload path.

**Goal:** Add an SDK operation that builds a v2-format archive from a local build directory (writing the in-archive `.mrt/config.json`, honoring glob patterns) and uploads it via multipart to the direct MRT v2 endpoint `POST api/v2/projects/{project_slug}/bundles/` — keeping MRT API-key auth and a **configurable origin** (so it targets different MRT control planes, e.g. `cloud.mobify.com` and the soak host, exactly like the existing bundle operations). Surface it through a new, dedicated **`b2c mrt bundle upload-v2`** command. The command is **upload-only**; deploying an uploaded bundle stays a separate step via the existing `b2c mrt bundle deploy <bundleId>`.

## Acceptance Criteria

### Scenario: Build and upload a v2 bundle from a build directory

```gherkin
Given a valid MRT API key and a built application in the build directory
And SSR configuration (ssrOnly, ssrShared, ssrParameters) resolved from flags or config.server.js
When I run `b2c mrt bundle upload-v2` for a project
Then a v2 archive is created with the SSR config written to bld/.mrt/config.json
And the archive is uploaded as multipart/form-data to POST api/v2/projects/{project_slug}/bundles/
And the command reports the returned bundle id, any warnings, and the matched ssr_only/ssr_shared files
```

### Scenario: Target a non-default MRT control plane

```gherkin
Given an origin override for a non-default MRT control plane (e.g. the soak host)
When I run `b2c mrt bundle upload-v2` with that origin
Then the multipart upload is sent to that origin, matching how existing bundle operations accept an origin
```

### Scenario: All v2 API parameters are exposed as options

```gherkin
Given the `b2c mrt bundle upload-v2` command
Then it exposes message, rootDir, configPath, and matchMode as flags mapping to the multipart request fields
And it exposes ssrOnly, ssrShared, ssrParameters, and bundleMetadata (dependencies, ccOverrides) as options written into the in-archive config file
And rootDir/configPath used to build the archive match the values sent as request fields
And each option has a sensible default matching the server default
```

### Scenario: Glob matching mode

```gherkin
Given ssrOnly/ssrShared patterns that include globs and some patterns match no files
When I upload with --match-mode ignore_missing
Then the upload succeeds
When I upload with --match-mode strict
Then the server rejects patterns that match nothing and the error is surfaced clearly
```

### Scenario: Upload-only — no implicit deploy

```gherkin
Given a successful v2 upload returning a bundle id
When `b2c mrt bundle upload-v2` completes
Then no deployment is triggered
And the output tells the user how to deploy the bundle (b2c mrt bundle deploy <bundleId> --environment ...)
```

### Scenario: Server-side validation errors are surfaced

```gherkin
Given a v2 upload that violates a server constraint (missing bundle file, bundle too large, storefront not SSR, or bundle type mismatch)
When the upload is attempted
Then the command fails with a clear message derived from the server error
```

### Scenario: Non-blocking warnings are shown

```gherkin
Given the server returns warnings (e.g. a deprecated Node runtime)
When the v2 upload succeeds
Then each warning is surfaced to the user without failing the command
```

## Constraints & Out of Scope

### Constraints
- Target the **direct MRT v2 endpoint** `POST api/v2/projects/{project_slug}/bundles/` (not the SCAPI-fronted route); keep **MRT API-key auth**.
- **Origin must be configurable** and behave exactly like the existing bundle operations (support `cloud.mobify.com`, the soak host, etc.).
- All server-side v2 parameters are exposed as CLI flags / SDK options, with defaults matching the server (see mapping below). This set was verified field-by-field against the `UploadBundleV2` source in PR #8026 and is complete.
- The MRT client is generated from an OpenAPI spec (`packages/b2c-tooling-sdk/specs/mrt-api-v1.json` → `mrt.generated.ts`); the v2 endpoint must be added to the spec (or the multipart call otherwise typed) and the client regenerated via `pnpm generate:types`.
- Backward compatible: existing v1 `pushBundle` / `uploadBundle` / `b2c mrt bundle deploy` behavior is unchanged; v2 is purely additive.
- The builder must keep `rootDir`/`configPath` consistent between where it writes the config file inside the archive and the request fields, and must place built files under `rootDir` (default `bld/`) so the server finds `bld/.mrt/config.json`.
- Follow repo conventions: copyright headers, SDK logger usage, table/JSON output, docs + skills updates, tests (Mocha/Chai/MSW), and a changeset.

### v2 parameter mapping (reference)

The parameter set below was confirmed exhaustive by a direct source read of PR #8026: the `@extend_schema` request declaration on `UploadBundleV2`, every `request.data`/`request.headers` access in `BundleUploadV2Mixin.upload_bundle_v2()`, and `parse_bundle_config_v2()`. The internal `api/v2/...` route and the SCAPI route accept an identical parameter set.

**Request-level multipart fields** (`POST api/v2/projects/{project_slug}/bundles/`):

| Server field | Type / values | Default | CLI flag | SDK option |
|---|---|---|---|---|
| *(path)* `project_slug` | string | required | `--project` / `-p` (or `MRT_PROJECT`) | `projectSlug` |
| `bundle` | file (binary archive) | required | *built from* `--build-dir` / `-b` (default `build`) | `buildDirectory` / `archivePath` |
| `message` | string | `""` | `--message` / `-m` | `message` |
| `rootDir` | string (≤256) | `bld` | `--root-dir` | `rootDir` |
| `configPath` | string (≤256) | `.mrt/config.json` | `--config-path` | `configPath` |
| `matchMode` | `strict` \| `ignore_missing` | `strict` | `--match-mode` | `matchMode` |

**In-archive config file** (`{rootDir}/{configPath}` → default `bld/.mrt/config.json`), written by the builder from these options:

| Config field | Type | CLI flag | SDK option |
|---|---|---|---|
| `ssrOnly` | string[] (globs/literals) | `--ssr-only` | `ssrOnly` |
| `ssrShared` | string[] (globs/literals) | `--ssr-shared` | `ssrShared` |
| `ssrParameters` | object (open key set) | `--ssr-param key=value` (repeatable) + `--node-version` / `-n` | `ssrParameters` |
| `bundleMetadata.dependencies` | object | `--dependencies` (JSON/file, or auto-derived) | `bundleMetadata.dependencies` |
| `bundleMetadata.ccOverrides` | string[] | `--cc-override` (repeatable) | `bundleMetadata.ccOverrides` |

**Notes:**
- **Version attribution (`User-Agent`):** MRT derives the stored bundle `version` from the request's `User-Agent` header (regex semver extraction; stores `"Unknown"` if absent/unmatched). The command's HTTP client should send a `User-Agent` containing a semver so the bundle version is attributed correctly. This is a client-config detail, not a user-facing flag.
- **`ssrParameters` is an open dict:** no sub-key allowlist is enforced at upload time, so `--ssr-param` accepts any key. `SSRFunctionNodeVersion` (convenience: `--node-version`) and `EnvBasePath` are the keys with defined downstream meaning (they shape the SCAPI response's runtime/envBasePath). An `--env-base-path` convenience flag is optional; `--ssr-param EnvBasePath=…` works regardless. This differs from `bundleMetadata`, whose sub-keys **are** strictly allowlisted to `dependencies`/`ccOverrides`.
- **`streamingEnabled` is not an input:** it is computed server-side from the matched entry module and surfaced read-only; do not expose it as an option.

**Connection** (unchanged from existing bundle ops): origin via `--origin` / `MRT_ORIGIN` / `mrtOrigin` in `dw.json`; MRT API-key auth.

### Out of Scope
- The **SCAPI-fronted** upload route (`storefront/deployments/v1/.../bundles/`) and Account Manager OAuth / mTLS auth.
- Combined upload-and-deploy for v2 — deploying stays a separate step (`b2c mrt bundle deploy <bundleId>`).
- Deprecating or removing the v1 upload path (`b2c mrt bundle deploy` push behavior).
- Resolving whether the direct `api/v2/...` route's current `IsSuperUser` / `FITAuthentication` gating permits normal API-key callers — **flagged as an open risk** for the MRT team, not solved here.

## Technical Context & References

### Target Files / Directories
- `packages/b2c-tooling-sdk/src/operations/mrt/bundle.ts` — add a v2 archive builder (in-archive `.mrt/config.json`, glob-aware layout under `rootDir`)
- `packages/b2c-tooling-sdk/src/operations/mrt/push.ts` — new `uploadBundleV2` / `pushBundleV2` operation (multipart POST)
- `packages/b2c-tooling-sdk/src/operations/mrt/index.ts` — export the new operation + option/result types
- `packages/b2c-tooling-sdk/specs/mrt-api-v1.json` + `pnpm generate:types` — add the v2 endpoint, regenerate `src/clients/mrt.generated.ts`
- `packages/b2c-cli/src/commands/mrt/bundle/upload-v2.ts` — new dedicated CLI command
- `docs/` MRT guide + `skills/b2c-cli/skills/` — CLI reference updates

### Existing Patterns to Reuse
- `createBundle()` (tar-fs archive creation, glob filtering via `minimatch`), `pushBundle()` / `uploadBundle()` (upload flow, warnings passthrough), `createMrtClient()` (origin normalization, auth/rate-limit/logging middleware; note `maskBodyKeys` for large payloads)
- `MrtCommand` base class + `baseFlags` (project/environment/origin resolution from flags/env/`dw.json`), `enableJsonFlag`, i18n `t()` / `withDocs`, and the 403/auth error hinting in `mrt/bundle/deploy.ts`
- `b2c mrt bundle save` pattern if a "save v2 archive locally" option is wanted later

### Test Strategy
- SDK unit tests: v2 archive builder writes `{rootDir}/{configPath}` correctly, glob matching, metadata, defaults; MSW handler asserting the multipart request shape (parts + values) and mapping the `201 { id, warnings, matches }` response
- CLI command tests: flag→option mapping for every documented parameter, origin override, `matchMode` behavior, warning surfacing, error surfacing; stdout silenced per repo test conventions
- Follow the Mocha/Chai/MSW testing skill

### References
- GUS: W-24044590 (epic: SCAPI MRT API — Beta (API): Opt-in and Migration [26.10])
- HLD: *SCAPI-fying MRT APIs* — https://docs.google.com/document/d/1o4bjPB6BJcO7L1myvzSuJ3f8NXCfPe7B3mmpKD63Tk8/edit
- portal_app PR #8026 "Cohort 1 SCAPI APIs" (branch `scapi-bundle-v2-feature-branch`); key files: `portal/core/views/bundle.py` (`UploadBundleV2`), `portal/core/views/mixins/bundles.py` (field constants + `upload_bundle_v2()`), `portal/core/bundle.py` (`parse_bundle_config_v2`, `validate_bundle_archive_v2`)
