---
'@salesforce/b2c-agent-plugins': patch
---

Release packaging now reads the list of agent plugins from `skills/plugins.json`. To publish a new plugin, add its `skills/<name>/` directory and list its name in that manifest — no changes to the publish workflow are required.
