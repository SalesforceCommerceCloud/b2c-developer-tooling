/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {Context} from 'mocha';
import {setSharedContext, clearSharedContext, isSharedSandboxEnabled} from './shared-context.js';
import {runCLIWithRetry, parseJSONOutput, sleep, TIMEOUTS} from './test-utils.js';

/**
 * Mocha Root Hooks - Run once before/after ALL test files
 *
 * These hooks create a shared sandbox when TEST_USE_SHARED_SANDBOX=true,
 * significantly reducing test execution time and sandbox creation costs.
 */

let createdSandboxId: null | string = null;

export const mochaHooks = {
  /**
   * Global setup - runs ONCE before all test files
   */
  async beforeAll(this: Context) {
    // Increase timeout for sandbox creation
    this.timeout(1_500_000); // 15 minutes

    // Shared sandbox mode is enabled by default; set TEST_USE_SHARED_SANDBOX=false to disable
    if (!isSharedSandboxEnabled()) {
      console.log('\nShared sandbox mode disabled. Each test suite will create its own sandbox.');
      console.log('Unset TEST_USE_SHARED_SANDBOX or set it to any value other than "false" to enable shared mode.\n');
      return;
    }

    console.log('\nCreating shared sandbox for all E2E tests...\n');

    // Validate required environment variables
    const requiredEnvVars = ['SFCC_CLIENT_ID', 'SFCC_CLIENT_SECRET', 'TEST_REALM', 'SFCC_SHORTCODE'];
    const missing = requiredEnvVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    const realm = process.env.TEST_REALM!;
    const shortCode = process.env.SFCC_SHORTCODE!;

    try {
      // Create sandbox with long TTL (24 hours to cover all tests) + retry for transient errors
      const result = await runCLIWithRetry(
        ['ods', 'create', '--realm', realm, '--ttl', '24', '--wait', '--set-permissions', '--json'],
        {
          timeout: TIMEOUTS.ODS_OPERATION,
          maxRetries: 3,
          verbose: true,
        },
      );

      if (result.exitCode !== 0) {
        throw new Error(`Failed to create sandbox: ${result.stderr || result.stdout}`);
      }

      const sandbox = parseJSONOutput(result);
      createdSandboxId = sandbox.id;

      // Derive tenant ID from realm + instance
      const tenantId = `${realm}_${sandbox.instance}`;

      // Store in shared context
      setSharedContext({
        sandboxId: sandbox.id,
        hostname: sandbox.hostName,
        tenantId,
        instanceNum: sandbox.instance,
        realm,
        shortCode,
      });

      console.log('Shared sandbox created successfully:');
      console.log(`   Sandbox ID:   ${sandbox.id}`);
      console.log(`   Hostname:     ${sandbox.hostName}`);
      console.log(`   Instance:     ${sandbox.instance}`);
      console.log(`   Tenant ID:    ${tenantId}`);
      console.log(`   Short Code:   ${shortCode}`);
      console.log('\nAll test suites will use this sandbox\n');

      // Wait a bit for sandbox to fully stabilize
      console.log('⏳ Waiting for sandbox services to stabilize...');
      await sleep(30_000); // 30 seconds
      console.log('Sandbox ready for testing\n');
    } catch (error) {
      console.error('Failed to create shared sandbox:', error);
      throw error;
    }
  },

  /**
   * Global teardown - runs ONCE after all test files
   */
  async afterAll(this: Context) {
    // Set timeout for cleanup
    this.timeout(180_000); // 3 minutes

    // Skip if no sandbox was created
    if (!createdSandboxId) {
      return;
    }

    console.log('\n🧹 Cleaning up shared sandbox...\n');

    try {
      const result = await runCLIWithRetry(['ods', 'delete', createdSandboxId, '--force'], {
        timeout: 120_000, // 2 minutes
        maxRetries: 2,
        verbose: true,
      });

      if (result.exitCode === 0) {
        console.log(`Shared sandbox ${createdSandboxId} deleted successfully\n`);
      } else {
        console.warn(`Failed to delete sandbox ${createdSandboxId}: ${result.stderr || result.stdout}`);
        console.warn('You may need to manually delete it via the CLI or UI\n');
      }
    } catch (error) {
      console.error(`Error during sandbox cleanup: ${error}`);
    } finally {
      clearSharedContext();
      createdSandboxId = null;
    }
  },
};
