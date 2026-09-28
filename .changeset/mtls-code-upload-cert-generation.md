---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Added end-to-end management of staging code upload (mTLS) certificates. `b2c ecdn mtls setup` (interactive) and `b2c ecdn mtls create --generate` create and upload a CA, issue your client `.p12`, and help configure `dw.json`. `b2c ecdn mtls issue` issues more client certificates from an existing CA. The 1-year maximum validity for CA certificates is now enforced. The SDK adds `@salesforce/b2c-tooling-sdk/operations/mtls` and `updateInstanceConfig` for editing `dw.json`.
