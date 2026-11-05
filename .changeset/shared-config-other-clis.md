---
'@salesforce/b2c-tooling-sdk': patch
---

CLIs built on the SDK, such as `sfnext`, now use the global `dw.json` set with `b2c setup default-config` and the global `safety.json`. A file in the CLI's own configuration directory still takes precedence.
