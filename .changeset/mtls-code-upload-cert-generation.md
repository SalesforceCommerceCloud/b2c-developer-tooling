---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Added end-to-end setup of two-factor (mTLS) code upload for Hyperforce staging instances. `b2c ecdn mtls setup` walks you through generating and uploading a CA certificate, issuing your client certificate (`.p12`), and configuring `dw.json` so code upload works right away; `b2c ecdn mtls create --generate` does the same non-interactively for scripts and CI. `b2c ecdn mtls issue` creates additional client certificates from your CA for other developers or pipelines, and CA certificates are now checked against the 1-year maximum validity before upload. A new Hyperforce guide covers the full workflow, security, and renewal. The SDK adds the `@salesforce/b2c-tooling-sdk/operations/mtls` module and `updateInstanceConfig` for editing `dw.json`.
