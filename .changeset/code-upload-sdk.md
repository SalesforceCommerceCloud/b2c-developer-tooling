---
'@salesforce/b2c-tooling-sdk': minor
---

Add `uploadFiles` and `downloadSingleCartridge` functions for efficient per-file and per-cartridge operations. Extract batch upload pipeline from `watchCartridges` into reusable `uploadFiles` function. `downloadCartridges` now downloads individual cartridges when `include` filter is specified instead of zipping the entire code version. Add `autoUpload` config field for IDE auto-sync.
