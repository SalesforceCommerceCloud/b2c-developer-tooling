/**
 * Logging types.
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';

export interface LogContext {
  [key: string]: unknown;
}

export interface LoggerOptions {
  /** Log level. Default: 'info' */
  level?: LogLevel;
  /** File descriptor to write to (1=stdout, 2=stderr). Default: 2 */
  fd?: number;
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
