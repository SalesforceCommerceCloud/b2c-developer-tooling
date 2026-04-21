---
'@salesforce/b2c-tooling-sdk': patch
---

Skills installer (`b2c setup skills`) now resolves the latest skills release by querying GitHub for releases that actually carry skills zips, instead of relying on GitHub's opinionated "latest release" endpoint. Falls back to a CDN-backed lookup when the GitHub API is rate-limited. Zip downloads continue to use the GitHub release CDN with no API calls. Resolved versions are cached locally for 1 hour to keep consecutive installs fast.
