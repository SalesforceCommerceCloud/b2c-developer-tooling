# Configuration

## Overview

PWA Kit applications use configuration files to customize API access, URL formatting, SSR, and application settings. Configuration values are serialized for isomorphic rendering.

## Configuration Files

Configuration files are located in `config/`:

```
config/
├── default.js          # Default configuration
├── production.js       # Production overrides
├── development.js      # Development overrides
└── local.js            # Local overrides (git-ignored)
```

### File Format Precedence

If base names are the same:
1. `.js` (JavaScript) - Highest priority
2. `.yml` (YAML)
3. `.yaml` (YAML)
4. `.json` (JSON) - Lowest priority

## Critical Security Rule: No Secrets in Configuration

**Configuration values are serialized and sent to the client**. Never include secrets:

```javascript
// ❌ WRONG - Secrets exposed to browser!
module.exports = {
    apiKey: 'sk_live_abc123', // EXPOSED!
    secretToken: process.env.SECRET // Still exposed!
};

// ✅ CORRECT - Use proxy or server-only environment variables
module.exports = {
    publicApiKey: 'pk_live_xyz789', // OK - public key
    apiEndpoint: '/mobify/proxy/external-api' // OK - uses proxy
};
```

## Standard Configuration Structure

**Reference:** See `config/default.js` and `config/sites.js` in the template for the full structure.

Key properties: `app.url` (site, locale, showDefaults), `app.defaultSite`, `app.siteAliases`, `app.sites`, `app.commerceAPI`, `app.storeLocatorEnabled`, `app.multishipEnabled`, `envBasePath`, `ssrEnabled`, `ssrParameters.proxyConfigs`.

**Note:** Use `commerceAPI` (not `commerceAPIConfig`). Feature flags live at `app.*` level.

## Proxy Configuration

Use the proxy feature to route API requests through the storefront domain:

```javascript
// config/default.js - merge into your module.exports
module.exports = {
    // ...other config (app, ssrEnabled, etc.)
    proxy: {
        'external-api': {
            host: 'https://api.example.com',
            path: '/v1',
            caching: true
        }
    }
};
```

### Using Proxy in Code

```javascript
// Request through proxy using /mobify/proxy/<PROXY_PATH> pattern
const response = await fetch('/mobify/proxy/external-api/users');
// This proxies to: https://api.example.com/v1/users
```

## Multi-Site Configuration

**Reference:** See `config/sites.js` in the template. Each site has `id`, `l10n.supportedCurrencies`, `l10n.defaultLocale`, `l10n.supportedLocales` (with `id`, `preferredCurrency`). Reference in `config/default.js` via `sites: require('./sites.js')`.

## Accessing Configuration

Use `getConfig` from `@salesforce/pwa-kit-runtime/utils/ssr-config` in both server and client code:

```javascript
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config';

// In components or server code
const config = getConfig();
const siteId = config.app.commerceAPI.parameters.siteId;
const storeLocatorEnabled = config.app.storeLocatorEnabled ?? true;
```

### In Components

```jsx
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config';

const MyComponent = () => {
    const config = getConfig();
    const siteId = config.app.commerceAPI.parameters.siteId;
    return <div>Site: {siteId}</div>;
};
```

## Feature Flags

Feature flags are at `app.*` level in config:

```javascript
// config/default.js
module.exports = {
    app: {
        storeLocatorEnabled: true,
        multishipEnabled: true,
        partialHydrationEnabled: false,
        oneClickCheckout: { enabled: false }  // Developer Preview - requires private SLAS client
    }
};
```

**Note:** The checkout route can be configured to use One Click Checkout when `app.oneClickCheckout.enabled` is true. See `app/routes.jsx` and `app/pages/checkout` for feature-flag usage.
