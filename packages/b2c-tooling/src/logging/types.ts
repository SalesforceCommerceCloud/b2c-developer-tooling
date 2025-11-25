/**
 * Logging types.
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';

export interface LogContext {
  [key: string]: unknown;
}

export interface LoggerOptions {
  level?: LogLevel;
  destination?: NodeJS.WritableStream;
  baseContext?: LogContext;
  redact?: boolean;
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
