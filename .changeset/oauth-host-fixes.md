---
'@salesforce/b2c-tooling-sdk': minor
---

Client credentials auth improvements for apps that embed the SDK: a failed token request throws `AccountManagerTokenError` with `status` and `oauthError` (same message as before), cached tokens are no longer reused after the client secret changes, and `getAuthorizationHeader` accepts an `AbortSignal`.
