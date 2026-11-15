---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

`code deploy`, `code watch`, and `code download` limit uploads to the cartridges named in `SFCC_CARTRIDGES`, as they already do for `cartridges` in dw.json. Pass `--all` to include every discovered cartridge anyway.
