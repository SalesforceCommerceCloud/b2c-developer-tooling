---
'@salesforce/b2c-dx-docs': patch
---

Document the GitHub Actions install behavior change. The high-level actions (`code-deploy`, `data-import`, `job-run`, `mrt-deploy`, `webdav-upload`) now reuse an already-installed CLI and install one only when none is present — so a deploy that follows a setup step, and repeated operations on a persistent self-hosted runner, no longer trigger a redundant reinstall or an unexpected upgrade. The `setup` action called directly still installs the version you request (a new `skip-if-present` input opts into reuse). The actions no longer cache the npm download directory, which had grown to gigabytes on long-lived self-hosted runners and slowed restores. Plugin installs are skipped by exact name match.
