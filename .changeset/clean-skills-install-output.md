---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-agent-plugins': patch
---

Fix skill installation output so mixed-source downloads do not show an unresolved version placeholder, repair the `b2c-hooks` skill frontmatter, and identify the affected skill path in future parsing warnings.
