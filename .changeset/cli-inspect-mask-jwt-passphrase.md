---
'@salesforce/b2c-cli': patch
---

`b2c setup inspect` now redacts the JWT private key passphrase (`jwtPassphrase`) by default, matching the other secret fields. Use `--unmask` to show it.
