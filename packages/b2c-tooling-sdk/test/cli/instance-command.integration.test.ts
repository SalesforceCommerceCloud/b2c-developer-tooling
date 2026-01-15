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

interface TestInstanceResult {
  server?: string;
  hasServer: boolean;
  instance?: string;
}

describe('InstanceCommand integration', () => {
  it('runs test-instance command without errors', async () => {
    const {error} = await runCommand(['test-instance'], {root: fixtureRoot});
    expect(error).to.be.undefined;
  });

  it('handles --server flag', async () => {
    const {error, result} = await runCommand<TestInstanceResult>(
      ['test-instance', '--server', 'test.demandware.net', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.server).to.equal('test.demandware.net');
    expect(result?.hasServer).to.be.true;
  });

  it('reports hasServer false when no server provided', async () => {
    const {error, result} = await runCommand<TestInstanceResult>(['test-instance', '--json'], {root: fixtureRoot});

    expect(error).to.be.undefined;
    expect(result?.hasServer).to.be.false;
    expect(result?.server).to.be.undefined;
  });

  it('creates instance when server is provided', async () => {
    const {error, result} = await runCommand<TestInstanceResult>(
      ['test-instance', '--server', 'test.demandware.net', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.instance).to.equal('test.demandware.net');
  });

  it('handles --instance flag for config selection', async () => {
    // The --instance flag is for selecting a named instance from dw.json
    // Without a dw.json, it just sets the flag value
    const {error, result} = await runCommand<TestInstanceResult>(['test-instance', '--instance', 'staging', '--json'], {
      root: fixtureRoot,
    });

    expect(error).to.be.undefined;
    // Instance flag is for config selection, not server name
    expect(result?.hasServer).to.be.false;
  });
});
