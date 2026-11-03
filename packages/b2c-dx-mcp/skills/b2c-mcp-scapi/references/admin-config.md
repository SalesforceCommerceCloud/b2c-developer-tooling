# CORS, timeouts, custom objects

Contracts are bundled; inspect inputs before calling. This page covers behavior the contract does not state.

## Replace-all writes

These PUTs replace the whole resource. Sending only the new value deletes the rest. Always GET, merge,
show the user the resulting diff, PUT, then GET to verify. DELETE clears everything for that scope.

| API                                                  | Write                                          | Scope of the replace                                                                                                                                                                             |
| ---------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `configuration/cors/v1` (`sfcc.cors-preferences.rw`) | `updateCorsPreferences`                        | Every client's origins for `query.siteId`. Body `{corsClientPreferences: [{clientId, origins}]}`; `clientId` is the shopper (SLAS) client. Use [`builtin/cors-preferences-update`](snippets.md). |
| `configuration/timeouts/v1` (`sfcc.timeouts.rw`)     | `putTimeouts`                                  | All overrides for this instance type (not per site). Body `{timeouts: {"<family>/<api>": seconds}}`, e.g. `product/shopper-products`. One API per key, no wildcards, 1-120 s.                    |
| `custom-object/custom-objects/v1`                    | `createCustomObject`, `createSiteCustomObject` | One object: PUT overwrites an existing `{objectType}/{key}`. Use PATCH (`update*CustomObject`) to change fields.                                                                                 |

Empty CORS or timeouts configuration returns `200 {}`.

## Custom objects (`sfcc.custom-objects[.rw]`)

- Global and site-scoped variants share shapes; the site variant adds `/sites/{siteId}`. Use the scope the
  type is defined with; the wrong one returns `404`.
- The object type must already exist (Business Manager or metadata import); SCAPI cannot create types.
  An unknown type returns `404 Object Type Not Found`.
- `searchCustomObjects` (`POST`, `query` required, `limit`/`offset`): searchable fields are `keyValueString`,
  `keyValueInteger`, `creationDate`, `lastModified`, `siteId` and custom attributes (`c_*`). Only
  searchable attributes sort. Use `schemas: "live"` to see a type's `c_*` fields.
