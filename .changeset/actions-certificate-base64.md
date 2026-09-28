---
'@salesforce/b2c-cli': minor
---

GitHub Actions can now use a client certificate stored as a repository secret: pass a base64-encoded `.p12` as `certificate-base64` to `setup` and the root, `code-deploy`, `data-import`, `job-run`, and `webdav-upload` actions, so staging mTLS workflows no longer need their own decode step. GitHub Actions are now released with every CLI release at the same version.
