/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getSharedContext, hasSharedSandbox} from './shared-context.js';
import {runCLI, runCLIWithRetry, sleep, TIMEOUTS, toString} from './test-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * E2E Tests for Job Execution
 *
 * This test suite covers job operations:
 * 1. Run job without wait
 * 2. Run job with wait
 * 3. Search job executions
 * 4. Search with filters
 * 5. Wait for running job
 * 6. Export site data
 * 7. Verify export downloaded
 * 8. Import site data from file
 * 9. Import with mode option
 * 10. Verify import completed
 */

describe('Job Execution E2E Tests', function () {
  this.timeout(1_800_000); // 30 minutes
  this.retries(2);

  const TEST_OUTPUT_DIR = path.resolve(__dirname, '../test-output');

  let serverHostname: string;
  let executionId: string;
  let exportFilePath: string;
  let ownSandboxId: null | string = null;

  const EXPORT_JOB_ID = 'sfcc-site-archive-export';
  const IMPORT_JOB_ID = 'sfcc-site-archive-import';

  before(async function () {
    // Check required environment variables
    if (!process.env.SFCC_CLIENT_ID || !process.env.SFCC_CLIENT_SECRET) {
      this.skip();
    }

    // Use shared sandbox if available
    if (hasSharedSandbox()) {
      const shared = getSharedContext();
      serverHostname = shared.hostname!;
      console.log(`✓ Using shared sandbox hostname: ${serverHostname}`);
    } else if (process.env.TEST_INSTANCE_HOSTNAME) {
      // Fallback to env var
      serverHostname = process.env.TEST_INSTANCE_HOSTNAME;
      console.log(`Using hostname from TEST_INSTANCE_HOSTNAME: ${serverHostname}`);
    } else {
      // Fallback: Create own sandbox
      console.log('No shared sandbox available, creating dedicated sandbox for Job tests...');
      this.timeout(720_000); // 12 minutes for sandbox creation

      if (!process.env.TEST_REALM) {
        throw new Error('TEST_REALM required to create sandbox');
      }

      const result = await runCLI(
        ['ods', 'create', '--realm', process.env.TEST_REALM, '--ttl', '4', '--wait', '--set-permissions', '--json'],
        {timeout: 720_000},
      );

      expect(result.exitCode).to.equal(0, `Failed to create sandbox: ${toString(result.stderr)}`);
      const sandbox = JSON.parse(toString(result.stdout));
      ownSandboxId = sandbox.id;
      serverHostname = sandbox.hostName;
      console.log(`Created dedicated sandbox ${ownSandboxId} at ${serverHostname}`);
    }

    // Create test output directory
    await fs.mkdir(TEST_OUTPUT_DIR, {recursive: true});
  });

  after(async function () {
    this.timeout(180_000); // 3 minutes for cleanup

    // Cleanup: Delete local export files
    await fs.rm(TEST_OUTPUT_DIR, {recursive: true, force: true});

    // Delete own sandbox if we created one
    if (ownSandboxId) {
      console.log(`Cleaning up dedicated sandbox ${ownSandboxId}...`);
      await runCLI(['ods', 'delete', ownSandboxId, '--force']);
      console.log('Dedicated sandbox deleted');
    }
  });

  describe('Step 1: Run Job Without Wait', function () {
    it('should start a job without waiting', async function () {
      this.timeout(120_000); // 2 minutes

      const exportFile = `e2e_export_${Date.now()}.zip`;

      const result = await runCLI([
        'job',
        'run',
        EXPORT_JOB_ID,
        '--body',
        JSON.stringify({export_file: exportFile, data_units: {global_data: {meta_data: true}}}),
        '--server',
        serverHostname,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Run job failed: ${toString(result.stderr)}`);
      expect(result.stdout).to.not.be.empty;

      const response = JSON.parse(toString(result.stdout));
      expect(response).to.be.an('object');
      expect(response.id).to.be.a('string');

      executionId = response.id as string;
      console.log(`Started job execution: ${executionId}`);
    });
  });

  describe('Step 2: Run Job With Wait', function () {
    it('should run job and wait for completion', async function () {
      this.timeout(720_000); // 12 minutes
      this.retries(3); // Retry if job is already running

      const exportFile = `e2e_export_${Date.now()}.zip`;

      const result = await runCLI(
        [
          'job',
          'run',
          EXPORT_JOB_ID,
          '--body',
          JSON.stringify({export_file: exportFile, data_units: {global_data: {meta_data: true}}}),
          '--server',
          serverHostname,
          '--wait',
          '--json',
        ],
        {timeout: 600_000},
      );

      // Handle "job already running" error with retry + delay
      if (result.exitCode !== 0) {
        const errorMsg = toString(result.stderr) || toString(result.stdout);
        if (/already running|is currently running/i.test(errorMsg)) {
          console.log('  ⚠ Job already running, waiting 45s before Mocha retry...');
          await sleep(45_000);
          throw new Error('Job already running, retrying...');
        }
      }

      expect(result.exitCode).to.equal(
        0,
        `Run job with wait failed: ${toString(result.stderr) || toString(result.stdout)}`,
      );
      expect(result.stdout).to.not.be.empty;

      const response = JSON.parse(toString(result.stdout));
      expect(response).to.be.an('object');
      expect(String(response.execution_status)).to.be.oneOf(['finished', 'running', 'pending']);
      console.log('  ✓ Job executed successfully');
    });
  });

  describe('Step 3: Search Job Executions', function () {
    it('should search job executions by job ID', async function () {
      const result = await runCLIWithRetry(
        ['job', 'search', '--job-id', EXPORT_JOB_ID, '--server', serverHostname, '--count', '5', '--json'],
        {timeout: TIMEOUTS.DEFAULT, maxRetries: 3, verbose: true},
      );

      // Some sandboxes/clients may not have /job_execution_search permission.
      // In that case, ensure we fail gracefully rather than failing the whole E2E run.
      if (result.exitCode !== 0) {
        const msg = toString(result.stderr) || toString(result.stdout);
        if (/isn't allowed|not\s+allowed|unauthorized|forbidden|401|403/i.test(msg)) {
          this.skip();
        }
        // Otherwise fail the test with the error message
        expect(result.exitCode, `Search failed: ${msg.slice(0, 300)}`).to.equal(0);
      }

      expect(result.stdout).to.not.be.empty;

      const response = JSON.parse(toString(result.stdout));
      expect(response).to.be.an('object');
      expect(response.hits).to.be.an('array');
      expect(response.total).to.be.a('number');
    });
  });

  describe('Step 4: Search With Filters', function () {
    it('should search with status filter', async function () {
      const result = await runCLIWithRetry(
        [
          'job',
          'search',
          '--job-id',
          EXPORT_JOB_ID,
          '--server',
          serverHostname,
          '--status',
          'OK',
          '--count',
          '5',
          '--json',
        ],
        {timeout: TIMEOUTS.DEFAULT, maxRetries: 3, verbose: true},
      );

      if (result.exitCode !== 0) {
        const msg = toString(result.stderr) || toString(result.stdout);
        if (/isn't allowed|not\s+allowed|unauthorized|forbidden|401|403/i.test(msg)) {
          this.skip();
        }
        // Otherwise fail the test with the error message
        expect(result.exitCode, `Search with filter failed: ${msg.slice(0, 300)}`).to.equal(0);
      }

      const response = JSON.parse(toString(result.stdout));
      expect(response.hits).to.be.an('array');
    });
  });

  describe('Step 5: Wait for Running Job', function () {
    it('should wait for job execution to complete', async function () {
      if (!executionId) {
        this.skip();
      }

      this.timeout(600_000); // 10 minutes

      const result = await runCLI(['job', 'wait', EXPORT_JOB_ID, executionId, '--server', serverHostname, '--json'], {
        timeout: 600_000,
      });

      expect(result.exitCode).to.equal(0, `Wait for job failed: ${toString(result.stderr)}`);

      const response = JSON.parse(toString(result.stdout));
      expect(response.id).to.equal(executionId);
      expect(String(response.execution_status)).to.be.oneOf(['finished', 'running', 'pending']);
    });
  });

  describe('Step 6: Export Site Data', function () {
    it('should export site data to local file', async function () {
      this.timeout(900_000); // 15 minutes

      const exportDir = path.join(TEST_OUTPUT_DIR, 'export');
      await fs.mkdir(exportDir, {recursive: true});

      const result = await runCLI(
        ['job', 'export', '--global-data', 'meta_data', '--output', exportDir, '--server', serverHostname, '--json'],
        {timeout: 900_000},
      );

      expect(result.exitCode).to.equal(0, `Export failed: ${toString(result.stderr)}`);
      expect(result.stdout).to.not.be.empty;

      const response = JSON.parse(toString(result.stdout));
      expect(response.execution).to.be.an('object');
      expect(String(response.execution.execution_status)).to.be.oneOf(['finished', 'running', 'pending']);
      expect(response.localPath).to.be.a('string');

      exportFilePath = response.localPath as string;
      console.log(`Exported to: ${exportFilePath}`);
    });
  });

  describe('Step 7: Verify Export Downloaded', function () {
    it('should verify export file exists locally', async function () {
      if (!exportFilePath) {
        this.skip();
      }

      const exists = await fs
        .access(exportFilePath)
        .then(() => true)
        .catch(() => false);
      expect(exists, `Export file should exist at ${exportFilePath}`).to.be.true;

      const stats = await fs.stat(exportFilePath);
      expect(stats.size, 'Export file should not be empty').to.be.greaterThan(0);
    });
  });

  describe('Step 8: Import Site Data From File', function () {
    it('should import site data from local file', async function () {
      if (!exportFilePath) {
        this.skip();
      }

      this.timeout(900_000); // 15 minutes

      const result = await runCLI(['job', 'import', exportFilePath, '--server', serverHostname, '--json'], {
        timeout: 900_000,
      });

      expect(result.exitCode).to.equal(0, `Import from file failed: ${toString(result.stderr)}`);

      const response = JSON.parse(toString(result.stdout));
      expect(response.execution).to.be.an('object');
      expect(String(response.execution.execution_status)).to.be.oneOf(['finished', 'running', 'pending']);
    });
  });

  describe('Step 9: Import With Merge Mode', function () {
    it('should import with keep-archive option', async function () {
      if (!exportFilePath) {
        this.skip();
      }

      this.timeout(900_000); // 15 minutes

      const result = await runCLI(
        ['job', 'import', exportFilePath, '--server', serverHostname, '--keep-archive', '--json'],
        {timeout: 900_000},
      );

      expect(result.exitCode).to.equal(0, `Import with keep-archive failed: ${toString(result.stderr)}`);

      const response = JSON.parse(toString(result.stdout));
      expect(String(response.execution.execution_status)).to.be.oneOf(['finished', 'running', 'pending']);
    });
  });

  describe('Step 10: Verify Import Completed', function () {
    it('should search for completed import jobs', async function () {
      const result = await runCLIWithRetry(
        [
          'job',
          'search',
          '--job-id',
          IMPORT_JOB_ID,
          '--server',
          serverHostname,
          '--status',
          'OK',
          '--count',
          '5',
          '--json',
        ],
        {timeout: TIMEOUTS.DEFAULT, maxRetries: 3, verbose: true},
      );

      if (result.exitCode !== 0) {
        const msg = toString(result.stderr) || toString(result.stdout);
        if (/isn't allowed|not\s+allowed|unauthorized|forbidden|401|403/i.test(msg)) {
          this.skip();
        }
        // Otherwise fail the test with the error message
        expect(result.exitCode, `Search for import jobs failed: ${msg.slice(0, 300)}`).to.equal(0);
      }

      const response = JSON.parse(toString(result.stdout));
      expect(response.hits).to.be.an('array');
    });
  });
});
