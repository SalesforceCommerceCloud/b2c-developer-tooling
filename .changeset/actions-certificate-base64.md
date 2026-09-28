---
'@salesforce/b2c-cli': minor
---

GitHub Actions: `setup` and the root, `code-deploy`, `data-import`, `job-run`, and `webdav-upload` actions accept `certificate-base64`, a base64-encoded `.p12` (for example a repository secret) that is decoded to an owner-only temp file and used as the client certificate. Staging mTLS workflows no longer need their own decode step. GitHub Actions are now released with every CLI release at the same version.
