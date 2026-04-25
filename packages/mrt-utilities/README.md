# mrt-utilities

Middleware and utilities to simulate a deployed MRT environment.

## Usage

```
import {
    createMRTProxyMiddlewares,
    createMRTRequestProcessorMiddleware,
    createMRTStaticAssetServingMiddleware,
    createMRTCommonMiddleware,
    createMRTCleanUpMiddleware,
    isLocal,
} from '@salesforce/mrt-utilities';


export const createApp = (): Express => {
    const app = express();
    app.disable('x-powered-by');

    // Top most middleware to set up headers
    app.use(createMRTCommonMiddleware());

    if (isLocal()) {
        const requestProcessorPath = 'path/to/request-processor.js';
        const proxyConfigs = [
            {
                host: 'https://example.com',
                path: 'api',
            },
        ];
        app.use(createMRTRequestProcessorMiddleware(requestProcessorPath, proxyConfigs));

        const mrtProxies = createMRTProxyMiddlewares(proxyConfigs);
        mrtProxies.forEach(({ path, fn }) => {
            app.use(path, fn);
        });

        const staticAssetDir = 'path/to/static';
        app.use(
            `/mobify/bundle/${process.env.BUNDLE_ID || '1'}/static/`,
            createMRTStaticAssetServingMiddleware(staticAssetDir)
        );
    }

    // Cleans up any remaining headers and sets any remaining values
    app.use(createMRTCleanUpMiddleware());
```

## Development data-store usage

Use the `data-store` subpath with Node's `development` condition to load the pseudo local data-store implementation:

```bash
node --conditions development your-app.js
```

```ts
import {DataStore} from '@salesforce/mrt-utilities/data-store';

const store = DataStore.getDataStore();
const entry = await store.getEntry('custom-global-preferences');
```

Configure local values with environment variables:

- `SFNEXT_DATA_STORE_DEFAULTS`: JSON map of key to object value
- `SFNEXT_DATA_STORE_WARN_ON_MISSING`: set to `false` to suppress missing-key warnings

Example:

```bash
export SFNEXT_DATA_STORE_DEFAULTS='{"custom-global-preferences":{"featureFlag":true}}'
export SFNEXT_DATA_STORE_WARN_ON_MISSING=true
```

By default, missing keys still throw `DataStoreNotFoundError` in development (matching production semantics).
