---
description: Use the mrt-utilities package to simulate a deployed Managed Runtime environment locally with Express middleware and streaming adapters.
---

# MRT Utilities

The `@salesforce/mrt-utilities` package provides middleware and utilities to simulate a deployed Managed Runtime (MRT) environment. Use it when building storefronts or apps that run on MRT so you can develop and test locally with the same request flow, proxy behavior, and static asset paths as in production.

## When to use

- **Local development** of PWA Kit or other MRT-hosted apps: run an Express server that mimics MRT’s request processor, proxying, and static asset serving.
- **Testing** request processor logic and proxy configs before deploying to MRT.
- **Streaming/SSR** on Lambda: use the streaming subpath to adapt Express apps to AWS Lambda with response streaming and compression.

## Prerequisites

- Node.js 22.16.0 or later
- [Express](https://expressjs.com/) 5.x (peer dependency)

## Installation

```bash
pnpm add @salesforce/mrt-utilities express
# or
npm install @salesforce/mrt-utilities express
```

## Package exports

| Export | Description |
|--------|-------------|
| **Main** (`@salesforce/mrt-utilities`) | Middleware factories, `isLocal`, and re-exports from subpaths |
| **Middleware** (`@salesforce/mrt-utilities/middleware`) | MRT-style Express middleware and `ProxyConfig` type |
| **Metrics** (`@salesforce/mrt-utilities/metrics`) | Metrics sending for MRT (e.g. CloudWatch) |
| **Streaming** (`@salesforce/mrt-utilities/streaming`) | Lambda streaming adapter, Express request/response helpers, compression config |

## Basic setup

Wire the middleware in the order your app needs. **Use `createMRTCommonMiddleware` and `createMRTCleanUpMiddleware` in all environments** (local and deployed). For local-only behavior (request processor, proxies, static assets), guard with `isLocal()`.

```typescript
import express from 'express';
import {
  createMRTProxyMiddlewares,
  createMRTRequestProcessorMiddleware,
  createMRTStaticAssetServingMiddleware,
  createMRTCommonMiddleware,
  createMRTCleanUpMiddleware,
  isLocal,
} from '@salesforce/mrt-utilities';

const app = express();
app.disable('x-powered-by');

// Top-most: set up MRT-style headers
app.use(createMRTCommonMiddleware());

if (isLocal()) {
  const requestProcessorPath = 'path/to/request-processor.js';
  const proxyConfigs = [
    { host: 'https://example.com', path: 'api' },
  ];

  app.use(createMRTRequestProcessorMiddleware(requestProcessorPath, proxyConfigs));

  const mrtProxies = createMRTProxyMiddlewares(proxyConfigs);
  mrtProxies.forEach(({ path, fn }) => app.use(path, fn));

  const staticAssetDir = 'path/to/static';
  app.use(
    `/mobify/bundle/${process.env.BUNDLE_ID || '1'}/static/`,
    createMRTStaticAssetServingMiddleware(staticAssetDir)
  );
}

// Clean up headers and set remaining values
app.use(createMRTCleanUpMiddleware());
```

## Middleware

### createMRTCommonMiddleware()

Sets headers and other request/response behavior to match MRT. **Use in all environments** (local and deployed). Mount at the top of your middleware stack.

### createMRTRequestProcessorMiddleware(requestProcessorPath, proxyConfigs)

- **requestProcessorPath**: Path to your request processor module (e.g. `request-processor.js`).
- **proxyConfigs**: Array of `{ host, path }` used for proxy and request-processor routing.

Runs your request processor in the local pipeline so routing and SSR behave like MRT.

### createMRTProxyMiddlewares(proxyConfigs)

Returns an array of `{ path, fn }` for mounting proxy middleware. Each entry proxies under `/mobify/proxy/<path>` to the configured `host`. Mount each with `app.use(path, fn)`.

**ProxyConfig** (from `@salesforce/mrt-utilities/middleware`):

```typescript
interface ProxyConfig {
  host: string;   // e.g. 'https://example.com'
  path: string;  // e.g. 'api'
}
```

### createMRTStaticAssetServingMiddleware(staticAssetDir)

Serves static files from `staticAssetDir` under the MRT bundle static path. Use the same path pattern as in production (e.g. `/mobify/bundle/<id>/static/`).

### createMRTCleanUpMiddleware()

Removes internal MRT headers and sets any remaining response headers. **Use in all environments** (local and deployed). Mount after your app logic and before sending the response.

## Environment detection

**isLocal()** returns `true` when not running in AWS Lambda (i.e. when `AWS_LAMBDA_FUNCTION_NAME` is not set). Use it to enable local-only middleware (request processor, proxies, local static assets).

```typescript
import { isLocal } from '@salesforce/mrt-utilities';

if (isLocal()) {
  // Use local request processor, proxies, static assets
}
```

## Streaming (Lambda)

For MRT’s Lambda runtime with streaming responses (e.g. SSR), use the **streaming** subpath:

```typescript
import {
  createStreamingLambdaAdapter,
  type CompressionConfig,
} from '@salesforce/mrt-utilities/streaming';
```

- **createStreamingLambdaAdapter**: Wraps your Express app so it can be invoked from Lambda with streaming support.
- **CompressionConfig**: Options for response compression (e.g. encoding, quality).

See the package source and tests for full adapter usage.

## Metrics

For sending metrics (e.g. to CloudWatch) in an MRT-compatible way:

```typescript
import { MetricsSender } from '@salesforce/mrt-utilities/metrics';
```

Use when you need to emit metrics from the same process that serves requests (e.g. custom middleware or request processor).

## Related

- [MRT CLI commands](/cli/mrt) — manage MRT projects, environments, and bundles from the CLI.
- [Storefront Next](/guide/storefront-next) — end-to-end setup including MRT and local development.
