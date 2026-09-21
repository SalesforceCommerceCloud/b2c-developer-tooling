# Basic product creation

Use `builtin/create-product` for basic creation: required `productId` and
`catalogId`, optional `name` (default locale), and `offline` (defaults to `true`).
Set `offline: false` when the task calls for an online product. It sets the default
online flag; site overrides and other availability requirements still apply.
Use `scapi_execute` with the configured project and `skillRead: true`.

The reusable sequence is inspect -> conditional write -> verify -> optional
category assignment -> verify assignment. An existing
product is not permission to update it. GET then PUT is not atomic: use a unique
ID and do not assume this protects against concurrent writers.

Use the corresponding [built-in snippet](snippets.md); `codemode.describe(name)`
returns its current source and input schema.

Pass `category: {catalogId, categoryId}` to also assign the new product to an
existing category. The target catalog can differ from the product's owning
`catalogId`; use the intended storefront catalog, not an inferred site ID.
The workflow checks category access/existence before creating the product.
Assignment uses the verified product ID and Catalogs API; it requires catalog
read access and `sfcc.catalogs.rw` in addition to product permissions. Scopes are
selected per request, so later authorization can still fail after creation.

At most three requests without assignment, six with it. Read-back verifies ID, catalog, default online flag, and
name when supplied. For additional fields or localization, adapt the source using
the discovered API contract. This verifies saved fields, not every site's
effective availability. For site-specific intent, inspect the selected site's
effective state too. After an uncertain write or failed verification, inspect
the product before retrying; do not replay creation or delete automatically.

The result projects product fields and assignment IDs, verification, and write
status; it omits expanded product data in the assignment response. `state: partial`
retains completed product creation if assignment or its verification fails. The
workflow is not transactional: inspect the failed stage and resume only that work.
Rerunning creation on an existing product returns `exists` without assigning it.
Category assignment alone does not establish storefront visibility or search indexing.
