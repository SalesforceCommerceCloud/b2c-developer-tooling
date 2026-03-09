/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Determines if the application is running in a local development environment.
 *
 * This function checks for the presence of the AWS_LAMBDA_FUNCTION_NAME environment
 * variable to determine if the code is running in AWS Lambda (production) or
 * locally (development).
 *
 * @returns True if running locally, false if running in AWS Lambda
 *
 * @example
 * ```typescript
 * if (isLocal()) {
 *   console.log('Running in development mode');
 * } else {
 *   console.log('Running in production (AWS Lambda)');
 * }
 * ```
 */
export const isLocal = (): boolean => {
  return !Object.prototype.hasOwnProperty.call(process.env, 'AWS_LAMBDA_FUNCTION_NAME');
};

/**
 * Log an internal MRT error.
 *
 * @param namespace Namespace for the error (e.g. data_store, redirect) to facilitate searching
 * @param err Error to log
 * @param context Optional context to include in the log
 */
export const logMRTError = (namespace: string, err: unknown, context?: Record<string, unknown>) => {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error(
    JSON.stringify({
      [`__MRT__${namespace}`]: 'error',
      type: 'MRT_internal',
      error: error.message,
      stack: error.stack,
      ...context,
    }),
  );
};
