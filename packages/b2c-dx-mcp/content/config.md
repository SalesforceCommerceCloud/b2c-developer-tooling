# Configuration Management

## Overview

All configuration is centralized in `config.server.ts` with environment variable overrides via `.env` files. The configuration system provides type-safe access to app settings with automatic parsing and validation.

## Required Variables

Copy `.env.default` to `.env` and set these required Commerce Cloud credentials:

```bash
PUBLIC__app__commerce__api__clientId=your-client-id
PUBLIC__app__commerce__api__organizationId=your-org-id
PUBLIC__app__commerce__api__siteId=your-site-id
PUBLIC__app__commerce__api__shortCode=your-short-code
PUBLIC__app__defaultSiteId=your-site-id
PUBLIC__app__commerce__sites='[{"id":"your-site-id","defaultLocale":"en-US","defaultCurrency":"USD","supportedLocales":[{"id":"en-US","preferredCurrency":"USD"}],"supportedCurrencies":["USD"]}]'
```

**Note:** The `commerce.sites` array defines your site configuration including locales, currencies, and supported options. See `.env.default` for a complete example with multiple locales and currencies.

## Adding Configuration

1. **Define type in `src/config/schema.ts`**:

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

2. **Add defaults in `config.server.ts`**:

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

3. **Override via environment variables**:

```bash
PUBLIC__app__myFeature__enabled=true
PUBLIC__app__myFeature__maxItems=20
```

## Usage Patterns

**In React Components**:

```typescript
import { useConfig } from '@/config';

export function MyComponent() {
    const config = useConfig();

    if (config.myFeature.enabled) {
        const maxItems = config.myFeature.maxItems;
        // Your feature code
    }
}
```

**In Server Loaders/Actions**:

```typescript
import { getConfig } from '@/config';

export function loader({ context }: LoaderFunctionArgs) {
    const config = getConfig(context);

    if (config.myFeature.enabled) {
        // Your loader code
    }
}
```

**In Client Loaders**:

```typescript
import { getConfig } from '@/config';

export function clientLoader() {
    const config = getConfig(); // No context needed - uses window.__APP_CONFIG__
    
    if (config.myFeature.enabled) {
        // Your loader code
    }
}
```

**Note:** `getConfig()` and `useConfig()` return `AppConfig` which is the `app` section of the full `Config` type. So you access properties directly (e.g., `config.myFeature.enabled`) without the `app` prefix.

## Environment Variable Rules

Use the `PUBLIC__` prefix with double underscores (`__`) to set any config path:

```bash
# Environment variable         →  Config path (in Config type)  →  Access via getConfig()/useConfig()
PUBLIC__app__commerce__sites='[...]' → config.app.commerce.sites → config.commerce.sites
PUBLIC__app__defaultSiteId=RefArchGlobal → config.app.defaultSiteId → config.defaultSiteId
PUBLIC__app__myFeature__enabled=true → config.app.myFeature.enabled → config.myFeature.enabled
```

**Multi-site Configuration Example:**

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

**Accessing Site Configuration:**

```typescript
const config = getConfig(context);
const currentSite = config.commerce.sites[0]; // Get first site
const locale = currentSite.defaultLocale;      // "en-US"
const currency = currentSite.defaultCurrency;  // "USD"
```

Values are automatically parsed (numbers, booleans, JSON arrays/objects).

Rules:
1. **`PUBLIC__` prefix**: Exposed to browser (client-safe values)
2. **No prefix**: Server-only (secrets, never exposed)
3. **`__` separator**: Navigate nested paths (`PUBLIC__app__commerce__sites`)
4. **Case-insensitive**: All casings work (normalized to match `config.server.ts`)
5. **Auto-parsing**: Strings, numbers, booleans, JSON arrays/objects
6. **Validation**: Paths must exist in `config.server.ts` (prevents typos)
7. **Depth limit**: Maximum 10 levels deep (use JSON values for deeper nesting)
8. **Path precedence**: More specific paths override less specific ones
9. **Protected paths**: `app__engagement` cannot be overridden via environment variables
10. **MRT limits**: Variable names max 512 characters, total PUBLIC__ values max 32KB

**Note:** Site configuration (locales, currencies) is now managed via `PUBLIC__app__commerce__sites` array instead of individual `PUBLIC__app__site__locale` variables. This enables multi-site support.

**Setting nested objects with JSON:**

```bash
# Instead of multiple variables:
PUBLIC__app__myFeature__option1=value1
PUBLIC__app__myFeature__option2=value2

# Use a single JSON value:
PUBLIC__app__myFeature='{"option1":"value1","option2":"value2","nested":{"enabled":true}}'
```

## Security

```bash
# ✅ Safe for client (PUBLIC__ prefix)
PUBLIC__app__commerce__api__clientId=abc123

# ✅ Server-only (no prefix)
COMMERCE_API_SLAS_SECRET=your-secret
```

Read server-only secrets directly from `process.env` - never add to config.

**Reference:** See src/config/README.md for complete configuration documentation.
