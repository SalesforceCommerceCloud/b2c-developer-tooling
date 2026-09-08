# Implementation Plan: W-23941083 — Add `--mrt-backend` flag (legacy MRT API ↔ SCAPI MRT Deployments)

## Context

The SCAPI MRT API (Storefront Deployments v1) is replacing the legacy MRT Cloud API (`cloud.mobify.com`, per-user API key). Developers need to adopt SCAPI MRT (OAuth `AmOAuth2`, scopes `sfcc.storefront.deployments[.rw]`) at their own pace without breaking existing `b2c mrt` workflows. This story adds a dedicated **`--mrt-backend`** flag (`auto` | `legacy` | `scapi`, default `auto`) — deliberately separate from `--api-backend` (Slack decision w/ Charles Lavery) — and a **net-new SCAPI MRT client covering only deployment list + deployment create**, mirroring the OCAPI↔SCAPI fallback pattern from PR #413. Proving the pattern on this narrow surface first de-risks the broader MRT migration. Full spec: `docs/work/features/mrt-backend-flag/SPEC.md`.

## Decisions locked (with the user)

1. **`MrtCommand extends OAuthCommand`** (not `BaseCommand`, not `InstanceCommand`). `OAuthCommand` already supplies every SCAPI prerequisite — `--client-id`/`--client-secret`/`--short-code`/`--tenant-id`/JWT flags, `getOAuthStrategy()`, `getOrganizationId()` (= `f_ecom_<tenant>`), `requireTenantId()`, `hasFullOAuthCredentials()` — with **no `-p` collision** (InstanceCommand's `--password` uses `-p`, which MRT uses for `--project`) and none of the OCAPI/WebDAV/lifecycle/`--api-backend` surface MRT doesn't use.
2. **`--wait` on SCAPI is implemented via list-polling** — after create, poll the in-scope `getDeploymentsForEnvironment`, match the returned `deploymentId`, report `status`/`progress` until `finished`/`failed`. No scope expansion (does **not** add `getDeploymentById`).
3. **ID mapping is direct 1:1**: `storefrontId = mrtProject`, `environmentId = mrtEnvironment`, `organizationId = f_ecom_<tenant>`. Add a **`--storefront` / `-s` alias** on the existing `--project` flag (mirroring the `environment`/`target` alias) so SCAPI users can use the storefront term for the same value. (`-s` confirmed free.)

## Implementation Steps

### Step 1: Config layer — add `mrtBackend`
**Files:** `config/types.ts` (add `mrtBackend?: 'auto'|'legacy'|'scapi'` to `NormalizedConfig`); `config/dw-json.ts` (`mrtBackend` on `DwJsonConfig`); `config/mapping.ts` (forward/reverse/merge, alongside `apiBackend`); `config/sources/env-source.ts` (`MRT_BACKEND`/`SFCC_MRT_BACKEND` alias + `ENUM_FIELDS` validation); `cli/config.ts` (`extractMrtFlags` sets `mrtBackend`).
**Description:** Mirror every place `apiBackend` is wired, for `mrtBackend`. Precedence (flag > `MRT_BACKEND` env > `mrtBackend` dw.json) falls out of the existing resolver ordering. **Tests:** extend `test/config/env-source.test.ts` + mapping/precedence tests.

### Step 2: `MrtCommand` → `OAuthCommand`, flags, accessors, SCAPI-eligibility helper
**Files:** `cli/mrt-command.ts`.
**Description:**
- Change base to `OAuthCommand`. `baseFlags = {...OAuthCommand.baseFlags, ...MRT flags}` — keep `api-key`, `project` (add `aliases: ['storefront']`, `charAliases: ['s']`), `environment` (existing `target` alias), `cloud-origin`, `credentials-file`; add `mrt-backend` (`Flags.option({options:['auto','legacy','scapi'], env:'MRT_BACKEND'})`, default resolved to `auto` via accessor).
- Override `loadConfiguration()` to merge **both** `extractOAuthFlags(this.flags)` and `extractMrtFlags(this.flags)` into the `loadConfig` call (today it only does `extractMrtFlags`).
- Add `get mrtBackendPreference(): 'auto'|'legacy'|'scapi'` → `this.resolvedConfig.values.mrtBackend ?? 'auto'` (parallels `InstanceCommand.apiBackendPreference`).
- Add `protected getScapiMrtConfig(): ScapiClientConfig | undefined` — **built directly** (NOT via `createB2CInstance`, which throws without a hostname): require `resolvedConfig.values.shortCode` && `tenantId`, then build a **stateless** strategy only (client-credentials via `hasFullOAuthCredentials()`, or JWT via cert/key config). Reuse an existing stateless-strategy factory if one is exported; else construct `OAuthStrategy`/`JwtOAuthStrategy` directly (both implement `withAdditionalScopes`/`getAccessTokenForCascade`, which `buildScapiClient`'s scope-cascade requires). Keep `getMrtAuth()` (legacy API-key) untouched.
**Tests:** extend `test/cli/mrt-command.test.ts` — flag presence, `--storefront`/`-s` resolves to project, `mrtBackendPreference` precedence, `getScapiMrtConfig` returns config when eligible / `undefined` when missing shortCode/tenant/stateless-auth.

### Step 3: SCAPI MRT Deployments client + generated types
**Files:** `specs/storefront-deployments-v1.yaml` (**net-new — fetch from `git.soma.salesforce.com/cc-mercury-api/storefront-oas` → `deployments-oas/v1/api_spec/src/deployments.yaml`**); `package.json` `generate:types` chain; `clients/scapi-mrt-deployments.ts`; `clients/index.ts` (barrel); `docs/typedoc.json` (entry point).
**Description:** Add the OAS to `specs/`, wire `openapi-typescript` to emit `clients/scapi-mrt-deployments.generated.ts`. Build the runtime client with `buildScapiClient<paths>({pathSegment:'storefront/deployments/v1', domainKey:'scapi-mrt-deployments', scopeCascade: SCAPI_DEPLOYMENTS_CASCADE, logPrefix:'SCAPI-MRT-DEPLOY'}, config, auth)`, modeled on `clients/scapi-jobs.ts`. Cascade: `read: [['sfcc.storefront.deployments.rw'],['sfcc.storefront.deployments']]`, `write: [['sfcc.storefront.deployments.rw']]`. **Tests:** client-factory test (baseUrl, cascade) modeled on the jobs client test.

### Step 4: MRT backend selection + backend-aware operations
**Files:** new `operations/mrt/mrt-backend.ts` (selection/fallback helper); `operations/mrt/deployment.ts` (`listDeployments`, `createDeployment`, new SCAPI `waitForDeployment` list-poll); shared normalized view type.
**Description:**
- Selection helper reuses `clients/scapi-backend-utils.ts` (`isFallbackTrigger`, `SAFE_SCAPI_FALLBACK_STATUSES` = 400/401/403/404/405/406/415). Rules: `legacy` → legacy only; `scapi` → SCAPI only, **no** fallback (surface errors, incl. 409); `auto` → try SCAPI when `getScapiMrtConfig()` present, fall back to legacy on safe-status/missing-prereqs (warn), **never** on 429/5xx/network. **409 is never a fallback trigger** (a create must not cross backends). Backend is **pinned per invocation** (resolve once, reuse for all pages). Since MRT SCAPI has no OCAPI-equivalent, use a direct legacy/scapi branch (per `compat/dispatcher.ts` guidance for SCAPI-only ops) rather than the full `BackendDispatcher`.
- Make `listDeployments`/`createDeployment` backend-aware: accept `{preference, scapiConfig?, auth (legacy), projectSlug/storefrontId, targetSlug/environmentId, organizationId, origin}`; route to the SCAPI deployments client or legacy `createMrtClient`. **Normalize** SCAPI `Deployment` (`deploymentId`, `status` queued|in_progress|failed|finished, `deploymentType`, `creationDate`, `createdBy`, nested `bundle{bundleId,description}`) and legacy list shape into one `MrtDeploymentView` the command table consumes; `createDeployment` returns a common result carrying optional `deploymentId` (SCAPI) for `--wait`.
- SCAPI `waitForDeployment`: poll `getDeploymentsForEnvironment`, match `deploymentId`, resolve on `finished`/`failed`, honoring `--poll-interval`/`--timeout`.
**Tests:** selection/fallback unit tests modeled on `test/clients/scapi-fallback-backend.test.ts` + `test/compat/dispatcher.test.ts` (safe-status fallback, invalid-scope trigger, 429/5xx/network → no fallback, 409 → no fallback, pin-per-invocation, warn-on-fallback); operations tests with MSW for SCAPI-vs-legacy + shape normalization + list-poll wait.

### Step 5: Wire commands + unsupported-operation guardrails + debug output
**Files:** `commands/mrt/bundle/history.ts`, `commands/mrt/bundle/deploy.ts`; small guardrail helper on `MrtCommand`.
**Description:**
- `history` (list) and `deploy <bundleId>` (create) are the **supported** subset — route through Step-4 selection; table reads the normalized view.
- `deploy`: explicit-bundleId path is SCAPI-eligible; **local-build path stays legacy-pinned** (bundle upload is out of scope — a single command must not mix backends). `--wait` on SCAPI → Step-4 list-poll; on legacy → existing `waitForEnv`.
- Guardrail helper for the **unsupported** subset (other MRT commands / local-build deploy): explicit `scapi` → actionable error, no legacy request; `auto` → warn "SCAPI MRT doesn't support this yet, using legacy" and succeed.
- Under `-D`/`--debug`, log each SCAPI prerequisite (short code, tenant/org ID, stateless auth method, required scope) as satisfied/missing, and which backend was chosen and why.
**Tests:** extend `test/commands/mrt/bundle/{deploy,history}.test.ts` with the `--mrt-backend` × {supported/unsupported} matrix (`isolateConfig`/`stubParse`, MSW), assert debug output under `-D`, cover deploy's explicit-bundleId (SCAPI) vs local-build (legacy-pinned) paths.

### Step 6: Docs, skills, tooling index, changeset
**Files:** `docs/guide/authentication.md` (add `sfcc.storefront.deployments[.rw]` scope row + MRT-command auth row), `docs/guide/configuration.md` (`MRT_BACKEND` env + `mrtBackend` dw.json), `docs/cli/mrt.md` (three modes, auto-detection criteria, supported ops), `skills/b2c-cli/skills/` MRT skill, regenerate `packages/b2c-tooling-sdk/data/tooling/index.json`, and a changeset (`@salesforce/b2c-cli` + `@salesforce/b2c-tooling-sdk`, minor).

## Test Strategy
Each step ships with unit/integration tests (above) run via `pnpm --filter @salesforce/b2c-tooling-sdk run test:agent` and `pnpm --filter @salesforce/b2c-cli run test:agent`. `pnpm run lint:agent` + `pnpm run typecheck:agent` clean before each commit. End-to-end matrix (flag × supported/unsupported × auto/legacy/scapi) covered at the command layer with MSW. Backward-compat: `auto` with no SCAPI prereqs must behave exactly like today's legacy path.

## Risks & Mitigations
- **OAS availability (Step 3 blocker):** the deployments spec isn't in-repo yet. *Mitigation:* fetch from `cc-mercury-api/storefront-oas` first; if unreachable, pause and confirm the source with the user before generating types.
- **`createB2CInstance` requires a hostname** — cannot be used for MRT eligibility. *Mitigation (in plan):* build `ScapiClientConfig` directly; stateless-auth-only.
- **`create` 202 may omit `deploymentId`** (needed for `--wait` list-polling). *Mitigation:* verify against the OAS/real tenant; fall back to matching the newest deployment for the bundle if absent.
- **ID mapping assumption** (1:1) — validate against a real tenant during Step 4/5; adjust the operations layer if a transform is needed.
- **Re-parenting `MrtCommand`** could shift inherited flags/behavior. *Mitigation:* full `mrt-command` + command test runs after Step 2; confirm no new `-s`/`-p` collisions (verified free).

## Verification (end-to-end)
1. `pnpm --filter @salesforce/b2c-tooling-sdk run build` (runs `generate:types`) — confirms the new client compiles.
2. `b2c mrt bundle history -p <project> -e <env> --mrt-backend scapi -D` against a SCAPI-configured tenant → SCAPI call, debug shows prereqs; `--mrt-backend legacy` → legacy call only.
3. `b2c mrt bundle deploy <bundleId> -p <project> -e <env> --mrt-backend auto --wait -D` → SCAPI create + list-poll to completion; with prereqs removed → warns + falls back to legacy and still succeeds.
4. `--mrt-backend scapi` on an unsupported op (e.g. `mrt bundle list`) → actionable error, no legacy request.
5. Full `test:agent` + `lint:agent` + `typecheck:agent` green.

## Process notes
Per the standing constraint, **do not commit** — the user reviews all changes.
