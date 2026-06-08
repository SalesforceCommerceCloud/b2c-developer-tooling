---
'@salesforce/b2c-dx-docs': patch
---

Document deploying to staging environments (two-factor mTLS) from CI/CD. The `setup` GitHub Action now accepts `webdav-server`, `certificate`, `certificate-passphrase`, and `selfsigned` inputs so workflows can target staging instances that require a separate WebDAV hostname and a client certificate. The CI/CD guide includes a full GitHub Actions example using a base64-encoded `.p12` secret.
