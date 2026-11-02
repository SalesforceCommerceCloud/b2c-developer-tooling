---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-agent-plugins': patch
---

`b2c am clients create` now shows the new client's details and asks for confirmation before creating it. Pass `--force` to skip the prompt; scripts and `--json` runs must add `--force`. New clients now default to `client_secret_basic`, so they work with their secret; previously Account Manager made them `private_key_jwt` and the secret was rejected. The `b2c-am` skill now walks your assistant through creating an API client when you don't have one, after you approve every detail.
