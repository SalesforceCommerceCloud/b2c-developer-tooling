/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * @fileoverview Proxy configuration utilities for MRT middleware.
 *
 * This module provides functions for configuring HTTP proxy middleware,
 * including request/response header rewriting and proxy setup for external services.
 * It's designed to work with http-proxy-middleware and integrates with the SSR proxying utilities.
 *
 * @author Salesforce Commerce Cloud
 * @version 0.0.1
 */

import type {IncomingMessage, ServerResponse, ClientRequest, IncomingHttpHeaders} from 'http';
import {rewriteProxyRequestHeaders, rewriteProxyResponseHeaders, type HTTPHeaders} from './ssr-proxying.js';
import {createProxyMiddleware, type Options, type RequestHandler} from 'http-proxy-middleware';

/**
 * Parameters for applyProxyRequestHeaders function
 */
interface ApplyProxyRequestHeadersParams {
  /** The proxy request object from http-proxy-middleware */
  proxyRequest: ClientRequest;
  /** The incoming request object */
  incomingRequest: IncomingMessage;
  /** Whether this is a caching proxy */
  caching?: boolean;
  /** The proxy path being used */
  proxyPath: string;
  /** The target host to proxy to */
  targetHost: string;
  /** The protocol to use for the target */
  targetProtocol: string;
  /** @internal Test hook: override rewrite function */
  rewriteRequestHeaders?: (
    opts: Parameters<typeof rewriteProxyRequestHeaders>[0],
  ) => ReturnType<typeof rewriteProxyRequestHeaders>;
}

/**
 * Parameters for configureProxy function
 */
interface ConfigureProxyParams {
  /** The hostname where the Express app is running */
  appHostname: string;
  /** The proxy path pattern */
  proxyPath: string;
  /** The protocol to use for the target */
  targetProtocol: string;
  /** The target host to proxy to */
  targetHost: string;
  /** The protocol to use for the app (defaults to https) */
  appProtocol?: string;
  /** Whether this is a caching proxy */
  caching?: boolean;
}

/**
 * Optional test hook: provide a custom createProxyMiddleware implementation.
 * @internal
 */
export type CreateProxyMiddlewareFn = (config: Options<IncomingMessage, ServerResponse>) => RequestHandler;

/**
 * Configuration object for a proxy
 */
export interface ProxyConfig {
  /** The target host URL */
  host: string;
  /** The proxy path pattern */
  path: string;
}

/**
 * Return type for configureProxy function
 */
export interface ProxyResult {
  /** The proxy middleware function */
  fn: RequestHandler;
  /** The proxy path pattern */
  path: string;
}

const stripProxyPathRE = /^\/mobify\/(proxy|caching)\/([^/]+)/;

/**
 * Applies proxy request headers by rewriting and copying headers from the incoming request
 * to the proxy request using the SSR proxying utilities.
 *
 * This function handles header transformation, addition, and removal for proxy requests,
 * ensuring that the proxied request has the correct headers for the target service.
 *
 * @param params - Parameters for applying proxy request headers
 * @param params.proxyRequest - The proxy request object from http-proxy-middleware
 * @param params.incomingRequest - The incoming request object
 * @param params.caching - Whether this is a caching proxy (defaults to false)
 * @param params.proxyPath - The proxy path being used
 * @param params.targetHost - The target host to proxy to
 * @param params.targetProtocol - The protocol to use for the target
 *
 * @example
 * ```typescript
 * applyProxyRequestHeaders({
 *   proxyRequest: clientRequest,
 *   incomingRequest: incomingMessage,
 *   caching: false,
 *   proxyPath: 'api',
 *   targetHost: 'api.example.com',
 *   targetProtocol: 'https'
 * });
 * ```
 */
export const applyProxyRequestHeaders = ({
  proxyRequest,
  incomingRequest,
  caching = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  proxyPath,
  targetHost,
  targetProtocol,
  rewriteRequestHeaders: rewriteFn,
}: ApplyProxyRequestHeadersParams): void => {
  const headers = incomingRequest.headers;

  const rewrite = rewriteFn ?? rewriteProxyRequestHeaders;
  const newHeaders = rewrite({
    caching,
    headers: headers as HTTPHeaders,
    headerFormat: 'http',
    targetHost,
    targetProtocol,
  });

  // Copy any new and updated headers to the proxyRequest
  // using setHeader.
  Object.entries(newHeaders).forEach(
    // setHeader always replaces any current value.
    ([key, value]) => proxyRequest.setHeader(key, value as string | number | readonly string[]),
  );

  // Handle deletion of headers.
  // Iterate over the keys of incomingRequest.headers - for every
  // key, if the value is not present in newHeaders, we remove
  // that value from proxyRequest's headers.
  Object.keys(headers).forEach((key) => {
    // We delete the header on any falsy value, since
    // there's no use case where we supply an empty header
    // value.
    if (!newHeaders[key]) {
      proxyRequest.removeHeader(key);
    }
  });
};

