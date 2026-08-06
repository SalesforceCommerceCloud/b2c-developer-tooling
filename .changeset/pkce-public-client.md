---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'b2c-vs-extension': patch
---

Add Authorization Code + PKCE support for browser-based OAuth (public clients) and make it the default for the `user` auth method, replacing the legacy `implicit` flow in the default chain. The default auth-method order is now `client-credentials`, `jwt`, `user`. The implicit flow is still selectable via `--auth-methods implicit` (or in dw.json) for backwards compatibility but emits a deprecation warning — OAuth 2.1 deprecates implicit for public clients.

`b2c auth login` now uses Authorization Code + PKCE by default and persists a refresh token alongside the access token, so subsequent commands silently refresh without re-opening the browser. The new `--auth-methods` flag on `b2c auth login` lets you opt back into the legacy implicit flow (`--auth-methods implicit`). The POC `b2c auth pkce` command has been removed; use `b2c auth login` instead.

dw.json gains a `"user-auth": true` shorthand for `"auth-methods": ["user"]`. It is mutually exclusive with `"auth-methods"` — setting both is rejected during config mapping.

To smooth the migration, the `user` flow includes a transitional safety net: if the configured Account Manager client is not a PKCE-capable public client, it automatically falls back to the implicit flow for that client and logs a deprecation warning recommending you create a new public (PKCE) client and use it. (An AM client's type cannot be changed after creation, so a legacy implicit-only client must be replaced, not converted.) Set `SFCC_DISABLE_PKCE_FALLBACK=1` to disable the fallback and surface PKCE failures directly. This fallback is temporary and will be removed once public clients have migrated.

Persisted browser-auth sessions (which now hold long-lived PKCE refresh tokens) are written `0o600` in a `0o700` directory, so they are no longer world-readable.

The VS Code extension persists PKCE refresh tokens via OS-keychain-backed `SecretStorage` (with a sync-snapshot/async-write-through cache), keeping behavior compatible with the unified `AuthSessionBackend` used by the CLI.
