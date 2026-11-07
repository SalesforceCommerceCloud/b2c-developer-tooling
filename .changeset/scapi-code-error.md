---
'@salesforce/b2c-tooling-sdk': minor
---

SCAPI code-mode failures now throw `ScapiCodeError` with a `code` (such as `SCAPI_SAFETY_BLOCKED`) so hosts can branch without parsing messages, and `runScapiCode` accepts a tenant ID (`zzzz_001`) as well as an organization ID, giving programs the `f_ecom_` form that requests require.
