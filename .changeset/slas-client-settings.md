---
'@salesforce/b2c-cli': minor
---

`b2c slas client create` and `update` can now set login endpoint restriction (`--login-restricted`), 6-digit one-time passwords (`--six-digit-otp`), and strict client authentication (`--strict-client-auth`), and `update` can switch a client between private and public (`--private`, `--public`). `create --login-restricted` now takes effect; SLAS ignores the setting when a client is created.
