---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Fix multiple issues with the hook scaffold (#247):

- Merge SCAPI and OCAPI hook types into a single "SCAPI/OCAPI Hook" type
- Fix hook extension points list to match verified B2C Commerce documentation
- Fix hooks.json not updating when adding hooks to existing files (json-merge bug)
- Support appending new hook functions to existing hook script files
- Fix display paths missing leading slash in VS Code extension context
- Filter hook extension points by selected hook type (SCAPI/OCAPI vs System)
- Allow typing custom hook points not in the list
- Generate correct function signatures matching commerce-cloud-docs reference
- Show extension point value alongside label in CLI and VS Code prompts
