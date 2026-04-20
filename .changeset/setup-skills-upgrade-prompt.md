---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

`b2c setup skills` now prompts to overwrite already-installed skills in interactive mode instead of silently skipping them with a "use --update to overwrite" message. The existing `--update` and `--force` flags still work non-interactively.
