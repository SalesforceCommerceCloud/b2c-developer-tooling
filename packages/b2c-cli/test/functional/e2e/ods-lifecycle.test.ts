/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {execa} from 'execa';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * E2E Tests for ODS (On-Demand Sandbox) Lifecycle
 *
 * This test suite covers the complete lifecycle of an ODS sandbox:
 * 1. Create sandbox with permissions
 * 2. List sandboxes and verify creation
 * 3. Deploy code to sandbox
 * 4. Stop sandbox
 * 5. Start sandbox
 * 6. Restart sandbox
 * 7. Get sandbox status
 * 8. Delete sandbox
 */
describe('ODS Lifecycle E2E Tests', function () {
  // Timeout for entire test suite
  this.timeout(900_000); // 15 minutes

  // Retry transient failures up to 2 times
  this.retries(2);

  // Test configuration (paths)
  const CLI_BIN = path.resolve(__dirname, '../../../bin/run.js');
  const CARTRIDGES_DIR = path.resolve(__dirname, '../fixtures/cartridges');

  // Test state
  let sandboxId: string;
  let serverHostname: string;

  before(function () {
    // ODS tests always create their own dedicated sandbox
    // to test the full lifecycle (create, stop, start, restart, delete)
    // even when other test suites share a common sandbox
    console.log('\n📝 ODS tests will create dedicated sandbox for comprehensive lifecycle testing\n');

    if (!process.env.SFCC_CLIENT_ID || !process.env.SFCC_CLIENT_SECRET || !process.env.TEST_REALM) {
      this.skip();
    }
  });

  /**
   * Helper function to run CLI commands with proper environment.
   * Uses process.env directly to get credentials from GitHub secrets.
   */
  async function runCLI(args: string[]) {
    const result = await execa('node', [CLI_BIN, ...args], {
      env: {
        ...process.env,
        SFCC_LOG_LEVEL: 'silent',
      },
      reject: false,
    });

    return result;
  }

  /**
   * Helper function to get current sandbox state (for verification only)
   */
  async function getSandboxState(sandboxId: string): Promise<null | string> {
    const result = await runCLI(['ods', 'get', sandboxId, '--json']);
    if (result.exitCode === 0) {
      const sandbox = JSON.parse(result.stdout);
      return sandbox.state as null | string;
    }
    return null;
  }

  describe('Step 1: Create Sandbox', function () {
    it('should create a new sandbox with permissions and wait for readiness', async function () {
      this.timeout(720_000); // 12 minutes

      // Retry up to 3 times for transient failures (API timing issues, rate limits, etc.)
      this.retries(3);

      const result = await runCLI([
        'ods',
        'create',
        '--realm',
        process.env.TEST_REALM!,
        '--ttl',
        '24',
        '--wait',
        '--set-permissions',
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Create command failed: ${result.stderr}`);
      expect(result.stdout, 'Create command should return JSON output').to.not.be.empty;

      const response = JSON.parse(result.stdout);
      expect(response, 'Create response should be a valid object').to.be.an('object');
      expect(response.id, 'Create response should contain a sandbox ID').to.be.a('string').and.not.be.empty;
      expect(response.hostName, 'Create response should contain a hostname').to.be.a('string').and.not.be.empty;
      expect(response.state, `Sandbox state should be 'started' after --wait, but got '${response.state}'`).to.equal(
        'started',
      );

      // Store for subsequent tests
      sandboxId = response.id as string;
      serverHostname = response.hostName as string;

      // Debug output to verify values are set
      console.log(`Created sandbox: ${sandboxId} on ${serverHostname}`);
    });
  });

  describe('Step 2: List Sandboxes', function () {
    it('should list sandboxes and verify the created one is present', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLI(['ods', 'list', '--realm', process.env.TEST_REALM!, '--json']);

      expect(result.exitCode).to.equal(0, `List command failed: ${result.stderr}`);
      expect(result.stdout, 'List command should return JSON output').to.not.be.empty;

      const response = JSON.parse(result.stdout);
      expect(response, 'List response should be a valid object').to.be.an('object');
      expect(response.data, 'List response should contain data array').to.be.an('array');

      // Find our sandbox in the list
      const foundSandbox = (response.data as Record<string, unknown>[]).find(
        (sandbox: Record<string, unknown>) => sandbox.id === sandboxId,
      );
      expect(foundSandbox, `Sandbox '${sandboxId}' not found in list.`).to.exist;
      expect(foundSandbox!.id).to.equal(sandboxId);
    });
  });

  describe('Step 3: Deploy Code', function () {
    it('should deploy test cartridge to the sandbox', async function () {
      // Retry for transient network/deployment issues
      this.retries(2);

      // Skip deploy if we don't have a valid sandbox
      if (!sandboxId || !serverHostname) {
        this.skip();
      }

      const result = await runCLI([
        'code',
        'deploy',
        CARTRIDGES_DIR,
        '--cartridge',
        'plugin_example',
        '--server',
        serverHostname,
        '--account-manager-host',
        process.env.SFCC_ACCOUNT_MANAGER_HOST!,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Deploy command failed: ${result.stderr}`);
      expect(result.stdout, 'Deploy command should return JSON output').to.not.be.empty;

      const response = JSON.parse(result.stdout);
      expect(response, 'Deploy response should be a valid object').to.be.an('object');
      expect(response.cartridges, 'Deploy response should contain cartridges array')
        .to.be.an('array')
        .with.length.greaterThan(0);
      expect(response.codeVersion, 'Deploy response should contain code version').to.be.a('string').and.not.be.empty;
    });
  });

  describe('Step 4: Stop Sandbox', function () {
    it('should stop the sandbox', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLI(['ods', 'stop', sandboxId, '--json']);

      expect(result.exitCode).to.equal(0, `Stop command failed: ${result.stderr}`);

      const state = await getSandboxState(sandboxId);
      if (state) {
        expect(
          ['stopped', 'stopping'],
          `Sandbox state should be 'stopped' or 'stopping' after stop command`,
        ).to.include(state);
      }
    });
  });

  describe('Step 5: Start Sandbox', function () {
    it('should start the sandbox', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLI(['ods', 'start', sandboxId, '--json']);

      expect(result.exitCode).to.equal(0, `Start command failed: ${result.stderr}`);
      const state = await getSandboxState(sandboxId);
      if (state) {
        expect(['started', 'starting']).to.include(state);
      }
    });
  });

  describe('Step 6: Restart Sandbox', function () {
    it('should restart the sandbox', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLI(['ods', 'restart', sandboxId, '--json']);

      expect(result.exitCode).to.equal(0, `Restart command failed: ${result.stderr}`);

      const state = await getSandboxState(sandboxId);
      if (state) {
        expect(
          ['started', 'starting', 'restarting'],
          `Sandbox state should be 'started', 'starting', or 'restarting' after restart command, but got '${state}'`,
        ).to.include(state);
      }
    });
  });

  describe('Step 7: Get Sandbox Status', function () {
    it('should retrieve sandbox status', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLI(['ods', 'get', sandboxId, '--json']);

      expect(result.exitCode).to.equal(0, `Get command failed: ${result.stderr}`);
      expect(result.stdout, 'Get command should return JSON output').to.not.be.empty;

      const response = JSON.parse(result.stdout);
      expect(response, 'Get response should be a valid object').to.be.an('object');
      expect(response.id, `Get response ID '${response.id}' should match requested sandbox '${sandboxId}'`).to.equal(
        sandboxId,
      );
      expect(response.state, 'Get response should contain sandbox state').to.be.a('string').and.not.be.empty;
    });
  });

  describe('Step 8: Delete Sandbox', function () {
    it('should delete the sandbox', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLI(['ods', 'delete', sandboxId, '--force', '--json']);

      expect(result.exitCode).to.equal(0, `Delete command failed: ${result.stderr}`);
    });
  });

  describe('Additional Test Cases', function () {
    describe('Error Handling', function () {
      it('should handle invalid realm gracefully', async function () {
        const result = await runCLI(['ods', 'list', '--realm', 'invalid-realm-xyz', '--json']);

        // Command should either succeed with empty list or fail with error
        expect(
          result.exitCode,
          `Invalid realm command should either succeed (0) or fail (1), but got ${result.exitCode}`,
        ).to.be.oneOf([0, 1]);
      });

      it('should handle missing sandbox ID gracefully', async function () {
        const result = await runCLI(['ods', 'get', 'non-existent-sandbox-id', '--json']);

        expect(
          result.exitCode,
          `Missing sandbox command should fail, but got exit code ${result.exitCode}`,
        ).to.not.equal(0);
        expect(result.stderr, 'Missing sandbox command should return error message').to.not.be.empty;
      });
    });

    describe('Authentication', function () {
      it('should fail with invalid credentials', async function () {
        const result = await execa('node', [CLI_BIN, 'ods', 'list', '--realm', process.env.TEST_REALM!, '--json'], {
          env: {
            ...process.env,
            SFCC_CLIENT_ID: 'invalid-client-id',
            SFCC_CLIENT_SECRET: 'invalid-client-secret',
            SFCC_LOG_LEVEL: 'silent',
          },
          reject: false,
        });

        expect(result.exitCode, `Invalid credentials should fail, but got exit code ${result.exitCode}`).to.not.equal(
          0,
        );
        expect(result.stderr, 'Invalid credentials should return authentication error').to.match(
          /401|unauthorized|invalid.*client/i,
        );
      });
    });
  });

  after(function () {});
});
