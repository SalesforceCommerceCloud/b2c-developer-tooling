---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Add `--path` flag to `b2c docs schema` to print the filesystem path to a schema file instead of its content, enabling use with tools like `xmllint` for XML validation.
