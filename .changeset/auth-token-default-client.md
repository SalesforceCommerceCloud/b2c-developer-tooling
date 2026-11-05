---
'@salesforce/b2c-tooling-sdk': patch
---

Fixed `b2c auth token --default-client` failing with "This command needs an API client". It now returns a token for your account from the built-in client.
