---
'@salesforce/b2c-tooling-sdk': patch
---

Add `@salesforce/b2c-tooling-sdk/plugins` module for discovering and loading b2c-cli plugins outside of oclif. Enables the VS Code extension and other non-CLI consumers to use installed plugins (keychain managers, config sources, middleware) without depending on `@oclif/core`.
