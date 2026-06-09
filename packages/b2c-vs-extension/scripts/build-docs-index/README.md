# Docs index build script

Builds the offline documentation index consumed by the in-editor Docs Browser.

## What it produces

Output goes to `packages/b2c-vs-extension/resources/docs/`:

| File | Description |
| --- | --- |
| `manifest.json` | Schema version, source versions, entry counts, and a content checksum. |
| `script-api.json` | Full `DocEntry[]` for every `dw.*` class, interface, enum, and member. |
| `script-api-search.json` | Lightweight dictionary used by the search UI (no descriptions). |

ISML and Business Manager support are tracked as separate follow-up work.
They were intentionally left out of v1 because they require an authoritative
upstream source (the official ISML grammar / Salesforce-owned BM topic
content) before we ship anything. Hand-curated content was rejected during
review.

## How to run

From the repo root:

```bash
pnpm --filter b2c-vs-extension run build:docs-index
```

The output is **deterministic** — identical input always produces byte-identical
JSON. CI runs the script and fails the build if `git diff --exit-code` shows a
delta, which catches:

- Stale committed JSON when `@salesforce/b2c-script-types` is upgraded.
- Hand-edited JSON.
- Non-deterministic build output.

## Source of truth

| Source | Where it comes from |
| --- | --- |
| Script API (`dw.*`) | `packages/b2c-script-types/types/dw/**/*.d.ts` JSDoc — Salesforce-authored, vendored from the platform docs build |

## Schema

See `schema.mjs` for the canonical `DocEntry` and `IndexManifest` shapes.
Bumping `SCHEMA_VERSION` is a breaking change — the runtime loader must be
updated in the same PR.

## Determinism notes

- Entries are sorted by `id`.
- Object keys are emitted alphabetically (`stableStringify`).
- `generatedAt` is sourced from `SOURCE_DATE_EPOCH` if set, else a fixed epoch.
  Don't use `new Date()` — that breaks reproducibility.
- We never touch a file when the contents match.
