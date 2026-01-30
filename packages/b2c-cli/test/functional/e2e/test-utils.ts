/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * E2E Test Utilities - Centralized helpers for all E2E tests
 *
 * This module provides standardized utilities for running CLI commands with automatic
 * retry logic, state polling, error handling, and proper timeouts.
 *
 * Key principles:
 * - All CLI commands should use runCLI() or runCLIWithRetry()
 * - Never duplicate runCLI functions in individual test files
 * - Use operation-specific timeouts (TIMEOUTS constants)
 * - Retry transient network errors automatically
 * - Provide verbose logging for CI debugging
 */

import {execa, type ExecaReturnValue} from 'execa';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_BIN = path.resolve(__dirname, '../../../bin/run.js');

/**
 * Standard timeouts for different operation types (in milliseconds)
 * These can be overridden per-operation as needed
 */
export const TIMEOUTS = {
  /** Standard CLI operation (list, get, etc.) */
  DEFAULT: 30_000,
  /** ODS operations (create, start, stop with --wait) */
  ODS_OPERATION: 720_000, // 12 minutes
  /** Job execution with --wait */
  JOB_EXECUTION: 600_000, // 10 minutes
  /** WebDAV upload/download */
  WEBDAV_TRANSFER: 120_000, // 2 minutes
  /** Site import/export */
  SITE_IMPORT: 900_000, // 15 minutes
  /** Code deployment */
  CODE_DEPLOY: 300_000, // 5 minutes
  /** MRT deployment */
  MRT_DEPLOY: 600_000, // 10 minutes
  /** Authentication */
  AUTH: 15_000,
} as const;

/**
 * Network error patterns that should trigger automatic retry
 */
const RETRYABLE_ERROR_PATTERNS = [
  /fetch failed/i,
  /network/i,
  /timeout/i,
  /ETIMEDOUT/i,
  /ECONNREFUSED/i,
  /ECONNRESET/i,
  /ENOTFOUND/i,
  /ECONNABORTED/i,
  /socket hang up/i,
  /rate.?limit/i,
  /too many requests/i,
  /429/,
  /5\d{2}/, // 5xx server errors
  /temporarily unavailable/i,
  /service unavailable/i,
];

/**
 * Special error patterns that need specific handling
 */
const SPECIAL_ERROR_PATTERNS = {
  JOB_ALREADY_RUNNING: /already running|is currently running/i,
  PERMISSIONS: /not\s+allowed|unauthorized|forbidden|401|403/i,
  NOT_FOUND: /not found|404/i,
};

/**
 * Options for CLI command execution
 */
export interface CLIOptions {
  /** Command timeout in milliseconds */
  timeout?: number;
  /** Environment variables */
  env?: Record<string, string>;
  /** Working directory */
  cwd?: string;
}

/**
 * Options for runCLIWithRetry
 */
export interface RetryOptions extends CLIOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Custom retryable error patterns (default: common network errors) */
  retryableErrors?: RegExp[];
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in ms between retries (default: 10000) */
  maxDelay?: number;
  /** Enable verbose logging for debugging (default: false) */
  verbose?: boolean;
}

/**
 * Sleep helper - Promise-based delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Run CLI command with basic execution (no retry)
 * Use this for simple operations that don't need retry logic.
 * For operations that may fail due to network issues, use runCLIWithRetry().
 *
 * @param args CLI arguments
 * @param options Additional options (timeout, env, cwd)
 * @returns Execution result
 *
 * @example
 * ```typescript
 * const result = await runCLI(['sites', 'list', '--server', hostname, '--json']);
 * const result = await runCLI(['ods', 'create', '--realm', 'zzzx'], {timeout: TIMEOUTS.ODS_OPERATION});
 * ```
 */
export async function runCLI(args: string[], options: CLIOptions = {}): Promise<ExecaReturnValue> {
  const {timeout = TIMEOUTS.DEFAULT, env = {}, cwd} = options;

  const result = await execa('node', [CLI_BIN, ...args], {
    env: {
      ...process.env,
      ...env,
      SFCC_LOG_LEVEL: env.SFCC_LOG_LEVEL || process.env.SFCC_LOG_LEVEL || 'silent',
    },
    reject: false,
    timeout,
    cwd,
  });

  return result;
}

/**
 * Run CLI command with automatic retry for transient network errors
 * This is the RECOMMENDED way to run CLI commands in E2E tests.
 *
 * Features:
 * - Automatic retry for network errors (fetch failed, timeouts, etc.)
 * - Exponential backoff between retries
 * - Configurable retry count and delays
 * - Verbose logging for CI debugging
 *
 * @param args CLI arguments
 * @param options Retry configuration and CLI options
 * @returns Execution result
 *
 * @example
 * ```typescript
 * // Standard usage with defaults (3 retries, 1-10s backoff)
 * const result = await runCLIWithRetry(['sites', 'list', '--server', hostname, '--json']);
 *
 * // Custom retry configuration for long operations
 * const result = await runCLIWithRetry(
 *   ['job', 'import', archivePath, '--server', hostname],
 *   {maxRetries: 5, initialDelay: 2000, maxDelay: 15000, verbose: true}
 * );
 *
 * // With custom timeout
 * const result = await runCLIWithRetry(
 *   ['ods', 'create', '--realm', 'zzzx', '--wait'],
 *   {timeout: TIMEOUTS.ODS_OPERATION, verbose: true}
 * );
 * ```
 */
