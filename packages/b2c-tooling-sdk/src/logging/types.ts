/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Logging types.
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';

export interface LogContext {
  [key: string]: unknown;
}

/** Writable stream interface for custom log destinations (Node.js Writable compatible) */
export interface LogDestination {
  write(chunk: string | Buffer, encoding?: BufferEncoding, callback?: (error?: Error | null) => void): boolean;
  on?(event: string, listener: (...args: unknown[]) => void): this;
  once?(event: string, listener: (...args: unknown[]) => void): this;
  emit?(event: string, ...args: unknown[]): boolean;
}

export interface LoggerOptions {
  /** Log level. Default: 'info' */
  level?: LogLevel;
  /** File descriptor to write to (1=stdout, 2=stderr). Default: 2 */
  fd?: number;
  /** Custom destination stream. Overrides fd when provided. Useful for testing. */
  destination?: LogDestination;
  /** Base context included in all log entries */
  baseContext?: LogContext;
  /** Enable secret redaction. Default: true */
  redact?: boolean;
  /** Output JSON lines instead of pretty print. Default: false */
  json?: boolean;
  /** Enable colors in pretty print mode. Default: true */
  colorize?: boolean;
}

export interface Logger {
  trace(message: string, context?: LogContext): void;
  trace(context: LogContext, message: string): void;
  debug(message: string, context?: LogContext): void;
  debug(context: LogContext, message: string): void;
  info(message: string, context?: LogContext): void;
  info(context: LogContext, message: string): void;
  warn(message: string, context?: LogContext): void;
  warn(context: LogContext, message: string): void;
  error(message: string, context?: LogContext): void;
  error(context: LogContext, message: string): void;
  fatal(message: string, context?: LogContext): void;
  fatal(context: LogContext, message: string): void;
  child(context: LogContext): Logger;
}
