/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * User-Agent middleware provider for HTTP clients.
 *
 * This module provides a global User-Agent that is applied to all HTTP requests.
 * The SDK sets a default User-Agent, which can be overridden by the CLI to include
 * both CLI and SDK version information.
 *
 * @module clients/user-agent
 */
import {SDK_USER_AGENT} from '../version.js';
import {createUserAgentMiddleware} from './middleware.js';
import {globalMiddlewareRegistry} from './middleware-registry.js';
import type {HttpMiddlewareProvider} from './middleware-registry.js';
import {globalAuthMiddlewareRegistry} from '../auth/middleware.js';
import type {AuthMiddlewareProvider} from '../auth/middleware.js';

// Current User-Agent string - defaults to SDK User-Agent
let currentUserAgent = SDK_USER_AGENT;

/**
 * Sets the User-Agent string for all HTTP requests.
 *
 * Call this early in your application to override the default SDK User-Agent.
 * The CLI uses this to set a combined CLI+SDK User-Agent.
 *
 * @param userAgent - The User-Agent string to use
 *
 * @example
 * ```typescript
 * // CLI usage:
 * setUserAgent('b2c-cli/1.0.0');
 * ```
 */
export function setUserAgent(userAgent: string): void {
  currentUserAgent = userAgent;
}

/**
 * Gets the current User-Agent string.
 *
 * @returns The current User-Agent string
 */
export function getUserAgent(): string {
  return currentUserAgent;
}

/**
 * Resets the User-Agent to the default SDK value.
 *
 * Primarily useful for testing.
 */
export function resetUserAgent(): void {
  currentUserAgent = SDK_USER_AGENT;
}

/**
 * User-Agent middleware provider for HTTP clients.
 *
 * This provider is automatically registered with the global middleware registry
 * when this module is imported.
 */
export const userAgentProvider: HttpMiddlewareProvider = {
  name: 'user-agent',
  getMiddleware() {
    return createUserAgentMiddleware({userAgent: currentUserAgent});
  },
};

/**
 * User-Agent middleware provider for auth requests.
 *
 * This provider is automatically registered with the global auth middleware registry
 * when this module is imported. It ensures OAuth token requests include User-Agent headers.
 */
export const userAgentAuthProvider: AuthMiddlewareProvider = {
  name: 'user-agent',
  getMiddleware() {
    return {
      async onRequest({request}) {
        request.headers.set('User-Agent', currentUserAgent);
        request.headers.set('sfdc_user_agent', currentUserAgent);
        return request;
      },
    };
  },
};

// Auto-register with global middleware registries on module import
globalMiddlewareRegistry.register(userAgentProvider);
globalAuthMiddlewareRegistry.register(userAgentAuthProvider);
