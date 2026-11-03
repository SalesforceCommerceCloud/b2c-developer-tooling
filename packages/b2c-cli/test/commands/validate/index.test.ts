/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {ux} from '@oclif/core';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import Validate from '../../../src/commands/validate/index.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

const INVENTORY_NS = 'http://www.demandware.com/xml/impex/inventory/2007-05-31';

function inventory(instock: string): string {
  return `<?xml version="1.0"?>
<inventory xmlns="${INVENTORY_NS}">
  <inventory-list>
    <header list-id="inventory"><default-instock>${instock}</default-instock></header>
  </inventory-list>
</inventory>
`;
}

describe('validate', () => {
  const hooks = createIsolatedConfigHooks();
  let tmp: string;
  let stdout: sinon.SinonStub;

  beforeEach(async () => {
    await hooks.beforeEach();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-validate-'));
    stdout = sinon.stub(ux, 'stdout');
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  function write(name: string, contents: string): string {
    const file = path.join(tmp, name);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, contents);
    return file;
  }

  async function createCommand(argv: string[], flags: Record<string, unknown> = {}, json = false) {
    const command: any = await createTestCommand(Validate, hooks.getConfig(), flags, {}, argv);
    sinon.stub(command, 'jsonEnabled').returns(json);
    sinon.stub(command, 'warn');
    return command;
  }

  function output(): string {
    return stdout.args.map((args) => String(args[0])).join('\n');
  }

  it('prints PASS and a summary for valid files in a directory', async () => {
    write('site/inventory.xml', inventory('true'));
    write('site/other.xml', '<root xmlns="urn:example"/>');
    const command = await createCommand([path.join(tmp, 'site')]);

    const summary = await command.run();

    expect(summary).to.include({totalFiles: 2, validFiles: 1, skippedFiles: 1, failedFiles: 0});
    expect(output()).to.match(/PASS: .*inventory\.xml \(inventory\)/);
    expect(output()).to.match(/SKIP: .*other\.xml - No bundled schema for namespace urn:example/);
    expect(output()).to.include('1/2 file(s) valid, 0 error(s), 1 skipped');
  });

  it('prints FAIL with line numbers and exits with an error for invalid files', async () => {
    const file = write('inventory.xml', inventory('maybe'));
    const command = await createCommand([file]);
    const errorStub = sinon.stub(command, 'error').throws(new Error('Validation failed'));

    let thrown: unknown;
    try {
      await command.run();
    } catch (error) {
      thrown = error;
    }

    expect((thrown as Error).message).to.equal('Validation failed');
    expect(errorStub.calledWithMatch('Validation failed', {exit: 1})).to.equal(true);
    expect(output()).to.match(/FAIL: .*inventory\.xml \(inventory\)/);
    expect(output()).to.match(/ERROR line 4: .*'maybe' is not a valid value/);
  });

  it('returns the summary without printing in JSON mode, exiting 1 on failure', async () => {
    const file = write('inventory.xml', inventory('maybe'));
    const command = await createCommand([file], {}, true);

    try {
      const summary = await command.run();

      expect(summary.failedFiles).to.equal(1);
      expect(summary.results[0].errors[0]).to.include({line: 4, severity: 'error'});
      expect(stdout.called).to.equal(false);
      expect(process.exitCode).to.equal(1);
    } finally {
      process.exitCode = undefined;
    }
  });

  it('passes --schema, --exclude, and --fail-fast to the SDK', async () => {
    const command = await createCommand(['a.xml'], {schema: 'catalog', exclude: ['**/x/**'], 'fail-fast': true});
    const collect = sinon.stub(command.operations, 'collectXmlFiles').resolves({
      explicitFiles: new Set(['/a.xml']),
      files: ['/a.xml'],
      unmatched: [],
    });
    const validateStub = sinon.stub(command.operations, 'validateXmlFiles').resolves({
      failedFiles: 0,
      results: [],
      skippedFiles: 0,
      totalErrors: 0,
      totalFiles: 1,
      validFiles: 1,
    });

    await command.run();

    expect(collect.firstCall.args).to.deep.equal([['a.xml'], {exclude: ['**/x/**']}]);
    expect(validateStub.firstCall.args[1]).to.include({schema: 'catalog', failFast: true});
  });

  it('warns about unmatched inputs and errors when nothing matches', async () => {
    const command = await createCommand([path.join(tmp, 'missing')]);
    sinon.stub(command, 'error').throws(new Error('No XML files found.'));

    let thrown: unknown;
    try {
      await command.run();
    } catch (error) {
      thrown = error;
    }

    expect((thrown as Error).message).to.equal('No XML files found.');
    expect(command.warn.calledWithMatch(/No XML files matched/)).to.equal(true);
  });
});
