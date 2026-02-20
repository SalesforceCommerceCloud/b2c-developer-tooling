---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

# Stateful auth support (sfcc-ci compatible)

- **auth login** – Log in via browser (implicit OAuth) and save the session for stateful user auth.
- **auth logout** – Clear the stored session.
- **auth client** – Authenticate an API client with `client_credentials` or `password` grant (non-interactive). Use `--renew` to enable token auto-renewal.
- **auth client renew** – Refresh the stored token using credentials saved with `--renew`. Supports `refresh_token` and `client_credentials` grant fallback.
- **auth client token** – Return the stored authentication token (raw to stdout, or full metadata with `--json`).
- Uses the **same storage mechanism and keys as sfcc-ci** (`conf` with project name `sfcc-ci`). If you have already logged in with sfcc-ci, b2c-cli will use that token when valid.
- **Stateful preferred when valid**: Commands that need OAuth first check for a valid stored token; only if absent, invalid, or explicit stateless flags (`--client-secret`, `--user-auth`, `--auth-methods`) are passed do they fall back to stateless auth.
- No breaking change: when no stateful session exists or it is expired, behavior is unchanged (stateless auth as before).
