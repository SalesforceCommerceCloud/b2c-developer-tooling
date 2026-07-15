# CLI Commands Reference

Detailed reference for `b2c sfnext scapi` subcommands that manage typed SCAPI clients in a Storefront Next project.

## How It Works

The `b2c sfnext scapi` commands are provided by the `@salesforce/storefront-next-dev` package, which is auto-installed as a JIT (just-in-time) plugin when you first run any `sfnext` command. If you have `@salesforce/storefront-next-dev` in your project's `devDependencies`, the local version is used automatically.

## `b2c sfnext scapi available`

Lists all SCAPI APIs that can be added to your project.

```bash
b2c sfnext scapi available [--api-family <family>] [--api-name <name>] [--json]
```

| Flag | Description |
|------|-------------|
| `--api-family` | Filter by API family (e.g., `product`, `search`, `checkout`, `customer`, `custom`) |
| `--api-name` | Filter by API name (e.g., `shopper-products`) |
| `--json` | Output as JSON |

**Example output:**

```
API Family    API Name              Version  Status
product       shopper-products      v1       current
search        shopper-search        v1       current
checkout      shopper-baskets-v2    v1       current
customer      shopper-customers     v1       current
custom        my-loyalty-api        v1       current
```

## `b2c sfnext scapi add`

Adds a typed SCAPI client to the project. Generates type definitions and registers the client in the `createApiClients()` factory.

```bash
b2c sfnext scapi add <apiFamily> <apiName> <version> [--force]
```

| Argument/Flag | Description |
|---------------|-------------|
| `<apiFamily>` | API family (e.g., `product`, `search`, `custom`) |
| `<apiName>` | API name (e.g., `shopper-products`, `my-loyalty-api`) |
| `<version>` | API version (e.g., `v1`) |
| `--force` | Overwrite if client already exists |

**What it does:**
1. Fetches the OpenAPI schema for the specified API
2. Generates TypeScript type definitions
3. Registers the client in the project's API client configuration
4. The client becomes accessible via `createApiClients(context).<camelCaseName>`

**Client property naming:**

| API Name | Client Property |
|----------|----------------|
| `shopper-products` | `clients.shopperProducts` |
| `shopper-search` | `clients.shopperSearch` |
| `shopper-baskets-v2` | `clients.shopperBasketsV2` |
| `my-loyalty-api` | `clients.myLoyaltyApi` |

## `b2c sfnext scapi list`

Lists SCAPI clients currently configured in the project.

```bash
b2c sfnext scapi list [--json]
```

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |

Shows all clients that have been added to the project and are available via `createApiClients()`.

## `b2c sfnext scapi remove`

Removes a typed SCAPI client from the project.

```bash
b2c sfnext scapi remove <apiFamily> <apiName>
```

| Argument | Description |
|----------|-------------|
| `<apiFamily>` | API family of the client to remove |
| `<apiName>` | API name of the client to remove |

**What it does:**
1. Removes the generated type definitions
2. Unregisters the client from the API client configuration
3. The client property is no longer available on `createApiClients()` output

**When to use:** Remove unused API clients to reduce bundle size and type-checking scope.

## Complementary: `b2c scapi schemas`

While `b2c sfnext scapi` manages which clients exist in your project, use `b2c scapi schemas` to explore what those APIs offer before writing code:

```bash
# list all schemas
b2c scapi schemas list [--api-family <family>] [--api-name <name>] [--status <status>]

# get schema with selective expansion
b2c scapi schemas get <apiFamily> <apiName> <version> [options]
```

Key flags for `b2c scapi schemas get`:

| Flag | Description |
|------|-------------|
| `--list-paths` | List all endpoint paths |
| `--list-schemas` | List all type/schema names |
| `--expand-paths <paths>` | Expand specific paths (comma-separated) |
| `--expand-schemas <schemas>` | Expand specific schemas (comma-separated) |
| `--expand-all` | Full schema without collapsing |
| `--yaml` | Output as YAML |
| `--json` | Output wrapped JSON with metadata |

See `b2c-cli:b2c-scapi-schemas` skill for complete documentation of schema browsing.
