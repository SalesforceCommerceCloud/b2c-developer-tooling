---
'b2c-vs-extension': minor
---

Surface **Custom Step Types** as a third category under each cartridge in the **Cartridges** explorer, alongside Hooks and Job Steps.

- Custom step types are parsed from any `steptypes.json` under the cartridge (both `script-module-step` and `chunk-script-module-step` categories are supported, and the legacy flat-array shape is tolerated).
- **Clicking a step type opens its module implementation** (the `.js` file referenced by the `module` field) — resolving across sibling cartridges when the module lives in a different cartridge from where it's registered.
- **Right-click → Show Step Type Definition** jumps to the `@type-id` line inside `steptypes.json` for the alternate navigation target.
- Nodes for step types whose module cannot be resolved on disk fall back to opening the JSON definition, so the click always does something useful.
