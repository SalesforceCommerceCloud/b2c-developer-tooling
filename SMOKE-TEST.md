# Smoke Test Plan — PKCE Migration (`feature/pkce-support`)

This branch swaps the default browser-login flow from the deprecated **implicit** grant to
**Authorization Code + PKCE (S256)**, adds a transitional auto-fallback to implicit, hardens the
session file, and changes 401/refresh behavior. Because the core path is an interactive browser
login, most of this is necessarily **manual**.

A companion script, [`scripts/pkce-smoke-test.sh`](scripts/pkce-smoke-test.sh), walks you through
these scenarios interactively and runs the CLI on your behalf. This document is the reference for
_what_ each scenario proves and _what to look for_; the script automates the _running_.

---

## ⚠️ Two things that will silently invalidate your results

1. **Test from the working tree, not a checkout of HEAD.** The fallback wrapper
   (`oauth-pkce-fallback.ts` + the `createUserAuthStrategy` wiring) is **uncommitted** — it exists
   only in your working tree. A `git stash`, fresh clone, or CI checkout of the commit runs the
   _old_ `new PkceOAuthStrategy` path with **no fallback**. Run via `./cli` (dev mode, uses source)
   or a fresh `pnpm run build` of this working tree. The script uses `./cli` by default.
2. **There is no `LEGACY_IMPLICIT_PUBLIC_CLIENT_ID` code path.** That constant is dead code —
   defined and re-exported, never wired. Do **not** design a case around `--auth-methods implicit`
   resolving to client `7eee11e3…`. Implicit only runs when _you_ pass an implicit client id, or
   when the PKCE fallback kicks in.

---

## Prerequisites / setup

| Need                                                                                                       | For                                                              |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **A PKCE-capable AM "public client"** (the prod default `a40a7a9b…` qualifies) with redirect `http://localhost:8080` | All happy-path cases (§1–§3)                            |
| **A second, implicit-only AM client** (an old registration, also with `localhost:8080` redirect)          | Fallback positive cases (§4, §7) — see caveat below             |
| **Client-credentials client id + secret** (with an AM role, e.g. _User Administrator_)                      | Old client-credentials cases (§9, §10, §14, §17, §20)           |
| **(Optional) JWT client id + cert/key**                                                                     | JWT case (§11)                                                  |
| **A target instance** (`INSTANCE_HOST`) + a client with **OCAPI Data API + WebDAV perms _on that instance_** | Instance ops (§13–§20) — the migration-critical cases          |
| **(Optional) BM user + WebDAV access key**                                                                  | Legacy Basic-auth WebDAV path (§18)                            |
| **macOS/Linux**                                                                                             | File-permission checks (§3) — mode bits are POSIX-only          |
| **`SFCC_LOG_LEVEL=debug`** (the script sets this)                                                           | To see `[Auth] Hydrated…` / `Login URL:` / fallback WARN lines (stderr) |
| **(Optional) TLS-intercepting proxy** (mitmproxy/Charles)                                                   | Only to _prove_ wire bodies (`code_challenge_method=S256`); not required for behavioral smoke |

### Isolation (how the script keeps your real sessions safe)

- The CLI resolves its session file as `B2C_TEST_DATA_DIR ?? config.dataDir`
  (`base-command.ts:172`). The script points `B2C_TEST_DATA_DIR` at a throwaway temp dir, so the
  session file (`auth-sessions.json`) **starts empty and your real
  `~/Library/Application Support/@salesforce/b2c-cli/auth-sessions.json` is never touched.** Set
  `ISOLATE_SESSIONS=0` to test against the real location instead.
