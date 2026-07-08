---
'@salesforce/b2c-tooling-sdk': minor
'b2c-vs-extension': minor
---

Add an interactive Export view to the VS Code extension for building site impex (site archive) exports. Check the data units you want — sites (with per-site flags), global data, catalogs, inventory lists, libraries, customer lists, and price books — then run Export to download and extract the archive locally. Sites, catalogs, and inventory lists are discovered from the instance automatically; libraries, customer lists, and price books are added by ID. The SDK gains a `discoverExportableUnits` helper that lists the exportable sites, catalogs, and inventory lists on an instance.
