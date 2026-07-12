---
'b2c-vs-extension': patch
---

Stop bundling development-only files into the published extension. The packaged VSIX no longer includes the `test-workspace/` sample cartridges or local `.claude/` editor settings, reducing package size and removing files that were never meant to ship.
