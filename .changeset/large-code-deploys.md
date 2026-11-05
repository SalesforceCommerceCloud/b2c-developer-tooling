---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'b2c-vs-extension': minor
---

`code deploy` now handles very large code versions: cartridges are streamed to disk instead of memory and split into archives of up to 200 MiB (set with `--max-archive-size`, `max-archive-size` in `dw.json`, or `SFCC_MAX_ARCHIVE_SIZE`). Dropped uploads are retried, a dropped connection during server-side unzip no longer fails the deploy, and 413 errors explain whether the archive was too large or the sandbox is stopped.
