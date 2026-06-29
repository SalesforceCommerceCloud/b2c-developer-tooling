---
'@salesforce/b2c-dx-docs': patch
---

GitHub Actions: the high-level actions (`code-deploy`, `data-import`, `job-run`, `webdav-upload`) and the root action now forward the full set of auth/config inputs to `setup` — `account-manager-host`, `short-code`, `tenant-id`, `certificate`, `certificate-passphrase`, `selfsigned`, and `webdav-server` (where applicable). Previously these were silently dropped with an "Unexpected input(s)" warning, so a non-default Account Manager host or staging mTLS credentials had to be set via env vars or a separate `setup` step. Also bumped the bundled `setup-node`/`checkout` references to Node 24-capable majors to clear the Node 20 deprecation warning.
