# Catalogs, categories and categorization rules

`product/catalogs/v1`. Read `sfcc.catalogs`, write `sfcc.catalogs.rw`. Inspect the operation before
calling; this page covers behavior the contract does not state.

## Find

- Catalogs: `searchCatalogs`. Categories across catalogs: `searchCategories` (`levels` controls subtree depth;
  large values are slow). Within one catalog: `searchCategoriesInCatalog` or paged `getCategoriesFromCatalog`.
- Products in a category: `searchProductsAssignedToCategory`. Hits embed the whole product, including every
  assigned category; project to IDs.
- Storefront visibility comes from the site's catalog (`site/sites/v1` `getSiteById` → `siteCatalogId`), not
  from the owning catalog of the product.

## Categories and assignments

- `createCategoryInCatalog` is a PUT on `{categoryId}`; it overwrites an existing category. GET first.
- `assignProductToCategory` / `unassignProductFromCategory` act on one product. For bulk, sequence calls
  (4 parallel, 20 per execution) and report what remains.
- Deleting a category does not delete products. Unassign or let rules move them first if that matters.

## Dynamic categorization rules

Order: category → rule (`createUpdateRule`, `enabled: true`) → conditions
(`createOrUpdateCategoryRuleCondition`: `attributeKey`, `attributeValue[]`, `operator`) → run.

- `runCategoryRules` returns `202` with no body; it starts an async job. `{evaluation: true}` is a dry run
  that lists `matchedCount` and `productIds`. `{evaluation: false}` assigns and unassigns products.
  Evaluate first and show the matches before executing.
- Poll `getCategorizationStatus` (`limit`/`offset` page evaluation `productIds`). `jobStatus` is
  `in_progress` while running (the contract enum says `inProgress`; accept both), then `success`/`error`.
  `unavailable` means it has never run. Small categories finish within seconds.
- Run fails `400` when the category has no rules.
- Exclusion list (`addProductsToExclusionList`, body `{data: [{productId}]}`): products that rules must never
  assign. A manual unassign is undone by the next execution; exclude instead. Removal uses DELETE with a body.
- Use [`builtin/category-rules-run`](snippets.md) to evaluate or execute and poll. It refuses to start while a
  run is in progress and returns a `continuation` input if still running.
