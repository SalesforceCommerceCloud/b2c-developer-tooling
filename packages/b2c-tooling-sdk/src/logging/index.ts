/**
 * Structured logging module using [pino](https://github.com/pinojs/pino).
 *
 * This module provides a logging interface for library consumers. It does **not**
 * read environment variables directly—that is the responsibility of the CLI layer
 * or the consuming application.
 *
 * ## Basic Usage
 *
 * ```typescript
 * import { createLogger } from '@salesforce/b2c-tooling-sdk/logging';
 *
 * const logger = createLogger({ level: 'debug' });
 * logger.info('Hello world');
 * logger.debug({ file: 'data.json' }, 'Processing file');
 * ```
 *
 * ## Configuration Options
 *
 * | Option | Type | Default | Description |
 * |--------|------|---------|-------------|
 * | `level` | `LogLevel` | `'info'` | Minimum log level |
 * | `fd` | `number` | `2` | File descriptor (1=stdout, 2=stderr) |
 * | `json` | `boolean` | `false` | Output JSON lines instead of pretty print |
 * | `colorize` | `boolean` | `true` | Enable colors in pretty print mode |
 * | `redact` | `boolean` | `true` | Redact sensitive fields |
 * | `baseContext` | `object` | `{}` | Context included in all log entries |
 *
 * ## Output Modes
 *
 * **Pretty print** (default): Human-readable with colors
 * ```
 * [18:31:58] INFO: Hello world
 * ```
 *
 * **JSON lines** (`json: true`): Machine-readable for log aggregation
 * ```json
 * {"level":"info","time":1764113529411,"msg":"Hello world"}
 * ```
 *
 * ## Log Levels
 *
 * From most to least verbose: `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `silent`
 *
 * ## Context and Child Loggers
 *
 * Add structured context to log entries:
 *
 * ```typescript
 * // Inline context
 * logger.info({ operation: 'deploy', file: 'app.zip' }, 'Starting deployment');
 *
 * // Child logger with bound context
 * const deployLogger = logger.child({ operation: 'deploy' });
 * deployLogger.info('Step 1 complete');  // Includes operation: 'deploy'
 * deployLogger.info('Step 2 complete');
 * ```
 *
 * ## Secret Redaction
 *
 * Sensitive fields are automatically redacted:
 *
 * ```typescript
 * logger.info({ username: 'admin', password: 'secret' }, 'Auth attempt');
 * // Output: { username: 'admin', password: '[REDACTED]' }
 * ```
 *
 * Redacted fields: `password`, `secret`, `token`, `client_secret`, `access_token`,
 * `refresh_token`, `api_key`, `authorization`
 *
 * ## Global Logger
 *
 * For CLI applications, use the global logger pattern:
 *
 * ```typescript
 * import { configureLogger, getLogger } from '@salesforce/b2c-tooling-sdk/logging';
 *
 * // Configure once at startup
 * configureLogger({
 *   level: 'debug',
 *   json: process.env.CI === 'true',
 *   colorize: process.stdout.isTTY,
 * });
 *
 * // Get anywhere in your app
 * const logger = getLogger();
 * logger.info('Ready');
 * ```
 *
 * ## Library vs CLI Usage
 *
 * **Library code** should accept a logger as a parameter:
 *
 * ```typescript
 * import type { Logger } from '@salesforce/b2c-tooling-sdk/logging';
 *
 * export function myOperation(options: { logger?: Logger }) {
 *   const log = options.logger ?? console;
 *   log.info('Starting operation');
 * }
 * ```
 *
 * **CLI code** reads environment variables and passes the configured logger:
 *
 * ```typescript
 * const logger = createLogger({
 *   level: process.env.LOG_LEVEL ?? 'info',
 *   json: process.env.LOG_JSON === 'true',
 * });
 * myOperation({ logger });
 * ```
 *
 * @module logging
 */

export type {Logger, LoggerOptions, LogLevel, LogContext} from './types.js';
export {createLogger, configureLogger, getLogger, resetLogger, createSilentLogger} from './logger.js';
