---
'@salesforce/b2c-tooling-sdk': patch
---

Fix `b2c slas token` registered-customer login failing against a private SLAS client with `HTTP 400 code_verifier is required`. The registered login flow is always PKCE-protected, so the token exchange now always sends the `code_verifier` with the `authorization_code_pkce` grant — and, for private clients, additionally authenticates with the client secret via HTTP Basic. Registered login now works on both public and private clients; guest and `client_credentials` flows are unchanged.
