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

interface TestInstanceResult {
  server?: string;
  hasServer: boolean;
  instance?: string;
}

describe('InstanceCommand integration', () => {
  let config: Config;

  before(async () => {
    config = await Config.load({root: fixtureRoot});
  });

  async function run(args: string[]) {
    return captureOutput(async () => config.runCommand(args[0], args.slice(1)));
  }

  it('runs test-instance command without errors', async () => {
    const {error} = await run(['test-instance', '--json']);
    expect(error).to.be.undefined;
  });

  it('handles --server flag', async () => {
    const {error, result} = await run(['test-instance', '--server', 'test.demandware.net', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestInstanceResult)?.server).to.equal('test.demandware.net');
    expect((result as TestInstanceResult)?.hasServer).to.be.true;
  });

  it('reports hasServer false when no server provided', async () => {
    const {error, result} = await run(['test-instance', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestInstanceResult)?.hasServer).to.be.false;
    expect((result as TestInstanceResult)?.server).to.be.undefined;
  });

  it('creates instance when server is provided', async () => {
    const {error, result} = await run(['test-instance', '--server', 'test.demandware.net', '--json']);

    expect(error).to.be.undefined;
    expect((result as TestInstanceResult)?.instance).to.equal('test.demandware.net');
  });

  it('handles --instance flag for config selection', async () => {
    // The --instance flag is for selecting a named instance from dw.json
    // Without a dw.json, it just sets the flag value
    const {error, result} = await run(['test-instance', '--instance', 'staging', '--json']);

    expect(error).to.be.undefined;
    // Instance flag is for config selection, not server name
    expect((result as TestInstanceResult)?.hasServer).to.be.false;
  });
});
