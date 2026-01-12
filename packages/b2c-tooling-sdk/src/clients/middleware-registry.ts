/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * HTTP Middleware Registry for B2C SDK.
 *
 * Provides a unified middleware system that works across all HTTP clients,
 * including openapi-fetch clients (OCAPI, SLAS, etc.) and the WebDAV client.
 *
 * ## SDK Usage
 *
 * ```typescript
 * import { globalMiddlewareRegistry, HttpMiddlewareProvider } from '@salesforce/b2c-tooling-sdk/clients';
 *
 * const loggingProvider: HttpMiddlewareProvider = {
 *   name: 'my-logger',
 *   getMiddleware(clientType) {
 *     return {
 *       onRequest({ request }) {
 *         console.log(`[${clientType}] ${request.method} ${request.url}`);
 *         return request;
 *       },
 *       onResponse({ response }) {
 *         console.log(`[${clientType}] ${response.status}`);
 *         return response;
 *       },
 *     };
 *   },
 * };
 *
 * globalMiddlewareRegistry.register(loggingProvider);
 * ```
 *
 * ## CLI Plugin Usage
 *
 * Plugins can provide middleware via the `b2c:http-middleware` hook.
 *
 * @module clients/middleware-registry
 */
import type {Middleware} from 'openapi-fetch';

/**
 * Types of HTTP clients that can receive middleware.
 */
export type HttpClientType = 'ocapi' | 'slas' | 'ods' | 'mrt' | 'custom-apis' | 'webdav';

/**
 * Middleware interface compatible with openapi-fetch.
 *
 * This is the same interface as openapi-fetch's Middleware, re-exported
 * for convenience. It can be used for both openapi-fetch clients and
 * the WebDAV client (which adapts it internally).
 *
 * @example
 * ```typescript
 * const middleware: UnifiedMiddleware = {
 *   async onRequest({ request }) {
 *     request.headers.set('X-Custom-Header', 'value');
 *     return request;
 *   },
 *   async onResponse({ response }) {
 *     // Inspect or modify response
 *     return response;
 *   },
 * };
 * ```
 */
export type UnifiedMiddleware = Middleware;

/**
 * Middleware provider that supplies middleware for HTTP clients.
 *
 * Providers can return different middleware for different client types,
 * or return `undefined` to skip certain client types.
 *
 * @example
 * ```typescript
 * const provider: HttpMiddlewareProvider = {
 *   name: 'metrics-collector',
 *   getMiddleware(clientType) {
 *     // Only collect metrics for OCAPI calls
 *     if (clientType !== 'ocapi') return undefined;
 *
 *     return {
 *       onRequest({ request }) {
 *         (request as any)._startTime = Date.now();
 *         return request;
 *       },
 *       onResponse({ request, response }) {
 *         const duration = Date.now() - (request as any)._startTime;
 *         recordMetric('ocapi_request_duration', duration);
 *         return response;
 *       },
 *     };
 *   },
 * };
 * ```
 */
export interface HttpMiddlewareProvider {
  /**
   * Human-readable name for the provider (used in logging/debugging).
   */
  readonly name: string;

  /**
   * Returns middleware for a specific client type.
   *
   * @param clientType - The type of HTTP client requesting middleware
   * @returns Middleware to apply, or undefined to skip this client type
   */
  getMiddleware(clientType: HttpClientType): UnifiedMiddleware | undefined;
}

/**
 * Registry for HTTP middleware providers.
 *
 * The registry collects middleware from multiple providers and returns
 * them in registration order when requested by client factories.
 *
 * ## Usage Modes
 *
 * **SDK Mode**: Register providers directly via `register()`:
 * ```typescript
 * globalMiddlewareRegistry.register(myProvider);
 * ```
 *
 * **CLI Mode**: Providers are collected via the `b2c:http-middleware` hook
 * and registered during command initialization.
 */
export class MiddlewareRegistry {
  private providers: HttpMiddlewareProvider[] = [];

  /**
   * Registers a middleware provider.
   *
   * Providers are called in registration order when middleware is requested.
   *
   * @param provider - The provider to register
   */
  register(provider: HttpMiddlewareProvider): void {
    this.providers.push(provider);
  }

  /**
   * Unregisters a middleware provider by name.
   *
   * @param name - The name of the provider to remove
   * @returns true if a provider was removed, false if not found
   */
  unregister(name: string): boolean {
    const index = this.providers.findIndex((p) => p.name === name);
    if (index >= 0) {
      this.providers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Collects middleware from all providers for a specific client type.
   *
   * @param clientType - The type of client requesting middleware
   * @returns Array of middleware in registration order
   */
  getMiddleware(clientType: HttpClientType): UnifiedMiddleware[] {
    const middleware: UnifiedMiddleware[] = [];

    for (const provider of this.providers) {
      const m = provider.getMiddleware(clientType);
      if (m) {
        middleware.push(m);
      }
    }

    return middleware;
  }

  /**
   * Clears all registered providers.
   *
   * Primarily useful for testing.
   */
  clear(): void {
    this.providers = [];
  }

  /**
   * Returns the number of registered providers.
   */
  get size(): number {
    return this.providers.length;
  }

  /**
   * Returns the names of all registered providers.
   */
  getProviderNames(): string[] {
    return this.providers.map((p) => p.name);
  }
}

/**
 * Global middleware registry instance.
 *
 * This is the default registry used by all B2C SDK clients. Register
 * middleware providers here to have them applied automatically.
 *
 * @example
 * ```typescript
 * import { globalMiddlewareRegistry } from '@salesforce/b2c-tooling-sdk/clients';
 *
 * globalMiddlewareRegistry.register({
 *   name: 'request-logger',
 *   getMiddleware() {
 *     return {
 *       onRequest({ request }) {
 *         console.log(`Request: ${request.method} ${request.url}`);
 *         return request;
 *       },
 *     };
 *   },
 * });
 * ```
 */
export const globalMiddlewareRegistry = new MiddlewareRegistry();
