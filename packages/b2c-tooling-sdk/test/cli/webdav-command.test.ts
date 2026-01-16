/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {WebDavCommand, WEBDAV_ROOTS, VALID_ROOTS, type WebDavRootKey} from '@salesforce/b2c-tooling-sdk/cli';

// Create a test command class
class TestWebDavCommand extends WebDavCommand<typeof TestWebDavCommand> {
  static id = 'test:webdav';
  static description = 'Test WebDAV command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testBuildPath(relativePath: string) {
    return this.buildPath(relativePath);
  }

  public testRootPath() {
    return this.rootPath;
  }
}

// Type for mocking command properties in tests
type MockableWebDavCommand = TestWebDavCommand & {
  parse: () => Promise<{
    args: Record<string, string | number | boolean>;
    flags: Record<string, string | number | boolean>;
    metadata: Record<string, string | number | boolean>;
  }>;
  flags: Record<string, string | number | boolean>;
  args: Record<string, string | number | boolean>;
  resolvedConfig: Record<string, string | number | boolean>;
};

describe('cli/webdav-command', () => {
  describe('WEBDAV_ROOTS', () => {
    it('contains all expected root keys', () => {
      expect(WEBDAV_ROOTS.IMPEX).to.equal('Impex');
      expect(WEBDAV_ROOTS.TEMP).to.equal('Temp');
      expect(WEBDAV_ROOTS.CARTRIDGES).to.equal('Cartridges');
      expect(WEBDAV_ROOTS.REALMDATA).to.equal('Realmdata');
      expect(WEBDAV_ROOTS.CATALOGS).to.equal('Catalogs');
      expect(WEBDAV_ROOTS.LIBRARIES).to.equal('Libraries');
      expect(WEBDAV_ROOTS.STATIC).to.equal('Static');
      expect(WEBDAV_ROOTS.LOGS).to.equal('Logs');
      expect(WEBDAV_ROOTS.SECURITYLOGS).to.equal('Securitylogs');
    });
  });

  describe('VALID_ROOTS', () => {
    it('contains all root keys', () => {
      expect(VALID_ROOTS).to.include('IMPEX');
      expect(VALID_ROOTS).to.include('CARTRIDGES');
      expect(VALID_ROOTS.length).to.equal(Object.keys(WEBDAV_ROOTS).length);
    });
  });

  describe('WebDavCommand', () => {
    let config: Config;
    let command: TestWebDavCommand;

    beforeEach(async () => {
      config = await Config.load();
      command = new TestWebDavCommand([], config);
    });

    describe('buildPath', () => {
      it('builds path with default root (IMPEX)', async () => {
        const cmd = command as MockableWebDavCommand;
        const originalParse = cmd.parse.bind(command);
        cmd.parse = (async () => ({
          args: {},
          flags: {root: 'impex'},
          metadata: {},
        })) as typeof cmd.parse;

        await cmd.init();
        const path = command.testBuildPath('src/data/file.xml');
        expect(path).to.equal('Impex/src/data/file.xml');

        cmd.parse = originalParse;
      });

      it('builds path with explicit root', async () => {
        const cmd = command as MockableWebDavCommand;
        const originalParse = cmd.parse.bind(command);
        cmd.parse = (async () => ({
          args: {},
          flags: {root: 'cartridges'},
          metadata: {},
        })) as typeof cmd.parse;

        await cmd.init();
        const path = command.testBuildPath('v1/test.zip');
        expect(path).to.equal('Cartridges/v1/test.zip');

        cmd.parse = originalParse;
      });

      it('handles path with leading slash', async () => {
        const cmd = command as MockableWebDavCommand;
        const originalParse = cmd.parse.bind(command);
        cmd.parse = (async () => ({
          args: {},
          flags: {root: 'impex'},
          metadata: {},
        })) as typeof cmd.parse;

        await cmd.init();
        const path = command.testBuildPath('/src/data/file.xml');
        expect(path).to.equal('Impex/src/data/file.xml');

        cmd.parse = originalParse;
      });

      it('returns root path for empty string', async () => {
        const cmd = command as MockableWebDavCommand;
        const originalParse = cmd.parse.bind(command);
        cmd.parse = (async () => ({
          args: {},
          flags: {root: 'impex'},
          metadata: {},
        })) as typeof cmd.parse;

        await cmd.init();
        const path = command.testBuildPath('');
        expect(path).to.equal('Impex');

        cmd.parse = originalParse;
      });

      it('returns root path for single slash', async () => {
        const cmd = command as MockableWebDavCommand;
        const originalParse = cmd.parse.bind(command);
        cmd.parse = (async () => ({
          args: {},
          flags: {root: 'impex'},
          metadata: {},
        })) as typeof cmd.parse;

        await cmd.init();
        const path = command.testBuildPath('/');
        expect(path).to.equal('Impex');

        cmd.parse = originalParse;
      });

      it('handles all root types', async () => {
        const roots: WebDavRootKey[] = [
          'IMPEX',
          'TEMP',
          'CARTRIDGES',
          'REALMDATA',
          'CATALOGS',
          'LIBRARIES',
          'STATIC',
          'LOGS',
          'SECURITYLOGS',
        ];
        for (const root of roots) {
          const cmd = command as MockableWebDavCommand;
          const originalParse = cmd.parse.bind(command);
          cmd.parse = (async () => ({
            args: {},
            flags: {root: root.toLowerCase()},
            metadata: {},
          })) as typeof cmd.parse;

          await cmd.init();
          const path = command.testBuildPath('test');
          expect(path).to.include(WEBDAV_ROOTS[root]);

          cmd.parse = originalParse;
        }
      });
    });

    describe('rootPath', () => {
      it('returns default root path', async () => {
        const cmd = command as MockableWebDavCommand;
        const originalParse = cmd.parse.bind(command);
        cmd.parse = (async () => ({
          args: {},
          flags: {root: 'impex'},
          metadata: {},
        })) as typeof cmd.parse;

        await cmd.init();
        const rootPath = command.testRootPath();
        expect(rootPath).to.equal('Impex');

        cmd.parse = originalParse;
      });

      it('returns correct root path for specified root', async () => {
        const cmd = command as MockableWebDavCommand;
        const originalParse = cmd.parse.bind(command);
        cmd.parse = (async () => ({
          args: {},
          flags: {root: 'cartridges'},
          metadata: {},
        })) as typeof cmd.parse;

        await cmd.init();
        const rootPath = command.testRootPath();
        expect(rootPath).to.equal('Cartridges');

        cmd.parse = originalParse;
      });
    });
  });
});
