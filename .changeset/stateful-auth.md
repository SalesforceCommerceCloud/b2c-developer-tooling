---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

# Stateful authentication support

Introduces stateful authentication commands and session management, enabling tokens to be persisted on disk and automatically reused across CLI commands — eliminating the need to pass credentials on every invocation.

## New commands

- **`auth login`** – Log in via browser (implicit OAuth) and persist the session for stateful user auth. Only the flags relevant to the implicit flow are exposed (`--client-id`, `--account-manager-host`, `--auth-scope`).
- **`auth logout`** – Clear the stored session and return to stateless-only auth.
- **`auth client`** – Authenticate an API client using `client_credentials` or `password` grant (non-interactive). Use `--renew` to store credentials for later token renewal.
- **`auth client renew`** – Refresh the stored token using credentials saved with `--renew`. Supports `refresh_token` grant with automatic fallback to `client_credentials`.
- **`auth client token`** – Return the current stored token: raw to stdout (pipe-friendly) or full metadata with `--json`.

## Session storage

Sessions are stored as a JSON file in the CLI's own data directory (e.g. `~/Library/Application Support/@salesforce/b2c-cli/auth-session.json` on macOS).

> **Note:** Sessions stored by `sfcc-ci` are no longer shared with the CLI. Re-authenticate using `b2c auth login` or `b2c auth client` after upgrading.

## Auth precedence

When a valid stored session exists, all OAuth commands automatically use it — no flags required. The CLI falls back to stateless auth when:

- The stored token is **expired or invalid** — a warning suggests the appropriate renewal command.
- **Explicit stateless flags** are passed (`--client-secret`, `--user-auth`, or `--auth-methods`) — a warning lists the triggering flags.

Passing `--client-id` alone does not force stateless auth; the stored session is used if the client ID matches.

## No breaking change

When no stateful session exists, behavior is identical to before (stateless auth). Existing environment variable and `dw.json` configuration continues to work without modification.
