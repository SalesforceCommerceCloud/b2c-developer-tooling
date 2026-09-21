# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`salesforce-b2c-tooling-sdk` (import name `b2c_tooling_sdk`) is a Python SDK for
Salesforce B2C Commerce tooling: authentication, config resolution, typed
OCAPI/SCAPI/WebDAV clients, and higher-level operations (code deploy, jobs,
sites, catalogs, BM users/roles, sandboxes/ODS, metrics, logs). It lives in the
`python/b2c-tooling-sdk/` subfolder of the larger `b2c-developer-tooling`
monorepo (alongside `python/samples/`), whose root
`CLAUDE.md`/`AGENTS.md` covers the **TypeScript** packages — that guidance
mostly does **not** apply here (no pnpm, no oclif), with one exception:
**versioning uses the root Changesets flow** (see Releasing below and the root
`CLAUDE.md`), since this package is registered as a private, unpublished
`package.json` purely so Changesets can bump its version and changelog.

**This is a faithful port of the TypeScript `@salesforce/b2c-tooling-sdk`**
(`../../packages/b2c-tooling-sdk/`). Parity is the entire point of the project:

- The Python SDK shares the **same on-disk state** as the TS CLI byte-for-byte —
  the persisted auth-session store (`auth-sessions.json` in the oclif data dir
  for app `@salesforce/b2c-cli`) and the same config files (`dw.json`,
  `~/.mobify`, `settings.json`). A token minted by `b2c auth login` must work
  from Python, and vice versa.
- **When porting or changing a module, read the TS source first** — the files
  under `../../packages/b2c-tooling-sdk/src/` are the source of truth. Concepts,
  module layout, and public surface mirror the TS library; only the syntax is
  Pythonic (`async`/`await`, dataclasses, snake_case).

## Commands

All commands run from `python/b2c-tooling-sdk/`. Use the Makefile targets; the `*-agent`
variants produce condensed output for coding agents.

```bash
make install          # pip install -e ".[dev,docs]" (do this in a venv)

make test-agent       # pytest, quiet (failures + short summary only)
make test             # full run with coverage
.venv/bin/pytest tests/test_oauth.py            # a single test file
.venv/bin/pytest tests/test_oauth.py::test_name # a single test

make lint-agent       # ruff check --quiet .
make typecheck-agent  # mypy, single-line errors
make format           # ruff format .
make format-check     # ruff format --check .
```

**The gate** (must be green before committing): `ruff check`, `ruff format
--check`, `mypy` (strict), `pytest`.

```bash
make generate-models  # regenerate Pydantic models from the TS package's specs
```

## Architecture

Layers, roughly bottom-up (each subpackage has an `__init__.py` barrel that
mirrors the corresponding TS `index.ts`):

- **`auth/`** — OAuth client-credentials, JWT Bearer, PKCE interactive,
  implicit, Basic, API-key strategies + `resolve_auth_strategy`. A module-level
  token cache with single-flight semantics (reset in tests via
  `reset_oauth_cache_for_testing()`). The persistent session store serializes
  snake_case fields back to the TS camelCase JSON keys via an explicit map.
- **`config/`** — `resolve_config` reads `dw.json` (incl. multi-config `configs`
  aliases), `~/.mobify`, `settings.json`. The raw on-disk layer stays camelCase
  (TS parity); `NormalizedConfig` is a snake_case dataclass. Produces a resolved
  config whose `.create_b2c_instance()` method builds a `B2CInstance`.
- **`instance/`** — `B2CInstance` combines instance config + auth to expose lazy,
  typed clients (`.webdav`, `.ocapi`, SCAPI client config).
- **`clients/`** — typed OCAPI, WebDAV, and SCAPI Admin clients.
  **openapi-fetch semantics: clients return `ClientResult(data, error,
  response)` and never raise on 4xx/5xx** — only a network failure raises
  (`NetworkError`). `clients/models/` holds the **generated** Pydantic v2 models.
