---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

`b2c sites cartridges` commands with `--bm` now read and update the Business Manager cartridge path through the SCAPI Sites API instead of failing or running a site archive import. Site archive import remains the fallback when SCAPI isn't configured.
