---
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-agent-plugins': patch
---

`project_inspect` and `security_scan` now read the site's cartridge path live from the instance when SCAPI is configured and `cartridges` isn't set. They take a new `siteId` input for choosing a site, and every result reports where the cartridge order came from (`cartridgePathSource`) and which local cartridges aren't on the path, so answers about overlays and hook order match the sandbox. `b2c project` output also lists cartridges that aren't on the path.
