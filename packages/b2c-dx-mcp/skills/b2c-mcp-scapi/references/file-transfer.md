# File uploads and downloads (not in code mode)

Code mode sends JSON bodies and reads JSON or text. Operations with a multipart body or binary response are
marked `auth.executable: false` with `auth.unsupported` (also `unsupported` on `spec.search` matches), and
`scapi.request` refuses them with `SCAPI_TRANSFER_UNSUPPORTED` before sending anything.

| Task                          | Not runnable in code mode                                                                 | Runnable here                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Custom sitemap upload         | `site/seo/v1` `uploadCustomSitemapAndTriggerSitemapGeneration` (the API's only operation) | None                                                                         |
| Inventory/segmentation import | `inventory/impex/v1` `postUploadImportFile`, `postProductSegmentationUploadImportFile`    | Submit (`submit*Import`, returns `importId` and upload link), status, delete |
| Inventory exports and results | `inventory/impex/v1` `download*File`, `download*Results*`                                 | Start (`initiate*Export`, `submit*Export`), status, delete                   |

Split the work: run the JSON steps in code mode and give the user the IDs and status. Move the file with an
HTTP client outside MCP using a token from `auth.accountManager({scopes, scapi: true})`
([tokens](tokens.md)) with the operation's scopes, or use Business Manager. Never try another code-mode route.

Inventory impex scopes: `sfcc.inventory.impex-inventory` (exports, downloads) and
`sfcc.inventory.impex-inventory.rw` (imports, event-log and reservation exports). A `403` with an HTML
body comes from the inventory service: check these scopes on the client and that the tenant uses
Omnichannel Inventory.
