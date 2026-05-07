---
'@salesforce/b2c-tooling-sdk': patch
---

Hardened auth and long-running operation paths:

- Token store now writes atomically (temp file + rename) so concurrent CLI invocations cannot corrupt `auth-session.json`.
- `OAuthStrategy.getAccessToken()` coalesces concurrent refreshes onto a single in-flight request, preventing token-endpoint stampedes.
- Debug session cleans up its keepalive/poll timers if `connect()` fails after starting them.
- `downloadCartridges` and `deployCartridges` use try/finally around progress timers so an aborted or failing request can no longer leak intervals.
- New `@salesforce/b2c-tooling-sdk/ux` export surfaces the canonical `confirm()` prompt; CLI re-exports from here.
- New `auth/jwt-utils` consolidates JWT `exp`/`scope` decoding previously duplicated across three auth strategies.
- Better error message when the implicit-OAuth port is already in use (suggests `SFCC_OAUTH_LOCAL_PORT`).
