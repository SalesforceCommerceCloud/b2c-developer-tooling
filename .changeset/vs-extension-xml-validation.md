---
'b2c-vs-extension': minor
'@salesforce/b2c-dx-docs': patch
---

Add XSD-based validation for B2C metadata XML files. The extension now contributes 48 schemas (catalogs, promotions, jobs, services, customer feeds, A/B tests, page-meta-tags, sorting rules, source codes, content libraries, and more) so opening a B2C metadata XML produces inline diagnostics, autocomplete, and hover documentation.

**File-glob coverage** spans both common workspace conventions: the canonical SFCC site-archive layout (`sites/<id>/promotions.xml`, `catalogs/<id>/catalog.xml`, …) and exploded-archive workspaces under a `metadata/` folder (`metadata/promotions/*.xml`, `metadata/catalogs/*.xml`, …).

**Optional companion extension:** validation is powered by the Red Hat XML extension (`redhat.vscode-xml`), which is now a *soft* dependency — it is not force-installed. When you open a B2C metadata XML file, the extension offers to install it (with a "Don't ask again" option); until then the extension is unaffected. You can trigger setup any time via the **B2C DX: Set Up Metadata XML Validation** command, and disable the whole feature with the `b2c-dx.features.xmlValidation` setting. Teams whose policies block third-party extensions can simply decline the prompt.
