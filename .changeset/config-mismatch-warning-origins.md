---
'@salesforce/b2c-tooling-sdk': patch
---

Config mismatch warnings (client ID, SLAS client ID, server) now say where both values came from (a flag, an environment variable, or a `.env` file, plus the config source it conflicts with) instead of "override" and "config file".
