---
"@salesforce/b2c-agent-plugins": minor
---

Add Storefront Next design-system skills and a new `storefront-next-figma` plugin.

- New `sfnext-create-vertical` skill (storefront-next): create a brand theme / storefront variant through the brand token layer, with typography, dark-mode contrast checks, fixture-based local development, and the extension-vs-base decision.
- New `sfnext-create-component` skill (storefront-next): design-system component authoring — layer model, extend-before-create gate, CVA variants bound to semantic tokens, `data-slot`, accessibility, and Storybook coverage (complements `sfnext-components`).
- Enhanced `sfnext-extensions` skill with a base-audit decision gate (deciding whether to extend at all vs a token/variant override or a base slot) plus a `BASE-AUDIT.md` reference.
- New `storefront-next-figma` plugin with the `sfnext-create-figma-kit` skill: duplicate the Figma kit for a vertical, sync Brand variables from `brand.css`, edit components at the correct layer, and publish Code Connect. Requires the Figma MCP server.

Together these add the design-system / theming / Figma layer that the existing `storefront-next` plugin did not cover.
