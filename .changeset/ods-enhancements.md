---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-docs': patch
---

ODS CLI: **`b2c sandbox create`** adds **`--emails`** for notification addresses; **`b2c sandbox update`** adds **`--start-scheduler`** and **`--stop-scheduler`** (JSON or `"null"` to clear); **`b2c realm update`** adds **`--emails`** and **`--local-users-allowed`** / **`--no-local-users-allowed`**.

Sandbox API: **`b2c sandbox operations list`** and **`b2c sandbox operations get`** (inspect lifecycle operations); **`b2c sandbox alias get`** (get one alias by ID, same endpoint as **`alias list --alias-id`**).

User guide updated for scheduling flags, sandbox operations, and **`b2c sandbox alias get`**.
