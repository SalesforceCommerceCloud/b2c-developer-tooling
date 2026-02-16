/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getHostname, getSandboxId, parseJSONOutput, runCLI, runCLIWithRetry, TIMEOUTS, toString} from './test-utils.js';

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
describe('Sandbox Lifecycle E2E Tests', function () {
  // Timeout for entire test suite
  this.timeout(TIMEOUTS.ODS_OPERATION * 2); // 24 minutes for full lifecycle

  // Retry transient failures up to 2 times
  this.retries(2);

  // Test configuration (paths)
  const CARTRIDGES_DIR = path.resolve(__dirname, '../fixtures/cartridges');

  // Test state
  let sandboxId: string;
  let serverHostname: string;

  before(function () {
    // ODS tests always create their own dedicated sandbox
    // to test the full lifecycle (create, stop, start, restart, delete)
    // even when other test suites share a common sandbox
    console.log('\n📝 Sandbox tests will create dedicated sandbox for comprehensive lifecycle testing\n');

    if (!process.env.SFCC_CLIENT_ID || !process.env.SFCC_CLIENT_SECRET || !process.env.TEST_REALM) {
      this.skip();
    }
  });

  describe('Step 1: Create Sandbox', function () {
    it('should create a new sandbox with permissions and wait for readiness', async function () {
      this.timeout(TIMEOUTS.ODS_OPERATION);

      // Retry up to 3 times for transient failures (API timing issues, rate limits, etc.)
      this.retries(3);

      const result = await runCLIWithRetry(
        [
          'sandbox',
          'create',
          '--realm',
          process.env.TEST_REALM!,
          '--ttl',
          '24',
          '--wait',
          '--set-permissions',
          '--json',
        ],
        {timeout: TIMEOUTS.ODS_OPERATION, maxRetries: 2, verbose: true},
      );

      expect(result.exitCode, `Create failed: ${toString(result.stderr)}`).to.equal(0);
      expect(result.stdout, 'Create command should return JSON output').to.not.be.empty;

      const response = parseJSONOutput(result);
      expect(response, 'Create response should be a valid object').to.be.an('object');
      expect(response.id, 'Create response should contain a sandbox ID').to.be.a('string').and.not.be.empty;
      expect(response.hostName, 'Create response should contain a hostname').to.be.a('string').and.not.be.empty;
      expect(response.state, `Sandbox state should be 'started' after --wait, but got '${response.state}'`).to.equal(
        'started',
      );

      // Store for subsequent tests
      sandboxId = getSandboxId(response);
      serverHostname = getHostname(response);

      // Debug output to verify values are set
      console.log(`  ✓ Created sandbox: ${sandboxId} on ${serverHostname}`);
    });
  });

  describe('Step 2: List Sandboxes', function () {
    it('should list sandboxes and verify the created one is present', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLIWithRetry(['sandbox', 'list', '--realm', process.env.TEST_REALM!, '--json'], {
        verbose: true,
      });

      expect(result.exitCode, `List failed: ${toString(result.stderr)}`).to.equal(0);
      expect(result.stdout, 'List command should return JSON output').to.not.be.empty;

      const response = parseJSONOutput(result);
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
      this.timeout(TIMEOUTS.CODE_DEPLOY);
      // Retry for transient network/deployment issues
      this.retries(2);

      // Skip deploy if we don't have a valid sandbox
      if (!sandboxId || !serverHostname) {
        this.skip();
      }

      const result = await runCLIWithRetry(
        [
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
        ],
        {timeout: TIMEOUTS.CODE_DEPLOY, maxRetries: 3, verbose: true},
      );

      expect(result.exitCode, `Deploy failed: ${toString(result.stderr)}`).to.equal(0);
      expect(result.stdout, 'Deploy command should return JSON output').to.not.be.empty;

      const response = parseJSONOutput(result);
      expect(response, 'Deploy response should be a valid object').to.be.an('object');
      expect(response.cartridges, 'Deploy response should contain cartridges array')
        .to.be.an('array')
        .with.length.greaterThan(0);
      expect(response.codeVersion, 'Deploy response should contain code version').to.be.a('string').and.not.be.empty;
    });
  });

  describe('Step 4: Stop Sandbox', function () {
    it('should stop the sandbox', async function () {
      this.timeout(TIMEOUTS.DEFAULT * 2);
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLIWithRetry(['sandbox', 'stop', sandboxId, '--json'], {verbose: true});

      expect(result.exitCode, `Stop failed: ${toString(result.stderr)}`).to.equal(0);

      // Verify state
      const statusResult = await runCLIWithRetry(['sandbox', 'get', sandboxId, '--json']);
      if (statusResult.exitCode === 0) {
        const sandbox = parseJSONOutput(statusResult);
        expect(['stopped', 'stopping'], 'Sandbox should be stopped or stopping').to.include(sandbox.state);
      }
    });
  });

  describe('Step 5: Start Sandbox', function () {
    it('should start the sandbox', async function () {
      this.timeout(TIMEOUTS.DEFAULT * 2);
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLIWithRetry(['sandbox', 'start', sandboxId, '--json'], {verbose: true});

      expect(result.exitCode, `Start failed: ${toString(result.stderr)}`).to.equal(0);

      // Verify state
      const statusResult = await runCLIWithRetry(['sandbox', 'get', sandboxId, '--json']);
      if (statusResult.exitCode === 0) {
        const sandbox = parseJSONOutput(statusResult);
        expect(['started', 'starting'], 'Sandbox should be started or starting').to.include(sandbox.state);
      }
    });
  });

  describe('Step 6: Restart Sandbox', function () {
    it('should restart the sandbox', async function () {
      this.timeout(TIMEOUTS.DEFAULT * 2);
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLIWithRetry(['sandbox', 'restart', sandboxId, '--json'], {verbose: true});

      expect(result.exitCode, `Restart failed: ${toString(result.stderr)}`).to.equal(0);

      // Verify state
      const statusResult = await runCLIWithRetry(['sandbox', 'get', sandboxId, '--json']);
      if (statusResult.exitCode === 0) {
        const sandbox = parseJSONOutput(statusResult);
        expect(
          ['started', 'starting', 'restarting'],
          `Sandbox should be started/starting/restarting, but got '${sandbox.state}'`,
        ).to.include(sandbox.state);
      }
    });
  });

  describe('Step 7: Get Sandbox Status', function () {
    it('should retrieve sandbox status', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLIWithRetry(['sandbox', 'get', sandboxId, '--json'], {verbose: true});

      expect(result.exitCode, `Get failed: ${toString(result.stderr)}`).to.equal(0);
      expect(result.stdout, 'Get command should return JSON output').to.not.be.empty;

      const response = parseJSONOutput(result);
      expect(response, 'Get response should be a valid object').to.be.an('object');
      expect(response.id, `Get response ID '${response.id}' should match requested sandbox '${sandboxId}'`).to.equal(
        sandboxId,
      );
      expect(response.state, 'Get response should contain sandbox state').to.be.a('string').and.not.be.empty;
    });
  });

  describe('Step 8: Sandbox Usage', function () {
    it('should retrieve sandbox usage in JSON format', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLIWithRetry(['sandbox', 'usage', sandboxId, '--json'], {verbose: true});

      expect(result.exitCode, `Usage failed: ${toString(result.stderr)}`).to.equal(0);
      expect(result.stdout, 'Usage command should return JSON output').to.not.be.empty;

      const response = parseJSONOutput(result);
      expect(response, 'Usage response should be a valid object').to.be.an('object');

      // Response can be either a usage model or a wrapper with data property
      const usage: any = 'data' in response ? (response as any).data : response;
      if (usage && typeof usage === 'object') {
        if (usage.sandboxSeconds !== undefined) {
          expect(usage.sandboxSeconds, 'sandboxSeconds should be a number when present').to.be.a('number');
        }
        if (usage.minutesUp !== undefined) {
          expect(usage.minutesUp, 'minutesUp should be a number when present').to.be.a('number');
        }
        if (usage.minutesDown !== undefined) {
          expect(usage.minutesDown, 'minutesDown should be a number when present').to.be.a('number');
        }

        // Some backends may also provide aggregate sandbox counters; validate types when available
        if (usage.activeSandboxes !== undefined) {
          expect(usage.activeSandboxes, 'activeSandboxes should be a number when present').to.be.a('number');
        }
        if (usage.createdSandboxes !== undefined) {
          expect(usage.createdSandboxes, 'createdSandboxes should be a number when present').to.be.a('number');
        }
        if (usage.deletedSandboxes !== undefined) {
          expect(usage.deletedSandboxes, 'deletedSandboxes should be a number when present').to.be.a('number');
        }
      }
    });
  });

  describe('Step 9: Sandbox Aliases', function () {
    let createdAliasId: string | undefined;
    let createdAliasHostname: string | undefined;

    it('should create an alias for the sandbox', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      // Use a short, unique hostname per test run to avoid collisions and
      // stay well under Kubernetes label length limits (63 characters).
      const suffix = Date.now().toString(36);
      const aliasHostname = `e2e-${suffix}.example.com`;

      const createResult = await runCLIWithRetry(['sandbox', 'alias', 'create', sandboxId, aliasHostname, '--json'], {
        verbose: true,
      });

      expect(createResult.exitCode, `Alias create failed: ${toString(createResult.stderr)}`).to.equal(0);

      const createResponse = parseJSONOutput(createResult) as any;
      expect(createResponse, 'Alias create response should be an object').to.be.an('object');
      expect(createResponse).to.have.property('id');
      expect(createResponse).to.have.property('name');

      createdAliasId = createResponse.id as string;
      createdAliasHostname = createResponse.name as string;
    });

    it('should list aliases for the sandbox including the created alias', async function () {
      // Skip if we don't have a valid sandbox ID or no alias was created
      if (!sandboxId || !createdAliasId) {
        this.skip();
      }

      const result = await runCLIWithRetry(['sandbox', 'alias', 'list', sandboxId, '--json'], {verbose: true});

      expect(result.exitCode, `Alias list failed: ${toString(result.stderr)}`).to.equal(0);

      const response = parseJSONOutput(result);
      // sandbox alias list --json returns an array of alias objects (possibly empty)
      expect(response, 'Alias list response should be an array').to.be.an('array');

      if (Array.isArray(response) && response.length > 0) {
        const found = (response as any[]).find(
          (alias) => alias.id === createdAliasId || alias.name === createdAliasHostname,
        );
        expect(found, 'Expected alias list to include the created alias').to.exist;
      }
    });

    it('should delete the created alias for the sandbox', async function () {
      // Skip if we don't have a valid sandbox ID or no alias was created
      if (!sandboxId || !createdAliasId) {
        this.skip();
      }

      const deleteResult = await runCLIWithRetry(
        ['sandbox', 'alias', 'delete', sandboxId, createdAliasId, '--force', '--json'],
        {verbose: true},
      );

      expect(deleteResult.exitCode, `Alias delete failed: ${toString(deleteResult.stderr)}`).to.equal(0);

      const deleteResponse = parseJSONOutput(deleteResult) as any;
      expect(deleteResponse).to.have.property('success', true);
    });
  });

  describe('Step 10: Reset Sandbox', function () {
    it('should trigger a sandbox reset operation in JSON mode', async function () {
      this.timeout(TIMEOUTS.ODS_OPERATION);

      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLIWithRetry(
        ['sandbox', 'reset', sandboxId, '--wait', '--poll-interval', '10', '--timeout', '600', '--force', '--json'],
        {timeout: TIMEOUTS.ODS_OPERATION, verbose: true},
      );

      expect(result.exitCode, `Reset failed: ${toString(result.stderr)}`).to.equal(0);
      expect(result.stdout, 'Reset command should return JSON output').to.not.be.empty;

      const response = parseJSONOutput(result);
      expect(response, 'Reset response should be a valid object').to.be.an('object');
      expect(response).to.have.property('operationState');
      expect(response).to.have.property('sandboxState');
    });
  });

  describe('Step 11: Delete Sandbox', function () {
    it('should delete the sandbox', async function () {
      // Skip if we don't have a valid sandbox ID
      if (!sandboxId) {
        this.skip();
      }

      const result = await runCLIWithRetry(['sandbox', 'delete', sandboxId, '--force', '--json'], {verbose: true});

      expect(result.exitCode, `Delete failed: ${toString(result.stderr)}`).to.equal(0);
      console.log('  ✓ Sandbox deleted successfully');
    });
  });

  describe('Additional Test Cases', function () {
    describe('Error Handling', function () {
      it('should handle invalid realm gracefully', async function () {
        const result = await runCLI(['sandbox', 'list', '--realm', 'invalid-realm-xyz', '--json']);

        // Command should either succeed with empty list or fail with error
        expect(
          result.exitCode,
          `Invalid realm command should either succeed (0) or fail (1), but got ${result.exitCode}`,
        ).to.be.oneOf([0, 1]);
      });

      it('should handle missing sandbox ID gracefully', async function () {
        const result = await runCLI(['sandbox', 'get', 'non-existent-sandbox-id', '--json']);

        expect(
          result.exitCode,
          `Missing sandbox command should fail, but got exit code ${result.exitCode}`,
        ).to.not.equal(0);
        expect(result.stderr, 'Missing sandbox command should return error message').to.not.be.empty;
      });
    });

    describe('Authentication', function () {
      it('should fail with invalid credentials', async function () {
        const result = await runCLI(['sandbox', 'list', '--realm', process.env.TEST_REALM!, '--json'], {
          env: {
            SFCC_CLIENT_ID: 'invalid-client-id',
            SFCC_CLIENT_SECRET: 'invalid-client-secret',
          },
        });

        expect(result.exitCode, `Invalid credentials should fail, but got exit code ${result.exitCode}`).to.not.equal(
          0,
        );
        expect(result.stderr, 'Invalid credentials should return authentication error').to.match(
          /401|unauthorized|invalid.*client/i,
        );
      });
    });

    describe('Realm Management', function () {
      const realmId = process.env.TEST_REALM;

      before(function () {
        if (!realmId) {
          this.skip();
        }
      });

      it('should get realm details', async function () {
        const result = await runCLIWithRetry(['sandbox', 'realm', 'get', realmId!, '--json'], {verbose: true});

        expect(result.exitCode, `Realm get failed: ${toString(result.stderr)}`).to.equal(0);

        const response = parseJSONOutput(result);
        expect(response, 'Realm get response should be a valid object').to.be.an('object');
        expect(response).to.have.property('realm');
      });

      it('should fetch realm usage in JSON format', async function () {
        const result = await runCLIWithRetry(['sandbox', 'realm', 'usage', realmId!, '--json'], {verbose: true});

        expect(result.exitCode, `Realm usage failed: ${toString(result.stderr)}`).to.equal(0);

        const response = parseJSONOutput(result);
        expect(response, 'Realm usage response should be a valid object').to.be.an('object');

        const usage: any = 'data' in response ? (response as any).data : response;
        if (usage && typeof usage === 'object') {
          if (usage.activeSandboxes !== undefined) {
            expect(usage.activeSandboxes, 'activeSandboxes should be a number when present').to.be.a('number');
          }
          if (usage.createdSandboxes !== undefined) {
            expect(usage.createdSandboxes, 'createdSandboxes should be a number when present').to.be.a('number');
          }
          if (usage.deletedSandboxes !== undefined) {
            expect(usage.deletedSandboxes, 'deletedSandboxes should be a number when present').to.be.a('number');
          }
          if (usage.sandboxSeconds !== undefined) {
            expect(usage.sandboxSeconds, 'sandboxSeconds should be a number when present').to.be.a('number');
          }
          if (usage.minutesUp !== undefined) {
            expect(usage.minutesUp, 'minutesUp should be a number when present').to.be.a('number');
          }
          if (usage.minutesDown !== undefined) {
            expect(usage.minutesDown, 'minutesDown should be a number when present').to.be.a('number');
          }
        }
      });

      it('should fail realm update when no flags are provided', async function () {
        const result = await runCLI(['sandbox', 'realm', 'update', realmId!, '--json']);

        expect(result.exitCode, 'Realm update without flags should fail').to.not.equal(0);

        const errorText = String(result.stderr || result.stdout || '');
        expect(errorText).to.match(/No update flags specified/i);
      });
    });
  });

  after(function () {});
});
