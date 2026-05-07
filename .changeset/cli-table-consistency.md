---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Added `--columns` and `--extended` flags to all list and search commands for consistent column selection across the CLI. Roughly 30 commands that previously had no column-customization support — including `bm roles list`, `webdav ls`, `cap list`, `code list`, `content list`, `docs search`, `job search`, `logs list`, `sites list`, `slas client list`, all `mrt` list commands, plus several `setup` and `scaffold` commands — now accept `-c id,name,...` to pick columns and `-x` to include extended fields (e.g. `webdav ls --extended` exposes the previously-hidden `modified` and `contentType` columns).

The SDK now exposes shared `columnFlagsFor()` / `selectColumns()` helpers (replacing 22 duplicated implementations) and a `printFieldsBlock()` helper for rendering "label / value" detail blocks.
