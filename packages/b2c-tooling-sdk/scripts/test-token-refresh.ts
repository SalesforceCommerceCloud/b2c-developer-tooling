#!/usr/bin/env npx tsx
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Test script for verifying automatic 401 retry with token refresh.
 *
 * Polls the active code version every 10 seconds to test that long-running
 * operations correctly handle token expiration and refresh.
 *
 * Usage:
 *   # With command line args
 *   npx tsx scripts/test-token-refresh.ts --client-id=YOUR_CLIENT_ID --client-secret=YOUR_SECRET
 *
 *   # With environment variables
 *   SFCC_OAUTH_CLIENT_ID=xxx SFCC_OAUTH_CLIENT_SECRET=yyy npx tsx scripts/test-token-refresh.ts
 *
 *   # With trace logging to see token refresh behavior
 *   SFCC_LOG_LEVEL=trace npx tsx scripts/test-token-refresh.ts --client-id=xxx --client-secret=yyy
 *
 *   # Disable redaction to see full tokens (NOT recommended for shared terminals)
 *   SFCC_LOG_REDACT=false SFCC_LOG_LEVEL=trace npx tsx scripts/test-token-refresh.ts ...
 *
 *   # Implicit flow (client ID only, opens browser)
 *   npx tsx scripts/test-token-refresh.ts --client-id=YOUR_CLIENT_ID
 *
 * The script will run until interrupted (Ctrl+C).
 */

import {resolveConfig} from '../src/config/resolver.js';
import {configureLogger, getLogger} from '../src/logging/logger.js';
import {getActiveCodeVersion} from '../src/operations/code/versions.js';

function parseArgs(): {clientId?: string; clientSecret?: string} {
  const args: {clientId?: string; clientSecret?: string} = {};

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--client-id=')) {
      args.clientId = arg.slice('--client-id='.length);
    } else if (arg.startsWith('--client-secret=')) {
      args.clientSecret = arg.slice('--client-secret='.length);
    }
  }

  return args;
}

const POLL_INTERVAL_MS = 10_000; // 10 seconds

async function main() {
  // Configure logger based on environment
  const logLevel = (process.env.SFCC_LOG_LEVEL as 'trace' | 'debug' | 'info' | 'warn' | 'error') || 'info';
  const redact = process.env.SFCC_LOG_REDACT !== 'false'; // Redaction on by default
  configureLogger({level: logLevel, redact});

  const logger = getLogger();

  logger.info('=== Token Refresh Test Script ===');
  logger.info(`Poll interval: ${POLL_INTERVAL_MS / 1000} seconds`);
  logger.info(`Log level: ${logLevel}`);
  logger.info('Press Ctrl+C to stop\n');

  // Parse command line args
  const args = parseArgs();

  // Resolve config from dw.json / environment, with CLI overrides
  const config = resolveConfig({
    clientId: args.clientId || process.env.SFCC_OAUTH_CLIENT_ID,
    clientSecret: args.clientSecret || process.env.SFCC_OAUTH_CLIENT_SECRET,
  });

  if (!config.hasB2CInstanceConfig()) {
    logger.error('No B2C instance configuration found. Check dw.json or environment variables.');
    process.exit(1);
  }

  const instance = config.createB2CInstance();
  const authMethod = config.values.clientSecret ? 'client-credentials' : 'implicit';
  logger.info({hostname: config.values.hostname, authMethod}, `Connected to: ${config.values.hostname}`);
  logger.info(`Auth method: ${authMethod}${authMethod === 'implicit' ? ' (will open browser on first request)' : ''}`);

  let pollCount = 0;
  const startTime = Date.now();

  const poll = async () => {
    pollCount++;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const elapsedMinutes = Math.floor(elapsed / 60);
    const elapsedSeconds = elapsed % 60;

    try {
      const activeVersion = await getActiveCodeVersion(instance);
      const timestamp = new Date().toISOString();

      logger.info(
        {
          poll: pollCount,
          elapsed: `${elapsedMinutes}m ${elapsedSeconds}s`,
          activeCodeVersion: activeVersion?.id,
        },
        `[${timestamp}] Poll #${pollCount} (${elapsedMinutes}m ${elapsedSeconds}s) - Active code version: ${activeVersion?.id ?? 'none'}`,
      );
    } catch (error) {
      const timestamp = new Date().toISOString();
      logger.error(
        {
          poll: pollCount,
          elapsed: `${elapsedMinutes}m ${elapsedSeconds}s`,
          error: error instanceof Error ? error.message : String(error),
        },
        `[${timestamp}] Poll #${pollCount} FAILED: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  // Initial poll
  await poll();

  // Set up interval
  const intervalId = setInterval(poll, POLL_INTERVAL_MS);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('\nShutting down...');
    clearInterval(intervalId);

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const elapsedMinutes = Math.floor(elapsed / 60);
    const elapsedSeconds = elapsed % 60;

    logger.info(
      {totalPolls: pollCount, totalTime: `${elapsedMinutes}m ${elapsedSeconds}s`},
      `\nCompleted ${pollCount} polls over ${elapsedMinutes}m ${elapsedSeconds}s`,
    );
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