- **`operations/`** — task-oriented, **success-or-raise** verbs built on top of
  the clients (the opposite error contract from `clients/`). One subpackage per
  domain (`code`, `jobs`, `sites`, `catalogs`, `bm_users`, `bm_roles`, `ods`,
  `metrics`, `logs`, `users`, `roles`, `orgs`). Some domains have a dual-backend
  factory that picks SCAPI or falls back to OCAPI.
- **`slas/`** — SLAS Shopper Login (guest/registered tokens, PKCE helpers).
  Subpath-only: `from b2c_tooling_sdk.slas import ...` (not in the top-level barrel).
- **`sync/`** — see below.

### Async source, runtime sync facade

The SDK is **async-first**. Every public callable also has a blocking twin under
`b2c_tooling_sdk.sync` with an identical signature minus `await`.

**The sync layer is a runtime facade, not generated code.** `sync/_runner.py`
runs all coroutines on one persistent background event loop (preserving token
caching / single-flight); `sync/_proxy.py` syncifies returned objects so their
methods block; `sync/__init__.py` dynamically mirrors the top-level barrel.
Do **not** look for a codegen step — earlier plans considered generating this
layer with `unasync`, but the runtime facade was chosen instead. The sync facade
mirrors only the **top-level** barrel, so submodule-only APIs (e.g.
`operations.sites`, streaming/async-generator APIs) are not in `sync`.

### Generated models

`src/b2c_tooling_sdk/clients/models/` is generated by `scripts/generate_models.py`
(datamodel-code-generator, **pinned exactly** — output is not stable across
versions) from the OpenAPI specs in the **sibling TS package**
(`../../packages/b2c-tooling-sdk/specs/`). There is deliberately no `python/specs/`
copy. The generated output is committed so end users never need the specs.

These files are **excluded from the gate** (ruff `extend-exclude`, mypy
`exclude` + per-module `ignore_errors`) and are black/isort-formatted to keep
regeneration diffs clean. Never hand-edit them — change the spec or the
generator and run `make generate-models`.

## Conventions

- Copyright header on every source and test file (Python `#`-comment block,
  `SPDX-License-Identifier: Apache-2.0`).
- `from __future__ import annotations` everywhere (so `X | None` works on 3.11,
  the minimum supported version).
- Ruff selects `E,F,I,UP,B,W,C4,SIM` (E501 ignored); line length 120. mypy strict.
- Tests: pytest (`asyncio_mode=auto`) + `respx` for httpx mocking + `freezegun`.
  `conftest.py` (autouse) resets the OAuth token cache and points the
  auth-session store at a tmp dir, so tests never touch real user data or the
  network. `tests/helpers/` has shared fixtures (e.g. JWT minting).
- The SDK's User-Agent product token is `b2c-tooling-sdk-python/{version}` and is
  intentionally decoupled from the folder name. The version is set via the
  monorepo's Changesets flow (a changeset targeting
  `@salesforce/b2c-tooling-sdk-python`) and flows into `pyproject.toml` and the
  `version.py` fallback automatically via `scripts/sync-python-sdk-version.mjs` —
  don't hand-edit either.

## Samples

The sibling `../samples/` directory (i.e. `python/samples/`) contains **live,
credential-using** examples (distinct from the offline, mocked, CI-safe
notebooks under `docs/notebooks/`). It has its own
`.venv` and `requirements.txt` (installs the SDK from git). Samples live outside
`src/`, so they are excluded from the wheel and from the ruff/mypy/pytest gate.
All samples reuse one `dw.json`, which is git-ignored — the tracked template is
named `dw.example.json` (the root `.gitignore` matches `*dw.json*`, so the "dw.json"
substring must be avoided in tracked filenames).

## Releasing

Not on PyPI yet; released as git tags (`python-vX.Y.Z`) on the fork's `python`
branch. The version number and CHANGELOG come from the root Changesets flow (a
changeset targeting `@salesforce/b2c-tooling-sdk-python`, this package's
private/unpublished `package.json`); `release.sh`/`RELEASE.md` describe the
remaining manual steps — it no longer bumps or commits `pyproject.toml`
itself, just tags and pushes whatever version is already committed there.
Never push to the `upstream` (SalesforceCommerceCloud) remote.
