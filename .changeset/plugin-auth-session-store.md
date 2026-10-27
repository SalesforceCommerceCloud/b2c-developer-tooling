---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

Plugins can now store sign-in sessions (access and refresh tokens from `b2c auth login`, `b2c auth client`, and browser sign-in) somewhere other than the default `auth-sessions.json` file, such as an OS keychain, with the new `b2c:auth-session-store` hook.
