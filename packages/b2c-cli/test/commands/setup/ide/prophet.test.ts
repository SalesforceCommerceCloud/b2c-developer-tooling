/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import sinon from 'sinon';
import SetupIdeProphet from '../../../../src/commands/setup/ide/prophet.js';
import {
  runSilent,
  stubCommandConfigAndLogger,
  stubJsonEnabled,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

describe('setup ide prophet', () => {
  let tempDir: string;

  beforeEach(async () => {
    isolateConfig();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-setup-ide-prophet-'));
  });

  afterEach(async () => {
    sinon.restore();
    restoreConfig();
    await fs.rm(tempDir, {recursive: true, force: true});
  });

  function createCommand(flags: Record<string, unknown> = {}): SetupIdeProphet {
    const command = new SetupIdeProphet([], {} as any);

    (command as any).flags = {
      output: path.join(tempDir, 'dw.js'),
      force: false,
      instance: undefined,
      config: undefined,
      'project-directory': undefined,
      ...flags,
    };

    stubJsonEnabled(command, true);
    stubCommandConfigAndLogger(command);

    return command;
  }

  describe('command structure', () => {
    it('should have expected metadata', () => {
      expect(SetupIdeProphet.description).to.be.a('string');
      expect(SetupIdeProphet.description).to.include('Prophet');
      expect(SetupIdeProphet.enableJsonFlag).to.equal(true);
      expect(SetupIdeProphet.flags).to.have.property('output');
      expect(SetupIdeProphet.flags).to.have.property('force');
    });
  });

  describe('script generation', () => {
    it('should create dw.js when no file exists', async () => {
      const outputPath = path.join(tempDir, 'dw.js');
      const command = createCommand({output: outputPath});

      const result = await runSilent(() => command.run());
      const content = await fs.readFile(outputPath, 'utf8');

      expect(result.path).to.equal(path.resolve(outputPath));
      expect(result.overwritten).to.equal(false);
      expect(content).to.not.match(/^#!\/usr\/bin\/env node/m);
      expect(content).to.include('b2c setup inspect --json --unmask');
      expect(content).to.include('Purpose: Provide Prophet VS Code extension');
      expect(content).to.include("'code-version'");
      expect(content).to.not.include("'client-id'");
      expect(content).to.not.include("'client-secret'");
      expect(content).to.not.include("'short-code'");
      expect(content).to.not.include("'tenant-id'");
      expect(content).to.include('cartridgesPath');
      expect(content).to.include('siteID');
      expect(content).to.include('storefrontPassword');
      expect(content).to.not.include("'oauth-scopes'");
      expect(content).to.include('module.exports = dwJson;');
      expect(content).to.not.include('process.stdout.write');
      expect(content).to.include('function logProphetDw(message, error)');
      expect(content).to.include('console.error(line);');
      expect(content).to.include('console.log(line);');
      expect(content).to.include('support dwJson multi-config in prophet');
      expect(content).to.include("typeof workspace !== 'undefined'");
      expect(content).to.include("if (typeof __dirname === 'string' && __dirname)");
      expect(content).to.include('process.env.SFCC_PROJECT_DIRECTORY');
      expect(content).to.include('process.env.SFCC_WORKING_DIRECTORY');
      expect(content).to.include('try {');
      expect(content).to.include('return {};');
      expect(content).to.include('execOptions.cwd = projectDirectory;');
      expect(content).to.include("path.join(projectDirectory, 'dw.json')");
      expect(content).to.include('path.resolve(projectDirectory || process.cwd(), dwJsonPath);');
      expect(content).to.include('return resolveDwJsonConfig(require(dwJsonPath));');
      expect(content).to.include('setup inspect returned no hostname; falling back to dw.json');
      expect(content).to.include('dw.json fallback returned no hostname');
    });

    it('should fail if output exists without --force', async () => {
      const outputPath = path.join(tempDir, 'dw.js');
      await fs.writeFile(outputPath, 'existing', 'utf8');

      const command = createCommand({output: outputPath});
      makeCommandThrowOnError(command);
      let error: unknown;
      try {
        await command.run();
      } catch (error_) {
        error = error_;
      }

      expect(error).to.be.instanceOf(Error);
      expect((error as Error).message).to.include('Use --force to overwrite');
    });

    it('should overwrite output when --force is used', async () => {
      const outputPath = path.join(tempDir, 'dw.js');
      await fs.writeFile(outputPath, 'old-content', 'utf8');

      const command = createCommand({output: outputPath, force: true});

      const result = await runSilent(() => command.run());
      const content = await fs.readFile(outputPath, 'utf8');

      expect(result.overwritten).to.equal(true);
      expect(content).to.not.equal('old-content');
      expect(content).to.include('function toProphetConfig(config)');
    });

    it('should include setup context flags in generated inspect args', async () => {
      const outputPath = path.join(tempDir, 'dw.js');
      const command = createCommand({
        output: outputPath,
        instance: 'staging',
        config: '/tmp/config/dw.json',
        'project-directory': '/tmp/workspace',
      });

      await runSilent(() => command.run());
      const content = await fs.readFile(outputPath, 'utf8');

      expect(content).to.include('--instance');
      expect(content).to.include('staging');
      expect(content).to.include('--config');
      expect(content).to.include('/tmp/config/dw.json');
      expect(content).to.include('--project-directory');
      expect(content).to.include('/tmp/workspace');
    });
  });
});
