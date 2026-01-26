/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Integration tests for logs operations.
 * These tests require a configured B2C instance (dw.json) and will be skipped if not available.
 */

import {expect} from 'chai';
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import {
  listLogFiles,
  getRecentLogs,
  tailLogs,
  createPathNormalizer,
  type LogEntry,
} from '@salesforce/b2c-tooling-sdk/operations/logs';

describe('operations/logs integration', function () {
  // These tests may take longer due to network calls
  this.timeout(30000);

  let instance: ReturnType<ReturnType<typeof resolveConfig>['createB2CInstance']>;
  let hasInstance = false;

  before(function () {
    try {
      // Try to load config from project root where dw.json is
      const configPath = process.env.SFCC_CONFIG || '../../dw.json';
      console.log(`    CWD: ${process.cwd()}`);
      console.log(`    Config path: ${configPath}`);
      // Note: instance and configPath go in the second argument (options), not the first (overrides)
      const config = resolveConfig(
        {},
        {
          instance: process.env.SFCC_INSTANCE || 'zzpq-013',
          configPath,
        },
      );
      const hasWebDav = config.hasBasicAuthConfig() || config.hasOAuthConfig();
      console.log(`    Loaded config - hostname: ${config.values.hostname}`);
      console.log(`    hasB2CInstanceConfig: ${config.hasB2CInstanceConfig()}`);
      console.log(`    hasBasicAuth: ${config.hasBasicAuthConfig()}, hasOAuth: ${config.hasOAuthConfig()}`);
      if (config.hasB2CInstanceConfig() && hasWebDav) {
        instance = config.createB2CInstance();
        hasInstance = true;
        console.log(`    Using instance: ${config.values.hostname}`);
      } else {
        console.log('    No B2C instance config found (set SFCC_INSTANCE or configure dw.json)');
      }
    } catch (error) {
      console.log(`    Config error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  beforeEach(function () {
    if (!hasInstance) {
      this.skip();
    }
  });

  describe('listLogFiles', () => {
    it('lists log files from the instance', async () => {
      const files = await listLogFiles(instance);

      expect(files).to.be.an('array');
      expect(files.length).to.be.greaterThan(0);

      // Each file should have the expected properties
      const file = files[0];
      expect(file).to.have.property('name');
      expect(file).to.have.property('prefix');
      expect(file).to.have.property('size');
      expect(file).to.have.property('lastModified');
      expect(file).to.have.property('path');

      console.log(`    Found ${files.length} log files`);
      console.log(`    Sample: ${file.name} (${file.prefix}, ${file.size} bytes)`);
    });

    it('filters by prefix', async () => {
      const files = await listLogFiles(instance, {prefixes: ['error']});

      expect(files).to.be.an('array');
      for (const file of files) {
        expect(file.prefix).to.equal('error');
      }

      console.log(`    Found ${files.length} error log files`);
    });

    it('sorts by size', async () => {
      const files = await listLogFiles(instance, {sortBy: 'size', sortOrder: 'desc'});

      expect(files).to.be.an('array');
      if (files.length >= 2) {
        expect(files[0].size).to.be.at.least(files[1].size);
      }
    });
  });

  describe('getRecentLogs', () => {
    it('retrieves recent log entries', async () => {
      const entries = await getRecentLogs(instance, {
        prefixes: ['error', 'customerror'],
        maxEntries: 10,
      });

      expect(entries).to.be.an('array');
      // May have 0 entries if no errors recently

      if (entries.length > 0) {
        const entry = entries[0];
        expect(entry).to.have.property('file');
        expect(entry).to.have.property('message');
        expect(entry).to.have.property('raw');

        console.log(`    Found ${entries.length} recent entries`);
        console.log(`    Sample: [${entry.file}] ${entry.level || 'UNKNOWN'}`);
        console.log(`      ${entry.message.substring(0, 100)}...`);
      } else {
        console.log('    No recent error/customerror entries found');
      }
    });

    it('applies path normalizer', async () => {
      const normalizer = createPathNormalizer({cartridgePath: './cartridges'});

      const entries = await getRecentLogs(instance, {
        prefixes: ['customerror'],
        maxEntries: 5,
        pathNormalizer: normalizer,
      });

      // Check if any entries have normalized paths
      const hasNormalizedPath = entries.some((e) => e.message.includes('./cartridges/'));

      console.log(`    Found ${entries.length} entries`);
      if (hasNormalizedPath) {
        console.log('    Path normalization applied successfully');
      }
    });
  });

  describe('tailLogs', () => {
    it('discovers files and collects entries', async () => {
      const discoveredFiles: string[] = [];
      const collectedEntries: LogEntry[] = [];

      const result = await tailLogs(instance, {
        prefixes: ['error', 'customerror'],
        pollInterval: 1000,
        lastEntries: 5, // Show last 5 entries per file on startup
        maxEntries: 5,
        onFileDiscovered: (file) => discoveredFiles.push(file.name),
        onEntry: (entry) => collectedEntries.push(entry),
      });

      // Wait for completion (maxEntries reached or timeout)
      const timeout = new Promise<void>((resolve) => setTimeout(() => resolve(), 10000));
      await Promise.race([result.done, timeout]);
      await result.stop();

      expect(discoveredFiles.length).to.be.greaterThan(0);
      console.log(`    Discovered ${discoveredFiles.length} files: ${discoveredFiles.slice(0, 3).join(', ')}...`);
      console.log(`    Collected ${collectedEntries.length} entries`);
    });

    it('stop() terminates tailing cleanly', async () => {
      const result = await tailLogs(instance, {
        prefixes: ['error'],
        pollInterval: 500,
      });

      // Stop after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await result.stop();

      // Should complete without hanging
      await result.done;
      console.log('    Tail stopped cleanly');
    });
  });
});
