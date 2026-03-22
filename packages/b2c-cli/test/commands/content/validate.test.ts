/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

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
    sinon.stub(command.operations, 'glob').callsFake(async (pattern: string) => mapping[pattern] ?? []);
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
    expect(stdoutStub.calledWithMatch(/PASS/)).to.equal(true);
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

    expect(stdoutStub.calledWithMatch(/FAIL/)).to.equal(true);
    expect(stdoutStub.calledWithMatch(/ERROR/)).to.equal(true);
    expect(errorStub.calledWithMatch('Validation failed')).to.equal(true);
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
});
