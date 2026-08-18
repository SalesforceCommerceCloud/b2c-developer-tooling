---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

`job import-set` now prints a consolidated post-import notes summary from a `README.md` (or `README`) file at the top of each applied item's directory — the idiomatic place to document manual, instance-specific follow-up steps for a migration. Notes are shown for items applied in the run and previewed for pending items during `--dry-run`.
