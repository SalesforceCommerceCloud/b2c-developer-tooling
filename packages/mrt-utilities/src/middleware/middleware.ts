/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * @fileoverview MRT (Managed Runtime) Middleware for Express.js applications.
 *
 * This module provides middleware functions for handling requests in a managed runtime environment,
 * including request processing, proxy configuration, static asset serving, and local development
 * utilities. It's designed to work with Salesforce Commerce Cloud's managed runtime platform.
 *
 * @author Salesforce Commerce Cloud
 * @version 0.0.1
 */

import {Headers} from '../utils/ssr-proxying.js';
import {
  configureProxying,
  type ProxyResult,
  type ProxyConfig,
  type CreateProxyMiddlewareFn,
} from '../utils/configure-proxying.js';
import express, {type RequestHandler, type Request, type Response, type NextFunction} from 'express';
import fs from 'fs';
import path from 'path';
import mimeTypes from 'mime-types';
import qs from 'qs';

const MOBIFY_PATH = '/mobify';
const PROXY_PATH_BASE = `${MOBIFY_PATH}/proxy`;
const CACHING_PATH_BASE = `${MOBIFY_PATH}/caching`;
const BUNDLE_PATH_BASE = `${MOBIFY_PATH}/bundle`;
const proxyBasePath = PROXY_PATH_BASE;
const bundleBasePath = BUNDLE_PATH_BASE;
const X_HEADERS_TO_REMOVE_ORIGIN = [
  'x-api-key',
  'x-apigateway-event',
  'x-apigateway-context',
  'x-mobify-access-key',
  'x-sfdc-access-control',
];
export const X_MOBIFY_REQUEST_CLASS = 'x-mobify-request-class';
export const X_MOBIFY_QUERYSTRING = 'x-mobify-querystring';
export const X_MOBIFY_REQUEST_PROCESSOR_LOCAL = 'x-mobify-rp-local';
const CONTENT_TYPE = 'content-type';
const NO_CACHE = 'max-age=0, nocache, nostore, must-revalidate';

/**
 * Checks if a URL is for a bundle or proxy path that should be skipped by request processing.
 *
 * @param url - The URL to check
 * @returns True if the URL starts with a proxy or bundle base path
 * @private
 */
const _isBundleOrProxyPath = (url: string) => {
  return url.startsWith(proxyBasePath) || url.startsWith(bundleBasePath);
};

/**
 * Dynamically imports a request processor module if it exists.
 *
 * @param requestProcessorPath - The file path to the request processor module
 * @returns The default export of the module, or null if the file doesn't exist
 * @private
 */
const _getRequestProcessor = async (requestProcessorPath: string | undefined) => {
  if (requestProcessorPath && fs.existsSync(requestProcessorPath)) {
    const module = await import(requestProcessorPath);
    return module;
  }
  return null;
};

/**
 * Retrieves request processor parameters from environment variables with defaults.
 *
 * This function reads environment variables to determine the application hostname,
 * deployment target, and environment. It provides sensible defaults for local development.
 *
 * @returns Object containing appHostname, deployTarget, and environment
 * @private
 */
const getRequestProcessorParameters = (): {appHostname: string; deployTarget: string; environment: string} => {
  return {
    appHostname: process.env.EXTERNAL_DOMAIN_NAME || 'localhost:2401',
    deployTarget: process.env.DEPLOY_TARGET || 'local-target',
    environment: process.env.ENVIRONMENT || 'development',
  };
};

/**
 * Updates the request's path and querystring, and parses the query parameters.
 *
 * This function updates the Express request object's originalUrl and query properties.
 * It handles both cases where a querystring is present and where it's not. For Express 5
 * compatibility, it uses Object.defineProperty to update the query object since direct
 * modification is no longer allowed.
 *
 * @param req - Express request object to update
 * @param updatedPath - The new path to set
 * @param updatedQuerystring - The new querystring (optional, if undefined the querystring is removed)
 * @private
 */
