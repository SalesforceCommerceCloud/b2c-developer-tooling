---
description: Extend the B2C CLI with custom plugins, configuration sources, HTTP middleware, and lifecycle hooks.
---

# Extending the CLI

The B2C CLI can be extended with custom plugins using the [oclif plugin system](https://oclif.io/docs/plugins). Plugins can add new commands, provide custom configuration sources, and integrate with external systems.

## Available Hooks

| Hook                                                    | Purpose                          | SDK Support |
| ------------------------------------------------------- | -------------------------------- | ----------- |
| [`b2c:config-sources`](#custom-configuration-sources)   | Custom configuration loading     | CLI only    |
| [`b2c:http-middleware`](#http-middleware)               | HTTP request/response middleware | Yes         |
| [`b2c:operation-lifecycle`](#operation-lifecycle-hooks) | Operation before/after callbacks | CLI only    |
| [`b2c:cartridge-providers`](#cartridge-providers)       | Custom cartridge discovery       | CLI only    |
| [`b2c:scaffold-providers`](#scaffold-providers)         | Custom scaffold providers        | Yes         |

**SDK Support** indicates whether the hook can be used programmatically without the CLI. Only HTTP middleware supports direct SDK registration via `globalMiddlewareRegistry`.

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

| Property         | Type                   | Description                              |
| ---------------- | ---------------------- | ---------------------------------------- |
| `instance`       | `string \| undefined`  | The `--instance` flag value              |
| `configPath`     | `string \| undefined`  | The `--config` flag value                |
| `resolveOptions` | `ResolveConfigOptions` | Full resolution options for advanced use |

**Hook Result:**

| Property   | Type                            | Description                                          |
| ---------- | ------------------------------- | ---------------------------------------------------- |
| `sources`  | `ConfigSource[]`                | Config sources to add to resolution                  |
| `priority` | `'before' \| 'after' \| number` | Priority for sources (see below). Default: `'after'` |

::: tip Numeric Priorities
String values map to numeric priorities: `'before'` → -1, `'after'` → 10. You can also use any numeric value directly for fine-grained control. Lower numbers = higher priority.
:::

### Priority Ordering

Configuration sources use a numeric priority system where **lower numbers = higher priority**:

| Priority | Description               | Example                |
| -------- | ------------------------- | ---------------------- |
| < 0      | Override built-in sources | `'before'` maps to -1  |
| 0        | Built-in sources          | `dw.json`, `~/.mobify` |
| 1-999    | After built-in sources    | `'after'` maps to 10   |
| 1000     | Lowest priority           | `package.json`         |

Configuration is resolved with the following precedence:

1. **CLI flags and environment variables** - Always highest priority
2. **Plugin sources with `priority: 'before'` (or < 0)** - Override dw.json defaults
3. **Default sources** - `dw.json` and `~/.mobify` (priority 0)
4. **Plugin sources with `priority: 'after'` (or 1-999)** - Fill gaps left by defaults
5. **package.json** - Project-level defaults (priority 1000)

Each source fills in missing values - it doesn't override values from higher-priority sources.

Sources with the same priority from different plugins are ordered by plugin name.

Credential sources should select the instance inside `load(options)`, using
`options.instance`. This contains the explicit `--instance` selection or, for
sources loaded after `dw.json`, the selected configuration's `name`. The earlier
`b2c:config-sources` hook runs before configuration loading, so its instance value
only reflects an explicit selection. Use `priority: 'after'` to fill credentials
for the instance selected by `dw.json`; credentials already present in that file
retain precedence.

::: tip Custom ConfigSource Priority
When implementing a custom `ConfigSource`, you can set the `priority` property directly on your class:

```typescript
export class MyCustomSource implements ConfigSource {
  readonly name = 'my-custom-source';
  readonly priority = 5; // Between 'before' (-1) and 'after' (10)

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    // ...
  }
}
```

:::

::: warning Credential Grouping
OAuth credentials (`clientId`/`clientSecret`) and Basic auth credentials (`username`/`password`) are treated as atomic groups. If any field in a group is already set by a higher-priority source, all fields in that group from your source will be ignored. Ensure your source provides complete credential pairs, or that higher-priority sources don't partially define the same credentials.
:::

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
      "b2c:config-sources": "./dist/hooks/config-sources.js",
      "b2c:http-middleware": "./dist/hooks/http-middleware.js",
      "b2c:operation-lifecycle": "./dist/hooks/operation-lifecycle.js",
      "b2c:cartridge-providers": "./dist/hooks/cartridge-providers.js"
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

::: tip
You only need to register hooks your plugin actually implements. The example above shows all available hooks.
:::

#### Hook Implementation

```typescript
// src/hooks/config-sources.ts
import type {ConfigSourcesHook} from '@salesforce/b2c-tooling-sdk/cli';
import {MyCustomSource} from '../sources/my-custom-source.js';

const hook: ConfigSourcesHook = async function (options) {
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
import type {ConfigSource, ConfigLoadResult, ResolveConfigOptions} from '@salesforce/b2c-tooling-sdk/config';

export class MyCustomSource implements ConfigSource {
  readonly name = 'my-custom-source';

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    // Load config from your custom source
    // Return undefined if source is not available

    return {
      config: {
        hostname: 'example.sandbox.us03.dx.commercecloud.salesforce.com',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        codeVersion: 'version1',
      },
      // Location is used for diagnostics - can be a file path, keychain entry, URL, etc.
      location: '/path/to/config/source',
    };
  }
}
```

### Instance Management Methods

Config sources can optionally implement instance management methods to support the `b2c setup instance` commands and the VS Code extension's instance picker. This enables plugins to store and manage instance configurations in custom locations (cloud config, global registry, etc.).

```typescript
import type {
  ConfigSource,
  ConfigLoadResult,
  ResolveConfigOptions,
  InstanceInfo,
  CreateInstanceOptions,
} from '@salesforce/b2c-tooling-sdk/config';

export class MyInstanceSource implements ConfigSource {
  readonly name = 'my-instance-source';

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    // Standard config loading...
  }

  // List all instances from this source
  listInstances(options?: ResolveConfigOptions): InstanceInfo[] {
    return [
      {
        name: 'staging',
        hostname: 'staging.example.com',
        active: true,
        source: this.name,
        location: '/path/to/config',
      },
    ];
  }

  // Create a new instance
  createInstance(options: CreateInstanceOptions & ResolveConfigOptions): void {
    // Store the instance configuration
  }

  // Remove an instance
  removeInstance(name: string, options?: ResolveConfigOptions): void {
    // Delete the instance configuration
  }

  // Set an instance as active
  setActiveInstance(name: string, options?: ResolveConfigOptions): void {
    // Update the active flag
  }
}
```

The `b2c setup instance` commands use these methods on every registered source, including dw.json, in priority order:

- `list` shows the instances from every source that implements `listInstances()`. The `Source` column shows where each one comes from.
- `create` stores the new instance in the highest-priority source that implements `createInstance()`. With the default priority (`'after'`), that is dw.json. With `'before'`, it is your source. `--source <name>` picks a source explicitly.
- `set-active` and `remove` act on the highest-priority source that lists the instance.

Each source tracks its own active instance. Making an instance active in one source doesn't clear an active instance in another.

The `InstanceManager` class (`createInstanceManager()` from `@salesforce/b2c-tooling-sdk/config`) provides the same behavior to SDK consumers.

### Credential Storage Methods

Config sources can optionally implement credential storage methods to securely store secrets. This is useful for keychain integrations, vault plugins, or other secure storage backends.

```typescript
import type {ConfigSource, NormalizedConfig, ResolveConfigOptions} from '@salesforce/b2c-tooling-sdk/config';

export class KeychainSource implements ConfigSource {
  readonly name = 'keychain';

  // Declare which credential fields this source can store. Declare both halves
  // of a pair: configuration resolution reads a pair from one source only.
  readonly credentialFields: (keyof NormalizedConfig)[] = ['clientId', 'clientSecret'];

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    // Load credentials from keychain for the requested instance
    const instanceName = options.instance || '_default';
    const clientId = this.getFromKeychain(`b2c/${instanceName}/clientId`);
    const clientSecret = this.getFromKeychain(`b2c/${instanceName}/clientSecret`);

    if (!clientId && !clientSecret) {
      return undefined;
    }

    return {
      config: {clientId, clientSecret},
      location: `keychain:b2c/${instanceName}`,
    };
  }

  // Store a credential value for an instance
  storeCredential(
    instanceName: string,
    field: keyof NormalizedConfig,
    value: string,
    options?: ResolveConfigOptions,
  ): void {
    this.saveToKeychain(`b2c/${instanceName}/${String(field)}`, value);
  }

  // Remove a credential for an instance
  removeCredential(instanceName: string, field: keyof NormalizedConfig, options?: ResolveConfigOptions): void {
    this.deleteFromKeychain(`b2c/${instanceName}/${String(field)}`);
  }

  private getFromKeychain(key: string): string | undefined {
    // Keychain lookup implementation
  }

  private saveToKeychain(key: string, value: string): void {
    // Keychain save implementation
  }

  private deleteFromKeychain(key: string): void {
    // Keychain delete implementation
  }
}
```

When `b2c setup instance create` is given a credential pair (client ID and secret, username and password, or SLAS client ID and secret), it stores the pair in the first credential store that declares every field given. The pair is then left out of the instance itself. A store that declares only the secret never receives it, because a pair is always read from a single source: `client-id` from dw.json and `client-secret` from a keychain would not be combined. `b2c setup instance remove` calls `removeCredential()` on every credential store for each declared field, so no secrets are left behind. Make `removeCredential()` a no-op for credentials that don't exist.

`b2c setup set` and `b2c setup unset` also write through `storeCredential()` and `removeCredential()`. They do this when a credential store supplies one of its declared `credentialFields`, or supplies the other half of that field's credential pair.

### Field Write Methods

Config sources can optionally implement `updateConfig()` so that `b2c setup set` and `b2c setup unset` can write to them. The built-in dw.json and project `.env` sources work this way. A source without `updateConfig()` (or the credential methods above) is read-only. Writes that would land on it fail and leave everything unchanged.

```typescript
import type {
  ConfigSource,
  ConfigLoadResult,
  ConfigUpdateResult,
  NormalizedConfig,
  ResolveConfigOptions,
} from '@salesforce/b2c-tooling-sdk/config';

export class YamlConfigSource implements ConfigSource {
  readonly name = 'yaml-config';
  readonly priority = -5; // ahead of dw.json

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    // Return the selected instance, including instanceName and hostname
  }

  // Apply a patch to the entry load() selects for the same options.
  // A field set to undefined is removed.
  updateConfig(patch: Partial<NormalizedConfig>, options: ResolveConfigOptions): ConfigUpdateResult {
    // Write the YAML file...
    return {location: '/path/to/b2c.yaml', instance: 'staging'};
  }
}
```

The CLI picks the source to write to from the resolved configuration, in this order:

1. The source that currently supplies the field. This way the new value takes effect.
2. For a credential pair (`client-id`/`client-secret`, `username`/`password`, `slas-client-id`/`slas-client-secret`), the source that supplies the other half.
3. For a field nothing sets yet, the source that supplied the instance: whichever supplies `instanceName`, or `hostname` if no source supplies `instanceName`.

So a high-priority source that defines the instance receives every new field. The dw.json source still loads underneath it, and fields that dw.json already supplies are still written there.

A sandbox hostname derived from a tenant ID counts as supplied by the source of the tenant ID, so a source that supplies only `tenantId` receives `hostname` writes.

### Error Handling

If your `ConfigSource` encounters an error (e.g., malformed config file, network failure), you can:

1. **Return `undefined`** - Source is silently skipped (use for "source not available")
2. **Throw an exception** - Error is surfaced as a warning to the user

```typescript
load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
  const configPath = '/path/to/config';

  if (!fs.existsSync(configPath)) {
    return undefined; // Source not available - skip silently
  }

  // Let JSON.parse errors propagate - they'll become warnings
  const content = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(content); // Throws if malformed

  return { config, location: configPath };
}
```

When a source throws, the CLI displays a warning and continues with other sources. This helps users identify configuration problems without blocking execution.

### Plugin Configuration

Plugins cannot add flags to commands they don't own (this is an oclif limitation). Instead, plugins should accept configuration via environment variables:

```bash
# Configure the example plugin's env file location
export B2C_ENV_FILE_PATH=/path/to/custom/.env.b2c
b2c code deploy
```

**Plugin authors should:**

1. Document supported environment variables in your plugin README
2. Use sensible defaults when env vars are not set
3. Access the `flags` property in hook options for future extensibility

**Hook Options:**

The hook receives a `flags` property containing all parsed CLI flags from the current command:

```typescript
const hook: ConfigSourcesHook = async function (options) {
  // Access parsed flags (read-only)
  this.debug(`Debug mode: ${options.flags?.debug}`);

  // Use env vars for plugin-specific configuration
  const customPath = process.env.MY_PLUGIN_CONFIG_PATH;

  return {
    sources: [new MySource(customPath)],
    priority: 'after',
  };
};
```

### NormalizedConfig Fields

Your `ConfigSource` can return any of these configuration fields:

| Field                | Type           | Description                  |
| -------------------- | -------------- | ---------------------------- |
| `hostname`           | `string`       | B2C instance hostname        |
| `webdavHostname`     | `string`       | Separate WebDAV hostname     |
| `codeVersion`        | `string`       | Code version for deployments |
| `username`           | `string`       | Basic auth username          |
| `password`           | `string`       | Basic auth password          |
| `clientId`           | `string`       | OAuth client ID              |
| `clientSecret`       | `string`       | OAuth client secret          |
| `scopes`             | `string[]`     | OAuth scopes                 |
| `authMethods`        | `AuthMethod[]` | Allowed auth methods         |
| `accountManagerHost` | `string`       | Account Manager hostname     |
| `shortCode`          | `string`       | SCAPI short code             |
| `mrtProject`         | `string`       | MRT project slug             |
| `mrtEnvironment`     | `string`       | MRT environment name         |
| `mrtApiKey`          | `string`       | MRT API key                  |

## HTTP Middleware

Plugins can inject middleware into HTTP clients via the `b2c:http-middleware` hook. This allows logging, metrics collection, custom headers, or request/response transformation.

### Hook: `b2c:http-middleware`

This hook is called during command initialization, after flags are parsed but before any API clients are created. Middleware is applied to all HTTP clients (OCAPI, SLAS, WebDAV, etc.).

**Hook Options:**

| Property | Type                      | Description                  |
| -------- | ------------------------- | ---------------------------- |
| `flags`  | `Record<string, unknown>` | Parsed CLI flags (read-only) |

**Hook Result:**

| Property    | Type                       | Description                      |
| ----------- | -------------------------- | -------------------------------- |
| `providers` | `HttpMiddlewareProvider[]` | Middleware providers to register |

### HttpMiddlewareProvider Interface

```typescript
import type {HttpMiddlewareProvider, HttpClientType} from '@salesforce/b2c-tooling-sdk/clients';

const provider: HttpMiddlewareProvider = {
  name: 'my-middleware',

  getMiddleware(clientType: HttpClientType) {
    // Return middleware for specific client types
    // Return undefined to skip this client type
    return {
      onRequest({request}) {
        // Modify request before sending
        request.headers.set('X-Custom-Header', 'value');
        return request;
      },
      onResponse({response}) {
        // Process response
        console.log(`Status: ${response.status}`);
        return response;
      },
    };
  },
};
```

**Client Types:**

- `ocapi` - OCAPI Data API
- `slas` - SLAS Admin API
- `ods` - On-Demand Sandbox API
- `mrt` - Managed Runtime API
- `custom-apis` - Custom SCAPI endpoints
- `webdav` - WebDAV file operations

### Example: Request Logging Middleware

```typescript
// src/hooks/http-middleware.ts
import type {HttpMiddlewareHook} from '@salesforce/b2c-tooling-sdk/cli';
import type {HttpMiddlewareProvider} from '@salesforce/b2c-tooling-sdk/clients';

const hook: HttpMiddlewareHook = async function (options) {
  const loggingProvider: HttpMiddlewareProvider = {
    name: 'request-logger',
    getMiddleware(clientType) {
      return {
        onRequest({request}) {
          const startTime = Date.now();
          (request as any)._startTime = startTime;
          console.log(`[${clientType}] ${request.method} ${request.url}`);
          return request;
        },
        onResponse({request, response}) {
          const duration = Date.now() - ((request as any)._startTime || 0);
          console.log(`[${clientType}] ${response.status} (${duration}ms)`);
          return response;
        },
      };
    },
  };

  return {providers: [loggingProvider]};
};

export default hook;
```

### SDK Usage (without CLI)

For programmatic SDK usage without the CLI, register middleware directly:

```typescript
import {globalMiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';

globalMiddlewareRegistry.register({
  name: 'my-sdk-middleware',
  getMiddleware(clientType) {
    return {
      onRequest({request}) {
        // Modify request
        return request;
      },
    };
  },
});
```

## B2C Operation Lifecycle Hooks

Plugins can observe and control B2C operation execution via the `b2c:operation-lifecycle` hook. This enables audit logging, notifications, metrics, or governance policies.

The lifecycle hooks are B2C-specific (prefixed with `B2C`) to allow for future platform-specific lifecycle hooks (e.g., MRT).

### Hook: `b2c:operation-lifecycle`

This hook is called during command initialization. Registered providers receive callbacks before and after supported B2C operations.

**Hook Options:**

| Property | Type                      | Description                  |
| -------- | ------------------------- | ---------------------------- |
| `flags`  | `Record<string, unknown>` | Parsed CLI flags (read-only) |

**Hook Result:**

| Property    | Type                              | Description                     |
| ----------- | --------------------------------- | ------------------------------- |
| `providers` | `B2COperationLifecycleProvider[]` | Lifecycle providers to register |

### Supported Operations

| Operation Type | Command           |
| -------------- | ----------------- |
| `job:run`      | `b2c job run`     |
| `job:import`   | `b2c job import`  |
| `job:export`   | `b2c job export`  |
| `code:deploy`  | `b2c code deploy` |

### B2COperationLifecycleProvider Interface

```typescript
import type {
  B2COperationLifecycleProvider,
  B2COperationContext,
  B2COperationResult,
} from '@salesforce/b2c-tooling-sdk/cli';

const provider: B2COperationLifecycleProvider = {
  name: 'my-lifecycle-provider',

  async beforeOperation(context) {
    // Called before operation executes
    // Return { skip: true } to prevent execution
    console.log(`Starting: ${context.operationType}`);

    // Access the B2C instance for API calls
    const {instance} = context;
    console.log(`Target: ${instance.config.hostname}`);

    // Optional: skip operation based on policy
    if (shouldBlock(context)) {
      return {
        skip: true,
        skipReason: 'Blocked by policy',
      };
    }

    return {}; // Continue with operation
  },

  async afterOperation(context, result) {
    // Called after operation completes (success or failure)
    console.log(`Completed: ${context.operationType}`);
    console.log(`Success: ${result.success}`);
    console.log(`Duration: ${result.duration}ms`);

    if (!result.success && result.error) {
      console.error(`Error: ${result.error.message}`);
    }
  },
};
```

### B2COperationContext

The context includes the full `B2CInstance`, giving plugins access to API clients without reconstruction.

| Property        | Type                      | Description                                 |
| --------------- | ------------------------- | ------------------------------------------- |
| `operationType` | `B2COperationType`        | Operation type (e.g., `job:run`)            |
| `operationId`   | `string`                  | Unique ID for this invocation               |
| `instance`      | `B2CInstance`             | Target B2C instance with configured clients |
| `startTime`     | `number`                  | Start timestamp                             |
| `metadata`      | `Record<string, unknown>` | Operation-specific data                     |

**Accessing the instance:**

```typescript
async beforeOperation(context) {
  const { instance } = context;

  // Make API calls using the instance's clients
  const { data } = await instance.ocapi.GET('/sites');

  // Access configuration
  console.log(`Hostname: ${instance.config.hostname}`);
  console.log(`Code version: ${instance.config.codeVersion}`);
}
```

### B2COperationResult

| Property   | Type                 | Description                    |
| ---------- | -------------------- | ------------------------------ |
| `success`  | `boolean`            | Whether operation succeeded    |
| `error`    | `Error \| undefined` | Error if failed                |
| `duration` | `number`             | Execution time in ms           |
| `data`     | `unknown`            | Operation-specific result data |

### Example: Audit Logging Plugin

```typescript
// src/hooks/operation-lifecycle.ts
import type {B2COperationLifecycleHook} from '@salesforce/b2c-tooling-sdk/cli';
import type {B2COperationLifecycleProvider} from '@salesforce/b2c-tooling-sdk/cli';

const hook: B2COperationLifecycleHook = async function (options) {
  const auditProvider: B2COperationLifecycleProvider = {
    name: 'audit-logger',

    async beforeOperation(context) {
      console.log(
        JSON.stringify({
          event: 'operation_start',
          type: context.operationType,
          id: context.operationId,
          hostname: context.instance.config.hostname,
          metadata: context.metadata,
          timestamp: new Date().toISOString(),
        }),
      );
      return {};
    },

    async afterOperation(context, result) {
      console.log(
        JSON.stringify({
          event: 'operation_end',
          type: context.operationType,
          id: context.operationId,
          success: result.success,
          duration: result.duration,
          error: result.error?.message,
          timestamp: new Date().toISOString(),
        }),
      );
    },
  };

  return {providers: [auditProvider]};
};

export default hook;
```

### Example: Deployment Freeze Policy

```typescript
const freezeProvider: B2COperationLifecycleProvider = {
  name: 'deployment-freeze',

  async beforeOperation(context) {
    // Only check deploy operations
    if (!context.operationType.startsWith('code:')) {
      return {};
    }

    // Check if deployment freeze is active
    const freezeUntil = process.env.DEPLOYMENT_FREEZE_UNTIL;
    if (freezeUntil && new Date() < new Date(freezeUntil)) {
      return {
        skip: true,
        skipReason: `Deployment freeze until ${freezeUntil}`,
      };
    }

    return {};
  },
};
```

## Cartridge Providers

Plugins can provide custom cartridge discovery logic via the `b2c:cartridge-providers` hook. This allows loading cartridges from manifest files, remote sources, or custom locations.

### Hook: `b2c:cartridge-providers`

This hook is called during cartridge command initialization. Providers and transformers are collected and used during cartridge discovery.

**Hook Options:**

| Property    | Type                      | Description                  |
| ----------- | ------------------------- | ---------------------------- |
| `directory` | `string`                  | Directory being searched     |
| `flags`     | `Record<string, unknown>` | Parsed CLI flags (read-only) |

**Hook Result:**

| Property       | Type                     | Description                    |
| -------------- | ------------------------ | ------------------------------ |
| `providers`    | `CartridgeProvider[]`    | Cartridge discovery providers  |
| `transformers` | `CartridgeTransformer[]` | Cartridge mapping transformers |

### CartridgeProvider Interface

```typescript
import type {CartridgeProvider, CartridgeDiscoveryOptions} from '@salesforce/b2c-tooling-sdk/cli';
import type {CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';

const provider: CartridgeProvider = {
  name: 'manifest-provider',
  priority: 'before', // 'before' or 'after' default discovery

  async findCartridges(options: CartridgeDiscoveryOptions) {
    // Return cartridge mappings from custom source
    // Return empty array if no cartridges available
    return [
      {
        name: 'app_custom',
        src: '/path/to/cartridge',
        dest: 'app_custom',
      },
    ];
  },
};
```

**Priority:**

- `'before'` - Runs before default `.project` discovery (can override defaults)
- `'after'` - Runs after default discovery (adds additional cartridges)

Cartridges are deduplicated by name (first wins).

### CartridgeTransformer Interface

Transformers modify the final cartridge list after all providers have contributed:

```typescript
import type {CartridgeTransformer} from '@salesforce/b2c-tooling-sdk/cli';

const transformer: CartridgeTransformer = {
  name: 'version-suffix',

  async transform(cartridges, options) {
    // Modify cartridge mappings
    return cartridges.map((c) => ({
      ...c,
      dest: `${c.name}_v2`, // Rename destination
    }));
  },
};
```

### CartridgeDiscoveryOptions

| Property      | Type          | Description                      |
| ------------- | ------------- | -------------------------------- |
| `directory`   | `string`      | Search directory (absolute path) |
| `include`     | `string[]`    | Cartridge names to include       |
| `exclude`     | `string[]`    | Cartridge names to exclude       |
| `codeVersion` | `string`      | Target code version (if known)   |
| `instance`    | `B2CInstance` | Target B2C instance              |

### Example: Manifest-Based Discovery

```typescript
// src/hooks/cartridge-providers.ts
import type {CartridgeProvidersHook} from '@salesforce/b2c-tooling-sdk/cli';
import type {CartridgeProvider} from '@salesforce/b2c-tooling-sdk/cli';
import fs from 'node:fs';
import path from 'node:path';

const hook: CartridgeProvidersHook = async function (options) {
  const manifestProvider: CartridgeProvider = {
    name: 'manifest-provider',
    priority: 'before',

    async findCartridges(discoveryOptions) {
      const manifestPath = path.join(discoveryOptions.directory, 'cartridges.json');

      if (!fs.existsSync(manifestPath)) {
        return [];
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      return manifest.cartridges.map((c: any) => ({
        name: c.name,
        src: path.resolve(discoveryOptions.directory, c.path),
        dest: c.name,
      }));
    },
  };

  return {providers: [manifestProvider]};
};

export default hook;
```

### Example: Environment-Based Filtering

```typescript
const envFilterTransformer: CartridgeTransformer = {
  name: 'env-filter',

  async transform(cartridges, options) {
    const env = process.env.B2C_ENVIRONMENT || 'development';

    // Exclude test cartridges in production
    if (env === 'production') {
      return cartridges.filter((c) => !c.name.startsWith('test_'));
    }

    return cartridges;
  },
};
```

## Scaffold Providers

Plugins can provide custom scaffolds via the `b2c:scaffold-providers` hook, or register providers programmatically via the SDK's `createScaffoldRegistry()` factory.

### Hook: `b2c:scaffold-providers`

This hook is called during scaffold command initialization. Providers and transformers are collected and used during scaffold discovery.

**Hook Options:**

| Property | Type                      | Description                  |
| -------- | ------------------------- | ---------------------------- |
| `flags`  | `Record<string, unknown>` | Parsed CLI flags (read-only) |

**Hook Result:**

| Property       | Type                    | Description                   |
| -------------- | ----------------------- | ----------------------------- |
| `providers`    | `ScaffoldProvider[]`    | Scaffold discovery providers  |
| `transformers` | `ScaffoldTransformer[]` | Scaffold mapping transformers |

### ScaffoldProvider Interface

```typescript
import type {ScaffoldProvider, ScaffoldDiscoveryOptions, Scaffold} from '@salesforce/b2c-tooling-sdk/scaffold';

const provider: ScaffoldProvider = {
  name: 'my-scaffold-provider',
  priority: 'after', // 'before' or 'after' default discovery

  async getScaffolds(options: ScaffoldDiscoveryOptions): Promise<Scaffold[]> {
    // Return scaffolds from custom source
    return [
      {
        id: 'my-custom-scaffold',
        displayName: 'My Custom Scaffold',
        description: 'A custom scaffold from my plugin',
        category: 'cartridge',
        source: 'plugin',
        path: '/path/to/scaffold',
        manifest: {
          /* scaffold.json contents */
        },
      },
    ];
  },
};
```

**Priority:**

- `'before'` - Runs before default discovery (can be overridden by built-in/user/project scaffolds)
- `'after'` - Runs after default discovery (overrides scaffolds with same ID)

Scaffolds are deduplicated by ID (last provider wins for same ID).

### ScaffoldTransformer Interface

Transformers modify the final scaffold list after all providers have contributed:

```typescript
import type {ScaffoldTransformer, Scaffold} from '@salesforce/b2c-tooling-sdk/scaffold';

const transformer: ScaffoldTransformer = {
  name: 'scaffold-filter',

  async transform(scaffolds: Scaffold[], options): Promise<Scaffold[]> {
    // Filter or modify scaffolds
    return scaffolds.filter((s) => !s.id.startsWith('internal-'));
  },
};
```

### SDK Usage (without CLI)

For programmatic SDK usage without the CLI, create a scaffold registry and register providers and transformers on it:

```typescript
import {createScaffoldRegistry} from '@salesforce/b2c-tooling-sdk/scaffold';

// Create a registry instance
const registry = createScaffoldRegistry();

// Add a custom provider
registry.addProviders([
  {
    name: 'my-provider',
    priority: 'after',
    async getScaffolds(options) {
      return [
        /* scaffolds */
      ];
    },
  },
]);

// Add a transformer
registry.addTransformers([
  {
    name: 'my-transformer',
    async transform(scaffolds, options) {
      return scaffolds;
    },
  },
]);
```

::: tip Programmatic Registration
Scaffold providers are registered programmatically via `createScaffoldRegistry()` (see the example above). The SDK does not currently expose a typed `ScaffoldProvidersHook` for plugin-based registration — use the registry API from your plugin's command initialization instead.
:::

See [Scaffolding Guide](./scaffolding) for details on creating custom scaffolds.

## Adding Custom Commands

Extend the B2C base command classes to create commands with built-in configuration and authentication:

```typescript
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {Flags} from '@oclif/core';

export default class MyCommand extends InstanceCommand<typeof MyCommand> {
  static description = 'My custom command';

  static flags = {
    site: Flags.string({description: 'Site ID', required: true}),
  };

  async run(): Promise<void> {
    // Access resolved configuration
    const {hostname, clientId} = this.resolvedConfig;

    // Access B2C instance with pre-configured clients
    const instance = this.instance;

    // Make API calls
    const {data} = await instance.ocapi.GET('/sites/{site_id}', {
      params: {path: {site_id: this.flags.site}},
    });

    this.log(`Site: ${data.id}`);
  }
}
```

### Base Command Classes

| Class              | Use Case                                     |
| ------------------ | -------------------------------------------- |
| `BaseCommand`      | Minimal base with logging and config loading |
| `OAuthCommand`     | Commands requiring OAuth authentication      |
| `InstanceCommand`  | Commands targeting a B2C instance            |
| `CartridgeCommand` | Code deployment commands                     |
| `JobCommand`       | Job execution commands                       |
| `WebDavCommand`    | WebDAV file operations                       |
| `MrtCommand`       | Managed Runtime operations                   |
| `OdsCommand`       | On-Demand Sandbox operations                 |

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
