---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

The project index (`b2c project`, the MCP `project_inspect` tool, and the VS Code Endpoints and Cartridges views) no longer loses a controller's endpoints when the leftmost cartridge's controller hands `module` to a helper (for example `require('*/cartridge/scripts/helpers/headlessHelpers').redirectHeadless(module, 'Show')`). The endpoints keep the routes from cartridges further right, and the delegating controller is shown as a step that may change them.
