/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {execa} from 'execa';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getSharedContext, hasSharedSandbox} from './shared-context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * E2E Tests for Sites Operations
 */
describe('Sites Operations E2E Tests', function () {
  this.timeout(600_000);
  this.retries(2);

  const CLI_BIN = path.resolve(__dirname, '../../../bin/run.js');
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

      const result = await runCLI([
        'ods',
        'create',
        '--realm',
        process.env.TEST_REALM,
        '--ttl',
        '4',
        '--wait',
        '--set-permissions',
        '--json',
      ]);

      expect(result.exitCode).to.equal(0, `Failed to create sandbox: ${result.stderr}`);
      const sandbox = JSON.parse(result.stdout);
      ownSandboxId = sandbox.id;
      serverHostname = sandbox.hostName;
      console.log(`Created dedicated sandbox ${ownSandboxId} at ${serverHostname}`);
    }

    const importResult = await runCLI(['job', 'import', SITE_ARCHIVE_PATH, '--server', serverHostname]);

    if (importResult.exitCode !== 0) {
      const msg = importResult.stderr || importResult.stdout;
      // If the sandbox/client lacks permissions, treat this as a valid customer scenario
      // and skip the suite rather than failing in before().
      if (/not\s+allowed|unauthorized|forbidden|401|403/i.test(msg)) {
        this.skip();
      }
      expect(importResult.exitCode).to.equal(0, msg);
    }
  });

  async function runCLI(args: string[]) {
    return execa('node', [CLI_BIN, ...args], {
      env: {...process.env, SFCC_LOG_LEVEL: 'silent'},
      reject: false,
    });
  }

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
        const response = JSON.parse(result.stdout);
        expect(response.data).to.be.an('array');
      } else {
        const errorText = result.stderr || result.stdout;
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
      expect(result.stderr).to.include('not a b2c command');
    });
  });


  describe('Sequential Multiple Site Imports', function () {
    it('should import multiple archives without conflict', async function () {
      for (let i = 1; i <= 2; i++) {
        const result = await runCLI(['job', 'import', SITE_ARCHIVE_PATH, '--server', serverHostname]);
        expect(result.exitCode).to.equal(0, `Import ${i} failed: ${result.stderr}`);
      }
    });
  });
});
