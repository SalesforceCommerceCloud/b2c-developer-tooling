/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getSharedContext, hasSharedSandbox} from './shared-context.js';
import {runCLI, runCLIWithRetry, TIMEOUTS, toString} from './test-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * E2E Tests for Sites Operations
 */
describe('Sites Operations E2E Tests', function () {
  this.timeout(600_000);
  this.retries(2);

  const SITE_ARCHIVE_PATH = path.resolve(__dirname, '../fixtures/site_archive');
  const SITE_ID = 'TestSite';

  let serverHostname: string;
  let ownSandboxId: null | string = null;

  before(async function () {
    if (!process.env.SFCC_CLIENT_ID || !process.env.SFCC_CLIENT_SECRET) {
      this.skip();
    }

    if (hasSharedSandbox()) {
      serverHostname = getSharedContext().hostname!;
      console.log(`Using shared sandbox hostname: ${serverHostname}`);
    } else if (process.env.TEST_INSTANCE_HOSTNAME) {
      serverHostname = process.env.TEST_INSTANCE_HOSTNAME;
      console.log(`Using hostname from TEST_INSTANCE_HOSTNAME: ${serverHostname}`);
    } else {
      // Fallback: Create own sandbox
      console.log('No shared sandbox available, creating dedicated sandbox for Sites tests...');
      this.timeout(720_000); // 12 minutes for sandbox creation

      if (!process.env.TEST_REALM) {
        throw new Error('TEST_REALM required to create sandbox');
      }

      const result = await runCLIWithRetry(
        ['ods', 'create', '--realm', process.env.TEST_REALM, '--ttl', '24', '--wait', '--set-permissions', '--json'],
        {timeout: TIMEOUTS.ODS_OPERATION, maxRetries: 2, verbose: true},
      );

      expect(
        result.exitCode,
        `Failed to create sandbox: ${toString(result.stderr) || toString(result.stdout)}`,
      ).to.equal(0);
      const sandbox = JSON.parse(toString(result.stdout));
      ownSandboxId = sandbox.id;
      serverHostname = sandbox.hostName;
      console.log(`  ✓ Created dedicated sandbox ${ownSandboxId} at ${serverHostname}`);
    }

    // Import site archive with retry logic for transient network errors
    const importResult = await runCLIWithRetry(['job', 'import', SITE_ARCHIVE_PATH, '--server', serverHostname], {
      maxRetries: 4,
      initialDelay: 2000,
      maxDelay: 8000,
      verbose: true,
    });

    if (importResult.exitCode !== 0) {
      const msg = toString(importResult.stderr) || toString(importResult.stdout);
      // If the sandbox/client lacks permissions, skip suite
      if (/not\s+allowed|unauthorized|forbidden|401|403/i.test(msg)) {
        this.skip();
      }
      // Fail with clear error after retries
      expect(importResult.exitCode, `Import failed after retries: ${msg.slice(0, 500)}`).to.equal(0);
    }
  });

  after(async function () {
    this.timeout(180_000); // 3 minutes for cleanup

    // Delete own sandbox if we created one
    if (ownSandboxId) {
      console.log(`Cleaning up dedicated sandbox ${ownSandboxId}...`);
      await runCLI(['ods', 'delete', ownSandboxId, '--force']);
      console.log('Dedicated sandbox deleted');
    }
  });

  describe('Step 1: List All Sites', function () {
    it('should respond to sites list command', async function () {
      const result = await runCLI(['sites', 'list', '--server', serverHostname, '--json']);

      // sites list may fail if OCAPI is not enabled — accept controlled failure
      expect(result.exitCode).to.be.oneOf([0, 1]);

      if (result.exitCode === 0) {
        const response = JSON.parse(toString(result.stdout));
        expect(response.data).to.be.an('array');
      } else {
        const errorText = toString(result.stderr) || toString(result.stdout);
        expect(errorText).to.not.equal('');
        const error = JSON.parse(errorText);
        expect(error.error).to.exist;
      }
    });
  });

  describe('Step 2: Get Specific Site', function () {
    it('should fail gracefully since sites get is not implemented', async function () {
      const result = await runCLI(['sites', 'get', SITE_ID, '--server', serverHostname]);

      expect(result.exitCode).to.not.equal(0);
      expect(toString(result.stderr) || toString(result.stdout)).to.include('not a b2c command');
    });
  });

  describe('Sequential Multiple Site Imports', function () {
    it('should import multiple archives without conflict', async function () {
      this.timeout(600_000); // 10 minutes for sequential imports

      // Run imports sequentially, not in parallel
      const result1 = await runCLIWithRetry(['job', 'import', SITE_ARCHIVE_PATH, '--server', serverHostname], {
        timeout: 300_000,
        maxRetries: 3,
        verbose: true,
      });
      expect(result1.exitCode, `Import 1 failed: ${toString(result1.stderr) || toString(result1.stdout)}`).to.equal(0);

      const result2 = await runCLIWithRetry(['job', 'import', SITE_ARCHIVE_PATH, '--server', serverHostname], {
        timeout: 300_000,
        maxRetries: 3,
        verbose: true,
      });
      expect(result2.exitCode, `Import 2 failed: ${toString(result2.stderr) || toString(result2.stdout)}`).to.equal(0);
    });
  });
});
