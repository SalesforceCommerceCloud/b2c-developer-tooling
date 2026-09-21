---
'@salesforce/b2c-tooling-sdk-python': patch
---

Fixed the WebDAV client sending the pre-middleware request body instead of the (possibly rewritten) post-middleware body, and made the OAuth redirect callback server bind both IPv4 and IPv6 loopback (`localhost`) instead of only `127.0.0.1`, fixing connection failures on systems where `localhost` resolves to `::1` first.
