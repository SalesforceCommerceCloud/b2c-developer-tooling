# CLI Interoperability

The Python SDK and the B2C CLI (`@salesforce/b2c-cli`) share the **same on-disk
state, byte-for-byte**. Nothing is copied, translated, or duplicated — both tools
read and write the identical files. A token minted by the CLI works from Python,
and a token the Python SDK refreshes is visible to the CLI.

## What is shared

- **The auth-session store** — `auth-sessions.json` in the oclif *data*
  directory for the `@salesforce/b2c-cli` application. Holds persisted OAuth
  sessions (PKCE / implicit / client-credentials), including long-lived refresh
  tokens.
- **Configuration files** — `dw.json` (discovered by walking up from the working
  directory), `~/.mobify`, and the CLI `settings.json` in the B2C config
  directory.

## Session store locations per OS

`get_default_data_dir()` computes the oclif-compatible data directory, matching
the CLI exactly:

| Platform | Directory |
| --- | --- |
| macOS | `~/Library/Application Support/@salesforce/b2c-cli` |
| Windows | `%LOCALAPPDATA%\@salesforce\b2c-cli` |
| Linux / other | `$XDG_DATA_HOME/@salesforce/b2c-cli` (fallback `~/.local/share/@salesforce/b2c-cli`) |

The session file is `auth-sessions.json` inside that directory. The directory is
created `0o700` and the file `0o600`, since it holds refresh tokens. Writes are
atomic (temp file + rename).

## On-disk session format

The file is a JSON document — `{ "version": 1, "sessions": [ ... ] }` — with each
session keyed by `clientId`. Field names are **camelCase** on disk (the same keys
the TypeScript SDK writes) even though the Python `AuthSession` dataclass uses
snake_case attributes:

```json
{
  "version": 1,
  "sessions": [
    {
      "clientId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "flow": "pkce",
      "accessToken": "eyJ...",
      "refreshToken": "...",
      "sub": "...",
      "expiresAt": "2026-01-01T00:00:00Z",
      "scopes": ["mail", "roles", "tenantFilter", "profile"],
      "accountManagerHost": "account.demandware.com",
      "lastUsedAt": "2025-12-31T23:00:00Z"
    }
  ]
}
```

`flow` is one of `pkce`, `implicit`, or `client-credentials`. `None`-valued
fields are omitted on write (matching `JSON.stringify`).

## The CLI-login-then-Python-call workflow

The recommended pattern is to authenticate interactively **once** with the CLI,
then run non-interactive Python automation that reuses the persisted session with
no browser prompt.

1. Log in with the CLI:

    ```bash
    b2c auth login
    ```

2. From Python, the session is picked up automatically by `resolve_config()` /
   interactive strategies, or you can inspect it directly:

    ```python
    from b2c_tooling_sdk.auth import (
        get_default_data_dir,
        find_auth_session,
        is_auth_session_token_valid,
        list_auth_sessions,
    )

    print("session store:", get_default_data_dir() / "auth-sessions.json")

    session = find_auth_session("your-client-id")
    if session and is_auth_session_token_valid(session):
        print("Reusing the CLI's token — no browser needed")

    for s in list_auth_sessions():
        print(s.client_id, s.flow, s.expires_at)
    ```

The reverse also holds: a Python interactive login (via
`create_user_auth_strategy`) writes to the same store, and the CLI will reuse it.

## Managing the store from Python

`save_auth_session`, `delete_auth_session`, and `clear_all_auth_sessions` mutate
the shared file. For tests, swap the backend with
`set_auth_session_backend(InMemoryAuthSessionBackend())` so you never touch the
real file.

## API reference

See the [session-store helpers in the auth reference](api-reference.md#authentication).
