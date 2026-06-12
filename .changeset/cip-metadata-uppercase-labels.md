---
'@salesforce/b2c-tooling-sdk': patch
---

Fix `cip tables` and `cip describe` returning empty rows on some tenants. The CIP metadata mapping assumed camelCase JDBC column labels (`tableName`, `columnName`), but some tenants' drivers return the standard uppercase labels (`TABLE_NAME`, `COLUMN_NAME`), which produced blank table names, schemas, types, and column metadata. Metadata columns are now matched case-insensitively.
