/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

const CODE_PREFIX = /^(SCAPI_[A-Z0-9_]+)(?::|$)/;

/**
 * A failure from SCAPI code mode (`runScapiCode`, `createScapiRequest`) with a
 * stable `code` such as `SCAPI_SAFETY_BLOCKED` or `SCAPI_EXECUTION_TIMEOUT`.
 * `message` is unchanged: it starts with the code and carries guidance for the
 * model, so hosts can show it as is and branch on `code`.
 */
export class ScapiCodeError extends Error {
  readonly code: string;
  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ScapiCodeError';
    this.code = code;
  }
}

/** The `SCAPI_*` code at the start of a message, if any. */
export function scapiErrorCode(message: string): string | undefined {
  return CODE_PREFIX.exec(message)?.[1];
}

/** Return `error` as a {@link ScapiCodeError} when its message starts with a `SCAPI_*` code; otherwise unchanged. */
export function toScapiCodeError(error: unknown): unknown {
  if (error instanceof ScapiCodeError || !(error instanceof Error)) return error;
  const code = scapiErrorCode(error.message);
  if (!code) return error;
  const typed = new ScapiCodeError(code, error.message, {cause: error.cause});
  if (error.stack) typed.stack = error.stack;
  return typed;
}
