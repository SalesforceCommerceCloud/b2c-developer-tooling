---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-mcp': patch
'b2c-vs-extension': patch
'@salesforce/b2c-agent-plugins': patch
---

Cartridge deploy no longer skips `build` or `dist` folders inside a cartridge. Use the new `--cartridge-ignore-dirs` flag or `cartridge-ignore-dirs` config to choose which directories are skipped.
