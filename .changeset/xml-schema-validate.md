---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Added `b2c validate` to check import/export XML (catalogs, price books, inventory, site archives, and more) against the bundled B2C Commerce XSDs before importing. It picks each file's schema automatically, reports errors with line numbers, and needs no `xmllint` install.
