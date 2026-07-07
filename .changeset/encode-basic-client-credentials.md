---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Fix OAuth client authentication failing for client secrets containing `+` (or other reserved characters). Per RFC 6749 §2.3.1, the client ID and secret are now form-url-encoded before being Base64-encoded into the HTTP Basic `Authorization` header, matching how they are already encoded when sent in the request body. Previously a raw `+` in a secret was decoded to a space by Account Manager, causing `invalid_client` errors on Basic auth even though the same credential worked via the request body. Affects the client-credentials/password grants (`b2c auth client`, token renewal) and SLAS private-client flows.
