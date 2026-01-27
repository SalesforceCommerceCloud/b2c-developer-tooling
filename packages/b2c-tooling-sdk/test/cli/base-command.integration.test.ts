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

describe('BaseCommand integration', () => {
  it('runs test-base command without errors', async () => {
    const {error} = await runCommand(['test-base', '--json'], {root: fixtureRoot});
    expect(error).to.be.undefined;
  });

  it('handles --extra-query flag', async () => {
    const {error, result} = await runCommand<{extraParams?: Record<string, unknown>}>(
      ['test-base', '--extra-query', '{"debug":"true"}', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.extraParams?.query).to.deep.equal({debug: 'true'});
  });

  it('handles --extra-body flag', async () => {
    const {error, result} = await runCommand<{extraParams?: Record<string, unknown>}>(
      ['test-base', '--extra-body', '{"_internal":true}', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.extraParams?.body).to.deep.equal({_internal: true});
  });

  it('handles both --extra-query and --extra-body flags', async () => {
    const {error, result} = await runCommand<{extraParams?: Record<string, unknown>}>(
      ['test-base', '--extra-query', '{"debug":"true"}', '--extra-body', '{"_internal":true}', '--json'],
      {root: fixtureRoot},
    );

    expect(error).to.be.undefined;
    expect(result?.extraParams?.query).to.deep.equal({debug: 'true'});
    expect(result?.extraParams?.body).to.deep.equal({_internal: true});
  });

  it('returns undefined extraParams when no extra flags provided', async () => {
    const {error, result} = await runCommand<{extraParams?: Record<string, unknown>}>(['test-base', '--json'], {
      root: fixtureRoot,
    });

    expect(error).to.be.undefined;
    expect(result?.extraParams).to.be.undefined;
  });
});
