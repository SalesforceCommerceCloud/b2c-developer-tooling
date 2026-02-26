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
