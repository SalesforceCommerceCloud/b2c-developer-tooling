/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import crypto from 'node:crypto';
import {getSharedContext, hasSharedSandbox} from './shared-context.js';
import {parseJSONOutput, runCLIWithRetry, TIMEOUTS, toString} from './test-utils.js';
import type {Result as ExecaReturnValue} from 'execa';

/**
 * E2E Tests for SLAS (Shopper Login & API Service) Lifecycle
 *
 * Tests SLAS client management:
 * 1. Create SLAS clients (private and public)
 * 2. List SLAS clients
 * 3. Get SLAS client details
 * 4. Update SLAS client
 * 5. Delete SLAS client
 * 6. Negative scenarios (missing scopes, non-existent clients)
 */
describe('SLAS Lifecycle E2E Tests', function () {
  this.timeout(TIMEOUTS.DEFAULT * 20); // 10 minutes
  this.retries(2);

  let clientId: string;
  let publicClientId: string;
  let deletedClientId: string;
  let tenantId: string;
  let shortCode: string;
  let realm: string;
  let odsId: null | string = null; // null if using shared sandbox
  let instanceNum: string;

  const clientName = `e2e-test-${Date.now()}`;

  before(async function () {
    // Check required environment variables
    if (
      !process.env.SFCC_CLIENT_ID ||
      !process.env.SFCC_CLIENT_SECRET ||
      !process.env.SFCC_SHORTCODE ||
      !process.env.TEST_REALM
    ) {
      this.skip();
    }

    shortCode = process.env.SFCC_SHORTCODE!;
    realm = process.env.TEST_REALM!;

    // Check if shared sandbox is available
    if (hasSharedSandbox()) {
      // Use shared sandbox
      const shared = getSharedContext();
      tenantId = shared.tenantId!;
      instanceNum = shared.instanceNum!;
      console.log(`✓ Using shared sandbox (Tenant: ${tenantId})`);
    } else {
      // Create own sandbox
      console.log('No shared sandbox, creating dedicated sandbox for SLAS tests...');
      this.timeout(TIMEOUTS.ODS_OPERATION);

      const odsCreate = await runCLIWithRetry(['ods', 'create', '--realm', realm, '--ttl', '4', '--wait', '--json'], {
        timeout: TIMEOUTS.ODS_OPERATION,
        verbose: true,
      });

      expect(
        odsCreate.exitCode,
        `ODS create failed: ${toString(odsCreate.stderr) || toString(odsCreate.stdout)}`,
      ).to.equal(0);

      const ods = parseJSONOutput(odsCreate);
      odsId = ods.id;
      instanceNum = ods.instance;
      tenantId = `${realm}_${instanceNum}`;

      console.log(`  ✓ Created sandbox ${odsId} (Tenant: ${tenantId})`);
    }
  });

  function expectFailure(result: ExecaReturnValue, options: {messagePatterns?: RegExp[]; status?: number} = {}): void {
    const exitCode = result.exitCode ?? -1;
    expect(exitCode).to.not.equal(0, `Expected command to fail but it succeeded: ${toString(result.stdout)}`);

    const errorText = toString(result.stderr) || toString(result.stdout);
    expect(errorText).to.not.be.empty;

    const parsed = JSON.parse(errorText) as {
      error?: {message?: string; detail?: string; status?: number; code?: string};
    };
    expect(parsed.error, 'Expected JSON error object').to.exist;

    if (typeof options.status === 'number') {
      expect(parsed.error?.status, 'Expected error.status to match').to.equal(options.status);
    }

    if (options.messagePatterns && options.messagePatterns.length > 0) {
      const msg = `${parsed.error?.message ?? ''} ${parsed.error?.detail ?? ''}`;
      for (const pattern of options.messagePatterns) {
        expect(msg).to.match(pattern);
      }
    }
  }

  after(async function () {
    // Cleanup SLAS clients
    if (clientId) {
      await runCLIWithRetry([
        'slas',
        'client',
        'delete',
        clientId,
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--force',
      ]);
    }

    if (publicClientId) {
      await runCLIWithRetry([
        'slas',
        'client',
        'delete',
        publicClientId,
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--force',
      ]);
    }

    // Only delete sandbox if we created it (not using shared)
    if (odsId) {
      console.log(`Cleaning up dedicated sandbox ${odsId}...`);
      await runCLIWithRetry(['ods', 'delete', odsId, '--force']);
    }
  });

  describe('Step 1: Create SLAS Client', function () {
    it('should create a new private SLAS client', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'create',
        '--name',
        clientName,
        '--channels',
        'RefArch',
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--default-scopes',
        '--redirect-uri',
        'http://localhost:3000/callback',
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Create failed: ${toString(result.stderr)}`);
      const response = parseJSONOutput(result);
      clientId = response.clientId;

      expect(clientId).to.be.a('string').and.not.be.empty;
      expect(response.isPrivateClient).to.equal(true);
      expect(response.secret).to.be.a('string'); // Private clients have secrets
      console.log(`✓ Created private client: ${clientId}`);
    });

    it('should create a public client', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'create',
        '--name',
        `${clientName}-public`,
        '--channels',
        'RefArch',
        '--short-code',
        shortCode,
        '--scopes',
        'sfcc.shopper-products',
        '--tenant-id',
        tenantId,
        '--redirect-uri',
        'http://localhost:3000/callback',
        '--public',
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Create public client failed: ${toString(result.stderr)}`);
      const response = parseJSONOutput(result);

      publicClientId = response.clientId;

      expect(publicClientId).to.be.a('string').and.not.be.empty;
      expect(response.isPrivateClient).to.equal(false);
      console.log(`✓ Created public client: ${publicClientId}`);
    });

    it('should fail to create when neither --scopes nor --default-scopes is provided', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'create',
        '--name',
        `${clientName}-missing-scopes`,
        '--channels',
        'RefArch',
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--redirect-uri',
        'http://localhost:3000/callback',
        '--json',
      ]);

      expectFailure(result, {messagePatterns: [/scopes/i]});
    });
  });

  describe('Step 2: List SLAS Clients', function () {
    it('should list clients and find created one', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'list',
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `List failed: ${toString(result.stderr)}`);
      const response = parseJSONOutput(result);

      expect(response.clients).to.be.an('array');
      const found = response.clients.find((c: {clientId: string}) => c.clientId === clientId);
      expect(found, `Client ${clientId} not found in list`).to.exist;
    });
  });

  describe('Step 3: Get SLAS Client Details', function () {
    it('should retrieve client by ID', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'get',
        clientId,
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Get failed: ${toString(result.stderr)}`);
      const response = parseJSONOutput(result);
      expect(response.clientId).to.equal(clientId);
    });

    it('should fail for non-existent client', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'get',
        crypto.randomUUID(),
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--json',
      ]);

      expectFailure(result, {messagePatterns: [/failed\s+to\s+get/i]});
    });
  });

  describe('Step 4: Update SLAS Client', function () {
    it('should update client name', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'update',
        clientId,
        '--name',
        `${clientName}-updated`,
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Update failed: ${toString(result.stderr)}`);
      const response = parseJSONOutput(result);
      expect(response.name).to.equal(`${clientName}-updated`);
    });
  });

  describe('Step 5: Delete SLAS Client', function () {
    it('should delete client', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'delete',
        clientId,
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Delete failed: ${toString(result.stderr)}`);

      deletedClientId = clientId;
      clientId = '';
    });
  });

  describe('Step 6: Verify Client Deleted', function () {
    it('should not appear in list', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'list',
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0);
      const response = parseJSONOutput(result);
      const found = response.clients.find((c: {clientId: string}) => c.clientId === deletedClientId);
      expect(found, `Deleted client ${deletedClientId} should not exist`).to.not.exist;
    });

    it('should fail to get deleted client', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'get',
        deletedClientId,
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--json',
      ]);

      expectFailure(result, {messagePatterns: [/failed\s+to\s+get/i]});
    });

    it('should fail to update deleted client', async function () {
      const result = await runCLIWithRetry([
        'slas',
        'client',
        'update',
        deletedClientId,
        '--name',
        'should-fail',
        '--short-code',
        shortCode,
        '--tenant-id',
        tenantId,
        '--json',
      ]);

      expectFailure(result, {messagePatterns: [/failed\s+to\s+fetch/i]});
    });
  });
});
