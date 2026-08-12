/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CapInstall from '../../../src/commands/cap/install.js';
import {createIsolatedConfigHooks, createTestCommand, expectError} from '../../helpers/test-setup.js';

describe('cap install', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(CapInstall, hooks.getConfig(), flags, args);
  }

  /** Stub credential checks, config, instance, and silence output. Returns the fake instance. */
  function stubCommon(command: any) {
    const instance = {config: {hostname: 'example.com'}};
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => instance);
    return instance;
  }

  /** A successful install result the operation stub can resolve with. */
  const installResult = {
    execution: {execution_status: 'finished', exit_status: {code: 'OK'}, duration: 1000},
    appName: 'avalara-tax',
    appVersion: '0.2.5',
    archiveFilename: 'avalara-tax-v0.2.5.zip',
    archiveKept: true,
  };

  const salesforceManifest = {id: 'my-app', name: 'My App', version: '1.0.0', domain: 'tax', provider: 'salesforce'};
  const thirdPartyManifest = {
    id: 'avalara-tax',
    name: 'Avalara Tax',
    version: '0.2.5',
    domain: 'tax',
    provider: 'thirdParty',
  };
  const noProviderManifest = {id: 'legacy-app', name: 'Legacy App', version: '1.0.0', domain: 'tax'};
  const customManifest = {
    id: 'internal-app',
    name: 'Internal App',
    version: '1.0.0',
    domain: 'tax',
    provider: 'custom',
  };

  /** Default operations stub set: validation passes, readManifestFromTarget resolves to a Salesforce-provider manifest. */
  function defaultOperations(overrides: Record<string, unknown> = {}) {
    return {
      validateCap: sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: salesforceManifest}),
      readManifestFromTarget: sinon.stub().resolves(salesforceManifest),
      commerceAppInstall: sinon.stub().resolves(installResult),
      confirm: sinon.stub().resolves(true),
      ...overrides,
    };
  }

  it('validates before install and passes flags through to the install operation', async () => {
    // The oclif flag default (false) is applied at runtime; the test harness
    // does not apply defaults, so pass the resolved value explicitly here.
    const command: any = await createCommand(
      {'site-id': 'RefArch', 'create-pr': false, force: false},
      {path: './my-cap'},
    );
    const instance = stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const validateStub = sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: salesforceManifest});
    const installStub = sinon.stub().resolves(installResult);
    command.operations = defaultOperations({validateCap: validateStub, commerceAppInstall: installStub});

    const result = await command.run();

    expect(validateStub.calledOnceWithExactly('./my-cap')).to.be.true;
    expect(installStub.calledOnce).to.be.true;
    expect(installStub.firstCall.args[0]).to.equal(instance);
    expect(installStub.firstCall.args[1]).to.equal('./my-cap');
    expect(installStub.firstCall.args[2]).to.deep.include({
      siteId: 'RefArch',
      keepArchive: true,
      shouldCreatePr: false,
    });
    expect(result).to.equal(installResult);
  });

  it('passes shouldCreatePr=true when --create-pr is set', async () => {
    const command: any = await createCommand(
      {'site-id': 'RefArch', 'create-pr': true, force: false},
      {path: './my-cap'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const installStub = sinon.stub().resolves(installResult);
    command.operations = defaultOperations({commerceAppInstall: installStub});

    await command.run();

    expect(installStub.firstCall.args[2]).to.deep.include({shouldCreatePr: true});
  });

  it('maps --clean-archive to keepArchive=false', async () => {
    const command: any = await createCommand(
      {'site-id': 'RefArch', 'clean-archive': true, force: false},
      {path: './my-cap'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const installStub = sinon.stub().resolves(installResult);
    command.operations = defaultOperations({commerceAppInstall: installStub});

    await command.run();

    expect(installStub.firstCall.args[2]).to.deep.include({keepArchive: false});
  });

  it('skips validation when --skip-validate is set, still reading the manifest for the provider check', async () => {
    const command: any = await createCommand(
      {'site-id': 'RefArch', 'skip-validate': true, force: false},
      {path: './my-cap'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
    sinon.stub(command, 'runAfterHooks').resolves(void 0);

    const validateStub = sinon.stub().resolves({valid: true, errors: [], warnings: []});
    const readManifestStub = sinon.stub().resolves(salesforceManifest);
    const installStub = sinon.stub().resolves(installResult);
    command.operations = defaultOperations({
      validateCap: validateStub,
      readManifestFromTarget: readManifestStub,
      commerceAppInstall: installStub,
    });

    await command.run();

    expect(validateStub.called).to.be.false;
    expect(readManifestStub.calledOnceWithExactly('./my-cap')).to.be.true;
    expect(installStub.calledOnce).to.be.true;
  });

  it('errors and does not install when validation fails', async () => {
    const command: any = await createCommand({'site-id': 'RefArch', force: false}, {path: './my-cap'});
    stubCommon(command);

    const installStub = sinon.stub().resolves(installResult);
    command.operations = defaultOperations({
      validateCap: sinon.stub().resolves({valid: false, errors: ['missing commerce-app.json'], warnings: []}),
      commerceAppInstall: installStub,
    });

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    await expectError(() => command.run());

    expect(errorStub.called).to.be.true;
    expect(errorStub.firstCall.args[0]).to.include('validation failed');
    expect(installStub.called).to.be.false;
  });

  it('returns early without installing when a before hook skips', async () => {
    const command: any = await createCommand(
      {'site-id': 'RefArch', 'skip-validate': true, force: false},
      {path: './my-cap'},
    );
    stubCommon(command);

    sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'by plugin'});
    sinon.stub(command, 'runAfterHooks').rejects(new Error('Unexpected after hooks'));

    const readManifestStub = sinon.stub().resolves(salesforceManifest);
    const installStub = sinon.stub().rejects(new Error('Unexpected install'));
    command.operations = defaultOperations({
      readManifestFromTarget: readManifestStub,
      commerceAppInstall: installStub,
    });

    const result: any = await command.run();

    expect(readManifestStub.called).to.be.false;
    expect(installStub.called).to.be.false;
    expect(result.execution.execution_status).to.equal('finished');
  });

  describe('non-Salesforce provider warning', () => {
    it('does not warn or prompt when a before hook skips the install, even for a non-Salesforce manifest', async () => {
      const command: any = await createCommand(
        {'site-id': 'RefArch', 'skip-validate': true, force: false},
        {path: './my-cap'},
      );
      stubCommon(command);
      sinon.stub(command, 'jsonEnabled').returns(false);

      sinon.stub(command, 'runBeforeHooks').resolves({skip: true, skipReason: 'by plugin'});
      sinon.stub(command, 'runAfterHooks').rejects(new Error('Unexpected after hooks'));

      const readManifestStub = sinon.stub().resolves(thirdPartyManifest);
      const confirmStub = sinon.stub().resolves(true);
      const installStub = sinon.stub().rejects(new Error('Unexpected install'));
      command.operations = defaultOperations({
        readManifestFromTarget: readManifestStub,
        confirm: confirmStub,
        commerceAppInstall: installStub,
      });

      const result: any = await command.run();

      expect(readManifestStub.called).to.be.false;
      expect(confirmStub.called).to.be.false;
      expect(command.log.getCalls().some((c: sinon.SinonSpyCall) => String(c.args[0]).includes('Non-SFDC Application')))
        .to.be.false;
      expect(installStub.called).to.be.false;
      expect(result.execution.execution_status).to.equal('finished');
    });

    it('does not warn or prompt when the manifest provider is salesforce', async () => {
      const command: any = await createCommand({'site-id': 'RefArch', force: false}, {path: './my-cap'});
      stubCommon(command);

      sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
      sinon.stub(command, 'runAfterHooks').resolves(void 0);

      const confirmStub = sinon.stub().resolves(true);
      command.operations = defaultOperations({
        validateCap: sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: salesforceManifest}),
        confirm: confirmStub,
      });

      await command.run();

      expect(confirmStub.called).to.be.false;
      expect(command.log.getCalls().some((c: sinon.SinonSpyCall) => String(c.args[0]).includes('Non-SFDC Application')))
        .to.be.false;
    });

    it('warns and prompts when the manifest provider is thirdParty, proceeding on confirmation', async () => {
      const command: any = await createCommand({'site-id': 'RefArch', force: false}, {path: './my-cap'});
      stubCommon(command);
      sinon.stub(command, 'jsonEnabled').returns(false);

      sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
      sinon.stub(command, 'runAfterHooks').resolves(void 0);

      const confirmStub = sinon.stub().resolves(true);
      const installStub = sinon.stub().resolves(installResult);
      command.operations = defaultOperations({
        validateCap: sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: thirdPartyManifest}),
        confirm: confirmStub,
        commerceAppInstall: installStub,
      });

      const result = await command.run();

      expect(command.log.getCalls().some((c: sinon.SinonSpyCall) => String(c.args[0]).includes('Non-SFDC Application')))
        .to.be.true;
      expect(confirmStub.calledOnce).to.be.true;
      expect(installStub.calledOnce).to.be.true;
      expect(result).to.equal(installResult);
    });

    it('warns and prompts when the manifest omits the provider field', async () => {
      const command: any = await createCommand({'site-id': 'RefArch', force: false}, {path: './my-cap'});
      stubCommon(command);
      sinon.stub(command, 'jsonEnabled').returns(false);

      sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
      sinon.stub(command, 'runAfterHooks').resolves(void 0);

      const confirmStub = sinon.stub().resolves(true);
      const installStub = sinon.stub().resolves(installResult);
      command.operations = defaultOperations({
        validateCap: sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: noProviderManifest}),
        confirm: confirmStub,
        commerceAppInstall: installStub,
      });

      const result = await command.run();

      expect(command.log.getCalls().some((c: sinon.SinonSpyCall) => String(c.args[0]).includes('Non-SFDC Application')))
        .to.be.true;
      expect(confirmStub.calledOnce).to.be.true;
      expect(installStub.calledOnce).to.be.true;
      expect(result).to.equal(installResult);
    });

    it('warns and prompts when the manifest provider is custom, proceeding on confirmation', async () => {
      const command: any = await createCommand({'site-id': 'RefArch', force: false}, {path: './my-cap'});
      stubCommon(command);
      sinon.stub(command, 'jsonEnabled').returns(false);

      sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
      sinon.stub(command, 'runAfterHooks').resolves(void 0);

      const confirmStub = sinon.stub().resolves(true);
      const installStub = sinon.stub().resolves(installResult);
      command.operations = defaultOperations({
        validateCap: sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: customManifest}),
        confirm: confirmStub,
        commerceAppInstall: installStub,
      });

      const result = await command.run();

      expect(command.log.getCalls().some((c: sinon.SinonSpyCall) => String(c.args[0]).includes('Non-SFDC Application')))
        .to.be.true;
      expect(confirmStub.calledOnce).to.be.true;
      expect(installStub.calledOnce).to.be.true;
      expect(result).to.equal(installResult);
    });

    it('cancels the install when the user declines the non-Salesforce confirmation', async () => {
      const command: any = await createCommand({'site-id': 'RefArch', force: false}, {path: './my-cap'});
      stubCommon(command);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'exit').throws(new Error('EEXIT: 0'));

      const installStub = sinon.stub().rejects(new Error('Unexpected install'));
      command.operations = defaultOperations({
        validateCap: sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: thirdPartyManifest}),
        confirm: sinon.stub().resolves(false),
        commerceAppInstall: installStub,
      });

      await expectError(() => command.run());

      expect(installStub.called).to.be.false;
    });

    it('skips the confirmation prompt when --force is set', async () => {
      const command: any = await createCommand({'site-id': 'RefArch', force: true}, {path: './my-cap'});
      stubCommon(command);

      sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
      sinon.stub(command, 'runAfterHooks').resolves(void 0);

      const confirmStub = sinon.stub().resolves(true);
      const installStub = sinon.stub().resolves(installResult);
      command.operations = defaultOperations({
        validateCap: sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: thirdPartyManifest}),
        confirm: confirmStub,
        commerceAppInstall: installStub,
      });

      await command.run();

      expect(confirmStub.called).to.be.false;
      expect(installStub.calledOnce).to.be.true;
    });

    it('skips the confirmation prompt in JSON mode', async () => {
      const command: any = await createCommand({'site-id': 'RefArch', force: false, json: true}, {path: './my-cap'});
      stubCommon(command);
      sinon.stub(command, 'jsonEnabled').returns(true);

      sinon.stub(command, 'runBeforeHooks').resolves({skip: false});
      sinon.stub(command, 'runAfterHooks').resolves(void 0);

      const confirmStub = sinon.stub().resolves(true);
      const installStub = sinon.stub().resolves(installResult);
      command.operations = defaultOperations({
        validateCap: sinon.stub().resolves({valid: true, errors: [], warnings: [], manifest: thirdPartyManifest}),
        confirm: confirmStub,
        commerceAppInstall: installStub,
      });

      await command.run();

      expect(confirmStub.called).to.be.false;
      expect(installStub.calledOnce).to.be.true;
    });
  });
});
