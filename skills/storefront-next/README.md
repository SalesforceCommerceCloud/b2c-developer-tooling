# storefront-next

Agent skills for building Salesforce B2C Storefront Next projects — React 19 storefronts with routing, data fetching, Page Designer, authentication, i18n, extensions, and deployment to Managed Runtime.

Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace.

## Installation

```bash
# Claude Code
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install storefront-next@b2c-developer-tooling

# GitHub Copilot CLI
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install storefront-next@b2c-developer-tooling
```

**VS Code (GitHub Copilot):** Command Palette → **Chat: Install Plugin From Source** → enter the repo `SalesforceCommerceCloud/b2c-developer-tooling`.

**Codex:** open the repo as a workspace, restart Codex, then install from the **B2C Developer Tooling** marketplace in the plugin directory.

For file-copy install to any supported IDE, use `b2c setup skills storefront-next`. See the [install guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills) for details.

## What's included

Skills covering the full Storefront Next development lifecycle:

- **`sfnext-project-setup`** — project creation, environment configuration, project structure
- **`sfnext-routing`** — React Router 7 file-based routing with flat-routes conventions
- **`sfnext-data-fetching`** — server-side loaders, actions, useScapiFetcher
- **`sfnext-components`** — UI components, createPage HOC, shadcn/ui, Tailwind CSS v4
- **`sfnext-configuration`** — config.server.ts, environment variables, multi-site setup
- **`sfnext-page-designer`** — Page Designer integration with React decorators and component registry
- **`sfnext-extensions`** — extension system, target points, extension routes
- **`sfnext-authentication`** — split-cookie SLAS architecture, auth middleware, session management
- **`sfnext-i18n`** — internationalization with i18next, dual-instance server/client, namespaces
- **`sfnext-state-management`** — React context, Zustand stores, basket provider
- **`sfnext-testing`** — Vitest unit tests, Storybook stories, interaction and accessibility testing
- **`sfnext-performance`** — bundle size limits, DynamicImage, parallel fetching, Lighthouse optimization
- **`sfnext-deployment`** — build and deploy to Managed Runtime (MRT), cartridge deployment
- **`sfnext-hybrid-storefronts`** — hybrid setup with SFRA/SiteGenesis, gradual migration, session bridging

See [`skills/`](./skills/) for the full list.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).
