# B2C Tooling SDK — Python samples

Runnable examples for the [`salesforce-b2c-tooling-sdk`](../README.md) Python SDK.
Each sample reuses one `dw.json` for connection info and shows a different
**authentication mechanism** and/or **API type** — in both **async** and
**synchronous** styles.

| Sample (in `code/`, `*_async.py` + `*_sync.py`) | Auth mechanism | API type |
| --- | --- | --- |
| `oauth_ocapi` | OAuth client-credentials | OCAPI (list code versions) |
| `oauth_scapi` | OAuth client-credentials | SCAPI (list catalogs) |
| `basic_webdav` | Basic (WebDAV user/access key) | WebDAV (upload/read/delete) |
| `cli_session` | Reuse a CLI login session | OCAPI |
| `browser_login` | Interactive browser login (Auth Code + PKCE) | OCAPI |
| `slas_shopper` | SLAS guest shopper (public client) | SCAPI Shopper (token) |
| `multi_env` | — (config only) | Named-environment selection (offline) |

The `notebook/` folder has a Jupyter notebook for each scenario, runnable from
VS Code.

## 1. Create a virtual environment and install the SDK

```bash
cd python/samples
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt    # installs the SDK straight from git
```

> The SDK is installed from the fork's `python` branch during development. Once
> it's published to PyPI this becomes `pip install salesforce-b2c-tooling-sdk`.

## 2. Provide your connection info

Copy the template and fill in your own values:

```bash
cp dw.example.json dw.json
```

`dw.json` is **git-ignored** — your secrets never get committed. Fields:

| Field | Used by | Notes |
| --- | --- | --- |
| `hostname` | OCAPI, SCAPI, WebDAV | Instance host (no scheme). |
| `webdavHostname` | WebDAV | Optional, not in the template. Defaults to `hostname`; only add it if your WebDAV host differs. |
| `clientId` / `clientSecret` | OAuth (OCAPI, SCAPI), CLI session | Account Manager API client. `clientSecret` is required for client-credentials (oauth_* samples); `cli_session` reuses an interactive `b2c auth login` and needs only `clientId`. |
| `username` / `password` | Basic (WebDAV) | WebDAV user + access key. |
| `accountManagerHost` | OAuth, CLI session | Defaults to `account.demandware.com`. |
| `shortCode` / `tenantId` | SCAPI | Required for SCAPI backends. |
| `siteId` | SCAPI, SLAS | e.g. `RefArchGlobal`. |
| `organizationId` | SLAS | `f_ecom_<tenant>` form. |
| `slasClientId` | SLAS | Public SLAS client (no secret). |
| `slasRedirectUri` | SLAS | Redirect URI registered for the SLAS client. |

Each sample checks that the fields it needs are non-empty and prints a friendly
message if not.

## 3. Run the code samples

```bash
python code/oauth_ocapi_async.py
python code/oauth_ocapi_sync.py
python code/oauth_scapi_async.py
python code/basic_webdav_async.py
python code/slas_shopper_async.py
# ...and the matching *_sync.py twins
```

`cli_session_*` first needs a CLI login so there's a session to reuse (it looks
the session up by `clientId`):

```bash
b2c auth login <your clientId>
python code/cli_session_async.py
```

`browser_login_*` is the SDK equivalent of `b2c auth login` — it opens a real
browser, runs Authorization Code + PKCE, and saves the session to the same
shared store (so afterwards `cli_session` and the `b2c` CLI can reuse it). It
needs only `clientId`, and the client's registered redirect URI must include
`http://localhost:8080`:

```bash
python code/browser_login_async.py   # pops a browser; approve the login
```

`multi_env_*` is **offline** — it needs no `dw.json` and makes no network calls.
A single dw.json can carry a `configs` array of *named* environments; this
sample reads the bundled `multi-env.example.json` and shows how
`ResolveConfigOptions(instance="staging" | "production")` selects one (priority:
requested name → `active: true` → root config; each named config is
self-contained). Point `config_path` at your own multi-config file the same way,
or manage entries with `add_instance` / `remove_instance` / `set_active_instance`
from `b2c_tooling_sdk.config`.

```bash
python code/multi_env_async.py
```

### async vs sync

- **async** files import from `b2c_tooling_sdk` and use `asyncio.run(main())`.
- **sync** files import the blocking twins from `b2c_tooling_sdk.sync` and drop
  `await`. The sync facade proxies the whole object graph, so even the WebDAV
  client (which has no dedicated top-level operation) is blocking when the
  instance is built from `b2c_tooling_sdk.sync.resolve_config` —
  `basic_webdav_sync.py` just calls `webdav.put/get/delete` directly.

## 4. Run the notebooks (VS Code)

`requirements.txt` already installs `ipykernel`. Open any notebook in
`notebook/`, and when prompted for a kernel choose this folder's `.venv`. Run the
cells top to bottom. The notebooks read the same `../dw.json`.

> These notebooks are **live** — they call your real instance. (The SDK's own
> `docs/notebooks/` are offline, mocked, and credential-free for CI.)