/**
 * Configures a single proxy middleware with the specified parameters.
 *
 * This function creates a complete proxy configuration including request/response
 * header rewriting, error handling, and cookie domain rewriting. The configuration
 * is designed to match CloudFront behavior for consistency between local development
 * and production environments.
 *
 * @param params - Configuration parameters for the proxy
 * @param params.appHostname - The hostname where the Express app is running
 * @param params.proxyPath - The proxy path pattern
 * @param params.targetProtocol - The protocol to use for the target
 * @param params.targetHost - The target host to proxy to
 * @param params.appProtocol - The protocol to use for the app (defaults to 'https')
 * @param params.caching - Whether this is a caching proxy
 * @returns Proxy result containing the middleware function and path
 *
 * @example
 * ```typescript
 * const proxy = configureProxy({
 *   appHostname: 'localhost:3000',
 *   proxyPath: 'api',
 *   targetProtocol: 'https',
 *   targetHost: 'api.example.com',
 *   appProtocol: 'https',
 *   caching: false
 * });
 *
 * app.use(`/mobify/proxy/${proxy.path}`, proxy.fn);
 * ```
 */
export const configureProxy = (
  {
    appHostname,
    proxyPath,
    targetProtocol,
    targetHost,
    appProtocol = /* istanbul ignore next */ 'https',
    caching,
  }: ConfigureProxyParams,
  createProxyFn?: CreateProxyMiddlewareFn,
): ProxyResult => {
  const createProxy = createProxyFn ?? createProxyMiddleware;
  // This configuration must match the behaviour of the proxying
  // in CloudFront.
  const targetOrigin = `${targetProtocol}://${targetHost}`;
  const config = {
    // The name of the changeOrigin option is misleading - it configures
    // the proxying code in http-proxy to rewrite the Host header (not
    // any Origin header) of the outgoing request. The Host header is
    // also fixed up in rewriteProxyRequestHeaders, but that
    // doesn't work correctly with http-proxy, because the https
    // connection to the target is made *before* the request headers
    // are modified by the onProxyReq event handler. So we set this
    // flag true to get correct behaviour.
    changeOrigin: true,

    // Rewrite the domain in set-cookie headers in responses, if it
    // matches the targetHost.
    cookieDomainRewrite: {
      targetHost: appHostname,
    },

    // We don't do cookie *path* rewriting - it's complex.
    cookiePathRewrite: false,

    // Neither CloudFront nor the local Express app will follow redirect
    // responses to proxy requests. The responses are returned to the
    // client.
    followRedirects: false,

    onError: (err: Error, req: IncomingMessage, res: ServerResponse) => {
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end(`Error in proxy request to ${req.url}: ${err}`);
    },

    onProxyReq: (proxyRequest: ClientRequest, incomingRequest: IncomingMessage) => {
      applyProxyRequestHeaders({
        proxyRequest,
        incomingRequest,
        caching,
        proxyPath,
        targetHost,
        targetProtocol,
      });
    },

    onProxyRes: (proxyResponse: IncomingMessage, req: IncomingMessage) => {
      const requestUrl = req.url?.replace(stripProxyPathRE, '');

      // Rewrite key headers
      proxyResponse.headers = rewriteProxyResponseHeaders({
        appHostname,
        caching: !!caching,
        targetHost,
        targetProtocol,
        appProtocol,
        proxyPath,
        statusCode: proxyResponse.statusCode,
        headers: proxyResponse.headers,
        headerFormat: 'http',
        requestUrl,
      }) as IncomingHttpHeaders;
    },

    // The origin (protocol + host) to which we proxy
    target: targetOrigin,
  };

  const proxyFunc = createProxy(config as Options<IncomingMessage, ServerResponse>);
  return {fn: proxyFunc, path: proxyPath};
};

/**
 * Configures multiple proxy middlewares from an array of proxy configurations.
 *
 * This function processes an array of proxy configurations and creates corresponding
 * proxy middleware functions for each one. It automatically determines the target
 * protocol from the host URL and creates non-caching proxies by default.
 *
 * @param proxyConfigs - Array of proxy configurations
 * @param appHostname - The hostname where the Express app is running
 * @param appProtocol - The protocol to use for the app (defaults to 'https')
 * @returns Array of proxy results containing middleware functions and paths
 *
 * @example
 * ```typescript
 * const proxyConfigs = [
 *   { host: 'https://api.example.com', path: 'api' },
 *   { host: 'http://internal.service.com', path: 'internal' }
 * ];
 *
 * const proxies = configureProxying(proxyConfigs, 'localhost:3000', 'https');
 *
 * proxies.forEach(({ fn, path }) => {
 *   app.use(`/mobify/proxy/${path}`, fn);
 * });
 * ```
 */
export const configureProxying = (
  proxyConfigs: ProxyConfig[],
  appHostname: string,
  appProtocol: string = 'https',
  createProxyFn?: CreateProxyMiddlewareFn,
): ProxyResult[] => {
  const proxies: ProxyResult[] = [];
  proxyConfigs.forEach((config) => {
    const targetProtocol = config.host.startsWith('https://') ? 'https' : 'http';
    const targetHost = config.host.replace(`${targetProtocol}://`, '');
    const proxy = configureProxy(
      {
        proxyPath: config.path,
        targetProtocol,
        targetHost,
        appProtocol,
        appHostname,
        caching: false,
      },
      createProxyFn,
    );
    proxies.push(proxy);
  });
  return proxies;
};
