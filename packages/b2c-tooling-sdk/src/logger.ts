/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Logging utilities for B2C CLI tools.
 *
 * This module provides a pluggable logging interface that allows consumers
 * to integrate their own logging implementation.
 *
 * ## Built-in Loggers
 *
 * - {@link noopLogger} - Silent logger (default) - does nothing
 * - {@link consoleLogger} - Logs to console
 *
 * ## Usage
 *
 * ```typescript
 * import { setLogger, getLogger, consoleLogger } from '@salesforce/b2c-tooling-sdk';
 *
 * // Enable console logging
 * setLogger(consoleLogger);
 *
 * // Or use a custom logger
 * setLogger({
 *   debug: (msg, ...args) => myLogger.debug(msg, ...args),
 *   info: (msg, ...args) => myLogger.info(msg, ...args),
 *   warn: (msg, ...args) => myLogger.warn(msg, ...args),
 *   error: (msg, ...args) => myLogger.error(msg, ...args),
 * });
 *
 * // Get the current logger
 * const logger = getLogger();
 * logger.info('Operation completed');
 * ```
 *
 * ## Default Behavior
 *
 * By default, the {@link noopLogger} is used, which silently discards all
 * log messages. This ensures the library doesn't produce unexpected output
 * unless logging is explicitly enabled.
 *
 * @module logger
 */

/**
 * Logger interface for b2c-tooling.
 * Consumers can provide their own logger implementation.
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Default no-op logger - does nothing
 */
export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Console logger - logs to console
 */
export const consoleLogger: Logger = {
  debug: (message, ...args) => console.debug(message, ...args),
  info: (message, ...args) => console.info(message, ...args),
  warn: (message, ...args) => console.warn(message, ...args),
  error: (message, ...args) => console.error(message, ...args),
};

/**
 * Global logger instance - can be replaced by consumers
 */
let globalLogger: Logger = noopLogger;

/**
 * Set the global logger instance
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * Get the current global logger instance
 */
export function getLogger(): Logger {
  return globalLogger;
}
