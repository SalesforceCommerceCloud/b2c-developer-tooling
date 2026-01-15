/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {runCommand} from '@oclif/test';
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
  it('runs test-mrt command without errors', async () => {
    const {error} = await runCommand(['test-mrt'], {root: fixtureRoot});
    expect(error).to.be.undefined;
  });

  it('handles --api-key flag', async () => {
    const {error, result} = await runCommand<TestMrtResult>(['test-mrt', '--api-key', 'test-api-key-123', '--json'], {
      root: fixtureRoot,
    });

    expect(error).to.be.undefined;
    expect(result?.hasApiKey).to.be.true;
    expect(result?.hasMrtCredentials).to.be.true;
  });

  it('handles --project flag', async () => {
    const {error, result} = await runCommand<TestMrtResult>(['test-mrt', '--project', 'my-project', '--json'], {
      root: fixtureRoot,
    });

    expect(error).to.be.undefined;
    expect(result?.project).to.equal('my-project');
  });

  it('handles --environment flag', async () => {
    const {error, result} = await runCommand<TestMrtResult>(['test-mrt', '--environment', 'staging', '--json'], {
      root: fixtureRoot,
    });

    expect(error).to.be.undefined;
    expect(result?.environment).to.equal('staging');
  });

  it('handles --cloud-origin flag', async () => {
    const {error, result} = await runCommand<TestMrtResult>(
      ['test-mrt', '--cloud-origin', 'https://custom.mobify.com', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.cloudOrigin).to.equal('https://custom.mobify.com');
  });

  it('handles --credentials-file flag', async () => {
    const {error, result} = await runCommand<TestMrtResult>(
      ['test-mrt', '--credentials-file', '/custom/path/.mobify', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.credentialsFile).to.equal('/custom/path/.mobify');
  });

  it('reports hasMrtCredentials false when no api-key provided', async () => {
    // Use --credentials-file to isolate from developer's ~/.mobify
    const {error, result} = await runCommand<TestMrtResult>(
      ['test-mrt', '--credentials-file', '/dev/null', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.hasApiKey).to.be.false;
    expect(result?.hasMrtCredentials).to.be.false;
  });

  it('handles multiple flags together', async () => {
    const {error, result} = await runCommand<TestMrtResult>(
      ['test-mrt', '--api-key', 'key123', '--project', 'proj', '--environment', 'prod', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.hasApiKey).to.be.true;
    expect(result?.project).to.equal('proj');
    expect(result?.environment).to.equal('prod');
    expect(result?.hasMrtCredentials).to.be.true;
  });
});
