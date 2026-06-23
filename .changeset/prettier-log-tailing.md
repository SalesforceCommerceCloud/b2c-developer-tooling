---
'b2c-vs-extension': patch
---

Improve the B2C Logs view when tailing. Log entries are now color-coded by level (error, warn, info, debug) with a built-in level filter, each entry is tagged with its source log prefix (e.g. `[error]`, `[customerror]`), and multi-line stack traces are indented so each entry reads as a single block. Uses the same "B2C Logs" output channel — no new panel or command.
