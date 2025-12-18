/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Logger using pino with pretty printing by default.
 */

import pino from 'pino';
import pretty from 'pino-pretty';
import type {Logger, LoggerOptions} from './types.js';

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

export function createLogger(options: LoggerOptions = {}): Logger {
  return createPinoLogger({...globalOptions, ...options});
}

export function configureLogger(options: LoggerOptions): void {
  globalOptions = {...globalOptions, ...options};
  globalLogger = createPinoLogger(globalOptions);
}

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createPinoLogger(globalOptions);
  }
  return globalLogger;
}

export function resetLogger(): void {
  globalLogger = null;
  globalOptions = {level: 'silent'};
}

export function createSilentLogger(): Logger {
  return createLogger({level: 'silent'});
}
