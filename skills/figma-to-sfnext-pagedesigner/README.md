# figma-to-sfnext-pagedesigner

An agent skill that converts a **Figma** frame into live Salesforce Commerce Cloud **Page Designer** blocks for a **Storefront Next** project — React components with Page Designer decorator metadata, brand-token reconciliation, and SCAPI product loaders — in one shot.

Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace. Companion to the [`storefront-next`](../storefront-next) and [`storefront-next-figma`](../storefront-next-figma) plugins.

## ⚠️ Prerequisite: Figma MCP server

**This skill requires the [Figma MCP server](https://www.figma.com/developers/mcp) to be configured in your AI tool.** The workflow reads design context through Figma MCP. A **browser MCP** (Playwright or similar) is also recommended for the visual-validation step. Without Figma MCP, the skill can only act as a manual checklist.

Before using this plugin:

1. Add the Figma MCP server to your AI tool's MCP configuration (see your IDE's MCP docs).
2. Have a Figma URL with a `node-id` parameter for the frame you want to convert — in Figma, right-click a frame → **Copy/Paste as → Copy link**; the URL contains `node-id=<value>`.
3. Have a Storefront Next project checked out (with the `sfnext` CLI available via `pnpm sfnext …`).

## Installation

```bash
# Claude Code
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install figma-to-sfnext-pagedesigner@b2c-developer-tooling

# GitHub Copilot CLI
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install figma-to-sfnext-pagedesigner@b2c-developer-tooling
```

**VS Code (GitHub Copilot):** Command Palette → **Chat: Install Plugin From Source** → enter the repo `SalesforceCommerceCloud/b2c-developer-tooling`.

For file-copy install to any supported IDE, use `b2c setup skills figma-to-sfnext-pagedesigner`. See the [install guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills) for details.

## Usage

```
/figma-to-sfnext-pagedesigner
```

The skill asks for a Figma frame URL (must include `node-id`), a Storefront Next repo URL or local path, and a Page Designer group (palette folder). It then:

1. Splits the frame into one Page Designer block per visual section.
2. Shows you the authorable fields and default values for each block — and a **token reconciliation table** where the design diverges from your `brand.css` — then waits for your approval before writing any code.
3. Generates React + Tailwind components using your project's brand tokens, adds Page Designer decorator metadata with defaults pre-filled from the Figma copy, and wires up SCAPI product loaders for catalog-backed sections.
4. Registers each component, commits, and pushes.
5. Validates design fidelity in the browser (when a browser MCP is available).

After CI runs (MRT deploy + cartridge deploy), the new blocks appear in the Business Manager Page Designer palette with fields pre-filled from the Figma design.

## What's included

- **`figma-to-sfnext-pagedesigner`** — the end-to-end Figma → Page Designer workflow (5 phases, with a user approval gate before any code is written). Bundles a `references/PAGE-DESIGNER-SFN.md` mental-model doc the skill reads during pre-flight.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt).
