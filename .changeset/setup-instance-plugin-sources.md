---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

`b2c setup instance` commands now include instances from plugin config sources, not only dw.json. `create` stores new instances in the highest-priority source that can hold them (or the one you pick with `--source`), and stores credential pairs in a plugin credential store, such as a keychain, when one is installed.
