# SCAPI Operations

Operations for working with Salesforce Commerce API (SCAPI), including local custom API discovery.

## Functions

### `scanLocalCustomApis(options?)`

Scans the local workspace for custom API definitions.

Discovers custom APIs by:
1. Finding cartridges using `findCartridges()` (looks for `.project` files)
2. Scanning each cartridge's `cartridge/rest-apis/` directory
3. Parsing `schema.yaml` and `api.json` files to extract endpoint metadata

**Parameters:**
- `options` (optional) - Scan options
  - `directory` - Directory to search for cartridges (defaults to cwd)
  - `includeCartridges` - Include only these cartridge names
  - `excludeCartridges` - Exclude these cartridge names
  - `includeApis` - Include only these API names
  - `excludeApis` - Exclude these API names

**Returns:** `LocalCustomApiEndpoint[]` - Array of discovered custom API endpoints

**Example:**
```typescript
import { scanLocalCustomApis } from '@salesforce/b2c-tooling-sdk/operations/scapi';

// Scan current directory
const endpoints = scanLocalCustomApis();

// Scan specific directory
const endpoints = scanLocalCustomApis({ directory: './my-project' });

// Filter by cartridge
const endpoints = scanLocalCustomApis({ 
  includeCartridges: ['app_storefront_base'] 
});

// Filter by API name
const endpoints = scanLocalCustomApis({ 
  includeApis: ['loyalty-points'] 
});

console.log(`Found ${endpoints.length} custom API endpoints`);
endpoints.forEach(ep => {
  console.log(`  ${ep.httpMethod} ${ep.endpointPath} (${ep.apiName} v${ep.apiVersion})`);
});
```

## Types

### `LocalCustomApiEndpoint`

Represents a custom API endpoint found in the workspace.

```typescript
interface LocalCustomApiEndpoint {
  apiName: string;              // e.g., "loyalty-points"
  apiVersion: string;           // e.g., "1.0.0"
  cartridgeName: string;        // e.g., "app_storefront_base"
  endpointPath: string;         // e.g., "/items/{itemId}"
  httpMethod: HttpMethod;       // e.g., "GET"
  operationId?: string;         // e.g., "getItem"
  securityScheme?: SecurityScheme;  // "AmOAuth2" or "ShopperToken"
  schemaFile: string;           // e.g., "rest-apis/loyalty-points/schema.yaml"
  implementationScript?: string;    // e.g., "script.js"
  status: 'local' | 'not_deployed';
}
```

### `HttpMethod`

Valid HTTP methods for custom API endpoints:
```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
```

### `SecurityScheme`

Valid security schemes for custom API endpoints:
```typescript
type SecurityScheme = 'AmOAuth2' | 'ShopperToken';
```

## Use Cases

### CLI Command Implementation

```typescript
import { scanLocalCustomApis } from '@salesforce/b2c-tooling-sdk/operations/scapi';

// b2c scapi custom list --local
const endpoints = scanLocalCustomApis({ directory: process.cwd() });

// Group by cartridge
const byCartridge = endpoints.reduce((acc, ep) => {
  acc[ep.cartridgeName] = acc[ep.cartridgeName] || [];
  acc[ep.cartridgeName].push(ep);
  return acc;
}, {});

Object.entries(byCartridge).forEach(([cartridge, eps]) => {
  console.log(`\n${cartridge}:`);
  eps.forEach(ep => {
    console.log(`  ${ep.httpMethod} ${ep.endpointPath}`);
  });
});
```

### MCP Tool Implementation

```typescript
import { scanLocalCustomApis } from '@salesforce/b2c-tooling-sdk/operations/scapi';

// Scan local APIs and merge with remote
const localEndpoints = scanLocalCustomApis({ directory: workingDir });
const remoteEndpoints = await fetchRemoteEndpoints();

// Merge and deduplicate
const allEndpoints = mergeEndpoints(localEndpoints, remoteEndpoints);
```

### Validation Tool

```typescript
import { scanLocalCustomApis } from '@salesforce/b2c-tooling-sdk/operations/scapi';

// Validate local custom API definitions
const endpoints = scanLocalCustomApis();

for (const endpoint of endpoints) {
  // Check for required fields
  if (!endpoint.operationId) {
    console.warn(`Warning: ${endpoint.endpointPath} missing operationId`);
  }
  
  // Check security scheme
  if (!endpoint.securityScheme) {
    console.warn(`Warning: ${endpoint.endpointPath} missing security scheme`);
  }
  
  // Check implementation script exists
  if (endpoint.implementationScript) {
    const scriptPath = path.join(
      cartridgePath, 
      'cartridge/rest-apis', 
      endpoint.apiName, 
      endpoint.implementationScript
    );
    if (!fs.existsSync(scriptPath)) {
      console.error(`Error: ${endpoint.endpointPath} references missing script`);
    }
  }
}
```

## Implementation Notes

- Uses SDK's `findCartridges()` for consistent cartridge discovery
- Parses OpenAPI 3.0 `schema.yaml` files with the `yaml` package
- Skips malformed schemas but logs warnings
- Returns partial results if some cartridges fail to scan
- Thread-safe and can be called concurrently
