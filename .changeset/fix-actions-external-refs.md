---
'@salesforce/b2c-cli': patch
---

Fix GitHub Actions for external repository usage by replacing relative `./actions/setup` and `./actions/run` references with fully qualified `SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v1` and `SalesforceCommerceCloud/b2c-developer-tooling/actions/run@v1` in all composite actions.
