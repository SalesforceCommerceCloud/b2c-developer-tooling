/**
 * Logger using pino with JSON lines output.
 */

import pino from 'pino';
import type {Logger, LoggerOptions} from './types.js';
import {getRedactPaths, isRedactionDisabled} from './redaction.js';

let globalLogger: Logger | null = null;
let globalOptions: LoggerOptions = {level: 'info'};

function createPinoLogger(options: LoggerOptions): Logger {
  const level = options.level ?? 'info';
  const dest = options.destination ?? process.stderr;

  const pinoOptions: pino.LoggerOptions = {
    level,
    base: options.baseContext ?? {},
  };

  if (options.redact !== false && !isRedactionDisabled()) {
    pinoOptions.redact = {
      paths: getRedactPaths(),
      censor: '[REDACTED]',
    };
  }

  return pino(pinoOptions, pino.destination({dest, sync: true})) as unknown as Logger;
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
