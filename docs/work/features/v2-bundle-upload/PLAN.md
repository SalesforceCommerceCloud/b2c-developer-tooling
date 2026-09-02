# Implementation Plan: W-24044590 — `b2c mrt bundle upload-v2`

## Story Context
Add a v2 bundle upload path to the SDK + CLI. Build a **gzip tar** archive from a local build
directory with entries under `{rootDir}/…` (default `bld/`, **no** project-slug prefix), an
in-archive config JSON at `{rootDir}/{configPath}` (default `bld/.mrt/config.json`), and upload it as
`multipart/form-data` to the **direct** MRT endpoint `POST api/v2/projects/{project_slug}/bundles/`.
Keep MRT API-key auth and configurable origin. **Upload-only** — no deploy chaining.

Contract (verified against portal_app PR #8026 @ `713184c9`):
- Multipart parts: `bundle` = raw `.tar.gz` bytes (part filename `bundle.tar.gz`,
  `application/octet-stream`; not enforced server-side), plus sibling **text** fields `message`,
  `rootDir`, `configPath`, `matchMode`.
- Config JSON keys: `ssrOnly`, `ssrShared`, `ssrParameters`, optional `bundleMetadata`
  (`dependencies`, `ccOverrides`).
- Config file lookup = exact tar-entry match on `{rootDir}/{configPath}`. Glob matching for
  `ssrOnly`/`ssrShared` runs on **rootDir-stripped** paths (users write `ssr.js`, `static/**/*`
  exactly as for v1 — no transform needed). Entries outside `rootDir` are silently ignored.
- Response `201 { id, warnings, matches }`. Version attribution comes from `User-Agent` (already set
  by the global SDK/CLI middleware — no flag needed).

## Implementation Steps

### Step 1: Add v2 endpoint to the OpenAPI spec + regenerate client types
**Files:** `packages/b2c-tooling-sdk/specs/mrt-api-v1.json`, `packages/b2c-tooling-sdk/src/clients/mrt.generated.ts` (regen)
Add `POST /api/v2/projects/{project_slug}/bundles/` with `multipart/form-data` requestBody
(`bundle` binary + `message`/`rootDir`/`configPath`/`matchMode` strings) and a `201` response schema
`{ id: integer, warnings: string[], matches: object }`. Regenerate via `pnpm generate:types`.

### Step 2: v2 archive builder in `bundle.ts`
**Files:** `packages/b2c-tooling-sdk/src/operations/mrt/bundle.ts`
Add `createBundleV2(options)` returning `{ archive: Buffer, rootDir, configPath, matchMode, message,
config }`. Uses `tar-fs` with a `{rootDir}` prefix (no project slug), injects `{rootDir}/{configPath}`
config JSON via `tar-fs`'s `finalize:false`/`finish` hook, pipes through `zlib.createGzip()`. Reuses
`loadServerConfig`, the SSR defaults, and the `DEFAULT_SSR_PARAMETERS` merge. Adds
`CreateBundleV2Options` (adds `rootDir`, `configPath`, `matchMode`, `bundleMetadata`) and `BundleV2`
types. Leaves v1 `createBundle` untouched.

### Step 3: `uploadBundleV2` / `pushBundleV2` in `push.ts`
**Files:** `packages/b2c-tooling-sdk/src/operations/mrt/push.ts`
`uploadBundleV2(client, projectSlug, bundleV2)` builds a `FormData` (`bundle` Blob + text fields) and
POSTs with a custom identity `bodySerializer` (so openapi-fetch does not JSON-stringify and fetch sets
the multipart boundary). Maps `201 { id, warnings, matches }` → `PushV2Result { bundleId, projectSlug,
message, warnings, matches }`. `pushBundleV2(options, auth)` wires `createBundleV2` →
`createMrtClient({origin})` → `uploadBundleV2`. Error text mirrors v1 (`Failed to push bundle: …`).

### Step 4: Barrel exports
**Files:** `packages/b2c-tooling-sdk/src/operations/mrt/index.ts`
Export `createBundleV2`, `uploadBundleV2`, `pushBundleV2` and the new option/result types.

### Step 5: CLI command `mrt bundle upload-v2`
**Files:** `packages/b2c-cli/src/commands/mrt/bundle/upload-v2.ts`
New `MrtCommand`, `enableJsonFlag`. Flags: `--message/-m`, `--build-dir/-b` (default `build`),
`--root-dir` (default `bld`), `--config-path` (default `.mrt/config.json`), `--match-mode`
(`strict`|`ignore_missing`, default `strict`), `--ssr-only`, `--ssr-shared`, `--node-version/-n`,
`--ssr-param` (repeatable), `--dependencies` (JSON/file), `--cc-override` (repeatable). Reuses
`parseGlobPatterns`/`parseSsrParams`. Calls `pushBundleV2`, prints bundle id + warnings + server
`matches` + a "deploy next with `b2c mrt bundle deploy <id> --environment …`" hint. Reuses the
403/auth hinting from `deploy.ts`.

### Step 6: Tests
**Files:** `packages/b2c-tooling-sdk/test/operations/mrt/bundle.test.ts`, `.../push.test.ts`,
`packages/b2c-cli/test/commands/mrt/bundle/upload-v2.test.ts`
- SDK builder: gunzip+untar the archive → assert entries under `bld/`, config at exact
  `bld/.mrt/config.json` with correct keys, `rootDir`/`configPath` overrides honored, defaults,
  `bundleMetadata`.
- SDK upload: MSW handler on `api/v2/projects/:slug/bundles/` asserting multipart parts (`bundle`
  present, `message`/`rootDir`/`configPath`/`matchMode` text values), response mapping, error surfacing.
- CLI: flag→option mapping for every documented parameter, origin override, `matchMode`, warning +
  error surfacing; stdout silenced via `stubCommandConfigAndLogger()`.

### Step 7: Docs, skills, changeset
**Files:** `docs/` MRT guide, `skills/b2c-cli/skills/…`, `.changeset/*.md`
Document `upload-v2` (upload-only, v2 format, parameter table). Changeset targeting
`@salesforce/b2c-cli` + `@salesforce/b2c-tooling-sdk` (minor — new feature).

## Test Strategy
Each step is independently testable; run `pnpm --filter … run test:agent` after Steps 2–6 and
`lint:agent` + `typecheck:agent` before finishing. Round-trip archive assertions (gunzip/untar) verify
the exact tar-entry layout the server requires.

## Risks & Mitigations
- **openapi-fetch multipart:** default serializer JSON-stringifies → mitigated by passing real
  `FormData` + identity `bodySerializer` and never manually setting `Content-Type`. Covered by an MSW
  multipart-shape test.
- **`tar-fs` extra-entry injection:** use the documented `finalize:false`/`finish(pack)` hook; verified
  by the untar test.
- **Direct `api/v2` route auth gating** (`IsSuperUser`/`FITAuthentication` in the PR): out of scope —
  flagged in SPEC as an MRT-team open risk; the client is correct regardless.

## Constraint
Per the user's instruction, all changes remain **uncommitted** in the working tree: no PLAN.md commit,
no per-step commits, no push, no PR. Self-review still runs via the code-review subagent against the
uncommitted diff.
