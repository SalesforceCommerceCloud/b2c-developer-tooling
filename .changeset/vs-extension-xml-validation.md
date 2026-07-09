---
'b2c-vs-extension': minor
'@salesforce/b2c-dx-docs': patch
---

Add XSD-based validation, autocomplete, and hover docs for B2C metadata XML files, backed by ~50 bundled schemas (catalogs, promotions, jobs, services, A/B tests, page-meta-tags, sorting rules, source codes, content libraries, event routing, and more).

**Namespace-based association.** Validation is matched by the document's declared XML namespace, not by filename or folder layout, so a metadata file validates against the correct schema wherever it lives — in a canonical site-archive (`sites/<id>/…`), an exploded `metadata/` workspace, or anywhere else. The extension ships an XML catalog and registers it with the Red Hat XML language server at runtime; no changes are written to your `settings.json`.

**Optional companion extension.** Validation is powered by the Red Hat XML extension (`redhat.vscode-xml`), a *soft* dependency — it is not force-installed and no Java runtime is required. When you open a B2C metadata XML file, the extension offers to install it (with a "Don't ask again" option); until then the extension is unaffected. You can trigger setup any time via the **B2C DX: Set Up Metadata XML Validation** command, and disable the whole feature with the `b2c-dx.features.xmlValidation` setting. Teams whose policies block third-party extensions can simply decline the prompt.
