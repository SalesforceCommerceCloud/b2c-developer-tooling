---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-docs': patch
---

Pass the instance name selected from configuration to later credential sources, so plugins such as macOS Keychain and password-store load instance-specific credentials without requiring `--instance`. Explicit selections and configuration precedence remain unchanged.
