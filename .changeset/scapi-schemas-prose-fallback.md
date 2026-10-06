---
'@salesforce/b2c-cli': minor
---

`scapi schemas get` can now return operation summaries, descriptions and examples (`--expand-paths`, `--expand-all`, or `--include`), and `get` and `list` fall back to the bundled standard contracts with a warning when the live Schemas API is unavailable.
