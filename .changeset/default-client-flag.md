---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

Add `--default-client` (or `SFCC_DEFAULT_CLIENT=true`) to sign in with the CLI's built-in client when another client or access key is configured, so WebDAV, code upload, logs, sandbox and Account Manager commands work with your Account Manager account without changing your config
