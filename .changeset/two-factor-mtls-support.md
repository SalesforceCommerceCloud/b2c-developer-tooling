---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

Add two-factor client certificate (mTLS) support for WebDAV operations

New CLI flags for instance commands:
- `--certificate <path>`: Path to PKCS12 (.p12/.pfx) certificate file
- `--passphrase <string>`: Passphrase for the certificate
- `--selfsigned`: Disable SSL certificate verification (for self-signed certs)
- `--no-verify`: Alias for --selfsigned

Environment variables: `SFCC_CERTIFICATE`, `SFCC_CERTIFICATE_PASSPHRASE`, `SFCC_SELFSIGNED`

dw.json fields: `certificate`, `certificate-passphrase`, `self-signed`

**SDK Note**: The `AuthStrategy.fetch` method signature changed from `RequestInit` to `FetchInit`. Custom `AuthStrategy` implementations should update their type annotations.
