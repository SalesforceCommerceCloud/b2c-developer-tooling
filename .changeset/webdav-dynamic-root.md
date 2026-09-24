---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Support `--root=dynamic` across WebDAV commands to manage site-specific files, including Velocity templates, independently of code deployments. Include the site ID as the first segment of the remote path, for example `b2c webdav ls --root=dynamic MySite/`.