const updatePathAndQueryString = (req: Request, updatedPath: string, updatedQuerystring: string | undefined) => {
  let newQuery = {};
  if (updatedQuerystring) {
    newQuery = qs.parse(updatedQuerystring);
    req.originalUrl = `${updatedPath}?${updatedQuerystring}`;
  } else {
    req.originalUrl = updatedPath;
  }
  // Express 5 no longer allows direct modification of the query property
  Object.defineProperty(req, 'query', {
    value: {...newQuery},
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

/**
 * Removes internal MRT headers and API Gateway headers from the request.
 *
 * This function cleans up headers that should not be forwarded to downstream services.
 * It removes API Gateway-specific headers and internal MRT headers. When called from
 * the cleanup middleware, it also removes the X_MOBIFY_REQUEST_PROCESSOR_LOCAL header
 * to indicate that cleanup has been performed.
 *
 * @param req - Express request object to clean up
 * @param cleanupLocalRequestProcessorHeader - If true, removes X_MOBIFY_REQUEST_PROCESSOR_LOCAL header
 * @private
 */
const cleanUpHeaders = (req: Request, cleanupLocalRequestProcessorHeader: boolean = false) => {
  // If the cleanup is happening in the local request processor
  // we don't want to remove the X_MOBIFY_REQUEST_PROCESSOR_LOCAL header
  // because we need to not overwrite it in the cleanup middleware
  if (cleanupLocalRequestProcessorHeader) {
    delete req.headers[X_MOBIFY_REQUEST_PROCESSOR_LOCAL];
  }
  X_HEADERS_TO_REMOVE_ORIGIN.forEach((key) => {
    delete req.headers[key];
  });
};

/**
 * Retrieves and processes the querystring from the x-mobify-querystring header.
 *
 * This function checks for the x-mobify-querystring header and uses it as the
 * definitive querystring if present and non-empty. This header is used in production
 * environments to override the URL querystring, but is also handled in local development
 * to allow for testing. After processing, the header is removed from the request.
 *
 * If the header is present but empty, or if it's not present at all, the original
 * querystring is returned unchanged.
 *
 * @param req - Express request object containing the headers
 * @param originalQuerystring - The original querystring from the URL (may be undefined)
 * @returns The querystring to use (from header if present and non-empty, otherwise original)
 * @private
 */
const getMobifyQueryString = (req: Request, originalQuerystring: string | undefined) => {
  // If there's an x-querystring header, use that as the definitive
  // querystring. This header is used in production, not in local dev,
  // but we always handle it here to allow for testing.
  let updatedQuerystring = originalQuerystring;
  const xQueryString = req.headers[X_MOBIFY_QUERYSTRING];
  if (xQueryString && xQueryString !== '') {
    updatedQuerystring = xQueryString as string;
  }
  delete req.headers[X_MOBIFY_QUERYSTRING];
  return updatedQuerystring;
};

/**
 * Creates a middleware function that processes incoming requests using a custom request processor.
 *
 * This middleware handles:
 * - Skipping processing for proxy and bundle paths
 * - Loading and executing custom request processors
 * - Processing custom query strings from headers
 * - Removing API Gateway headers
 * - Enforcing HTTP method restrictions for root path
 * - Updating request paths and query strings when paths change
 *
 * @param requestProcessorPath - Path to the request processor module file
 * @param proxyConfigs - Array of proxy configurations
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const middleware = createMRTRequestProcessorMiddleware(
 *   '/path/to/processor.js',
 *   [{ host: 'https://api.example.com', path: 'api' }]
 * );
 * app.use(middleware);
 * ```
 */
export const createMRTRequestProcessorMiddleware = (
  requestProcessorPath: string | undefined,
  proxyConfigs: ProxyConfig[] | undefined,
): RequestHandler => {
  const processIncomingRequest = async (req: Request, res: Response) => {
    // If the request is for a proxy or bundle path, do nothing
    if (_isBundleOrProxyPath(req.originalUrl)) {
      return;
    }

    const requestProcessor = await _getRequestProcessor(requestProcessorPath);
    const originalQuerystring = req.originalUrl.split('?')[1];

    // If there's no querystring the value will be undefined
    // but TypeScript will complain if we don't explicitly set it to undefined.
    let updatedQuerystring = originalQuerystring || undefined;
    let updatedPath = req.originalUrl.split('?')[0];

    updatedQuerystring = getMobifyQueryString(req, updatedQuerystring);
    if (requestProcessor) {
      // Allow the processor to handle this request. Because this code
      // runs only in the local development server, we intentionally do
      // not swallow errors - we want them to happen and show up on the
      // console because that's how developers can test the processor.
      const headers = new Headers(req.headers, 'http');

      const {appHostname, deployTarget, environment} = getRequestProcessorParameters();

      const processed = requestProcessor.processRequest({
        headers,
        path: req.path,
        querystring: updatedQuerystring,

        getRequestClass: () => headers.getHeader(X_MOBIFY_REQUEST_CLASS),
        setRequestClass: (value: string) => headers.setHeader(X_MOBIFY_REQUEST_CLASS, value),

        // This matches the set of parameters passed in the
        // Lambda@Edge context.
        parameters: {
          deployTarget,
          appHostname,
          proxyConfigs: proxyConfigs || [],
          environment,
        },
      });

      // Aid debugging by checking the return value
      console.assert(
        processed && 'path' in processed && 'querystring' in processed,
        'Expected processRequest to return an object with ' +
          '"path" and "querystring" properties, ' +
          `but got ${JSON.stringify(processed, null, 2)}`,
      );

      // Update the request.
      updatedQuerystring = processed.querystring;
      updatedPath = processed.path;

      if (headers.modified) {
        req.headers = headers.toObject() as Record<string, string | string[]>;
      }
    }

    // Update the request.
    if (updatedQuerystring !== originalQuerystring) {
      updatePathAndQueryString(req, updatedPath, updatedQuerystring);
    }

    // Get the request class and store it for general use. We
    // must do this AFTER the request-processor, because that's
    // what may set the request class.
    res.locals.requestClass = req.headers[X_MOBIFY_REQUEST_CLASS];
    req.headers[X_MOBIFY_REQUEST_PROCESSOR_LOCAL] = 'true'; // Mark the request as processed by the request processor
  };

  const ssrRequestProcessorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // If the path is /, we enforce that the only methods
    // allowed are GET, HEAD or OPTIONS. This is a restriction
    // imposed by API Gateway: we enforce it here so that the
    // local dev server has the same behaviour.
    if (req.path === '/' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      res.sendStatus(405);
      return;
    }

    // Apply custom query parameter parsing.
    await processIncomingRequest(req, res);

    // Strip out API Gateway headers from the incoming request. We
    // do that now so that the rest of the code don't have to deal
    // with these headers, which can be large and may be accidentally
    // forwarded to other servers.
    cleanUpHeaders(req, false);

    // Hand off to the next middleware
    next();
  };

  return ssrRequestProcessorMiddleware;
};

/**
 * Creates proxy middleware functions for the specified proxy configurations.
 *
 * This function creates Express middleware functions that handle proxying requests
 * to external services. It can optionally create both regular proxy and caching
 * proxy middlewares for each configuration. The app hostname is automatically
 * retrieved from environment variables (EXTERNAL_DOMAIN_NAME or defaults to 'localhost:2401').
 *
 * @param proxyConfigs - Array of proxy configurations
 * @param appProtocol - The protocol to use for the app (defaults to 'http')
 * @param includeCaching - Whether to include caching proxy middlewares (defaults to false)
 * @returns Array of proxy middleware results with their paths
 *
 * @example
 * ```typescript
 * const proxyMiddlewares = createMRTProxyMiddlewares(
 *   [{ host: 'https://api.example.com', path: 'api' }],
 *   'https',
 *   true // Include caching middlewares
 * );
 *
 * proxyMiddlewares.forEach(({ fn, path }) => {
 *   app.use(path, fn);
 * });
 * ```
 */
export const createMRTProxyMiddlewares = (
  proxyConfigs: ProxyConfig[],
  appProtocol: string = 'http',
  includeCaching: boolean = false,
  createProxyFn?: CreateProxyMiddlewareFn,
): ProxyResult[] => {
  if (!proxyConfigs) {
    return [];
  }
  const {appHostname} = getRequestProcessorParameters();
  const proxies: ProxyResult[] = configureProxying(proxyConfigs, appHostname, appProtocol, createProxyFn);
  const middlewares: ProxyResult[] = [];
  proxies.forEach((proxy) => {
    const proxyPath = `${PROXY_PATH_BASE}/${proxy.path}`;
    const cachingProxyPath = `${CACHING_PATH_BASE}/${proxy.path}`;
    middlewares.push({fn: proxy.fn, path: proxyPath});
    if (includeCaching) {
      middlewares.push({fn: proxy.fn, path: cachingProxyPath});
    }
  });
  return middlewares;
};

/**
 * Sets appropriate HTTP headers for local asset files.
 *
 * This function sets content-type, caching, and other headers for static assets
 * served from the local filesystem. It uses the file's modification time for
 * ETag and Last-Modified headers, and sets no-cache directives for local assets.
 *
 * @param res - Express response object
 * @param assetPath - Path to the asset file
 *
 * @example
 * ```typescript
 * app.use('/static', express.static('public', {
 *   setHeaders: setLocalAssetHeaders
 * }));
 * ```
 */
export const setLocalAssetHeaders = (res: Response, assetPath: string) => {
  const base = path.basename(assetPath);
  const contentType = mimeTypes.lookup(base) || 'application/octet-stream';

  res.set(CONTENT_TYPE, contentType);

  // Stat the file and return the last-modified Date
  // in RFC1123 format. Also use that value as the ETag
  // and Last-Modified
  const mtime = fs.statSync(assetPath).mtime;
  const mtimeRFC1123 = mtime.toUTCString();
  res.set('date', mtimeRFC1123);
  res.set('last-modified', mtimeRFC1123);
  res.set('etag', mtime.getTime().toString());

  // We don't cache local bundle assets
  res.set('cache-control', NO_CACHE);
};

/**
 * Creates an Express static middleware configured for MRT asset serving.
 *
 * This function creates a static file serving middleware with MRT-specific
 * configurations including custom header setting and security options.
 *
 * @param staticAssetDir - Directory path containing static assets
 * @returns Express static middleware function
 *
 * @example
 * ```typescript
 * const staticMiddleware = createMRTStaticAssetServingMiddleware('/path/to/assets');
 * app.use('/static', staticMiddleware);
 * ```
 */
export const createMRTStaticAssetServingMiddleware = (staticAssetDir: string): RequestHandler => {
  return express.static(staticAssetDir, {
    dotfiles: 'deny',
    setHeaders: setLocalAssetHeaders,
    fallthrough: true,
  });
};

/**
 * Creates a common middleware function that sets the host header based on environment variables.
 *
 * The host header is set to EXTERNAL_DOMAIN_NAME if available, otherwise defaults to 'localhost:2401'.
 *
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const middleware = createMRTCommonMiddleware();
 * app.use(middleware);
 * ```
 */
export const createMRTCommonMiddleware = (): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.headers.host = process.env.EXTERNAL_DOMAIN_NAME || 'localhost:2401';
    next();
  };
};

/**
 * Creates a cleanup middleware function that removes internal headers and cleans up request state.
 *
 * This middleware performs cleanup operations on requests:
 * - Removes internal MRT headers (X_MOBIFY_REQUEST_PROCESSOR_LOCAL, X_MOBIFY_QUERYSTRING)
 * - Removes API Gateway headers that shouldn't be forwarded
 * - Optionally updates the path and querystring if the request wasn't processed by the request processor
 *
 * This middleware should typically be used at the end of the middleware chain to ensure
 * all internal headers are removed before the request is handled by the application.
 *
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const cleanupMiddleware = createMRTCleanUpMiddleware();
 * app.use(cleanupMiddleware);
 * ```
 */
export const createMRTCleanUpMiddleware = (): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers[X_MOBIFY_REQUEST_PROCESSOR_LOCAL]) {
      const originalQuerystring = req.originalUrl.split('?')[1] || undefined;
      const updatedQuerystring = getMobifyQueryString(req, originalQuerystring);
      const updatedPath = req.originalUrl.split('?')[0];
      updatePathAndQueryString(req, updatedPath, updatedQuerystring);
    }
    cleanUpHeaders(req, true);
    next();
  };
};
