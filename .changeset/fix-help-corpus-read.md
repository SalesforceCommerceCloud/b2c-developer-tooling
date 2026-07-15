---
'@salesforce/b2c-tooling-sdk': patch
---

Fix `b2c docs read` failing to load Salesforce Help (Business Manager) articles. Help content is served online but its index entries carried a bundled-file path, so reads tried a nonexistent local file and failed instead of fetching from the source URL. Reads now fetch help articles online as intended.
