# Configuration Management

## Overview

All configuration in `config.server.ts` with environment variable overrides.

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

    if (config.app.myFeature.enabled) {
        const maxItems = config.app.myFeature.maxItems;
        // Your feature code
    }
}
```

**In Loaders/Actions**:

```typescript
import { getConfig } from '@/config';

export function loader({ context }: LoaderFunctionArgs) {
    const config = getConfig(context);

    if (config.app.myFeature.enabled) {
        // Your loader code
    }
}
```

## Environment Variable Rules

Use the `PUBLIC__` prefix with double underscores (`__`) to set any config path:

```bash
# Environment variable         →  Config path
PUBLIC__app__site__locale=en-US   →  config.app.site.locale
PUBLIC__app__site__currency=EUR   →  config.app.site.currency
```

Values are automatically parsed (numbers, booleans, JSON arrays/objects).

Rules:
1. **`PUBLIC__` prefix**: Exposed to browser (client-safe values)
2. **No prefix**: Server-only (secrets, never exposed)
3. **`__` separator**: Navigate nested paths (`PUBLIC__app__site__locale`)
4. **Case-insensitive**: All casings work
5. **Auto-parsing**: Strings, numbers, booleans, JSON
6. **Validation**: Paths must exist in `config.server.ts`

## Security

```bash
# ✅ Safe for client (PUBLIC__ prefix)
PUBLIC__app__commerce__api__clientId=abc123

# ✅ Server-only (no prefix)
COMMERCE_API_SLAS_SECRET=your-secret
```

Read server-only secrets directly from `process.env` - never add to config.

**Reference:** See src/config/README.md for complete configuration documentation.
