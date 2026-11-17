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
 * Timeout for one server-side unzip request (60 seconds).
 *
 * Deploy splits code into archives small enough to unzip well within this.
 * When a request takes longer or drops, deploy asks the server again: a 423
 * (Locked) response means the extraction is still running (see `UNZIP_WAIT`
 * in deploy.ts).
 */
export const UNZIP_TIMEOUT_MS = 60_000;
