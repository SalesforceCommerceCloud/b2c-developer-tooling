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
import SecurityBaselineCommand from '../../../src/commands/security/baseline.js';
import SecurityRules from '../../../src/commands/security/rules.js';
import SecurityScan from '../../../src/commands/security/scan.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('security', () => {
  const hooks = createIsolatedConfigHooks();
  let tmp: string;
  let cwd: string;
  let stdout: sinon.SinonStub;

  beforeEach(async () => {
    await hooks.beforeEach();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-security-cli-'));
    cwd = process.cwd();
    process.chdir(tmp);
    stdout = sinon.stub(ux, 'stdout');
    write('cartridges/app_custom/.project', '<xml/>');
    write(
      'cartridges/app_custom/cartridge/controllers/Account.js',
      [
        "var server = require('server');",
        "server.get('Back', function (req, res, next) { res.redirect(req.querystring.url); next(); });",
        "var digest = new (require('dw/crypto/MessageDigest'))('MD5');",
        'module.exports = server.exports();',
      ].join('\n'),
    );
  });

  afterEach(() => {
    process.chdir(cwd);
    hooks.afterEach();
    fs.rmSync(tmp, {recursive: true, force: true});
    process.exitCode = undefined;
  });

  function write(name: string, contents: string): string {
    const file = path.join(tmp, name);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, contents);
    return file;
  }

  function output(): string {
    return stdout.args.map((args) => String(args[0])).join('\n');
  }

  async function createScan(argv: string[] = [], flags: Record<string, unknown> = {}, json = false) {
    const command: any = await createTestCommand(
      SecurityScan,
      hooks.getConfig(),
      {format: 'table', 'fail-on': 'low', ...flags},
      {},
      argv,
    );
    sinon.stub(command, 'jsonEnabled').returns(json);
    sinon.stub(command, 'warn');
    sinon.stub(command, 'logToStderr');
    return command;
  }

  async function runExpectingError(command: any): Promise<sinon.SinonStub> {
    const errorStub = sinon.stub(command, 'error').throws(new Error('failed'));
    try {
      await command.run();
    } catch {
      // expected
    }
    return errorStub;
  }

  describe('scan', () => {
    it('prints findings grouped by file and fails at the --fail-on threshold', async () => {
      const command = await createScan();
      const errorStub = await runExpectingError(command);

      expect(output()).to.include('cartridges/app_custom/cartridge/controllers/Account.js');
      expect(output()).to.match(/2:\d+\s+medium\s+open-redirect/);
      expect(output()).to.match(/3:\d+\s+medium\s+weak-crypto/);
      expect(output()).to.include('2 open finding(s) (2 medium) in 1 file(s); 0 suppressed, 0 baselined.');
      expect(errorStub.calledWithMatch(/at or above "low"/, {exit: 1})).to.equal(true);
    });

    it('passes when no open finding reaches --fail-on', async () => {
      const command = await createScan([], {'fail-on': 'high'});
      const result = await command.run();
      expect(result.summary).to.include({open: 2, failed: false});
    });

    it('returns the full result in JSON mode and sets the exit code on failure', async () => {
      const command = await createScan([], {}, true);
      const result = await command.run();
      expect(result.findings.map((f: {ruleId: string}) => f.ruleId)).to.deep.equal(['open-redirect', 'weak-crypto']);
      expect(result.summary).to.deep.include({open: 2, failed: true});
      expect(stdout.called).to.equal(false);
      expect(process.exitCode).to.equal(1);
    });

    it('writes SARIF to --output', async () => {
      const command = await createScan([], {format: 'sarif', output: 'report.sarif', 'fail-on': 'none'});
      await command.run();
      const sarif = JSON.parse(fs.readFileSync(path.join(tmp, 'report.sarif'), 'utf8'));
      expect(sarif.version).to.equal('2.1.0');
      expect(sarif.runs[0].results).to.have.length(2);
      expect(process.exitCode).to.equal(undefined);
    });

    it('filters by --rule and --severity and rejects unknown rules', async () => {
      const onlyRedirect = await (await createScan([], {rule: ['open-redirect'], 'fail-on': 'none'})).run();
      expect(onlyRedirect.findings).to.have.length(1);
      const high = await (await createScan([], {severity: 'high', 'fail-on': 'none'})).run();
      expect(high.findings).to.have.length(0);
      const errorStub = await runExpectingError(await createScan([], {rule: ['nope']}));
      expect(errorStub.calledWithMatch(/Unknown security rule/)).to.equal(true);
    });

    it('uses the default baseline file and reports only new findings', async () => {
      const baseline = await createTestCommand(SecurityBaselineCommand, hooks.getConfig(), {
        output: '.b2c-security-baseline.json',
      });
      sinon.stub(baseline as any, 'jsonEnabled').returns(true);
      const written = await (baseline as any).run();
      expect(written.findings).to.equal(2);

      const result = await (await createScan()).run();
      expect(result.summary).to.include({open: 0, baselined: 2, failed: false});
      expect(output()).to.include('Baseline: .b2c-security-baseline.json');
    });

    it('tags reference cartridge findings and leaves them out with --exclude-reference-cartridges', async () => {
      write('cartridges/app_storefront_base/.project', '<xml/>');
      write('cartridges/app_storefront_base/cartridge/scripts/x.js', 'eval(x);');

      const tagged = await (await createScan([], {'fail-on': 'none'})).run();
      expect(tagged.summary.reference).to.equal(1);
      expect(output()).to.include('[reference cartridge]');
      expect(output()).to.include('1 of the open findings are in SFRA or SiteGenesis reference cartridges');

      const excluded = await (await createScan([], {'fail-on': 'none', 'exclude-reference-cartridges': true})).run();
      expect(excluded.summary.reference).to.equal(0);
      expect(excluded.hiddenReferenceFindings).to.equal(1);
    });

    it('errors for a missing --baseline file', async () => {
      const errorStub = await runExpectingError(await createScan([], {baseline: 'missing.json'}));
      expect(errorStub.calledWithMatch(/Baseline file not found/)).to.equal(true);
    });
  });

  describe('rules', () => {
    it('lists rules in JSON mode', async () => {
      const command: any = new SecurityRules([], hooks.getConfig());
      sinon.stub(command, 'parse').resolves({args: {}, flags: {}, argv: []});
      sinon.stub(command, 'jsonEnabled').returns(true);
      const {rules} = await command.run();
      expect(rules.map((r: {id: string}) => r.id)).to.include.members(['open-redirect', 'weak-crypto']);
      expect(rules[0]).to.have.keys([
        'id',
        'analyzer',
        'severity',
        'confidence',
        'category',
        'cwe',
        'description',
        'remediation',
        'docsUrl',
      ]);
    });
  });
});
