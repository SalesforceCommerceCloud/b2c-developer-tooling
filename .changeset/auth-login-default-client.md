---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

`b2c auth login` now accepts `--client-id` like other commands, and without a client ID signs you in with the built-in client instead of failing. Signing in and out now names the signed-in user, for example "Signed in to Account Manager as dev@example.com, expires 3:45 PM."
