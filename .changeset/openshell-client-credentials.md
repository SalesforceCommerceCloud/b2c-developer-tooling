---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

Added the `client-auth-method` setting (`SFCC_CLIENT_AUTH_METHOD`, `--client-auth-method`) to choose how client credentials are sent to Account Manager: `basic` (default), `basic-unencoded`, or `body`. Client credentials now also work inside NVIDIA OpenShell sandboxes without extra configuration.
