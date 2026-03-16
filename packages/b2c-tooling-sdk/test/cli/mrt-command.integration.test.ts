/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {captureOutput} from '@oclif/test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(__dirname, '../fixtures/test-cli');

interface TestMrtResult {
  hasApiKey: boolean;
  project?: string;
  environment?: string;
  cloudOrigin?: string;
  credentialsFile?: string;
  hasMrtCredentials: boolean;
}

describe('MrtCommand integration', () => {
  let config: Config;

  before(async () => {
    config = await Config.load({root: fixtureRoot});
  });

  async function run(args: string[]) {
    return captureOutput(async () => config.runCommand(args[0], args.slice(1)));
  }

  it('runs test-mrt command without errors', async () => {
    const {error} = await run(['test-mrt', '--json']);
    expect(error).to.be.undefined;
  });

  it('handles --api-key flag', async () => {
    const {error, result} = await run(['test-mrt', '--api-key', 'test-api-key-123', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestMrtResult)?.hasApiKey).to.be.true;
    expect((result as TestMrtResult)?.hasMrtCredentials).to.be.true;
  });

  it('handles --project flag', async () => {
    const {error, result} = await run(['test-mrt', '--project', 'my-project', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestMrtResult)?.project).to.equal('my-project');
  });

  it('handles --environment flag', async () => {
    const {error, result} = await run(['test-mrt', '--environment', 'staging', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestMrtResult)?.environment).to.equal('staging');
  });

  it('handles --cloud-origin flag', async () => {
    const {error, result} = await run(['test-mrt', '--cloud-origin', 'https://custom.mobify.com', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestMrtResult)?.cloudOrigin).to.equal('https://custom.mobify.com');
  });

  it('handles --credentials-file flag', async () => {
    const {error, result} = await run(['test-mrt', '--credentials-file', '/custom/path/.mobify', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestMrtResult)?.credentialsFile).to.equal('/custom/path/.mobify');
  });

  it('reports hasMrtCredentials false when no api-key provided', async () => {
    // Use --credentials-file to isolate from developer's ~/.mobify
    const {error, result} = await run(['test-mrt', '--credentials-file', '/dev/null', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestMrtResult)?.hasApiKey).to.be.false;
    expect((result as TestMrtResult)?.hasMrtCredentials).to.be.false;
  });

  it('handles multiple flags together', async () => {
    const {error, result} = await run([
      'test-mrt',
      '--api-key',
      'key123',
      '--project',
      'proj',
      '--environment',
      'prod',
      '--json',
    ]);

    expect(error).to.be.undefined;
    expect((result as TestMrtResult)?.hasApiKey).to.be.true;
    expect((result as TestMrtResult)?.project).to.equal('proj');
    expect((result as TestMrtResult)?.environment).to.equal('prod');
    expect((result as TestMrtResult)?.hasMrtCredentials).to.be.true;
  });
});
