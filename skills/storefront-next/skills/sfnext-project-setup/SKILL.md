---
name: sfnext-project-setup
description: Create and configure Storefront Next projects. Use when creating a new storefront, understanding project structure, setting up environment variables, or running the sfnext CLI for the first time. Covers project creation, directory layout, .env configuration, and sfnext CLI basics.
---

# Project Setup Skill

This skill guides you through creating and configuring a Storefront Next project — a server-rendered SPA built on React 19, React Router 7, Vite, and Tailwind CSS v4.

## Overview

Storefront Next storefronts run on Managed Runtime (MRT) with all SCAPI requests executing server-side. Projects are created with `create-storefront` from `@salesforce/storefront-next-dev` and use TypeScript exclusively (`.ts`/`.tsx` files only — `.js`/`.jsx`/`.mjs`/`.cjs` are forbidden).

## Creating a Project

### Via CLI (local development)

```bash
# Create a new storefront project (interactive)
pnpm dlx @salesforce/storefront-next-dev create-storefront

# Or create with a name flag
pnpm dlx @salesforce/storefront-next-dev create-storefront --name my-storefront

# Navigate into the project
cd my-storefront

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Via Business Manager

Projects can also be created from Business Manager, which sets up the storefront with Commerce Cloud credentials pre-configured.

## Project Structure

```
my-storefront/
├── .env.default              # Default environment variables (template)
├── .env                      # Local overrides (git-ignored)
├── config.server.ts          # Centralized configuration with defaults
├── vite.config.ts            # Vite build configuration
├── package.json              # Dependencies and scripts
├── src/
│   ├── app.css               # Global styles and Tailwind theme
│   ├── root.tsx              # Root layout component
│   ├── routes/               # File-based routes (React Router 7)
│   │   ├── _app.tsx          # App layout (authenticated shell)
│   │   ├── _app._index.tsx   # Home page
│   │   └── _app.product.$productId.tsx
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # shadcn/ui base components (customizable)
│   │   └── ...               # Custom components
│   ├── config/               # Configuration schema and context
│   │   └── schema.ts         # Config type definitions
│   ├── lib/                  # Utilities and API client setup
│   │   ├── api-clients.ts    # createApiClients() factory
│   │   ├── utils.ts          # cn() utility and helpers
│   │   └── registry.ts       # Page Designer component registry
│   ├── locales/              # Translation files
│   │   └── en-US/
│   │       └── translations.json
│   ├── middlewares/          # Server middleware
│   │   ├── auth.server.ts    # Authentication middleware
│   │   └── basket.server.ts  # Basket middleware
│   ├── providers/            # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── extensions/           # Extension modules
│   └── test-utils/           # Shared test utilities
├── public/                   # Static assets
└── cartridges/               # Page Designer cartridge metadata
```

See [Project Structure Reference](references/PROJECT-STRUCTURE.md) for detailed directory explanations.

## Environment Setup

Copy `.env.default` to `.env` and configure required Commerce Cloud credentials:

```bash
cp .env.default .env
```

### Required Variables

```bash
PUBLIC__app__commerce__api__clientId=your-client-id
PUBLIC__app__commerce__api__organizationId=your-org-id
PUBLIC__app__commerce__api__siteId=your-site-id
PUBLIC__app__commerce__api__shortCode=your-short-code
PUBLIC__app__defaultSiteId=your-site-id
PUBLIC__app__commerce__sites='[{"id":"your-site-id","defaultLocale":"en-US","defaultCurrency":"USD","supportedLocales":[{"id":"en-US","preferredCurrency":"USD"}],"supportedCurrencies":["USD"]}]'
```

See [Environment Variables Reference](references/ENV-VARIABLES.md) for the complete variable list and naming rules.

## Development Commands

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run Storybook
pnpm storybook

# Check bundle size
pnpm bundlesize:test
```

## Non-Negotiable Rules

1. **TypeScript only** — `.ts` and `.tsx` files; JavaScript files are blocked by ESLint
2. **Server-only data loading** — Use `loader` functions; never use client loaders
3. **Synchronous loaders** — Return promises, do not use `async`/`await` (enables streaming)
4. **Tailwind CSS 4 only** — No inline styles, CSS modules, or separate CSS files
5. **Use `createPage()` HOC** — Standardizes page patterns with Suspense

## Troubleshooting

| Issue                   | Cause                               | Solution                                              |
| ----------------------- | ----------------------------------- | ----------------------------------------------------- |
| SCAPI 401 errors        | Missing or invalid credentials      | Verify `.env` variables match your Commerce Cloud org |
| JavaScript file errors  | `.js`/`.jsx` files in source        | Rename to `.ts`/`.tsx`; ESLint blocks JS files        |
| Dev server not starting | Missing dependencies                | Run `pnpm install`                                    |
| Config not loading      | Missing `config.server.ts` defaults | Define defaults before using environment overrides    |

## Related Skills

- `storefront-next:sfnext-configuration` - Ongoing configuration management and multi-site setup
- `storefront-next:sfnext-routing` - File-based routing conventions
- `storefront-next:sfnext-data-fetching` - Server-side data loading patterns
- `storefront-next:sfnext-deployment` - Building and deploying to MRT

## Reference Documentation

- [Project Structure Reference](references/PROJECT-STRUCTURE.md) - Detailed directory and file explanations
- [Environment Variables Reference](references/ENV-VARIABLES.md) - Complete variable list and naming rules
