---
name: using-b2c-tooling-sdk
description: Consuming the salesforce-b2c-tooling-sdk Python SDK from scripts or Jupyter notebooks — installation, choosing an authentication mechanism, and the available OCAPI/SCAPI/WebDAV clients and operations. Use when writing Python (or notebook) code that authenticates to a B2C Commerce instance, resolves config from dw.json, deploys code, runs jobs, reads sites/catalogs/logs/metrics, provisions sandboxes, or mints SLAS shopper tokens.
---

# Using the B2C Tooling SDK (Python)

`salesforce-b2c-tooling-sdk` is the Python SDK for Salesforce B2C Commerce
tooling. **Import name is `b2c_tooling_sdk`; distribution name is
`salesforce-b2c-tooling-sdk`.** It is async-first with a complete synchronous
facade. Python 3.10+.

This skill covers **consuming** the SDK. For developing the SDK itself, see
`python/CLAUDE.md`. For the full symbol catalog, read
[references/api-catalog.md](references/api-catalog.md).

## 1. Install

Not on PyPI yet — install from git during development:

```bash
pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python#subdirectory=python"
# or pin a tag: ...@python-v0.3.0#subdirectory=python
```

For notebooks also install a kernel: `pip install ipykernel`. Once published this
becomes `pip install salesforce-b2c-tooling-sdk`.

## 2. Async vs. sync — pick the import root

The two surfaces are identical **except one word**: sync drops `await`.

| Context | Import from | Style |
| --- | --- | --- |
| Scripts / notebooks / REPL | `b2c_tooling_sdk.sync` | blocking, no `await` |
| Inside an existing event loop (web server, async app) | `b2c_tooling_sdk` | `await` |

**Notebooks: use the sync facade** — it is the frictionless path (no
`asyncio.run`, no `await`). All sync calls run on one shared background loop, so
token caching still works.

```python
# Notebook / script (sync)
from b2c_tooling_sdk.sync import resolve_config
from b2c_tooling_sdk.sync import list_code_versions

config = resolve_config()                       # blocks
instance = config.create_b2c_instance()
for v in list_code_versions(instance):
    print(v.id, "active" if v.active else "")
```

```python
# Async
import asyncio
from b2c_tooling_sdk import resolve_config
from b2c_tooling_sdk.operations.code import list_code_versions

async def main() -> None:
    config = await resolve_config()
    instance = config.create_b2c_instance()
    for v in await list_code_versions(instance):
        print(v.id)

asyncio.run(main())
```

> **Never call the sync facade from inside a running event loop** (including
> async notebook cells / `await`-ing cells) — it waits on a background loop and
> can deadlock. In async code, import from `b2c_tooling_sdk` and `await`.
>
> **Streaming APIs (`tail_logs`, cartridge watching) are async-only** — not in
> the sync facade. Use the async API for those.

The examples below use the **async** form. For sync, import the same names from
`b2c_tooling_sdk.sync` and drop `await`.

## 3. Authenticate — choose by use case

Credentials usually come from a `dw.json` via `resolve_config()` (see §4). If you
already have a `dw.json`, **prefer `resolve_config` + `create_b2c_instance()`** —
it selects the auth mechanism for you. Reach for an explicit strategy only when
you have no config file or need a specific flow.

| Use case | Mechanism | How |
| --- | --- | --- |
| Server-to-server automation (CI, scripts) | OAuth **client-credentials** | `OAuthStrategy(OAuthConfig(client_id, client_secret, scopes))` |
| Server-to-server with a cert instead of a secret | **JWT Bearer** | `JwtOAuthStrategy(JwtOAuthConfig(client_id, cert_path, key_path, ...))` |
| Interactive user login (opens a browser) | **PKCE** (+ implicit fallback) | `create_user_auth_strategy(AuthCredentials(client_id, redirect_uri))` |
| Reuse a session created by `b2c auth login` | shared session store | `resolve_config()` picks it up automatically; or `find_auth_session(client_id)` |
| WebDAV / OCAPI Basic auth | **Basic** | `BasicAuthStrategy(username, password)` |
| Static API key header | **API key** | `ApiKeyStrategy("my-key")` |
| Storefront **shopper** tokens (guest/registered) | **SLAS** | `b2c_tooling_sdk.slas.get_guest_token(...)` — see §6 |

```python
from b2c_tooling_sdk.auth import OAuthStrategy, OAuthConfig

auth = OAuthStrategy(OAuthConfig(
    client_id="...", client_secret="...", scopes=["sfcc.products"],
))
```

**CLI interoperability:** the SDK shares the *same* on-disk `auth-sessions.json`
and config files as the `@salesforce/b2c-cli`. Recommended interactive workflow:
run `b2c auth login <clientId>` once, then run non-interactive Python — it reuses
the session with no browser prompt. `find_auth_session`,
`is_auth_session_token_valid`, and `list_auth_sessions` inspect the store.

Don't know which methods a credential bundle supports? Use
`resolve_auth_strategy(AuthCredentials(...), allowed_methods=[...])` to pick the
best available, or `check_available_auth_methods(...)` to probe without side
effects.

## 4. Resolve config from `dw.json`

