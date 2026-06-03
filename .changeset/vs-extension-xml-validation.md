---
'b2c-vs-extension': minor
'@salesforce/b2c-dx-docs': patch
---

Add XSD-based validation for B2C metadata XML files. The extension now contributes 48 schemas (catalogs, promotions, jobs, services, customer feeds, A/B tests, page-meta-tags, sorting rules, source codes, content libraries, and more) so opening a B2C metadata XML produces inline diagnostics, autocomplete, and hover documentation.

**File-glob coverage** spans both common workspace conventions: the canonical SFCC site-archive layout (`sites/<id>/promotions.xml`, `catalogs/<id>/catalog.xml`, …) and exploded-archive workspaces under a `metadata/` folder (`metadata/promotions/*.xml`, `metadata/catalogs/*.xml`, …).

**New install requirement:** the extension declares `redhat.vscode-xml` as an extension dependency. VS Code installs it automatically the first time this extension activates after the upgrade. Users / teams whose policies block third-party extensions should disable `b2c-dx.features.xmlValidation` (or remove the dependency declaration) before deploying the upgrade.
