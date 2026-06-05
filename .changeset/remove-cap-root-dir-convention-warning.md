---
'@salesforce/b2c-tooling-sdk': patch
---

Remove the CAP validation warning that flagged a root directory not matching the `{id}-v{version}` naming convention. This convention is no longer required, so the check has been dropped from `b2c cap validate` (and `b2c cap install`).
