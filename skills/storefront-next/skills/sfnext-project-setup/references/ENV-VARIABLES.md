# Environment Variables Reference

## Naming Convention

Environment variables use the `PUBLIC__` prefix with double underscore (`__`) separators to map to configuration paths:

```bash
# Pattern: PUBLIC__app__{path}__{to}__{property}=value
PUBLIC__app__commerce__api__clientId=abc123
# Maps to: config.app.commerce.api.clientId
# Accessed as: getConfig(context).commerce.api.clientId
```

## Rules

1. **`PUBLIC__` prefix** — Exposed to browser (client-safe values only)
2. **No prefix** — Server-only secrets (never sent to client)
3. **`__` separator** — Navigates nested config paths
4. **Case-insensitive** — All casings work (normalized to match `config.server.ts`)
5. **Auto-parsing** — Strings, numbers, booleans, JSON arrays/objects parsed automatically
6. **Validation** — Paths must exist in `config.server.ts` (prevents typos)
7. **Depth limit** — Maximum 10 levels deep (use JSON for deeper nesting)
8. **Path precedence** — More specific paths override less specific ones
9. **Protected paths** — `app__engagement` cannot be overridden via environment variables
10. **MRT limits** — Variable names max 512 characters, total `PUBLIC__` values max 32KB

## Required Variables

| Variable | Description |
|----------|-------------|
| `PUBLIC__app__commerce__api__clientId` | SLAS client ID |
| `PUBLIC__app__commerce__api__organizationId` | Commerce Cloud organization ID |
| `PUBLIC__app__commerce__api__siteId` | Default site ID |
| `PUBLIC__app__commerce__api__shortCode` | API short code |
| `PUBLIC__app__defaultSiteId` | Default site ID for routing |
| `PUBLIC__app__commerce__sites` | JSON array of site configurations |

## Server-Only Variables

```bash
# Server-only secrets (no PUBLIC__ prefix)
COMMERCE_API_SLAS_SECRET=your-slas-secret
```

Access server-only secrets via `process.env` directly — never add them to the config system.

## Multi-Site Configuration

The `commerce.sites` array defines site configurations:

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

## Setting Complex Values

```bash
# Individual variables
PUBLIC__app__myFeature__option1=value1
PUBLIC__app__myFeature__option2=value2

# Or as a single JSON value
PUBLIC__app__myFeature='{"option1":"value1","option2":"value2"}'
```

## Security Guidelines

| Prefix | Visibility | Use For |
|--------|-----------|---------|
| `PUBLIC__` | Browser + Server | Client IDs, site IDs, feature flags |
| (none) | Server only | API secrets, private keys, credentials |
