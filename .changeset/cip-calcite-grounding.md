---
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-agent-plugins': patch
---

The CIP skill now covers the Calcite SQL dialect (reserved words such as `date` and `month` as aliases, date literals, month grouping) and says to describe tables before writing custom SQL, so agents stop guessing column names like `orders` and `site_name`.
