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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * E2E Tests for WebDAV File Operations
 *
 * This test suite covers WebDAV operations:
 * 1. Upload file (put)
 * 2. List files (ls)
 * 3. Download file (get)
 * 4. Delete file (rm)
 * 5. Create directory (mkdir)
 * 6. List directory contents
 * 7. Delete directory
 * 8. Zip directory
 * 9. Verify zip exists
 * 10. Unzip archive
 * 11. Verify extracted files
 */
describe('WebDAV Operations E2E Tests', function () {
  this.timeout(600_000); // 10 minutes
  this.retries(2);

  const CLI_BIN = path.resolve(__dirname, '../../../bin/run.js');
  const TEST_FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
  const TEST_OUTPUT_DIR = path.resolve(__dirname, '../test-output');

  let serverHostname: string;
  let ownSandboxId: null | string = null;
  const testFileName = `e2e-test-${Date.now()}.txt`;
  const testDirName = `e2e-test-dir-${Date.now()}`;
  const remoteBasePath = 'src/instance';
  const remoteFilePath = `${remoteBasePath}/${testFileName}`;
  const remoteDirPath = `${remoteBasePath}/${testDirName}`;
  const remoteZipPath = `${remoteDirPath}.zip`;

  function entryName(entry: any): string {
    if (entry?.displayName) return String(entry.displayName);
    if (entry?.href) {
      const parts = String(entry.href).split('/').filter(Boolean);
      return decodeURIComponent(parts.at(-1) ?? '');
    }
    return '';
  }

  // WebDAV is eventually consistent — poll instead of asserting immediately
  async function waitFor(fn: () => Promise<boolean>, timeoutMs = 60_000, intervalMs = 2000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // eslint-disable-next-line no-await-in-loop
      if (await fn()) return;
      // eslint-disable-next-line no-await-in-loop
      await new Promise<void>((resolve) => {
        setTimeout(resolve, intervalMs);
      });
    }
    throw new Error('Timed out waiting for WebDAV visibility');
  }

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
      console.log('No shared sandbox available, creating dedicated sandbox for WebDAV tests...');
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

    // Create test output directory
    await fs.mkdir(TEST_OUTPUT_DIR, {recursive: true});

    // Create test file
    await fs.writeFile(path.join(TEST_FIXTURES_DIR, testFileName), `E2E Test Content - ${Date.now()}`);
  });

  async function runCLI(args: string[]) {
    return execa('node', [CLI_BIN, ...args], {
      env: {
        ...process.env,
        SFCC_LOG_LEVEL: 'silent',
      },
      reject: false,
    });
  }

  after(async function () {
    this.timeout(180_000); // 3 minutes for cleanup

    // Cleanup: Delete test files from WebDAV in parallel
    if (serverHostname) {
      await Promise.all([
        runCLI(['webdav', 'rm', remoteFilePath, '--server', serverHostname, '--force', '--root', 'impex']),
        runCLI(['webdav', 'rm', remoteDirPath, '--server', serverHostname, '--force', '--root', 'impex']),
        runCLI(['webdav', 'rm', remoteZipPath, '--server', serverHostname, '--force', '--root', 'impex']),
      ]);
    }

    // Cleanup: Delete local test files
    await fs.unlink(path.join(TEST_FIXTURES_DIR, testFileName)).catch(() => {});
    await fs.rm(TEST_OUTPUT_DIR, {recursive: true, force: true});

    // Delete own sandbox if we created one
    if (ownSandboxId) {
      console.log(`Cleaning up dedicated sandbox ${ownSandboxId}...`);
      await runCLI(['ods', 'delete', ownSandboxId, '--force']);
      console.log('Dedicated sandbox deleted');
    }
  });

  describe('Step 1: Upload File', function () {
    it('should upload file to WebDAV', async function () {
      const localFile = path.join(TEST_FIXTURES_DIR, testFileName);

      const result = await runCLI([
        'webdav',
        'put',
        localFile,
        remoteFilePath,
        '--server',
        serverHostname,
        '--root',
        'impex',
      ]);

      if (result.exitCode !== 0) {
        const msg = result.stderr || result.stdout;
        if (/not\s+allowed|unauthorized|forbidden|401|403/i.test(msg)) {
          this.skip();
        }
        expect(result.exitCode).to.equal(0, msg);
      }
    });
  });

  describe('Step 2: List Files', function () {
    it('should list files in WebDAV directory', async function () {
      await waitFor(async () => {
        const result = await runCLI([
          'webdav',
          'ls',
          remoteBasePath,
          '--server',
          serverHostname,
          '--root',
          'impex',
          '--json',
        ]);
        if (result.exitCode !== 0) return false;
        const response = JSON.parse(result.stdout);
        return response.entries?.some((e: any) => entryName(e) === testFileName);
      });
    });
  });

  describe('Step 3: Download File', function () {
    it('should download file from WebDAV', async function () {
      const localOutput = path.join(TEST_OUTPUT_DIR, testFileName);

      const result = await runCLI([
        'webdav',
        'get',
        remoteFilePath,
        '--output',
        localOutput,
        '--server',
        serverHostname,
        '--root',
        'impex',
      ]);

      expect(result.exitCode).to.equal(0);

      await fs.access(localOutput);
    });
  });

  describe('Step 4: Delete File', function () {
    it('should delete file from WebDAV', async function () {
      await runCLI(['webdav', 'rm', remoteFilePath, '--server', serverHostname, '--force', '--root', 'impex']);

      await waitFor(async () => {
        const result = await runCLI([
          'webdav',
          'ls',
          remoteBasePath,
          '--server',
          serverHostname,
          '--root',
          'impex',
          '--json',
        ]);
        if (result.exitCode !== 0) return false;
        const response = JSON.parse(result.stdout);
        return !response.entries?.some((e: any) => entryName(e) === testFileName);
      });
    });
  });

  describe('Step 5: Create Directory', function () {
    it('should create directory on WebDAV', async function () {
      const result = await runCLI(['webdav', 'mkdir', remoteDirPath, '--server', serverHostname, '--root', 'impex']);

      expect(result.exitCode).to.equal(0);
    });
  });

  describe('Step 6: List Directory Contents', function () {
    it('should list directory contents recursively', async function () {
      const localFile = path.join(TEST_FIXTURES_DIR, testFileName);
      await runCLI([
        'webdav',
        'put',
        localFile,
        `${remoteDirPath}/${testFileName}`,
        '--server',
        serverHostname,
        '--root',
        'impex',
      ]);

      const result = await runCLI([
        'webdav',
        'ls',
        remoteDirPath,
        '--server',
        serverHostname,
        '--root',
        'impex',
        '--json',
      ]);

      expect(result.exitCode).to.equal(0);
    });
  });

  describe('Step 7: Delete Directory', function () {
    it('should delete directory from WebDAV', async function () {
      await runCLI(['webdav', 'rm', remoteDirPath, '--server', serverHostname, '--force', '--root', 'impex']);

      await waitFor(async () => {
        const result = await runCLI([
          'webdav',
          'ls',
          remoteBasePath,
          '--server',
          serverHostname,
          '--root',
          'impex',
          '--json',
        ]);
        if (result.exitCode !== 0) return false;
        const response = JSON.parse(result.stdout);
        return !response.entries?.some((e: any) => entryName(e) === testDirName);
      });
    });
  });

  describe('Step 8: Zip Directory', function () {
    it('should create a zip archive of directory', async function () {
      await runCLI(['webdav', 'mkdir', remoteDirPath, '--server', serverHostname, '--root', 'impex']);

      const localFile = path.join(TEST_FIXTURES_DIR, testFileName);
      await runCLI([
        'webdav',
        'put',
        localFile,
        `${remoteDirPath}/${testFileName}`,
        '--server',
        serverHostname,
        '--root',
        'impex',
      ]);

      const result = await runCLI(['webdav', 'zip', remoteDirPath, '--server', serverHostname, '--root', 'impex']);

      expect(result.exitCode).to.equal(0);
    });
  });

  describe('Step 9: Verify Zip Exists', function () {
    it('should find zip file in directory listing', async function () {
      await waitFor(async () => {
        const result = await runCLI([
          'webdav',
          'ls',
          remoteBasePath,
          '--server',
          serverHostname,
          '--root',
          'impex',
          '--json',
        ]);
        if (result.exitCode !== 0) return false;
        const response = JSON.parse(result.stdout);
        return response.entries?.some((e: any) => entryName(e) === `${testDirName}.zip`);
      });
    });
  });

  describe('Step 10: Unzip Archive', function () {
    it('should extract zip archive', async function () {
      const result = await runCLI(['webdav', 'unzip', remoteZipPath, '--server', serverHostname, '--root', 'impex']);

      expect(result.exitCode).to.equal(0);
    });
  });

  describe('Step 11: Verify Extracted Files', function () {
    it('should find extracted files in directory', async function () {
      await waitFor(async () => {
        const result = await runCLI([
          'webdav',
          'ls',
          remoteDirPath,
          '--server',
          serverHostname,
          '--root',
          'impex',
          '--json',
        ]);
        if (result.exitCode !== 0) return false;
        const response = JSON.parse(result.stdout);
        return response.entries?.some((e: any) => entryName(e) === testFileName);
      }, 300_000);
    });
  });
});