export async function runCLIWithRetry(args: string[], options: RetryOptions = {}): Promise<ExecaReturnValue> {
  const {
    maxRetries = 3,
    retryableErrors = RETRYABLE_ERROR_PATTERNS,
    initialDelay = 1000,
    maxDelay = 10_000,
    verbose = false,
    timeout,
    env,
    cwd,
  } = options;

  let lastResult: ExecaReturnValue | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runCLI(args, {timeout, env, cwd});

    // Success - return immediately
    if (result.exitCode === 0) {
      if (verbose && attempt > 0) {
        console.log(`  ✓ CLI command succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
      }
      return result;
    }

    lastResult = result;

    // Check if error is retryable
    const errorMsg = result.stderr || result.stdout;
    const isRetryable = retryableErrors.some((pattern) => pattern.test(errorMsg));

    // If not retryable or last attempt, return result
    if (!isRetryable || attempt === maxRetries) {
      if (verbose && !isRetryable) {
        console.log(`  ✗ Non-retryable error, not retrying`);
      }
      return result;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(initialDelay * 2 ** attempt, maxDelay);

    if (verbose) {
      console.log(`  ⚠ Retryable error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      console.log(`    Error: ${errorMsg.slice(0, 200)}${errorMsg.length > 200 ? '...' : ''}`);
    }

    // eslint-disable-next-line no-await-in-loop
    await sleep(delay);
  }

  return lastResult!;
}

/**
 * Check if error indicates "job already running" condition
 */
export function isJobAlreadyRunning(result: ExecaReturnValue): boolean {
  const errorMsg = result.stderr || result.stdout;
  return SPECIAL_ERROR_PATTERNS.JOB_ALREADY_RUNNING.test(errorMsg);
}

/**
 * Check if error indicates permissions issue
 */
export function isPermissionsError(result: ExecaReturnValue): boolean {
  const errorMsg = result.stderr || result.stdout;
  return SPECIAL_ERROR_PATTERNS.PERMISSIONS.test(errorMsg);
}

/**
 * Check if error is retryable network error
 */
export function isRetryableError(result: ExecaReturnValue): boolean {
  const errorMsg = result.stderr || result.stdout;
  return RETRYABLE_ERROR_PATTERNS.some((pattern) => pattern.test(errorMsg));
}

/**
 * Enhanced error information extractor
 * @param result CLI execution result
 * @returns Formatted error details
 */
export function getErrorDetails(result: ExecaReturnValue): string {
  const parts: string[] = [];

  parts.push(`Exit code: ${result.exitCode ?? 'unknown'}`);

  if (result.stderr) {
    parts.push(`STDERR: ${result.stderr}`);
  }

  if (result.stdout) {
    parts.push(`STDOUT: ${result.stdout}`);
  }

  if (result.signal) {
    parts.push(`Signal: ${result.signal}`);
  }

  if (result.timedOut) {
    parts.push(`Timed out: ${result.timedOut}`);
  }

  return parts.join('\n');
}

/**
 * Parse JSON output with enhanced error handling
 * @param result CLI execution result
 * @returns Parsed JSON object
 */
export function parseJSONOutput(result: ExecaReturnValue): Record<string, unknown> {
  if (result.exitCode !== 0) {
    throw new Error(`Command failed:\n${getErrorDetails(result)}`);
  }

  if (!result.stdout || result.stdout.trim() === '') {
    throw new Error('Command returned empty output');
  }

  try {
    return JSON.parse(result.stdout) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Failed to parse JSON output:\n${result.stdout.slice(0, 500)}${result.stdout.length > 500 ? '...' : ''}`,
    );
  }
}

/**
 * Get sandbox ID from create or get response
 * @param response Parsed JSON response
 * @returns Sandbox ID
 */
export function getSandboxId(response: Record<string, unknown>): string {
  const id = response.id;
  if (typeof id !== 'string' || !id) {
    throw new Error(`Invalid sandbox response: missing or invalid 'id' field`);
  }
  return id;
}

/**
 * Get hostname from sandbox response
 * @param response Parsed JSON response
 * @returns Hostname
 */
export function getHostname(response: Record<string, unknown>): string {
  const hostname = response.hostName || response.hostname;
  if (typeof hostname !== 'string' || !hostname) {
    throw new Error(`Invalid sandbox response: missing or invalid 'hostName' field`);
  }
  return hostname;
}
