/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Timeout for long-running WebDAV operations (10 minutes).
 * Server-side zipping and large downloads can take significant time.
 */
export const LONG_OPERATION_TIMEOUT_MS = 600_000;

/**
 * Timeout for the server-side unzip operation (5 minutes).
 *
 * The unzip is a synchronous WebDAV POST with no server-side job handle, so it is
 * issued exactly ONCE and never retried on a network drop: re-issuing could start a
 * second extraction concurrently with one still running on the backend, racing writes
 * into the same code-version directory. This timeout therefore bounds how long the
 * client waits for the single attempt before surfacing a clear error — it is generous
 * enough for legitimately slow extractions of large archives to complete, while still
 * guaranteeing we don't hang indefinitely on a dead connection.
 */
export const UNZIP_TIMEOUT_MS = 300_000;
