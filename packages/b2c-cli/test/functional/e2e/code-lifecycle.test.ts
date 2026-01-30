/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {execa} from 'execa';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getSharedContext, hasSharedSandbox} from './shared-context.js';
import {getSandboxId, getHostname, parseJSONOutput, runCLIWithRetry, TIMEOUTS, toString} from './test-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Code Lifecycle E2E Tests', function () {
  this.timeout(TIMEOUTS.CODE_DEPLOY * 3); // 15 minutes
  this.retries(2);

  const CLI_BIN = path.resolve(__dirname, '../../../bin/run.js');
  const CARTRIDGES_DIR = path.resolve(__dirname, '../fixtures/cartridges');

  let serverHostname: string;
  let codeVersionA: string;
  let codeVersionB: string;
  let watchProcess: any;
  let ownSandboxId: null | string = null;

  before(async function () {
    if (!process.env.SFCC_CLIENT_ID || !process.env.SFCC_CLIENT_SECRET) {
      this.skip();
    }

    if (hasSharedSandbox()) {
      const shared = getSharedContext();
      serverHostname = shared.hostname!;
      console.log(`Using shared sandbox hostname: ${serverHostname}`);
    } else if (process.env.TEST_INSTANCE_HOSTNAME) {
      serverHostname = process.env.TEST_INSTANCE_HOSTNAME;
      console.log(`Using hostname from TEST_INSTANCE_HOSTNAME: ${serverHostname}`);
    } else {
      // Fallback: Create own sandbox
      console.log('No shared sandbox available, creating dedicated sandbox for Code tests...');
      this.timeout(TIMEOUTS.ODS_OPERATION);

      if (!process.env.TEST_REALM) {
        throw new Error('TEST_REALM required to create sandbox');
      }

      const result = await runCLIWithRetry(
        ['ods', 'create', '--realm', process.env.TEST_REALM, '--ttl', '4', '--wait', '--set-permissions', '--json'],
        {timeout: TIMEOUTS.ODS_OPERATION, verbose: true},
      );

      expect(result.exitCode, `Failed to create sandbox: ${toString(result.stderr)}`).to.equal(0);
      const sandbox = parseJSONOutput(result);
      ownSandboxId = getSandboxId(sandbox);
      serverHostname = getHostname(sandbox);
      console.log(`  ✓ Created dedicated sandbox ${ownSandboxId} at ${serverHostname}`);
    }
  });

  after(async function () {
    this.timeout(180_000); // 3 minutes for cleanup

    if (watchProcess) {
      watchProcess.kill();
    }

    // Delete remaining code versions
    if (codeVersionB && serverHostname) {
      await runCLIWithRetry(['code', 'delete', codeVersionB, '--server', serverHostname, '--force']);
    }

    // Delete own sandbox if we created one
    if (ownSandboxId) {
      console.log(`Cleaning up dedicated sandbox ${ownSandboxId}...`);
      await runCLIWithRetry(['ods', 'delete', ownSandboxId, '--force']);
      console.log('Dedicated sandbox deleted');
    }
  });

  /* ------------------------------------------------------------------ */
  describe('Step 1: Deploy Code Version A', function () {
    it('should deploy first code version', async function () {
      codeVersionA = `e2e-a-${Date.now()}`;

      const result = await runCLIWithRetry([
        'code',
        'deploy',
        CARTRIDGES_DIR,
        '--server',
        serverHostname,
        '--code-version',
        codeVersionA,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, toString(result.stderr));
    });
  });

  describe('Step 2: Verify Code Version A in List', function () {
    it('should find code version A in list', async function () {
      const result = await runCLIWithRetry(['code', 'list', '--server', serverHostname, '--json']);
      expect(result.exitCode).to.equal(0);

      const response = parseJSONOutput(result);
      const found = response.data.find((v: any) => v.id === codeVersionA);
      expect(found).to.exist;
    });
  });

  describe('Step 3: Activate Code Version A', function () {
    it('should activate version A', async function () {
      const result = await runCLIWithRetry(['code', 'activate', codeVersionA, '--server', serverHostname, '--json']);

      expect(result.exitCode).to.equal(0);
    });
  });

  describe('Step 4: Deploy Code Version B', function () {
    it('should deploy second code version', async function () {
      codeVersionB = `e2e-b-${Date.now()}`;

      const result = await runCLIWithRetry([
        'code',
        'deploy',
        CARTRIDGES_DIR,
        '--server',
        serverHostname,
        '--code-version',
        codeVersionB,
        '--json',
      ]);

      expect(result.exitCode).to.equal(0);
    });
  });

  describe('Step 5: Verify Code Version B in List', function () {
    it('should find code version B in list', async function () {
      const result = await runCLIWithRetry(['code', 'list', '--server', serverHostname, '--json']);
      expect(result.exitCode).to.equal(0);

      const response = parseJSONOutput(result);
      const found = response.data.find((v: any) => v.id === codeVersionB);
      expect(found).to.exist;
    });
  });

  describe('Step 6: Activate Code Version B', function () {
    it('should activate version B (A becomes inactive)', async function () {
      const result = await runCLIWithRetry(['code', 'activate', codeVersionB, '--server', serverHostname, '--json']);

      expect(result.exitCode).to.equal(0);
    });
  });

  describe('Step 7: Verify Active Code Version', function () {
    it('should show version B as active', async function () {
      const result = await runCLIWithRetry(['code', 'list', '--server', serverHostname, '--json']);
      const response = parseJSONOutput(result);

      const active = response.data.find((v: any) => v.active === true);
      expect(active.id).to.equal(codeVersionB);
    });
  });

  describe('Step 8: Watch Cartridges', function () {
    it('should start watching cartridges', async function () {
      this.timeout(120_000);

      watchProcess = execa(
        'node',
        [CLI_BIN, 'code', 'watch', CARTRIDGES_DIR, '--server', serverHostname, '--code-version', codeVersionB],
        {env: {...process.env, SFCC_LOG_LEVEL: 'silent'}},
      );

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10_000);
      });
      expect(watchProcess.killed).to.be.false;

      const testFile = path.join(CARTRIDGES_DIR, 'plugin_example/cartridge/scripts/test-watch.js');

      await fs.mkdir(path.dirname(testFile), {recursive: true});
      await fs.writeFile(testFile, `// test ${Date.now()}\n`);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5000);
      });

      watchProcess.kill();
      await fs.unlink(testFile).catch(() => {});
    });
  });

  describe('Step 9: Delete Inactive Code Version A', function () {
    it('should delete inactive version A', async function () {
      console.log(`Starting deletion of code version: ${codeVersionA}`);

      const result = await runCLIWithRetry(
        ['code', 'delete', codeVersionA, '--server', serverHostname, '--force', '--json'],
        {
          timeout: 120_000,
        },
      ); // 2 minutes timeout

      console.log(`Deletion finished with exit code: ${result.exitCode}`);

      expect(result.exitCode).to.equal(0, `Delete failed: ${toString(result.stderr)}`);
      codeVersionA = '';
    });
  });

  describe('Step 10: Verify Code Version A Removed', function () {
    it('should not find deleted version A', async function () {
      const result = await runCLIWithRetry(['code', 'list', '--server', serverHostname, '--json']);
      const response = parseJSONOutput(result);

      const found = response.data.find((v: any) => v.id === codeVersionA);
      expect(found).to.not.exist;
    });
  });
});
