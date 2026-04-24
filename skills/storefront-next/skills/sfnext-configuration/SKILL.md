---
name: sfnext-configuration
description: Manage Storefront Next application configuration using config.server.ts, schema types, environment variables, and multi-site setup. Use when editing config.server.ts, adding PUBLIC__ environment variables, using useConfig or getConfig, or configuring multiple sites. NOT for initial project creation — see sfnext-project-setup.
---

# Configuration Skill

This skill covers the Storefront Next configuration system — centralized in `config.server.ts` with environment variable overrides.

## Overview

All configuration is centralized in `config.server.ts` with typed defaults. Environment variables (via `.env` files or MRT settings) override these defaults. The system provides type-safe access with automatic parsing and validation.

## Adding Configuration

### 1. Define the type in `src/types/config.ts`

```typescript
export type Config = {
  app: {
    myFeature: {
      enabled: boolean;
      maxItems: number;
    };
  };
};
```

### 2. Set defaults in `config.server.ts`

```typescript
export default defineConfig({
  app: {
    myFeature: {
      enabled: false,
      maxItems: 10,
    },
  },
});
```

### 3. Override via environment variables

```bash
PUBLIC__app__myFeature__enabled=true
PUBLIC__app__myFeature__maxItems=20
```

## Accessing Configuration

### In React Components

```typescript
import { useConfig } from '@salesforce/storefront-next-runtime/config';

export function MyComponent() {
  const config = useConfig();

  if (config.myFeature.enabled) {
    const maxItems = config.myFeature.maxItems;
    // Feature code
  }
}
```

### In Server Loaders/Actions

```typescript
import { getConfig } from '@salesforce/storefront-next-runtime/config';

export function loader({context}: LoaderFunctionArgs) {
  const config = getConfig(context); // context is required on server

  if (config.myFeature.enabled) {
    // Loader code
  }
}
```

### In Browser Code (Non-Route Modules)

```typescript
import { getConfig } from '@salesforce/storefront-next-runtime/config';

export function getFeatureFlag() {
  const config = getConfig(); // No context needed in browser (uses window.__APP_CONFIG__)
  return config.myFeature.enabled;
}
```

**Note:** `getConfig()` and `useConfig()` return `AppConfig` — the `app` section of the full config. Access properties directly (e.g., `config.myFeature.enabled`) without the `app` prefix.

## Environment Variable Rules

```bash
# Pattern: PUBLIC__app__{path}__{to}__{property}=value
PUBLIC__app__commerce__api__clientId=abc123
# Maps to config.app.commerce.api.clientId
# Accessed as config.commerce.api.clientId
```

| Rule              | Detail                                         |
| ----------------- | ---------------------------------------------- |
| `PUBLIC__` prefix | Exposed to browser (client-safe)               |
| No prefix         | Server-only (secrets)                          |
| `__` separator    | Navigate nested paths                          |
| Auto-parsing      | Numbers, booleans, JSON parsed automatically   |
| Validation        | Paths must exist in `config.server.ts`         |
| Depth limit       | Maximum 10 levels                              |
| MRT limits        | Names max 512 chars; total `PUBLIC__` max 32KB |

## Multi-Site Configuration

```bash
PUBLIC__app__commerce__sites='[
  {
    "id": "RefArchGlobal",
    "defaultLocale": "en-US",
    "defaultCurrency": "USD",
    "supportedLocales": [
      {"id": "en-US", "preferredCurrency": "USD"},
      {"id": "de-DE", "preferredCurrency": "EUR"}
    ],
    "supportedCurrencies": ["USD", "EUR"]
  }
]'
```

```typescript
const config = getConfig(context);
const currentSite = config.commerce.sites[0];
const locale = currentSite.defaultLocale; // "en-US"
const currency = currentSite.defaultCurrency; // "USD"
```

## Security

```bash
# Client-safe (PUBLIC__ prefix)
PUBLIC__app__commerce__api__clientId=abc123

# Server-only (no prefix — never sent to client)
COMMERCE_API_SLAS_SECRET=your-secret
```

Read server-only secrets directly from `process.env` — never add them to the config system.

## Common Pitfalls

| Pitfall           | Problem                                    | Solution                                           |
| ----------------- | ------------------------------------------ | -------------------------------------------------- |
| Missing `context` | `getConfig()` returns undefined in loaders | Use `getConfig(context)` on server                 |
| Typo in env var   | Variable silently ignored                  | Validation catches paths not in `config.server.ts` |
| Exposing secrets  | Sensitive data in browser                  | Use no-prefix variables; access via `process.env`  |

## Related Skills

- `storefront-next:sfnext-project-setup` - Initial environment setup and `.env` configuration
- `storefront-next:sfnext-data-fetching` - Using config in loader functions
- `storefront-next:sfnext-deployment` - MRT environment variable configuration
