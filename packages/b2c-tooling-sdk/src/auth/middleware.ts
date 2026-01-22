/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Auth Middleware Registry for B2C SDK.
 *
 * Provides a middleware system specifically for authentication requests (OAuth token requests).
 * This is separate from the HTTP middleware registry because auth requests bypass the
 * standard openapi-fetch client middleware chain.
 *
 * ## SDK Usage
 *
 * ```typescript
 * import { globalAuthMiddlewareRegistry, AuthMiddlewareProvider } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const loggingProvider: AuthMiddlewareProvider = {
 *   name: 'auth-logger',
 *   getMiddleware() {
 *     return {
 *       onRequest({ request }) {
 *         console.log(`[Auth] ${request.method} ${request.url}`);
 *         return request;
 *       },
 *       onResponse({ response }) {
 *         console.log(`[Auth] ${response.status}`);
 *         return response;
 *       },
 *     };
 *   },
 * };
 *
 * globalAuthMiddlewareRegistry.register(loggingProvider);
 * ```
 *
 * ## CLI Plugin Usage
 *
 * Plugins can provide auth middleware via the `b2c:auth-middleware` hook.
 *
 * @module auth/middleware
 */

/**
 * Middleware interface for authentication requests.
 *
 * Similar to openapi-fetch's Middleware interface, but simplified for auth requests.
 */
export interface AuthMiddleware {
  /**
   * Called before the auth request is sent.
   * Can modify the request or return a new one.
   *
   * @param params - Object containing the request
   * @returns Modified request, or void to use original
   */
  onRequest?(params: {request: Request}): Promise<Request | void>;

  /**
   * Called after the auth response is received.
   * Can modify the response or return a new one.
   *
   * @param params - Object containing request and response
   * @returns Modified response, or void to use original
   */
  onResponse?(params: {request: Request; response: Response}): Promise<Response | void>;
}

/**
 * Middleware provider that supplies middleware for auth requests.
 *
 * @example
 * ```typescript
 * const provider: AuthMiddlewareProvider = {
 *   name: 'user-agent',
 *   getMiddleware() {
 *     return {
 *       onRequest({ request }) {
 *         request.headers.set('User-Agent', 'my-app/1.0');
 *         return request;
 *       },
 *     };
 *   },
 * };
 * ```
 */
export interface AuthMiddlewareProvider {
  /**
   * Human-readable name for the provider (used in logging/debugging).
   */
  readonly name: string;

  /**
   * Returns middleware for auth requests.
   *
   * @returns Middleware to apply, or undefined to skip
   */
  getMiddleware(): AuthMiddleware | undefined;
}

/**
 * Registry for auth middleware providers.
 *
 * The registry collects middleware from multiple providers and returns
 * them in registration order when requested during OAuth token requests.
 *
 * ## Usage Modes
 *
 * **SDK Mode**: Register providers directly via `register()`:
 * ```typescript
 * globalAuthMiddlewareRegistry.register(myProvider);
 * ```
 *
 * **CLI Mode**: Providers are collected via the `b2c:auth-middleware` hook
 * and registered during command initialization.
 */
export class AuthMiddlewareRegistry {
  private providers: AuthMiddlewareProvider[] = [];

  /**
   * Registers a middleware provider.
   *
   * Providers are called in registration order when middleware is requested.
   *
   * @param provider - The provider to register
   */
  register(provider: AuthMiddlewareProvider): void {
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
   * Collects middleware from all providers.
   *
   * @returns Array of middleware in registration order
   */
  getMiddleware(): AuthMiddleware[] {
    const middleware: AuthMiddleware[] = [];

    for (const provider of this.providers) {
      const m = provider.getMiddleware();
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
 * Global auth middleware registry instance.
 *
 * This is the default registry used by OAuth strategies. Register
 * middleware providers here to have them applied to token requests.
 *
 * @example
 * ```typescript
 * import { globalAuthMiddlewareRegistry } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * globalAuthMiddlewareRegistry.register({
 *   name: 'user-agent',
 *   getMiddleware() {
 *     return {
 *       onRequest({ request }) {
 *         request.headers.set('User-Agent', 'my-app/1.0');
 *         return request;
 *       },
 *     };
 *   },
 * });
 * ```
 */
export const globalAuthMiddlewareRegistry = new AuthMiddlewareRegistry();

/**
 * Applies auth middleware to a request.
 *
 * This helper applies all registered `onRequest` middleware in order,
 * accumulating modifications to the request.
 *
 * @param request - The original request
 * @param middleware - Array of middleware to apply
 * @returns The modified request
 */
export async function applyAuthRequestMiddleware(request: Request, middleware: AuthMiddleware[]): Promise<Request> {
  let currentRequest = request;

  for (const m of middleware) {
    if (m.onRequest) {
      const result = await m.onRequest({request: currentRequest});
      if (result) {
        currentRequest = result;
      }
    }
  }

  return currentRequest;
}

/**
 * Applies auth middleware to a response.
 *
 * This helper applies all registered `onResponse` middleware in order,
 * accumulating modifications to the response.
 *
 * @param request - The original request (for context)
 * @param response - The response to process
 * @param middleware - Array of middleware to apply
 * @returns The modified response
 */
export async function applyAuthResponseMiddleware(
  request: Request,
  response: Response,
  middleware: AuthMiddleware[],
): Promise<Response> {
  let currentResponse = response;

  for (const m of middleware) {
    if (m.onResponse) {
      const result = await m.onResponse({request, response: currentResponse});
      if (result) {
        currentResponse = result;
      }
    }
  }

  return currentResponse;
}