`resolve_config()` merges the same sources the CLI reads (`dw.json` walking up
from cwd, `~/.mobify`, `package.json`, `settings.json`) into a resolved config
whose `.create_b2c_instance()` builds an authenticated `B2CInstance`.

```python
from b2c_tooling_sdk import resolve_config, NormalizedConfig

config = await resolve_config()                     # from dw.json etc.
instance = config.create_b2c_instance()

# ...or pass explicit overrides instead of a file:
config = await resolve_config(NormalizedConfig(
    hostname="example.demandware.net",
    client_id="...", client_secret="...", scopes=["sfcc.products"],
))
```

Multi-environment `dw.json` (a `configs` array of named envs): select one with
`resolve_config(options=ResolveConfigOptions(instance="staging"))` (priority:
requested name → `active: true` → root). Manage entries with `add_instance` /
`remove_instance` / `set_active_instance` from `b2c_tooling_sdk.config`.

## 5. Call the APIs — two layers

**Choose the layer by how you want errors handled:**

- **Operations** (`b2c_tooling_sdk.operations.*`, common ones re-exported at top
  level) — task-oriented, **success-or-raise**. Straight-line code; failures
  raise typed exceptions (`JobExecutionError`, sandbox polling errors, ...).
  **Prefer this for most work.**
- **Clients** (`instance.ocapi`, `instance.webdav`, SCAPI `create_*_client`) —
  low-level. Every call returns a `ClientResult(data, error, response)` and
  **never raises on 4xx/5xx** (only a genuine network failure raises
  `NetworkError`). Use when you want to inspect status codes yourself.

```python
# Operation (raises on failure)
from b2c_tooling_sdk.operations.jobs import execute_job, wait_for_job
execution = await execute_job(instance, "MyJob")
finished = await wait_for_job(instance, "MyJob", execution.id)   # raises JobExecutionError on failure

# Client (never raises on HTTP status)
result = await instance.ocapi.get("/sites")
if result.error is not None:
    print("failed:", result.response.status_code, result.error)
else:
    for site in result.data.get("data", []):
        print(site["id"])
```

**What's available** (full lists in [references/api-catalog.md](references/api-catalog.md)):

- **Code** — `find_and_deploy_cartridges`, `list_code_versions`,
  `create_code_version`, `activate_code_version`. Deploy needs
  `instance.config.code_version` set.
- **Jobs** — `execute_job`, `wait_for_job`, `site_archive_import`,
  `site_archive_export_to_path` (+ `scapi_*` native variants).
- **Sites** — `get_cartridge_path`, `add_cartridge`.
- **Catalogs / BM users / BM roles** — dual-backend (SCAPI→OCAPI) façades:
  `create_catalogs_backend`, `create_users_backend`, `create_roles_backend`.
- **ODS (sandboxes)** — `create_ods_client` + `wait_for_sandbox`.
- **Metrics** — `create_metrics_client` + `get_overall_metrics`,
  `get_sales_metrics`, `get_scapi_metrics`, ...
- **Logs** — `list_log_files`, `get_recent_logs`; `tail_logs` (async-only).
- **Account Manager** — `create_user`, `grant_role`, `list_orgs`, ...
- **Raw HTTP** — `instance.ocapi` (OCAPI Data API), `instance.webdav`
  (`put`/`get`/`delete`/`propfind`).

**SCAPI Admin clients** need system auth (client-credentials or JWT) **and** a
`short_code` + `tenant_id`. Get the coordinates from `instance.scapi_client_config`
(it's `None` when the instance can't do SCAPI):

```python
from b2c_tooling_sdk.clients import create_metrics_client, MetricsClientConfig

scapi = instance.scapi_client_config
if scapi is not None:
    metrics = create_metrics_client(
        MetricsClientConfig(short_code=scapi.short_code, tenant_id=scapi.tenant_id),
        scapi.auth,
    )
```

## 6. SLAS shopper tokens (storefront)

For **shopper**-facing storefront tokens (not admin/tooling). Subpath import only
— not in the top-level barrel:

```python
from b2c_tooling_sdk.slas import get_guest_token, SlasTokenConfig

token = await get_guest_token(SlasTokenConfig(
    short_code="abcd1234", organization_id="f_ecom_zzte_053",
    slas_client_id="...", site_id="RefArch",
    redirect_uri="http://localhost:3000/callback",
    # slas_client_secret="..."   # omit for a public PKCE client
))
print(token.access_token)   # shopper JWT
```

`get_registered_token(SlasRegisteredLoginConfig(...))` for logged-in customers.
Blocking twins are in `b2c_tooling_sdk.sync`. The tooling SDK has **no** dedicated
storefront client — after minting the token, call Shopper endpoints with plain
`httpx` using `token.access_token` as a bearer.

## Runnable examples

`python/samples/` has runnable scripts (`code/*_async.py` + `*_sync.py`) and
notebooks (`notebook/*.ipynb`) for each scenario above (oauth_ocapi, oauth_scapi,
basic_webdav, cli_session, browser_login, slas_shopper, multi_env). Point users
there; copy `dw.example.json` → `dw.json` and fill in credentials.
