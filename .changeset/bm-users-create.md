---
'@salesforce/b2c-cli': minor
---

Add `b2c bm users create` to create a Business Manager user (create-or-replace), rounding out the `bm users` lifecycle alongside list/get/search/update/delete. Runs over SCAPI with OCAPI fallback like the other `bm users` commands. Flags: `--email` (required), `--first-name`, `--last-name`, `--external-id`, `--password`, `--role` (repeatable), `--disabled`, and preferred locales. Note that most instances use SSO with Account Manager and reject creating *local* BM users with `LocalUserCreationException` — creation succeeds only when the instance is configured to allow local users.
