# storefront-next

Agent skills for building Salesforce B2C Storefront Next projects — React 19 storefronts with routing, data fetching, SCAPI, authentication, theming, Page Designer, extensions, SEO, security, testing, and deployment to Managed Runtime.

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

Skills covering the full Storefront Next development lifecycle. Start with **`sfnext-overview`**, which routes a task to the right skill and to the guidance that ships inside your project (`AGENTS.md`, `docs/`).

**Project and delivery**

- **`sfnext-overview`** — start here: task-to-skill map, in-project guidance, CLI and MCP cheat sheet
- **`sfnext-project-setup`** — create a storefront with `sfnext create-storefront`, prerequisites, project layout, scripts
- **`sfnext-configuration`** — `config.server.ts`, `PUBLIC__` environment variables, multi-site, URLs, domains, base path
- **`sfnext-deployment`** — build and push to Managed Runtime, Page Designer cartridge deployment, pre-launch checks
- **`sfnext-quality-gates`** — lint, format, typecheck, bundle-size and Lighthouse budgets, pre-PR checklist

**Application architecture**

- **`sfnext-routing`** — flat-routes file conventions, layouts, site-aware links and navigation
- **`sfnext-data-fetching`** — loaders, actions, API clients, `useScapiFetcher`, streaming
- **`sfnext-revalidation`** — `shouldRevalidate` policies and keeping data fresh after mutations
- **`sfnext-state-management`** — basket and auth providers, external stores, URL state, optimistic UI
- **`sfnext-performance`** — Suspense, bundle budgets, images, metrics, performance review checklist

**Commerce APIs and identity**

- **`sfnext-scapi`** — typed SCAPI clients, custom attributes, and calling custom APIs from your storefront
- **`sfnext-authentication`** — SLAS session cookies, auth middleware, login flows (passwordless, social, passkeys)
- **`sfnext-hybrid-storefronts`** — run alongside SFRA/SiteGenesis with the hybrid proxy and shared sessions
- **`sfnext-security`** — security headers, Content Security Policy contributors, Turnstile, cookie domain

**UI and content**

- **`sfnext-components`** — UI primitives, composite components, variants, Storybook coverage
- **`sfnext-theming`** — rebrand your storefront: design tokens, palette, shape, typography, assets
- **`sfnext-page-designer`** — Page Designer decorators, component registry, regions, cartridge metadata
- **`sfnext-extensions`** — extension targets, installing and creating extensions, the extend-vs-edit decision
- **`sfnext-i18n`** — translations, locales, currency
- **`sfnext-accessibility`** — accessible components, a11y lint, Storybook and end-to-end accessibility checks
- **`sfnext-testing`** — Vitest unit and route tests, Storybook tests, end-to-end tests

**Features and integrations**

- **`sfnext-commerce-features`** — which flags, Business Manager preferences, cartridges, or extensions each storefront feature needs
- **`sfnext-analytics-consent`** — analytics adapters (Einstein, Active Data, Data 360) and tracking consent
- **`sfnext-seo`** — SEO metadata, structured data, SEO URL rules, AI answer-engine readiness

See [`skills/`](./skills/) for the full list.

## Related plugins

- **[`storefront-next-figma`](../storefront-next-figma)** — design-kit companion: duplicate the Storefront Next Figma kit and keep its brand variables in sync with your theme tokens. Pairs with `sfnext-theming`. Requires the Figma MCP server.
- **[`figma-to-sfnext-pagedesigner`](../figma-to-sfnext-pagedesigner)** — turn Figma frames into Storefront Next Page Designer components. Requires the Figma MCP server.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).
