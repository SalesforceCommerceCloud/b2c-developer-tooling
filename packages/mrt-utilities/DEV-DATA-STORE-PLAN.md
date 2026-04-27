# Development Data Store Plan (`@salesforce/mrt-utilities`)

## Goal

Add a pseudo local data-store implementation for development mode so local runtimes do not fail when DynamoDB-backed MRT data store is unavailable.

This behavior should be activated through the existing package export condition:

- `@salesforce/mrt-utilities/data-store` + `--conditions development`

## Key Requirement

The pseudo local implementation must read default entry values from environment variables (as implied by the provided prototype):

- `SFNEXT_DATA_STORE_DEFAULTS` (JSON object map of key -> value object)
- `SFNEXT_DATA_STORE_WARN_ON_MISSING` (`"false"` disables warnings; default is warning enabled)

## Current State

- `./data-store` already has a `development` export condition in `package.json`, but it currently points to `src`.
- Desired update: point `development` to a built `dist` pseudo-local data-store output.
- Current `DataStore` implementation is DynamoDB-based and throws `DataStoreUnavailableError` when required MRT environment variables are missing.
- Existing tests primarily validate production/DynamoDB behavior.

## Proposed Design

## 1) Split data-store implementations

Create two implementation modules:

- **Production implementation** (existing behavior)
  - DynamoDB-backed
  - Preserves existing errors:
    - `DataStoreUnavailableError`
    - `DataStoreNotFoundError`
    - `DataStoreServiceError`
- **Development implementation** (new behavior)
  - No AWS dependency
  - Uses local defaults from env var JSON
  - Warns once per missing key (configurable)
  - Uses strict parity with production semantics by default for missing keys (throws not-found)
  - Optional lenient mode can be introduced as explicit opt-in for `{}` fallback during local experimentation

## 2) Preserve stable public API

Keep consumer import surface unchanged:

- `DataStore.getDataStore()`
- `DataStore#isDataStoreAvailable()`
- `DataStore#getEntry(key)`
- Existing error classes remain exported

This allows existing projects to adopt dev behavior without refactoring imports.

## 3) Route development exports

Use conditional exports to load the development implementation for local dev from built artifacts:

- `development` -> built dev pseudo-local data-store module in `dist`
- `import` / `require` -> production built outputs in `dist`

## 4) Environment variable behavior in dev store

### `SFNEXT_DATA_STORE_DEFAULTS`

- Parse as JSON object.
- Expected shape:
  - `{ "<entry-key>": { ...objectValue } }`
- On invalid JSON:
  - fall back to empty defaults
  - warn once with clear message

### `SFNEXT_DATA_STORE_WARN_ON_MISSING`

- If unset: warnings enabled
- If set to `"false"` (case-insensitive): disable missing-key warnings
- Any other value: warnings enabled

### Missing key semantics (dev mode)

- If key exists in parsed defaults and value is object: return that value.
- If key missing or invalid value type:
  - by default, throw `DataStoreNotFoundError` (production parity)
  - optionally warn once for that key before throwing
  - optional future opt-in lenient mode may return `{}` instead (must be off by default)

## 5) Tests

Add/adjust tests to cover both modes:

- **Production tests**
  - Keep current behavior assertions unchanged.
- **Development tests**
  - Reads defaults from `SFNEXT_DATA_STORE_DEFAULTS`
  - Throws `DataStoreNotFoundError` when key is absent (default behavior)
  - Warns once per missing key when warnings enabled
  - Does not warn when `SFNEXT_DATA_STORE_WARN_ON_MISSING=false`
  - Handles invalid JSON safely
  - (If lenient mode is added) returns `{}` only when explicitly enabled

## 6) Documentation updates

Update `packages/mrt-utilities/README.md` (or docs page if preferred) with:

- How to enable dev behavior (`node --conditions development`)
- Env var configuration examples for default data-store values
- Differences between dev and production data-store semantics

## Implementation Steps

1. Add a new dev data-store module in `src/data-store/`.
2. Move/keep current DynamoDB implementation as production module.
3. Ensure build output emits both implementations to `dist` (esm/cjs + types).
4. Update `package.json` exports so `development` resolves to the built dev pseudo-local module in `dist` (not `src`), while `import`/`require` continue resolving to production built outputs.
5. Add development-focused tests.
6. Run validation:
   - `pnpm --filter @salesforce/mrt-utilities run test:agent`
   - `pnpm --filter @salesforce/mrt-utilities run lint:agent`
   - `pnpm --filter @salesforce/mrt-utilities run typecheck:agent`
7. Add a changeset for `@salesforce/mrt-utilities` if this is considered user-facing behavior.

## Risks / Notes

- Strict production parity in dev is the default to avoid masking missing-key issues.
- Any lenient `{}` fallback behavior must be explicit opt-in and clearly documented.
- Existing export stripping behavior is already understood and is not changed by this plan.

## Acceptance Criteria

- Local development using `--conditions development` no longer fails due to missing DynamoDB/MRT runtime vars.
- Dev data-store entries are sourced from `SFNEXT_DATA_STORE_DEFAULTS`.
- Missing-key behavior is predictable and configurable via `SFNEXT_DATA_STORE_WARN_ON_MISSING`.
- Production behavior and API remain backward-compatible.
- No breaking public interface changes: existing import paths, exported symbols, and type surface for `@salesforce/mrt-utilities` and `@salesforce/mrt-utilities/data-store` remain intact (except correcting the `development` export target to built `dist` output).
- Default dev missing-key semantics match production (`DataStoreNotFoundError`), with no implicit `{}` fallback.
