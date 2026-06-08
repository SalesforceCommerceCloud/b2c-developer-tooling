/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Logger using pino with pretty printing by default.
 */

import {Writable} from 'node:stream';
import pino from 'pino';
import pretty from 'pino-pretty';
import type {LogDestination, Logger, LoggerOptions} from './types.js';

const REDACT_FIELDS = [
  'password',
  'client_secret',
  'clientSecret',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'api_key',
  'apiKey',
  'token',
  'secret',
  'authorization',
  'Authorization',
];

const REDACT_PATHS = REDACT_FIELDS.flatMap((field) => [field, `*.${field}`]);

function censor(value: unknown, path: string[]): string {
  // Special handling for authorization headers
  if (path[path.length - 1].toLowerCase() === 'authorization' && typeof value === 'string') {
    const parts = value.split(' ');
    if (parts.length === 2) {
      const [scheme, credentials] = parts;

      // For Basic auth, decode, redact password, and re-encode
      if (scheme.toLowerCase() === 'basic') {
        try {
          const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
          const colonIndex = decoded.indexOf(':');
          if (colonIndex !== -1) {
            const username = decoded.slice(0, colonIndex);
            const redacted = Buffer.from(`${username}:REDACTED`).toString('base64');
            return `Basic ${redacted}`;
          }
        } catch {
          // If decoding fails, fall through to default behavior
        }
      }

      // For other schemes (Bearer, etc.), show scheme and partial token
      return `${scheme} ${credentials.slice(0, 6)}...REDACTED`;
    }
  }
  if (typeof value === 'string' && value.length > 10) {
    return `${value.slice(0, 4)}...REDACTED`;
  }
  return 'REDACTED';
}

/** Wrap a minimal LogDestination in a Node.js Writable so pino-pretty's transport pipeline works. */
function toWritable(dest: LogDestination): Writable {
  if (dest instanceof Writable) return dest;
  return new Writable({
    write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      dest.write(chunk);
      callback();
    },
  });
}

let globalLogger: Logger | null = null;
let globalOptions: LoggerOptions = {level: 'silent'};

function createPinoLogger(options: LoggerOptions): Logger {
  const level = options.level ?? 'info';
  const fd = options.fd ?? 2; // Default to stderr
  const colorize = options.colorize ?? true;

  const pinoOptions: pino.LoggerOptions = {
    level,
    base: options.baseContext ?? {},
    formatters: {
      level: (label) => ({level: label}),
    },
  };

  if (options.redact !== false) {
    pinoOptions.redact = {
      paths: REDACT_PATHS,
      censor,
    };
  }

  // Custom destination stream (for testing)
  if (options.destination) {
    if (options.json) {
      return pino(pinoOptions, options.destination) as unknown as Logger;
    }
    const isVerbose = level === 'debug' || level === 'trace';
    const prettyStream = pretty({
      destination: toWritable(options.destination),
      sync: true,
      colorize,
      ignore: 'pid,hostname' + (isVerbose ? '' : ',time'),
      hideObject: !isVerbose,
    });
    return pino(pinoOptions, prettyStream);
  }

  // JSON output
  if (options.json) {
    return pino(pinoOptions, pino.destination({fd, sync: true})) as unknown as Logger;
  }

  // Pretty print (default)
  const isVerbose = level === 'debug' || level === 'trace';
  const prettyStream = pretty({
    destination: fd,
    sync: true,
    colorize,
    ignore: 'pid,hostname' + (isVerbose ? '' : ',time'),
    hideObject: !isVerbose,
  });

  return pino(pinoOptions, prettyStream);
}

/**
 * Creates a logger instance with the specified options.
 *
 * Merges provided options with any global configuration set via {@link configureLogger}.
 * Options provided here override global settings.
 *
 * @param options - Configuration options for the logger. See {@link LoggerOptions} for details.
 * @returns A configured logger instance
 * @example
 * const logger = createLogger({ level: 'debug', colorize: true });
 * logger.info('Starting application');
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  return createPinoLogger({...globalOptions, ...options});
}

/**
 * Configures global logger defaults for the entire application.
 *
 * Subsequent calls to {@link createLogger} and {@link getLogger} will inherit these settings.
 * This is typically called once at application startup.
 *
 * @param options - Global logger configuration to apply
 * @example
 * configureLogger({ level: 'info', json: true });
 * const logger = getLogger(); // Uses configured defaults
 */
export function configureLogger(options: LoggerOptions): void {
  globalOptions = {...globalOptions, ...options};
  globalLogger = createPinoLogger(globalOptions);
}

/**
 * Retrieves the global logger instance.
 *
 * Returns the same logger instance on repeated calls. If not yet configured,
 * creates one with default settings (silent level).
 * Configure defaults via {@link configureLogger} before first use.
 *
 * @returns The global logger instance
 * @example
 * const logger = getLogger();
 * logger.warn('An issue occurred');
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createPinoLogger(globalOptions);
  }
  return globalLogger;
}

/**
 * Resets the global logger to its initial state.
 *
 * Clears the cached global logger instance and resets global configuration
 * back to default (silent level). This is primarily useful for testing or
 * when reconfiguring logging in a fresh context.
 *
 * @example
 * // Configure logger for one test
 * configureLogger({ level: 'debug' });
 * // Reset for next test
 * resetLogger();
 * const logger = getLogger(); // New logger with silent level
 */
export function resetLogger(): void {
  globalLogger = null;
  globalOptions = {level: 'silent'};
}

/**
 * Creates a logger instance that suppresses all output.
 *
 * Useful for testing or scenarios where logging should be completely disabled.
 *
 * @returns A silent logger instance with no output
 * @example
 * const logger = createSilentLogger();
 * logger.info('This will not print'); // No output produced
 */
export function createSilentLogger(): Logger {
  return createLogger({level: 'silent'});
}
