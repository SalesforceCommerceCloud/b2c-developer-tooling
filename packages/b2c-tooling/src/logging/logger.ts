/**
 * Logger using pino with pretty printing by default.
 */

import pino from 'pino';
import pretty from 'pino-pretty';
import type {Logger, LoggerOptions} from './types.js';
import {getRedactPaths} from './redaction.js';

let globalLogger: Logger | null = null;
let globalOptions: LoggerOptions = {level: 'info'};

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
      paths: getRedactPaths(),
      censor: '[REDACTED]',
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
    ignore: 'pid,hostname',
    hideObject: !isVerbose,
  });

  return pino(pinoOptions, prettyStream) as unknown as Logger;
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
  globalOptions = {level: 'info'};
}

export function createSilentLogger(): Logger {
  return createLogger({level: 'silent'});
}
