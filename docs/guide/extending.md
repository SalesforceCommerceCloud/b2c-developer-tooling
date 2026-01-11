# Extending the CLI

The B2C CLI can be extended with custom plugins using the [oclif plugin system](https://oclif.io/docs/plugins). Plugins can add new commands, provide custom configuration sources, and integrate with external systems.

## Plugin Architecture

B2C CLI plugins are standard oclif plugins with access to B2C-specific hooks and base command classes.

### Installing Plugins

```bash
# Install from npm
b2c plugins install @your-org/b2c-plugin-example

# Link a local plugin (for development)
b2c plugins link /path/to/your/plugin

# List installed plugins
b2c plugins

# Uninstall a plugin
b2c plugins uninstall @your-org/b2c-plugin-example
```

## Custom Configuration Sources

Plugins can provide custom configuration sources via the `b2c:config-sources` hook. This allows loading configuration from external systems like secret managers, environment-specific files, or remote APIs.

### Hook: `b2c:config-sources`

This hook is called during command initialization, after CLI flags are parsed but before configuration is resolved. Plugins return one or more `ConfigSource` instances that integrate into the configuration resolution chain.

**Hook Options:**

| Property | Type | Description |
|----------|------|-------------|
| `instance` | `string \| undefined` | The `--instance` flag value |
| `configPath` | `string \| undefined` | The `--config` flag value |
| `resolveOptions` | `ResolveConfigOptions` | Full resolution options for advanced use |

**Hook Result:**

| Property | Type | Description |
|----------|------|-------------|
| `sources` | `ConfigSource[]` | Config sources to add to resolution |
| `priority` | `'before' \| 'after'` | Where to insert relative to defaults (default: `'after'`) |

### Priority Ordering

Configuration is resolved with the following precedence:

1. **CLI flags and environment variables** - Always highest priority
2. **Plugin sources with `priority: 'before'`** - Override dw.json defaults
3. **Default sources** - `dw.json` and `~/.mobify`
4. **Plugin sources with `priority: 'after'`** - Fill gaps left by defaults

Each source fills in missing values - it doesn't override values from higher-priority sources.

### Example: Custom Config Source Plugin

The SDK includes an example plugin that loads configuration from `.env.b2c` files:

**Repository:** [`packages/b2c-plugin-example-config`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/packages/b2c-plugin-example-config)

#### Plugin Structure

```
b2c-plugin-example-config/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── hooks/
    │   └── config-sources.ts    # Hook implementation
    └── sources/
        └── env-file-source.ts   # ConfigSource implementation
```

#### package.json

Register your hook in the oclif configuration:

```json
{
  "name": "@your-org/b2c-plugin-custom-config",
  "oclif": {
    "hooks": {
      "b2c:config-sources": "./dist/hooks/config-sources.js"
    }
  },
  "dependencies": {
    "@salesforce/b2c-tooling-sdk": "^0.0.1-preview"
  },
  "peerDependencies": {
    "@oclif/core": "^4"
  }
}
```

#### Hook Implementation

```typescript
// src/hooks/config-sources.ts
import type { ConfigSourcesHook } from '@salesforce/b2c-tooling-sdk/cli';
import { MyCustomSource } from '../sources/my-custom-source.js';

const hook: ConfigSourcesHook = async function(options) {
  // Access oclif context via `this`
  this.debug(`Hook called with instance: ${options.instance}`);

  return {
    sources: [new MyCustomSource()],
    // 'before' = higher priority than dw.json
    // 'after' = lower priority (default)
    priority: 'before',
  };
};

export default hook;
```

#### ConfigSource Implementation

```typescript
// src/sources/my-custom-source.ts
import type {
  ConfigSource,
  NormalizedConfig,
  ResolveConfigOptions
} from '@salesforce/b2c-tooling-sdk/config';

export class MyCustomSource implements ConfigSource {
  readonly name = 'my-custom-source';

  load(options: ResolveConfigOptions): NormalizedConfig | undefined {
    // Load config from your custom source
    // Return undefined if source is not available

    return {
      hostname: 'example.sandbox.us03.dx.commercecloud.salesforce.com',
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      codeVersion: 'version1',
    };
  }

  // Optional: return path for diagnostics
  getPath(): string | undefined {
    return '/path/to/config/source';
  }
}
```

### NormalizedConfig Fields

Your `ConfigSource` can return any of these configuration fields:

| Field | Type | Description |
|-------|------|-------------|
| `hostname` | `string` | B2C instance hostname |
| `webdavHostname` | `string` | Separate WebDAV hostname |
| `codeVersion` | `string` | Code version for deployments |
| `username` | `string` | Basic auth username |
| `password` | `string` | Basic auth password |
| `clientId` | `string` | OAuth client ID |
| `clientSecret` | `string` | OAuth client secret |
| `scopes` | `string[]` | OAuth scopes |
| `authMethods` | `AuthMethod[]` | Allowed auth methods |
| `accountManagerHost` | `string` | Account Manager hostname |
| `shortCode` | `string` | SCAPI short code |
| `mrtProject` | `string` | MRT project slug |
| `mrtEnvironment` | `string` | MRT environment name |
| `mrtApiKey` | `string` | MRT API key |

## Adding Custom Commands

Extend the B2C base command classes to create commands with built-in configuration and authentication:

```typescript
import { InstanceCommand } from '@salesforce/b2c-tooling-sdk/cli';
import { Flags } from '@oclif/core';

export default class MyCommand extends InstanceCommand<typeof MyCommand> {
  static description = 'My custom command';

  static flags = {
    site: Flags.string({ description: 'Site ID', required: true }),
  };

  async run(): Promise<void> {
    // Access resolved configuration
    const { hostname, clientId } = this.resolvedConfig;

    // Access B2C instance with pre-configured clients
    const instance = this.instance;

    // Make API calls
    const { data } = await instance.ocapi.GET('/sites/{site_id}', {
      params: { path: { site_id: this.flags.site } },
    });

    this.log(`Site: ${data.id}`);
  }
}
```

### Base Command Classes

| Class | Use Case |
|-------|----------|
| `BaseCommand` | Minimal base with logging and config loading |
| `OAuthCommand` | Commands requiring OAuth authentication |
| `InstanceCommand` | Commands targeting a B2C instance |
| `CartridgeCommand` | Code deployment commands |
| `JobCommand` | Job execution commands |
| `WebDavCommand` | WebDAV file operations |
| `MrtCommand` | Managed Runtime operations |
| `OdsCommand` | On-Demand Sandbox operations |

## Testing Plugins

Link your plugin locally for development:

```bash
# Build your plugin
cd /path/to/your/plugin
pnpm build

# Link to CLI
b2c plugins link /path/to/your/plugin

# Verify installation
b2c plugins

# Test with debug logging
DEBUG='oclif:*' b2c your-command

# Unlink when done
b2c plugins unlink @your-org/your-plugin
```

## Next Steps

- [Configuration Guide](./configuration) - Learn about config resolution
- [API Reference](/api/) - Explore the SDK API
- [Example Plugin Source](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/packages/b2c-plugin-example-config) - Full working example