- The script **unsets `SFCC_CONFIG`** and points `SFCC_PROJECT_DIRECTORY` at an empty temp dir so
  no ambient `dw.json` (yours or the repo's) leaks into the run.
- `SFCC_*` flow-control vars (`SFCC_DISABLE_PKCE_FALLBACK`, `SFCC_OAUTH_LOCAL_PORT`,
  `SFCC_REDIRECT_URI`, `SFCC_CLIENT_ID`, …) are cleared at startup; each scenario sets only what it
  needs. Leftover env vars are the #1 cause of confusing results.

### CLI invocation reference (verified)

| Flow                  | Command                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| User / PKCE (default) | `./cli auth login <CLIENT_ID>`                                                           |
| Explicit implicit     | `./cli auth login <CLIENT_ID> --auth-methods implicit`                                   |
| Client-credentials    | `./cli auth client --client-id <ID> --client-secret <SECRET>`                            |
| JWT Bearer            | `./cli auth token --client-id <ID> --jwt-cert <cert.pem> --jwt-key <key.pem>`            |
| Read cached user tok  | `./cli auth token --client-id <CLIENT_ID>`                                               |
| Read cached cc tok    | `./cli auth client token --client-id <ID>`                                               |
| Clear all sessions    | `./cli auth logout`                                                                      |
| Prove user auth (AM)  | `./cli am users list` (no flags → default public client `a40a7a9b…` via user/PKCE)        |
| Default client (ODS)  | `./cli sandbox realm list [zzpq]` (no `--client-id` → default public client via user/PKCE) |
| Default client (SLAS) | `./cli slas client list --tenant-id zzpq_019 --short-code <SC>` (no `--client-id`)        |
| Prove cc auth (AM)    | `./cli am users list --client-id <ID> --client-secret <SECRET>`                          |
| Instance OCAPI (user) | `./cli code list --server <HOST> --user-auth --client-id <ID>`                           |
| Instance OCAPI (cc)   | `./cli code list --server <HOST> --client-id <ID> --client-secret <SECRET>`              |
| Instance WebDAV (user)| `./cli webdav ls --root impex --server <HOST> --user-auth --client-id <ID>`              |
| Instance WebDAV (basic)| `./cli webdav ls --root impex --server <HOST> --username <U> --password <P>`             |

> Default auth-methods chain is `['client-credentials', 'jwt', 'user']`. `am`/`ods`/`slas` commands
> default the client id to the public client `a40a7a9b…` (so they "just work" with no `--client-id`);
> base `auth login`/`auth token` and **instance** commands do **not** (they require an explicit client
> id). `bm whoami` is the one instance command that defaults to `['user']` (but still needs `--client-id`).

---

## §1 — PKCE happy path (the core change)

1. `./cli auth login <PKCE_CLIENT_ID>`
2. **Expect:** browser opens to `…/dwsso/oauth2/authorize?…response_type=code…code_challenge_method=S256`
   (debug log prints `Login URL: …`). Complete login.
3. **Browser page shows:** _"Authentication successful! You may close this browser window and return to your terminal."_
4. **Terminal shows:** _"Login succeeded. Session saved for stateful auth."_
5. **Expect NO** _"The OAuth implicit flow is deprecated…"_ warning.
6. Session file record: `flow: "pkce"`, a non-null `refreshToken`, your `sub`.

## §2 — Silent refresh, no second browser (H4)

> ⚠️ **Running `auth token` right after login does NOT exercise refresh.** The just-minted access
> token is still valid, so `getTokenResponse()` (`oauth-pkce.ts:198-211`) returns it from the
> **cached-hit branch** (`if (cached && isCachedTokenUsable(cached)) return cached`) with **zero
> network calls** — _before_ the `tryRefresh()` branch is ever reached. That path proves
> persistence + hydration only; it would pass even if the refresh grant were completely broken. You
> must **force the access token stale** (keeping the refresh token) to actually exercise H4.

**2a — Cached hit (hydration only):** immediately after §1, in a **new process**:
`./cli auth token --client-id <PKCE_CLIENT_ID>`. **Expect:** no browser; debug
`[Auth] Hydrated PKCE session from store`; a token prints. **This is the cache path, not a refresh.**

**2b — Forced refresh (the real H4 test):**

1. Expire only the stored access token's recorded expiry, leaving `accessToken` and `refreshToken`
   intact — edit the session file (`$B2C_TEST_DATA_DIR/auth-sessions.json`) so the PKCE session's
   `expiresAt` is in the past:
   ```sh
   jq '(.sessions[]|select(.clientId=="<PKCE_CLIENT_ID>")|.expiresAt)="2000-01-01T00:00:00.000Z"' \
     "$B2C_TEST_DATA_DIR/auth-sessions.json" > tmp && mv tmp "$B2C_TEST_DATA_DIR/auth-sessions.json"
   ```
   (`expiresAt: null` works too — `hydrate()` seeds it as epoch.) The script's §2b does this for you.
2. In a **new process**: `./cli auth token --client-id <PKCE_CLIENT_ID>`.
3. **Expect:** no browser; debug log shows **both** `[Auth] Hydrated PKCE session from store` **and**
   `[Auth] PKCE token refreshed silently` (`oauth-pkce.ts:328` — the line that _proves_ the
   `refresh_token` grant ran). A browser opening here would mean refresh **failed** and fell back to a
   full login — a regression.
4. **Expect:** re-reading the session file, the stored `accessToken` is **different** and `expiresAt`
   is a fresh future timestamp — a new token was minted and persisted, not the cached one returned.

This is the H4 fix: `invalidateToken()` keeps the refresh token, so a stale access token refreshes
silently instead of reopening the browser.

## §3 — Session file hardening (H3, POSIX)

1. After a successful login: the session file is `-rw-------` (**0600**); its dir is **0700**.
2. Re-harden: `chmod 644` the file, then run any command that writes a session (e.g. re-login).
   **Expect:** mode returns to **0600** (atomic tmp+rename replaces the inode).

## §4 — Transitional PKCE→implicit fallback _(needs implicit-only client)_

1. `./cli auth login <IMPLICIT_ONLY_CLIENT_ID>`
2. **Expect:** PKCE token exchange fails → a single **WARN**, then automatic implicit login in the
   same browser session:
   > `[Auth] Authorization Code + PKCE failed for client <id> (<oauth error>). Falling back to the deprecated implicit flow. Recommend creating a new public (PKCE) client in Account Manager and using it to remove this warning. See https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html#implicit-flow-deprecation`
3. **Fallback disabled:** repeat with `SFCC_DISABLE_PKCE_FALLBACK=1`. **Expect:** the raw
   `PkceGrantUnsupportedError` surfaces; **no** implicit fallback, **no** WARN.
4. **Fallback triggers ONLY on "not a PKCE-capable public client" OAuth errors.** The error code must
   be one of `invalid_client`, `unauthorized_client`, `unsupported_response_type`,
   `unsupported_grant_type` (from either the authorize redirect or the token response):
   - **`invalid_client`** is the primary real-world case — a legacy implicit-only client returns
     `{"error":"invalid_client","error_description":"Parameter client_assertion_type is missing"}` at
     the token exchange (AM demands client authentication because it isn't a public client). Implicit
     rescues it because the token comes back on the authorize redirect with no token-endpoint call.
   Any other failure is a plain `Error` that surfaces directly with **no** fallback and **no** WARN,
   because it would fail identically under implicit:
   - **`invalid_scope`** (you requested scopes the client can't have) — surfaces directly. _This is a
     real regression that was fixed:_ a working PKCE client asked for bad scopes must NOT be
     misreported as "not a public client."
   - **`access_denied`** (user cancels the browser consent) → error, no implicit retry.
   - **`invalid_grant`** (expired/replayed code or verifier mismatch) → error, no implicit retry.
   - **State mismatch** (`OAuth state mismatch — aborting`) → error, no implicit retry.
   - **Port 8080 in use** (EADDRINUSE) → error, no implicit retry.

## §5 — Removed surface

- `./cli auth pkce` → **command no longer exists** (`pkce.ts` is deleted on this branch).

## §6 — dw.json conflict warning (user-auth + auth-methods)

A `dw.json` with both `userAuth: true` and `auth-methods: [...]`. Load it with a no-auth command
(`setup instance list --config <file>`). **Expect** the mutual-exclusivity error surfaced as a config
**WARN** — _"dw.json: `user-auth` and `auth-methods` are mutually exclusive. `user-auth: true` is
shorthand for `"auth-methods": ["user"]` — set one or the other."_ Note this is a `DwJsonSource` load
warning (that source is skipped), **not** a hard command failure — the command still completes.

## §7 — Explicit implicit flow (deprecated, still selectable) [OLD]

`./cli auth login <CLIENT_ID> --auth-methods implicit` → deprecation WARN _"The OAuth implicit flow
is deprecated…"_, browser login, session `flow: "implicit"` with null refresh token. A second process
logs `[Auth] Hydrated implicit session from store` (implicit now persists/hydrates).

## §8 — Default public client via user/PKCE (`am users list`, no creds) [OLD]

`./cli am users list` → client-creds and jwt have no creds, so it falls through to user/PKCE with the
default public client `a40a7a9b…`, opens the browser, and lists AM users. Proves user auth end-to-end
against a live server.

## §8a — Default client: list a sandbox realm (ODS) [NEW, critical] {#8a}

The most common default-client use case. `./cli sandbox realm list` (alias `ods realm list`) has **no
`--client-id`** — `OdsCommand` defaults it to the public client `a40a7a9b…`, so it falls through to
user/PKCE, opens the browser, and calls the **ODS / Sandbox API**. With no realm arg it discovers your
realms via ODS `/me` (a real authenticated call); pass a realm to target one:

```
./cli sandbox realm list           # discovers via ODS /me
./cli sandbox realm list zzpq      # the test realm
```

**Proves:** the default public client + PKCE works against **ODS**, not just Account Manager. Requires
Sandbox API access on your AM account.

## §8b — Default client: list SLAS clients for a tenant (SLAS Admin) [NEW, critical] {#8b}

`./cli slas client list --tenant-id zzpq_019 --short-code <SHORT_CODE>` — again **no `--client-id`**;
`SlasClientCommand` defaults it to the public client `a40a7a9b…` → user/PKCE browser login, then hits
the **SLAS Admin API** (`https://<short-code>.api.commercecloud.salesforce.com/shopper/auth-admin/v1`).
`--short-code` is required (it forms the admin host); `--client-id` is not.

**Proves:** the default public client + PKCE works against the **SLAS Admin API**. An empty result
(no clients) still passes — it means the token was accepted; only an auth error is a failure.

## §9 — Client-credentials store + read [OLD]

`./cli auth client --client-id <ID> --client-secret <SECRET>` → _"Authentication succeeded."_; then
`./cli auth client token --client-id <ID>` → token. Record is `flow: "client-credentials"`,
`refreshToken` null (no auto-refresh; re-run to renew).

## §10 — Client-credentials against a live API (`am users list`) [OLD]

`./cli am users list --client-id <ID> --client-secret <SECRET>` → lists users using the service
client (requires an AM role). No browser.

## §11 — JWT Bearer (optional) [OLD]

`./cli auth token --client-id <ID> --jwt-cert <cert> --jwt-key <key>` → token. No browser, no secret.

## §12 — Logout clears session

`./cli auth logout` → _"Logged out. Stored session cleared."_; a subsequent
`./cli auth token --client-id <ID>` reports _"No authentication token found…"_ (or re-prompts).

## Additional migration-impact checks (manual; not separate script scenarios)

- **`userAuth` shorthand:** a `dw.json` with `userAuth: true` resolves to the `user` (PKCE) flow.
- **Client-id mismatch drops secret:** config file has clientId+secret; override clientId on the CLI.
  **Expect** warning _"Client ID override "…" differs from config file "…". Ignoring stored
  clientSecret for the configured client."_ (and the analogous `SLAS_CLIENT_ID_MISMATCH`). _(This
  fires organically in §6 when you pass a different `--client-id`.)_
- **StatefulOAuth clears on 401 (no refresh):** force a 401 against a stored stateful session.
  **Expect** _"[StatefulAuth] 401 received; clearing stored session — caller must re-authenticate"_
  and the next call re-authenticates. (Intentional; distinct from §2's PKCE refresh.)

## §13–§20 — Instance operations (WebDAV + OCAPI) — the migration-critical cases

These prove a token actually **works against the instance**, not just Account Manager. This is the
real risk of the swap: a user/PKCE access token must authenticate **WebDAV** and the **OCAPI Data
API** against the instance.

**How instance auth resolves (verified):**

- **OCAPI always uses OAuth.** WebDAV auth priority is `['basic', 'client-credentials', 'user']` — so
  with **no** `--username/--password`, a WebDAV op uses the **OAuth token** (client-credentials or
  user/PKCE); with Basic creds, Basic wins.
- **Instance commands require an explicit `--client-id`** — unlike `am`/`ods`, `InstanceCommand` has
  **no** default client id. (`bm whoami` forces user-auth but still needs `--client-id`.)
- **Force user/PKCE:** `--user-auth --client-id <ID>` (omit the secret). **Force client-credentials:**
  `--client-id <ID> --client-secret <SECRET>`.

**Instance prerequisite (distinct from the AM login in §1):** the OAuth client used here must have
**OCAPI Data API + WebDAV permissions configured _on the instance_**, and for user/PKCE the
logged-in **AM user must have instance access**. A token that's valid for AM can still get a 401 from
the instance if these aren't set up — that's a config gap, not a regression.

Set `INSTANCE_HOST` (and `INSTANCE_PKCE_CLIENT_ID`, `CC_CLIENT_ID`/`CC_CLIENT_SECRET`, optional
`WEBDAV_USERNAME`/`WEBDAV_PASSWORD`) for the script to run these.

| #   | Scenario                                            | Proves                                                                 |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| §13 | `code list` with `--user-auth` **[critical]**        | A user/PKCE token authenticates **OCAPI** against the instance.        |
| §14 | `code list` with `--client-id/--client-secret`       | Client-credentials still works for OCAPI (regression).                 |
| §15 | `bm whoami` with `--user-auth` **[NEW]**             | The user/PKCE token resolves to a **real BM user** (OCAPI `/users/this`). |
| §16 | `webdav ls --root impex` with `--user-auth` **[critical]** | A user/PKCE token authenticates **WebDAV** (no Basic creds).      |
| §17 | `webdav ls --root impex` with client-credentials     | Client-credentials still works for WebDAV (regression).                |
| §18 | `webdav ls --root impex` with `--username/--password` | Legacy **Basic-auth** WebDAV path still wins when creds are present.    |
| §19 | `webdav put → ls → rm` in `Temp/` with `--user-auth` **[NEW]** | A user/PKCE token can **write** WebDAV (self-cleaning round-trip). |
| §20 | `job export --global-data meta_data` **[NEW]**       | One token drives **both** an OCAPI job-execution call **and** a WebDAV download. |

**Side-effect notes:**

- §13–§18 are **read-only**. §19 writes a tiny scratch file to `Temp/` and deletes it in the same
  scenario. §20 (`job export`) is read-only on the instance — it runs the `sfcc-site-archive-export`
  system job for global `meta_data`, downloads the archive via WebDAV, and **deletes the archive from
  `Impex/`** afterward (the script does **not** run `job import`, which would mutate instance state).
- Each instance scenario calls `auth logout` first, so user/PKCE cases always re-open the browser
  (no stale-token false pass). Run them one at a time if you want to watch each browser handoff.

## §21 — VS Code extension (manual; not a script scenario)

- **There is no login button/UI.** Auth is triggered by the first action that needs it (e.g. a
  WebDAV/OCAPI operation), which opens the browser PKCE flow.
- **Persistence:** after a successful auth, reload/restart the window. **Expect:** no re-prompt — the
  session is restored from VS Code **SecretStorage** (keychain), a **separate** store from the CLI's
  `auth-sessions.json`. A CLI `auth logout` does _not_ clear the extension, and vice-versa.

---

## Coverage caveats (state explicitly in your test report)

- **Not behaviorally verifiable without a TLS proxy:** exact PKCE wire params (`S256`,
  `code_verifier`, absence of a token fragment). Treat §1's URL inspection as the smoke-level check.
- **§4 positive fallback is untestable without an implicit-only client.** If none is available,
  record it as _blocked_, not _passed_.
- **pod5 now maps to a PKCE-capable public client** (`3f41a930…`). A default login against
  `account-pod5.demandware.net` should complete via **PKCE with no fallback WARN** — it's a real-world
  §1/§8 default-client check, not a §4 fallback case anymore. (To exercise §4 fallback you now need a
  separately-registered implicit-only client.)
- Anything run from a committed checkout instead of the working tree tests the _old_ code — note
  your build provenance in the report.
