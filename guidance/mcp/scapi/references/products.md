# Basic product creation

Use `builtin/create-product` for basic creation: required `productId` and
`catalogId`, optional `name` (default locale), and `offline` (defaults to `true`).
Set `offline: false` when the task calls for an online product. It sets the default
online flag; site overrides and other availability requirements still apply.
Use `scapi_execute` with the configured project and `skillRead: true`.

The reusable sequence is inspect -> conditional write -> verify. An existing
product is not permission to update it. GET then PUT is not atomic: use a unique
ID and do not assume this protects against concurrent writers.

Use the corresponding [built-in snippet](snippets.md); `codemode.describe(name)`
returns its current source and input schema.

At most three requests. Read-back verifies ID, catalog, default online flag, and
name when supplied. For additional fields or localization, adapt the source using
the discovered API contract. This verifies saved fields, not every site's
effective availability. For site-specific intent, inspect the selected site's
effective state too. After an uncertain write or failed verification, inspect
the product before retrying; do not replay creation or delete automatically.
