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
import type {MetaDefinitionValidationResult} from '@salesforce/b2c-tooling-sdk/operations/content';
import ContentValidate from '../../../src/commands/content/validate.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

function makeResult(overrides: Partial<MetaDefinitionValidationResult> = {}): MetaDefinitionValidationResult {
  return {
    valid: true,
    schemaType: 'pagetype',
    errors: [],
    filePath: '/tmp/test.json',
    ...overrides,
  };
}

describe('content validate', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, argv: string[] = ['test.json']) {
    return createTestCommand(ContentValidate, hooks.getConfig(), flags, {}, argv);
  }

  function stubGlob(command: any, mapping: Record<string, string[]>) {
    sinon.stub(command.operations, 'glob').callsFake(async (...args: unknown[]) => mapping[args[0] as string] ?? []);
  }

  it('writes PASS to stdout for valid file', async () => {
    const command: any = await createCommand({}, ['test.json']);
    stubGlob(command, {'test.json': ['test.json']});
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command.operations, 'validateMetaDefinitionFile').returns(makeResult({filePath: '/cwd/test.json'}));
    const stdoutStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result.validFiles).to.equal(1);
    expect(result.totalErrors).to.equal(0);
    expect(stdoutStub.calledWithMatch(sinon.match(/PASS/))).to.equal(true);
  });

  it('writes FAIL to stdout and calls error for invalid file', async () => {
    const command: any = await createCommand({}, ['bad.json']);
    stubGlob(command, {'bad.json': ['bad.json']});
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command.operations, 'validateMetaDefinitionFile').returns(
      makeResult({
        valid: false,
        filePath: '/cwd/bad.json',
        errors: [{path: '/region_definitions', message: 'is required', property: 'instance.region_definitions'}],
      }),
    );
    const stdoutStub = sinon.stub(ux, 'stdout');
    const errorStub = sinon.stub(command, 'error').throws(new Error('Validation failed'));

    try {
      await command.run();
    } catch {
      // expected
    }

    expect(stdoutStub.calledWithMatch(sinon.match(/FAIL/))).to.equal(true);
    expect(stdoutStub.calledWithMatch(sinon.match(/ERROR/))).to.equal(true);
    expect(errorStub.calledWithMatch(sinon.match('Validation failed'))).to.equal(true);
  });

  it('returns JSON result with data', async () => {
    const command: any = await createCommand({}, ['test.json']);
    stubGlob(command, {'test.json': ['test.json']});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command.operations, 'validateMetaDefinitionFile').returns(makeResult());

    const result = await command.run();

    expect(result).to.have.property('results');
    expect(result).to.have.property('totalFiles', 1);
    expect(result).to.have.property('validFiles', 1);
    expect(result).to.have.property('totalErrors', 0);
  });

  it('passes --type flag to SDK', async () => {
    const command: any = await createCommand({type: 'componenttype'}, ['test.json']);
    stubGlob(command, {'test.json': ['test.json']});
    sinon.stub(command, 'jsonEnabled').returns(true);
    const validateStub = sinon
      .stub(command.operations, 'validateMetaDefinitionFile')
      .returns(makeResult({schemaType: 'componenttype'}));

    await command.run();

    expect(validateStub.calledOnce).to.equal(true);
    expect(validateStub.firstCall.args[1]).to.deep.equal({type: 'componenttype'});
  });

  it('processes multiple files', async () => {
    const command: any = await createCommand({}, ['a.json', 'b.json']);
    stubGlob(command, {'a.json': ['a.json'], 'b.json': ['b.json']});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon
      .stub(command.operations, 'validateMetaDefinitionFile')
      .onFirstCall()
      .returns(makeResult({filePath: '/cwd/a.json'}))
      .onSecondCall()
      .returns(makeResult({filePath: '/cwd/b.json'}));

    const result = await command.run();

    expect(result.totalFiles).to.equal(2);
    expect(result.validFiles).to.equal(2);
  });

  it('expands glob patterns to multiple files', async () => {
    const command: any = await createCommand({}, ['experience/**/*.json']);
    stubGlob(command, {'experience/**/*.json': ['experience/pages/a.json', 'experience/components/b.json']});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command.operations, 'validateMetaDefinitionFile').returns(makeResult());

    const result = await command.run();

    expect(result.totalFiles).to.equal(2);
  });

  describe('with real validator (no SDK stub)', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-validate-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, {force: true, recursive: true});
    });

    it('reports valid pagetype file as valid', async () => {
      const filePath = path.join(tmpDir, 'home.json');
      // Minimal valid pagetype: only region_definitions is required by the schema
      fs.writeFileSync(filePath, JSON.stringify({region_definitions: []}));

      const command: any = await createCommand({type: 'pagetype'}, [filePath]);
      // Use real glob - the file actually exists on disk
      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();

      expect(result.totalFiles).to.equal(1);
      expect(result.validFiles).to.equal(1);
      expect(result.totalErrors).to.equal(0);
      expect(result.results[0].valid).to.equal(true);
      expect(result.results[0].schemaType).to.equal('pagetype');
    });

    it('reports invalid pagetype file (missing required region_definitions) with errors', async () => {
      const filePath = path.join(tmpDir, 'broken.json');
      // Pagetype requires region_definitions - omitting it triggers a real validator error
      fs.writeFileSync(filePath, JSON.stringify({name: {default: 'Bad'}}));

      const command: any = await createCommand({type: 'pagetype'}, [filePath]);
      // Non-JSON mode is required to exercise the post-render `this.error('Validation failed')` branch
      sinon.stub(command, 'jsonEnabled').returns(false);
      const stdoutStub = sinon.stub(ux, 'stdout');
      const errorStub = sinon.stub(command, 'error').throws(new Error('Validation failed'));

      let caught: unknown;
      try {
        await command.run();
      } catch (error) {
        caught = error;
      }

      // The validator must have produced at least one error -> command.error called
      expect(errorStub.called, 'command.error should be called for invalid file').to.equal(true);
      expect(caught).to.exist;

      const stdoutOutput = stdoutStub
        .getCalls()
        .map((c) => String(c.args[0] ?? ''))
        .join('\n');
      expect(stdoutOutput).to.include('FAIL');
      // The real validator surfaces the missing required property
      expect(stdoutOutput).to.include('region_definitions');
    });

    it('reports invalid JSON content with a JSON parse error', async () => {
      const filePath = path.join(tmpDir, 'bad-json.json');
      fs.writeFileSync(filePath, '{not valid json');

      const command: any = await createCommand({type: 'pagetype'}, [filePath]);
      sinon.stub(command, 'jsonEnabled').returns(false);
      const stdoutStub = sinon.stub(ux, 'stdout');
      const errorStub = sinon.stub(command, 'error').throws(new Error('Validation failed'));

      let caught: unknown;
      try {
        await command.run();
      } catch (error) {
        caught = error;
      }

      expect(errorStub.called).to.equal(true);
      expect(caught).to.exist;

      const stdoutOutput = stdoutStub
        .getCalls()
        .map((c) => String(c.args[0] ?? ''))
        .join('\n');
      expect(stdoutOutput).to.include('FAIL');
      expect(stdoutOutput.toLowerCase()).to.include('invalid json');
    });
  });
});
