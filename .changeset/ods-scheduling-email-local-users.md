---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-docs': patch
---

ODS CLI: **`b2c sandbox create`** adds **`--emails`** for notification addresses; **`b2c sandbox update`** adds **`--start-scheduler`** and **`--stop-scheduler`** (JSON or `"null"` to clear); **`b2c realm update`** adds **`--emails`** and **`--local-users-allowed`** / **`--no-local-users-allowed`**. User guide updated with flags, examples, and notes on how sandbox schedulers interact with **`--auto-scheduled`**.
